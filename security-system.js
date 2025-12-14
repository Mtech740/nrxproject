// ===== NRX SECURITY & MONETIZATION SYSTEM =====
// Implements all 10 security features and 4-pillar system
// Uses OGADS locker: https://lockedapp.org/cl/i/j76pvj

class NRXSecuritySystem {
    constructor() {
        // Configuration
        this.CONFIG = {
            OGADS_URL: 'https://lockedapp.org/cl/i/j76pvj', // YOUR EXACT OGADS URL
            MINING_CYCLE_DURATION: 5 * 60, // 5 minutes in seconds
            DAILY_LIMIT: 20,
            MINING_SPEED_BASE: 20,
            REVENUE_TARGET: 150, // $150-200 daily target
            WITHDRAWAL_DELAY_MIN: 15 * 60, // 15 minutes
            WITHDRAWAL_DELAY_MAX: 30 * 60, // 30 minutes
            MAX_WITHDRAWALS_PER_DAY: 2,
            REVENUE_CHECK_INTERVAL: 4 * 60 * 1000, // 4 minutes
            TASK_TYPES: ['app_install', 'app_install_signup', 'survey', 'app_install', 'signup_task']
        };

        // State management
        this.state = {
            isMining: false,
            isOGADSActive: false,
            minedToday: 0.00,
            miningSpeed: 20,
            currentCycleStart: null,
            miningTimer: null,
            cycleEndTimer: null,
            completedTasks: [],
            withdrawalsToday: 0,
            withdrawalQueue: [],
            currentTaskType: 0,
            windowAdjustment: 0,
            revenuePerHour: 0,
            lastRevenueCheck: Date.now(),
            sessionId: this.generateSessionId(),
            tabHidden: false,
            pendingWithdrawal: null,
            dailyResetDate: this.getTodayDateString(),
            isMiningPaused: false,
            miningCyclesCompleted: 0,
            taskCompletionAttempts: 0,
            lastTaskCompletion: null,
            revenueHistory: []
        };

        // Initialize
        this.initializeSystem();
    }

    // ===== INITIALIZATION =====
    initializeSystem() {
        console.log('🔒 NRX Security System Initializing...');
        this.loadState();
        this.setupEventListeners();
        this.setupVisibilityHandlers();
        this.setupAntiBypass();
        this.initRevenueEngine();
        this.checkDailyReset();
        this.updateUI();
        
        // Sync with existing script.js if available
        this.syncWithExistingScript();
        
        console.log('✅ NRX Security System Ready');
    }

    syncWithExistingScript() {
        if (window.minedTokens !== undefined) {
            this.state.minedToday = window.minedTokens;
        }
        if (window.miningSpeed !== undefined) {
            this.state.miningSpeed = window.miningSpeed;
        }
        if (window.isMining !== undefined) {
            this.state.isMining = window.isMining;
            if (this.state.isMining) {
                this.startMining(); // Restart with security system
            }
        }
        this.saveState();
    }

    // 🔐 PILLAR 1: Locked 5-Minute Window System
    startMining() {
        if (this.state.isOGADSActive) {
            this.showNotification('Complete the current task first!', 'warning');
            return false;
        }

        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.showNotification('Daily limit reached! Come back tomorrow.', 'error');
            return false;
        }

        this.state.isMining = true;
        this.state.isMiningPaused = false;
        this.state.currentCycleStart = Date.now();
        
        // Update button state
        const startBtn = document.getElementById('start-mining-btn');
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-warning');
        }

        // Start mining progress updates
        this.state.miningTimer = setInterval(() => {
            this.updateMiningProgress();
        }, 1000);

        // 🔐 Feature 6: 5-minute mining cycles
        const cycleDuration = (this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment) * 1000;
        this.state.cycleEndTimer = setTimeout(() => {
            this.completeMiningCycle();
        }, cycleDuration);

        this.showNotification('⛏️ Mining started! 5-minute cycle active.', 'success');
        return true;
    }

    stopMining() {
        if (!this.state.isMining) return;

        this.state.isMining = false;
        
        if (this.state.miningTimer) {
            clearInterval(this.state.miningTimer);
            this.state.miningTimer = null;
        }
        
        if (this.state.cycleEndTimer) {
            clearTimeout(this.state.cycleEndTimer);
            this.state.cycleEndTimer = null;
        }

        // Update button state
        const startBtn = document.getElementById('start-mining-btn');
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
            startBtn.classList.remove('btn-warning');
            startBtn.classList.add('btn-primary');
        }

        this.saveState();
    }

    completeMiningCycle() {
        // 🔐 Feature 2: Mining stops immediately when OGADS is triggered
        this.stopMining();
        
        // Calculate mined amount for this cycle
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        const minedThisCycle = (this.state.miningSpeed / 3600) * cycleDuration;
        this.state.minedToday = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);
        
        this.state.miningCyclesCompleted++;
        
        // 🔐 Feature 9: Daily cap enforcement
        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.showNotification('🎉 Daily limit reached! Come back tomorrow.', 'success');
        }

        this.saveState();
        this.updateUI();
        
        // 🔐 Feature 7: Task prompt appears after each mining cycle
        setTimeout(() => {
            this.showTaskRequirement();
        }, 1000);
    }

    updateMiningProgress() {
        if (!this.state.isMining) return;

        // Calculate progress
        const now = Date.now();
        const elapsed = (now - this.state.currentCycleStart) / 1000;
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        
        // Calculate real-time mined amount
        const minedThisCycle = (this.state.miningSpeed / 3600) * elapsed;
        const totalMined = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);

        // Update displayed amount
        const minedElement = document.getElementById('mined-tokens');
        if (minedElement) {
            minedElement.textContent = totalMined.toFixed(4) + ' NRX';
        }

        // 🔐 Feature 10: Accurate mining speed calculation
        this.calculateAccurateSpeed();
    }

    // 🔐 Feature 7: Task prompt appears after each mining cycle
    showTaskRequirement() {
        const modal = document.getElementById('ogads-modal');
        if (!modal) return;

        // Update modal content
        const header = modal.querySelector('.modal-header h3');
        if (header) {
            header.textContent = 'Complete Task to Continue Mining';
        }
        
        const bodyText = modal.querySelector('.modal-body p');
        if (bodyText) {
            bodyText.textContent = 'You\'ve completed a mining cycle. Complete one task to unlock the next 5-minute window.';
        }

        // Show modal with fade effect
        modal.style.display = 'block';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        // 🔐 Feature 1: OGADS cannot be bypassed
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }

        // Set OGADS URL - YOUR EXACT LOCKER
        const ogadsFrame = document.getElementById('ogads-frame');
        if (ogadsFrame) {
            ogadsFrame.src = this.CONFIG.OGADS_URL;
        }

        // 🔐 Feature 3: Mining cannot resume until task is completed
        this.state.isOGADSActive = true;
        
        // Disable mining button
        const miningBtn = document.getElementById('start-mining-btn');
        if (miningBtn) {
            miningBtn.disabled = true;
        }
        
        // Start monitoring task completion
        this.monitorTaskCompletion();
    }

    // 🔐 Feature 1-4: Prevent bypassing
    setupAntiBypass() {
        let hasShownWarning = false;
        
        // Prevent page refresh during OGADS
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isOGADSActive && !hasShownWarning) {
                e.preventDefault();
                e.returnValue = '⚠️ You must complete the task to continue mining.';
                hasShownWarning = true;
                return e.returnValue;
            }
        });

        // Prevent back button
        window.addEventListener('popstate', (e) => {
            if (this.state.isOGADSActive) {
                history.pushState(null, null, window.location.href);
                this.showSecurityWarning('Please complete the task first.');
            }
        });

        // Prevent modal close clicks
        document.addEventListener('click', (e) => {
            if (this.state.isOGADSActive && 
                (e.target.classList.contains('modal') || 
                 e.target.classList.contains('close'))) {
                e.preventDefault();
                e.stopPropagation();
                this.showSecurityWarning('Complete the task to continue.');
            }
        });
    }

    monitorTaskCompletion() {
        let checkCount = 0;
        const maxChecks = 300;
        
        this.taskCheckInterval = setInterval(() => {
            checkCount++;
            
            // 🔐 Feature 5: Tab switching detection
            if (document.hidden && this.state.isOGADSActive) {
                this.showTabSwitchWarning();
            }

            // Simulated completion check
            if (checkCount >= 10 && Math.random() > 0.85) {
                this.taskCompleted();
            }

            if (checkCount >= maxChecks) {
                clearInterval(this.taskCheckInterval);
                this.showNotification('Task timeout. Please try again.', 'error');
                this.state.isOGADSActive = false;
                this.updateUI();
            }
        }, 1000);
    }

    taskCompleted() {
        if (!this.taskCheckInterval) return;
        
        clearInterval(this.taskCheckInterval);
        this.taskCheckInterval = null;
        
        // Hide modal
        const modal = document.getElementById('ogads-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.opacity = '1';
                
                // Restore close button
                const closeBtn = modal.querySelector('.close');
                if (closeBtn) {
                    closeBtn.style.display = 'block';
                }
            }, 300);
        }

        // 🧱 PILLAR 2: Smart Task Rotation
        const taskType = this.CONFIG.TASK_TYPES[this.state.currentTaskType];
        const taskReward = this.getTaskReward(taskType);
        
        this.state.completedTasks.push({
            type: taskType,
            timestamp: Date.now(),
            reward: taskReward,
            cycle: this.state.miningCyclesCompleted
        });

        // Rotate task type (no same task twice in a row)
        let nextTaskType = (this.state.currentTaskType + 1) % this.CONFIG.TASK_TYPES.length;
        while (nextTaskType === this.state.currentTaskType) {
            nextTaskType = (nextTaskType + 1) % this.CONFIG.TASK_TYPES.length;
        }
        this.state.currentTaskType = nextTaskType;

        // Apply speed boost
        const oldSpeed = this.state.miningSpeed;
        this.state.miningSpeed += taskReward;
        
        // Show boost section
        const boostSection = document.getElementById('boost-mining-section');
        if (boostSection) {
            boostSection.style.display = 'block';
        }

        // Update state
        this.state.isOGADSActive = false;
        this.state.lastTaskCompletion = Date.now();
        this.saveState();
        this.updateUI();
        
        // Record revenue
        this.recordRevenue(this.getTaskRevenue(taskType));
        
        this.showNotification(`✅ Task completed! Speed: ${oldSpeed} → ${this.state.miningSpeed} H/s`, 'success');
        
        // Enable mining button
        const miningBtn = document.getElementById('start-mining-btn');
        if (miningBtn) {
            miningBtn.disabled = false;
        }
        
        // Auto-hide boost section
        setTimeout(() => {
            if (boostSection) {
                boostSection.style.display = 'none';
            }
        }, 5000);
    }

    // 🧱 PILLAR 2: Smart Task Rotation
    getTaskReward(taskType) {
        const rewards = {
            'app_install': 15,          // Higher reward for app installs
            'app_install_signup': 20,   // Highest for app install + signup
            'survey': 12,               // Medium for surveys
            'signup_task': 10           // Lower for signup only
        };
        return rewards[taskType] || 10;
    }

    getTaskRevenue(taskType) {
        const revenues = {
            'app_install': 3.00,          // Higher EPC for app installs
            'app_install_signup': 4.50,   // Highest EPC
            'survey': 2.50,               // Medium EPC
            'signup_task': 1.50           // Lower EPC
        };
        return revenues[taskType] || 2.00;
    }

    // 🔐 Feature 5: Tab switching detection
    setupVisibilityHandlers() {
        let lastVisibilityChange = Date.now();
        
        document.addEventListener('visibilitychange', () => {
            const now = Date.now();
            if (now - lastVisibilityChange < 1000) return;
            
            if (document.hidden) {
                this.state.tabHidden = true;
                lastVisibilityChange = now;
                
                // Pause mining if active
                if (this.state.isMining) {
                    this.stopMining();
                    this.state.isMiningPaused = true;
                    this.showNotification('⏸️ Mining paused - tab switched', 'warning');
                }
                
                // Show warning if OGADS is active
                if (this.state.isOGADSActive) {
                    setTimeout(() => {
                        if (document.hidden && this.state.isOGADSActive) {
                            this.showTabSwitchWarning();
                        }
                    }, 2000);
                }
            } else {
                this.state.tabHidden = false;
                lastVisibilityChange = now;
            }
        });
    }

    showTabSwitchWarning() {
        if (!this.state.isOGADSActive || this.tabWarningActive) return;
        
        this.tabWarningActive = true;
        
        const warning = document.createElement('div');
        warning.id = 'tab-warning-overlay';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        `;
        
        warning.innerHTML = `
            <div style="background: rgba(231, 76, 60, 0.2); padding: 40px; border-radius: 10px; border: 2px solid #e74c3c;">
                <i class="fas fa-exclamation-triangle fa-3x" style="margin-bottom: 20px; color: #e74c3c;"></i>
                <h3 style="margin-bottom: 15px;">Return to Complete Task</h3>
                <p style="margin-bottom: 20px; max-width: 400px;">
                    Please return to complete the required task. Mining cannot resume until task completion.
                </p>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Remove when user returns
        const checkReturn = setInterval(() => {
            if (!document.hidden) {
                warning.remove();
                clearInterval(checkReturn);
                this.tabWarningActive = false;
            }
        }, 500);
    }

    // 🔐 Feature 10: Accurate mining speed calculation
    calculateAccurateSpeed() {
        // Base speed + boosts
        let speed = this.CONFIG.MINING_SPEED_BASE;
        
        // Add task boosts (last 1 hour only)
        const hourAgo = Date.now() - 3600000;
        this.state.completedTasks.forEach(task => {
            if (task.reward && task.timestamp > hourAgo) {
                speed += task.reward;
            }
        });

        // Anti-farm detection
        if (this.detectSuspiciousActivity()) {
            speed = Math.max(1, speed * 0.5);
            this.showSecurityWarning('Unusual activity detected - mining speed reduced');
        }

        this.state.miningSpeed = Math.floor(speed);
        
        // Update UI
        const speedElement = document.getElementById('mining-speed');
        if (speedElement) {
            speedElement.textContent = this.state.miningSpeed + ' H/s';
        }
    }

    detectSuspiciousActivity() {
        // Check for rapid task completion
        if (this.state.completedTasks.length > 3) {
            const recentTasks = this.state.completedTasks.slice(-3);
            const timeSpan = recentTasks[2].timestamp - recentTasks[0].timestamp;
            
            if (timeSpan < 10000) {
                return true;
            }
        }
        
        // Check for unrealistic speed
        if (this.state.miningSpeed > 100) {
            return true;
        }
        
        return false;
    }

    // 🧱 PILLAR 3: Withdrawal Protection Layer
    processWithdrawal() {
        if (this.state.withdrawalsToday >= this.CONFIG.MAX_WITHDRAWALS_PER_DAY) {
            this.showNotification('Daily withdrawal limit reached!', 'error');
            return false;
        }

        if (this.state.minedToday < 0.001) {
            this.showNotification('Minimum 0.001 NRX required', 'error');
            return false;
        }

        const modal = document.getElementById('withdrawal-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Set available amount
            const availableElement = document.getElementById('available-tokens');
            if (availableElement) {
                availableElement.textContent = this.state.minedToday.toFixed(4);
            }
            
            const amountInput = document.getElementById('withdrawal-amount');
            if (amountInput) {
                const maxAmount = Math.min(5, this.state.minedToday);
                amountInput.value = maxAmount.toFixed(4);
                amountInput.readOnly = false;
                amountInput.max = maxAmount;
                amountInput.min = 0.001;
            }
        }
        
        return true;
    }

    confirmWithdrawal() {
        const amountInput = document.getElementById('withdrawal-amount');
        const walletInput = document.getElementById('wallet-address');
        
        if (!amountInput || !walletInput) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const amount = parseFloat(amountInput.value);
        const wallet = walletInput.value.trim();

        // Validation
        if (!wallet || !wallet.startsWith('0x') || wallet.length !== 42) {
            this.showNotification('Please enter a valid BSC wallet address', 'error');
            return;
        }

        if (amount > this.state.minedToday) {
            this.showNotification('Insufficient balance', 'error');
            return;
        }

        // Create withdrawal with random delay (15-30 minutes)
        const delay = this.CONFIG.WITHDRAWAL_DELAY_MIN + 
                     Math.random() * (this.CONFIG.WITHDRAWAL_DELAY_MAX - this.CONFIG.WITHDRAWAL_DELAY_MIN);
        
        const withdrawal = {
            id: Date.now(),
            amount: amount,
            wallet: wallet,
            timestamp: Date.now(),
            status: 'pending_verification',
            completionTime: Date.now() + (delay * 1000),
            requiresVerification: true
        };

        this.state.withdrawalQueue.push(withdrawal);
        this.state.withdrawalsToday++;
        this.state.minedToday -= amount;
        this.state.pendingWithdrawal = withdrawal;

        // Close withdrawal modal
        const withdrawalModal = document.getElementById('withdrawal-modal');
        if (withdrawalModal) {
            withdrawalModal.style.display = 'none';
        }

        // Show verification requirement
        setTimeout(() => {
            this.showWithdrawalVerification(withdrawal);
        }, 3000);

        this.showNotification(`⏳ Withdrawal queued! ${amount} NRX - Verification required.`, 'success');
        this.saveState();
        this.updateUI();
    }

    showWithdrawalVerification(withdrawal) {
        const modal = document.getElementById('ogads-modal');
        if (modal) {
            const header = modal.querySelector('.modal-header h3');
            if (header) {
                header.textContent = 'Final Verification Required';
            }
            
            const bodyText = modal.querySelector('.modal-body p');
            if (bodyText) {
                bodyText.textContent = `Complete one final task to verify withdrawal of ${withdrawal.amount} NRX.`;
            }

            modal.style.display = 'block';
            this.state.isOGADSActive = true;
            
            this.monitorTaskCompletion();
        }
    }

    // 🧱 PILLAR 4: Revenue Target Engine
    initRevenueEngine() {
        this.revenueInterval = setInterval(() => {
            this.calculateRevenue();
            this.adjustMiningWindows();
        }, this.CONFIG.REVENUE_CHECK_INTERVAL);
    }

    calculateRevenue() {
        const hourAgo = Date.now() - 3600000;
        const recentTasks = this.state.completedTasks.filter(task => 
            task.timestamp > hourAgo
        );

        let totalRevenue = 0;
        recentTasks.forEach(task => {
            totalRevenue += this.getTaskRevenue(task.type);
        });
        
        this.state.revenuePerHour = totalRevenue;
        this.state.lastRevenueCheck = Date.now();
        
        console.log(`💰 Revenue/hour: $${totalRevenue.toFixed(2)}`);
    }

    adjustMiningWindows() {
        const targetPerHour = this.CONFIG.REVENUE_TARGET / 24;
        
        if (this.state.revenuePerHour < targetPerHour * 0.8) {
            // Below target - shorten to 4 minutes
            this.state.windowAdjustment = -60;
            console.log('📉 Revenue low - 4 minute windows');
        } else if (this.state.revenuePerHour > targetPerHour * 1.2) {
            // Above target - extend to 6 minutes
            this.state.windowAdjustment = 60;
            console.log('📈 Revenue high - 6 minute windows');
        } else {
            // On target - 5 minutes
            this.state.windowAdjustment = 0;
        }
        
        this.saveState();
    }

    recordRevenue(amount) {
        this.state.revenueHistory.push({
            amount: amount,
            timestamp: Date.now(),
            taskType: this.CONFIG.TASK_TYPES[this.state.currentTaskType]
        });
        
        // Keep last 24 hours
        const dayAgo = Date.now() - 86400000;
        this.state.revenueHistory = this.state.revenueHistory.filter(r => r.timestamp > dayAgo);
        
        localStorage.setItem('nrx_revenue_history', JSON.stringify(this.state.revenueHistory));
    }

    // 🔐 Feature 8: Auto-save continuously
    saveState() {
        try {
            const saveData = {
                minedToday: this.state.minedToday,
                miningSpeed: this.state.miningSpeed,
                completedTasks: this.state.completedTasks,
                withdrawalsToday: this.state.withdrawalsToday,
                currentTaskType: this.state.currentTaskType,
                windowAdjustment: this.state.windowAdjustment,
                dailyResetDate: this.state.dailyResetDate,
                miningCyclesCompleted: this.state.miningCyclesCompleted,
                lastSave: Date.now(),
                sessionId: this.state.sessionId
            };
            
            localStorage.setItem('nrx_security_state', JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('nrx_security_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                if (parsed.dailyResetDate === this.getTodayDateString()) {
                    this.state.minedToday = parsed.minedToday || 0;
                    this.state.miningSpeed = parsed.miningSpeed || 20;
                    this.state.completedTasks = parsed.completedTasks || [];
                    this.state.withdrawalsToday = parsed.withdrawalsToday || 0;
                    this.state.currentTaskType = parsed.currentTaskType || 0;
                    this.state.windowAdjustment = parsed.windowAdjustment || 0;
                    this.state.miningCyclesCompleted = parsed.miningCyclesCompleted || 0;
                    this.state.sessionId = parsed.sessionId || this.state.sessionId;
                    return true;
                } else {
                    this.resetDailyStats();
                }
            }
        } catch (e) {
            console.error('Load failed:', e);
        }
        return false;
    }

    // 🔐 Feature 9: Daily reset
    checkDailyReset() {
        const today = this.getTodayDateString();
        if (this.state.dailyResetDate !== today) {
            this.resetDailyStats();
        }
    }

    resetDailyStats() {
        const today = this.getTodayDateString();
        this.state.minedToday = 0;
        this.state.withdrawalsToday = 0;
        this.state.miningCyclesCompleted = 0;
        this.state.dailyResetDate = today;
        this.saveState();
        this.updateUI();
        console.log('🔄 Daily stats reset');
    }

    getTodayDateString() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    // ===== UI UPDATES =====
    updateUI() {
        // Update mined tokens
        const minedElement = document.getElementById('mined-tokens');
        if (minedElement) {
            minedElement.textContent = this.state.minedToday.toFixed(4) + ' NRX';
        }

        // Update mining speed
        const speedElement = document.getElementById('mining-speed');
        if (speedElement) {
            speedElement.textContent = this.state.miningSpeed + ' H/s';
        }

        // Update withdrawal button
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.disabled = this.state.minedToday < 0.001 || 
                                  this.state.withdrawalsToday >= this.CONFIG.MAX_WITHDRAWALS_PER_DAY ||
                                  this.state.isOGADSActive;
        }

        // Update mining button
        const miningBtn = document.getElementById('start-mining-btn');
        if (miningBtn) {
            miningBtn.disabled = this.state.isOGADSActive || 
                                this.state.minedToday >= this.CONFIG.DAILY_LIMIT;
        }

        // Check daily limit
        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT && this.state.isMining) {
            this.stopMining();
        }
    }

    // ===== EVENT HANDLERS =====
    setupEventListeners() {
        // Start/Stop Mining
        const startBtn = document.getElementById('start-mining-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.isMining) {
                    this.stopMining();
                } else {
                    this.startMining();
                }
            });
        }

        // Mine Now button
        const mineNowBtn = document.getElementById('mine-now-btn');
        if (mineNowBtn) {
            mineNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const boostSection = document.getElementById('boost-mining-section');
                if (boostSection) {
                    boostSection.style.display = 'block';
                    setTimeout(() => {
                        boostSection.style.display = 'none';
                    }, 5000);
                }
            });
        }

        // Withdraw button
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.processWithdrawal();
            });
        }

        // OGADS task completion button
        const taskCompletedBtn = document.getElementById('task-completed');
        if (taskCompletedBtn) {
            taskCompletedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.taskCompleted();
            });
        }

        // Confirm withdrawal
        const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
        if (confirmWithdrawalBtn) {
            confirmWithdrawalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmWithdrawal();
            });
        }

        // Copy address
        const copyBtn = document.getElementById('copy-address');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
                navigator.clipboard.writeText(address).then(() => {
                    this.showNotification('Contract copied!', 'success');
                });
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.isOGADSActive) {
                    this.showSecurityWarning('Complete the task first!');
                    return;
                }
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveState();
        }, 30000);
    }

    // ===== UTILITIES =====
    showNotification(message, type = 'info') {
        const existing = document.querySelectorAll('.nrx-notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'nrx-notification';
        
        const notificationClass = type === 'success' ? 'success-message' : 
                                type === 'error' ? 'error-message' : 'info-message';
        notification.classList.add(notificationClass);
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            padding: 15px 25px;
            border-radius: 5px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showSecurityWarning(message) {
        this.showNotification(`⚠️ ${message}`, 'warning');
    }

    generateSessionId() {
        return 'nrx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        
        .info-message {
            background: var(--primary);
            color: white;
        }
        
        .warning-message {
            background: var(--accent);
            color: white;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize
    try {
        window.nrxSecurity = new NRXSecuritySystem();
    } catch (error) {
        console.error('Security system failed:', error);
    }
});

// ===== ANTI-BOT PROTECTION =====
(function() {
    // Prevent dev tools
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });
})();
