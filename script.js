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
let miningSpeed = 20; // Changed from 50 to 20
let isMining = false;
let miningInterval;
let completedTasks = new Set();
let currentAction = null; // 'boost' or 'withdraw'

// OGADS Modal elements
const modal = document.getElementById('ogads-modal');
const closeBtn = document.querySelector('.close');
const taskCompletedBtn = document.getElementById('task-completed');

// Open modal for tasks or withdrawal
function openOGADSModal(action) {
    currentAction = action;
    modal.style.display = 'block';
    
    // Reset the iframe to ensure it loads fresh with the correct URL
    const iframe = document.getElementById('ogads-frame');
    iframe.src = "https://applocked.org/cl/i/j76pvj";
}

// Close modal
closeBtn.onclick = function() {
    modal.style.display = 'none';
}

// When user clicks outside modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
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
        if (minedTokens >= 0.001) {
            alert(`Withdrawal of ${minedTokens.toFixed(4)} NRX successful!`);
            minedTokens = 0;
            document.getElementById('mined-tokens').textContent = '0.00 NRX';
        }
    }
    
    currentAction = null;
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

// Withdraw Button
document.getElementById('withdraw-btn').addEventListener('click', function() {
    if (minedTokens >= 0.001) {
        openOGADSModal('withdraw');
    } else {
        alert('Minimum withdrawal amount is 0.001 NRX');
    }
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
