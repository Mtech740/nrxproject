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

// ---------- OGADS VERIFICATION SYSTEM ----------
function openOGADSTask(taskType) {
    currentAction = taskType;
    
    // Close any existing modal
    const ogadsModal = document.getElementById('ogads-modal');
    if (ogadsModal) {
        ogadsModal.style.display = 'none';
    }
    
    // Open OGADS link in new tab
    ogadsWindow = window.open('https://applocked.org/cl/i/j76pvj', '_blank', 'noopener,noreferrer');
    
    if (!ogadsWindow || ogadsWindow.closed || typeof ogadsWindow.closed === 'undefined') {
        alert('Please allow pop-ups to complete the task.');
        return;
    }
    
    // Show verification instructions
    showVerificationInstructions();
    
    // Start monitoring for completion
    startTaskVerification();
}

function showVerificationInstructions() {
    const taskCompletedBtn = document.getElementById('task-completed');
    const ogadsModal = document.getElementById('ogads-modal');
    
    if (ogadsModal) {
        ogadsModal.style.display = 'block';
        
        // Update modal content
        const modalHeader = ogadsModal.querySelector('.modal-header h3');
        const modalBody = ogadsModal.querySelector('.modal-body');
        
        if (modalHeader) {
            modalHeader.textContent = 'Complete Task to Continue';
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <p>Please complete the task in the new tab to activate your mining boost / withdrawal.</p>
                <div class="verification-steps">
                    <div class="step">
                        <i class="fas fa-external-link-alt"></i>
                        <strong>Step 1:</strong> Complete the task in the new tab
                    </div>
                    <div class="step">
                        <i class="fas fa-clock"></i>
                        <strong>Step 2:</strong> Wait <span id="countdown">30</span> seconds
                    </div>
                    <div class="step">
                        <i class="fas fa-check-circle"></i>
                        <strong>Step 3:</strong> Click "I've Completed the Task"
                    </div>
                </div>
                <div class="verification-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    You must actually complete the task. Bypass attempts will fail verification.
                </div>
                <button class="btn btn-primary" id="task-completed" disabled>
                    <i class="fas fa-clock"></i> Complete Task First (30s)
                </button>
                <button class="btn btn-secondary" id="open-task-again">
                    <i class="fas fa-external-link-alt"></i> Open Task Again
                </button>
            `;
        }
    }
    
    // Re-attach event listeners for new buttons
    setTimeout(() => {
        const newTaskCompletedBtn = document.getElementById('task-completed');
        const openTaskAgainBtn = document.getElementById('open-task-again');
        
        if (newTaskCompletedBtn) {
            newTaskCompletedBtn.onclick = completeTaskVerification;
        }
        
        if (openTaskAgainBtn) {
            openTaskAgainBtn.onclick = () => {
                window.open('https://applocked.org/cl/i/j76pvj', '_blank');
            };
        }
    }, 100);
}

function startTaskVerification() {
    taskCompleted = false;
    
    // Disable button initially
    const taskCompletedBtn = document.getElementById('task-completed');
    if (taskCompletedBtn) {
        taskCompletedBtn.disabled = true;
        taskCompletedBtn.innerHTML = '<i class="fas fa-clock"></i> Complete Task First (30s)';
    }
    
    // Start countdown
    let secondsLeft = 30;
    const countdownElement = document.getElementById('countdown');
    
    if (verificationTimer) {
        clearInterval(verificationTimer);
    }
    
    verificationTimer = setInterval(() => {
        secondsLeft--;
        
        if (countdownElement) {
            countdownElement.textContent = secondsLeft;
        }
        
        if (secondsLeft <= 0) {
            clearInterval(verificationTimer);
            
            // Enable verification button
            if (taskCompletedBtn) {
                taskCompletedBtn.disabled = false;
                taskCompletedBtn.innerHTML = '<i class="fas fa-check"></i> I\'ve Completed the Task';
            }
            
            // Check if OGADS window is still open
            if (ogadsWindow && !ogadsWindow.closed) {
                // Window is still open, assume task is being completed
                console.log('OGADS window still open, user likely completing task');
            } else {
                // Window closed, show reminder
                const modalBody = document.querySelector('#ogads-modal .modal-body');
                if (modalBody) {
                    const warning = modalBody.querySelector('.verification-warning');
                    if (warning) {
                        warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Task tab closed. Please reopen and complete the task before verifying.';
                        warning.style.color = '#ff9f1a';
                    }
                }
            }
        }
    }, 1000);
}

async function completeTaskVerification() {
    const button = document.getElementById('task-completed');
    if (!button) return;
    
    // Show loading
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    
    try {
        if (currentAction === 'boost') {
            // Request boost verification from backend
            const response = await apiRequest('/api/boosts/verify', 'POST', {
                sessionId,
                taskCompleted: true,
                verifiedAt: new Date().toISOString()
            });
            
            if (response.success) {
                // Apply boost
                const boostAmount = response.boostAmount || 10;
                miningSpeed += boostAmount;
                completedTasks.push(`boost-${Date.now()}`);
                
                alert(`✅ Boost verified! Mining speed increased by ${boostAmount} H/s.`);
                updateUI();
                saveState();
                
                // Close modal
                const ogadsModal = document.getElementById('ogads-modal');
                if (ogadsModal) ogadsModal.style.display = 'none';
                
                // Update task UI
                const taskId = pendingBoostId || '1';
                const taskElement = document.querySelector(`.task[data-task="${taskId}"]`);
                if (taskElement) {
                    taskElement.style.background = 'var(--success)';
                    taskElement.style.color = 'white';
                    taskElement.innerHTML = `<i class="fas fa-check"></i><h4>Completed</h4><p>Boost applied</p>`;
                }
            } else {
                alert('❌ Verification failed. Please complete the actual task.');
                button.disabled = false;
                button.innerHTML = originalText;
            }
            
        } else if (currentAction === 'withdraw' && pendingWithdrawal) {
            // Verify withdrawal
            const response = await apiRequest('/api/withdrawals/verify', 'POST', {
                sessionId,
                withdrawalId: pendingWithdrawal.id,
                verifiedAt: new Date().toISOString()
            });
            
            if (response.success) {
                alert(`✅ Withdrawal verified! ${pendingWithdrawal.amount} NRX will be sent to your wallet.`);
                
                // Reset pending withdrawal
                pendingWithdrawal = null;
                
                // Close modal
                const ogadsModal = document.getElementById('ogads-modal');
                if (ogadsModal) ogadsModal.style.display = 'none';
            } else {
                alert('❌ Withdrawal verification failed. Please complete the task.');
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }
        
    } catch (error) {
        console.error('Verification failed:', error);
        alert('❌ Verification failed. Please try again or contact support.');
        button.disabled = false;
        button.innerHTML = originalText;
    }
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
function updateUI() {
    const minedEl = document.getElementById('mined-tokens');
    if (minedEl) {
        minedEl.textContent = minedTokens.toFixed(4) + " NRX";
    }
    
    const speedEl = document.getElementById('mining-speed');
    if (speedEl) {
        speedEl.textContent = miningSpeed + " H/s";
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
        await initializeSession();
        loadLocalProgress();
        updateUI();
        
        setInterval(saveState, 30000);
        
        // ---------- EVENT LISTENERS ----------
        
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
        }
        
        // Task Clicks - MODIFIED: Opens OGADS task
        const taskElements = document.querySelectorAll('.task');
        if (taskElements.length > 0) {
            taskElements.forEach(task => {
                task.addEventListener('click', async function() {
                    const taskId = this.getAttribute('data-task');
                    console.log(`Task ${taskId} clicked`);
                    
                    const isCompleted = completedTasks.some(t => t.includes(`task-${taskId}`));
                    if (isCompleted) {
                        alert("You've already completed this task!");
                        return;
                    }
                    
                    // Request boost and open OGADS task
                    await requestBoost(taskId);
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
        
        // REMOVED: Old "I've Completed the Task" button handler
        // No bypass button anymore - users must complete actual task
        
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
