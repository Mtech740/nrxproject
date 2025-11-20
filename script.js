let totalBalance = 0;
let minedToday = 0;
let boost = 1;

// Mining system
document.getElementById("mineBtn").onclick = function () {
    let earn = Math.floor(Math.random() * 3) + 2; // 2–4 NRX
    earn = earn * boost;

    minedToday += earn;
    totalBalance += earn;

    document.getElementById("minedToday").textContent = minedToday;
    document.getElementById("totalBalance").textContent = totalBalance;
};

// Boost control
function setBoost(level) {
    boost = level;
    alert("Boost set to ×" + boost);
}

// Withdraw system
document.getElementById("withdrawBtn").onclick = function () {
    if (totalBalance < 40) {
        document.getElementById("withdrawMessage").textContent =
            "You need at least 40 NRX to withdraw.";
        return;
    }

    document.getElementById("withdrawMessage").textContent =
        "Complete the task to process your withdrawal!";
    // After task completed, admin processes payment manually
};

// Countdown to 15 December
let endDate = new Date("December 15, 2025 00:00:00").getTime();

setInterval(function () {
    let now = new Date().getTime();
    let distance = endDate - now;

    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML =
        days + "d " + hours + "h " + minutes + "m " + seconds + "s";
}, 1000);
