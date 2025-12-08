// ---------- CONFIG ----------
const BACKEND_URL = "https://nrx-backend-2.onrender.com"; // ✅ CORRECT BACKEND URL
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
            return sessionId;
        } catch (error) {
            console.log('Existing session not found, creating new one');
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
            // Calculate tokens per second (slowed down)
            const tokensPerSecond = miningSpeed / 50000;
            minedTokens += tokensPerSecond;
            
            if (minedTokens > DAILY_LIMIT) {
                minedTokens = DAILY_LIMIT;
            }
            
            updateUI();
            
            // Auto-save every 10 seconds
            if (Date.now() % 10000 < 100) {
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
async function requestBoost() {
    try {
        const response = await apiRequest('/api/boosts', 'POST', {
            sessionId,
            requestedAt: new Date().toISOString()
        });
        
        pendingBoostId = response.boostId;
        return response;
    } catch (error) {
        console.error('Failed to request boost:', error);
        // Fallback: local boost
        const boostAmount = 10 + Math.floor(Math.random() * 15);
        miningSpeed += boostAmount;
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
        miningSpeed = response.newSpeed;
        completedTasks.push(`boost-${Date.now()}`);
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
        
        // Update local balance
        minedTokens -= parseFloat(amount);
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
    
    // Update mining button if limit reached
    if (minedTokens >= DAILY_LIMIT && isMining) {
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
        // Initialize session
        await initializeSession();
        loadLocalProgress();
        updateUI();
        
        // Start auto-save interval
        setInterval(saveState, 30000);
        
        // ---------- SET UP EVENT LISTENERS ----------
        
        // Start Mining Button
        const startMiningBtn = document.getElementById('start-mining-btn');
        if (startMiningBtn) {
            startMiningBtn.addEventListener('click', function() {
                console.log("Start Mining button clicked");
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
            console.log("Start Mining button listener attached");
        } else {
            console.error("Start Mining button not found!");
        }
        
        // Mine Now Button (Boost)
        const mineNowBtn = document.getElementById('mine-now-btn');
        if (mineNowBtn) {
            mineNowBtn.addEventListener('click', function() {
                console.log("Mine Now button clicked");
                const boostSection = document.getElementById('boost-mining-section');
                if (boostSection) {
                    boostSection.style.display = 'block';
                    this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
                    this.classList.remove('btn-warning');
                    this.classList.add('btn-primary');
                    this.disabled = true;
                }
            });
            console.log("Mine Now button listener attached");
        } else {
            console.error("Mine Now button not found!");
        }
        
        // Withdraw Button
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', function() {
                console.log("Withdraw button clicked");
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
            console.log("Withdraw button listener attached");
        } else {
            console.error("Withdraw button not found!");
        }
        
        // Task Clicks
        const taskElements = document.querySelectorAll('.task');
        if (taskElements.length > 0) {
            taskElements.forEach(task => {
                task.addEventListener('click', async function() {
                    const taskId = this.getAttribute('data-task');
                    console.log(`Task ${taskId} clicked`);
                    
                    // Check if already completed
                    const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
                    if (isCompleted) {
                        alert("You've already completed this task!");
                        return;
                    }
                    
                    // Request boost from backend
                    const boostResponse = await requestBoost();
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
                    
                    // Update task UI
                    this.style.background = 'var(--warning)';
                    this.style.color = 'white';
                    const icon = this.querySelector('i');
                    if (icon) icon.style.color = 'white';
                });
            });
            console.log("Task listeners attached: ", taskElements.length);
        } else {
            console.error("No task elements found!");
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
                    const withdrawalModal = document.getElementById('withdrawal-modal');
                    const ogadsModal = document.getElementById('ogads-modal');
                    
                    if (withdrawalModal) withdrawalModal.style.display = 'none';
                    if (ogadsModal) {
                        currentAction = 'withdraw';
                        ogadsModal.style.display = 'block';
                    }
                    
                } catch (error) {
                    alert(`Withdrawal failed: ${error.message}`);
                }
            });
            console.log("Confirm Withdrawal button listener attached");
        } else {
            console.error("Confirm Withdrawal button not found!");
        }
        
        // OGADS Task Completion Button
        const taskCompletedBtn = document.getElementById('task-completed');
        if (taskCompletedBtn) {
            taskCompletedBtn.addEventListener('click', async function() {
                console.log("Task Completed button clicked");
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
                            alert(`✅ Boost verified! Mining speed increased by ${result.boostAmount} H/s.`);
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
                    const ogadsModal = document.getElementById('ogads-modal');
                    if (ogadsModal) ogadsModal.style.display = 'none';
                    currentAction = null;
                    
                } catch (error) {
                    alert("Verification failed. Please try again.");
                } finally {
                    // Reset button
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            });
            console.log("Task Completed button listener attached");
        } else {
            console.error("Task Completed button not found!");
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
            if (document.hidden && isMining) {
                stopMining();
            }
        });
        
        // Save on page unload
        window.addEventListener('beforeunload', function() {
            if (isMining) {
                stopMining();
            }
            saveState();
        });
        
        console.log("✅ NRX Mining Platform initialized successfully!");
        console.log("Backend URL:", BACKEND_URL);
        console.log("Session ID:", sessionId);
        console.log("Mined Tokens:", minedTokens);
        
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

// ---------- START APPLICATION WHEN PAGE LOADS ----------
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM fully loaded, initializing app...");
        initializeApp();
        // Start countdown timer
        setInterval(updateCountdown, 1000);
        updateCountdown();
    });
} else {
    // DOM already loaded
    console.log("DOM already loaded, initializing app...");
    initializeApp();
    // Start countdown timer
    setInterval(updateCountdown, 1000);
    updateCountdown();
                     }
