// ==================== AD-MAVEN TIMER SYSTEM ====================
let miningTimeLeft = 300;
let adTimeLeft = 30;
let miningTimer = null;
let adTimer = null;
let isAdShowing = false;
let timerMiningActive = false;

// ==================== CONFIG & STATE ====================
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";
const DAILY_LIMIT = 20;
const BASE_MINING_SPEED = 20;

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
let miningStartTime = null;
let totalMiningSeconds = 0;

// ==================== INSTANT UI INITIALIZATION ====================
// This runs IMMEDIATELY when script loads
(function initializeUIInstantly() {
    console.log("⚡ INSTANT UI Initialization...");
    
    // 1. IMMEDIATELY load local progress
    loadLocalProgress();
    
    // 2. IMMEDIATELY update UI
    updateUI();
    
    // 3. IMMEDIATELY setup basic event listeners
    setupInstantEventListeners();
    
    // 4. Start countdown timer
    if (typeof updateCountdown === 'function') {
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }
    
    console.log("✅ UI Ready - Buttons are clickable NOW!");
})();

// Load local progress instantly
function loadLocalProgress() {
    try {
        const saved = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (saved) {
            const progress = JSON.parse(saved);
            minedTokens = progress.minedTokens || 0;
            miningSpeed = progress.miningSpeed || BASE_MINING_SPEED;
            completedTasks = progress.completedTasks || [];
            sessionId = progress.sessionId || `local-${Date.now()}`;
            console.log("📊 Loaded local progress");
        }
    } catch (error) {
        console.error('Error loading local progress:', error);
    }
}

// Update UI instantly
function updateUI() {
    // Update mined tokens
    const minedEl = document.getElementById('mined-tokens');
    if (minedEl) {
        minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    }
    
    // Update mining speed
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) {
        speedEl.textContent = miningSpeed + " H/s";
    }
    
    // Update available tokens
    const availEl = document.getElementById('available-tokens');
    if (availEl) {
        availEl.textContent = minedTokens.toFixed(4);
    }
    
    // Update withdrawal amount
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');
    if (withdrawalAmountEl) {
        withdrawalAmountEl.value = minedTokens.toFixed(4);
    }
    
    // Update current speed display
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) {
        currentSpeedEl.textContent = miningSpeed;
    }
    
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
    
    // Start Mining Button - INSTANT RESPONSE
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        // Remove any existing listeners
        startMiningBtn.replaceWith(startMiningBtn.cloneNode(true));
        const newBtn = document.getElementById('start-mining-btn');
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("⚡ Start Mining button CLICKED");
            
            // Quick validation
            if (minedTokens >= DAILY_LIMIT) {
                alert("Daily limit reached! Come back tomorrow.");
                return;
            }
            
            if (isAdShowing) {
                alert("Please complete the advertisement first!");
                return;
            }
            
            // Toggle mining state
            if (isMining || timerMiningActive) {
                stopMining();
            } else {
                startMiningWithTimer();
            }
        });
        
        // Add visual feedback
        newBtn.style.cursor = 'pointer';
        newBtn.style.transition = 'transform 0.1s';
        newBtn.addEventListener('mousedown', () => newBtn.style.transform = 'scale(0.98)');
        newBtn.addEventListener('mouseup', () => newBtn.style.transform = 'scale(1)');
        newBtn.addEventListener('mouseleave', () => newBtn.style.transform = 'scale(1)');
    }
    
    // Mine Now Button
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', function() {
            console.log("⚡ Mine Now button clicked");
            
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
    
    // Task Buttons
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task');
            console.log(`⚡ Task ${taskId} clicked`);
            
            if (isMining || timerMiningActive) {
                stopMining();
            }
            
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
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Copy Address Button
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
    
    console.log("✅ All buttons are NOW clickable!");
}

function closeAllModals() {
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

// ==================== MINING FUNCTIONS ====================
function startMiningWithTimer() {
    if (isMining || minedTokens >= DAILY_LIMIT) {
        if (minedTokens >= DAILY_LIMIT) {
            alert("Daily limit reached! Come back tomorrow.");
        }
        return;
    }
    
    console.log('🚀 Starting mining with timer');
    timerMiningActive = true;
    
    startMining();
    startCountdown();
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
            
            // Save every 30 seconds
            if (Date.now() % 30000 < 100) {
                saveState();
            }
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

// ==================== TIMER FUNCTIONS ====================
function startCountdown() {
    miningTimeLeft = 300;
    updateMiningTimer();
    
    miningTimer = setInterval(() => {
        miningTimeLeft--;
        updateMiningTimer();
        
        const progressPercent = ((300 - miningTimeLeft) / 300) * 100;
        const progressBar = document.getElementById('mining-progress');
        if (progressBar) {
            progressBar.style.width = progressPercent + '%';
        }
        
        const timeUntilAd = document.getElementById('time-until-ad');
        if (timeUntilAd) {
            timeUntilAd.textContent = formatTime(miningTimeLeft);
        }
        
        if (miningTimeLeft === 60) flashWarning('1 minute until ad!');
        if (miningTimeLeft === 30) flashWarning('30 seconds until ad!');
        if (miningTimeLeft === 10) flashWarning('10 seconds until ad!');
        
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
        const timeString = formatTime(miningTimeLeft);
        timerElement.textContent = timeString;
        
        if (miningTimeLeft <= 30) {
            timerElement.style.color = '#e74c3c';
        } else if (miningTimeLeft <= 60) {
            timerElement.style.color = '#f39c12';
        } else {
            timerElement.style.color = '#2ecc71';
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
}

// ==================== AD SYSTEM ====================
function showAdvertisement() {
    console.log('📺 Showing advertisement');
    isAdShowing = true;
    timerMiningActive = false;
    
    stopMining();
    
    const adOverlay = document.getElementById('ad-overlay');
    if (adOverlay) {
        adOverlay.style.display = 'block';
    }
    
    startAdCountdown();
    loadAdsterraAd();
}

function startAdCountdown() {
    adTimeLeft = 30;
    updateAdTimer();
    
    adTimer = setInterval(() => {
        adTimeLeft--;
        updateAdTimer();
        
        if (adTimeLeft === 10) {
            const adCountdown = document.getElementById('ad-countdown');
            if (adCountdown) {
                adCountdown.style.color = '#e74c3c';
            }
        }
        
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
        
        if (adTimeLeft > 20) {
            adTimerElement.style.color = '#2ecc71';
        } else if (adTimeLeft > 10) {
            adTimerElement.style.color = '#f39c12';
        }
    }
}

function completeAdvertisement() {
    console.log('✅ Ad completed');
    isAdShowing = false;
    
    const adOverlay = document.getElementById('ad-overlay');
    if (adOverlay) {
        adOverlay.style.display = 'none';
    }
    
    const adContainer = document.getElementById('ad-container');
    if (adContainer) {
        adContainer.innerHTML = '';
    }
    
    miningSpeed = Math.max(10, Math.floor(miningSpeed * 0.9));
    
    const currentSpeedEl = document.getElementById('current-speed');
    if (currentSpeedEl) {
        currentSpeedEl.textContent = miningSpeed;
    }
    
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) {
        speedEl.textContent = miningSpeed + " H/s";
    }
    
    alert(`🎉 ADVERTISEMENT COMPLETED!\n\n✅ Mining resumed\n⚡ Speed: ${miningSpeed} H/s\n⏰ Next ad in 5 minutes`);
    
    setTimeout(() => {
        startMiningWithTimer();
    }, 3000);
}

// ==================== ADSTERRA AD ====================
function loadAdsterraAd() {
    console.log('💰 Loading advertisement...');
    
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;
    
    adContainer.innerHTML = `
        <div style="width: 100%; height: 100%; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95)); border-radius: 12px; border: 2px solid #f39c12; padding: 30px; text-align: center;">
            <h2 style="color: white; margin-bottom: 20px;">ADVERTISEMENT REQUIRED</h2>
            <p style="color: #aaa; margin-bottom: 30px; max-width: 500px;">
                Watch this ad to continue mining. This advertisement helps fund NRX Mining Platform development.
            </p>
            
            <!-- SIMPLE ADSTERRA SCRIPT -->
            <script type="text/javascript">
                atOptions = {
                    'key' : '1e50a2f9fa163cc52b0f97675681b8a4',
                    'format' : 'iframe',
                    'height' : 90,
                    'width' : 728,
                    'params' : {}
                };
                document.write('<scr' + 'ipt type="text/javascript" src="//www.profitablecreativeformat.com/1e50a2f9fa163cc52b0f97675681b8a4/invoke.js"></scr' + 'ipt>');
            <\/script>
            
            <div style="margin-top: 30px; color: #f39c12; font-size: 2rem;" id="simple-countdown">30</div>
            <p style="color: #aaa; margin-top: 10px;">seconds until mining resumes</p>
            
            <div style="margin-top: 30px; padding: 15px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border: 1px solid rgba(231, 76, 60, 0.3); max-width: 400px;">
                <p style="color: #e74c3c; margin: 0;"><strong>DO NOT CLOSE THIS WINDOW</strong></p>
                <p style="color: #aaa; font-size: 0.9rem; margin-top: 5px;">Closing will interrupt mining</p>
            </div>
        </div>
    `;
    
    // Simple countdown
    let seconds = 30;
    const countdown = setInterval(() => {
        seconds--;
        const countdownEl = document.getElementById('simple-countdown');
        if (countdownEl) countdownEl.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(countdown);
            completeAdvertisement();
        }
    }, 1000);
}

// ==================== BACKEND FUNCTIONS (NON-BLOCKING) ====================
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        
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
            console.log("✅ Session restored from backend");
        } catch (error) {
            console.log("⚠️ Using local session");
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
        console.error('Failed to create session:', error);
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
    const progress = {
        minedTokens,
        miningSpeed,
        completedTasks,
        lastSave: Date.now(),
        sessionId
    };
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
                <div style="font-size: 3rem; color: #f39c12; margin-bottom: 20px;">
                    <i class="fas fa-external-link-alt"></i>
                </div>
                <h3 style="color: var(--primary); margin-bottom: 15px;">Task Opened in New Tab</h3>
                <p style="margin-bottom: 25px; color: var(--dark);">
                    Please complete the task in the new tab to receive your mining speed boost.
                </p>
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

// ==================== INITIALIZE BACKEND (NON-BLOCKING) ====================
// This runs AFTER UI is already interactive
setTimeout(async () => {
    console.log("🔄 Initializing backend in background...");
    try {
        await initializeSession();
        console.log("✅ Backend initialized");
    } catch (error) {
        console.warn("⚠️ Backend initialization failed, using local data");
    }
    
    // Start auto-save
    setInterval(saveState, 30000);
}, 2000);

// ==================== PAGE EVENT LISTENERS ====================
document.addEventListener('visibilitychange', function() {
    if (document.hidden && (isMining || timerMiningActive)) {
        stopMining();
    }
});

window.addEventListener('beforeunload', function() {
    if (isMining || timerMiningActive) {
        stopMining();
    }
    saveState();
    
    if (ogadsWindow && !ogadsWindow.closed) {
        ogadsWindow.close();
    }
});

// Add instant button styles
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

console.log("✅ NRX Mining Platform Script Loaded Successfully!");
