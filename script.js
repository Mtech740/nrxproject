// ==================== ADSTERRA POPUNDER INTEGRATION ====================
function loadAdsterraAd() {
    console.log('💰 Loading Adsterra Popunder...');
    
    const adContainer = document.getElementById('ad-container');
    if (!adContainer) return;
    
    // Clear and show loading interface
    adContainer.innerHTML = `
        <div id="adsterra-popunder-container" style="width: 100%; height: 100%; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95)); border-radius: 12px; border: 2px solid #f39c12; box-shadow: 0 0 30px rgba(243, 156, 18, 0.3); padding: 30px; text-align: center;">
            
            <!-- Header -->
            <div style="margin-bottom: 25px;">
                <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(231, 76, 60, 0.1); padding: 8px 20px; border-radius: 20px; border: 1px solid rgba(231, 76, 60, 0.3);">
                    <div style="width: 8px; height: 8px; background: #e74c3c; border-radius: 50%; animation: pulse 1s infinite;"></div>
                    <span style="color: #e74c3c; font-weight: bold; font-size: 0.9rem;">ADVERTISEMENT REQUIRED</span>
                </div>
            </div>
            
            <!-- Main Message -->
            <h2 style="color: white; margin-bottom: 15px; font-size: 1.8rem;">Watch this ad to continue mining</h2>
            
            <!-- Ad Icon -->
            <div style="font-size: 4rem; color: #f39c12; margin-bottom: 20px;">
                <i class="fas fa-play-circle"></i>
            </div>
            
            <!-- Support Message -->
            <div style="background: rgba(42, 75, 141, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 25px; max-width: 500px;">
                <h4 style="color: white; margin-bottom: 10px;">
                    <i class="fas fa-hands-helping" style="color: #2ecc71; margin-right: 8px;"></i>
                    Support NRX Mining
                </h4>
                <p style="color: #aaa; line-height: 1.6; margin: 0;">
                    This advertisement helps fund NRX Mining Platform development, server costs, and user rewards. Thank you for your support!
                </p>
            </div>
            
            <!-- Timer Display -->
            <div style="background: rgba(0, 0, 0, 0.3); padding: 25px; border-radius: 12px; margin-bottom: 25px; width: 100%; max-width: 400px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <!-- Countdown Timer -->
                <div id="popunder-countdown" style="font-size: 3.5rem; font-weight: bold; color: #2ecc71; margin: 20px 0; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(46, 204, 113, 0.5);">
                    30
                </div>
                
                <!-- Timer Label -->
                <div style="color: #aaa; margin-bottom: 5px; font-size: 0.9rem;">
                    <i class="fas fa-clock" style="margin-right: 8px;"></i>
                    <span>Ad will close in <span id="popunder-seconds" style="color: #f39c12; font-weight: bold;">30</span> seconds</span>
                </div>
                
                <!-- Progress Bar -->
                <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-top: 15px;">
                    <div id="popunder-progress" style="height: 100%; background: linear-gradient(90deg, #2ecc71, #f39c12); width: 100%; transition: width 1s linear;"></div>
                </div>
            </div>
            
            <!-- Ad Network Info -->
            <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(52, 152, 219, 0.1); padding: 12px 25px; border-radius: 25px; border: 1px solid rgba(52, 152, 219, 0.3); margin-bottom: 20px;">
                <i class="fas fa-network-wired" style="color: #3498db;"></i>
                <div style="text-align: left;">
                    <div style="color: white; font-size: 0.9rem; font-weight: bold;">Ad Network</div>
                    <div style="color: #aaa; font-size: 0.8rem;">Adstera • Placement: 28128352</div>
                </div>
            </div>
            
            <!-- Important Warning -->
            <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(231, 76, 60, 0.3); width: 100%; max-width: 400px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>DO NOT CLOSE THIS WINDOW</strong>
                </div>
                <div style="color: #aaa; font-size: 0.85rem; margin-top: 8px;">
                    Closing this window will interrupt mining
                </div>
            </div>
            
            <!-- Ad Loading Status -->
            <div id="ad-status" style="margin-top: 20px; padding: 10px; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3); display: none;">
                <i class="fas fa-check-circle" style="color: #2ecc71; margin-right: 8px;"></i>
                <span style="color: #2ecc71;">Ad loaded successfully!</span>
            </div>
            
        </div>
    `;
    
    // Start countdown
    startPopunderCountdown();
    
    // IMPORTANT: Load Adsterra Popunder AFTER showing the UI
    setTimeout(() => {
        loadAdsterraPopunder();
    }, 1000);
}

function startPopunderCountdown() {
    let secondsLeft = 30;
    const countdownEl = document.getElementById('popunder-countdown');
    const secondsEl = document.getElementById('popunder-seconds');
    const progressBar = document.getElementById('popunder-progress');
    
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
        }
    }, 1000);
}

// THIS IS THE EXACT WORKING ADSTERRA POPUNDER CODE
function loadAdsterraPopunder() {
    console.log('🎯 Loading Adsterra Popunder with Placement ID: 28128352');
    
    try {
        // Method 1: Direct script injection (Adsterra's recommended method)
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.js';
        script.async = true;
        
        script.onload = function() {
            console.log('✅ Adsterra popunder script loaded');
            
            // Show success status
            const statusEl = document.getElementById('ad-status');
            if (statusEl) {
                statusEl.style.display = 'block';
            }
            
            // The popunder should trigger automatically
            // Adsterra's script automatically creates a popunder when loaded
        };
        
        script.onerror = function() {
            console.error('❌ Failed to load Adsterra script');
            // Try alternative method
            loadAlternativePopunder();
        };
        
        // Append to head
        document.head.appendChild(script);
        
        // Also try the iframe method as backup
        setTimeout(() => {
            triggerPopunderIframe();
        }, 2000);
        
    } catch (error) {
        console.error('Error loading Adsterra:', error);
        loadAlternativePopunder();
    }
}

// Alternative popunder method
function triggerPopunderIframe() {
    try {
        console.log('🔄 Trying iframe method for popunder...');
        
        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        
        // Your EXACT Adsterra popunder URL
        iframe.src = 'https://pl28228851.effectivegatecpm.com/1e/50/a2/1e50a2f9fa163cc52b0f97675681b8a4.html';
        
        // Add to body
        document.body.appendChild(iframe);
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 10000);
        
    } catch (error) {
        console.error('Iframe method failed:', error);
    }
}

// If Adsterra fails completely
function loadAlternativePopunder() {
    console.log('⚠️ Using simulated popunder...');
    
    // Create a simulated popunder window
    const popupWindow = window.open('', '_blank', 'width=800,height=600,left=100,top=100');
    
    if (popupWindow) {
        // Write ad content to the popup
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
                    .ad-content {
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 30px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 15px;
                        border: 2px solid #f39c12;
                    }
                    h1 { color: #f39c12; }
                    .timer {
                        font-size: 24px;
                        color: #2ecc71;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="ad-content">
                    <h1>Advertisement</h1>
                    <p>Thank you for supporting NRX Mining!</p>
                    <p>This ad helps fund platform development and user rewards.</p>
                    <div class="timer">Ad will close in <span id="ad-timer">5</span> seconds</div>
                    <button onclick="window.close()" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Ad</button>
                </div>
                <script>
                    // Auto-close after 5 seconds
                    let time = 5;
                    const timer = setInterval(() => {
                        time--;
                        document.getElementById('ad-timer').textContent = time;
                        if (time <= 0) {
                            clearInterval(timer);
                            window.close();
                        }
                    }, 1000);
                </script>
            </body>
            </html>
        `);
        
        popupWindow.document.close();
        
        // Bring main window to front (simulating popunder)
        setTimeout(() => {
            window.focus();
        }, 100);
        
        // Auto-close popup after 5 seconds
        setTimeout(() => {
            if (popupWindow && !popupWindow.closed) {
                popupWindow.close();
            }
        }, 5000);
        
    } else {
        console.log('⚠️ Popup blocked - showing inline ad instead');
        showInlineAd();
    }
}

function showInlineAd() {
    const container = document.getElementById('adsterra-popunder-container');
    if (!container) return;
    
    const adHTML = `
        <div style="margin: 30px 0; padding: 20px; background: rgba(243, 156, 18, 0.1); border-radius: 10px; border: 1px solid rgba(243, 156, 18, 0.3); max-width: 600px;">
            <h4 style="color: #f39c12; margin-bottom: 15px;">
                <i class="fas fa-ad" style="margin-right: 10px;"></i>
                Advertisement Content
            </h4>
            <p style="color: #aaa; margin-bottom: 15px;">
                This is a simulated advertisement. In production, real ads from Adstera would appear here.
            </p>
            <button onclick="completeAdvertisement()" style="background: linear-gradient(90deg, #2ecc71, #27ae60); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Continue Mining
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', adHTML);
}

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
    `;
    document.head.appendChild(style);
}
// ==================== END ADSTERRA INTEGRATION ====================
