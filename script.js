// ==================== SIMPLE OGADS - NO VERIFICATION MODAL ====================
function openOGAdsLocker(type) {
    console.log(`🔒 Opening OGAds task for: ${type}`);
    
    // Stop mining
    stopMining();
    
    // Lock mining button only
    ogadsForceLock = true;
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) miningBtn.disabled = true;
    
    // Create simple container for OGAds
    const container = document.createElement('div');
    container.id = 'ogads-simple-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 99999;
        display: flex;
        flex-direction: column;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        background: #1a1a2e;
        color: white;
        padding: 15px;
        text-align: center;
        border-bottom: 2px solid #f39c12;
    `;
    header.innerHTML = `
        <h3 style="margin: 0; color: #f39c12;">
            <i class="fas fa-tasks"></i> Complete Task to Continue Mining
        </h3>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #ccc;">
            Complete one offer, then close this window
        </p>
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #e74c3c;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
    `;
    closeBtn.onclick = function() {
        completeOGAdsTask(type);
    };
    header.appendChild(closeBtn);
    
    // OGAds iframe - YOUR DIRECT LINK
    const iframe = document.createElement('iframe');
    iframe.src = OGADS_DIRECT_LINK;
    iframe.style.cssText = `
        flex: 1;
        width: 100%;
        border: none;
        background: white;
    `;
    iframe.sandbox = "allow-scripts allow-forms allow-same-origin allow-popups";
    
    // Assemble
    container.appendChild(header);
    container.appendChild(iframe);
    document.body.appendChild(container);
}

function completeOGAdsTask(type) {
    console.log(`✅ OGAds task completed for: ${type}`);
    
    // Remove container
    const container = document.getElementById('ogads-simple-container');
    if (container) container.remove();
    
    // Unlock interface
    ogadsForceLock = false;
    const miningBtn = document.getElementById('start-mining-btn');
    if (miningBtn) miningBtn.disabled = false;
    
    // Apply rewards
    applyOGAdsReward(type);
    
    // Save progress
    saveLocalProgress();
}

function applyOGAdsReward(type) {
    if (type === 'timer') {
        // Continue mining after 1 second
        setTimeout(() => {
            startMiningWithTimer();
        }, 1000);
        
    } else if (type === 'boost') {
        // Apply boost
        const boostAmount = 15;
        miningSpeed += boostAmount;
        
        // Update boost button
        const boostBtn = document.getElementById('mine-now-btn');
        if (boostBtn) {
            boostBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Active';
            boostBtn.classList.remove('btn-warning');
            boostBtn.classList.add('btn-success');
            boostBtn.disabled = true;
        }
        
        // Boost expires after 1 hour
        setTimeout(() => {
            miningSpeed = Math.max(BASE_MINING_SPEED, miningSpeed - boostAmount);
            updateUI();
            
            if (boostBtn) {
                boostBtn.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining';
                boostBtn.classList.remove('btn-success');
                boostBtn.classList.add('btn-warning');
                boostBtn.disabled = false;
            }
        }, 60 * 60 * 1000);
        
    } else if (type === 'task' && pendingBoostId) {
        // Complete task
        const boostAmounts = { '1': 5, '2': 10, '3': 15, '4': 20, '5': 8, '6': 12 };
        const boostAmount = boostAmounts[pendingBoostId] || 10;
        
        miningSpeed += boostAmount;
        completedTasks.push(`task-${pendingBoostId}`);
        pendingBoostId = null;
    }
    
    updateUI();
        }
