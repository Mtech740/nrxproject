// ========== CONFIGURATION ==========
const BACKEND_URL = "https://nrx-backend-2.onrender.com";
const OGADS_URL = "https://lockedapp.org/cl/i/j76pvj";
const SESSION_STORAGE_KEY = "nrx_session_id";
const LOCAL_PROGRESS_KEY = "nrxMiningData";

// Mining Configuration
const DAILY_LIMIT = 20; // NRX per day
const BASE_MINING_SPEED = 20; // H/s
const MINING_CYCLE_MINUTES = 5; // 5-minute mining windows
const MINING_CYCLE_MS = MINING_CYCLE_MINUTES * 60 * 1000;

// Withdrawal Configuration
const WITHDRAWALS_PER_DAY = 2;
const WITHDRAWAL_DELAY_MINUTES = 15;
const WITHDRAWAL_VERIFICATION_REQUIRED = true;

// Revenue Target Configuration
const DAILY_REVENUE_TARGET = 180; // $150-$200 target
const REVENUE_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

// ========== STATE MANAGEMENT ==========
let sessionId = null;
let minedTokens = 0;
let miningSpeed = BASE_MINING_SPEED;
let isMining = false;
let miningInterval = null;
let completedTasks = [];
let completedMiningCycles = 0;
let pendingWithdrawal = null;
let currentAction = null;
let dailyResetChecked = false;
let activeBoosts = 0;

// Mining Session Tracking
let miningStartTime = null;
let currentCycleStartTime = null;
let totalMiningSeconds = 0;
let cycleProgress = 0; // 0-100%
let cyclesCompletedToday = 0;
let maxCyclesPerDay = Math.floor(480 / MINING_CYCLE_MINUTES); // 8 hours total

// Task Rotation System
const TASK_TYPES = {
    APP_INSTALL: 'app_install',
    APP_INSTALL_SIGNUP: 'app_install_signup',
    HIGH_EPC_SURVEY: 'high_epc_survey',
    SIGNUP_TASK: 'signup_task',
    VIDEO_WATCH: 'video_watch'
};

let taskRotationHistory = [];
let currentTaskType = null;

// Revenue Tracking
let revenueToday = 0;
let tasksCompletedToday = 0;
let lastRevenueCheck = Date.now();

// Withdrawal Tracking
let withdrawalsToday = 0;
let withdrawalHistory = [];

// ========== OGADS PROTECTION SYSTEM ==========
class OGADSProtectionSystem {
    constructor() {
        this.verificationActive = false;
        this.verificationStartTime = null;
        this.currentVerificationId = null;
        this.verificationWindow = null;
        this.blockerElement = null;
        this.heartbeatInterval = null;
    }

    // 🔒 PILLAR 1: Force task completion
    async requireTaskCompletion(actionType, actionData = {}) {
        return new Promise(async (resolve, reject) => {
            // Stop mining immediately
            this.stopAllMining();
            
            // Block UI completely
            this.blockUI();
            
            // Generate verification ID
            this.currentVerificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.verificationStartTime = Date.now();
            this.verificationActive = true;
            
            // Select appropriate task type
            const taskType = this.selectTaskType(actionType, actionData);
            currentTaskType = taskType;
            
            // Store verification state (prevent refresh bypass)
            localStorage.setItem('nrx_active_verification', JSON.stringify({
                id: this.currentVerificationId,
                actionType,
                taskType,
                startTime: this.verificationStartTime,
                data: actionData,
                completed: false
            }));
            
            // Save session state
            await this.saveVerificationState();
            
            // Start heartbeat to prevent timeout bypass
            this.startHeartbeat();
            
            // Open OGADS verification
            this.openVerificationWindow(taskType, actionData)
                .then(() => {
                    // Task completed successfully
                    this.handleVerificationSuccess(actionType, actionData);
                    resolve(true);
                })
                .catch((error) => {
                    // Task failed or timed out
                    this.handleVerificationFailure(error);
                    reject(error);
                });
        });
    }

    selectTaskType(actionType, actionData) {
        // Avoid same task twice in a row
        let availableTypes = Object.values(TASK_TYPES);
        
        if (taskRotationHistory.length > 0) {
            const lastTask = taskRotationHistory[taskRotationHistory.length - 1];
            availableTypes = availableTypes.filter(type => type !== lastTask);
        }
        
        // Prioritize high-value tasks for withdrawals
        if (actionType === 'withdraw') {
            return TASK_TYPES.HIGH_EPC_SURVEY;
        }
        
        // Rotate through task types
        const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        taskRotationHistory.push(selectedType);
        
        // Keep history manageable
        if (taskRotationHistory.length > 5) {
            taskRotationHistory.shift();
        }
        
        return selectedType;
    }

    openVerificationWindow(taskType, actionData) {
        return new Promise((resolve, reject) => {
            // Create secure overlay
            this.createSecureOverlay();
            
            // Set timeout (10 minutes max)
            const timeout = setTimeout(() => {
                this.handleVerificationTimeout(reject);
            }, 10 * 60 * 1000);
            
            // Listen for completion messages
            window.addEventListener('message', (event) => {
                if (event.data?.ogadsCompleted || event.data?.taskCompleted) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
            
            // Prevent all bypass methods
            this.preventBypassMethods(reject);
        });
    }

    createSecureOverlay() {
        // Create full-screen blocker
        this.blockerElement = document.createElement('div');
        this.blockerElement.id = 'ogads-security-overlay';
        this.blockerElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        // Add security message
        const message = document.createElement('div');
        message.style.cssText = `
            text-align: center;
            color: white;
            max-width: 600px;
            padding: 30px;
            background: rgba(0,0,0,0.7);
            border-radius: 15px;
            border: 2px solid var(--primary);
            margin-bottom: 20px;
        `;
        message.innerHTML = `
            <i class="fas fa-lock" style="font-size: 48px; color: var(--primary); margin-bottom: 20px;"></i>
            <h2 style="color: var(--primary); margin-bottom: 15px;">Verification Required</h2>
            <p style="margin-bottom: 10px;">Complete one task to continue mining</p>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">
                <i class="fas fa-exclamation-circle"></i> Do not close or refresh this page
            </p>
            <p style="font-size: 12px; opacity: 0.6;">Verification ID: ${this.currentVerificationId.substring(0, 8)}</p>
        `;
        
        // Create iframe for OGADS
        const iframe = document.createElement('iframe');
        iframe.id = 'ogads-task-frame';
        iframe.src = OGADS_URL;
        iframe.style.cssText = `
            width: 95%;
            max-width: 800px;
            height: 70%;
            border: 3px solid var(--primary);
            border-radius: 10px;
            background: white;
        `;
        iframe.sandbox = "allow-same-origin allow-scripts allow-forms allow-popups allow-modals";
        
        // Add to page
        this.blockerElement.appendChild(message);
        this.blockerElement.appendChild(iframe);
        document.body.appendChild(this.blockerElement);
        this.verificationWindow = this.blockerElement;
    }

    preventBypassMethods(reject) {
        // Prevent back button
        history.pushState(null, null, location.href);
        window.addEventListener('popstate', (e) => {
            history.pushState(null, null, location.href);
            alert('⚠️ Complete the task before leaving!');
        });
        
        // Prevent refresh
        window.addEventListener('beforeunload', (e) => {
            if (this.verificationActive) {
                e.preventDefault();
                e.returnValue = 'Are you sure? Task progress will be lost!';
                return e.returnValue;
            }
        });
        
        // Prevent keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.verificationActive) {
                if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
                    e.preventDefault();
                    alert('⚠️ Complete the task before refreshing!');
                }
                if (e.key === 'Tab') {
                    // Track tab switching
                    this.handleTabSwitch();
                }
            }
        });
        
        // Detect page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.verificationActive) {
                this.handlePageHide();
            }
        });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.verificationActive) {
                // Update verification state
                localStorage.setItem('nrx_verification_heartbeat', Date.now().toString());
                
                // Check if user tried to bypass
                this.checkBypassAttempts();
            }
        }, 5000);
    }

    checkBypassAttempts() {
        // Check if verification window is still in DOM
        if (!document.body.contains(this.verificationWindow)) {
            this.handleBypassAttempt();
        }
        
        // Check if iframe is still loaded
        const iframe = document.getElementById('ogads-task-frame');
        if (!iframe || iframe.src !== OGADS_URL) {
            this.handleBypassAttempt();
        }
    }

    handleBypassAttempt() {
        alert('❌ Security violation detected! Mining disabled.');
        this.stopAllMining();
        localStorage.removeItem('nrx_active_verification');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        location.reload(); // Force restart
    }

    handleVerificationSuccess(actionType, actionData) {
        clearInterval(this.heartbeatInterval);
        this.verificationActive = false;
        this.cleanupVerification();
        
        // Record task completion
        tasksCompletedToday++;
        revenueToday += this.estimateTaskValue(currentTaskType);
        
        // Update UI
        updateUI();
        
        // Process the action
        if (actionType === 'mining_cycle') {
            this.processMiningCycleCompletion();
        } else if (actionType === 'withdraw') {
            this.processWithdrawalVerification(actionData);
        } else if (actionType === 'boost') {
            this.processBoostCompletion(actionData);
        }
        
        // Save state
        saveState();
    }

    handleVerificationFailure(error) {
        console.error('Verification failed:', error);
        this.cleanupVerification();
        
        // Don't allow mining to continue
        stopAllMining();
        
        alert('❌ Task verification failed. Please try again.');
    }

    handleVerificationTimeout(reject) {
        this.cleanupVerification();
        reject(new Error('Verification timeout'));
        alert('⏰ Task timed out. Please complete tasks faster.');
    }

    cleanupVerification() {
        if (this.verificationWindow) {
            this.verificationWindow.remove();
            this.verificationWindow = null;
        }
        if (this.blockerElement) {
            this.blockerElement.remove();
            this.blockerElement = null;
        }
        clearInterval(this.heartbeatInterval);
        localStorage.removeItem('nrx_active_verification');
        this.verificationActive = false;
    }

    blockUI() {
        // Disable all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
        });
        
        // Prevent clicks
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
    }

    unblockUI() {
        // Re-enable buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
        });
        
        // Restore interactions
        document.body.style.pointerEvents = 'auto';
        document.body.style.userSelect = 'auto';
    }

    stopAllMining() {
        if (isMining) {
            stopMining();
        }
    }

    async saveVerificationState() {
        if (!sessionId) return;
        
        try {
            await apiRequest(`/api/session/${sessionId}/verification`, 'POST', {
                verificationId: this.currentVerificationId,
                active: this.verificationActive,
                taskType: currentTaskType,
                startTime: this.verificationStartTime
            });
        } catch (error) {
            console.warn('Failed to save verification state:', error);
        }
    }

    estimateTaskValue(taskType) {
        const values = {
            [TASK_TYPES.APP_INSTALL]: 0.50,
            [TASK_TYPES.APP_INSTALL_SIGNUP]: 1.20,
            [TASK_TYPES.HIGH_EPC_SURVEY]: 2.50,
            [TASK_TYPES.SIGNUP_TASK]: 0.80,
            [TASK_TYPES.VIDEO_WATCH]: 0.25
        };
        return values[taskType] || 0.30;
    }

    handleTabSwitch() {
        // Penalize tab switching during verification
        if (this.verificationActive) {
            console.log('Tab switch detected during verification');
            // Could implement cooldown or penalty here
        }
    }

    handlePageHide() {
        if (this.verificationActive) {
            alert('⚠️ Please stay on this page to complete the task!');
        }
    }

    processMiningCycleCompletion() {
        completedMiningCycles++;
        cyclesCompletedToday++;
        
        // Check if daily cycle limit reached
        if (cyclesCompletedToday >= maxCyclesPerDay) {
            alert('🎉 Daily mining cycles completed! Come back tomorrow.');
            stopAllMining();
        }
        
        // Auto-start next mining cycle after 2 seconds
        setTimeout(() => {
            if (cyclesCompletedToday < maxCyclesPerDay) {
                startMiningCycle();
            }
        }, 2000);
    }

    processWithdrawalVerification(actionData) {
        // Start withdrawal delay timer
        const delayMinutes = WITHDRAWAL_DELAY_MINUTES;
        alert(`✅ Withdrawal verified! Processing will complete in ${delayMinutes} minutes.`);
        
        // Simulate processing delay
        setTimeout(() => {
            completeWithdrawalProcessing(actionData);
        }, delayMinutes * 60 * 1000);
    }

    processBoostCompletion(actionData) {
        const boostAmount = 15 + Math.floor(Math.random() * 20);
        miningSpeed += boostAmount;
        activeBoosts++;
        completedTasks.push(`boost-${Date.now()}`);
        
        alert(`✅ Boost applied! Mining speed increased by ${boostAmount} H/s.`);
        updateUI();
    }
}

const ogadsSystem = new OGADSProtectionSystem();

// ========== MINING SYSTEM WITH 5-MINUTE CYCLES ==========
function startMiningCycle() {
    if (isMining) return;
    
    // Check daily limits
    if (minedTokens >= DAILY_LIMIT) {
        alert("Daily limit reached! Come back tomorrow.");
        return;
    }
    
    if (cyclesCompletedToday >= maxCyclesPerDay) {
        alert("Daily mining cycles completed!");
        return;
    }
    
    isMining = true;
    currentCycleStartTime = Date.now();
    
    // Update UI
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) {
        miningBtn.innerHTML = `<i class="fas fa-pause"></i> Mining...`;
        miningBtn.classList.remove('btn-primary');
        miningBtn.classList.add('btn-warning');
        miningBtn.disabled = true;
    }
    
    // Start mining interval
    miningInterval = setInterval(() => {
        // Calculate mining progress
        const elapsed = Date.now() - currentCycleStartTime;
        cycleProgress = Math.min(100, (elapsed / MINING_CYCLE_MS) * 100);
        
        // Calculate tokens (anti-farm: slower but steady)
        const tokensPerSecond = (miningSpeed / 60000) * (1 + (activeBoosts * 0.2));
        minedTokens += tokensPerSecond;
        
        // Enforce daily limit
        if (minedTokens >= DAILY_LIMIT) {
            minedTokens = DAILY_LIMIT;
            stopMining();
            alert("🎉 Daily limit reached!");
        }
        
        // Update UI every second
        updateUI();
        
        // Auto-save progress every 30 seconds
        if (Date.now() % 30000 < 100) {
            saveState();
        }
        
        // Check if cycle completed
        if (elapsed >= MINING_CYCLE_MS) {
            completeMiningCycle();
        }
    }, 1000);
}

function completeMiningCycle() {
    stopMining();
    
    // Record cycle completion
    completedMiningCycles++;
    cyclesCompletedToday++;
    
    // Show completion message
    const tokensMinedThisCycle = (miningSpeed / 60000) * MINING_CYCLE_MS;
    alert(`⏰ Mining cycle complete! Earned ${tokensMinedThisCycle.toFixed(4)} NRX.\nComplete one task to continue.`);
    
    // Require OGADS task for next cycle
    setTimeout(() => {
        ogadsSystem.requireTaskCompletion('mining_cycle', {
            cycleNumber: completedMiningCycles,
            tokensEarned: tokensMinedThisCycle
        }).catch(() => {
            // User failed or canceled verification
            alert('Mining paused. Complete a task to resume.');
        });
    }, 1000);
}

function stopMining() {
    if (!isMining) return;
    
    isMining = false;
    clearInterval(miningInterval);
    
    // Save mining time
    if (currentCycleStartTime) {
        const cycleTime = (Date.now() - currentCycleStartTime) / 1000;
        totalMiningSeconds += cycleTime;
        currentCycleStartTime = null;
    }
    
    // Update UI
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) {
        miningBtn.innerHTML = `<i class="fas fa-play"></i> Start Mining`;
        miningBtn.classList.remove('btn-warning');
        miningBtn.classList.add('btn-primary');
        miningBtn.disabled = false;
    }
    
    // Reset cycle progress
    cycleProgress = 0;
    
    saveState();
}

// ========== REVENUE TARGET ENGINE ==========
class RevenueTargetEngine {
    constructor() {
        this.revenuePerHour = 0;
        this.adjustedMiningWindow = MINING_CYCLE_MINUTES;
        this.checkInterval = null;
    }
    
    start() {
        this.checkInterval = setInterval(() => {
            this.calculateRevenueRate();
            this.adjustMiningWindows();
        }, REVENUE_CHECK_INTERVAL);
    }
    
    calculateRevenueRate() {
        const now = Date.now();
        const hoursElapsed = (now - lastRevenueCheck) / (1000 * 60 * 60);
        
        if (hoursElapsed > 0) {
            this.revenuePerHour = revenueToday / hoursElapsed;
            lastRevenueCheck = now;
        }
        
        console.log(`Revenue tracking: $${revenueToday.toFixed(2)} today, $${this.revenuePerHour.toFixed(2)}/hour`);
    }
    
    adjustMiningWindows() {
        const targetHourly = DAILY_REVENUE_TARGET / 24; // ~$7.5/hour
        
        if (this.revenuePerHour < targetHourly * 0.8) {
            // Revenue low - shorten mining windows to trigger more tasks
            this.adjustedMiningWindow = Math.max(3, MINING_CYCLE_MINUTES - 1);
            console.log('Revenue low - shortening mining windows to', this.adjustedMiningWindow, 'minutes');
        } else if (this.revenuePerHour > targetHourly * 1.2) {
            // Revenue high - extend mining windows
            this.adjustedMiningWindow = Math.min(7, MINING_CYCLE_MINUTES + 1);
            console.log('Revenue high - extending mining windows to', this.adjustedMiningWindow, 'minutes');
        } else {
            // Revenue on target - use default
            this.adjustedMiningWindow = MINING_CYCLE_MINUTES;
        }
        
        // Update global mining cycle time
        MINING_CYCLE_MS = this.adjustedMiningWindow * 60 * 1000;
    }
    
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}

const revenueEngine = new RevenueTargetEngine();

// ========== WITHDRAWAL PROTECTION SYSTEM ==========
async function processWithdrawal(walletAddress, amount) {
    // Check daily withdrawal limit
    if (withdrawalsToday >= WITHDRAWALS_PER_DAY) {
        alert(`Daily withdrawal limit reached (${WITHDRAWALS_PER_DAY} per day)`);
        return;
    }
    
    // Validate amount
    if (amount > minedTokens) {
        alert('Insufficient balance');
        return;
    }
    
    if (amount < 0.001) {
        alert('Minimum withdrawal: 0.001 NRX');
        return;
    }
    
    // Require OGADS verification for withdrawal
    try {
        await ogadsSystem.requireTaskCompletion('withdraw', {
            walletAddress,
            amount,
            timestamp: Date.now()
        });
        
        // After verification, process withdrawal with delay
        withdrawalsToday++;
        withdrawalHistory.push({
            id: `wd_${Date.now()}`,
            amount,
            walletAddress,
            timestamp: Date.now(),
            status: 'processing'
        });
        
        // Deduct from balance
        minedTokens -= amount;
        updateUI();
        saveState();
        
        alert(`✅ Withdrawal queued! Will process in ${WITHDRAWAL_DELAY_MINUTES} minutes.`);
        
    } catch (error) {
        console.error('Withdrawal failed:', error);
        alert('Withdrawal verification failed');
    }
}

async function completeWithdrawalProcessing(withdrawalData) {
    try {
        // Simulate backend processing
        const response = await apiRequest('/api/withdrawals', 'POST', {
            sessionId,
            walletAddress: withdrawalData.walletAddress,
            amount: withdrawalData.amount,
            network: 'bsc'
        });
        
        // Update withdrawal history
        const withdrawal = withdrawalHistory.find(w => 
            w.walletAddress === withdrawalData.walletAddress && 
            w.amount === withdrawalData.amount
        );
        
        if (withdrawal) {
            withdrawal.status = 'completed';
            withdrawal.completedAt = Date.now();
            withdrawal.txHash = response.txHash;
        }
        
        saveState();
        
        // Send notification
        alert(`💸 Withdrawal completed! ${withdrawalData.amount} NRX sent to ${withdrawalData.walletAddress.substring(0, 10)}...`);
        
    } catch (error) {
        console.error('Withdrawal processing failed:', error);
        // Refund tokens if processing fails
        minedTokens += parseFloat(withdrawalData.amount);
        updateUI();
        alert('Withdrawal failed. Tokens have been returned to your balance.');
    }
}

// ========== TASK SYSTEM ==========
async function handleTaskClick(taskId) {
    // Check if already completed
    if (completedTasks.includes(`task-${taskId}`)) {
        alert('Task already completed!');
        return;
    }
    
    // Require OGADS verification
    try {
        await ogadsSystem.requireTaskCompletion('boost', {
            taskId,
            boostType: 'standard'
        });
        
        // Boost applied automatically by ogadsSystem.processBoostCompletion()
        
    } catch (error) {
        console.error('Task failed:', error);
    }
}

// ========== API FUNCTIONS ==========
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        // Fallback to local storage
        throw error;
    }
}

async function initializeSession() {
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (savedSessionId) {
        try {
            const state = await apiRequest(`/api/session/${savedSessionId}/state`);
            sessionId = savedSessionId;
            minedTokens = state.minedTokens || 0;
            miningSpeed = state.miningSpeed || BASE_MINING_SPEED;
            completedTasks = state.completedTasks || [];
            completedMiningCycles = state.completedMiningCycles || 0;
            cyclesCompletedToday = state.cyclesCompletedToday || 0;
            withdrawalsToday = state.withdrawalsToday || 0;
            return sessionId;
        } catch (error) {
            console.log('Creating new session');
        }
    }
    
    // Create new session
    try {
        const response = await apiRequest('/api/session', 'POST', {
            ua: navigator.userAgent,
            startedAt: new Date().toISOString()
        });
        
        sessionId = response.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    } catch (error) {
        // Fallback to local session
        sessionId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    }
}

async function saveState() {
    if (!sessionId) return;
    
    const state = {
        minedTokens,
        miningSpeed,
        completedTasks,
        completedMiningCycles,
        cyclesCompletedToday,
        withdrawalsToday,
        totalMiningSeconds,
        lastUpdate: new Date().toISOString()
    };
    
    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', state);
    } catch (error) {
        // Save locally as backup
        localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({
            ...state,
            sessionId,
            lastSave: Date.now()
        }));
    }
}

// ========== UI UPDATES ==========
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
    
    // Update active boosts
    const boostsEl = document.getElementById('active-boosts');
    if (boostsEl) {
        boostsEl.textContent = activeBoosts;
    }
    
    // Update daily progress
    const progressEl = document.getElementById('daily-progress');
    const progressFill = document.getElementById('progress-fill');
    if (progressEl && progressFill) {
        const progressPercent = Math.min(100, (minedTokens / DAILY_LIMIT) * 100);
        progressEl.textContent = progressPercent.toFixed(1) + "%";
        progressFill.style.width = progressPercent + "%";
    }
    
    // Update mining timer
    const timerEl = document.getElementById('mining-timer');
    if (timerEl && currentCycleStartTime) {
        const elapsed = Date.now() - currentCycleStartTime;
        const remaining = Math.max(0, MINING_CYCLE_MS - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.innerHTML = `<i class="far fa-clock"></i> ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update available tokens
    const availEl = document.getElementById('available-tokens');
    if (availEl) {
        availEl.textContent = minedTokens.toFixed(4);
    }
    
    // Update withdrawal amount field
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');
    if (withdrawalAmountEl) {
        withdrawalAmountEl.value = minedTokens.toFixed(4);
    }
    
    // Update task completion status
    document.querySelectorAll('.task-card').forEach(task => {
        const taskId = task.getAttribute('data-task');
        if (completedTasks.includes(`task-${taskId}`)) {
            task.style.background = 'var(--success)';
            task.style.opacity = '0.7';
            task.innerHTML = `
                <div class="task-icon" style="background: white;">
                    <i class="fas fa-check" style="color: var(--success);"></i>
                </div>
                <h4>Completed</h4>
                <p>Task already completed</p>
                <span class="task-reward" style="background: white; color: var(--success);">
                    <i class="fas fa-check"></i> Done
                </span>
            `;
            task.style.cursor = 'default';
            task.onclick = null;
        }
    });
    
    // Update mining button state
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) {
        if (minedTokens >= DAILY_LIMIT) {
            miningBtn.innerHTML = '<i class="fas fa-check"></i> Daily Limit Reached';
            miningBtn.disabled = true;
            miningBtn.classList.remove('btn-warning', 'btn-primary');
            miningBtn.classList.add('btn-secondary');
        } else if (cyclesCompletedToday >= maxCyclesPerDay) {
            miningBtn.innerHTML = '<i class="fas fa-calendar-day"></i> Daily Cycles Complete';
            miningBtn.disabled = true;
        }
    }
}

// ========== INITIALIZATION ==========
async function initializeApp() {
    console.log('🚀 Initializing Neura Mining Platform with OGADS Protection...');
    
    try {
        // Initialize session
        await initializeSession();
        
        // Load any saved progress
        const savedProgress = localStorage.getItem(LOCAL_PROGRESS_KEY);
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                if (progress.sessionId === sessionId) {
                    minedTokens = progress.minedTokens || 0;
                    miningSpeed = progress.miningSpeed || BASE_MINING_SPEED;
                    completedTasks = progress.completedTasks || [];
                }
            } catch (e) {
                console.error('Error loading progress:', e);
            }
        }
        
        // Check for active verification on page load
        const activeVerification = localStorage.getItem('nrx_active_verification');
        if (activeVerification) {
            const verification = JSON.parse(activeVerification);
            if (!verification.completed && (Date.now() - verification.startTime) < 10 * 60 * 1000) {
                // Resume verification
                alert('⚠️ Returning to incomplete verification...');
                ogadsSystem.requireTaskCompletion(verification.actionType, verification.data);
            } else {
                // Clear expired verification
                localStorage.removeItem('nrx_active_verification');
            }
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Start revenue engine
        revenueEngine.start();
        
        // Start auto-save
        setInterval(saveState, 30000);
        
        // Start countdown timer
        setInterval(updateCountdown, 1000);
        updateCountdown();
        
        // Initial UI update
        updateUI();
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
        
        console.log('✅ Platform initialized successfully');
        console.log('Session ID:', sessionId);
        console.log('OGADS Protection: ACTIVE');
        console.log('Revenue Target: $' + DAILY_REVENUE_TARGET);
        
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to initialize platform. Please refresh.');
    }
}

function setupEventListeners() {
    // Start Mining Button
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        startMiningBtn.addEventListener('click', () => {
            if (ogadsSystem.verificationActive) {
                alert('Please complete the current task first!');
                return;
            }
            startMiningCycle();
        });
    }
    
    // Withdraw Button
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            const withdrawalModal = document.getElementById('withdrawal-modal');
            if (withdrawalModal) {
                withdrawalModal.style.display = 'block';
                const amountInput = document.getElementById('withdrawal-amount');
                if (amountInput) {
                    amountInput.value = minedTokens.toFixed(4);
                }
            }
        });
    }
    
    // Confirm Withdrawal Button
    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async () => {
            const walletAddress = document.getElementById('wallet-address')?.value.trim();
            const amount = parseFloat(document.getElementById('withdrawal-amount')?.value);
            
            if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
                alert('Invalid BSC wallet address');
                return;
            }
            
            if (isNaN(amount) || amount < 0.001) {
                alert('Minimum withdrawal: 0.001 NRX');
                return;
            }
            
            if (amount > minedTokens) {
                alert('Insufficient balance');
                return;
            }
            
            // Close modal
            const withdrawalModal = document.getElementById('withdrawal-modal');
            if (withdrawalModal) withdrawalModal.style.display = 'none';
            
            // Process withdrawal
            await processWithdrawal(walletAddress, amount);
        });
    }
    
    // Task Cards
    document.querySelectorAll('.task-card').forEach(task => {
        task.addEventListener('click', async function() {
            const taskId = this.getAttribute('data-task');
            await handleTaskClick(taskId);
        });
    });
    
    // Copy Contract Address
    const copyAddressBtn = document.getElementById('copy-address');
    if (copyAddressBtn) {
        copyAddressBtn.addEventListener('click', () => {
            const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
            navigator.clipboard.writeText(address).then(() => {
                const original = copyAddressBtn.innerHTML;
                copyAddressBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyAddressBtn.innerHTML = original;
                }, 2000);
            });
        });
    }
    
    // Modal Close Buttons
    document.querySelectorAll('.modal-close, .close').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Pause mining when tab is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isMining) {
            stopMining();
            console.log('Mining paused due to tab switch');
        }
    });
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
        if (isMining) stopMining();
        saveState();
        revenueEngine.stop();
    });
}

// ========== COUNTDOWN TIMER ==========
function updateCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 22);
    
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    const days = Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const minutes = Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
    const seconds = Math.max(0, Math.floor((distance % (1000 * 60)) / 1000));
    
    document.getElementById('days')?.textContent = days;
    document.getElementById('hours')?.textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes')?.textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds')?.textContent = seconds.toString().padStart(2, '0');
}

// ========== START APPLICATION ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
                                                                 }
