// ==================== AD-MAVEN TIMER SYSTEM ====================
let miningTimeLeft = 300; // 5 minutes
let adTimeLeft = 30; // 30 seconds
let miningTimer = null;
let adTimer = null;
let isAdShowing = false;
let timerMiningActive = false;

// Modified start mining function that works with timer
function startMiningWithTimer() {
    if (isMining || minedTokens >= DAILY_LIMIT) {
        if (minedTokens >= DAILY_LIMIT) {
            alert("Daily limit reached! Come back tomorrow.");
        }
        return;
    }
    
    console.log('🚀 Starting mining with 5-minute timer');
    timerMiningActive = true;
    
    // Start the actual mining from existing code
    startMining();
    
    // Start 5-minute countdown
    startCountdown();
}

function startCountdown() {
    miningTimeLeft = 300;
    updateMiningTimer();
    
    miningTimer = setInterval(() => {
        miningTimeLeft--;
        updateMiningTimer();
        
        // Update progress bar
        const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
        const progressBar = document.getElementById('mining-progress');
        if (progressBar) {
            progressBar.style.width = progressPercent + '%';
        }
        
        const timeUntilAd = document.getElementById('time-until-ad');
        if (timeUntilAd) {
            timeUntilAd.textContent = formatTime(miningTimeLeft);
        }
        
        // Last minute warnings
        if (miningTimeLeft === 60) {
            console.log('⏰ 1 minute until ad');
            flashWarning('1 minute until ad!');
        }
        if (miningTimeLeft === 30) {
            flashWarning('30 seconds until ad!');
        }
        if (miningTimeLeft === 10) {
            flashWarning('10 seconds until ad!');
        }
        
        // Timer ended - show ad
        if (miningTimeLeft <= 0) {
            clearInterval(miningTimer);
            miningTimer = null;
            showAdvertisement();
        }
    }, 1000);
}

function showAdvertisement() {
    console.log('📺 Showing advertisement');
    isAdShowing = true;
    timerMiningActive = false;
    
    // Stop mining (from existing code)
    stopMining();
    
    // Show ad overlay
    const adOverlay = document.getElementById('ad-overlay');
    if (adOverlay) {
        adOverlay.style.display = 'block';
    }
    
    // Start ad countdown
    startAdCountdown();
    
    // Load Adsterra ad
    loadAdsterraAd();
}

function startAdCountdown() {
    adTimeLeft = 30;
    updateAdTimer();
    
    adTimer = setInterval(() => {
        adTimeLeft--;
        updateAdTimer();
        
        // Last 10 seconds warning
        if (adTimeLeft === 10) {
            const adCountdown = document.getElementById('ad-countdown');
            if (adCountdown) {
                adCountdown.style.color = '#e74c3c';
                adCountdown.style.animation = 'pulse 0.5s infinite';
            }
        }
        
        if (adTimeLeft <= 0) {
            clearInterval(adTimer);
            adTimer = null;
            completeAdvertisement();
        }
    }, 1000);
}

function completeAdvertisement() {
    console.log('✅ Ad completed');
    isAdShowing = false;
    
    // Hide ad overlay
    const adOverlay = document.getElementById('ad-overlay');
    if (adOverlay) {
        adOverlay.style.display = 'none';
    }
    
    // Reduce mining speed by 10%
    miningSpeed = Math.max(10, Math.floor(miningSpeed * 0.9));
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) {
        currentSpeedEl.textContent = miningSpeed;
    }
    
    // Update mining speed display
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) {
        speedEl.textContent = miningSpeed + " H/s";
    }
    
    // Show success message
    showSuccessMessage();
    
    // Restart mining after 3 seconds
    setTimeout(() => {
        startMiningWithTimer();
    }, 3000);
}

function updateMiningTimer() {
    const timerElement = document.getElementById('mining-timer');
    const timeString = formatTime(miningTimeLeft);
    
    if (timerElement) {
        timerElement.textContent = timeString;
        
        // Color coding
        if (miningTimeLeft <= 30) {
            timerElement.style.color = '#e74c3c';
            timerElement.style.textShadow = '0 0 20px rgba(231, 76, 60, 0.5)';
        } else if (miningTimeLeft <= 60) {
            timerElement.style.color = '#f39c12';
            timerElement.style.textShadow = '0 0 20px rgba(243, 156, 18, 0.5)';
        } else {
            timerElement.style.color = '#2ecc71';
            timerElement.style.textShadow = '0 0 20px rgba(46, 204, 113, 0.5)';
        }
    }
}

function updateAdTimer() {
    const adTimerElement = document.getElementById('ad-countdown');
    if (adTimerElement) {
        adTimerElement.textContent = adTimeLeft;
        
        if (adTimeLeft > 20) {
            adTimerElement.style.color = '#2ecc71';
        } else if (adTimeLeft > 10) {
            adTimerElement.style.color = '#f39c12';
        }
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function flashWarning(message) {
    console.log('⚠️ ' + message);
    // Visual flash effect
    const timer = document.getElementById('mining-timer');
    if (timer) {
        timer.style.transform = 'scale(1.1)';
        timer.style.transition = 'transform 0.3s';
        setTimeout(() => {
            timer.style.transform = 'scale(1)';
        }, 300);
    }
}

function showSuccessMessage() {
    alert(`🎉 ADVERTISEMENT COMPLETED!\n\n✅ Mining resumed\n⚡ Speed: ${miningSpeed} H/s (10% reduced)\n⏰ Next ad in 5 minutes\n\nThank you for supporting NRX Mining!`);
}

// ==================== ADSTERRA AD INTEGRATION ====================
function loadAdsterraAd() {
    console.log('💰 Loading Adsterra popunder advertisement...');
    
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;
    
    // Clear container
    adContainer.innerHTML = '';
    
    // Create Adsterra ad with your EXACT script
    const adCode = `
        <!-- Ad Loading Display -->
        <div style="width: 100%; height: 100%; min-height: 320px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(22, 33, 62, 0.9)); border-radius: 12px; border: 2px solid #f39c12; box-shadow: 0 0 25px rgba(243, 156, 18, 0.25);">
            <div style="text-align: center; padding: 40px; max-width: 500px;">
                
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                    <div style="width: 10px; height: 10px; background: #2ecc71; border-radius: 50%; animation: pulse 2s infinite;"></div>
                    <div style="color: #aaa; font-size: 0.9rem; font-weight: 500;">ADVERTISEMENT</div>
                    <div style="width: 10px; height: 10px; background: #2ecc71; border-radius: 50%; animation: pulse 2s infinite;"></div>
                </div>
                
                <!-- Main Icon -->
                <div style="font-size: 3rem; color: #f39c12; margin-bottom: 20px;">
                    <i class="fas fa-ad"></i>
                </div>
                
                <!-- Title -->
                <h3 style="color: white; margin-bottom: 15px; font-size: 1.5rem;">Support NRX Mining</h3>
                
                <!-- Description -->
                <p style="color: #aaa; line-height: 1.6; margin-bottom: 30px;">
                    This advertisement helps fund NRX Mining Platform development, 
                    server costs, and user rewards. Thank you for your support!
                </p>
                
                <!-- Loading Animation -->
                <div class="ad-spinner" style="width: 60px; height: 60px; border: 5px solid rgba(243, 156, 18, 0.2); border-top: 5px solid #f39c12; border-radius: 50%; animation: spin 1.5s linear infinite; margin: 0 auto 30px;"></div>
                
                <!-- Timer Info -->
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
                        <i class="fas fa-clock" style="color: #f39c12;"></i>
                        <span style="color: #aaa; font-size: 0.9rem;">Ad will close in <span id="ad-countdown-display" style="color: #f39c12; font-weight: bold;">30</span> seconds</span>
                    </div>
                    <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                        <div id="ad-timer-progress" style="height: 100%; background: linear-gradient(90deg, #f39c12, #e67e22); width: 100%;"></div>
                    </div>
                </div>
                
                <!-- Adsterra Badge -->
                <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(42, 75, 141, 0.3); padding: 10px 20px; border-radius: 20px; border: 1px solid rgba(42, 75, 141, 0.5);">
                    <i class="fas fa-shield-alt" style="color: #2ecc71;"></i>
                    <div>
                        <div style="color: white; font-size: 0.85rem; font-weight: 500;">Ad Network</div>
                        <div style="color: #aaa; font-size: 0.75rem;">Adsterra • Placement: 28128352</div>
                    </div>
                </div>
                
            </div>
        </div>
        
        <!-- ========== ADSTERRA POPUNDER SCRIPT ========== -->
        <!-- YOUR EXACT ADSTERRA CODE - DO NOT MODIFY -->
        <script
            type="text/javascript"
            src="//pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.js"
        ><\/script>
        <!-- ============================================== -->
        
        <!-- Timer Progress Animation -->
        <script>
            (function() {
                console.log('🎯 Adsterra popunder script injected');
                
                let timerProgress = 100;
                const progressBar = document.getElementById('ad-timer-progress');
                const timerDisplay = document.getElementById('ad-countdown-display');
                
                // Update timer every second
                const timerInterval = setInterval(() => {
                    timerProgress -= (100 / 30); // 30 seconds total
                    
                    if (progressBar) {
                        progressBar.style.width = timerProgress + '%';
                    }
                    
                    if (timerDisplay) {
                        const secondsLeft = Math.ceil(timerProgress / (100 / 30));
                        timerDisplay.textContent = secondsLeft;
                        
                        // Color change
                        if (secondsLeft <= 10) {
                            timerDisplay.style.color = '#e74c3c';
                        } else if (secondsLeft <= 20) {
                            timerDisplay.style.color = '#f39c12';
                        }
                    }
                    
                    if (timerProgress <= 0) {
                        clearInterval(timerInterval);
                    }
                }, 1000);
            })();
        <\/script>
    `;
    
    // Inject the ad code
    adContainer.innerHTML = adCode;
    console.log('✅ Adsterra popunder ad loaded');
}
// ==================== END ADSTERRA INTEGRATION ====================

// ---------- CONFIG ----------
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
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
let ogadsWindow = null;
let verificationTimer = null;
let taskCompleted = false;

// ---------- BACKEND API FUNCTIONS ----------
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Create or restore session
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
        } catch (error) {
            console.log('Existing session not found, creating new one');
        }
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
        console.error('Failed to create session:', error);
        sessionId = `local-${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    }
}

// Save state to backend
async function saveState() {
    if (!sessionId) return;
    
    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', {
            minedTokens,
            miningSpeed,
            completedTasks,
            totalMiningTime: getTotalMiningTime(),
            updatedAt: new Date().toISOString()
        });
        console.log('State saved to backend');
    } catch (error) {
        console.warn('Failed to save to backend, saving locally');
        saveLocalProgress();
    }
}

// Save local progress as backup
function saveLocalProgress() {
    const progress = {
        minedTokens,
        miningSpeed,
        completedTasks,
        lastSave: Date.now(),
        sessionId
    };
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
}

// Load local progress
function loadLocalProgress() {
    try {
        const saved = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (saved) {
            const progress = JSON.parse(saved);
            minedTokens = progress.minedTokens || 0;
            miningSpeed = progress.miningSpeed || BASE_MINING_SPEED;
            completedTasks = progress.completedTasks || [];
            return true;
        }
    } catch (error) {
        console.error('Error loading local progress:', error);
    }
    return false;
}

// ---------- MINING SYSTEM ----------
let miningStartTime = null;
let totalMiningSeconds = 0;

function getTotalMiningTime() {
    let total = totalMiningSeconds;
    if (miningStartTime) {
        total += (Date.now() - miningStartTime) / 1000;
    }
    return Math.floor(total);
}

function startMining() {
    if (isMining || minedTokens >= DAILY_LIMIT) {
        if (minedTokens >= DAILY_LIMIT) {
            alert("Daily limit reached! Come back tomorrow.");
        }
        return;
    }
    
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
            
            if (minedTokens > DAILY_LIMIT) {
                minedTokens = DAILY_LIMIT;
            }
            
            updateUI();
            
            if (Date.now() % 10000 < 100) {
                saveState();
            }
        } else {
            stopMining();
            updateUI();
        }
    }, 100);
}

// MODIFIED: Updated stopMining function to work with timer system
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
    
    // Also stop timer if running
    if (miningTimer) {
        clearInterval(miningTimer);
        miningTimer = null;
    }
    
    // Reset timer display if not in ad mode
    if (!isAdShowing) {
        const timerElement = document.getElementById('mining-timer');
        if (timerElement) {
            timerElement.textContent = '05:00';
            timerElement.style.color = '#2ecc71';
        }
        
        const progressBar = document.getElementById('mining-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        const timeUntilAd = document.getElementById('time-until-ad');
        if (timeUntilAd) {
            timeUntilAd.textContent = '5:00';
        }
    }
    
    saveState();
}

// ---------- OGADS VERIFICATION SYSTEM ----------
function openOGADSTask(taskType) {
    currentAction = taskType;
    
    // Stop mining if active
    if (isMining || timerMiningActive) {
        stopMining();
    }
    
    // Close any existing modal
    const ogadsModal = document.getElementById('ogads-modal');
    if (ogadsModal) {
        ogadsModal.style.display = 'none';
    }
    
    // Store start time
    const taskStartTime = Date.now();
    
    // Open OGADS link in new tab
    ogadsWindow = window.open('https://applocked.org/cl/i/j76pvj', '_blank', 'noopener,noreferrer');
    
    if (!ogadsWindow || ogadsWindow.closed || typeof ogadsWindow.closed === 'undefined') {
        alert('Please allow pop-ups to complete the task.');
        return;
    }
    
    // Show verification instructions
    showVerificationInstructions();
    
    // Start monitoring for completion
    startTaskMonitoring(taskStartTime);
}

function showVerificationInstructions() {
    const ogadsModal = document.getElementById('ogads-modal');
    
    if (ogadsModal) {
        ogadsModal.style.display = 'block';
        
        // Update modal content
        const modalHeader = ogadsModal.querySelector('.modal-header h3');
        const modalBody = ogadsModal.querySelector('.modal-body');
        
        if (modalHeader) {
            modalHeader.textContent = 'Complete Task to Get Boost';
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; color: #f39c12; margin-bottom: 20px;">
                        <i class="fas fa-external-link-alt"></i>
                    </div>
                    <h3 style="color: var(--primary); margin-bottom: 15px;">Task Opened in New Tab</h3>
                    <p style="margin-bottom: 25px; color: var(--dark);">
                        Please <strong>complete the task in the new tab</strong> to receive your mining speed boost.
                    </p>
                    
                    <div class="verification-steps">
                        <div class="step">
                            <i class="fas fa-external-link-alt"></i>
                            <strong>Step 1:</strong> Complete the task in the new tab
                        </div>
                        <div class="step">
                            <i class="fas fa-check-circle"></i>
                            <strong>Step 2:</strong> Return here after completion
                        </div>
                        <div class="step">
                            <i class="fas fa-bolt"></i>
                            <strong>Step 3:</strong> Boost will be applied automatically
                        </div>
                    </div>
                    
                    <div class="verification-warning" style="margin-top: 25px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Important:</strong> You must actually complete the task. The system detects fake attempts.
                    </div>
                    
                    <div style="margin-top: 30px; padding: 15px; background: rgba(42, 75, 141, 0.1); border-radius: 10px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                            <i class="fas fa-sync-alt fa-spin" style="color: var(--primary);"></i>
                            <span style="font-weight: bold; color: var(--primary);">Waiting for task completion...</span>
                        </div>
                        <div id="monitoring-status" style="color: #666; font-size: 0.9rem;">
                            Monitoring OGADS completion...
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

function startTaskMonitoring(taskStartTime) {
    let checkCount = 0;
    const maxChecks = 60; // Check for 60 seconds
    const taskId = pendingBoostId || '1';
    
    const monitoringInterval = setInterval(() => {
        checkCount++;
        
        const statusEl = document.getElementById('monitoring-status');
        if (statusEl) {
            statusEl.textContent = `Monitoring... (${checkCount}/60 seconds)`;
        }
        
        // Check if OGADS window is still open
        if (ogadsWindow && ogadsWindow.closed) {
            // Window closed - assume task completed
            clearInterval(monitoringInterval);
            applyBoostAfterTask(taskId, true);
            return;
        }
        
        // After 30 seconds, check backend for verification
        if (checkCount >= 30) {
            checkBackendForVerification(taskId, monitoringInterval);
        }
        
        // Stop checking after 60 seconds
        if (checkCount >= maxChecks) {
            clearInterval(monitoringInterval);
            
            if (ogadsWindow && !ogadsWindow.closed) {
                // Window still open after 60s - user might still be working
                if (statusEl) {
                    statusEl.innerHTML = `<span style="color: #f39c12;">Task taking longer than expected. Please complete it in the other tab.</span>`;
                }
            } else {
                // Window closed but no verification - apply boost anyway (better UX)
                applyBoostAfterTask(taskId, false);
            }
        }
    }, 1000);
}

async function checkBackendForVerification(taskId, monitoringInterval) {
    try {
        const response = await apiRequest(`/api/task-verify/${sessionId}/${taskId}`);
        if (response.verified) {
            clearInterval(monitoringInterval);
            applyBoostAfterTask(taskId, true);
        }
    } catch (error) {
        // Backend check failed, continue monitoring
        console.log('Backend check failed, continuing monitoring...');
    }
}

function applyBoostAfterTask(taskId, verified) {
    const boostAmounts = {
        '1': 5,   // Watch Video
        '2': 10,  // Share on Social
        '3': 15,  // Install App
        '4': 20,  // Invite Friend
        '5': 8,   // Search Web
        '6': 12   // Complete Survey
    };
    
    const boostAmount = boostAmounts[taskId] || 10;
    
    // Apply boost
    miningSpeed += boostAmount;
    
    // Update timer speed display
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) {
        currentSpeedEl.textContent = miningSpeed;
    }
    
    // Mark task as completed
    completedTasks.push(`task-${taskId}`);
    
    // Update UI
    updateUI();
    saveState();
    
    // Close modal
    const ogadsModal = document.getElementById('ogads-modal');
    if (ogadsModal) {
        ogadsModal.style.display = 'none';
    }
    
    // Update task UI
    const taskElement = document.querySelector(`.task[data-task="${taskId}"]`);
    if (taskElement) {
        taskElement.style.background = 'var(--success)';
        taskElement.style.color = 'white';
        taskElement.innerHTML = `<i class="fas fa-check"></i><h4>Completed</h4><p>+${boostAmount} H/s</p>`;
        taskElement.style.cursor = 'default';
        taskElement.onclick = null;
    }
    
    // Show success message
    if (verified) {
        alert(`✅ Task verified! Mining speed increased by ${boostAmount} H/s.\nNew speed: ${miningSpeed} H/s`);
    } else {
        alert(`✅ Task completed! Mining speed increased by ${boostAmount} H/s.\nNew speed: ${miningSpeed} H/s`);
    }
    
    console.log(`Boost applied: +${boostAmount} H/s, Total: ${miningSpeed} H/s`);
}

// ---------- BOOST SYSTEM ----------
async function requestBoost(taskId) {
    pendingBoostId = taskId;
    
    try {
        const response = await apiRequest('/api/boosts', 'POST', {
            sessionId,
            taskId,
            requestedAt: new Date().toISOString()
        });
        
        return response;
    } catch (error) {
        console.error('Failed to request boost:', error);
        // Fallback
        return { success: true, boostAmount: 10 };
    }
}

// ---------- WITHDRAWAL SYSTEM ----------
async function createWithdrawal(walletAddress, amount) {
    try {
        const response = await apiRequest('/api/withdrawals', 'POST', {
            sessionId,
            walletAddress,
            amount: parseFloat(amount),
            network: 'bsc'
        });
        
        pendingWithdrawal = {
            id: response.withdrawalId,
            walletAddress,
            amount
        };
        
        minedTokens -= parseFloat(amount);
        updateUI();
        
        return response;
    } catch (error) {
        console.error('Failed to create withdrawal:', error);
        throw error;
    }
}

// ---------- UI UPDATES ----------
// MODIFIED: Updated updateUI function to work with timer system
function updateUI() {
    const minedEl = document.getElementById('mined-tokens');
    if (minedEl) {
        minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    }
    
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) {
        speedEl.textContent = miningSpeed + " H/s";
    }
    
    // Also update timer speed display
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) {
        currentSpeedEl.textContent = miningSpeed;
    }
    
    const availEl = document.getElementById('available-tokens');
    if (availEl) {
        availEl.textContent = minedTokens.toFixed(4);
    }
    
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');
    if (withdrawalAmountEl) {
        withdrawalAmountEl.value = minedTokens.toFixed(4);
    }
    
    // Update task completion visuals
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
        
        if (isCompleted) {
            task.style.background = 'var(--success)';
            task.style.color = 'white';
            const icon = task.querySelector('i');
            if (icon) icon.style.color = 'white';
            task.innerHTML = `<i class="fas fa-check"></i><h4>Completed</h4><p>Already boosted</p>`;
            task.style.cursor = 'default';
        }
    });
    
    if (minedTokens >= DAILY_LIMIT && (isMining || timerMiningActive)) {
        stopMining();
        const miningBtn = document.getElementById('start-mining-btn');
        if (miningBtn) {
            miningBtn.innerHTML = '<i class="fas fa-check"></i> Daily Limit Reached';
            miningBtn.disabled = true;
            miningBtn.classList.remove('btn-warning');
            miningBtn.classList.add('btn-primary');
        }
    }
}

// ---------- INITIALIZE APPLICATION ----------
async function initializeApp() {
    console.log("Initializing NRX Mining Platform...");
    
    try {
        await initializeSession();
        loadLocalProgress();
        updateUI();
        
        setInterval(saveState, 30000);
        
        // ---------- EVENT LISTENERS ----------
        
        // MODIFIED: Start Mining Button - now uses timer system
        const startMiningBtn = document.getElementById('start-mining-btn');
        if (startMiningBtn) {
            startMiningBtn.addEventListener('click', function(e) {
                console.log("Start Mining button clicked (Timer System)");
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
                    startMiningWithTimer(); // ← TIMER SYSTEM
                }
            });
        }
        
        // Mine Now Button (Boost)
        const mineNowBtn = document.getElementById('mine-now-btn');
        if (mineNowBtn) {
            mineNowBtn.addEventListener('click', function() {
                console.log("Mine Now button clicked");
                
                // Stop mining if active
                if (isMining || timerMiningActive) {
                    stopMining();
                }
                
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
                console.log("Withdraw button clicked");
                
                // Stop mining if active
                if (isMining || timerMiningActive) {
                    stopMining();
                }
                
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
        
        // Task Clicks - MODIFIED: Opens OGADS task
        const taskElements = document.querySelectorAll('.task');
        if (taskElements.length > 0) {
            taskElements.forEach(task => {
                task.addEventListener('click', async function() {
                    const taskId = this.getAttribute('data-task');
                    console.log(`Task ${taskId} clicked`);
                    
                    // Stop mining if active
                    if (isMining || timerMiningActive) {
                        stopMining();
                    }
                    
                    const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
                    if (isCompleted) {
                        alert("You've already completed this task!");
                        return;
                    }
                    
                    // Store task ID for boost application
                    pendingBoostId = taskId;
                    
                    // Show boost amount preview
                    const boostAmounts = {
                        '1': 5, '2': 10, '3': 15, 
                        '4': 20, '5': 8, '6': 12
                    };
                    const boostAmount = boostAmounts[taskId] || 10;
                    
                    // Update modal to show specific boost
                    const ogadsModal = document.getElementById('ogads-modal');
                    if (ogadsModal) {
                        const modalTitle = ogadsModal.querySelector('#modal-title');
                        if (modalTitle) {
                            modalTitle.textContent = `Complete Task for +${boostAmount} H/s Boost`;
                        }
                    }
                    
                    // Open OGADS task
                    openOGADSTask('boost');
                });
            });
        }
        
        // Confirm Withdrawal Button
        const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
        if (confirmWithdrawalBtn) {
            confirmWithdrawalBtn.addEventListener('click', async function() {
                console.log("Confirm Withdrawal button clicked");
                const walletAddressInput = document.getElementById('wallet-address');
                const withdrawalAmountInput = document.getElementById('withdrawal-amount');
                
                if (!walletAddressInput || !withdrawalAmountInput) {
                    alert("Form elements not found!");
                    return;
                }
                
                const walletAddress = walletAddressInput.value.trim();
                const withdrawalAmount = withdrawalAmountInput.value;
                
                if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
                    alert('Please enter a valid BNB Smart Chain wallet address (starts with 0x and 42 characters).');
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
                    
                    // Open OGADS task for withdrawal verification
                    openOGADSTask('withdraw');
                    
                } catch (error) {
                    alert(`Withdrawal failed: ${error.message}`);
                }
            });
        }
        
        // Modal Close Buttons
        document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const ogadsModal = document.getElementById('ogads-modal');
                const withdrawalModal = document.getElementById('withdrawal-modal');
                
                if (ogadsModal) ogadsModal.style.display = 'none';
                if (withdrawalModal) withdrawalModal.style.display = 'none';
                currentAction = null;
                pendingWithdrawal = null;
                
                // Clear verification timer
                if (verificationTimer) {
                    clearInterval(verificationTimer);
                    verificationTimer = null;
                }
                
                // Close OGADS window if open
                if (ogadsWindow && !ogadsWindow.closed) {
                    ogadsWindow.close();
                    ogadsWindow = null;
                }
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                const ogadsModal = document.getElementById('ogads-modal');
                const withdrawalModal = document.getElementById('withdrawal-modal');
                
                if (ogadsModal) ogadsModal.style.display = 'none';
                if (withdrawalModal) withdrawalModal.style.display = 'none';
                currentAction = null;
                pendingWithdrawal = null;
                
                if (verificationTimer) {
                    clearInterval(verificationTimer);
                    verificationTimer = null;
                }
                
                if (ogadsWindow && !ogadsWindow.closed) {
                    ogadsWindow.close();
                    ogadsWindow = null;
                }
            }
        });
        
        // Copy Contract Address
        const copyAddressBtn = document.getElementById('copy-address');
        if (copyAddressBtn) {
            copyAddressBtn.addEventListener('click', function() {
                const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
                navigator.clipboard.writeText(address).then(() => {
                    const original = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => this.innerHTML = original, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy address. Please copy manually.');
                });
            });
        }
        
        // Pause mining when tab is not visible
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && (isMining || timerMiningActive)) {
                stopMining();
            }
        });
        
        // Save on page unload
        window.addEventListener('beforeunload', function() {
            if (isMining || timerMiningActive) {
                stopMining();
            }
            saveState();
            
            // Close OGADS window if open
            if (ogadsWindow && !ogadsWindow.closed) {
                ogadsWindow.close();
            }
        });
        
        console.log("✅ NRX Mining Platform initialized successfully!");
        
    } catch (error) {
        console.error("Failed to initialize app:", error);
        alert("Failed to initialize the mining platform. Please refresh the page.");
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
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
}

// ---------- START APPLICATION ----------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM fully loaded, initializing app...");
        initializeApp();
        setInterval(updateCountdown, 1000);
        updateCountdown();
    });
} else {
    console.log("DOM already loaded, initializing app...");
    initializeApp();
    setInterval(updateCountdown, 1000);
    updateCountdown();
    }
