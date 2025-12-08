// Mining boost activation system
let taskStarted = false;
let taskTimer = 0;
let taskLinkClicked = false;
let verificationCompleted = false;
let countdownInterval;
let miningSpeed = 0;

// DOM Elements
const startTaskBtn = document.getElementById('startTaskBtn');
const taskSection = document.getElementById('taskSection');
const ogadsLink = document.getElementById('ogadsLink');
const verifyBtn = document.getElementById('verifyBtn');
const timerDisplay = document.getElementById('timerDisplay');
const countdownElement = document.getElementById('countdown');
const loadingElement = document.getElementById('loading');
const verificationSuccess = document.getElementById('verificationSuccess');
const verificationText = document.getElementById('verificationText');
const miningSpeedElement = document.getElementById('miningSpeed');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateMiningSpeed();
    
    // Start Task Button
    startTaskBtn.addEventListener('click', function() {
        if (!taskStarted) {
            startTask();
        }
    });
    
    // OGADS Link click tracking
    ogadsLink.addEventListener('click', function(e) {
        // Don't prevent default - let the link open
        taskLinkClicked = true;
        console.log('OGADS link clicked - opening task page');
    });
});

function startTask() {
    taskStarted = true;
    startTaskBtn.disabled = true;
    startTaskBtn.textContent = "📋 Task Started";
    startTaskBtn.style.background = "linear-gradient(135deg, #7f8c8d, #95a5a6)";
    
    // Show task section
    taskSection.classList.add('active');
    
    // Start the countdown
    startCountdown();
    
    // Update status
    verificationText.textContent = "Task started. Please complete the verification...";
    verificationText.style.color = "#ff9f1a";
}

function startCountdown() {
    let secondsLeft = 30;
    
    // Update countdown every second
    countdownInterval = setInterval(function() {
        secondsLeft--;
        countdownElement.textContent = secondsLeft;
        
        // Update timer display
        if (secondsLeft > 0) {
            timerDisplay.innerHTML = `⏳ Task must be open for at least <span id="countdown">${secondsLeft}</span> seconds`;
        } else {
            timerDisplay.innerHTML = '✅ Minimum time requirement met';
            timerDisplay.style.color = "#2ecc71";
            
            // Enable verify button if link was clicked
            if (taskLinkClicked) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = "✅ Verify Completion";
            } else {
                verifyBtn.disabled = true;
                verifyBtn.textContent = "❌ Open the task link first";
            }
            
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function taskLinkOpened() {
    taskLinkClicked = true;
    console.log("Task link opened event triggered");
    
    // Update UI feedback
    if (taskTimer >= 30) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = "✅ Verify Completion";
    }
}

function verifyTask() {
    if (verificationCompleted) return;
    
    // Show loading
    loadingElement.style.display = 'block';
    taskSection.style.display = 'none';
    
    // Simulate verification process
    setTimeout(function() {
        if (taskLinkClicked) {
            // Successful verification
            completeVerification();
        } else {
            // Failed - no link click detected
            loadingElement.style.display = 'none';
            taskSection.style.display = 'block';
            alert("❌ Verification failed. Please click and complete the task link first.");
        }
    }, 2000);
}

function completeVerification() {
    verificationCompleted = true;
    
    // Hide loading
    loadingElement.style.display = 'none';
    
    // Show success message
    verificationSuccess.style.display = 'block';
    verificationSuccess.classList.add('success');
    
    // Apply mining boost
    miningSpeed += 18;
    updateMiningSpeed();
    
    // Update verification status
    verificationText.textContent = "✅ Boost verified! Mining speed increased by 18 H/s.";
    verificationText.style.color = "#2ecc71";
    
    // Disable all buttons
    startTaskBtn.disabled = true;
    verifyBtn.disabled = true;
    
    // Log success
    console.log("Mining boost activated: +18 H/s");
    
    // Show confirmation alert
    setTimeout(function() {
        alert("✔ Boost verified! Mining speed increased by 18 H/s.\n\nCurrent Mining Speed: " + miningSpeed + " H/s");
    }, 500);
}

function updateMiningSpeed() {
    miningSpeedElement.textContent = miningSpeed + " H/s";
    
    // Visual feedback for boost
    if (miningSpeed > 0) {
        miningSpeedElement.style.color = "#2ecc71";
        miningSpeedElement.style.textShadow = "0 0 10px rgba(46, 204, 113, 0.5)";
    }
}

// Additional security: Prevent right-click and inspect element
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', function(e) {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        return false;
    }
});

// Add heartbeat to prevent simple bypass
let heartbeat = 0;
setInterval(function() {
    heartbeat++;
    // Store heartbeat in localStorage to track session
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem('mining_boost_heartbeat', heartbeat);
    }
}, 1000);

// Initialize from localStorage
if (typeof(Storage) !== "undefined") {
    const savedHeartbeat = localStorage.getItem('mining_boost_heartbeat');
    if (savedHeartbeat) {
        heartbeat = parseInt(savedHeartbeat);
    }
              }
