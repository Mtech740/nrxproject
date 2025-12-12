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
    
    loadLocalProgress();
    setupEventListeners();
    updateUI();
    startGlobalCountdown();
    
    console.log("✅ Platform Ready! Balance:", minedTokens.toFixed(4), "NRX");
    
    setInterval(saveLocalProgress, 30000);
    window.addEventListener('beforeunload', saveLocalProgress);
})();

// ==================== SAVE / LOAD ====================
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

// ==================== MINING SYSTEM ====================
function handleStartMining() {
    console.log('🔘 Start Mining clicked');
    
    if (ogadsForceLock) return alert('Please complete the current task first!');
    if (minedTokens >= DAILY_LIMIT) return alert("🎉 Daily limit reached!");
    
    if (isMining || timerMiningActive) stopMining();
    else startMiningWithTimer();
}

function startMiningWithTimer() {
    console.log('🚀 Starting mining session...');
    
    timerMiningActive = true;
    isMining = true;
    miningTimeLeft = 300;
    miningStartTime = Date.now();
    
    updateMiningButton(true);
    startActualMining();
    startCountdownTimer();
}

function startActualMining() {
    if (miningInterval) clearInterval(miningInterval);
    
    miningInterval = setInterval(() => {
        if (!isMining || ogadsForceLock) return;
        
        const tokensPerSecond = (miningSpeed / 20) * MINING_RATE;
        minedTokens = Math.min(minedTokens + tokensPerSecond, DAILY_LIMIT);
        
        updateUI();
        
        if (minedTokens >= DAILY_LIMIT) {
            stopMining();
            showNotification('🎉 Daily limit of 20 NRX reached!', 'success');
        }
    }, 1000);
}

function startCountdownTimer() {
    if (miningTimer) clearInterval(miningTimer);
    
    miningTimer = setInterval(() => {
        if (!timerMiningActive || ogadsForceLock) return;
        
        miningTimeLeft--;
        updateTimerDisplay();
        
        if (miningTimeLeft <= 0) {
            clearInterval(miningTimer);
            miningTimer = null;
            stopMining();
            openOGAdsLocker('timer');
        }
    }, 1000);
}

function stopMining() {
    console.log('🛑 Stopping mining...');
    
    isMining = false;
    timerMiningActive = false;
    
    if (miningInterval) clearInterval(miningInterval);
    if (miningTimer) clearInterval(miningTimer);
    
    updateMiningButton(false);
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
    const s = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ==================== UI ====================
function updateUI() {
    if (!uiElementsCache) {
        uiElementsCache = {
            minedEl: document.getElementById('mined-tokens'),
            speedEl: document.getElementById('mining-speed'),
            availEl: document.getElementById('available-tokens'),
            withdrawalAmountEl: document.getElementById('withdrawal-amount'),
            currentSpeedEl: document.getElementById('current-speed')
        };
    }
    
    const el = uiElementsCache;
    
    if (el.minedEl) el.minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    if (el.speedEl) el.speedEl.textContent = miningSpeed + " H/s";
    if (el.availEl) el.availEl.textContent = minedTokens.toFixed(4);
    if (el.currentSpeedEl) el.currentSpeedEl.textContent = miningSpeed;
    if (el.withdrawalAmountEl) el.withdrawalAmountEl.value = minedTokens.toFixed(4);
    
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
        
        const timerElement = document.getElementById('mining-timer');
        if (timerElement) timerElement.textContent = '05:00';
        
        const progressElement = document.getElementById('mining-progress');
        if (progressElement) progressElement.style.width = '0%';
    }
    
    miningBtn.disabled = ogadsForceLock;
}

function updateTaskVisuals() {
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.includes(`task-${taskId}`);
        
        if (isCompleted) {
            task.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            task.style.color = 'white';
            task.innerHTML =
                `<i class="fas fa-check-circle"></i>
                 <h4>Task Completed</h4>
                 <p>Already boosted</p>`;
            task.style.pointerEvents = 'none';
        }
    });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    const startBtn = document.getElementById('start-mining-btn');
    if (startBtn) startBtn.addEventListener('click', handleStartMining);
    
    const boostBtn = document.getElementById('mine-now-btn');
    if (boostBtn) boostBtn.addEventListener('click', handleBoostMining);

    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) withdrawBtn.addEventListener('click', handleWithdraw);

    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('click', () => {
            handleTaskClick(task.getAttribute('data-task'));
        });
    });

    const confirmBtn = document.getElementById('confirm-withdrawal');
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirmWithdrawal);

    document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

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

// ==================== ACTION HANDLERS ====================
function handleBoostMining() {
    if (ogadsForceLock) return alert('Complete the current task first!');
    if (!isMining) return alert('Start mining first!');
    openOGAdsLocker('boost');
}

function handleWithdraw() {
    if (ogadsForceLock) return alert('Complete the current task first!');
    if (minedTokens < 0.001) return alert('Minimum withdrawal is 0.001 NRX');
    
    const modal = document.getElementById('withdrawal-modal');
    if (modal) modal.style.display = 'block';
}

function handleTaskClick(taskId) {
    if (completedTasks.includes(`task-${taskId}`)) return alert('Task already completed!');
    pendingBoostId = taskId;
    openOGAdsLocker('task');
}

function handleConfirmWithdrawal() {
    const walletInput = document.getElementById('wallet-address');
    const amountInput = document.getElementById('withdrawal-amount');
    
    const wallet = walletInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!wallet.startsWith('0x') || wallet.length !== 42) return alert('Enter valid BSC address');
    if (amount > minedTokens) return alert('Amount exceeds balance');
    if (amount < 0.001) return alert('Minimum withdrawal is 0.001 NRX');
    
    minedTokens -= amount;
    updateUI();
    saveLocalProgress();
    
    document.getElementById('withdrawal-modal').style.display = 'none';
    showNotification(`✅ Withdrawal of ${amount.toFixed(4)} NRX initiated!`, 'success');
}

// ==================== OGADS LOCKER ====================
function openOGAdsLocker(type) {
    stopMining();
    saveLocalProgress();
    
    ogadsForceLock = true;
    updateMiningButton(false);
    
    const container = document.createElement('div');
    container.id = 'ogads-container';
    container.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        background: #000; z-index: 99999;
        display: flex; flex-direction: column;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        background: #1a1a2e; color: white; padding: 15px;
        border-bottom: 2px solid #f39c12;
        display: flex; justify-content: space-between; align-items: center;
    `;
    header.innerHTML = `
        <div>
            <h3 style="margin:0;color:#f39c12;">
                <i class="fas fa-tasks"></i> Complete Task to Continue Mining
            </h3>
            <p style="margin:5px 0 0;color:#ccc;">Complete one offer below</p>
        </div>
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = 'Close & Continue';
    closeBtn.style.cssText = `
        background:#f39c12;color:white;border:none;
        padding:8px 15px;border-radius:5px;font-weight:bold;
    `;
    closeBtn.onclick = () => completeOGAdsTask(type);
    header.appendChild(closeBtn);

    const iframe = document.createElement('iframe');
    iframe.src = OGADS_DIRECT_LINK;
    iframe.style.cssText = `
        flex:1;width:100%;border:none;background:white;
    `;
    
    container.appendChild(header);
    container.appendChild(iframe);
    document.body.appendChild(container);
}

function completeOGAdsTask(type) {
    const box = document.getElementById('ogads-container');
    if (box) box.remove();
    
    ogadsForceLock = false;
    applyOGAdsReward(type);
    saveLocalProgress();
}

function applyOGAdsReward(type) {
    if (type === 'timer') {
        setTimeout(() => startMiningWithTimer(), 1000);

    } else if (type === 'boost') {
        const boostAmount = 15;
        miningSpeed += boostAmount;
        updateUI();

        showNotification(`🎉 Boost +15 H/s activated!`, 'success');

        const btn = document.getElementById('mine-now-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-bolt"></i> Boost Active';
            btn.classList.add('btn-success');
            btn.disabled = true;
        }

        setTimeout(() => {
            miningSpeed -= boostAmount;
            updateUI();

            if (btn) {
                btn.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining';
                btn.classList.remove('btn-success');
                btn.disabled = false;
            }
        }, 60 * 60 * 1000);

    } else if (type === 'task' && pendingBoostId) {
        const boosts = { '1': 5, '2': 10, '3': 15, '4': 20, '5': 8, '6': 12 };
        const amount = boosts[pendingBoostId] || 10;
        
        miningSpeed += amount;
        completedTasks.push(`task-${pendingBoostId}`);
        pendingBoostId = null;
        
        showNotification(`🎉 Task completed! +${amount} H/s`, 'success');
    }

    updateUI();
}

// ==================== DAILY RESET COUNTDOWN ====================
function startGlobalCountdown() {
    const countdownEl = document.getElementById('daily-countdown');
    if (!countdownEl) return;

    function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setUTCHours(24, 0, 0, 0);

        const diff = tomorrow - now;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.textContent =
            `${hours.toString().padStart(2, '0')}:` +
            `${minutes.toString().padStart(2, '0')}:` +
            `${seconds.toString().padStart(2, '0')}`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message, type = 'info') {
    const box = document.createElement('div');
    box.className = `nrx-notification ${type}`;
    box.innerText = message;

    box.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${type === 'success' ? '#2ecc71'
                     : type === 'error' ? '#e74c3c'
                     : '#3498db'};
        color: white; padding: 12px 18px; border-radius: 8px;
        font-size: 14px; z-index: 99999;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        opacity: 1; transition: opacity 0.5s;
    `;

    document.body.appendChild(box);

    setTimeout(() => {
        box.style.opacity = '0';
        setTimeout(() => box.remove(), 500);
    }, 3000);
}

// ==================== SAFETY FALLBACK ====================
window.addEventListener('error', (e) => {
    console.error("Runtime error:", e);
    saveLocalProgress();
});

// ==================== END OF FULL SCRIPT ====================
console.log("✅ script.js fully loaded");
