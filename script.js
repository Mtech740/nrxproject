// Countdown Timer
function updateCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 22);

    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ----------------------------
// Persistent Mining System
// ----------------------------

// --- Default state ---
const STATE_KEY = 'nrx_state_v1';
let state = {
    minedTokens: 0,
    miningSpeed: 20,        // H/s
    isMining: false,
    lastUpdate: Date.now(), // ms
    completedTasks: {},     // { taskId: timestamp }
    pendingWithdrawal: null // { walletAddress, withdrawalAmount }
};

// Try load saved state
try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge parsed with defaults to be safe
        state = Object.assign(state, parsed);
    }
} catch (e) {
    console.warn('Failed to load saved state:', e);
}

// Utilities
function saveState() {
    state.lastUpdate = Date.now();
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

// Compute tokens earned while away (based on current miningSpeed)
// per ms rate: miningSpeed / 5_000_000  (matches original interval math)
function applyOfflineEarnings() {
    if (!state.isMining) return;
    const now = Date.now();
    const deltaMs = now - (state.lastUpdate || now);
    if (deltaMs <= 0) return;

    const perMs = (state.miningSpeed || 20) / 5000000;
    const gained = deltaMs * perMs;
    state.minedTokens = Math.min(20, state.minedTokens + gained);
    state.lastUpdate = now;
}

// Restore values into DOM
function syncToDOM() {
    const speedEl = document.getElementById('mining-speed');
    const minedEl = document.getElementById('mined-tokens');
    const dailyLimitEl = document.getElementById('daily-limit');

    if (speedEl) speedEl.textContent = (Math.round(state.miningSpeed) || 20) + ' H/s';
    if (minedEl) minedEl.textContent = (state.minedTokens || 0).toFixed(4) + ' NRX';
    if (dailyLimitEl) dailyLimitEl.textContent = '20 NRX';

    // Update available tokens in withdrawal form if open
    const avail = document.getElementById('available-tokens');
    if (avail) avail.textContent = (state.minedTokens || 0).toFixed(4);
}

applyOfflineEarnings();
syncToDOM();

// Autosave every 5 seconds
setInterval(saveState, 5000);
window.addEventListener('beforeunload', saveState);

// ----------------------------
// Element references (defensive)
const modal = document.getElementById('ogads-modal');
const closeBtn = document.querySelector('.close');
const taskCompletedBtn = document.getElementById('task-completed');

const withdrawalModal = document.getElementById('withdrawal-modal');
const withdrawalCloseBtn = document.querySelector('.withdrawal-close');
const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');

const startBtn = document.getElementById('start-mining-btn');
const mineNowBtn = document.getElementById('mine-now-btn');
const withdrawBtn = document.getElementById('withdraw-btn');

// OGAds iframe
const ogadsIframe = document.getElementById('ogads-frame');

// ----------------------------
// Anti-cheat + OGAds verification
let currentAction = null;        // 'boost' or 'withdraw'
let ogadsOpenedAt = 0;
let ogadsRequiredViewSeconds = 0;
let ogadsIframeFocused = false;

// random integer between min and max inclusive
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// When opening OGADS modal: set verification requirements
function openOGADSModal(action) {
    currentAction = action;
    if (!modal) return;
    modal.style.display = 'block';

    // set random required viewing time (20-30s)
    ogadsRequiredViewSeconds = randInt(20, 30);
    ogadsOpenedAt = Date.now();
    ogadsIframeFocused = false;

    // Ensure iframe is reloaded to fresh state (some browsers won't reload on same src)
    try {
        if (ogadsIframe) {
            const src = ogadsIframe.getAttribute('src') || ogadsIframe.src;
            ogadsIframe.src = src + (src.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
        }
    } catch (e) { /* ignore */ }
}

// Detect user focusing/clicking the iframe (best-effort)
if (ogadsIframe) {
    ogadsIframe.addEventListener('load', () => {
        // Try to focus the iframe (may or may not work across browsers)
        try { ogadsIframe.contentWindow.focus(); } catch (e) { /* ignore */ }
    });

    // If user clicks the iframe element it will get focus in many browsers
    ogadsIframe.addEventListener('mouseenter', () => { /* visual only */ });
    ogadsIframe.addEventListener('mousedown', () => {
        ogadsIframeFocused = true;
    });
    ogadsIframe.addEventListener('focus', () => {
        ogadsIframeFocused = true;
    });
}

// The "I've Completed the Task" button: enforce checks
if (taskCompletedBtn) {
    taskCompletedBtn.addEventListener('click', function () {
        if (!currentAction) {
            alert('No task in progress.');
            return;
        }

        const now = Date.now();
        const viewedSeconds = Math.floor((now - ogadsOpenedAt) / 1000);

        // require focus + required time
        if (!ogadsIframeFocused) {
            alert('Please interact with the task frame (click inside it) and spend some time there, then press Done.');
            return;
        }
        if (viewedSeconds < ogadsRequiredViewSeconds) {
            alert(`Please stay in the task window for at least ${ogadsRequiredViewSeconds} seconds to validate completion. (${viewedSeconds}s so far)`);
            return;
        }

        // All good — apply action
        modal.style.display = 'none';

        if (currentAction === 'boost') {
            // Apply mining boost but with limits
            const boostAmount = 10 + Math.floor(Math.random() * 15); // 10-24
            const safeCurrent = Math.max(1, Math.min(10000, Math.round(state.miningSpeed || 20)));
            let newSpeed = safeCurrent + boostAmount;
            // cap speed to reasonable limit (example 1000 H/s)
            newSpeed = Math.min(newSpeed, 1000);
            state.miningSpeed = newSpeed;
            document.getElementById('mining-speed').textContent = newSpeed + ' H/s';
            alert(`Task completed! Your mining speed increased by ${boostAmount} H/s.`);
            // mark as completed? boost action may be done via task entries — handled elsewhere
        } else if (currentAction === 'withdraw' && state.pendingWithdrawal) {
            const { walletAddress, withdrawalAmount } = state.pendingWithdrawal;
            if (parseFloat(withdrawalAmount) <= state.minedTokens) {
                // process withdrawal locally (mock)
                alert(`Withdrawal of ${withdrawalAmount} NRX to ${walletAddress} successful!`);
                state.minedTokens = Math.max(0, state.minedTokens - parseFloat(withdrawalAmount));
                document.getElementById('mined-tokens').textContent = state.minedTokens.toFixed(4) + ' NRX';
                state.pendingWithdrawal = null;
            } else {
                alert('Withdrawal failed: insufficient balance.');
                state.pendingWithdrawal = null;
            }
        }

        // clear currentAction and save
        currentAction = null;
        saveState();
    });
}

// Close OGADS modal via close button
if (closeBtn) {
    closeBtn.onclick = function () {
        if (modal) modal.style.display = 'none';
        currentAction = null;
        // if closing while withdrawal pending, clear it (user cancelled)
        if (state.pendingWithdrawal && currentAction === 'withdraw') {
            state.pendingWithdrawal = null;
        }
    };
}

// ----------------------------
// Withdrawal flow (modal)
function openWithdrawalModal() {
    if ((state.minedTokens || 0) >= 0.001) {
        if (withdrawalModal) withdrawalModal.style.display = 'block';
        const addrEl = document.getElementById('wallet-address');
        const networkEl = document.getElementById('network');
        const withdrawalAmountEl = document.getElementById('withdrawal-amount');
        const availableEl = document.getElementById('available-tokens');

        if (addrEl) addrEl.value = '';
        if (networkEl) networkEl.value = 'bsc';
        if (withdrawalAmountEl) withdrawalAmountEl.value = (state.minedTokens || 0).toFixed(4);
        if (availableEl) availableEl.textContent = (state.minedTokens || 0).toFixed(4);
    } else {
        alert('Minimum withdrawal amount is 0.001 NRX');
    }
}

if (withdrawalCloseBtn) {
    withdrawalCloseBtn.onclick = function () {
        if (withdrawalModal) withdrawalModal.style.display = 'none';
    };
}

if (confirmWithdrawalBtn) {
    confirmWithdrawalBtn.onclick = function () {
        const walletAddress = document.getElementById('wallet-address').value;
        const withdrawalAmount = document.getElementById('withdrawal-amount').value;

        if (!walletAddress) {
            alert('Please enter your wallet address');
            return;
        }
        if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
            alert('Please enter a valid BNB Smart Chain wallet address (starts with 0x and 42 characters long)');
            return;
        }
        if (parseFloat(withdrawalAmount) > state.minedTokens) {
            alert('Withdrawal amount cannot exceed your mined tokens');
            return;
        }
        if (parseFloat(withdrawalAmount) < 0.001) {
            alert('Minimum withdrawal amount is 0.001 NRX');
            return;
        }

        // store pending withdrawal and open OGADS verification
        state.pendingWithdrawal = {
            walletAddress: walletAddress,
            withdrawalAmount: parseFloat(withdrawalAmount).toFixed(4)
        };
        saveState();

        if (withdrawalModal) withdrawalModal.style.display = 'none';
        currentAction = 'withdraw';
        openOGADSModal('withdraw');
    };
}

// ----------------------------
// Start / stop mining, with persistence and safe accrual

// Helper to start mining interval
let miningInterval = null;
function startMiningInterval() {
    if (miningInterval) return;
    // update lastUpdate to now so offline accrual calculates from now
    state.lastUpdate = Date.now();
    saveState();

    miningInterval = setInterval(() => {
        // per tick (100ms) increment
        if (state.minedTokens >= 20) {
            // reach daily limit
            stopMiningInterval();
            state.isMining = false;
            if (startBtn) {
                startBtn.innerHTML = '<i class="fas fa-play"></i> Daily Limit Reached';
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-primary');
                startBtn.disabled = true;
            }
            saveState();
            return;
        }

        // compute tokens gained this 100ms using same formula
        const gained = (state.miningSpeed || 20) / 50000;
        state.minedTokens = Math.min(20, state.minedTokens + gained);
        state.lastUpdate = Date.now();
        const minedEl = document.getElementById('mined-tokens');
        if (minedEl) minedEl.textContent = state.minedTokens.toFixed(4) + ' NRX';
    }, 100);
}

function stopMiningInterval() {
    if (miningInterval) {
        clearInterval(miningInterval);
        miningInterval = null;
    }
}

// Hook start button
if (startBtn) {
    startBtn.addEventListener('click', function () {
        // toggle mining
        if (!state.isMining) {
            state.isMining = true;
            // UI changes
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-warning');

            // start interval and save
            startMiningInterval();
            saveState();
        } else {
            // stop
            state.isMining = false;
            stopMiningInterval();
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
            startBtn.classList.remove('btn-warning');
            startBtn.classList.add('btn-primary');
            saveState();
        }
    });
}

// On load, if state.isMining resume interval
if (state.isMining) {
    // apply any offline earnings first (done earlier)
    startMiningInterval();
}

// Mine Now (show boost tasks)
if (mineNowBtn) {
    mineNowBtn.addEventListener('click', function () {
        const boostSection = document.getElementById('boost-mining-section');
        if (boostSection) boostSection.style.display = 'block';
        mineNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
        mineNowBtn.classList.remove('btn-warning');
        mineNowBtn.classList.add('btn-primary');
        mineNowBtn.disabled = true;
    });
}

// Withdraw button -> open withdrawal modal
if (withdrawBtn) {
    withdrawBtn.addEventListener('click', function () {
        openWithdrawalModal();
    });
}

// ----------------------------
// Tasks list: prevent repeated completes and persist completed tasks
const tasks = document.querySelectorAll('.task');
if (tasks && tasks.length) {
    tasks.forEach(task => {
        task.addEventListener('click', function () {
            const taskId = this.getAttribute('data-task');
            if (!taskId) return;

            // If task already completed and timestamp exists, block
            const completed = state.completedTasks && state.completedTasks[taskId];
            if (completed) {
                alert('You have already completed this task!');
                return;
            }

            // Open OGADS modal for boost, mark that this task is being attempted
            currentAction = 'boost';
            // We won't mark the task complete until OGADS verification passes.
            // But visually show selection immediately
            if (this) {
                this.style.background = 'var(--primary)';
                this.style.color = 'white';
                const i = this.querySelector('i');
                if (i) i.style.color = 'white';
            }

            openOGADSModal('boost');

            // After OGADS successful completion (in taskCompletedBtn handler),
            // we need to mark the task completed. To do that, listen once:
            // (we attach a temporary listener that checks when currentAction becomes null)
            const tmpListener = function () {
                // If OGADS succeeded and boost was applied, and task not already marked:
                if (!currentAction && !state.completedTasks[taskId]) {
                    // store timestamp as completed
                    state.completedTasks[taskId] = Date.now();
                    saveState();
                    // remove the temporary interval
                    window.removeEventListener('focus', tmpListener); // harmless
                }
            };
            // Attach a safe event to poll — use focus as a cheap trigger to check soon after closing
            window.addEventListener('focus', tmpListener);
            // Also set a 1s timeout check in case focus didn't fire
            setTimeout(() => { tmpListener(); }, 1200);
        });
    });
}

// ----------------------------
// Copy contract address
const copyBtn = document.getElementById('copy-address');
if (copyBtn) {
    copyBtn.addEventListener('click', function () {
        const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
        navigator.clipboard.writeText(address).then(function () {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        }).catch((e) => {
            alert('Failed to copy address — please copy manually.');
        });
    });
}

// ----------------------------
// Defensive periodic sync: keep DOM in sync with state (also prevents tampering)
setInterval(() => {
    // small sanity clamp
    state.minedTokens = Math.max(0, Math.min(1000000, state.minedTokens || 0));
    state.miningSpeed = Math.max(1, Math.min(10000, Math.round(state.miningSpeed || 20)));

    // If DOM mining-speed differs by > 2, sync DOM to state (prevents hacks)
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) {
        const domSpeed = parseInt((speedEl.textContent || '').replace(/\D/g, '')) || 0;
        if (Math.abs(domSpeed - state.miningSpeed) > 2) {
            speedEl.textContent = state.miningSpeed + ' H/s';
        }
    }

    const minedEl = document.getElementById('mined-tokens');
    if (minedEl) minedEl.textContent = (state.minedTokens || 0).toFixed(4) + ' NRX';

    // Persist occasionally
    saveState();
}, 3000);

// ----------------------------
// Small UX: close modals on overlay click (already existing but ensure no crash)
window.addEventListener('click', function (evt) {
    if (evt.target === modal) {
        modal.style.display = 'none';
        currentAction = null;
    }
    if (evt.target === withdrawalModal) {
        withdrawalModal.style.display = 'none';
    }
});
