// ---------- CONFIG ----------
const BACKEND_URL = "https://nrx-backend.onrender.com"; // change if needed
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const SAVE_INTERVAL_MS = 5000;       // save progress to backend/localStorage every 5s
const SERVER_TIMEOUT_MS = 8000;      // fetch timeout

// ---------- UTIL: fetch with timeout ----------
async function fetchWithTimeout(url, options = {}, timeout = SERVER_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    options.signal = controller.signal;
    try {
        const res = await fetch(url, options);
        clearTimeout(id);
        return res;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

// ---------- COUNTDOWN TIMER ----------
function updateCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 22);

    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const minutes = Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
    const seconds = Math.max(0, Math.floor((distance % (1000 * 60)) / 1000));

    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ---------- STATE ----------
let sessionId = null;
let minedTokens = 0;
let miningSpeed = 20;
let isMining = false;
let miningInterval = null;
let completedTasks = new Set();
let currentAction = null; // 'boost' or 'withdraw'
let pendingWithdrawal = null; // { withdrawalId?, walletAddress, withdrawalAmount }
let lastSave = 0;

// DOM Elements
const modal = document.getElementById('ogads-modal');
const closeBtn = document.querySelector('.close');
const taskCompletedBtn = document.getElementById('task-completed');

const withdrawalModal = document.getElementById('withdrawal-modal');
const withdrawalCloseBtn = document.querySelector('.withdrawal-close');
const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');

// ---------- SESSION MANAGEMENT ----------
async function createSession() {
    try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ua: navigator.userAgent,
                startedAt: new Date().toISOString(),
            })
        });
        if (!res.ok) throw new Error("no session response");
        const data = await res.json();
        sessionId = data.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        console.log("Session created:", sessionId);
        return sessionId;
    } catch (err) {
        console.warn("Create session failed — offline mode:", err.message);
        // fallback to a pseudo session id (keeps local progress separated)
        sessionId = localStorage.getItem(SESSION_STORAGE_KEY) || `local-${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    }
}

async function loadStateFromServer() {
    if (!sessionId) return false;
    try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/session/${sessionId}/state`);
        if (!res.ok) throw new Error("no state");
        const data = await res.json();
        minedTokens = parseFloat(data.minedTokens) || 0;
        miningSpeed = parseFloat(data.miningSpeed) || miningSpeed;
        completedTasks = new Set(data.completedTasks || []);
        updateUI();
        console.log("Loaded state from server");
        return true;
    } catch (err) {
        console.warn("Load state failed:", err.message);
        return false;
    }
}

async function saveStateToServer() {
    if (!sessionId) return false;
    const payload = {
        minedTokens,
        miningSpeed,
        completedTasks: Array.from(completedTasks),
        updatedAt: new Date().toISOString()
    };
    try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/session/${sessionId}/state`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("save failed");
        lastSave = Date.now();
        // keep a local backup too
        localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(payload));
        //console.log("Saved state to server");
        return true;
    } catch (err) {
        console.warn("Save to server failed — saving locally:", err.message);
        // fallback to localStorage
        try {
            localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(payload));
        } catch (e) {
            console.error("Local save failed", e);
        }
        return false;
    }
}

function loadStateFromLocal() {
    try {
        const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        minedTokens = parseFloat(data.minedTokens) || 0;
        miningSpeed = parseFloat(data.miningSpeed) || miningSpeed;
        completedTasks = new Set(data.completedTasks || []);
        updateUI();
        console.log("Loaded state from localStorage");
        return true;
    } catch (err) {
        console.warn("Load local failed", err);
        return false;
    }
}

// ---------- UI UPDATES ----------
function updateUI() {
    const minedEl = document.getElementById('mined-tokens');
    const speedEl = document.getElementById('mining-speed');
    const availEl = document.getElementById('available-tokens');

    if (minedEl) minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    if (speedEl) speedEl.textContent = miningSpeed + " H/s";
    if (availEl) availEl.textContent = minedTokens.toFixed(4);

    // mark completed tasks visually
    document.querySelectorAll('.task').forEach(t => {
        const taskId = t.getAttribute('data-task');
        if (completedTasks.has(taskId)) {
            t.style.background = 'var(--primary)';
            t.style.color = 'white';
            const icon = t.querySelector('i');
            if (icon) icon.style.color = 'white';
        }
    });
}

// ---------- SAVE/LOAD FLOW ----------
async function initState() {
    // get/create session
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) sessionId = stored;
    await createSession();

    // try load from server first, otherwise local
    const ok = await loadStateFromServer();
    if (!ok) loadStateFromLocal();

    // ensure UI shows values
    updateUI();

    // start periodic save
    setInterval(() => {
        // only save if changed a bit or enough time passed
        saveStateToServer();
    }, SAVE_INTERVAL_MS);
}

// ---------- MODAL HANDLERS ----------
function openOGADSModal(action) {
    currentAction = action;
    modal.style.display = 'block';
    // Ensure iframe src is correct (keeps original OGADS link)
    const iframe = document.getElementById('ogads-frame');
    if (iframe && iframe.src.indexOf('applocked.org') === -1) {
        iframe.src = "https://applocked.org/cl/i/j76pvj";
    }
}

closeBtn.onclick = function () {
    modal.style.display = 'none';
    if (currentAction === 'withdraw') pendingWithdrawal = null;
};

withdrawalCloseBtn.onclick = function () {
    withdrawalModal.style.display = 'none';
};

window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = 'none';
        if (currentAction === 'withdraw') pendingWithdrawal = null;
    }
    if (event.target === withdrawalModal) {
        withdrawalModal.style.display = 'none';
    }
};

// ---------- TASK COMPLETED (OGADS) ----------
taskCompletedBtn.onclick = async function () {
    modal.style.display = 'none';

    if (currentAction === 'boost') {
        // Prefer to ask backend for a boost amount
        let boostAmount = 10 + Math.floor(Math.random() * 15); // fallback
        try {
            const res = await fetchWithTimeout(`${BACKEND_URL}/api/boosts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, requestedAt: new Date().toISOString() })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.boostAmount) boostAmount = parseInt(data.boostAmount, 10);
            }
        } catch (err) {
            console.warn("Backend boost request failed, using fallback boost");
        }

        miningSpeed = (typeof miningSpeed === "number" ? miningSpeed : 20) + boostAmount;
        document.getElementById('mining-speed').textContent = miningSpeed + " H/s";
        saveStateToServer();
        alert(`Task completed! Your mining speed increased by ${boostAmount} H/s.`);

    } else if (currentAction === 'withdraw' && pendingWithdrawal) {
        // Finalize withdrawal through backend if available
        try {
            if (pendingWithdrawal.withdrawalId) {
                // if we already created withdrawal record earlier, confirm it
                const res = await fetchWithTimeout(`${BACKEND_URL}/api/withdrawals/${pendingWithdrawal.withdrawalId}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId, completedAt: new Date().toISOString() })
                });
                if (res.ok) {
                    alert(`Withdrawal of ${pendingWithdrawal.withdrawalAmount} NRX to ${pendingWithdrawal.walletAddress} successful!`);
                    minedTokens = Math.max(0, minedTokens - parseFloat(pendingWithdrawal.withdrawalAmount));
                    document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";
                    pendingWithdrawal = null;
                    saveStateToServer();
                } else {
                    alert("Withdrawal confirmation failed on server. If your OGADS was real, try again or contact support.");
                }
            } else {
                // If no withdrawalId (server not reachable earlier), try to create-and-complete now
                const resCreate = await fetchWithTimeout(`${BACKEND_URL}/api/withdrawals`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        walletAddress: pendingWithdrawal.walletAddress,
                        amount: pendingWithdrawal.withdrawalAmount,
                        createdAt: new Date().toISOString(),
                    })
                });
                if (resCreate.ok) {
                    const created = await resCreate.json();
                    const withdrawalId = created.withdrawalId;
                    const resComplete = await fetchWithTimeout(`${BACKEND_URL}/api/withdrawals/${withdrawalId}/complete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId, completedAt: new Date().toISOString() })
                    });
                    if (resComplete.ok) {
                        alert(`Withdrawal of ${pendingWithdrawal.withdrawalAmount} NRX to ${pendingWithdrawal.walletAddress} successful!`);
                        minedTokens = Math.max(0, minedTokens - parseFloat(pendingWithdrawal.withdrawalAmount));
                        document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";
                        pendingWithdrawal = null;
                        saveStateToServer();
                    } else {
                        alert("Withdrawal could not be finalized. Please contact support.");
                    }
                } else {
                    // backend not reachable: perform local "fake" withdrawal (still reduces local balance)
                    alert(`Withdrawal of ${pendingWithdrawal.withdrawalAmount} NRX processed locally (server unreachable).`);
                    minedTokens = Math.max(0, minedTokens - parseFloat(pendingWithdrawal.withdrawalAmount));
                    document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";
                    pendingWithdrawal = null;
                    saveStateToServer();
                }
            }
        } catch (err) {
            console.warn("Withdrawal complete error:", err);
            // fallback local withdraw
            alert(`Withdrawal of ${pendingWithdrawal.withdrawalAmount} NRX processed locally (server unreachable).`);
            minedTokens = Math.max(0, minedTokens - parseFloat(pendingWithdrawal.withdrawalAmount));
            document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";
            pendingWithdrawal = null;
            saveStateToServer();
        }
    }

    currentAction = null;
};

// ---------- CONFIRM WITHDRAWAL BUTTON BEFORE OGADS (opens OGADS) ----------
confirmWithdrawalBtn.onclick = async function () {
    const walletAddress = document.getElementById('wallet-address').value.trim();
    const network = document.getElementById('network').value;
    const withdrawalAmount = document.getElementById('withdrawal-amount').value;

    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        alert('Please enter a valid BNB Smart Chain wallet address (starts with 0x and 42 chars).');
        return;
    }
    if (parseFloat(withdrawalAmount) > minedTokens) {
        alert('Withdrawal amount cannot exceed your mined tokens.');
        return;
    }
    if (parseFloat(withdrawalAmount) < 0.001) {
        alert('Minimum withdrawal amount is 0.001 NRX.');
        return;
    }

    // attempt to register withdrawal with backend (create pending)
    try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/api/withdrawals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId,
                walletAddress,
                network,
                amount: withdrawalAmount,
                createdAt: new Date().toISOString()
            })
        });
        if (res.ok) {
            const data = await res.json();
            pendingWithdrawal = {
                withdrawalId: data.withdrawalId,
                walletAddress,
                withdrawalAmount
            };
            // close withdrawal modal and open ogads
            withdrawalModal.style.display = 'none';
            currentAction = 'withdraw';
            openOGADSModal('withdraw');
            return;
        } else {
            console.warn("Server refused create withdrawal, fallback to local pending.");
        }
    } catch (err) {
        console.warn("Create withdrawal failed (server unreachable).", err.message);
    }

    // fallback: local pendingWithdrawal
    pendingWithdrawal = { walletAddress, withdrawalAmount };
    withdrawalModal.style.display = 'none';
    currentAction = 'withdraw';
    openOGADSModal('withdraw');
};

// ---------- START / STOP MINING ----------
document.getElementById('start-mining-btn').addEventListener('click', function () {
    const btn = this;
    if (!isMining) {
        isMining = true;
        btn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-warning');

        miningInterval = setInterval(() => {
            if (minedTokens < 20) {
                // slowed down increment
                minedTokens += (miningSpeed / 50000);
                // clamp
                if (minedTokens > 20) minedTokens = 20;
                document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";

                // save periodically
                const now = Date.now();
                if (now - lastSave > SAVE_INTERVAL_MS) {
                    saveStateToServer();
                    lastSave = now;
                }
            } else {
                clearInterval(miningInterval);
                isMining = false;
                btn.innerHTML = '<i class="fas fa-play"></i> Daily Limit Reached';
                btn.disabled = true;
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-primary');
                saveStateToServer();
            }
        }, 100);
    } else {
        isMining = false;
        clearInterval(miningInterval);
        btn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-primary');
        saveStateToServer();
    }
});

// ---------- BOOST UI (shows boost tasks) ----------
document.getElementById('mine-now-btn').addEventListener('click', function () {
    document.getElementById('boost-mining-section').style.display = 'block';
    this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
    this.classList.remove('btn-warning');
    this.classList.add('btn-primary');
    this.disabled = true;
});

// ---------- OPEN WITHDRAWAL MODAL ----------
document.getElementById('withdraw-btn').addEventListener('click', function () {
    if (minedTokens >= 0.001) {
        withdrawalModal.style.display = 'block';
        document.getElementById('wallet-address').value = '';
        document.getElementById('network').value = 'bsc';
        document.getElementById('withdrawal-amount').value = minedTokens.toFixed(4);
        document.getElementById('available-tokens').textContent = minedTokens.toFixed(4);
    } else {
        alert('Minimum withdrawal amount is 0.001 NRX');
    }
});

// ---------- TASK CLICK EVENTS (boosts) ----------
document.querySelectorAll('.task').forEach(task => {
    task.addEventListener('click', function () {
        const taskId = this.getAttribute('data-task');
        if (!completedTasks.has(taskId)) {
            // mark visually and locally (will still require OGADS to get boost)
            completedTasks.add(taskId);
            this.style.background = 'var(--primary)';
            this.style.color = 'white';
            const icon = this.querySelector('i');
            if (icon) icon.style.color = 'white';
            saveStateToServer();

            // open ogads to validate task (on completion, backend or fallback will apply the boost)
            openOGADSModal('boost');
        } else {
            alert('You have already completed this task!');
        }
    });
});

// ---------- COPY CONTRACT ADDRESS ----------
document.getElementById('copy-address').addEventListener('click', function () {
    const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
    navigator.clipboard.writeText(address).then(() => {
        const original = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => this.innerHTML = original, 2000);
    }).catch(err => console.warn("Clipboard error:", err));
});

// ---------- INIT ----------
(async function bootstrap() {
    await initState();

    // quick autosave on page unload
    window.addEventListener('beforeunload', () => {
        try { localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({
            minedTokens, miningSpeed, completedTasks: Array.from(completedTasks)
        })); } catch(e) {}
    });

    console.log("NRX frontend ready. Session:", sessionId);
})();
