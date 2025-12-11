// ==================== OPTIMIZED SCRIPT.JS ====================
// Key Fix: Mining interval changed from 100ms to 500ms
// UI updates throttled for better performance

// ==================== CONFIG & STATE ====================
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

// OGAds Direct Link
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

// Performance optimization: Cache DOM elements
let uiElementsCache = null;

// ==================== OPTIMIZED INITIALIZATION ====================
(function initializeUI() {
    console.log("⚡ Initializing UI...");
    
    // Load local progress
    loadLocalProgress();
    
    // Setup event listeners FIRST (for immediate button response)
    setupInstantEventListeners();
    
    // Update UI
    updateUI();
    
    // Start countdown timer (non-critical, can be delayed)
    setTimeout(startCountdownTimer, 500);
    
    console.log("✅ UI Ready!");
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

// ==================== OPTIMIZED updateUI() FUNCTION ====================
function updateUI() {
    // Cache DOM elements on first call
    if (!uiElementsCache) {
        uiElementsCache = {
            minedEl: document.getElementById('mined-tokens'),
            speedEl: document.getElementById('mining-speed'),
            availEl: document.getElementById('available-tokens'),
            withdrawalAmountEl: document.getElementById('withdrawal-amount'),
            currentSpeedEl: document.getElementById('current-speed'),
            miningTimerEl: document.getElementById('mining-timer'),
            miningProgressEl: document.getElementById('mining-progress')
        };
    }
    
    const el = uiElementsCache;
    
    // Update mined tokens (only if changed)
    if (el.minedEl) {
        const newMinedText = minedTokens.toFixed(4) + " NRX";
        if (el.minedEl.textContent !== newMinedText) {
            el.minedEl.textContent = newMinedText;
        }
    }
    
    // Update mining speed (only if changed)
    if (el.speedEl) {
        const newSpeedText = miningSpeed + " H/s";
        if (el.speedEl.textContent !== newSpeedText) {
            el.speedEl.textContent = newSpeedText;
        }
    }
    
    // Update available tokens
    if (el.availEl) {
        el.availEl.textContent = minedTokens.toFixed(4);
    }
    
    // Update withdrawal amount
    if (el.withdrawalAmountEl) {
        el.withdrawalAmountEl.value = minedTokens.toFixed(4);
    }
    
    // Update current speed
    if (el.currentSpeedEl) {
        const newCurrentSpeed = miningSpeed.toString();
        if (el.currentSpeedEl.textContent !== newCurrentSpeed) {
            el.currentSpeedEl.textContent = newCurrentSpeed;
        }
    }
    
    // Update mining timer
    if (el.miningTimerEl && timerMiningActive) {
        el.miningTimerEl.textContent = formatTime(miningTimeLeft);
    }
    
    // Update mining progress bar
    if (el.miningProgressEl && timerMiningActive) {
        const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
        el.miningProgressEl.style.width = progressPercent + '%';
    }
    
    // Update task completion visuals (only when tasks change)
    if (window.lastTaskUpdate !== JSON.stringify(completedTasks)) {
        window.lastTaskUpdate = JSON.stringify(completedTasks);
        updateTaskVisuals();
    }
}

function updateTaskVisuals() {
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
        
        if (isCompleted && !task.classList.contains('completed')) {
            task.classList.add('completed');
            task.style.background = 'var(--success)';
            task.style.color = 'white';
            task.innerHTML = `<i class="fas fa-check"></i><h4>Completed</h4><p>Already boosted</p>`;
            task.style.cursor = 'default';
        }
    });
}

// ==================== OPTIMIZED EVENT LISTENERS ====================
function setupInstantEventListeners() {
    console.log("⚡ Setting up event listeners...");
    
    // Start Mining Button - OPTIMIZED
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        // Remove any existing listeners first
        const newBtn = startMiningBtn.cloneNode(true);
        startMiningBtn.parentNode.replaceChild(newBtn, startMiningBtn);
        
        // Add fresh listener
        document.getElementById('start-mining-btn').addEventListener('click', handleStartMining);
    }
    
    // Mine Now Button - OPTIMIZED
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        const newMineBtn = mineNowBtn.cloneNode(true);
        mineNowBtn.parentNode.replaceChild(newMineBtn, mineNowBtn);
        
        document.getElementById('mine-now-btn').addEventListener('click', handleBoostMining);
    }
    
    // Withdraw Button - OPTIMIZED
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        const newWithdrawBtn = withdrawBtn.cloneNode(true);
        withdrawBtn.parentNode.replaceChild(newWithdrawBtn, withdrawBtn);
        
        document.getElementById('withdraw-btn').addEventListener('click', handleWithdraw);
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
    
    // Other listeners remain the same...
    // [Keep your existing confirmWithdrawalBtn, close buttons, copyAddressBtn code]
}

// ==================== OPTIMIZED BUTTON HANDLERS ====================
function handleStartMining() {
    console.log("⚡ Start Mining button clicked");
    
    if (minedTokens >= DAILY_LIMIT) {
        alert("Daily limit reached! Come back tomorrow.");
        return;
    }
    
    if (ogadsWindow && !ogadsWindow.closed) {
        alert("Please complete the current task first!");
        return;
    }
    
    // Use requestAnimationFrame for smooth response
    requestAnimationFrame(() => {
        if (isMining || timerMiningActive) {
            stopMining();
        } else {
            startMiningWithTimer();
        }
    });
}

function handleBoostMining() {
    console.log("⚡ Boost Mining button clicked");
    
    if (ogadsWindow && !ogadsWindow.closed) {
        alert("Please complete the current task first!");
        return;
    }
    
    if (!isMining && !timerMiningActive) {
        alert("Please start mining first before boosting!");
        return;
    }
    
    requestAnimationFrame(() => {
        openOGAdsLocker('boost');
    });
}

function handleWithdraw() {
    console.log("⚡ Withdraw button clicked");
    
    if (isMining || timerMiningActive) stopMining();
    
    if (minedTokens < 0.001) {
        alert("Minimum withdrawal amount is 0.001 NRX");
        return;
    }
    
    requestAnimationFrame(() => {
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

// ==================== OPTIMIZED MINING FUNCTIONS ====================
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
    if (uiElementsCache && uiElementsCache.miningTimerEl) {
        uiElementsCache.miningTimerEl.textContent = '05:00';
    }
    
    miningTimer = setInterval(() => {
        miningTimeLeft--;
        
        // Update timer display (throttled)
        if (miningTimeLeft % 5 === 0 && uiElementsCache && uiElementsCache.miningTimerEl) {
            uiElementsCache.miningTimerEl.textContent = formatTime(miningTimeLeft);
        }
        
        // Update progress bar (throttled)
        if (miningTimeLeft % 3 === 0 && uiElementsCache && uiElementsCache.miningProgressEl) {
            const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
            uiElementsCache.miningProgressEl.style.width = progressPercent + '%';
        }
        
        // When timer reaches 0, open OGAds
        if (miningTimeLeft <= 0) {
            clearInterval(miningTimer);
            miningTimer = null;
            
            console.log('⏰ 5 minutes elapsed. Opening OGAds...');
            openOGAdsLocker('timer');
        }
    }, 1000);
}

// ⚡ CRITICAL FIX: Changed from 100ms to 500ms interval
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
    
    // ⚡ CHANGED FROM 100ms TO 500ms - MAJOR PERFORMANCE IMPROVEMENT
    miningInterval = setInterval(() => {
        if (minedTokens < DAILY_LIMIT) {
            // Adjusted calculation for 500ms interval
            const tokensPerInterval = miningSpeed / 10000;
            minedTokens += tokensPerInterval;
            
            if (minedTokens > DAILY_LIMIT) minedTokens = DAILY_LIMIT;
            
            // Update UI every other interval (approx once per second)
            if (Date.now() % 1000 < 500) {
                updateUI();
            }
            
            // Save state less frequently (every 30 seconds instead of checking every time)
            if (Date.now() % 30000 < 500) {
                saveState();
            }
        } else {
            stopMining();
            updateUI();
        }
    }, 500); // ⚡ 500ms INSTEAD OF 100ms
}

function stopMining() {
    if (!isMining && !timerMiningActive) return;
    
    isMining = false;
    timerMiningActive = false;
    
    if (miningInterval) {
        clearInterval(miningInterval);
        miningInterval = null;
    }
    
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
    
    // Update UI once when stopping
    updateUI();
    saveState();
}

// ==================== KEEP YOUR EXISTING FUNCTIONS ====================
// The following functions remain the SAME as before:
// openOGAdsLocker(), showOGAdsVerification(), startOGAdsMonitoring()
// completeOGAdsTask(), closeOGAdsModal(), formatTime()
// apiRequest(), initializeSession(), saveState(), saveLocalProgress()
// createWithdrawal(), startCountdownTimer()
// All backend functions, timer functions, and OGAds functions

// Only add this helper function if not already present:
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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
    .task.completed {
        opacity: 0.8;
        cursor: default !important;
    }
`;
document.head.appendChild(buttonStyles);

console.log("✅ Optimized NRX Mining Script Loaded!");
