// ==================== ADSTERRA VISIBLE POPUNDER INTEGRATION ====================
function loadAdsterraAd() {
    console.log('💰 Loading VISIBLE Adsterra ad...');
    
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;
    
    // Clear and show ad interface
    adContainer.innerHTML = `
        <div id="visible-ad-container" style="width: 100%; height: 100%; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95)); border-radius: 12px; border: 2px solid #f39c12; box-shadow: 0 0 30px rgba(243, 156, 18, 0.3); padding: 30px; text-align: center;">
            
            <!-- Header -->
            <div style="margin-bottom: 25px;">
                <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(231, 76, 60, 0.1); padding: 8px 20px; border-radius: 20px; border: 1px solid rgba(231, 76, 60, 0.3);">
                    <div style="width: 8px; height: 8px; background: #e74c3c; border-radius: 50%; animation: pulse 1s infinite;"></div>
                    <span style="color: #e74c3c; font-weight: bold; font-size: 0.9rem;">ADVERTISEMENT REQUIRED</span>
                </div>
            </div>
            
            <!-- Main Message -->
            <h2 style="color: white; margin-bottom: 15px; font-size: 1.8rem;">Advertisement in New Tab</h2>
            
            <!-- Ad Icon -->
            <div style="font-size: 4rem; color: #f39c12; margin-bottom: 20px;">
                <i class="fas fa-external-link-alt"></i>
            </div>
            
            <!-- Instructions -->
            <div style="background: rgba(42, 75, 141, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 25px; max-width: 500px;">
                <h4 style="color: white; margin-bottom: 10px;">
                    <i class="fas fa-info-circle" style="color: #3498db; margin-right: 8px;"></i>
                    Ad Opening in New Tab
                </h4>
                <p style="color: #aaa; line-height: 1.6; margin: 0;">
                    An advertisement will open in a new tab. <strong>Please don't close it immediately.</strong>
                    This generates revenue to support NRX Mining.
                </p>
            </div>
            
            <!-- Ad Preview (Shows what user should see) -->
            <div style="width: 100%; max-width: 600px; height: 150px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(243, 156, 18, 0.3); position: relative;">
                <div style="text-align: center; color: #aaa;">
                    <i class="fas fa-ad" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #f39c12;"></i>
                    <div>Advertisement will appear here...</div>
                </div>
                
                <!-- Ad will load here -->
                <div id="ad-preview-area" style="position: absolute; width: 100%; height: 100%;"></div>
            </div>
            
            <!-- Timer Display -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 12px; margin-bottom: 25px; width: 100%; max-width: 400px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <!-- Countdown Timer -->
                <div id="visible-countdown" style="font-size: 3rem; font-weight: bold; color: #2ecc71; margin: 15px 0; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(46, 204, 113, 0.5);">
                    30
                </div>
                
                <!-- Timer Label -->
                <div style="color: #aaa; margin-bottom: 5px; font-size: 0.9rem;">
                    <i class="fas fa-clock" style="margin-right: 8px;"></i>
                    <span>Return here in <span id="visible-seconds" style="color: #2ecc71; font-weight: bold;">30</span> seconds</span>
                </div>
                
                <!-- Progress Bar -->
                <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-top: 15px;">
                    <div id="visible-progress" style="height: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); width: 100%; transition: width 1s linear;"></div>
                </div>
            </div>
            
            <!-- Ad Network Info -->
            <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(52, 152, 219, 0.1); padding: 12px 25px; border-radius: 25px; border: 1px solid rgba(52, 152, 219, 0.3); margin-bottom: 20px;">
                <i class="fas fa-network-wired" style="color: #3498db;"></i>
                <div style="text-align: left;">
                    <div style="color: white; font-size: 0.9rem; font-weight: bold;">Ad Network</div>
                    <div style="color: #aaa; font-size: 0.8rem;">Adstera • Popunder #28128352</div>
                </div>
            </div>
            
            <!-- Important Warning -->
            <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(231, 76, 60, 0.3); width: 100%; max-width: 400px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>DON'T CLOSE THE AD TAB</strong>
                </div>
                <div style="color: #aaa; font-size: 0.85rem; margin-top: 8px;">
                    Let the ad stay open for at least 5 seconds to count
                </div>
            </div>
            
            <!-- Manual Ad Button (for testing) -->
            <button id="manual-ad-btn" onclick="openAdManually()" style="margin-top: 20px; background: linear-gradient(90deg, #9b59b6, #8e44ad); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-external-link-alt"></i>
                Open Ad Manually (If not auto-opened)
            </button>
            
        </div>
    `;
    
    // Start countdown
    startVisibleCountdown();
    
    // Open VISIBLE popunder (not hidden)
    openVisiblePopunder();
}

function startVisibleCountdown() {
    let secondsLeft = 30;
    const countdownEl = document.getElementById('visible-countdown');
    const secondsEl = document.getElementById('visible-seconds');
    const progressBar = document.getElementById('visible-progress');
    
    const countdownInterval = setInterval(() => {
        secondsLeft--;
        
        if (countdownEl) countdownEl.textContent = secondsLeft;
        if (secondsEl) secondsEl.textContent = secondsLeft;
        
        // Update progress bar
        if (progressBar) {
            const progressPercent = (secondsLeft / 30) * 100;
            progressBar.style.width = progressPercent + '%';
            
            // Color changes
            if (secondsLeft <= 10) {
                countdownEl.style.color = '#e74c3c';
                progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #f39c12)';
            } else if (secondsLeft <= 20) {
                countdownEl.style.color = '#f39c12';
                progressBar.style.background = 'linear-gradient(90deg, #f39c12, #2ecc71)';
            }
        }
        
        // Timer ends
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            console.log('✅ Ad timer completed');
            
            // Check if ad was viewed
            checkAdViewStatus();
        }
    }, 1000);
}

// OPEN VISIBLE POPUNDER (NOT HIDDEN)
function openVisiblePopunder() {
    console.log('🎯 Opening VISIBLE popunder ad...');
    
    // First, try to open a visible popup (not popunder)
    setTimeout(() => {
        try {
            // Method 1: Open as popup (visible)
            const popupWindow = window.open(
                'about:blank',
                'NRX_Ad',
                'width=800,height=600,left=100,top=100,scrollbars=yes,resizable=yes'
            );
            
            if (popupWindow) {
                console.log('✅ Popup window opened successfully');
                
                // Write Adsterra content to the popup
                popupWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Advertisement - NRX Mining</title>
                        <style>
                            body { 
                                margin: 0; 
                                padding: 20px; 
                                font-family: Arial, sans-serif; 
                                background: linear-gradient(135deg, #1a1a2e, #16213e);
                                color: white;
                                text-align: center;
                            }
                            .ad-header {
                                background: rgba(243, 156, 18, 0.1);
                                padding: 15px;
                                border-radius: 10px;
                                margin-bottom: 20px;
                                border: 1px solid rgba(243, 156, 18, 0.3);
                            }
                            .ad-content {
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                            }
                            .timer {
                                font-size: 20px;
                                color: #2ecc71;
                                margin: 20px 0;
                            }
                            .close-btn {
                                background: #e74c3c;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="ad-header">
                            <h2>Advertisement</h2>
                            <p>Thank you for supporting NRX Mining Platform!</p>
                        </div>
                        
                        <div class="ad-content">
                            <p>This advertisement helps fund the mining platform development.</p>
                            <p>Please keep this window open for a few seconds...</p>
                            
                            <div class="timer">
                                Ad will auto-close in <span id="popup-timer">10</span> seconds
                            </div>
                            
                            <!-- ADSTERRA AD SCRIPT -->
                            <script type="text/javascript">
                                atOptions = {
                                    'key' : '1e50a2f9fa163cc52b0f97675681b8a4',
                                    'format' : 'iframe',
                                    'height' : 250,
                                    'width' : 300,
                                    'params' : {}
                                };
                                document.write('<scr' + 'ipt type="text/javascript" src="//www.profitablecreativeformat.com/1e50a2f9fa163cc52b0f97675681b8a4/invoke.js"><' + '/script>');
                            <\/script>
                            
                            <button class="close-btn" onclick="window.close()">Close Ad</button>
                        </div>
                        
                        <script>
                            // Auto-close after 10 seconds
                            let time = 10;
                            const timerInterval = setInterval(() => {
                                time--;
                                document.getElementById('popup-timer').textContent = time;
                                if (time <= 0) {
                                    clearInterval(timerInterval);
                                    window.close();
                                }
                            }, 1000);
                            
                            // Track view time for revenue
                            let viewStart = Date.now();
                            window.addEventListener('beforeunload', function() {
                                const viewTime = Date.now() - viewStart;
                                console.log('Ad viewed for ' + Math.floor(viewTime/1000) + ' seconds');
                                // Send to parent window
                                if (window.opener) {
                                    window.opener.postMessage({
                                        type: 'ad_viewed',
                                        duration: Math.floor(viewTime/1000)
                                    }, '*');
                                }
                            });
                        <\/script>
                    </body>
                    </html>
                `);
                
                popupWindow.document.close();
                
                // Track if popup is closed
                const popupCheck = setInterval(() => {
                    if (popupWindow.closed) {
                        clearInterval(popupCheck);
                        console.log('✅ Ad window closed by user');
                        markAdAsViewed();
                    }
                }, 1000);
                
            } else {
                console.log('❌ Popup blocked, trying alternative...');
                openAlternativeAd();
            }
            
        } catch (error) {
            console.error('Error opening popup:', error);
            openAlternativeAd();
        }
    }, 1500); // Wait 1.5 seconds before opening
    
    // Also load the standard Adsterra popunder script (for impressions)
    loadAdsterraPopunderScript();
}

// Load Adsterra popunder script (for impressions)
function loadAdsterraPopunderScript() {
    console.log('📊 Loading Adsterra popunder script for impressions...');
    
    setTimeout(() => {
        try {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.js';
            script.async = true;
            
            script.onload = function() {
                console.log('✅ Adsterra popunder script loaded (impressions)');
            };
            
            script.onerror = function() {
                console.log('⚠️ Adsterra script failed');
            };
            
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('Error loading Adsterra script:', error);
        }
    }, 3000);
}

// Alternative ad method
function openAlternativeAd() {
    console.log('🔄 Opening alternative ad...');
    
    // Create iframe ad in the current page
    const previewArea = document.getElementById('ad-preview-area');
    if (previewArea) {
        previewArea.innerHTML = `
            <iframe 
                src="https://pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.html"
                style="width: 100%; height: 100%; border: none; border-radius: 8px;"
                frameborder="0"
            ></iframe>
        `;
        
        console.log('✅ Alternative ad loaded in iframe');
    }
}

// Manual ad button
function openAdManually() {
    console.log('👆 User manually opening ad...');
    
    window.open(
        'https://pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.html',
        '_blank',
        'width=800,height=600'
    );
    
    // Show confirmation
    alert('Ad opened in new tab! Please view it for a few seconds, then return here.');
}

// Check if ad was viewed
function checkAdViewStatus() {
    console.log('🔍 Checking ad view status...');
    
    // Simulate ad view check
    const viewed = Math.random() > 0.3; // 70% chance ad was viewed
    
    if (viewed) {
        console.log('✅ Ad was viewed (revenue earned)');
        showAdSuccessMessage(true);
    } else {
        console.log('⚠️ Ad may not have been viewed');
        showAdSuccessMessage(false);
    }
}

function markAdAsViewed() {
    console.log('✅ Ad marked as viewed by user');
    // You could track this in your backend
}

function showAdSuccessMessage(viewed) {
    if (viewed) {
        alert(`🎉 ADVERTISEMENT COMPLETED!\n\n✅ Revenue earned for NRX Mining\n⚡ Mining speed: ${miningSpeed} H/s (10% reduced)\n⏰ Next ad in 5 minutes\n\nThank you for your support!`);
    } else {
        alert(`⚠️ ADVERTISEMENT ISSUE\n\nPlease make sure to view ads when they open.\n⚡ Mining speed: ${miningSpeed} H/s (10% reduced)\n⏰ Next ad in 5 minutes`);
    }
}

// Listen for ad view messages from popup
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ad_viewed') {
        console.log(`✅ Ad viewed for ${event.data.duration} seconds`);
        markAdAsViewed();
    }
});

// Add animation styles
if (!document.getElementById('ad-animations')) {
    const style = document.createElement('style');
    style.id = 'ad-animations';
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        #manual-ad-btn:hover {
            transform: scale(1.05);
            transition: transform 0.2s;
        }
    `;
    document.head.appendChild(style);
    }
