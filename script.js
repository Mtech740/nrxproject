// ---------- CONFIG ----------
const BACKEND_URL = "https://nrx-backend-2.onrender.com"; // Fixed to match your HTML
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
let totalMiningSeconds = 0; // FIXED: Moved outside functions
let miningStartTime = null; // FIXED: Moved outside functions

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
        // FIXED: Throw error instead of returning null
        throw error;
    }
}

// Create or restore session
async function initializeSession() {
    // Check for existing session
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (savedSessionId) {
        try {
            // Try to restore existing session
            const state = await apiRequest(`/api/session/${savedSessionId}/state`);
            sessionId = savedSessionId;
            minedTokens = state.minedTokens || 0;
            miningSpeed = state.miningSpeed || BASE_MINING_SPEED;
            completedTasks = state.completedTasks || [];
            totalMiningSeconds = state.totalMiningTime || 0; // FIXED: Restore mining time
            return sessionId;
        } catch (error) {
            console.log('Existing session not found, creating new one');
            // FIXED: Clear invalid session ID
            localStorage.removeItem(SESSION_STORAGE_KEY);
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
        console.error('Failed to create session:', error);
        // Fallback: create local session ID
        sessionId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        return sessionId;
    }
}

// Save state to backend
async function saveState() {
    if (!sessionId) return;
    
    try {
        await apiRequest(`/api/session/${sessionId}/state`, 'POST', {
            minedTokens: parseFloat(minedTokens.toFixed(4)),
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
        minedTokens: parseFloat(minedTokens.toFixed(4)),
        miningSpeed,
        completedTasks,
        totalMiningSeconds,
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
            totalMiningSeconds = progress.totalMiningSeconds || 0;
            
            // Check if it's a new day for daily reset
            const lastSaveDate = new Date(progress.lastSave);
            const today = new Date();
            if (lastSaveDate.getDate() !== today.getDate()) {
                minedTokens = 0;
                console.log('New day - resetting mined tokens');
            }
            
            return true;
        }
    } catch (error) {
        console.error('Error loading local progress:', error);
    }
    return false;
}

// ---------- MINING SYSTEM ----------
function getTotalMiningTime() {
    let total = totalMiningSeconds || 0;
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
        if (minedTokens < DAILY_LIMIT && isMining) {
            // Calculate tokens per second (adjusted for realistic mining)
            const tokensPerSecond = miningSpeed / 50000;
            minedTokens += tokensPerSecond;
            
            // Ensure we don't exceed daily limit
            if (minedTokens > DAILY_LIMIT) {
                minedTokens = DAILY_LIMIT;
                stopMining();
            }
            
            updateUI();
            
            // Auto-save every 10 seconds
            if (Math.floor(Date.now() / 10000) % 10 === 0) {
                saveState();
            }
        } else {
            stopMining();
            updateUI();
        }
    }, 100);
}

function stopMining() {
    if (!isMining) return;
    
    isMining = false;
    clearInterval(miningInterval);
    miningInterval = null;
    
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
    
    saveState();
}

// ---------- BOOST SYSTEM ----------
async function requestBoost(taskId) {
    try {
        const response = await apiRequest('/api/boosts', 'POST', {
            sessionId,
            taskId: parseInt(taskId),
            requestedAt: new Date().toISOString()
        });
        
        pendingBoostId = response.boostId;
        return response;
    } catch (error) {
        console.error('Failed to request boost:', error);
        // Fallback: local boost
        const boostAmount = 5 + Math.floor(Math.random() * 15);
        miningSpeed += boostAmount;
        completedTasks.push(`task-${taskId}-${Date.now()}`);
        updateUI();
        saveState();
        return { boostAmount, message: 'Boost applied locally' };
    }
}

async function verifyBoost() {
    if (!pendingBoostId) return false;
    
    try {
        const response = await apiRequest(`/api/boosts/${pendingBoostId}/verify`, 'POST', {
            sessionId
        });
        
        pendingBoostId = null;
        miningSpeed = response.newSpeed || miningSpeed;
        updateUI();
        saveState();
        return response;
    } catch (error) {
        console.error('Failed to verify boost:', error);
        return false;
    }
}

// ---------- WITHDRAWAL SYSTEM ----------
async function createWithdrawal(walletAddress, amount) {
    // Validate amount first
    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount > minedTokens) {
        throw new Error('Insufficient balance');
    }
    
    try {
        const response = await apiRequest('/api/withdrawals', 'POST', {
            sessionId,
            walletAddress,
            amount: withdrawalAmount,
            network: 'bsc'
        });
        
        pendingWithdrawal = {
            id: response.withdrawalId,
            walletAddress,
            amount: withdrawalAmount
        };
        
        // Update local balance
        minedTokens -= withdrawalAmount;
        if (minedTokens < 0) minedTokens = 0;
        updateUI();
        
        return response;
    } catch (error) {
        console.error('Failed to create withdrawal:', error);
        throw error;
    }
}

async function completeWithdrawal() {
    if (!pendingWithdrawal || !pendingWithdrawal.id) return false;
    
    try {
        const response = await apiRequest(`/api/withdrawals/${pendingWithdrawal.id}/complete`, 'POST', {
            sessionId
        });
        
        // Clear pending withdrawal
        pendingWithdrawal = null;
        saveState();
        return response;
    } catch (error) {
        console.error('Failed to complete withdrawal:', error);
        return false;
    }
}

// ---------- UI UPDATES ----------
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
    
    // Update available tokens in withdrawal modal
    const availEl = document.getElementById('available-tokens');
    if (availEl) {
        availEl.textContent = minedTokens.toFixed(4);
    }
    
    // Update withdrawal amount field
    const withdrawalAmountEl = document.getElementById('withdrawal-amount');
    if (withdrawalAmountEl) {
        withdrawalAmountEl.value = Math.min(minedTokens, DAILY_LIMIT).toFixed(4);
        withdrawalAmountEl.max = minedTokens.toFixed(4);
    }
    
    // Update task completion visuals
    document.querySelectorAll('.task').forEach(task => {
        const taskId = task.getAttribute('data-task');
        const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
        
        if (isCompleted) {
            task.style.opacity = '0.6';
            task.style.cursor = 'default';
            task.style.pointerEvents = 'none';
            
            // Check if we already added the checkmark
            if (!task.querySelector('.task-completed-check')) {
                const checkmark = document.createElement('div');
                checkmark.className = 'task-completed-check';
                checkmark.innerHTML = '<i class="fas fa-check-circle"></i>';
                checkmark.style.cssText = 'position:absolute; top:10px; right:10px; color:green; font-size:20px;';
                task.style.position = 'relative';
                task.appendChild(checkmark);
            }
        }
    });
    
    // Update mining button if limit reached
    const miningBtn = document.getElementById('start-mining-btn');
    if (minedTokens >= DAILY_LIMIT) {
        if (isMining) stopMining();
        if (miningBtn) {
            miningBtn.innerHTML = '<i class="fas fa-check"></i> Daily Limit Reached';
            miningBtn.disabled = true;
            miningBtn.classList.remove('btn-warning');
            miningBtn.classList.add('btn-primary');
        }
    } else if (miningBtn && miningBtn.disabled) {
        miningBtn.disabled = false;
    }
}

// ---------- EVENT HANDLERS ----------
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize session
    try {
        await initializeSession();
    } catch (error) {
        console.error('Session initialization failed:', error);
    }
    
    // Load local progress
    loadLocalProgress();
    updateUI();
    
    // Start auto-save interval
    setInterval(saveState, 30000);
    
    // ---------- MINING BUTTON ----------
    const startMiningBtn = document.getElementById('start-mining-btn');
    if (startMiningBtn) {
        startMiningBtn.addEventListener('click', function() {
            if (minedTokens >= DAILY_LIMIT) {
                alert("Daily limit reached! Come back tomorrow.");
                return;
            }
            
            if (isMining) {
                stopMining();
            } else {
                startMining();
            }
        });
    }
    
    // ---------- BOOST/MINE NOW BUTTON ----------
    const mineNowBtn = document.getElementById('mine-now-btn');
    if (mineNowBtn) {
        mineNowBtn.addEventListener('click', function() {
            const boostSection = document.getElementById('boost-mining-section');
            if (boostSection) {
                boostSection.style.display = 'block';
                this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
                this.classList.remove('btn-warning');
                this.classList.add('btn-primary');
                this.disabled = true;
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    boostSection.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-hammer"></i> Mine Now';
                    this.classList.remove('btn-primary');
                    this.classList.add('btn-warning');
                    this.disabled = false;
                }, 10000);
            }
        });
    }
    
    // ---------- TASK CLICKS ----------
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('click', async function() {
            const taskId = this.getAttribute('data-task');
            
            // Check if already completed
            const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
            if (isCompleted) {
                alert("You've already completed this task!");
                return;
            }
            
            // Request boost from backend
            const boostResponse = await requestBoost(taskId);
            if (!boostResponse) {
                alert("Failed to initialize boost. Please try again.");
                return;
            }
            
            // Open OGADS modal
            currentAction = 'boost';
            const ogadsModal = document.getElementById('ogads-modal');
            if (ogadsModal) {
                ogadsModal.style.display = 'block';
            }
        });
    });
    
    // ---------- WITHDRAW BUTTON ----------
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            if (minedTokens < 0.001) {
                alert("Minimum withdrawal amount is 0.001 NRX");
                return;
            }
            
            const withdrawalModal = document.getElementById('withdrawal-modal');
            if (withdrawalModal) {
                withdrawalModal.style.display = 'block';
                document.getElementById('wallet-address').value = '';
                document.getElementById('withdrawal-amount').value = Math.min(minedTokens, DAILY_LIMIT).toFixed(4);
            }
        });
    }
    
    // ---------- CONFIRM WITHDRAWAL ----------
    const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
    if (confirmWithdrawalBtn) {
        confirmWithdrawalBtn.addEventListener('click', async function() {
            const walletAddress = document.getElementById('wallet-address').value.trim();
            const withdrawalAmount = document.getElementById('withdrawal-amount').value;
            
            // Validation
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
                // Create withdrawal in backend
                await createWithdrawal(walletAddress, withdrawalAmount);
                
                // Close withdrawal modal and open OGADS
                document.getElementById('withdrawal-modal').style.display = 'none';
                currentAction = 'withdraw';
                document.getElementById('ogads-modal').style.display = 'block';
                
            } catch (error) {
                alert(`Withdrawal failed: ${error.message}`);
            }
        });
    }
    
    // ---------- OGADS TASK COMPLETION ----------
    const taskCompletedBtn = document.getElementById('task-completed');
    if (taskCompletedBtn) {
        taskCompletedBtn.addEventListener('click', async function() {
            const button = this;
            const originalText = button.innerHTML;
            
            // Show loading
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            button.disabled = true;
            
            try {
                if (currentAction === 'boost') {
                    // Verify boost
                    const result = await verifyBoost();
                    if (result) {
                        alert(`✅ Boost verified! Mining speed increased.`);
                    } else {
                        alert("❌ Boost verification failed. Please try again.");
                    }
                    
                } else if (currentAction === 'withdraw' && pendingWithdrawal) {
                    // Complete withdrawal
                    const result = await completeWithdrawal();
                    if (result) {
                        alert(`✅ Withdrawal verified! ${pendingWithdrawal.amount} NRX sent to ${pendingWithdrawal.walletAddress}`);
                    } else {
                        alert("❌ Withdrawal verification failed. Please contact support.");
                    }
                }
                
                // Close modal
                document.getElementById('ogads-modal').style.display = 'none';
                currentAction = null;
                
            } catch (error) {
                alert("Verification failed. Please try again.");
            } finally {
                // Reset button
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
    }
    
    // ---------- MODAL CLOSE BUTTONS ----------
    document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const ogadsModal = document.getElementById('ogads-modal');
            const withdrawalModal = document.getElementById('withdrawal-modal');
            
            if (ogadsModal) ogadsModal.style.display = 'none';
            if (withdrawalModal) withdrawalModal.style.display = 'none';
            
            currentAction = null;
            pendingWithdrawal = null;
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
        }
    });
    
    // ---------- COPY CONTRACT ADDRESS ----------
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
        if (document.hidden && isMining) {
            stopMining();
            console.log('Mining paused: tab not visible');
        }
    });
    
    // Save on page unload
    window.addEventListener('beforeunload', function() {
        if (isMining) {
            stopMining();
        }
        saveState();
    });
    
    console.log("NRX Mining Platform initialized successfully!");
});

// ---------- COUNTDOWN TIMER ----------
function updateCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 22);
    
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    if (distance < 0) {
        // Countdown finished
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
}

// Start countdown
setInterval(updateCountdown, 1000);
updateCountdown();

// ---------- DAILY RESET CHECK ----------
function checkDailyReset() {
    const lastReset = localStorage.getItem('nrx_last_reset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        // New day - reset mined tokens
        minedTokens = 0;
        localStorage.setItem('nrx_last_reset', today);
        saveState();
        console.log('Daily reset applied');
    }
}

// Check daily reset on load
setTimeout(checkDailyReset, 1000);
