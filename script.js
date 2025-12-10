// ==================== COMPLETE FIXED SCRIPT.JS ====================
// NRX Mining Platform - With AdMaven Content Locker
// Placement ID: 1229607

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
    loadAdMavenContentLocker(); // Changed to Content Locker
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
// ==================== ADMAVEN CONTENT LOCKER INTEGRATION ====================
function loadAdMavenContentLocker() {
    console.log('💰 Loading AdMaven Content Locker...');
    
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;
    
    // Clear container
    adContainer.innerHTML = '';
    
    // Create content locker interface
    const adHTML = `
        <div id="admaven-locker-container" style="width: 100%; height: 100%; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95)); border-radius: 12px; border: 2px solid #f39c12; box-shadow: 0 0 30px rgba(243, 156, 18, 0.3); padding: 30px; text-align: center;">
            
            <!-- Header -->
            <div style="margin-bottom: 20px;">
                <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(231, 76, 60, 0.1); padding: 8px 20px; border-radius: 20px; border: 1px solid rgba(231, 76, 60, 0.3);">
                    <div style="width: 8px; height: 8px; background: #e74c3c; border-radius: 50%; animation: pulse 1s infinite;"></div>
                    <span style="color: #e74c3c; font-weight: bold; font-size: 0.9rem;">CONTENT LOCKED</span>
                </div>
            </div>
            
            <!-- Lock Icon -->
            <div style="font-size: 4rem; color: #f39c12; margin-bottom: 20px;">
                <i class="fas fa-lock"></i>
            </div>
            
            <!-- Main Message -->
            <h2 style="color: white; margin-bottom: 10px; font-size: 1.8rem;">Complete Task to Continue Mining</h2>
            
            <!-- Instructions -->
            <div style="background: rgba(42, 75, 141, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 25px; max-width: 500px;">
                <p style="color: #aaa; line-height: 1.6; margin: 0;">
                    Complete <strong>one simple task</strong> to continue mining. This helps fund NRX Mining Platform development.
                </p>
            </div>
            
            <!-- Content Locker Area -->
            <div id="content-locker-area" style="width: 100%; max-width: 600px; min-height: 300px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin: 20px 0; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(243, 156, 18, 0.5); position: relative; overflow: hidden;">
                <!-- ADMAVEN CONTENT LOCKER WILL LOAD HERE -->
                <div id="locker-content" style="width: 100%; height: 100%;"></div>
                
                <!-- Loading message -->
                <div id="locker-loading" style="position: absolute; color: #aaa; text-align: center; padding: 30px;">
                    <div class="ad-spinner" style="width: 40px; height: 40px; border: 4px solid rgba(243, 156, 18, 0.2); border-top: 4px solid #f39c12; border-radius: 50%; animation: spin 1.5s linear infinite; margin: 0 auto 15px;"></div>
                    <div>Loading content locker...</div>
                </div>
            </div>
            
            <!-- Timer Section -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 12px; margin-bottom: 25px; width: 100%; max-width: 400px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <!-- Timer -->
                <div id="locker-countdown" style="font-size: 2.5rem; font-weight: bold; color: #2ecc71; margin: 15px 0; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(46, 204, 113, 0.5);">
                    5:00
                </div>
                
                <!-- Timer Label -->
                <div style="color: #aaa; margin-bottom: 5px; font-size: 0.9rem;">
                    <i class="fas fa-clock" style="margin-right: 8px; color: #f39c12;"></i>
                    <span>Complete task within <strong>5 minutes</strong></span>
                </div>
                
                <!-- Progress Bar -->
                <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-top: 10px;">
                    <div id="locker-progress" style="height: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); width: 100%;"></div>
                </div>
            </div>
            
            <!-- Important Warning -->
            <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(231, 76, 60, 0.3); width: 100%; max-width: 400px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #e74c3c; margin-bottom: 5px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>⚠️ TASK REQUIRED</strong>
                </div>
                <div style="color: #aaa; font-size: 0.85rem;">
                    Complete the task to unlock mining continuation
                </div>
            </div>
            
            <!-- Skip Button (for testing) -->
            <button id="skip-locker-btn" onclick="skipContentLocker()" style="margin-top: 20px; background: linear-gradient(90deg, #9b59b6, #8e44ad); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-forward"></i>
                Skip for Testing (Admin Only)
            </button>
            
        </div>
    `;
    
    adContainer.innerHTML = adHTML;
    
    // Start locker countdown (5 minutes)
    startLockerCountdown();
    
    // Load AdMaven Content Locker
    setTimeout(() => {
        loadRealAdMavenLocker();
    }, 1500);
}

// Load REAL AdMaven Content Locker
function loadRealAdMavenLocker() {
    console.log('🎯 Loading AdMaven Content Locker...');
    
    const lockerContent = document.getElementById('locker-content');
    if (!lockerContent) {
        console.error('❌ Locker content container not found');
        return;
    }
    
    try {
        // Method 1: AdMaven Content Locker iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'admaven-locker-frame';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        
        // YOUR ADMAVEN CONTENT LOCKER URL - PLACEMENT ID: 1229607
        iframe.src = 'https://ads.admaven.com/tag/iframe?zone_id=1229607&format=content_locker';
        
        iframe.onload = function() {
            console.log('✅ AdMaven Content Locker loaded successfully');
            
            // Hide loading message
            const loadingEl = document.getElementById('locker-loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            
            // Listen for completion events
            setupLockerCompletionListener();
        };
        
        iframe.onerror = function() {
            console.error('❌ Failed to load AdMaven Content Locker');
            loadAdMavenLockerScript();
        };
        
        lockerContent.appendChild(iframe);
        
    } catch (error) {
        console.error('Error loading AdMaven locker:', error);
        loadAdMavenLockerScript();
    }
}
// Alternative: AdMaven script method
function loadAdMavenLockerScript() {
    console.log('🔄 Loading AdMaven locker via script...');
    
    const lockerContent = document.getElementById('locker-content');
    if (!lockerContent) return;
    
    try {
        // Create script element
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://ads.admaven.com/tag/js?zone_id=1229607&format=content_locker';
        script.async = true;
        
        script.onload = function() {
            console.log('✅ AdMaven locker script loaded');
            
            // Hide loading
            const loadingEl = document.getElementById('locker-loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            
            // Create locker container
            const lockerDiv = document.createElement('div');
            lockerDiv.id = 'admaven-locker-unit';
            lockerContent.appendChild(lockerDiv);
        };
        
        script.onerror = function() {
            console.error('❌ AdMaven locker script failed');
            showFallbackContentLocker();
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('Error loading AdMaven locker script:', error);
        showFallbackContentLocker();
    }
}

// Setup listener for locker completion
function setupLockerCompletionListener() {
    console.log('🔧 Setting up locker completion listener...');
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
        // Check if message is from AdMaven
        if (event.data && event.data.source === 'admaven') {
            console.log('📨 Message from AdMaven:', event.data);
            
            if (event.data.type === 'locker_completed') {
                console.log('✅ Content locker completed!');
                completeAdvertisement();
            }
        }
    });
}

// Fallback content locker
function showFallbackContentLocker() {
    console.log('🔄 Showing fallback content locker...');
    
    const lockerContent = document.getElementById('locker-content');
    const loadingEl = document.getElementById('locker-loading');
    
    if (!lockerContent) return;
    
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Create a simulated content locker
    const fallbackLocker = document.createElement('div');
    fallbackLocker.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 8px;
        padding: 30px;
        text-align: center;
    `;
    
    fallbackLocker.innerHTML = `
        <div style="color: #f39c12; font-size: 3rem; margin-bottom: 20px;">
            <i class="fas fa-lock"></i>
        </div>
        
        <h3 style="color: white; margin-bottom: 15px;">Complete Task to Continue</h3>
        
        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; width: 100%; max-width: 400px;">
            <div style="color: #2ecc71; margin-bottom: 10px;">
                <i class="fas fa-tasks"></i> <strong>Available Tasks:</strong>
            </div>
            <div style="text-align: left; color: #aaa;">
                <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <i class="fas fa-play-circle" style="color: #3498db;"></i> Watch a short video
                </div>
                <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <i class="fas fa-search" style="color: #f39c12;"></i> Search something online
                </div>
                <div style="padding: 10px;">
                    <i class="fas fa-download" style="color: #9b59b6;"></i> Install a free app
                </div>
            </div>
        </div>
        
        <button onclick="simulateTaskCompletion()" style="background: linear-gradient(90deg, #2ecc71, #27ae60); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.1rem; margin-top: 20px;">
            <i class="fas fa-play"></i> Start Task
        </button>
        
        <div style="margin-top: 20px; color: #aaa; font-size: 0.9rem;">
            <i class="fas fa-info-circle"></i> Complete any task to continue mining
        </div>
    `;
    
    lockerContent.appendChild(fallbackLocker);
}

// Simulate task completion (for testing)
function simulateTaskCompletion() {
    console.log('✅ Simulating task completion...');
    
    // Show completion animation
    const lockerContent = document.getElementById('locker-content');
    if (lockerContent) {
        lockerContent.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 8px; padding: 30px; text-align: center;">
                <div style="color: #2ecc71; font-size: 4rem; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 style="color: white; margin-bottom: 10px;">Task Completed!</h3>
                <p style="color: #aaa; margin-bottom: 20px;">
                    Thank you! Mining will resume shortly.
                </p>
                <div style="color: #f39c12; font-size: 0.9rem; margin-top: 20px;">
                    <i class="fas fa-sync-alt fa-spin"></i> Processing...
                </div>
            </div>
        `;
    }
    
    // Complete after 3 seconds
    setTimeout(() => {
        completeAdvertisement();
    }, 3000);
}

// Skip button (for testing/admin)
function skipContentLocker() {
    if (confirm("Skip content locker? (For testing only - no revenue earned)")) {
        console.log('⏭️ Skipping content locker (testing)');
        completeAdvertisement();
    }
}

// Locker countdown (5 minutes)
function startLockerCountdown() {
    let minutesLeft = 5;
    let secondsLeft = 0;
    const countdownEl = document.getElementById('locker-countdown');
    const progressBar = document.getElementById('locker-progress');
    
    if (!countdownEl || !progressBar) return;
    
    const totalSeconds = 5 * 60; // 5 minutes
    
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        
        if (secondsLeft < 0) {
            minutesLeft--;
            secondsLeft = 59;
        }
        
        // Update display
        countdownEl.textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
        
        // Update progress
        const totalElapsed = (5 - minutesLeft) * 60 + (60 - secondsLeft);
        const progressPercent = (totalElapsed / totalSeconds) * 100;
        progressBar.style.width = progressPercent + '%';
        
        // Color changes
        if (minutesLeft === 0 && secondsLeft <= 30) {
            countdownEl.style.color = '#e74c3c';
            progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #f39c12)';
        } else if (minutesLeft === 0) {
            countdownEl.style.color = '#f39c12';
            progressBar.style.background = 'linear-gradient(90deg, #f39c12, #2ecc71)';
        }
        
        // Time's up
        if (minutesLeft <= 0 && secondsLeft <= 0) {
            clearInterval(countdownInterval);
            console.log('⏰ Locker time expired');
            
            // If still showing locker, complete anyway
            if (isAdShowing) {
                completeAdvertisement();
            }
        }
    }, 1000);
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

const lockerStyles = document.createElement('style');
lockerStyles.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes lockShake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
        100% { transform: translateX(0); }
    }
    .ad-spinner {
        animation: spin 1.5s linear infinite;
    }
    .fa-lock {
        animation: lockShake 2s infinite;
    }
    #skip-locker-btn:hover {
        transform: scale(1.05);
        transition: transform 0.2s;
        box-shadow: 0 5px 15px rgba(155, 89, 182, 0.4);
    }
    #admaven-locker-container {
        animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(lockerStyles);

console.log("✅ NRX Mining Platform Script Loaded Successfully!");
