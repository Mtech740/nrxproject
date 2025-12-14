// ===== NRX SECURITY & MONETIZATION SYSTEM =====
// Implements all 10 security features and 4-pillar system
// Works with your exact HTML and CSS structure

class NRXSecuritySystem {
    constructor() {
        // Configuration - matches your existing structure
        this.CONFIG = {
            OGADS_URL: 'https://applocked.org/cl/i/j76pvj',
            MINING_CYCLE_DURATION: 5 * 60, // 5 minutes in seconds
            DAILY_LIMIT: 20,
            MINING_SPEED_BASE: 20,
            REVENUE_TARGET: 150, // $150-200 daily target
            WITHDRAWAL_DELAY: 20 * 60, // 20 minutes
            MAX_WITHDRAWALS_PER_DAY: 2,
            REVENUE_CHECK_INTERVAL: 4 * 60 * 1000, // 4 minutes
            TASK_TYPES: ['watch_video', 'share_social', 'install_app', 'invite_friend', 'search_web', 'complete_survey']
        };

        // State management - integrates with your existing script.js
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
            lastMiningResume: null,
            taskCompletionAttempts: 0
        };

        // Initialize the system
        this.initializeSystem();
    }

    // ===== INITIALIZATION =====
    initializeSystem() {
        console.log('NRX Security System Initializing...');
        this.loadState();
        this.setupEventListeners();
        this.setupVisibilityHandlers();
        this.setupAntiBypass();
        this.initRevenueEngine();
        this.checkDailyReset();
        this.updateUI();
        
        // Sync with existing script.js if available
        this.syncWithExistingScript();
        
        console.log('NRX Security System Ready');
    }

    // Sync with your existing script.js state
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

        if (this.state.isMiningPaused && this.state.lastMiningResume) {
            const timeSincePause = Date.now() - this.state.lastMiningResume;
            if (timeSincePause < 10000) { // 10 second cooldown
                this.showNotification('Please wait before resuming mining', 'warning');
                return false;
            }
        }

        this.state.isMining = true;
        this.state.isMiningPaused = false;
        this.state.currentCycleStart = Date.now();
        
        // Update button state to match your CSS
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

        // Set cycle end timer - 5-minute locked window
        const cycleDuration = (this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment) * 1000;
        this.state.cycleEndTimer = setTimeout(() => {
            this.completeMiningCycle();
        }, cycleDuration);

        this.showNotification('Mining started! 5-minute cycle active.', 'success');
        return true;
    }

    stopMining(pauseOnly = false) {
        if (!this.state.isMining && !pauseOnly) return;

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
            if (pauseOnly) {
                startBtn.innerHTML = '<i class="fas fa-play"></i> Resume Mining';
                this.state.isMiningPaused = true;
                this.state.lastMiningResume = Date.now();
            } else {
                startBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-primary');
                this.state.isMiningPaused = false;
            }
        }

        if (!pauseOnly) {
            this.saveState();
        }
    }

    completeMiningCycle() {
        // 🔐 Feature 2: Mining stops immediately when OGADS is triggered
        this.stopMining();
        
        // Calculate mined amount for this cycle
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        const minedThisCycle = (this.state.miningSpeed / 3600) * cycleDuration;
        this.state.minedToday = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);
        
        // 🔐 Feature 9: Daily cap enforcement
        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.showNotification('🎉 Daily limit reached! Come back tomorrow.', 'success');
        }

        this.saveState();
        this.updateUI();
        
        // 🔐 Feature 7: Task prompt appears after each mining cycle
        setTimeout(() => {
            this.showTaskRequirement();
        }, 1000); // Small delay for UX
    }

    updateMiningProgress() {
        if (!this.state.isMining) return;

        // Calculate progress percentage
        const now = Date.now();
        const elapsed = (now - this.state.currentCycleStart) / 1000;
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        
        // Show warning when 1 minute left
        if (cycleDuration - elapsed <= 60 && cycleDuration - elapsed > 59) {
            this.showNotification('1 minute left in mining cycle!', 'info');
        }

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

        // Auto-save every 30 seconds
        if (Math.floor(elapsed) % 30 === 0) {
            this.saveState();
        }
    }

    // 🔐 Feature 7: Task prompt appears after each mining cycle
    showTaskRequirement() {
        const modal = document.getElementById('ogads-modal');
        if (!modal) return;

        // Update modal content for task requirement
        const header = modal.querySelector('.modal-header h3');
        if (header) {
            header.textContent = 'Complete Task to Continue Mining';
        }
        
        const bodyText = modal.querySelector('.modal-body p');
        if (bodyText) {
            bodyText.textContent = 'You\'ve completed a 5-minute mining cycle. Complete one task to unlock the next cycle.';
        }

        // Show modal
        modal.style.display = 'block';
        
        // 🔐 Feature 1: OGADS cannot be bypassed
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.style.display = 'none'; // Hide close button
        }

        // Set OGADS URL
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
        // Prevent page refresh during OGADS
        let hasShownWarning = false;
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isOGADSActive && !hasShownWarning) {
                e.preventDefault();
                e.returnValue = 'You must complete the task to continue mining.';
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

        // Prevent iframe escape
        document.addEventListener('click', (e) => {
            if (this.state.isOGADSActive && e.target.classList.contains('modal')) {
                e.preventDefault();
                e.stopPropagation();
                this.showSecurityWarning('Complete the task to continue.');
            }
        });
    }

    monitorTaskCompletion() {
        let checkCount = 0;
        const maxChecks = 300; // 5 minutes max
        
        this.taskCheckInterval = setInterval(() => {
            checkCount++;
            
            // 🔐 Feature 5: Tab switching detection
            if (document.hidden && this.state.isOGADSActive) {
                this.showTabSwitchWarning();
            }

            // Check for suspicious behavior
            if (checkCount > 10 && this.state.taskCompletionAttempts > 3) {
                this.showSecurityWarning('Multiple task attempts detected. Please complete one task properly.');
            }

            // Simulated completion check (in production, use OGADS postback)
            if (checkCount >= 10 && Math.random() > 0.8) {
                this.taskCompleted();
            }

            if (checkCount >= maxChecks) {
                clearInterval(this.taskCheckInterval);
                this.showNotification('Task timeout. Please try again.', 'error');
                this.state.isOGADSActive = false;
                this.updateUI();
            }
        }, 1000); // Check every second
    }

    taskCompleted() {
        if (!this.taskCheckInterval) return;
        
        clearInterval(this.taskCheckInterval);
        this.taskCheckInterval = null;
        
        // Hide modal
        const modal = document.getElementById('ogads-modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Restore close button
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.style.display = 'block';
            }
        }

        // 🧱 PILLAR 2: Smart Task Rotation
        const taskReward = this.getTaskReward();
        this.state.completedTasks.push({
            type: this.CONFIG.TASK_TYPES[this.state.currentTaskType],
            timestamp: Date.now(),
            reward: taskReward
        });

        // Rotate task type
        this.state.currentTaskType = (this.state.currentTaskType + 1) % this.CONFIG.TASK_TYPES.length;

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
        this.state.taskCompletionAttempts = 0;
        this.saveState();
        this.updateUI();
        
        // Record revenue
        this.recordRevenue(2.50);
        
        this.showNotification(`Task completed! Speed increased from ${oldSpeed} to ${this.state.miningSpeed} H/s`, 'success');
        
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
    getTaskReward() {
        const taskType = this.CONFIG.TASK_TYPES[this.state.currentTaskType];
        
        // Different rewards based on task type (matches your HTML)
        const rewards = {
            'watch_video': 5,
            'share_social': 10,
            'install_app': 15,
            'invite_friend': 20,
            'search_web': 8,
            'complete_survey': 12
        };
        
        return rewards[taskType] || 5;
    }

    // 🔐 Feature 5: Tab switching detection
    setupVisibilityHandlers() {
        let lastVisibilityChange = Date.now();
        
        document.addEventListener('visibilitychange', () => {
            const now = Date.now();
            const timeSinceLastChange = now - lastVisibilityChange;
            
            if (timeSinceLastChange < 1000) return; // Debounce
            
            if (document.hidden) {
                this.state.tabHidden = true;
                lastVisibilityChange = now;
                
                // Pause mining if active
                if (this.state.isMining) {
                    this.stopMining(true); // Pause only
                    this.showNotification('Mining paused - tab switched', 'warning');
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
        
        // Create warning overlay
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
                <p style="margin-bottom: 20px; max-width: 400px;">Please return to the mining tab to complete the required task.</p>
                <p style="font-size: 14px; opacity: 0.8;">
                    <i class="fas fa-info-circle"></i> Task must be completed to continue mining
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

    // 🔐 Feature 10: Accurate mining speed calculation (anti-farm)
    calculateAccurateSpeed() {
        // Base speed + boosts
        let speed = this.CONFIG.MINING_SPEED_BASE;
        
        // Add task boosts
        this.state.completedTasks.forEach(task => {
            if (task.reward && Date.now() - task.timestamp < 3600000) { // Boosts last 1 hour
                speed += task.reward;
            }
        });

        // Anti-farm detection
        if (this.detectSuspiciousActivity()) {
            speed = Math.max(1, speed * 0.5); // Reduce by 50%
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
            
            if (timeSpan < 10000) { // 3 tasks in 10 seconds
                return true;
            }
        }
        
        // Check for unrealistic mining speed
        if (this.state.miningSpeed > 100) {
            return true;
        }
        
        // Check for too many task attempts
        if (this.state.taskCompletionAttempts > 5) {
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

        // Show withdrawal modal
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
                const maxAmount = Math.min(5, this.state.minedToday); // Cap at 5 NRX
                amountInput.value = maxAmount.toFixed(4);
                amountInput.readOnly = false;
                amountInput.max = maxAmount;
                amountInput.min = 0.001;
            }
            
            // Clear wallet address
            const walletInput = document.getElementById('wallet-address');
            if (walletInput) {
                walletInput.value = '';
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
            this.showNotification('Please enter a valid BSC wallet address (0x... 42 chars)', 'error');
            return;
        }

        if (amount > this.state.minedToday) {
            this.showNotification('Insufficient balance', 'error');
            return;
        }

        if (amount < 0.001) {
            this.showNotification('Minimum withdrawal is 0.001 NRX', 'error');
            return;
        }

        // Create withdrawal record
        const withdrawal = {
            id: Date.now(),
            amount: amount,
            wallet: wallet,
            timestamp: Date.now(),
            status: 'pending',
            completionTime: Date.now() + (this.CONFIG.WITHDRAWAL_DELAY * 1000),
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

        // Show verification requirement after 3 seconds
        setTimeout(() => {
            this.showWithdrawalVerification(withdrawal);
        }, 3000);

        this.showNotification(`Withdrawal queued! ${amount} NRX will be sent after verification.`, 'success');
        this.saveState();
        this.updateUI();
    }

    showWithdrawalVerification(withdrawal) {
        // Use OGADS modal for verification
        const modal = document.getElementById('ogads-modal');
        if (modal) {
            // Update modal content
            const header = modal.querySelector('.modal-header h3');
            if (header) {
                header.textContent = 'Withdrawal Verification Required';
            }
            
            const bodyText = modal.querySelector('.modal-body p');
            if (bodyText) {
                bodyText.textContent = `Complete one final task to verify your withdrawal of ${withdrawal.amount} NRX to ${withdrawal.wallet.substring(0, 8)}...`;
            }

            modal.style.display = 'block';
            this.state.isOGADSActive = true;
            
            // Start monitoring task completion
            this.monitorTaskCompletion();
        }
    }

    // 🧱 PILLAR 4: Revenue Target Engine
    initRevenueEngine() {
        // Check revenue every 4 minutes
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

        // Simulated revenue calculation ($2.50 per task average)
        const taskRevenue = recentTasks.length * 2.50;
        this.state.revenuePerHour = taskRevenue;
        this.state.lastRevenueCheck = Date.now();
        
        console.log(`[Revenue Engine] Current revenue/hour: $${taskRevenue.toFixed(2)}`);
    }

    adjustMiningWindows() {
        const targetPerHour = this.CONFIG.REVENUE_TARGET / 24;
        
        if (this.state.revenuePerHour < targetPerHour * 0.8) {
            // Below target - shorten windows to increase task frequency
            this.state.windowAdjustment = -60; // 4 minutes
            console.log('[Revenue Engine] Revenue low - shortening mining windows to 4 minutes');
        } else if (this.state.revenuePerHour > targetPerHour * 1.2) {
            // Above target - extend windows for better UX
            this.state.windowAdjustment = 60; // 6 minutes
            console.log('[Revenue Engine] Revenue high - extending mining windows to 6 minutes');
        } else {
            // On target
            this.state.windowAdjustment = 0;
        }
        
        this.saveState();
    }

    recordRevenue(amount) {
        try {
            const revenueHistory = JSON.parse(localStorage.getItem('nrx_revenue_history') || '[]');
            revenueHistory.push({
                amount: amount,
                timestamp: Date.now(),
                type: 'task_completion'
            });
            
            // Keep only last 24 hours
            const dayAgo = Date.now() - 86400000;
            const filteredHistory = revenueHistory.filter(r => r.timestamp > dayAgo);
            localStorage.setItem('nrx_revenue_history', JSON.stringify(filteredHistory));
        } catch (e) {
            console.warn('Could not record revenue:', e);
        }
    }

    // 🔐 Feature 8: Mining progress auto-saves continuously
    saveState() {
        try {
            const saveData = {
                minedToday: this.state.minedToday,
                miningSpeed: this.state.miningSpeed,
                completedTasks: this.state.completedTasks,
                withdrawalsToday: this.state.withdrawalsToday,
                withdrawalQueue: this.state.withdrawalQueue,
                currentTaskType: this.state.currentTaskType,
                windowAdjustment: this.state.windowAdjustment,
                dailyResetDate: this.state.dailyResetDate,
                lastSave: Date.now(),
                sessionId: this.state.sessionId
            };
            
            localStorage.setItem('nrx_security_state', JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save state:', e);
            return false;
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('nrx_security_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Check if it's from today
                if (parsed.dailyResetDate === this.getTodayDateString()) {
                    this.state.minedToday = parsed.minedToday || 0;
                    this.state.miningSpeed = parsed.miningSpeed || 20;
                    this.state.completedTasks = parsed.completedTasks || [];
                    this.state.withdrawalsToday = parsed.withdrawalsToday || 0;
                    this.state.withdrawalQueue = parsed.withdrawalQueue || [];
                    this.state.currentTaskType = parsed.currentTaskType || 0;
                    this.state.windowAdjustment = parsed.windowAdjustment || 0;
                    this.state.sessionId = parsed.sessionId || this.state.sessionId;
                    return true;
                } else {
                    // New day - reset daily stats
                    this.resetDailyStats();
                }
            }
        } catch (e) {
            console.error('Failed to load state:', e);
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
        this.state.completedTasks = [];
        this.state.dailyResetDate = today;
        this.saveState();
        this.updateUI();
        console.log('Daily stats reset for new day');
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

        // Update withdrawal button state
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.disabled = this.state.minedToday < 0.001 || 
                                  this.state.withdrawalsToday >= this.CONFIG.MAX_WITHDRAWALS_PER_DAY ||
                                  this.state.isOGADSActive;
        }

        // Update mining button state
        const miningBtn = document.getElementById('start-mining-btn');
        if (miningBtn) {
            miningBtn.disabled = this.state.isOGADSActive || 
                                this.state.minedToday >= this.CONFIG.DAILY_LIMIT;
        }

        // Update task completion indicators
        this.updateTaskIndicators();
        
        // Check daily limit
        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT && this.state.isMining) {
            this.stopMining();
        }
    }

    updateTaskIndicators() {
        const taskElements = document.querySelectorAll('.task');
        taskElements.forEach((taskEl, index) => {
            if (index < this.CONFIG.TASK_TYPES.length) {
                const taskType = this.CONFIG.TASK_TYPES[index];
                const completed = this.state.completedTasks.some(t => t.type === taskType);
                
                if (completed) {
                    taskEl.classList.add('completed');
                    taskEl.style.opacity = '0.7';
                    taskEl.style.cursor = 'default';
                    
                    // Add checkmark if not already present
                    if (!taskEl.querySelector('.task-checkmark')) {
                        const checkmark = document.createElement('div');
                        checkmark.className = 'task-checkmark';
                        checkmark.innerHTML = '<i class="fas fa-check-circle"></i>';
                        checkmark.style.cssText = 'position:absolute; top:10px; right:10px; color:#27ae60; font-size:20px;';
                        taskEl.style.position = 'relative';
                        taskEl.appendChild(checkmark);
                    }
                } else {
                    taskEl.classList.remove('completed');
                    taskEl.style.opacity = '1';
                    taskEl.style.cursor = 'pointer';
                }
            }
        });
    }

    // ===== EVENT HANDLERS =====
    setupEventListeners() {
        // Start/Stop Mining button
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

        // Mine Now button (shows boost section)
        const mineNowBtn = document.getElementById('mine-now-btn');
        if (mineNowBtn) {
            mineNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const boostSection = document.getElementById('boost-mining-section');
                if (boostSection) {
                    boostSection.style.display = 'block';
                    
                    // Auto-hide after 5 seconds
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

        // Task clicks
        const tasks = document.querySelectorAll('.task');
        tasks.forEach(task => {
            task.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Check if task is already completed
                if (task.classList.contains('completed')) {
                    this.showNotification('Task already completed!', 'info');
                    return;
                }
                
                this.state.taskCompletionAttempts++;
                
                // Show OGADS modal for task
                this.showTaskRequirement();
            });
        });

        // OGADS task completion button
        const taskCompletedBtn = document.getElementById('task-completed');
        if (taskCompletedBtn) {
            taskCompletedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.taskCompleted();
            });
        }

        // Confirm withdrawal button
        const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
        if (confirmWithdrawalBtn) {
            confirmWithdrawalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmWithdrawal();
            });
        }

        // Copy address button
        const copyBtn = document.getElementById('copy-address');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
                navigator.clipboard.writeText(address).then(() => {
                    this.showNotification('Contract address copied!', 'success');
                }).catch(() => {
                    this.showNotification('Failed to copy address', 'error');
                });
            });
        }

        // Modal close buttons (with restrictions)
        document.querySelectorAll('.close, .withdrawal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 🔐 Feature 4: Prevent closing during required tasks
                if (this.state.isOGADSActive) {
                    this.showSecurityWarning('You must complete the task first!');
                    return;
                }
                
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Close modals when clicking outside (with restrictions)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                // 🔐 Feature 4: Prevent closing during required tasks
                if (this.state.isOGADSActive) {
                    this.showSecurityWarning('Complete the task to continue.');
                    return;
                }
                
                e.target.style.display = 'none';
            }
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveState();
        }, 30000);

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }

    // ===== UTILITIES =====
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.nrx-notification');
        existingNotifications.forEach(n => n.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'nrx-notification';
        
        // Use your existing CSS classes
        const notificationClass = type === 'success' ? 'success-message' : 
                                type === 'error' ? 'error-message' : 
                                'info-message';
        notification.classList.add(notificationClass);
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Position it at the top
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
        
        // Remove after 5 seconds
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
        
        .task.completed {
            pointer-events: none;
        }
        
        .task-checkmark {
            animation: fadeIn 0.3s ease;
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
    
    // Initialize security system
    try {
        window.nrxSecurity = new NRXSecuritySystem();
        console.log('✅ NRX Security System initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize NRX Security System:', error);
    }
});

// ===== ANTI-BOT PROTECTION =====
(function() {
    // Prevent right-click on OGADS iframe
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.ogads-frame-container') || 
            e.target.closest('#ogads-frame')) {
            e.preventDefault();
            return false;
        }
    });
    
    // Prevent keyboard shortcuts for dev tools
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            alert('Developer tools are disabled for security.');
            return false;
        }
    });
    
    // Detect iframe embedding
    if (window.self !== window.top) {
        // Allow embedding from same origin
        if (window.self.location.origin !== window.top.location.origin) {
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; color: var(--dark);">
                    <h2>Access Restricted</h2>
                    <p>This site cannot be embedded in iframes for security reasons.</p>
                </div>
            `;
        }
    }
})();
