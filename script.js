// ==================== COMPLETE FIXED SCRIPT.JS ====================
// NRX Mining Platform - With OGAds Direct Link Integration
// OGAds Publisher ID: 429397
// OGAds Locker Direct Link: https://redirectapps.org/cl/i/j76pvj

// ==================== CONFIG & STATE ====================
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

// OGAds Direct Link - CONFIRMED BY OGADS SUPPORT
const OGADS_DIRECT_LINK = 'https://redirectapps.org/cl/i/j76pvj';

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
    
    // Update task completion visuals
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
            
            if (ogadsWindow && !ogadsWindow.closed) {
                alert("Please complete the current task first!");
                return;
            }
            
            if (isMining || timerMiningActive) {
                stopMining();
            } else {
                startMiningWithTimer(); // 5-minute timer with OGAds
            }
        });
    }
    
    // Mine Now Button - BOOST FUNCTION
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', function() {
            console.log("⚡ Boost Mining button clicked");
            
            if (ogadsWindow && !ogadsWindow.closed) {
                alert("Please complete the current task first!");
                return;
            }
            
            if (!isMining && !timerMiningActive) {
                alert("Please start mining first before boosting!");
                return;
            }
            
            // Open OGAds for Boost
            openOGAdsLocker('boost');
        });
    }
    
    // Withdraw Button - NO ADS
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
            openOGAdsLocker('task');
        });
    });
    
    // Confirm Withdrawal - NO ADS
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
                
                alert('✅ Withdrawal initiated successfully! Check your wallet.');
                
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
    const withdrawalModal = document.getElementById('withdrawal-modal');
    if (withdrawalModal) withdrawalModal.style.display = 'none';
    currentAction = null;
    pendingWithdrawal = null;
    
    if (verificationTimer) clearInterval(verificationTimer);
    if (ogadsWindow && !ogadsWindow.closed) ogadsWindow.close();
}

// ==================== MODIFIED MINING FUNCTIONS ====================
function startMiningWithTimer() {
    if (isMining || minedTokens >= DAILY_LIMIT) {
        if (minedTokens >= DAILY_LIMIT) alert("Daily limit reached!");
        return;
    }
    
    if (ogadsWindow && !ogadsWindow.closed) {
        alert("Please complete the current task first!");
        return;
    }
    
    console.log('🚀 Starting 5-minute mining session...');
    
    // Start mining
    timerMiningActive = true;
    startMining();
    
    // Set up 5-minute timer
    miningTimeLeft = 300;
    updateMiningTimer();
    
    miningTimer = setInterval(() => {
        miningTimeLeft--;
        updateMiningTimer();
        
        const progressBar = document.getElementById('mining-progress');
        if (progressBar) progressBar.style.width = ((300 - miningTimeLeft) / 300) * 100 + '%';
        
        // When timer reaches 0, open OGAds direct link
        if (miningTimeLeft <= 0) {
            clearInterval(miningTimer);
            miningTimer = null;
            
            console.log('⏰ 5 minutes elapsed. Opening OGAds direct link...');
            
            // Open OGAds in new tab
            openOGAdsLocker('timer');
        }
    }, 1000);
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

// ==================== OGADS DIRECT LINK INTEGRATION ====================
function openOGAdsLocker(type) {
    console.log(`🔓 Opening OGAds Locker for: ${type}`);
    
    // Stop mining
    stopMining();
    
    // Open OGAds in new tab
    ogadsWindow = window.open(OGADS_DIRECT_LINK, '_blank', 'width=800,height=600');
    
    if (!ogadsWindow) {
        alert('Please allow pop-ups to complete the task.');
        return;
    }
    
    // Show verification instructions
    showOGAdsVerification(type);
    
    // Start monitoring for completion
    startOGAdsMonitoring(type);
}

function showOGAdsVerification(type) {
    // Create or show modal
    let modal = document.getElementById('ogads-verification-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ogads-verification-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e);
                        padding: 30px;
                        border-radius: 15px;
                        border: 2px solid #f39c12;
                        max-width: 500px;
                        width: 90%;
                        text-align: center;
                        color: white;">
                <div style="font-size: 3rem; color: #f39c12; margin-bottom: 20px;">
                    <i class="fas fa-external-link-alt"></i>
                </div>
                <h3 style="margin-bottom: 15px;">Task Opened in New Tab</h3>
                <p style="margin-bottom: 25px; color: #aaa;">
                    Please complete the task in the new tab. Mining will resume automatically when you finish.
                </p>
                <div style="background: rgba(42, 75, 141, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-sync-alt fa-spin" style="color: #f39c12;"></i>
                        <span style="font-weight: bold;">Waiting for task completion...</span>
                    </div>
                    <div id="ogads-monitoring-status" style="color: #aaa; font-size: 0.9rem;">
                        Monitoring OGAds completion...
                    </div>
                </div>
                <button onclick="forceCompleteOGAds()" style="background: linear-gradient(90deg, #9b59b6, #8e44ad);
                           color: white; border: none; padding: 10px 20px;
                           border-radius: 5px; cursor: pointer; font-weight: bold;
                           margin-top: 10px;">
                    <i class="fas fa-forward"></i> Skip for Testing
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
    
    // Add force complete function to window
    window.forceCompleteOGAds = function() {
        if (confirm("Skip task? (For testing only)")) {
            completeOGAdsTask(type);
        }
    };
}

function startOGAdsMonitoring(type) {
    let checkCount = 0;
    const maxChecks = 300; // 5 minutes
    
    const monitoringInterval = setInterval(() => {
        checkCount++;
        
        const statusEl = document.getElementById('ogads-monitoring-status');
        if (statusEl) {
            statusEl.textContent = `Monitoring... (${checkCount}/300 seconds)`;
        }
        
        // Check if window was closed (user completed task)
        if (ogadsWindow && ogadsWindow.closed) {
            clearInterval(monitoringInterval);
            completeOGAdsTask(type);
            return;
        }
        
        // Timeout after 5 minutes
        if (checkCount >= maxChecks) {
            clearInterval(monitoringInterval);
            alert('Task timed out. Please try again.');
            closeOGAdsModal();
        }
    }, 1000);
}

function completeOGAdsTask(type) {
    console.log(`✅ OGAds task completed for: ${type}`);
    
    // Close modal
    closeOGAdsModal();
    
    // Apply rewards based on type
    if (type === 'boost') {
        // Apply boost effect
        const boostAmount = 15;
        miningSpeed += boostAmount;
        updateUI();
        
        alert(`🎉 BOOST ACTIVATED!\n\n✅ Mining speed increased by ${boostAmount} H/s\n⚡ New speed: ${miningSpeed} H/s`);
        
        // Update Boost button
        const mineNowBtn = document.getElementById('mine-now-btn');
        if (mineNowBtn) {
            mineNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Active';
            mineNowBtn.classList.remove('btn-warning');
            mineNowBtn.classList.add('btn-primary');
            mineNowBtn.disabled = true;
        }
        
        // Set boost expiration
        setTimeout(() => {
            miningSpeed = Math.max(BASE_MINING_SPEED, miningSpeed - boostAmount);
            updateUI();
            
            if (mineNowBtn) {
                mineNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining';
                mineNowBtn.classList.remove('btn-primary');
                mineNowBtn.classList.add('btn-warning');
                mineNowBtn.disabled = false;
            }
        }, 60 * 60 * 1000);
        
    } else if (type === 'task' && pendingBoostId) {
        // Complete specific task
        const boostAmounts = { '1': 5, '2': 10, '3': 15, '4': 20, '5': 8, '6': 12 };
        const boostAmount = boostAmounts[pendingBoostId] || 10;
        
        miningSpeed += boostAmount;
        completedTasks.push(`task-${pendingBoostId}`);
        updateUI();
        saveState();
        
        alert(`✅ Task completed! Mining speed increased by ${boostAmount} H/s.\nNew speed: ${miningSpeed} H/s`);
        
        pendingBoostId = null;
        
    } else {
        // Regular timer completion
        miningSpeed = Math.max(10, Math.floor(miningSpeed * 0.95));
        updateUI();
        
        alert(`🎉 ADVERTISEMENT COMPLETED!\n\n✅ Mining resumed\n⚡ Speed: ${miningSpeed} H/s`);
        
        // Restart mining after 2 seconds
        setTimeout(() => {
            startMiningWithTimer();
        }, 2000);
    }
    
    // Reset window reference
    ogadsWindow = null;
}

function closeOGAdsModal() {
    const modal = document.getElementById('ogads-verification-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==================== TIMER FUNCTIONS ====================
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

// ==================== BACKGROUND INIT ====================
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

// ==================== STYLES ====================
const buttonStyles = document.createElement('style');
buttonStyles.textContent = `
    #start-mining-btn, #mine-now-btn, #withdraw-btn, .task {
        transition: all 0.2s ease !important;
        cursor: pointer !important;
    }
    #start-mining-btn:hover, #mine-now-btn:hover, #withdraw-btn:hover, .task:hover:not([style*="cursor: default"]) {
        transform: translateY(-2px) !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
    }
    #start-mining-btn:active, #mine-now-btn:active, #withdraw-btn:active {
        transform: scale(0.97) !important;
    }
    .btn-primary {
        background: linear-gradient(90deg, #3498db, #2980b9) !important;
        border: none !important;
    }
    .btn-warning {
        background: linear-gradient(90deg, #f39c12, #e67e22) !important;
        border: none !important;
    }
`;
document.head.appendChild(buttonStyles);

console.log("✅ NRX Mining Platform Script with OGAds Direct Link Loaded Successfully!");
