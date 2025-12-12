// ==================== COMPLETE FIXED SCRIPT.JS ====================
// NRX Mining Platform - Fixed Buttons & Save System
// Daily Limit: 20 NRX | Mining Rate: 0.00139 NRX/sec at 20 H/s

// ==================== VALUE-PRESERVING CONFIG ====================
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20; // 20 NRX daily max
const BASE_MINING_SPEED = 20; // 20 H/s
const MINING_RATE = 0.00139; // 0.00139 NRX/sec at 20 H/s

// OGAds Configuration
const OGADS_DIRECT_LINK = 'https://redirectapps.org/cl/i/j76pvj';

// State variables
let sessionId = null;
let minedTokens = 0;
let miningSpeed = BASE_MINING_SPEED;
let isMining = false;
let miningInterval = null;
let completedTasks = [];
let pendingWithdrawal = null;
let pendingBoostId = null;

// Timer variables
let miningTimeLeft = 300; // 5 minutes
let timerMiningActive = false;
let miningTimer = null;
let miningStartTime = null;

// OGAds Enforcement
let ogadsForceLock = false;

// Performance
let uiElementsCache = null;
let lastSaveTime = 0;

// ==================== INITIALIZATION ====================
(function initializeUI() {
    console.log("⚡ NRX Mining Platform - Fixed Buttons & Save");
    
    // Load saved progress
    loadLocalProgress();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial UI update
    updateUI();
    
    // Start global countdown
    startGlobalCountdown();
    
    console.log("✅ Platform Ready! Balance:", minedTokens.toFixed(4), "NRX");
    
    // Auto-save every 30 seconds
    setInterval(saveLocalProgress, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', saveLocalProgress);
})();

function loadLocalProgress() {
    try {
        const saved = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (saved) {
            const progress = JSON.parse(saved);
            minedTokens = parseFloat(progress.minedTokens) || 0;
            miningSpeed = parseInt(progress.miningSpeed) || BASE_MINING_SPEED;
            completedTasks = progress.completedTasks || [];
            sessionId = progress.sessionId || `local-${Date.now()}`;
            console.log("📦 Loaded:", minedTokens.toFixed(4), "NRX, Speed:", miningSpeed, "H/s");
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        minedTokens = 0;
        miningSpeed = BASE_MINING_SPEED;
    }
}

function saveLocalProgress() {
    try {
        const progress = { 
            minedTokens, 
            miningSpeed, 
            completedTasks, 
            sessionId,
            lastSave: Date.now()
        };
        localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
        console.log("💾 Saved progress:", minedTokens.toFixed(4), "NRX");
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// ==================== MINING SYSTEM - FIXED ====================
function handleStartMining() {
    console.log('🔘 Start Mining clicked');
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
        return;
    }
    
    if (minedTokens >= DAILY_LIMIT) {
        alert("🎉 Daily limit reached! Come back tomorrow.");
        return;
    }
    
    // Toggle mining
    if (isMining || timerMiningActive) {
        stopMining();
    } else {
        startMiningWithTimer();
    }
}

function startMiningWithTimer() {
    console.log('🚀 Starting mining session...');
    
    // Start new session
    timerMiningActive = true;
    isMining = true;
    miningTimeLeft = 300;
    miningStartTime = Date.now();
    
    // Update UI
    updateMiningButton(true);
    
    // Start actual mining
    startActualMining();
    
    // Start 5-minute countdown
    startCountdownTimer();
    
    console.log('⛏️ Mining ACTIVE!');
}

function startActualMining() {
    // Clear any existing interval
    if (miningInterval) {
        clearInterval(miningInterval);
        miningInterval = null;
    }
    
    miningInterval = setInterval(() => {
        if (!isMining || ogadsForceLock) return;
        
        // Calculate tokens
        const tokensPerSecond = (miningSpeed / 20) * MINING_RATE;
        const newTokens = minedTokens + tokensPerSecond;
        minedTokens = Math.min(newTokens, DAILY_LIMIT);
        
        // Update UI
        updateUI();
        
        // Check daily limit
        if (minedTokens >= DAILY_LIMIT) {
            stopMining();
            showNotification('🎉 Daily limit of 20 NRX reached! Come back tomorrow.', 'success');
        }
        
    }, 1000);
}

function startCountdownTimer() {
    // Clear existing timer
    if (miningTimer) {
        clearInterval(miningTimer);
        miningTimer = null;
    }
    
    miningTimer = setInterval(() => {
        if (!timerMiningActive || ogadsForceLock) return;
        
        miningTimeLeft--;
        updateTimerDisplay();
        
        // When timer hits 0
        if (miningTimeLeft <= 0) {
            clearInterval(miningTimer);
            miningTimer = null;
            
            console.log('⏰ 5-minute session completed!');
            
            // Stop mining and open OGAds
            stopMining();
            openOGAdsLocker('timer');
        }
    }, 1000);
}

function stopMining() {
    console.log('🛑 Stopping mining...');
    
    // Stop all intervals
    isMining = false;
    timerMiningActive = false;
    
    if (miningInterval) {
        clearInterval(miningInterval);
        miningInterval = null;
    }
    
    if (miningTimer) {
        clearInterval(miningTimer);
        miningTimer = null;
    }
    
    // Update UI
    updateMiningButton(false);
    
    // Save progress immediately
    saveLocalProgress();
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('mining-timer');
    if (timerElement) {
        timerElement.textContent = formatTime(miningTimeLeft);
    }
    
    const progressElement = document.getElementById('mining-progress');
    if (progressElement) {
        const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
        progressElement.style.width = progressPercent + '%';
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ==================== UI FUNCTIONS ====================
function updateUI() {
    // Cache DOM elements
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
    
    // Update all displays
    if (el.minedEl) el.minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    if (el.speedEl) el.speedEl.textContent = miningSpeed + " H/s";
    if (el.availEl) el.availEl.textContent = minedTokens.toFixed(4);
    if (el.currentSpeedEl) el.currentSpeedEl.textContent = miningSpeed;
    
    if (el.withdrawalAmountEl) {
        el.withdrawalAmountEl.value = minedTokens.toFixed(4);
    }
    
    // Update tasks
    updateTaskVisuals();
}

function updateMiningButton(isActive) {
    const miningBtn = document.getElementById('start-mining-btn');
    if (!miningBtn) return;
    
    if (isActive) {
        miningBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
        miningBtn.classList.remove('btn-primary');
        miningBtn.classList.add('btn-warning');
    } else {
        miningBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
        miningBtn.classList.remove('btn-warning');
        miningBtn.classList.add('btn-primary');
        
        // Reset timer display
        const timerElement = document.getElementById('mining-timer');
        if (timerElement) timerElement.textContent = '05:00';
        
        // Reset progress bar
        const progressElement = document.getElementById('mining-progress');
        if (progressElement) progressElement.style.width = '0%';
    }
    
    miningBtn.disabled = ogadsForceLock;
}

function updateTaskVisuals() {
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
        
        if (isCompleted) {
            task.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            task.style.color = 'white';
            task.innerHTML = `<i class="fas fa-check-circle"></i><h4>Task Completed</h4><p>Already boosted</p>`;
            task.style.cursor = 'default';
            task.style.pointerEvents = 'none';
        } else if (!ogadsForceLock) {
            task.style.pointerEvents = 'auto';
        }
    });
}

// ==================== BUTTON EVENT HANDLERS - FIXED ====================
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Start Mining Button
    const startBtn = document.getElementById('start-mining-btn');
    if (startBtn) {
        startBtn.addEventListener('click', handleStartMining);
        console.log('✅ Start Mining button listener added');
    }
    
    // Boost Mining Button
    const boostBtn = document.getElementById('mine-now-btn');
    if (boostBtn) {
        boostBtn.addEventListener('click', handleBoostMining);
        console.log('✅ Boost Mining button listener added');
    }
    
    // Withdraw Button
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', handleWithdraw);
        console.log('✅ Withdraw button listener added');
    }
    
    // Task Buttons
    const tasks = document.querySelectorAll('.task');
    tasks.forEach((task, index) => {
        task.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task');
            handleTaskClick(taskId);
        });
    });
    console.log(`✅ ${tasks.length} task button listeners added`);
    
    // Confirm Withdrawal
    const confirmBtn = document.getElementById('confirm-withdrawal');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleConfirmWithdrawal);
    }
    
    // Modal Close Buttons
    document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Copy Address
    const copyBtn = document.getElementById('copy-address');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText('0x843359Fc72AB9C741c88EA32a224005f9AED5eD7')
                .then(() => {
                    const original = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => this.innerHTML = original, 2000);
                });
        });
    }
}

function handleBoostMining() {
    console.log('🔘 Boost Mining clicked');
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
        return;
    }
    
    if (!isMining && !timerMiningActive) {
        alert('Start mining first before boosting!');
        return;
    }
    
    openOGAdsLocker('boost');
}

function handleWithdraw() {
    console.log('🔘 Withdraw clicked');
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
        return;
    }
    
    if (minedTokens < 0.001) {
        alert('Minimum withdrawal is 0.001 NRX');
        return;
    }
    
    const modal = document.getElementById('withdrawal-modal');
    if (modal) {
        modal.style.display = 'block';
        const amountInput = document.getElementById('withdrawal-amount');
        if (amountInput) amountInput.value = minedTokens.toFixed(4);
    }
}

function handleTaskClick(taskId) {
    console.log('🔘 Task clicked:', taskId);
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
        return;
    }
    
    const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
    if (isCompleted) {
        alert('Task already completed!');
        return;
    }
    
    pendingBoostId = taskId;
    openOGAdsLocker('task');
}

function handleConfirmWithdrawal() {
    console.log('🔘 Confirm Withdrawal clicked');
    
    const walletInput = document.getElementById('wallet-address');
    const amountInput = document.getElementById('withdrawal-amount');
    
    if (!walletInput || !amountInput) return;
    
    const walletAddress = walletInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    // Validation
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        alert('Enter valid BSC address (0x...)');
        return;
    }
    
    if (amount > minedTokens) {
        alert('Amount exceeds balance!');
        return;
    }
    
    if (amount < 0.001) {
        alert('Minimum withdrawal: 0.001 NRX');
        return;
    }
    
    // Process withdrawal
    minedTokens -= amount;
    updateUI();
    saveLocalProgress();
    
    // Close modal
    const modal = document.getElementById('withdrawal-modal');
    if (modal) modal.style.display = 'none';
    
    showNotification(
        `✅ Withdrawal of ${amount.toFixed(4)} NRX initiated!\n\nFunds will arrive in 24-48 hours.`,
        'success'
    );
}

// ==================== SIMPLE OGADS - NO VERIFICATION ====================
function openOGAdsLocker(type) {
    console.log(`🔒 Opening OGAds for: ${type}`);
    
    // Stop mining
    stopMining();
    
    // Save before opening
    saveLocalProgress();
    
    // Lock interface
    ogadsForceLock = true;
    updateMiningButton(false);
    
    // Create simple container
    const container = document.createElement('div');
    container.id = 'ogads-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 99999;
        display: flex;
        flex-direction: column;
    `;
    
    // Header with close button
    const header = document.createElement('div');
    header.style.cssText = `
        background: #1a1a2e;
        color: white;
        padding: 15px;
        text-align: center;
        border-bottom: 2px solid #f39c12;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    header.innerHTML = `
        <div>
            <h3 style="margin: 0; color: #f39c12;">
                <i class="fas fa-tasks"></i> Complete Task to Continue Mining
            </h3>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #ccc;">
                Complete one offer below
            </p>
        </div>
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = 'Close & Continue';
    closeBtn.style.cssText = `
        background: #f39c12;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    `;
    closeBtn.onclick = function() {
        completeOGAdsTask(type);
    };
    header.appendChild(closeBtn);
    
    // OGAds iframe
    const iframe = document.createElement('iframe');
    iframe.src = OGADS_DIRECT_LINK;
    iframe.style.cssText = `
        flex: 1;
        width: 100%;
        border: none;
        background: white;
    `;
    iframe.sandbox = "allow-scripts allow-forms allow-same-origin allow-popups";
    
    // Assemble
    container.appendChild(header);
    container.appendChild(iframe);
    document.body.appendChild(container);
}

function completeOGAdsTask(type) {
    console.log(`✅ OGAds completed for: ${type}`);
    
    // Remove container
    const container = document.getElementById('ogads-container');
    if (container) container.remove();
    
    // Unlock interface
    ogadsForceLock = false;
    
    // Apply rewards
    applyOGAdsReward(type);
    
    // Save progress
    saveLocalProgress();
}

function applyOGAdsReward(type) {
    if (type === 'timer') {
        // Continue mining after 1 second
        setTimeout(() => {
            startMiningWithTimer();
        }, 1000);
        
    } else if (type === 'boost') {
        // Apply 15 H/s boost
        const boostAmount = 15;
        miningSpeed += boostAmount;
        
        // Update boost button
        const boostBtn = document.getElementById('mine-now-btn');
        if (boostBtn) {
            boostBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Active';
            boostBtn.classList.remove('btn-warning');
            boostBtn.classList.add('btn-success');
            boostBtn.disabled = true;
        }
        
        showNotification(`🎉 Boost activated! +${boostAmount} H/s`, 'success');
        
        // Boost expires after 1 hour
        setTimeout(() => {
            miningSpeed = Math.max(BASE_MINING_SPEED, miningSpeed - boostAmount);
            updateUI();
            
            if (boostBtn) {
                boostBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining';
                boostBtn.classList.remove('btn-success');
                boostBtn.classList.add('btn-warning');
                boostBtn.disabled = false;
            }
        }, 60 * 60 * 1000);
        
    } else if (type === 'task' && pendingBoostId) {
        // Complete task
        const boostAmounts = { '1': 5, '2': 10, '3': 15, '4': 20, '5': 8, '6': 12 };
        const boostAmount = boostAmounts[pendingBoostId] || 10;
        
        miningSpeed += boostAmount;
        completedTasks.push(`task-${pendingBoostId}`);
        pendingBoostId = null;
        
        showNotification(`✅ Task completed! +${boostAmount} H/s boost`, 'success');
    }
    
    updateUI();
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'info', duration = 5000) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s;
        white-space: pre-line;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function startGlobalCountdown() {
    function update() {
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
    
    setInterval(update, 1000);
    update();
}

// ==================== STYLES ====================
const buttonStyles = document.createElement('style');
buttonStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    #start-mining-btn, #mine-now-btn, #withdraw-btn, .task {
        transition: all 0.2s ease !important;
        cursor: pointer !important;
    }
    #start-mining-btn:hover:not(:disabled), 
    #mine-now-btn:hover:not(:disabled), 
    #withdraw-btn:hover:not(:disabled), 
    .task:hover:not([style*="pointer-events: none"]) {
        transform: translateY(-2px) !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
    }
    .btn-primary {
        background: linear-gradient(90deg, #3498db, #2980b9) !important;
        border: none !important;
    }
    .btn-warning {
        background: linear-gradient(90deg, #f39c12, #e67e22) !important;
        border: none !important;
    }
    .btn-success {
        background: linear-gradient(90deg, #27ae60, #2ecc71) !important;
        border: none !important;
    }
`;
document.head.appendChild(buttonStyles);

console.log("✅ NRX Mining Platform - BUTTONS & SAVE FIXED");
console.log("💰 Daily Limit: 20 NRX | Mining Rate: 0.00139 NRX/sec");
console.log("💾 Auto-save: Every 30 seconds + on exit");
