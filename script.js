// ===============================
// COUNTDOWN TIMER
// ===============================
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


// ===============================
// MINING SYSTEM VARIABLES
// ===============================
let minedTokens = 0;
let miningSpeed = 20;
let isMining = false;
let miningInterval;
let completedTasks = new Set();
let currentAction = null;
let pendingWithdrawal = null;


// ===============================
// SAVE PROGRESS (localStorage)
// ===============================
function saveProgress() {
    const data = {
        minedTokens,
        miningSpeed,
        completedTasks: Array.from(completedTasks)
    };

    localStorage.setItem("nrxMiningData", JSON.stringify(data));
}


// ===============================
// LOAD PROGRESS (localStorage)
// ===============================
function loadProgress() {
    const savedData = localStorage.getItem("nrxMiningData");

    if (savedData) {
        const data = JSON.parse(savedData);

        minedTokens = data.minedTokens || 0;
        miningSpeed = data.miningSpeed || 20;
        completedTasks = new Set(data.completedTasks || []);

        // Update UI
        document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";
        document.getElementById('mining-speed').textContent = miningSpeed + " H/s";

        // Mark completed tasks
        document.querySelectorAll('.task').forEach(t => {
            const taskId = t.getAttribute('data-task');
            if (completedTasks.has(taskId)) {
                t.style.background = 'var(--primary)';
                t.style.color = 'white';
                t.querySelector('i').style.color = 'white';
            }
        });
    }
}

loadProgress();


// ===============================
// OGADS MODALS
// ===============================
const modal = document.getElementById('ogads-modal');
const closeBtn = document.querySelector('.close');
const taskCompletedBtn = document.getElementById('task-completed');

const withdrawalModal = document.getElementById('withdrawal-modal');
const withdrawalCloseBtn = document.querySelector('.withdrawal-close');
const confirmWithdrawalBtn = document.getElementById('confirm-withdrawal');

// Open task modal
function openOGADSModal(action) {
    currentAction = action;
    modal.style.display = 'block';
}

// Open withdrawal modal
function openWithdrawalModal() {
    if (minedTokens >= 0.001) {
        withdrawalModal.style.display = 'block';

        document.getElementById('wallet-address').value = '';
        document.getElementById('network').value = 'bsc';
        document.getElementById('withdrawal-amount').value = minedTokens.toFixed(4);
        document.getElementById('available-tokens').textContent = minedTokens.toFixed(4);
    } else {
        alert('Minimum withdrawal amount is 0.001 NRX');
    }
}


// ===============================
// CLOSE MODALS
// ===============================
closeBtn.onclick = function () {
    modal.style.display = 'none';
    if (currentAction === 'withdraw') pendingWithdrawal = null;
};

withdrawalCloseBtn.onclick = function () {
    withdrawalModal.style.display = 'none';
};

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = 'none';
        if (currentAction === 'withdraw') pendingWithdrawal = null;
    }
    if (event.target == withdrawalModal) {
        withdrawalModal.style.display = 'none';
    }
};


// ===============================
// TASK COMPLETED BUTTON
// ===============================
taskCompletedBtn.onclick = function () {
    modal.style.display = 'none';

    if (currentAction === 'boost') {
        const boostAmount = 10 + Math.floor(Math.random() * 15);
        const currentSpeed = miningSpeed;
        const newSpeed = currentSpeed + boostAmount;

        miningSpeed = newSpeed;
        document.getElementById('mining-speed').textContent = newSpeed + ' H/s';

        saveProgress();

        alert(`Task completed! Mining speed increased by ${boostAmount} H/s.`);

    } else if (currentAction === 'withdraw' && pendingWithdrawal) {

        const { walletAddress, withdrawalAmount } = pendingWithdrawal;

        if (parseFloat(withdrawalAmount) <= minedTokens) {
            alert(`Withdrawal of ${withdrawalAmount} NRX to ${walletAddress} successful!`);

            minedTokens -= parseFloat(withdrawalAmount);
            document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";

            saveProgress();
            pendingWithdrawal = null;
        }
    }

    currentAction = null;
};


// ===============================
// CONFIRM WITHDRAWAL
// ===============================
confirmWithdrawalBtn.onclick = function () {
    const walletAddress = document.getElementById('wallet-address').value;
    const withdrawalAmount = document.getElementById('withdrawal-amount').value;

    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        alert('Please enter a valid BSC wallet address');
        return;
    }

    if (parseFloat(withdrawalAmount) > minedTokens) {
        alert('Withdrawal amount exceeds balance');
        return;
    }

    if (parseFloat(withdrawalAmount) < 0.001) {
        alert('Minimum withdrawal is 0.001 NRX');
        return;
    }

    pendingWithdrawal = { walletAddress, withdrawalAmount };
    withdrawalModal.style.display = 'none';

    openOGADSModal('withdraw');
};


// ===============================
// START MINING BUTTON
// ===============================
document.getElementById('start-mining-btn').addEventListener('click', function () {
    if (!isMining) {
        isMining = true;

        this.innerHTML = '<i class="fas fa-pause"></i> Stop Mining';
        this.classList.remove('btn-primary');
        this.classList.add('btn-warning');

        miningInterval = setInterval(function () {
            if (minedTokens < 20) {

                minedTokens += (miningSpeed / 50000);
                document.getElementById('mined-tokens').textContent = minedTokens.toFixed(4) + " NRX";

                saveProgress();

            } else {
                clearInterval(miningInterval);
                isMining = false;

                const btn = document.getElementById('start-mining-btn');
                btn.innerHTML = '<i class="fas fa-play"></i> Daily Limit Reached';
                btn.disabled = true;

                saveProgress();
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


// ===============================
// BOOST MINING BUTTON
// ===============================
document.getElementById('mine-now-btn').addEventListener('click', function () {
    document.getElementById('boost-mining-section').style.display = 'block';
    this.innerHTML = '<i class="fas fa-bolt"></i> Boost Mining Active';
    this.disabled = true;
});


// ===============================
// WITHDRAW BUTTON
// ===============================
document.getElementById('withdraw-btn').addEventListener('click', function () {
    openWithdrawalModal();
});


// ===============================
// OGADS TASK CLICK EVENTS
// ===============================
const tasks = document.querySelectorAll('.task');

tasks.forEach(task => {
    task.addEventListener('click', function () {
        const taskId = this.getAttribute('data-task');

        if (!completedTasks.has(taskId)) {
            completedTasks.add(taskId);

            this.style.background = 'var(--primary)';
            this.style.color = 'white';
            this.querySelector('i').style.color = 'white';

            saveProgress();

            openOGADSModal('boost');
        } else {
            alert('You already completed this task!');
        }
    });
});


// ===============================
// COPY CONTRACT ADDRESS
// ===============================
document.getElementById('copy-address').addEventListener('click', function () {
    const address = '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7';

    navigator.clipboard.writeText(address).then(() => {
        const original = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i>';

        setTimeout(() => {
            this.innerHTML = original;
        }, 2000);
    });
});
