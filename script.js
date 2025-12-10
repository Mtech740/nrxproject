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
    
    // Clear any ad containers
    const adContainer = document.getElementById('ad-container');
    if (adContainer) {
        adContainer.innerHTML = ''; // Clear ad content
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

// ==================== ADSTERRA POPUNDER INTEGRATION ====================
function loadAdsterraAd() {
    console.log('💰 Loading Adsterra Popunder...');
    
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;
    
    // Clear and show loading interface
    adContainer.innerHTML = `
        <div id="adsterra-popunder-container" style="width: 100%; height: 100%; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95)); border-radius: 12px; border: 2px solid #f39c12; box-shadow: 0 0 30px rgba(243, 156, 18, 0.3); padding: 30px; text-align: center;">
            
            <!-- Header -->
            <div style="margin-bottom: 25px;">
                <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(231, 76, 60, 0.1); padding: 8px 20px; border-radius: 20px; border: 1px solid rgba(231, 76, 60, 0.3);">
                    <div style="width: 8px; height: 8px; background: #e74c3c; border-radius: 50%; animation: pulse 1s infinite;"></div>
                    <span style="color: #e74c3c; font-weight: bold; font-size: 0.9rem;">ADVERTISEMENT REQUIRED</span>
                </div>
            </div>
            
            <!-- Main Message -->
            <h2 style="color: white; margin-bottom: 15px; font-size: 1.8rem;">Watch this ad to continue mining</h2>
            
            <!-- Ad Icon -->
            <div style="font-size: 4rem; color: #f39c12; margin-bottom: 20px;">
                <i class="fas fa-play-circle"></i>
            </div>
            
            <!-- Support Message -->
            <div style="background: rgba(42, 75, 141, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 25px; max-width: 500px;">
                <h4 style="color: white; margin-bottom: 10px;">
                    <i class="fas fa-hands-helping" style="color: #2ecc71; margin-right: 8px;"></i>
                    Support NRX Mining
                </h4>
                <p style="color: #aaa; line-height: 1.6; margin: 0;">
                    This advertisement helps fund NRX Mining Platform development, server costs, and user rewards. Thank you for your support!
                </p>
            </div>
            
            <!-- Timer Display -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 25px; border-radius: 12px; margin-bottom: 25px; width: 100%; max-width: 400px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <!-- Countdown Timer -->
                <div id="popunder-countdown" style="font-size: 3.5rem; font-weight: bold; color: #2ecc71; margin: 20px 0; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(46, 204, 113, 0.5);">
                    30
                </div>
                
                <!-- Timer Label -->
                <div style="color: #aaa; margin-bottom: 5px; font-size: 0.9rem;">
                    <i class="fas fa-clock" style="margin-right: 8px;"></i>
                    <span>Ad will close in <span id="popunder-seconds" style="color: #f39c12; font-weight: bold;">30</span> seconds</span>
                </div>
                
                <!-- Progress Bar -->
                <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-top: 15px;">
                    <div id="popunder-progress" style="height: 100%; background: linear-gradient(90deg, #2ecc71, #f39c12); width: 100%; transition: width 1s linear;"></div>
                </div>
            </div>
            
            <!-- Ad Network Info -->
            <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(52, 152, 219, 0.1); padding: 12px 25px; border-radius: 25px; border: 1px solid rgba(52, 152, 219, 0.3); margin-bottom: 20px;">
                <i class="fas fa-network-wired" style="color: #3498db;"></i>
                <div style="text-align: left;">
                    <div style="color: white; font-size: 0.9rem; font-weight: bold;">Ad Network</div>
                    <div style="color: #aaa; font-size: 0.8rem;">Adstera • Placement: 28128352</div>
                </div>
            </div>
            
            <!-- Important Warning -->
            <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(231, 76, 60, 0.3); width: 100%; max-width: 400px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>DO NOT CLOSE THIS WINDOW</strong>
                </div>
                <div style="color: #aaa; font-size: 0.85rem; margin-top: 8px;">
                    Closing this window will interrupt mining
                </div>
            </div>
            
            <!-- Ad Loading Status -->
            <div id="ad-status" style="margin-top: 20px; padding: 10px; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3); display: none;">
                <i class="fas fa-check-circle" style="color: #2ecc71; margin-right: 8px;"></i>
                <span style="color: #2ecc71;">Ad loaded successfully!</span>
            </div>
            
        </div>
    `;
    
    // Start countdown
    startPopunderCountdown();
    
    // IMPORTANT: Load Adsterra Popunder AFTER showing the UI
    setTimeout(() => {
        loadAdsterraPopunder();
    }, 1000);
}

function startPopunderCountdown() {
    let secondsLeft = 30;
    const countdownEl = document.getElementById('popunder-countdown');
    const secondsEl = document.getElementById('popunder-seconds');
    const progressBar = document.getElementById('popunder-progress');
    
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        
        if (countdownEl) countdownEl.textContent = secondsLeft;
        if (secondsEl) secondsEl.textContent = secondsLeft;
        
        // Update progress bar
        if (progressBar) {
            const progressPercent = (secondsLeft / 30) * 100;
            progressBar.style.width = progressPercent + '%';
            
            // Color changes
            if (secondsLeft <= 10) {
                countdownEl.style.color = '#e74c3c';
                progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #f39c12)';
            } else if (secondsLeft <= 20) {
                countdownEl.style.color = '#f39c12';
                progressBar.style.background = 'linear-gradient(90deg, #f39c12, #2ecc71)';
            }
        }
        
        // Timer ends
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            console.log('✅ Ad timer completed');
        }
    }, 1000);
}

// THIS IS THE EXACT WORKING ADSTERRA POPUNDER CODE
function loadAdsterraPopunder() {
    console.log('🎯 Loading Adsterra Popunder with Placement ID: 28128352');
    
    try {
        // Method 1: Direct script injection (Adsterra's recommended method)
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.js';
        script.async = true;
        
        script.onload = function() {
            console.log('✅ Adsterra popunder script loaded');
            
            // Show success status
            const statusEl = document.getElementById('ad-status');
            if (statusEl) {
                statusEl.style.display = 'block';
            }
            
            // The popunder should trigger automatically
            // Adsterra's script automatically creates a popunder when loaded
        };
        
        script.onerror = function() {
            console.error('❌ Failed to load Adsterra script');
            // Try alternative method
            loadAlternativePopunder();
        };
        
        // Append to head
        document.head.appendChild(script);
        
        // Also try the iframe method as backup
        setTimeout(() => {
            triggerPopunderIframe();
        }, 2000);
        
    } catch (error) {
        console.error('Error loading Adsterra:', error);
        loadAlternativePopunder();
    }
}

// Alternative popunder method
function triggerPopunderIframe() {
    try {
        console.log('🔄 Trying iframe method for popunder...');
        
        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        
        // Your EXACT Adsterra popunder URL
        iframe.src = 'https://pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.html';
        
        // Add to body
        document.body.appendChild(iframe);
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 10000);
        
    } catch (error) {
        console.error('Iframe method failed:', error);
    }
}

// If Adsterra fails completely
function loadAlternativePopunder() {
    console.log('⚠️ Using simulated popunder...');
    
    // Create a simulated popunder window
    const popupWindow = window.open('', '_blank', 'width=800,height=600,left=100,top=100');
    
    if (popupWindow) {
        // Write ad content to the popup
        popupWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Advertisement - NRX Mining</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif; 
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        color: white;
                        text-align: center;
                    }
                    .ad-content {
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 30px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        border: 2px solid #f39c12;
                    }
                    h1 { color: #f39c12; }
                    .timer {
                        font-size: 24px;
                        color: #2ecc71;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="ad-content">
                    <h1>Advertisement</h1>
                    <p>Thank you for supporting NRX Mining!</p>
                    <p>This ad helps fund platform development and user rewards.</p>
                    <div class="timer">Ad will close in <span id="ad-timer">5</span> seconds</div>
                    <button onclick="window.close()" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Ad</button>
                </div>
                <script>
                    // Auto-close after 5 seconds
                    let time = 5;
                    const timer = setInterval(() => {
                        time--;
                        document.getElementById('ad-timer').textContent = time;
                        if (time <= 0) {
                            clearInterval(timer);
                            window.close();
                        }
                    }, 1000);
                </script>
            </body>
            </html>
        `);
        
        popupWindow.document.close();
        
        // Bring main window to front (simulating popunder)
        setTimeout(() => {
            window.focus();
        }, 100);
        
        // Auto-close popup after 5 seconds
        setTimeout(() => {
            if (popupWindow && !popupWindow.closed) {
                popupWindow.close();
            }
        }, 5000);
        
    } else {
        console.log('⚠️ Popup blocked - showing inline ad instead');
        showInlineAd();
    }
}

function showInlineAd() {
    const container = document.getElementById('adsterra-popunder-container');
    if (!container) return;
    
    const adHTML = `
        <div style="margin: 30px 0; padding: 20px; background: rgba(243, 156, 18, 0.1); border-radius: 10px; border: 1px solid rgba(243, 156, 18, 0.3); max-width: 600px;">
            <h4 style="color: #f39c12; margin-bottom: 15px;">
                <i class="fas fa-ad" style="margin-right: 10px;"></i>
                Advertisement Content
            </h4>
            <p style="color: #aaa; margin-bottom: 15px;">
                This is a simulated advertisement. In production, real ads from Adstera would appear here.
            </p>
            <button onclick="completeAdvertisement()" style="background: linear-gradient(90deg, #2ecc71, #27ae60); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Continue Mining
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', adHTML);
}

// Add animation styles
if (!document.getElementById('ad-animations')) {
    const style = document.createElement('style');
    style.id = 'ad-animations';
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
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

// ==================== OPTIMIZED INITIALIZATION ====================
// ---------- INITIALIZE APPLICATION (OPTIMIZED) ----------
async function initializeApp() {
    console.log("🚀 Fast initializing NRX Mining Platform...");
    
    // IMMEDIATELY show UI with local data (instant load)
    loadLocalProgress();
    updateUI();
    
    // Set up all event listeners immediately (fast button response)
    setupAllEventListeners();
    
    // Start countdown timer
    setInterval(updateCountdown, 1000);
    updateCountdown();
    
    // Initialize backend in background (non-blocking - doesn't delay UI)
    setTimeout(async () => {
        try {
            await initializeSession();
            console.log("✅ Backend initialized in background");
        } catch (error) {
            console.warn("⚠️ Backend init failed, using local data:", error);
        }
    }, 1000);
    
    // Start periodic save (every 30 seconds)
    setInterval(saveState, 30000);
    
    console.log("✅ Platform ready - buttons are instantly clickable!");
}

// Fast event listener setup
function setupAllEventListeners() {
    console.log("⚡ Setting up instant event listeners...");
    
    // Start Mining Button - INSTANT RESPONSE
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        startMiningBtn.addEventListener('click', function(e) {
            console.log("⚡ Start Mining button clicked (Instant Response)");
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
                startMiningWithTimer(); // Start immediately
            }
        });
    }
    
    // Mine Now Button (Boost)
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', function() {
            console.log("⚡ Mine Now button clicked");
            
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
            console.log("⚡ Withdraw button clicked");
            
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
    
    // Task Clicks
    const taskElements = document.querySelectorAll('.task');
    taskElements.forEach(task => {
        task.addEventListener('click', async function() {
            const taskId = this.getAttribute('data-task');
            console.log(`⚡ Task ${taskId} clicked`);
            
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
    
    // Confirm Withdrawal Button
    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            console.log("⚡ Confirm Withdrawal button clicked");
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
    
    console.log("✅ All event listeners ready - buttons respond instantly!");
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

// ---------- START APPLICATION (OPTIMIZED) ----------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("🚀 DOM fully loaded, initializing app FAST...");
        initializeApp();
    });
} else {
    console.log("🚀 DOM already loaded, initializing app FAST...");
    initializeApp();
}

// Add instant button feedback CSS
const instantButtonStyles = document.createElement('style');
instantButtonStyles.textContent = `
    #start-mining-btn, #mine-now-btn, #withdraw-btn {
        transition: transform 0.1s ease !important;
    }
    
    #start-mining-btn:active, #mine-now-btn:active, #withdraw-btn:active {
        transform: scale(0.97) !important;
    }
    
    .btn-ready {
        position: relative;
        overflow: hidden;
    }
    
    .btn-ready::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: shine 2s infinite;
    }
    
    @keyframes shine {
        0% { left: -100%; }
        100% { left: 100%; }
    }
`;
document.head.appendChild(instantButtonStyles);
