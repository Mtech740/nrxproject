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
let pendingWithdrawal = null;
let pendingBoostId = null;
let pendingBoostTaskMap = {};
let miningStartTime = null;
let totalMiningSeconds = 0;
let lastSaveTime = 0;

// ---------- UTILS ----------
async function apiRequest(endpoint, method = 'GET', data = null, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const opts = { method, headers: { 'Content-Type': 'application/json' }, signal: controller.signal };
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

// ---------- UI ----------
function updateUI() {
    const minedEl = document.getElementById('mined-tokens');
    const speedEl = document.getElementById('mining-speed');
    const availEl = document.getElementById('available-tokens');
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');

    if (minedEl) minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    if (speedEl) speedEl.textContent = miningSpeed + " H/s";
    if (availEl) availEl.textContent = minedTokens.toFixed(4);
    if (withdrawalAmountEl) withdrawalAmountEl.value = minedTokens.toFixed(4);

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
            const title = taskEl.querySelector('h4');
            const para = taskEl.querySelector('p');
            if (title) title.textContent = 'Completed';
            if (para) para.textContent = 'Already boosted';
        }
    });

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

// ---------- SESSION ----------
async function createSessionOrRestore() {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
        sessionId = saved;
        try {
            const state = await apiRequest(`/api/session/${sessionId}/state`, 'GET');
            minedTokens = parseFloat(state.minedTokens || 0);
            miningSpeed = parseFloat(state.miningSpeed || BASE_MINING_SPEED);
            completedTasks = Array.isArray(state.completedTasks) ? state.completedTasks.slice() : [];
            return sessionId;
        } catch(err) {
            console.warn("Restore session failed, creating new:", err.message);
        }
    }

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
        console.warn("Create session failed; using local fallback:", err.message);
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
        dailyMined: minedTokens
    };

    saveLocalBackup();
    if (!sessionId || sessionId.startsWith('local-')) return;

    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', payload);
        lastSaveTime = Date.now();
    } catch(err) {
        console.warn("Save to server failed", err.message);
    }
}

// ---------- MINING ----------
function startMining() {
    if (isMining) return;
    if (minedTokens >= DAILY_LIMIT) {
        alert("Daily limit reached!");
        return;
    }
    isMining = true;
    miningStartTime = Date.now();
    updateUI();

    miningInterval = setInterval(() => {
        if (minedTokens < DAILY_LIMIT) {
            const tokensPerSecond = miningSpeed / 50000;
            minedTokens += tokensPerSecond;
            if (minedTokens > DAILY_LIMIT) minedTokens = DAILY_LIMIT;
            updateUI();

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

// ---------- BOOST ----------
async function requestBoost(taskId) {
    try {
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
        console.warn("requestBoost failed, using local boost:", err.message);
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
            miningSpeed = parseFloat(res.newSpeed || (miningSpeed + (res.boostAmount||0)));

            const relatedTask = pendingBoostTaskMap[pendingBoostId];
            if (relatedTask) {
                const key = `task-${relatedTask}`;
                if (!completedTasks.includes(key)) completedTasks.push(key);
                delete pendingBoostTaskMap[pendingBoostId];
            }

            pendingBoostId = null;
            saveState();
            updateUI();
            return res;
        }
        return false;
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

// ---------- INIT ----------
async function initializeApp() {
    await createSessionOrRestore();
    loadLocalBackup();
    updateUI();
    setInterval(saveState, SAVE_INTERVAL_MS);

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

    document.querySelectorAll('.task').forEach(taskEl => {
        taskEl.addEventListener('click', async function() {
            const taskId = this.getAttribute('data-task');
            if (!taskId) return;
            const checkKey = `task-${taskId}`;
            if (completedTasks.includes(checkKey)) {
                alert("You've already completed this task.");
                return;
            }

            try {
                const resp = await requestBoost(taskId);
                if (!resp) {
                    alert("Failed to request boost.");
                    return;
                }

                pendingBoostId = resp.boostId || pendingBoostId;

                const og = document.getElementById('ogads-modal');
                if (og) og.style.display = 'block';

                this.style.background = 'var(--accent)';
                this.style.color = 'white';
                const ico = this.querySelector('i');
                if (ico) ico.style.color = 'white';
            } catch (err) {
                alert("Could not start boost flow.");
            }
        });
    });

    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            const walletEl = document.getElementById('wallet-address');
            const amountEl = document.getElementById('withdrawal-amount');
            if (!walletEl || !amountEl) return alert("Form error");

            const wallet = walletEl.value.trim();
            const amount = parseFloat(amountEl.value);

            if (!wallet || !wallet.startsWith('0x') || wallet.length !== 42) {
                return alert('Invalid BSC wallet address.');
            }
            if (isNaN(amount) || amount < 0.001) {
                return alert('Minimum withdrawal is 0.001 NRX');
            }
            if (amount > minedTokens) {
                return alert('Insufficient balance.');
            }

            try {
                const created = await createWithdrawal(wallet, amount);

                const wmodal = document.getElementById('withdrawal-modal');
                const og = document.getElementById('ogads-modal');
                if (wmodal) wmodal.style.display = 'none';
                if (og) og.style.display = 'block';

            } catch(err) {
                alert("Failed to create withdrawal: " + (err.message || err));
            }
        });
    }

    const taskCompleteBtn = document.getElementById('task-completed');
    if (taskCompleteBtn) {
        taskCompleteBtn.addEventListener('click', async function() {
            const btn = this;
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            btn.disabled = true;

            try {
                const og = document.getElementById('ogads-modal');

                if (pendingBoostId) {
                    const verified = await verifyBoost();
                    verified && verified.success
                        ? alert(`Boost verified! Speed increased.`)
                        : alert("Boost verification failed.");
                } 
                else if (pendingWithdrawal && pendingWithdrawal.id) {
                    const ok = await completeWithdrawalOnServer(pendingWithdrawal.id);
                    ok && ok.success
                        ? alert(`Withdrawal completed: ${pendingWithdrawal.amount} NRX`)
                        : alert("Withdrawal verification failed.");
                }
                else {
                    alert("Nothing to verify.");
                }

            } catch (err) {
                alert("Verification failed.");
            } finally {
                const og = document.getElementById('ogads-modal');
                if (og) og.style.display = 'none';
                btn.innerHTML = original;
                btn.disabled = false;
            }
        });
    }

    document.querySelectorAll('.close, .withdrawal-close').forEach(el => {
        el.addEventListener('click', function() {
            const og = document.getElementById('ogads-modal');
            const w = document.getElementById('withdrawal-modal');
            if (og) og.style.display = 'none';
            if (w) w.style.display = 'none';
            pendingBoostId = null;
            pendingWithdrawal = null;
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

document.addEventListener("DOMContentLoaded", initializeApp);
