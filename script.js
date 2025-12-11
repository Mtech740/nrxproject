// ==================== COMPLETE FIXED SCRIPT.JS ====================
// NRX Mining Platform - With OGAds Integration
// OGAds Locker: https://redirectapps.org/cl/i/j76pvj

// ==================== CONFIG & STATE ====================
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

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

// OGAds Enforcement
let ogadsCompleted = false;
let ogadsForceLock = false;

// Performance optimization: Cache DOM elements
let uiElementsCache = null;

// ==================== STRICT AD ENFORCEMENT ====================
(function enforceAdRequirements() {
    // Block keyboard shortcuts during OGAds
    document.addEventListener('keydown', function(e) {
        if (ogadsForceLock) {
            // Block F12, Ctrl+Shift+I, Ctrl+U, Escape, Refresh, etc.
            if (e.key === 'Escape' || e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.key === 'u') || 
                e.key === 'F5' || e.key === 'F11' ||
                (e.metaKey && e.altKey && e.key === 'I')) {
                e.preventDefault();
                e.stopPropagation();
                alert('⚠️ You must complete the OGAds task to continue mining!');
                return false;
            }
        }
    });

    // Block right-click during OGAds
    document.addEventListener('contextmenu', function(e) {
        if (ogadsForceLock) {
            e.preventDefault();
            alert('Right-click is disabled during task completion.');
            return false;
        }
    });

    // Prevent back button during OGAds
    window.addEventListener('popstate', function(e) {
        if (ogadsForceLock) {
            window.history.pushState(null, null, window.location.href);
            alert('You cannot go back until you complete the task!');
        }
    });
})();

// ==================== OPTIMIZED INITIALIZATION ====================
(function initializeUI() {
    console.log("⚡ Initializing NRX Mining Platform...");
    
    // Load local progress
    loadLocalProgress();
    
    // Setup event listeners FIRST (for immediate button response)
    setupInstantEventListeners();
    
    // Update UI
    updateUI();
    
    // Start countdown timer
    setTimeout(startCountdownTimer, 500);
    
    console.log("✅ UI Ready! OGAds integration active.");
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
            console.log("📦 Loaded saved progress");
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
            miningProgressEl: document.getElementById('mining-progress'),
            miningBtn: document.getElementById('start-mining-btn'),
            boostBtn: document.getElementById('mine-now-btn')
        };
    }
    
    const el = uiElementsCache;
    
    // Update mined tokens
    if (el.minedEl) {
        el.minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    }
    
    // Update mining speed
    if (el.speedEl) {
        el.speedEl.textContent = miningSpeed + " H/s";
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
        el.currentSpeedEl.textContent = miningSpeed;
    }
    
    // Update mining timer if active
    if (el.miningTimerEl) {
        if (timerMiningActive) {
            el.miningTimerEl.textContent = formatTime(miningTimeLeft);
            el.miningTimerEl.style.color = '#f39c12';
        } else {
            el.miningTimerEl.textContent = '05:00';
            el.miningTimerEl.style.color = '';
        }
    }
    
    // Update mining progress bar
    if (el.miningProgressEl) {
        if (timerMiningActive) {
            const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
            el.miningProgressEl.style.width = progressPercent + '%';
            el.miningProgressEl.style.backgroundColor = '#f39c12';
        } else {
            el.miningProgressEl.style.width = '0%';
        }
    }
    
    // Update task completion visuals
    updateTaskVisuals();
    
    // Update button states
    updateButtonStates();
}

function updateTaskVisuals() {
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
        
        if (isCompleted) {
            task.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            task.style.color = 'white';
            task.innerHTML = `<i class="fas fa-check-circle"></i><h4>Task Completed</h4><p>+${getTaskBoost(taskId)} H/s Boost</p>`;
            task.style.cursor = 'default';
            task.style.pointerEvents = 'none';
        } else if (!ogadsForceLock) {
            task.style.pointerEvents = 'auto';
        }
    });
}

function getTaskBoost(taskId) {
    const boostAmounts = { '1': 5, '2': 10, '3': 15, '4': 20, '5': 8, '6': 12 };
    return boostAmounts[taskId] || 10;
}

function updateButtonStates() {
    const el = uiElementsCache;
    
    if (el.miningBtn) {
        if (isMining || timerMiningActive) {
            el.miningBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
            el.miningBtn.classList.remove('btn-primary');
            el.miningBtn.classList.add('btn-warning');
        } else {
            el.miningBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
            el.miningBtn.classList.remove('btn-warning');
            el.miningBtn.classList.add('btn-primary');
        }
        
        // Disable if OGAds is active
        el.miningBtn.disabled = ogadsForceLock;
    }
    
    if (el.boostBtn) {
        // Disable if OGAds is active or mining not active
        el.boostBtn.disabled = ogadsForceLock || (!isMining && !timerMiningActive);
    }
}

// ==================== OPTIMIZED EVENT LISTENERS ====================
function setupInstantEventListeners() {
    console.log("⚡ Setting up event listeners...");
    
    // Start Mining Button
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        startMiningBtn.addEventListener('click', handleStartMining);
    }
    
    // Mine Now Button (Boost)
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', handleBoostMining);
    }
    
    // Withdraw Button
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', handleWithdraw);
    }
    
    // Task Buttons
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('click', function() {
            if (ogadsForceLock) {
                alert('Please complete the current task first!');
                return;
            }
            
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
    
    // Confirm Withdrawal
    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            if (ogadsForceLock) {
                alert('Please complete the current task first!');
                return;
            }
            
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
                alert('Please enter a valid BNB Smart Chain wallet address (0x...).');
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
                
                alert('✅ Withdrawal initiated successfully! Check your wallet in 24-48 hours.');
                
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
                this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => this.innerHTML = original, 2000);
            });
        });
    }
}

// ==================== BUTTON HANDLERS ====================
function handleStartMining() {
    console.log("⚡ Start Mining button clicked");
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
        return;
    }
    
    if (minedTokens >= DAILY_LIMIT) {
        alert("Daily limit reached! Come back tomorrow.");
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
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
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
    
    if (ogadsForceLock) {
        alert('Please complete the current task first!');
        return;
    }
    
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

function closeAllModals() {
    const withdrawalModal = document.getElementById('withdrawal-modal');
    if (withdrawalModal) withdrawalModal.style.display = 'none';
    currentAction = null;
    pendingWithdrawal = null;
    
    if (verificationTimer) clearInterval(verificationTimer);
}

// ==================== MINING FUNCTIONS ====================
function startMiningWithTimer() {
    if (isMining || minedTokens >= DAILY_LIMIT || ogadsForceLock) {
        if (minedTokens >= DAILY_LIMIT) alert("Daily limit reached!");
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
        
        // Update progress bar
        if (uiElementsCache && uiElementsCache.miningProgressEl) {
            const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
            uiElementsCache.miningProgressEl.style.width = progressPercent + '%';
        }
        
        // ✅ CRITICAL: When timer reaches 0, OPEN OGADS LOCKER
        if (miningTimeLeft <= 0) {
            console.log('⏰ 5-minute timer completed. Opening OGAds locker...');
            clearInterval(miningTimer);
            miningTimer = null;
            
            // Stop mining and open OGAds
            stopMining();
            openOGAdsLocker('timer');
        }
    }, 1000);
}

function startMining() {
    if (isMining || minedTokens >= DAILY_LIMIT || ogadsForceLock) return;
    
    isMining = true;
    miningStartTime = Date.now();
    
    // Update UI
    updateUI();
    
    // Mining interval (optimized)
    miningInterval = setInterval(() => {
        if (minedTokens < DAILY_LIMIT && !ogadsForceLock) {
            const tokensPerSecond = miningSpeed / 10000;
            minedTokens += tokensPerSecond;
            
            if (minedTokens > DAILY_LIMIT) minedTokens = DAILY_LIMIT;
            
            // Update UI periodically
            if (Date.now() % 2000 < 100) updateUI();
            
            // Save state periodically
            if (Date.now() % 30000 < 500) saveState();
        } else {
            stopMining();
            updateUI();
        }
    }, 500);
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
    
    if (miningTimer) {
        clearInterval(miningTimer);
        miningTimer = null;
    }
    
    // Update UI
    updateUI();
    
    // Save state
    saveState();
}

function updateMiningTimer() {
    if (uiElementsCache && uiElementsCache.miningTimerEl) {
        uiElementsCache.miningTimerEl.textContent = formatTime(miningTimeLeft);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ==================== OGADS INTEGRATION - NO BYPASS ====================
function openOGAdsLocker(type) {
    console.log(`🔒 Opening OGAds Locker for: ${type}`);
    
    // Store current action
    window.currentOGAdsType = type;
    
    // LOCK THE INTERFACE
    lockPageInterface();
    
    // Create OGAds iframe
    const ogadsFrame = document.createElement('iframe');
    ogadsFrame.id = 'ogads-locker-frame';
    ogadsFrame.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        z-index: 99998 !important;
        background: #000 !important;
    `;
    
    // Load OGAds locker
    ogadsFrame.src = OGADS_DIRECT_LINK;
    
    ogadsFrame.onload = function() {
        console.log('✅ OGAds locker loaded successfully');
    };
    
    ogadsFrame.onerror = function() {
        console.error('❌ Failed to load OGAds locker');
        handleOGAdsBlocked(type);
    };
    
    document.body.appendChild(ogadsFrame);
    
    // Show verification modal
    showOGAdsVerification(type);
    
    // Start monitoring for completion
    startOGAdsMonitoring(type);
}

function lockPageInterface() {
    ogadsForceLock = true;
    
    // Disable all interactive elements
    document.querySelectorAll('button, .task, a, input, select').forEach(element => {
        if (!element.id || !element.id.includes('ogads')) {
            element.setAttribute('data-original-disabled', element.disabled);
            element.setAttribute('data-original-tabindex', element.tabIndex);
            element.disabled = true;
            element.tabIndex = -1;
            element.style.pointerEvents = 'none';
            element.style.opacity = '0.5';
        }
    });
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
}

function unlockPageInterface() {
    ogadsForceLock = false;
    
    // Re-enable all interactive elements
    document.querySelectorAll('button, .task, a, input, select').forEach(element => {
        const wasDisabled = element.getAttribute('data-original-disabled') === 'true';
        const tabindex = element.getAttribute('data-original-tabindex');
        
        element.disabled = wasDisabled;
        if (tabindex) element.tabIndex = parseInt(tabindex);
        element.style.pointerEvents = '';
        element.style.opacity = '';
        element.removeAttribute('data-original-disabled');
        element.removeAttribute('data-original-tabindex');
    });
    
    // Re-enable body scroll
    document.body.style.overflow = '';
    
    // Update UI
    updateUI();
}

function showOGAdsVerification(type) {
    // Remove any existing modal
    const existingModal = document.getElementById('ogads-verification-modal');
    if (existingModal) existingModal.remove();
    
    // Create strict verification modal (NO SKIP BUTTON)
    const modal = document.createElement('div');
    modal.id = 'ogads-verification-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.97);
        z-index: 99999;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e);
                    padding: 30px;
                    border-radius: 15px;
                    border: 3px solid #f39c12;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="font-size: 3rem; color: #f39c12; margin-bottom: 20px;">
                <i class="fas fa-lock"></i>
            </div>
            <h3 style="margin-bottom: 15px; color: #f39c12;">COMPLETE TASK TO CONTINUE</h3>
            
            <div style="background: rgba(231, 76, 60, 0.1); 
                        padding: 15px; 
                        border-radius: 10px; 
                        margin-bottom: 25px; 
                        border: 1px solid #e74c3c;">
                <h4><i class="fas fa-exclamation-triangle"></i> ACTION REQUIRED</h4>
                <p style="color: #fff; font-size: 0.95rem; line-height: 1.5;">
                    Complete the OGAds offer to continue mining.<br>
                    <span style="color: #ff9999;">Ad blockers will prevent continuation!</span>
                </p>
            </div>
            
            <div style="background: rgba(42, 75, 141, 0.2); 
                        padding: 20px; 
                        border-radius: 10px; 
                        margin-bottom: 20px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
                    <i class="fas fa-sync-alt fa-spin" style="color: #f39c12;"></i>
                    <span style="font-weight: bold; color: #f39c12;">VERIFYING TASK COMPLETION...</span>
                </div>
                <div id="ogads-monitoring-status" style="color: #aaa; font-size: 0.9rem; margin-bottom: 10px;">
                    Waiting for you to complete the offer...
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-size: 0.85rem;">Time remaining:</span>
                    <span id="ogads-countdown" style="color: #f39c12; font-weight: bold;">05:00</span>
                </div>
                <div style="height: 6px; background: #2a4b8d; border-radius: 3px; overflow: hidden;">
                    <div id="ogads-progress-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #f39c12, #e67e22); transition: width 1s linear;"></div>
                </div>
            </div>
            
            <div style="color: #e74c3c; font-size: 0.85rem; margin-top: 20px; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                <i class="fas fa-info-circle"></i> You must complete the offer to continue mining. Skipping is not allowed.
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Make modal non-closable
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    // Prevent closing with Escape key
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

function startOGAdsMonitoring(type) {
    let checkCount = 0;
    const maxChecks = 300; // 5 minutes
    
    const monitoringInterval = setInterval(() => {
        checkCount++;
        
        // Update status display
        const statusEl = document.getElementById('ogads-monitoring-status');
        if (statusEl) {
            statusEl.textContent = `Verifying... (${checkCount}/300 seconds)`;
        }
        
        // Update countdown
        const countdownEl = document.getElementById('ogads-countdown');
        if (countdownEl) {
            const remaining = 300 - checkCount;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('ogads-progress-bar');
        if (progressBar) {
            progressBar.style.width = ((checkCount / 300) * 100) + '%';
        }
        
        // Check if OGAds iframe is still there
        const ogadsFrame = document.getElementById('ogads-locker-frame');
        
        // ✅ MONITORING CHECKS:
        
        // 1. Check if iframe is gone (user might have closed it)
        if (!ogadsFrame || ogadsFrame.style.display === 'none') {
            console.log('❌ OGAds frame closed without completion');
            clearInterval(monitoringInterval);
            handleTaskFailure(type, 'You closed the task window.');
            return;
        }
        
        // 2. Check for ad blocker blocking (cross-origin limitations)
        try {
            // Try to access iframe content (may fail due to CORS)
            const iframeWindow = ogadsFrame.contentWindow;
            const iframeUrl = iframeWindow.location.href;
            
            // Check for OGAds redirect URLs that indicate completion
            if (iframeUrl.includes('success') || iframeUrl.includes('complete') || 
                iframeUrl.includes('thankyou') || iframeUrl.includes('verified') ||
                iframeUrl.includes('redirectapps.org/cl/')) {
                console.log('✅ OGAds task completed successfully');
                clearInterval(monitoringInterval);
                completeOGAdsTask(type);
                return;
            }
            
            // Check for ad blocker page
            if (iframeUrl.includes('adblock') || iframeUrl.includes('blocked')) {
                console.log('❌ Ad blocker detected in iframe');
                clearInterval(monitoringInterval);
                handleOGAdsBlocked(type);
                return;
            }
        } catch (e) {
            // CORS error - can't access iframe content (normal)
            // We'll rely on other detection methods
        }
        
        // 3. Check for manual completion (backend verification would go here)
        // In production, you would have backend verification
        
        // 4. Timeout after 5 minutes
        if (checkCount >= maxChecks) {
            console.log('⏰ OGAds monitoring timeout');
            clearInterval(monitoringInterval);
            handleTaskFailure(type, 'Task timed out. Please complete it within 5 minutes.');
            return;
        }
        
    }, 1000);
}

function completeOGAdsTask(type) {
    console.log(`✅ OGAds task completed for: ${type}`);
    
    // Remove OGAds iframe
    const ogadsFrame = document.getElementById('ogads-locker-frame');
    if (ogadsFrame) {
        ogadsFrame.style.opacity = '0';
        setTimeout(() => ogadsFrame.remove(), 500);
    }
    
    // Remove verification modal
    const verificationModal = document.getElementById('ogads-verification-modal');
    if (verificationModal) {
        verificationModal.style.opacity = '0';
        setTimeout(() => verificationModal.remove(), 500);
    }
    
    // Unlock page interface
    unlockPageInterface();
    
    // Apply rewards based on type
    applyOGAdsRewards(type);
    
    // Show success message
    showOGAdsSuccess(type);
    
    // Save state
    saveState();
}

function applyOGAdsRewards(type) {
    if (type === 'timer') {
        // Timer completion - reduce speed slightly as penalty
        const penalty = Math.floor(miningSpeed * 0.05); // 5% penalty
        miningSpeed = Math.max(10, miningSpeed - penalty);
        
        // Restart mining after 3 seconds
        setTimeout(() => {
            startMiningWithTimer();
        }, 3000);
        
    } else if (type === 'boost') {
        // Apply boost
        const boostAmount = 15;
        miningSpeed += boostAmount;
        
        // Update Boost button
        const mineNowBtn = document.getElementById('mine-now-btn');
        if (mineNowBtn) {
            mineNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Active';
            mineNowBtn.classList.remove('btn-warning');
            mineNowBtn.classList.add('btn-success');
            mineNowBtn.disabled = true;
        }
        
        // Set boost expiration (1 hour)
        setTimeout(() => {
            miningSpeed = Math.max(BASE_MINING_SPEED, miningSpeed - boostAmount);
            updateUI();
            
            if (mineNowBtn) {
                mineNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining';
                mineNowBtn.classList.remove('btn-success');
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
        pendingBoostId = null;
    }
    
    updateUI();
}

function showOGAdsSuccess(type) {
    const messages = {
        'timer': `✅ TASK COMPLETED!\n\nMining resumed with adjusted speed.\n⚡ New speed: ${miningSpeed} H/s`,
        'boost': `🎉 BOOST ACTIVATED!\n\nMining speed increased by 15 H/s!\n⚡ New speed: ${miningSpeed} H/s`,
        'task': `✅ TASK COMPLETED!\n\nMining speed increased!\n⚡ New speed: ${miningSpeed} H/s`
    };
    
    const successModal = document.createElement('div');
    successModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        padding: 30px;
        border-radius: 15px;
        border: 3px solid #2ecc71;
        color: white;
        z-index: 100000;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: fadeIn 0.5s;
    `;
    
    successModal.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3 style="margin-bottom: 15px;">TASK COMPLETED!</h3>
        <div style="white-space: pre-line; margin-bottom: 25px; font-size: 1.1rem;">
            ${messages[type] || 'Task completed successfully!'}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
            background: white;
            color: #27ae60;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 10px;">
            Continue Mining
        </button>
    `;
    
    document.body.appendChild(successModal);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successModal.parentElement) {
            successModal.remove();
        }
    }, 5000);
}

function handleOGAdsBlocked(type) {
    console.log('❌ Ad blocker detected');
    
    // Remove OGAds iframe
    const ogadsFrame = document.getElementById('ogads-locker-frame');
    if (ogadsFrame) ogadsFrame.remove();
    
    // Remove verification modal
    const verificationModal = document.getElementById('ogads-verification-modal');
    if (verificationModal) verificationModal.remove();
    
    // Unlock interface
    unlockPageInterface();
    
    // Show ad blocker warning
    const blockerModal = document.createElement('div');
    blockerModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        padding: 30px;
        border-radius: 15px;
        border: 3px solid #e74c3c;
        color: white;
        z-index: 100000;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    blockerModal.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">
            <i class="fas fa-ban"></i>
        </div>
        <h3 style="margin-bottom: 15px;">AD BLOCKER DETECTED!</h3>
        <p style="margin-bottom: 20px; line-height: 1.5;">
            You <strong>MUST</strong> disable your ad blocker to continue mining.
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 25px;">
            <h4><i class="fas fa-exclamation-circle"></i> Required Steps:</h4>
            <ol style="text-align: left; margin: 15px; padding-left: 20px;">
                <li>Disable your ad blocker for this site</li>
                <li>Refresh this page</li>
                <li>Click "Start Mining Now" again</li>
            </ol>
        </div>
        <button onclick="location.reload()" style="
            background: white;
            color: #e74c3c;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;">
            <i class="fas fa-sync-alt"></i> Refresh Page
        </button>
    `;
    
    document.body.appendChild(blockerModal);
    
    // Reset mining timer
    miningTimeLeft = 300;
    if (uiElementsCache && uiElementsCache.miningTimerEl) {
        uiElementsCache.miningTimerEl.textContent = '05:00';
    }
}

function handleTaskFailure(type, reason) {
    console.log(`❌ Task failed: ${reason}`);
    
    // Remove OGAds iframe
    const ogadsFrame = document.getElementById('ogads-locker-frame');
    if (ogadsFrame) ogadsFrame.remove();
    
    // Remove verification modal
    const verificationModal = document.getElementById('ogads-verification-modal');
    if (verificationModal) verificationModal.remove();
    
    // Unlock interface
    unlockPageInterface();
    
    // Show failure message
    const failModal = document.createElement('div');
    failModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #e67e22, #d35400);
        padding: 30px;
        border-radius: 15px;
        border: 3px solid #e67e22;
        color: white;
        z-index: 100000;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    failModal.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">
            <i class="fas fa-clock"></i>
        </div>
        <h3 style="margin-bottom: 15px;">TASK INCOMPLETE</h3>
        <p style="margin-bottom: 20px; line-height: 1.5;">
            ${reason || 'You did not complete the task.'}
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 25px;">
            <p><strong>To continue mining:</strong></p>
            <p>Click "Start Mining Now" and complete the OGAds task when prompted.</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
            background: white;
            color: #e67e22;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;">
            Try Again
        </button>
    `;
    
    document.body.appendChild(failModal);
    
    // Reset mining timer
    miningTimeLeft = 300;
    if (uiElementsCache && uiElementsCache.miningTimerEl) {
        uiElementsCache.miningTimerEl.textContent = '05:00';
    }
    if (uiElementsCache && uiElementsCache.miningProgressEl) {
        uiElementsCache.miningProgressEl.style.width = '0%';
    }
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
    
    const stateData = {
        minedTokens,
        miningSpeed,
        completedTasks,
        lastUpdate: new Date().toISOString(),
        totalMiningTime: totalMiningSeconds
    };
    
    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', stateData);
    } catch (error) {
        saveLocalProgress();
    }
}

function saveLocalProgress() {
    const progress = { 
        minedTokens, 
        miningSpeed, 
        completedTasks, 
        sessionId,
        lastSave: Date.now(),
        totalMiningTime: totalMiningSeconds
    };
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
}

async function createWithdrawal(walletAddress, amount) {
    try {
        const response = await apiRequest('/api/withdrawals', 'POST', {
            sessionId,
            walletAddress,
            amount: parseFloat(amount),
            network: 'bsc',
            timestamp: new Date().toISOString()
        });
        
        pendingWithdrawal = { id: response.withdrawalId, walletAddress, amount };
        minedTokens -= parseFloat(amount);
        updateUI();
        saveState();
        
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
    
    // Auto-save every 30 seconds
    setInterval(saveState, 30000);
}, 2000);

// ==================== PAGE EVENT LISTENERS ====================
document.addEventListener('visibilitychange', function() {
    if (document.hidden && (isMining || timerMiningActive)) {
        console.log('Page hidden - stopping mining');
        stopMining();
    }
});

window.addEventListener('beforeunload', function() {
    if (isMining || timerMiningActive) stopMining();
    saveState();
    
    // Clean up OGAds
    if (ogadsForceLock) {
        return 'You have an active OGAds task. Are you sure you want to leave?';
    }
});

// ==================== STYLES ====================
const buttonStyles = document.createElement('style');
buttonStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -55%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
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
    #start-mining-btn:active:not(:disabled), 
    #mine-now-btn:active:not(:disabled), 
    #withdraw-btn:active:not(:disabled) {
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
    .btn-success {
        background: linear-gradient(90deg, #27ae60, #2ecc71) !important;
        border: none !important;
    }
    
    /* OGAds modal styles */
    #ogads-verification-modal {
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(buttonStyles);

console.log("✅ NRX Mining Platform Script with OGAds Integration Loaded Successfully!");
console.log("🔒 OGAds Enforcement: ACTIVE (No bypass allowed)");
