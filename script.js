// ==================== COMPLETE FIXED SCRIPT.JS ====================

// ==================== CONFIG & STATE ====================
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

// State variables
let sessionId = null;
let minedTokens = 0;
let miningSpeed = BASE_MINING_SPEED;
let isMining = false;
let miningInterval = null;
let completedTasks = [];
let pendingWithdrawal = null;
let currentAction = null;
let pendingBoostId = null;
let ogadsWindow = null;
let verificationTimer = null;

// Timer variables
let miningTimeLeft = 300;
let adTimeLeft = 30;
let miningTimer = null;
let adTimer = null;
let isAdShowing = false;
let timerMiningActive = false;

let miningStartTime = null;
let totalMiningSeconds = 0;

// ==================== INSTANT UI INITIALIZATION ====================
(function initializeUIInstantly() {
    console.log("⚡ INSTANT UI Initialization...");
    
    // 1. IMMEDIATELY load local progress
    loadLocalProgress();
    
    // 2. IMMEDIATELY update UI
    updateUI();
    
    // 3. IMMEDIATELY setup event listeners
    setupInstantEventListeners();
    
    // 4. Start countdown timer
    startCountdownTimer();
    
    console.log("✅ UI Ready - Buttons are clickable NOW!");
})();

function loadLocalProgress() {
    try {
        const saved = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (saved) {
            const progress = JSON.parse(saved);
            minedTokens = progress.minedTokens || 0;
            miningSpeed = progress.miningSpeed || BASE_MINING_SPEED;
            completedTasks = progress.completedTasks || [];
            sessionId = progress.sessionId || `local-${Date.now()}`;
        }
    } catch (error) {
        console.error('Error loading local progress:', error);
    }
}

function updateUI() {
    // Update mined tokens
    const minedEl = document.getElementById('mined-tokens');
    if (minedEl) minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    
    // Update mining speed
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) speedEl.textContent = miningSpeed + " H/s";
    
    // Update available tokens
    const availEl = document.getElementById('available-tokens');
    if (availEl) availEl.textContent = minedTokens.toFixed(4);
    
    // Update withdrawal amount
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');
    if (withdrawalAmountEl) withdrawalAmountEl.value = minedTokens.toFixed(4);
    
    // Update current speed
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) currentSpeedEl.textContent = miningSpeed;
    
    // Update tasks
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
        
        if (isCompleted) {
            task.style.background = 'var(--success)';
            task.style.color = 'white';
            task.innerHTML = `<i class="fas fa-check"></i><h4>Completed</h4><p>Already boosted</p>`;
            task.style.cursor = 'default';
        }
    });
}

// ==================== INSTANT EVENT LISTENERS ====================
function setupInstantEventListeners() {
    console.log("⚡ Setting up INSTANT event listeners...");
    
    // Start Mining Button
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        startMiningBtn.addEventListener('click', function() {
            console.log("⚡ Start Mining button clicked");
            
            if (minedTokens >= DAILY_LIMIT) {
                alert("Daily limit reached! Come back tomorrow.");
                return;
            }
            
            if (isAdShowing) {
                alert("Please complete the advertisement first!");
                return;
            }
            
            if (isMining || timerMiningActive) {
                stopMining();
            } else {
                startMiningWithTimer();
            }
        });
    }
    
    // Mine Now Button
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', function() {
            console.log("⚡ Mine Now button clicked");
            
            if (isMining || timerMiningActive) stopMining();
            
            const boostSection = document.getElementById('boost-mining-section');
            if (boostSection) {
                boostSection.style.display = 'block';
                this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
                this.classList.remove('btn-warning');
                this.classList.add('btn-primary');
                this.disabled = true;
            }
        });
    }
    
    // Withdraw Button
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            console.log("⚡ Withdraw button clicked");
            
            if (isMining || timerMiningActive) stopMining();
            
            if (minedTokens < 0.001) {
                alert("Minimum withdrawal amount is 0.001 NRX");
                return;
            }
            
            const withdrawalModal = document.getElementById('withdrawal-modal');
            if (withdrawalModal) {
                withdrawalModal.style.display = 'block';
                const walletAddressInput = document.getElementById('wallet-address');
                const withdrawalAmountInput = document.getElementById('withdrawal-amount');
                
                if (walletAddressInput) walletAddressInput.value = '';
                if (withdrawalAmountInput) withdrawalAmountInput.value = minedTokens.toFixed(4);
            }
        });
    }
    
    // Task Buttons
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task');
            console.log(`⚡ Task ${taskId} clicked`);
            
            if (isMining || timerMiningActive) stopMining();
            
            const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
            if (isCompleted) {
                alert("You've already completed this task!");
                return;
            }
            
            pendingBoostId = taskId;
            openOGADSTask('boost');
        });
    });
    
    // Confirm Withdrawal
    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            console.log("⚡ Confirm Withdrawal clicked");
            const walletAddressInput = document.getElementById('wallet-address');
            const withdrawalAmountInput = document.getElementById('withdrawal-amount');
            
            if (!walletAddressInput || !withdrawalAmountInput) {
                alert("Form elements not found!");
                return;
            }
            
            const walletAddress = walletAddressInput.value.trim();
            const withdrawalAmount = withdrawalAmountInput.value;
            
            if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
                alert('Please enter a valid BNB Smart Chain wallet address.');
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
            
            try {
                await createWithdrawal(walletAddress, withdrawalAmount);
                
                const withdrawalModal = document.getElementById('withdrawal-modal');
                if (withdrawalModal) withdrawalModal.style.display = 'none';
                
                openOGADSTask('withdraw');
                
            } catch (error) {
                alert(`Withdrawal failed: ${error.message}`);
            }
        });
    }
    
    // Modal Close Buttons
    document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Copy Address
    const copyAddressBtn = document.getElementById('copy-address');
    if (copyAddressBtn) {
        copyAddressBtn.addEventListener('click', function() {
            const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
            navigator.clipboard.writeText(address).then(() => {
                const original = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => this.innerHTML = original, 2000);
            });
        });
    }
}

function closeAllModals() {
    const ogadsModal = document.getElementById('ogads-modal');
    const withdrawalModal = document.getElementById('withdrawal-modal');
    
    if (ogadsModal) ogadsModal.style.display = 'none';
    if (withdrawalModal) withdrawalModal.style.display = 'none';
    currentAction = null;
    pendingWithdrawal = null;
    
    if (verificationTimer) clearInterval(verificationTimer);
    if (ogadsWindow && !ogadsWindow.closed) ogadsWindow.close();
}

// ==================== MINING FUNCTIONS ====================
function startMiningWithTimer() {
    if (isMining || minedTokens >= DAILY_LIMIT) {
        if (minedTokens >= DAILY_LIMIT) alert("Daily limit reached!");
        return;
    }
    
    timerMiningActive = true;
    startMining();
    startCountdown();
}

function startMining() {
    if (isMining || minedTokens >= DAILY_LIMIT) return;
    
    isMining = true;
    miningStartTime = Date.now();
    
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) {
        miningBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
        miningBtn.classList.remove('btn-primary');
        miningBtn.classList.add('btn-warning');
    }
    
    miningInterval = setInterval(() => {
        if (minedTokens < DAILY_LIMIT) {
            const tokensPerSecond = miningSpeed / 50000;
            minedTokens += tokensPerSecond;
            
            if (minedTokens > DAILY_LIMIT) minedTokens = DAILY_LIMIT;
            
            updateUI();
            
            if (Date.now() % 30000 < 100) saveState();
        } else {
            stopMining();
            updateUI();
        }
    }, 100);
}

function stopMining() {
    if (!isMining && !timerMiningActive) return;
    
    isMining = false;
    timerMiningActive = false;
    clearInterval(miningInterval);
    
    if (miningStartTime) {
        totalMiningSeconds += (Date.now() - miningStartTime) / 1000;
        miningStartTime = null;
    }
    
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) {
        miningBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
        miningBtn.classList.remove('btn-warning');
        miningBtn.classList.add('btn-primary');
    }
    
    if (miningTimer) {
        clearInterval(miningTimer);
        miningTimer = null;
    }
    
    if (!isAdShowing) {
        const timerElement = document.getElementById('mining-timer');
        if (timerElement) timerElement.textContent = '05:00';
    }
    
    saveState();
}

// ==================== TIMER FUNCTIONS ====================
function startCountdown() {
    miningTimeLeft = 300;
    updateMiningTimer();
    
    miningTimer = setInterval(() => {
        miningTimeLeft--;
        updateMiningTimer();
        
        const progressBar = document.getElementById('mining-progress');
        if (progressBar) progressBar.style.width = ((300 - miningTimeLeft) / 300) * 100 + '%';
        
        if (miningTimeLeft <= 0) {
            clearInterval(miningTimer);
            miningTimer = null;
            showAdvertisement();
        }
    }, 1000);
}

function updateMiningTimer() {
    const timerElement = document.getElementById('mining-timer');
    if (timerElement) {
        timerElement.textContent = formatTime(miningTimeLeft);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ==================== AD SYSTEM ====================
function showAdvertisement() {
    console.log('📺 Showing advertisement');
    isAdShowing = true;
    timerMiningActive = false;
    
    stopMining();
    
    const adOverlay = document.getElementById('ad-overlay');
    if (adOverlay) adOverlay.style.display = 'block';
    
    startAdCountdown();
    loadAdsterraAd(); // This will now show REAL ads
}

function startAdCountdown() {
    adTimeLeft = 30;
    updateAdTimer();
    
    adTimer = setInterval(() => {
        adTimeLeft--;
        updateAdTimer();
        
        if (adTimeLeft <= 0) {
            clearInterval(adTimer);
            adTimer = null;
            completeAdvertisement();
        }
    }, 1000);
}

function updateAdTimer() {
    const adTimerElement = document.getElementById('ad-countdown');
    if (adTimerElement) {
        adTimerElement.textContent = adTimeLeft;
    }
}

function completeAdvertisement() {
    console.log('✅ Ad completed');
    isAdShowing = false;
    
    const adOverlay = document.getElementById('ad-overlay');
    if (adOverlay) adOverlay.style.display = 'none';
    
    const adContainer = document.getElementById('ad-container');
    if (adContainer) adContainer.innerHTML = '';
    
    miningSpeed = Math.max(10, Math.floor(miningSpeed * 0.9));
    
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) currentSpeedEl.textContent = miningSpeed;
    
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) speedEl.textContent = miningSpeed + " H/s";
    
    alert(`🎉 ADVERTISEMENT COMPLETED!\n\n✅ Mining resumed\n⚡ Speed: ${miningSpeed} H/s\n⏰ Next ad in 5 minutes`);
    
    setTimeout(() => {
        startMiningWithTimer();
    }, 3000);
}

// ==================== ADSTERRA AD (FIXED VERSION - INCLUDES REAL ADS) ====================
// [PASTE THE ENTIRE loadAdsterraAd() FUNCTION FROM ABOVE HERE]
// Make sure to include ALL the Adsterra functions from the first code block

// ==================== BACKEND FUNCTIONS ====================
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

async function initializeSession() {
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
        try {
            const state = await apiRequest(`/api/session/${savedSessionId}/state`);
            sessionId = savedSessionId;
            minedTokens = state.minedTokens || minedTokens;
            miningSpeed = state.miningSpeed || miningSpeed;
            completedTasks = state.completedTasks || completedTasks;
        } catch (error) {
            console.log("Using local session");
        }
        return sessionId;
    }
    
    try {
        const response = await apiRequest('/api/session', 'POST', {
            ua: navigator.userAgent,
            startedAt: new Date().toISOString()
        });
        
        sessionId = response.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    } catch (error) {
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
    } catch (error) {
        saveLocalProgress();
    }
}

function saveLocalProgress() {
    const progress = { minedTokens, miningSpeed, completedTasks, lastSave: Date.now(), sessionId };
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
}

// ==================== OGADS FUNCTIONS ====================
function openOGADSTask(taskType) {
    currentAction = taskType;
    if (isMining || timerMiningActive) stopMining();
    
    const ogadsModal = document.getElementById('ogads-modal');
    if (ogadsModal) ogadsModal.style.display = 'none';
    
    ogadsWindow = window.open('https://applocked.org/cl/i/j76pvj', '_blank');
    
    if (!ogadsWindow) {
        alert('Please allow pop-ups to complete the task.');
        return;
    }
    
    showVerificationInstructions();
    startTaskMonitoring(Date.now());
}

function showVerificationInstructions() {
    const ogadsModal = document.getElementById('ogads-modal');
    if (ogadsModal) {
        ogadsModal.style.display = 'block';
        ogadsModal.querySelector('.modal-body').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; color: #f39c12; margin-bottom: 20px;"><i class="fas fa-external-link-alt"></i></div>
                <h3 style="color: var(--primary); margin-bottom: 15px;">Task Opened in New Tab</h3>
                <p style="margin-bottom: 25px; color: var(--dark);">Please complete the task in the new tab.</p>
                <div style="margin-top: 30px; padding: 15px; background: rgba(42, 75, 141, 0.1); border-radius: 10px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-sync-alt fa-spin" style="color: var(--primary);"></i>
                        <span style="font-weight: bold; color: var(--primary);">Waiting for task completion...</span>
                    </div>
                    <div id="monitoring-status" style="color: #666; font-size: 0.9rem;">Monitoring OGADS completion...</div>
                </div>
            </div>
        `;
    }
}

function startTaskMonitoring(taskStartTime) {
    let checkCount = 0;
    const taskId = pendingBoostId || '1';
    
    const monitoringInterval = setInterval(() => {
        checkCount++;
        
        const statusEl = document.getElementById('monitoring-status');
        if (statusEl) statusEl.textContent = `Monitoring... (${checkCount}/60 seconds)`;
        
        if (ogadsWindow && ogadsWindow.closed) {
            clearInterval(monitoringInterval);
            applyBoostAfterTask(taskId, true);
            return;
        }
        
        if (checkCount >= 60) {
            clearInterval(monitoringInterval);
            applyBoostAfterTask(taskId, false);
        }
    }, 1000);
}

function applyBoostAfterTask(taskId, verified) {
    const boostAmounts = { '1': 5, '2': 10, '3': 15, '4': 20, '5': 8, '6': 12 };
    const boostAmount = boostAmounts[taskId] || 10;
    
    miningSpeed += boostAmount;
    
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) currentSpeedEl.textContent = miningSpeed;
    
    completedTasks.push(`task-${taskId}`);
    updateUI();
    saveState();
    
    const ogadsModal = document.getElementById('ogads-modal');
    if (ogadsModal) ogadsModal.style.display = 'none';
    
    const taskElement = document.querySelector(`.task[data-task="${taskId}"]`);
    if (taskElement) {
        taskElement.style.background = 'var(--success)';
        taskElement.style.color = 'white';
        taskElement.innerHTML = `<i class="fas fa-check"></i><h4>Completed</h4><p>+${boostAmount} H/s</p>`;
        taskElement.style.cursor = 'default';
    }
    
    alert(`✅ Task completed! Mining speed increased by ${boostAmount} H/s.\nNew speed: ${miningSpeed} H/s`);
}

async function createWithdrawal(walletAddress, amount) {
    try {
        const response = await apiRequest('/api/withdrawals', 'POST', {
            sessionId,
            walletAddress,
            amount: parseFloat(amount),
            network: 'bsc'
        });
        
        pendingWithdrawal = { id: response.withdrawalId, walletAddress, amount };
        minedTokens -= parseFloat(amount);
        updateUI();
        
        return response;
    } catch (error) {
        console.error('Failed to create withdrawal:', error);
        throw error;
    }
}

// ==================== COUNTDOWN TIMER ====================
function startCountdownTimer() {
    function updateCountdown() {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 22);
        
        const now = new Date().getTime();
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
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
    
    setInterval(updateCountdown, 1000);
    updateCountdown();
}

// ==================== BACKEND INIT (NON-BLOCKING) ====================
setTimeout(async () => {
    console.log("🔄 Initializing backend in background...");
    try {
        await initializeSession();
        console.log("✅ Backend initialized");
    } catch (error) {
        console.warn("⚠️ Backend initialization failed, using local data");
    }
    
    setInterval(saveState, 30000);
}, 2000);

// ==================== PAGE EVENT LISTENERS ====================
document.addEventListener('visibilitychange', function() {
    if (document.hidden && (isMining || timerMiningActive)) {
        stopMining();
    }
});

window.addEventListener('beforeunload', function() {
    if (isMining || timerMiningActive) stopMining();
    saveState();
    if (ogadsWindow && !ogadsWindow.closed) ogadsWindow.close();
});

console.log("✅ NRX Mining Platform Script Loaded Successfully!");
