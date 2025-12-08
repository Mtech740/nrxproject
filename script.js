// ---------- CONFIG ----------
const BACKEND_URL = (window.NRX_CONFIG && window.NRX_CONFIG.BACKEND_URL) ? window.NRX_CONFIG.BACKEND_URL : "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = (window.NRX_CONFIG && window.NRX_CONFIG.SESSION_KEY) ? window.NRX_CONFIG.SESSION_KEY : "nrx_session_id";
const LOCAL_PROGRESS_KEY = (window.NRX_CONFIG && window.NRX_CONFIG.LOCAL_PROGRESS_KEY) ? window.NRX_CONFIG.LOCAL_PROGRESS_KEY : "nrxMiningData";
const SAVE_INTERVAL_MS = 15000; // regularly persist state
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

// ---------- STATE ----------
let sessionId = null;
let minedTokens = 0;
let miningSpeed = BASE_MINING_SPEED;
let isMining = false;
let miningInterval = null;
let completedTasks = []; // stores strings like "task-1"
let pendingWithdrawal = null; // { id, walletAddress, amount }
let pendingBoostId = null;    // boost id returned by server for current OGADS flow
let pendingBoostTaskMap = {}; // map boostId => taskId
let miningStartTime = null;
let totalMiningSeconds = 0;
let lastSaveTime = 0;

// ---------- UTILS ----------
async function apiRequest(endpoint, method = 'GET', data = null, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
    };
    if (data && (method === 'POST' || method === 'PUT')) opts.body = JSON.stringify(data);

    try {
        const res = await fetch(BACKEND_URL + endpoint, opts);
        clearTimeout(id);
        if (!res.ok) {
            const text = await res.text().catch(()=>null);
            throw new Error(`API ${endpoint} ${res.status} ${text || ''}`);
        }
        return await res.json();
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

function saveLocalBackup() {
    try {
        const payload = {
            minedTokens,
            miningSpeed,
            completedTasks,
            lastSave: Date.now(),
            sessionId,
            totalMiningSeconds
        };
        localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(payload));
    } catch(e) {
        console.warn("Local backup failed", e);
    }
}

function loadLocalBackup() {
    try {
        const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        minedTokens = parseFloat(data.minedTokens) || 0;
        miningSpeed = parseFloat(data.miningSpeed) || BASE_MINING_SPEED;
        completedTasks = Array.isArray(data.completedTasks) ? data.completedTasks : [];
        totalMiningSeconds = parseInt(data.totalMiningSeconds || 0, 10);
        return true;
    } catch(e) {
        console.warn("Load local backup failed", e);
        return false;
    }
}

function getTotalMiningTime() {
    let total = totalMiningSeconds;
    if (miningStartTime) total += (Date.now() - miningStartTime) / 1000;
    return Math.floor(total);
}

// ---------- UI helpers ----------
function updateUI() {
    const minedEl = document.getElementById('mined-tokens');
    const speedEl = document.getElementById('mining-speed');
    const availEl = document.getElementById('available-tokens');
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');

    if (minedEl) minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    if (speedEl) speedEl.textContent = miningSpeed + " H/s";
    if (availEl) availEl.textContent = minedTokens.toFixed(4);
    if (withdrawalAmountEl) withdrawalAmountEl.value = minedTokens.toFixed(4);

    // mark tasks completed
    document.querySelectorAll('.task').forEach(taskEl => {
        const id = taskEl.getAttribute('data-task');
        if (!id) return;
        const checkKey = `task-${id}`;
        if (completedTasks.includes(checkKey)) {
            taskEl.style.background = 'var(--success)';
            taskEl.style.color = 'white';
            const ico = taskEl.querySelector('i');
            if (ico) ico.style.color = 'white';
            taskEl.style.cursor = 'default';
            // keep label consistent (avoid wiping important DOM structure)
            const title = taskEl.querySelector('h4');
            const para = taskEl.querySelector('p');
            if (title) title.textContent = 'Completed';
            if (para) para.textContent = 'Already boosted';
        }
    });

    // Daily limit UI
    const startBtn = document.getElementById('start-mining-btn');
    if (startBtn) {
        if (minedTokens >= DAILY_LIMIT) {
            startBtn.innerHTML = '<i class="fas fa-check"></i> Daily Limit Reached';
            startBtn.disabled = true;
            startBtn.classList.remove('btn-warning');
            startBtn.classList.add('btn-primary');
        } else {
            if (!isMining) {
                startBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-primary');
                startBtn.disabled = false;
            } else {
                startBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
                startBtn.classList.add('btn-warning');
                startBtn.classList.remove('btn-primary');
            }
        }
    }
}

// ---------- SESSION & STATE ----------
async function createSessionOrRestore() {
    // try restore session id from localStorage
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
        sessionId = saved;
        // try to fetch state
        try {
            const state = await apiRequest(`/api/session/${sessionId}/state`, 'GET');
            minedTokens = parseFloat(state.minedTokens || 0);
            miningSpeed = parseFloat(state.miningSpeed || BASE_MINING_SPEED);
            completedTasks = Array.isArray(state.completedTasks) ? state.completedTasks.slice() : [];
            return sessionId;
        } catch(err) {
            console.warn("Restore session failed, creating a new one:", err.message);
            // fallthrough to create new
        }
    }

    // create new session
    try {
        const res = await apiRequest('/api/session', 'POST', {
            ua: navigator.userAgent,
            startedAt: new Date().toISOString()
        });
        if (res && res.sessionId) {
            sessionId = res.sessionId;
            localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
            minedTokens = parseFloat(res.minedTokens || 0);
            miningSpeed = parseFloat(res.miningSpeed || BASE_MINING_SPEED);
            completedTasks = [];
            return sessionId;
        }
    } catch(err) {
        console.warn("Create session failed (server unreachable). Using local session fallback.", err.message);
        sessionId = localStorage.getItem(SESSION_STORAGE_KEY) || `local-${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        loadLocalBackup();
        return sessionId;
    }
}

async function saveState() {
    const payload = {
        minedTokens,
        miningSpeed,
        completedTasks,
        totalMiningTime: getTotalMiningTime(),
        dailyMined: minedTokens // server uses dailyMined optionally
    };

    // always keep a local backup
    saveLocalBackup();

    if (!sessionId || sessionId.startsWith('local-')) return;

    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', payload);
        lastSaveTime = Date.now();
    } catch(err) {
        console.warn("Save to server failed, kept local backup", err.message);
    }
}

// ---------- MINING ----------
function startMining() {
    if (isMining) return;
    if (minedTokens >= DAILY_LIMIT) {
        alert("Daily limit reached! Come back tomorrow.");
        return;
    }
    isMining = true;
    miningStartTime = Date.now();

    // UI switch
    updateUI();

    miningInterval = setInterval(() => {
        if (minedTokens < DAILY_LIMIT) {
            const tokensPerSecond = miningSpeed / 50000;
            minedTokens += tokensPerSecond;
            if (minedTokens > DAILY_LIMIT) minedTokens = DAILY_LIMIT;
            updateUI();

            // throttle saves to SAVE_INTERVAL_MS
            const now = Date.now();
            if (now - lastSaveTime > SAVE_INTERVAL_MS) {
                saveState();
                lastSaveTime = now;
            }
        } else {
            stopMining();
        }
    }, 100);
}

function stopMining() {
    if (!isMining) return;
    isMining = false;
    clearInterval(miningInterval);
    miningInterval = null;

    if (miningStartTime) {
        totalMiningSeconds += (Date.now() - miningStartTime) / 1000;
        miningStartTime = null;
    }

    saveState();
    updateUI();
}

// ---------- BOOST (OGADS) ----------
async function requestBoost(taskId) {
    try {
        // include the task id/type for server tracking
        const res = await apiRequest('/api/boosts', 'POST', {
            sessionId,
            requestedAt: new Date().toISOString(),
            taskType: `task-${taskId}`
        });
        if (res && res.boostId) {
            pendingBoostId = res.boostId;
            pendingBoostTaskMap[pendingBoostId] = taskId;
            return res;
        }
        return null;
    } catch(err) {
        console.warn("requestBoost failed; applying fallback local boost:", err.message);
        // fallback: local boost only
        const boostAmount = 10 + Math.floor(Math.random() * 15);
        miningSpeed += boostAmount;
        saveState();
        return { boostAmount, message: 'local' };
    }
}

async function verifyBoost() {
    if (!pendingBoostId) return false;
    try {
        const res = await apiRequest(`/api/boosts/${pendingBoostId}/verify`, 'POST', { sessionId });
        if (res && res.success) {
            // backend returned newSpeed usually
            miningSpeed = parseFloat(res.newSpeed || (miningSpeed + (res.boostAmount||0)));
            // mark local completed task (map boostId -> taskId)
            const relatedTask = pendingBoostTaskMap[pendingBoostId];
            if (relatedTask) {
                const key = `task-${relatedTask}`;
                if (!completedTasks.includes(key)) completedTasks.push(key);
                // cleanup
                delete pendingBoostTaskMap[pendingBoostId];
            }
            pendingBoostId = null;
            saveState();
            updateUI();
            return res;
        } else {
            console.warn("verifyBoost returned no success");
            return false;
        }
    } catch(err) {
        console.warn("verifyBoost failed:", err.message);
        return false;
    }
}

// ---------- WITHDRAWALS ----------
async function createWithdrawal(walletAddress, amount) {
    try {
        const res = await apiRequest('/api/withdrawals', 'POST', {
            sessionId,
            walletAddress,
            amount: parseFloat(amount),
            network: 'bsc'
        });
        if (res && res.withdrawalId) {
            pendingWithdrawal = {
                id: res.withdrawalId,
                walletAddress,
                amount: parseFloat(amount)
            };
            // invoice effect local: server already deducted, but keep local state synced
            minedTokens = parseFloat(res.newBalance || (minedTokens - amount));
            saveState();
            updateUI();
            return res;
        }
        throw new Error('Create withdrawal failed');
    } catch(err) {
        console.warn("createWithdrawal failed:", err.message);
        throw err;
    }
}

async function completeWithdrawalOnServer(withdrawalId) {
    try {
        const res = await apiRequest(`/api/withdrawals/${withdrawalId}/complete`, 'POST', { sessionId });
        if (res && res.success) {
            pendingWithdrawal = null;
            saveState();
            updateUI();
            return res;
        }
        return false;
    } catch(err) {
        console.warn("completeWithdrawal failed:", err.message);
        return false;
    }
}

// ---------- EVENT HANDLERS & INIT ----------
async function initializeApp() {
    // create/restore session
    await createSessionOrRestore();
    // try to load local backup if server restore failed earlier
    loadLocalBackup();
    updateUI();

    // set up periodic save
    setInterval(saveState, SAVE_INTERVAL_MS);

    // Start/Stop mining
    const startBtn = document.getElementById('start-mining-btn');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            if (minedTokens >= DAILY_LIMIT) {
                alert("Daily limit reached!");
                return;
            }
            if (isMining) stopMining();
            else startMining();
        });
    }

    // Mine Now (show boosts)
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', function() {
            const bs = document.getElementById('boost-mining-section');
            if (bs) bs.style.display = 'block';
            this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
            this.classList.remove('btn-warning');
            this.classList.add('btn-primary');
            this.disabled = true;
        });
    }

    // Withdraw
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            if (minedTokens < 0.001) {
                alert("Minimum withdrawal amount is 0.001 NRX");
                return;
            }
            const wmodal = document.getElementById('withdrawal-modal');
            if (wmodal) {
                document.getElementById('wallet-address').value = '';
                document.getElementById('network').value = 'bsc';
                document.getElementById('withdrawal-amount').value = minedTokens.toFixed(4);
                document.getElementById('available-tokens').textContent = minedTokens.toFixed(4);
                wmodal.style.display = 'block';
            }
        });
    }

    // Tasks (boost click)
    document.querySelectorAll('.task').forEach(taskEl => {
        taskEl.addEventListener('click', async function() {
            const taskId = this.getAttribute('data-task');
            if (!taskId) return;
            const checkKey = `task-${taskId}`;
            if (completedTasks.includes(checkKey)) {
                alert("You've already completed this task.");
                return;
            }

            // Request boost mapping with server
            try {
                const resp = await requestBoost(taskId);
                if (!resp) {
                    alert("Failed to request boost. Try again.");
                    return;
                }
                // show OGADS modal and store pendingBoostId (set by requestBoost)
                pendingBoostId = resp.boostId || pendingBoostId;
                // open OGADS modal
                const og = document.getElementById('ogads-modal');
                if (og) og.style.display = 'block';

                // Visual feedback (use existing CSS vars)
                this.style.background = 'var(--accent)';
                this.style.color = 'white';
                const ico = this.querySelector('i');
                if (ico) ico.style.color = 'white';
            } catch (err) {
                alert("Could not start boost flow. Try again later.");
            }
        });
    });

    // Confirm withdrawal -> create withdrawal then open OGADS
    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            const walletEl = document.getElementById('wallet-address');
            const amountEl = document.getElementById('withdrawal-amount');
            if (!walletEl || !amountEl) return alert("Form error");

            const wallet = walletEl.value.trim();
            const amount = parseFloat(amountEl.value);

            if (!wallet || !wallet.startsWith('0x') || wallet.length !== 42) {
                return alert('Please enter a valid BSC wallet address (0x...42 chars).');
            }
            if (isNaN(amount) || amount < 0.001) {
                return alert('Minimum withdrawal is 0.001 NRX');
            }
            if (amount > minedTokens) {
                return alert('Insufficient balance.');
            }

            try {
                // create withdrawal on server
                const created = await createWithdrawal(wallet, amount);
                // close withdrawal modal and open OGADS modal to verify
                const wmodal = document.getElementById('withdrawal-modal');
                const og = document.getElementById('ogads-modal');
                if (wmodal) wmodal.style.display = 'none';
                if (og) {
                    currentAction = 'withdraw';
                    og.style.display = 'block';
                }
            } catch(err) {
                alert("Failed to create withdrawal: " + (err.message || err));
            }
        });
    }

    // OGADS "I've Completed the Task" button: verify either boost or withdrawal
    const taskCompleteBtn = document.getElementById('task-completed');
    if (taskCompleteBtn) {
        taskCompleteBtn.addEventListener('click', async function() {
            const btn = this;
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            btn.disabled = true;

            // handle boost verification
            try {
                // determine which action is expected by checking pendingBoostId/pendingWithdrawal
                const og = document.getElementById('ogads-modal');
                if (pendingBoostId) {
                    const verified = await verifyBoost();
                    if (verified && verified.success) {
                        alert(`✅ Boost verified! Mining speed increased by ${verified.boostAmount || 'a value'} H/s.`);
                    } else {
                        alert("⚠️ Boost verification failed. If OGADS completed, try again or contact support.");
                    }
                } else if (pendingWithdrawal && pendingWithdrawal.id) {
                    const ok = await completeWithdrawalOnServer(pendingWithdrawal.id);
                    if (ok && ok.success) {
                        alert(`✅ Withdrawal verified and completed: ${pendingWithdrawal.amount} NRX to ${pendingWithdrawal.walletAddress}`);
                    } else {
                        // If server couldn't complete, we already deducted balance earlier; inform user and keep admin notified.
                        alert("⚠️ Withdrawal verification failed on server. If you completed the task, contact support with your withdrawal reference.");
                    }
                } else {
                    // it's possible pendingBoostId is null (server unreachable when creating boost). Try to verify against any residual pending Boosts.
                    if (pendingBoostId) {
                        await verifyBoost();
                    } else {
                        alert("Nothing to verify. If you completed the OGADS task, try again.");
                    }
                }
            } catch (err) {
                console.warn("OGADS verify flow error:", err);
                alert("Verification failed. Please try again.");
            } finally {
                // close OGADS modal and reset UI
                const og = document.getElementById('ogads-modal');
                if (og) og.style.display = 'none';
                btn.innerHTML = original;
                btn.disabled = false;
                currentAction = null;
            }
        });
    }

    // Modal close buttons
    document.querySelectorAll('.close, .withdrawal-close').forEach(el => {
        el.addEventListener('click', function() {
            const og = document.getElementById('ogads-modal');
            const w = document.getElementById('withdrawal-modal');
            if (og) og.style.display = 'none';
            if (w) w.style.display = 'none';
            // revert pending states if user cancels
            pendingBoostId = null;
            pendingWithdrawal = null;
            currentAction = null;
        });
    });

    // Clicking outside closes modals
    window.addEventListener('click', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('modal')) {
            const og = document.getElementById('ogads-modal');
            const w = document.getElementById('withdrawal-modal');
            if (og) og.style.display = 'none';
            if (w) w.style.display = 'none';
            pendingBoostId = null;
            pendingWithdrawal = null;
            currentAction = null;
        }
    });

    // Copy contract address
    const copyBtn = document.getElementById('copy-address');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
            navigator.clipboard.writeText(address).then(() => {
                const orig = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => this.innerHTML = orig, 1500);
            }).catch(err => {
                console.warn("Clipboard error", err);
                alert("Failed to copy — please copy manually.");
            });
        });
    }

    // Pause mining when tab hidden (safer)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isMining) stopMining();
    });

    // Autosave on unload
    window.addEventListener('beforeunload', function() {
        if (isMining) stopMining();
        saveLocalBackup();
    });

    // Start countdown timer if not already started (index.html has one too)
    if (!window.__nrx_countdown_started) {
        window.__nrx_countdown_started = true;
        setInterval(() => {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 22);
            const now = Date.now();
            const distance = targetDate - now;
            const days = Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24)));
            const hours = Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
            const minutes = Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
            const seconds = Math.max(0, Math.floor((distance % (1000 * 60)) / 1000));
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            const secondsEl = document.getElementById('seconds');
            if (daysEl) daysEl.textContent = days;
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2,'0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2,'0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2,'0');
        }, 1000);
    }

    console.log("NRX frontend initialized", { BACKEND_URL, sessionId, minedTokens, miningSpeed });
}

// ---------- BOOTSTRAP ----------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
