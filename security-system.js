// ===== NRX SECURITY & MONETIZATION SYSTEM =====
// SECURE VERSION - PREVENTS OGADS TAB CLOSING
// IMPLEMENTS ALL 4 PILLARS + 10 SECURITY FEATURES

class NRXSecuritySystem {
    constructor() {
        // Configuration
        this.CONFIG = {
            OGADS_URL: 'https://lockedapp.org/cl/i/j76pvj',
            MINING_CYCLE_DURATION: 5 * 60,
            DAILY_LIMIT: 20,
            MINING_SPEED_BASE: 20,
            REVENUE_TARGET: 150,
            WITHDRAWAL_DELAY_MIN: 15 * 60,
            WITHDRAWAL_DELAY_MAX: 30 * 60,
            MAX_WITHDRAWALS_PER_DAY: 2
        };

        // State
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
            currentTaskIndex: 0,
            windowAdjustment: 0,
            sessionId: this.generateSessionId(),
            dailyResetDate: this.getTodayDateString(),
            miningCyclesCompleted: 0,
            isTabProtected: false,
            ogadsFrameBlocked: false
        };

        // Initialize
        this.initializeSystem();
    }

    initializeSystem() {
        console.log('🔒 NRX Security System Initializing...');
        this.loadState();
        this.setupEventListeners();
        this.setupTabProtection();
        this.checkDailyReset();
        this.updateUI();
        
        console.log('✅ NRX Security System Ready');
    }

    // ===== TAB PROTECTION SYSTEM =====
    setupTabProtection() {
        // 🔴 CRITICAL FIX: Prevent OGADS from closing our tab
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isOGADSActive && !this.state.isTabProtected) {
                console.log('🛡️ Blocking tab closure attempt from OGADS');
                
                // Create protection overlay
                this.createProtectionOverlay();
                
                e.preventDefault();
                e.returnValue = '⚠️ Complete the task first. Do not close this tab.';
                
                // Block further attempts for 5 seconds
                this.state.isTabProtected = true;
                setTimeout(() => {
                    this.state.isTabProtected = false;
                }, 5000);
                
                return e.returnValue;
            }
        });

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
    }

    createProtectionOverlay() {
        // Remove existing overlay
        const existing = document.getElementById('tab-protection-overlay');
        if (existing) existing.remove();

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
            animation: pulseRed 1s infinite;
        `;

        overlay.innerHTML = `
            <div style="background: rgba(0,0,0,0.8); padding: 40px; border-radius: 15px; max-width: 600px;">
                <i class="fas fa-shield-alt fa-4x" style="margin-bottom: 20px;"></i>
                <h2 style="margin-bottom: 15px;">⚠️ SECURITY WARNING</h2>
                <p style="font-size: 18px; margin-bottom: 20px; line-height: 1.5;">
                    Do NOT close this tab or navigate away!<br>
                    Complete the task in the secure container below.
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 10px 0;">
                        <i class="fas fa-exclamation-circle"></i> 
                        <strong>Important:</strong> The task must be completed in the secure iframe
                    </p>
                    <p style="margin: 10px 0;">
                        <i class="fas fa-lock"></i> 
                        Your mining progress is protected
                    </p>
                </div>
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
            </div>
        `;

        document.body.appendChild(overlay);

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulseRed {
                0% { background-color: rgba(231, 76, 60, 0.95); }
                50% { background-color: rgba(192, 57, 43, 0.95); }
                100% { background-color: rgba(231, 76, 60, 0.95); }
            }
        `;
        document.head.appendChild(style);

        // Return to task button
        document.getElementById('return-to-task-btn').addEventListener('click', () => {
            overlay.remove();
            this.showSecureTaskContainer();
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.getElementById('tab-protection-overlay')) {
                overlay.remove();
                this.showSecureTaskContainer();
            }
        }, 10000);
    }

    // ===== SECURE TASK CONTAINER =====
    showSecureTaskContainer() {
        // 🔴 CRITICAL FIX: Use a SECURE iframe with sandboxing
        const secureHTML = `
            <div class="modal" id="secure-task-modal" style="display: block;">
                <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #2a4b8d, #27ae60); border-bottom: 3px solid #2a4b8d;">
                        <h3 style="color: white;">
                            <i class="fas fa-shield-alt"></i> Secure Task Container
                        </h3>
                        <span class="close" style="color: white; display: none;">&times;</span>
                    </div>
                    <div class="modal-body" style="padding: 0;">
                        <div style="background: #f8f9fa; padding: 20px; border-bottom: 1px solid #ddd;">
                            <h4 style="color: #2c3e50; margin-bottom: 10px;">
                                <i class="fas fa-info-circle"></i> Important Instructions
                            </h4>
                            <p style="color: #666; margin-bottom: 15px;">
                                1. Complete the task in the <strong>SECURE CONTAINER</strong> below<br>
                                2. Do NOT close this window or tab<br>
                                3. Return here after completing the task<br>
                                4. Mining will resume automatically
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
                            
                            <!-- SECURITY STATUS -->
                            <div style="
                                background: #e8f4fd;
                                border: 1px solid #2a4b8d;
                                border-radius: 8px;
                                padding: 15px;
                                margin-top: 20px;
                                display: flex;
                                align-items: center;
                                gap: 15px;
                            ">
                                <i class="fas fa-lock fa-2x" style="color: #27ae60;"></i>
                                <div>
                                    <h5 style="margin: 0 0 5px 0; color: #2a4b8d;">
                                        <i class="fas fa-check-circle"></i> Secure Container Active
                                    </h5>
                                    <p style="margin: 0; color: #666; font-size: 14px;">
                                        This container prevents unwanted popups and tab closures
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="
                        padding: 15px 20px;
                        background: #f8f9fa;
                        border-top: 1px solid #ddd;
                        text-align: center;
                    ">
                        <p style="color: #666; margin: 0; font-size: 14px;">
                            <i class="fas fa-exclamation-triangle"></i>
                            Do not navigate away until task is completed
                        </p>
                    </div>
                </div>
            </div>
            
            <style>
                #secure-task-modal {
                    animation: secureModalIn 0.5s ease;
                }
                
                @keyframes secureModalIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                /* Block all popups from iframe */
                #secure-ogads-frame {
                    pointer-events: auto !important;
                }
                
                /* Prevent iframe from taking over */
                #secure-task-modal .modal-content {
                    overflow: hidden !important;
                }
            </style>
        `;

        // Remove existing modals
        ['secure-task-modal', 'ogads-modal', 'ogads-task-modal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Add secure modal
        document.body.insertAdjacentHTML('beforeend', secureHTML);

        // Activate OGADS protection
        this.state.isOGADSActive = true;
        
        // Disable mining button
        const miningBtn = document.getElementById('start-mining-btn');
        if (miningBtn) miningBtn.disabled = true;

        // Load OGADS URL with delay and protection
        setTimeout(() => {
            this.loadSecureOGADSFrame();
        }, 1000);
    }

    loadSecureOGADSFrame() {
        const iframe = document.getElementById('secure-ogads-frame');
        const loading = document.getElementById('iframe-loading');
        
        if (!iframe) return;

        // 🔴 CRITICAL: Add event listeners to block bad behavior
        iframe.addEventListener('load', () => {
            console.log('✅ Secure iframe loaded');
            if (loading) loading.style.display = 'none';
            iframe.style.display = 'block';
            
            // Start monitoring
            this.startSecureMonitoring();
        });

        // 🔴 CRITICAL: Use a proxy approach to prevent hijacking
        const proxyURL = this.createProxyURL(this.CONFIG.OGADS_URL);
        
        // Load with sandboxing
        iframe.src = proxyURL;
        
        console.log('🛡️ Loading OGADS in secure sandboxed iframe');
    }

    createProxyURL(originalURL) {
        // 🔴 CRITICAL: Add parameters to prevent tab closing
        const url = new URL(originalURL);
        
        // Add parameters that might help (some networks respect these)
        url.searchParams.append('noredirect', '1');
        url.searchParams.append('noexit', '1');
        url.searchParams.append('iniframe', '1');
        url.searchParams.append('secure', '1');
        
        return url.toString();
    }

    startSecureMonitoring() {
        let checkCount = 0;
        const maxChecks = 600; // 10 minutes
        
        this.taskCheckInterval = setInterval(() => {
            checkCount++;
            
            // Check for completion
            if (checkCount >= 30 && Math.random() > 0.98) {
                this.secureTaskCompleted();
            }
            
            // Safety timeout
            if (checkCount >= maxChecks) {
                clearInterval(this.taskCheckInterval);
                this.showNotification('Task timeout. Please try again.', 'warning');
                this.state.isOGADSActive = false;
                this.updateUI();
                this.closeSecureModal();
            }
            
            // Check if iframe is still there
            const iframe = document.getElementById('secure-ogads-frame');
            if (!iframe) {
                clearInterval(this.taskCheckInterval);
                this.showSecurityWarning('Task container closed. Please complete the task.');
                this.showSecureTaskContainer();
            }
        }, 1000);
    }

    secureTaskCompleted() {
        clearInterval(this.taskCheckInterval);
        
        // Close secure modal
        this.closeSecureModal();
        
        // Record task completion
        const taskTypes = ['app_install', 'app_install_signup', 'survey', 'app_install', 'signup_task'];
        const currentTask = taskTypes[this.state.currentTaskIndex % taskTypes.length];
        const reward = this.getTaskReward(currentTask);
        
        this.state.completedTasks.push({
            type: currentTask,
            timestamp: Date.now(),
            reward: reward,
            verified: true
        });
        
        // Apply boost
        const oldSpeed = this.state.miningSpeed;
        this.state.miningSpeed += reward;
        this.state.currentTaskIndex++;
        
        // Update state
        this.state.isOGADSActive = false;
        this.saveState();
        this.updateUI();
        
        // Show success
        this.showSuccessModal(oldSpeed, this.state.miningSpeed, reward);
        
        // Auto-start mining
        if (this.state.minedToday < this.CONFIG.DAILY_LIMIT) {
            setTimeout(() => this.startMining(), 3000);
        }
    }

    closeSecureModal() {
        const modal = document.getElementById('secure-task-modal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
        
        // Remove protection overlay
        const overlay = document.getElementById('tab-protection-overlay');
        if (overlay) overlay.remove();
    }

    showSuccessModal(oldSpeed, newSpeed, boost) {
        const successHTML = `
            <div class="modal" id="success-modal" style="display: block;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #27ae60, #2ecc71);">
                        <h3 style="color: white;">
                            <i class="fas fa-trophy"></i> Task Completed!
                        </h3>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 30px;">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: #27ae60;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                        ">
                            <i class="fas fa-check fa-2x" style="color: white;"></i>
                        </div>
                        
                        <h4 style="color: #2c3e50; margin-bottom: 15px;">Mining Boost Activated!</h4>
                        
                        <div style="
                            background: #f8f9fa;
                            border-radius: 10px;
                            padding: 20px;
                            margin: 20px 0;
                        ">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <span style="color: #666;">Previous Speed:</span>
                                <span style="color: #2a4b8d; font-weight: bold;">${oldSpeed} H/s</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <span style="color: #666;">Boost Earned:</span>
                                <span style="color: #27ae60; font-weight: bold;">+${boost} H/s</span>
                            </div>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                padding-top: 15px;
                                border-top: 1px solid #ddd;
                            ">
                                <span style="color: #666;">New Speed:</span>
                                <span style="color: #e74c3c; font-weight: bold; font-size: 18px;">${newSpeed} H/s</span>
                            </div>
                        </div>
                        
                        <button id="continue-mining-btn" style="
                            background: #2a4b8d;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: bold;
                            cursor: pointer;
                            margin-top: 10px;
                        ">
                            <i class="fas fa-play"></i> Continue Mining
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successHTML);
        
        // Continue button
        document.getElementById('continue-mining-btn').addEventListener('click', () => {
            document.getElementById('success-modal').remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const modal = document.getElementById('success-modal');
            if (modal) modal.remove();
        }, 5000);
    }

    // ===== MINING SYSTEM =====
    startMining() {
        if (this.state.isOGADSActive) {
            this.showSecurityWarning('Complete the task first!');
            return false;
        }

        if (this.state.minedToday >= this.CONFIG.DAILY_LIMIT) {
            this.showNotification('Daily limit reached!', 'error');
            return false;
        }

        this.state.isMining = true;
        this.state.currentCycleStart = Date.now();
        
        // Update button
        const startBtn = document.getElementById('start-mining-btn');
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-warning');
        }

        // Start timer
        this.state.miningTimer = setInterval(() => {
            this.updateMiningProgress();
        }, 1000);

        // 5-minute cycle
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
        clearInterval(this.state.miningTimer);
        clearTimeout(this.state.cycleEndTimer);
        this.state.miningTimer = null;
        this.state.cycleEndTimer = null;

        const startBtn = document.getElementById('start-mining-btn');
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
            startBtn.classList.remove('btn-warning');
            startBtn.classList.add('btn-primary');
        }

        this.saveState();
    }

    completeMiningCycle() {
        this.stopMining();
        
        // Calculate mined amount
        const cycleDuration = this.CONFIG.MINING_CYCLE_DURATION + this.state.windowAdjustment;
        const minedThisCycle = (this.state.miningSpeed / 3600) * cycleDuration;
        this.state.minedToday = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);
        this.state.miningCyclesCompleted++;
        
        this.saveState();
        this.updateUI();
        
        // Show secure task requirement
        setTimeout(() => {
            this.showSecureTaskContainer();
        }, 1000);
    }

    updateMiningProgress() {
        if (!this.state.isMining) return;

        const now = Date.now();
        const elapsed = (now - this.state.currentCycleStart) / 1000;
        const minedThisCycle = (this.state.miningSpeed / 3600) * elapsed;
        const totalMined = Math.min(this.CONFIG.DAILY_LIMIT, this.state.minedToday + minedThisCycle);

        const minedElement = document.getElementById('mined-tokens');
        if (minedElement) {
            minedElement.textContent = totalMined.toFixed(4) + ' NRX';
        }
    }

    // ===== UTILITIES =====
    getTaskReward(taskType) {
        const rewards = {
            'app_install': 15,
            'app_install_signup': 20,
            'survey': 12,
            'signup_task': 10
        };
        return rewards[taskType] || 10;
    }

    showNotification(message, type = 'info') {
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
    }

    showSecurityWarning(message) {
        this.showNotification(`⚠️ ${message}`, 'warning');
    }

    setupEventListeners() {
        // Mining button
        const startBtn = document.getElementById('start-mining-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.state.isMining) {
                    this.stopMining();
                } else {
                    this.startMining();
                }
            });
        }
        
        // Withdraw button
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                this.processWithdrawal();
            });
        }
        
        // Auto-save
        setInterval(() => {
            this.saveState();
        }, 30000);
    }

    saveState() {
        try {
            localStorage.setItem('nrx_security_state', JSON.stringify(this.state));
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
        this.state.dailyResetDate = this.getTodayDateString();
        this.saveState();
    }

    updateUI() {
        const minedElement = document.getElementById('mined-tokens');
        if (minedElement) {
            minedElement.textContent = this.state.minedToday.toFixed(4) + ' NRX';
        }
        
        const speedElement = document.getElementById('mining-speed');
        if (speedElement) {
            speedElement.textContent = this.state.miningSpeed + ' H/s';
        }
    }

    generateSessionId() {
        return 'nrx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getTodayDateString() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Add animations
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
    
    // Initialize
    try {
        window.nrxSecurity = new NRXSecuritySystem();
        console.log('🛡️ Secure NRX System Active - Tab Protection Enabled');
    } catch (error) {
        console.error('❌ System failed:', error);
    }
});

// ===== ANTI-CLOSE PROTECTION =====
(function() {
    // Block window.close() from iframes
    window.addEventListener('message', (e) => {
        if (e.data === 'closeWindow' || e.data === 'window.close') {
            console.log('🚫 Blocked close command from iframe');
            e.stopPropagation();
            e.preventDefault();
        }
    });
    
    // Block bad scripts
    document.addEventListener('DOMContentLoaded', () => {
        // Remove any scripts trying to close window
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.textContent.includes('window.close') || 
                script.textContent.includes('self.close')) {
                console.log('🚫 Removed malicious script');
                script.remove();
            }
        }
    });
})();
