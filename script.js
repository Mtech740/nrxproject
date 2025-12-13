// ---------- CONFIG ----------
const BACKEND_URL = "https://nrx-backend-2.onrender.com"; // ✅ CORRECT BACKEND URL
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

// ---------- STATE ----------
let sessionId = null;
let minedTokens = 0;
let miningSpeed = BASE_MINING_SPEED;
let isMining = false;
let miningInterval = null;
let completedTasks = [];
let pendingWithdrawal = null;
let currentAction = null;
let pendingBoostId = null;
let dailyResetChecked = false;

// ---------- BACKEND API FUNCTIONS ----------
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// ---------- SESSION ----------
async function initializeSession() {
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
        try {
            const state = await apiRequest(`/api/session/${savedSessionId}/state`);
            sessionId = savedSessionId;
            minedTokens = state.minedTokens || 0;
            miningSpeed = state.miningSpeed || BASE_MINING_SPEED;
            completedTasks = state.completedTasks || [];
            return sessionId;
        } catch {}
    }

    try {
        const response = await apiRequest('/api/session', 'POST', {
            ua: navigator.userAgent,
            startedAt: new Date().toISOString()
        });
        sessionId = response.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    } catch {
        sessionId = `local-${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    }
}

async function saveState() {
    if (!sessionId) return;
    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', {
            minedTokens,
            miningSpeed,
            completedTasks,
            updatedAt: new Date().toISOString()
        });
    } catch {
        saveLocalProgress();
    }
}

function saveLocalProgress() {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({
        minedTokens, miningSpeed, completedTasks, sessionId
    }));
}

function loadLocalProgress() {
    const saved = localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!saved) return false;
    try {
        const p = JSON.parse(saved);
        minedTokens = p.minedTokens || 0;
        miningSpeed = p.miningSpeed || BASE_MINING_SPEED;
        completedTasks = p.completedTasks || [];
        return true;
    } catch {
        return false;
    }
}

// ---------- MINING ----------
function startMining() {
    if (isMining || minedTokens >= DAILY_LIMIT) return;
    isMining = true;

    miningInterval = setInterval(() => {
        minedTokens += miningSpeed / 50000;
        if (minedTokens >= DAILY_LIMIT) {
            minedTokens = DAILY_LIMIT;
            stopMining();
        }
        updateUI();
    }, 100);
}

function stopMining() {
    isMining = false;
    clearInterval(miningInterval);
    saveState();
}

// ---------- BOOST ----------
async function requestBoost() {
    try {
        const res = await apiRequest('/api/boosts', 'POST', { sessionId });
        pendingBoostId = res.boostId;
        return res;
    } catch {
        miningSpeed += 10;
        updateUI();
        saveState();
        return null;
    }
}

async function verifyBoost() {
    if (!pendingBoostId) return false;
    try {
        const res = await apiRequest(`/api/boosts/${pendingBoostId}/verify`, 'POST', { sessionId });
        miningSpeed = res.newSpeed;
        completedTasks.push(`boost-${Date.now()}`);
        pendingBoostId = null;
        updateUI();
        saveState();
        return res;
    } catch {
        return false;
    }
}

// ---------- WITHDRAW ----------
async function createWithdrawal(walletAddress, amount) {
    const res = await apiRequest('/api/withdrawals', 'POST', {
        sessionId, walletAddress, amount, network: 'bsc'
    });
    pendingWithdrawal = res;
    minedTokens -= amount;
    updateUI();
}

async function completeWithdrawal() {
    if (!pendingWithdrawal) return false;
    await apiRequest(`/api/withdrawals/${pendingWithdrawal.id}/complete`, 'POST', { sessionId });
    pendingWithdrawal = null;
    saveState();
}

// ---------- UI ----------
function updateUI() {
    const mined = document.getElementById('mined-tokens');
    if (mined) mined.textContent = minedTokens.toFixed(4) + ' NRX';

    const speed = document.getElementById('mining-speed');
    if (speed) speed.textContent = miningSpeed + ' H/s';

    const avail = document.getElementById('available-tokens');
    if (avail) avail.textContent = minedTokens.toFixed(4);
}

// ---------- INIT ----------
async function initializeApp() {
    await initializeSession();
    loadLocalProgress();
    updateUI();

    document.getElementById('start-mining-btn')?.addEventListener('click', () => {
        isMining ? stopMining() : startMining();
    });

    document.getElementById('task-completed')?.addEventListener('click', async () => {
        if (currentAction === 'boost') await verifyBoost();
        if (currentAction === 'withdraw') await completeWithdrawal();
        document.getElementById('ogads-modal').style.display = 'none';
        currentAction = null;
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);

/* =====================================================
   SOFT OGADS UNLOCK LAYER (ADD-ON ONLY)
   DOES NOT MODIFY ORIGINAL LOGIC
===================================================== */

(function () {
    let unlocked = localStorage.getItem('nrx_unlocked') === '1';

    function showLock() {
        document.getElementById('ogads-modal')?.classList.add('force-show');
        currentAction = 'unlock';
    }

    function unlock() {
        unlocked = true;
        localStorage.setItem('nrx_unlocked', '1');
        document.getElementById('ogads-modal')?.classList.remove('force-show');
        alert('✅ Mining unlocked. Continue earning NRX.');
    }

    const originalStartMining = startMining;
    startMining = function () {
        if (!unlocked) return showLock();
        originalStartMining();
    };

    const originalRequestBoost = requestBoost;
    requestBoost = async function () {
        if (!unlocked) return showLock();
        return originalRequestBoost();
    };

    document.getElementById('task-completed')?.addEventListener('click', () => {
        if (currentAction === 'unlock') unlock();
    });
})();
