// Countdown Timer
function updateCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 22);
    
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Mining functionality
let minedTokens = 0;
let miningSpeed = 20;
let isMining = false;
let miningInterval;
let completedTasks = new Set();
let currentAction = null; // 'boost' or 'withdraw'

// OGADS Modal elements
const modal = document.getElementById('ogads-modal');
const closeBtn = document.querySelector('.close');
const taskCompletedBtn = document.getElementById('task-completed');

// Withdrawal Modal elements
const withdrawalModal = document.getElementById('withdrawal-modal');
const withdrawalCloseBtn = document.querySelector('.withdrawal-close');
const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');

// Open modal for tasks or withdrawal
function openOGADSModal(action) {
    currentAction = action;
    modal.style.display = 'block';
    
    // Reset the iframe to ensure it loads fresh with the correct URL
    const iframe = document.getElementById('ogads-frame');
    iframe.src = "https://applocked.org/cl/i/j76pvj";
}

// Open withdrawal modal
function openWithdrawalModal() {
    if (minedTokens >= 0.001) {
        withdrawalModal.style.display = 'block';
        // Reset form and update available tokens
        document.getElementById('wallet-address').value = '';
        document.getElementById('network').value = 'bsc';
        document.getElementById('withdrawal-amount').value = minedTokens.toFixed(4);
        document.getElementById('available-tokens').textContent = minedTokens.toFixed(4);
    } else {
        alert('Minimum withdrawal amount is 0.001 NRX');
    }
}

// Close modals
closeBtn.onclick = function() {
    modal.style.display = 'none';
}

withdrawalCloseBtn.onclick = function() {
    withdrawalModal.style.display = 'none';
}

// When user clicks outside modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == withdrawalModal) {
        withdrawalModal.style.display = 'none';
    }
}

// Task completion handler
taskCompletedBtn.onclick = function() {
    modal.style.display = 'none';
    
    if (currentAction === 'boost') {
        // Apply mining boost
        const boostAmount = 10 + Math.floor(Math.random() * 15);
        const currentSpeed = parseInt(document.getElementById('mining-speed').textContent);
        const newSpeed = currentSpeed + boostAmount;
        document.getElementById('mining-speed').textContent = newSpeed + ' H/s';
        miningSpeed = newSpeed;
        
        // Show success message
        alert(`Task completed! Your mining speed increased by ${boostAmount} H/s.`);
    } else if (currentAction === 'withdraw') {
        // Process withdrawal
        const walletAddress = document.getElementById('wallet-address').value;
        const withdrawalAmount = document.getElementById('withdrawal-amount').value;
        
        if (parseFloat(withdrawalAmount) <= minedTokens) {
            alert(`Withdrawal of ${withdrawalAmount} NRX to ${walletAddress} successful!`);
            minedTokens -= parseFloat(withdrawalAmount);
            document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + ' NRX';
        }
    }
    
    currentAction = null;
}

// Confirm withdrawal
confirmWithdrawalBtn.onclick = function() {
    const walletAddress = document.getElementById('wallet-address').value;
    const network = document.getElementById('network').value;
    const withdrawalAmount = document.getElementById('withdrawal-amount').value;
    
    if (!walletAddress) {
        alert('Please enter your wallet address');
        return;
    }
    
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        alert('Please enter a valid BNB Smart Chain wallet address (starts with 0x and 42 characters long)');
        return;
    }
    
    if (parseFloat(withdrawalAmount) > minedTokens) {
        alert('Withdrawal amount cannot exceed your mined tokens');
        return;
    }
    
    if (parseFloat(withdrawalAmount) < 0.001) {
        alert('Minimum withdrawal amount is 0.001 NRX');
        return;
    }
    
    // Close withdrawal modal and open OGADS for task completion
    withdrawalModal.style.display = 'none';
    currentAction = 'withdraw';
    openOGADSModal('withdraw');
}

// Start Mining Button
document.getElementById('start-mining-btn').addEventListener('click', function() {
    if (!isMining) {
        isMining = true;
        this.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
        this.classList.remove('btn-primary');
        this.classList.add('btn-warning');
        
        miningInterval = setInterval(function() {
            if (minedTokens < 20) {
                minedTokens += (miningSpeed / 10000);
                document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + ' NRX';
            } else {
                clearInterval(miningInterval);
                isMining = false;
                document.getElementById('start-mining-btn').innerHTML = '<i class="fas fa-play"></i> Daily Limit Reached';
                document.getElementById('start-mining-btn').classList.remove('btn-warning');
                document.getElementById('start-mining-btn').classList.add('btn-primary');
                document.getElementById('start-mining-btn').disabled = true;
            }
        }, 100);
    } else {
        isMining = false;
        clearInterval(miningInterval);
        this.innerHTML = '<i class="fas fa-play"></i> Start Mining Now';
        this.classList.remove('btn-warning');
        this.classList.add('btn-primary');
    }
});

// Mine Now Button (Boost Mining)
document.getElementById('mine-now-btn').addEventListener('click', function() {
    document.getElementById('boost-mining-section').style.display = 'block';
    this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
    this.classList.remove('btn-warning');
    this.classList.add('btn-primary');
    this.disabled = true;
});

// Withdraw Button - Updated to open withdrawal modal
document.getElementById('withdraw-btn').addEventListener('click', function() {
    openWithdrawalModal();
});

// Task completion simulation with OGADS integration
const tasks = document.querySelectorAll('.task');
tasks.forEach(task => {
    task.addEventListener('click', function() {
        const taskId = this.getAttribute('data-task');
        
        if (!completedTasks.has(taskId)) {
            openOGADSModal('boost');
            completedTasks.add(taskId);
            
            // Visual feedback
            this.style.background = 'var(--primary)';
            this.style.color = 'white';
            this.querySelector('i').style.color = 'white';
        } else {
            alert('You have already completed this task!');
        }
    });
});

// Copy contract address functionality
document.getElementById('copy-address').addEventListener('click', function() {
    const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';
    navigator.clipboard.writeText(address).then(function() {
        const originalIcon = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            this.innerHTML = originalIcon;
        }, 2000);
    }.bind(this));
});
