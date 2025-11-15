/* ---------------------------
   COUNTDOWN SYSTEM
----------------------------*/
const listingDate = new Date("2025-11-17T12:00:00");

setInterval(() => {
    const now = new Date();
    const diff = listingDate - now;

    if (diff <= 0) {
        document.getElementById("countdown").innerHTML = "Token is live!";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);

    document.getElementById("countdown").innerHTML =
        `${days}d ${hrs}h ${mins}m`;
}, 1000);


/* ---------------------------
   MINING SYSTEM
----------------------------*/
let mining = false;
let miningTime = 60; // 1 minute mining
let mined = 0;

document.getElementById("startMining").addEventListener("click", () => {
    if (mining) return;

    mining = true;
    let timeLeft = miningTime;

    const interval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft + " sec";

        if (timeLeft <= 0) {
            clearInterval(interval);
            mining = false;

            mined += 5; // reward for each mining session
            document.getElementById("mined").textContent = mined;
            document.getElementById("timer").textContent = "00:00";
        }
    }, 1000);
});


/* ---------------------------
   TASK SYSTEM
----------------------------*/
let tasksCompleted = 0;

function completeTask(taskId) {
    window.open("https://google.com", "_blank");

    tasksCompleted++;
    if (tasksCompleted > 2) tasksCompleted = 2;

    document.getElementById("doneTasks").textContent = tasksCompleted;

    if (tasksCompleted === 2) {
        document.getElementById("withdraw").disabled = false;
    }
}


/* ---------------------------
   CPA OFFER SYSTEM
----------------------------*/
function openOffer(url) {
    window.open(url, "_blank");
}


/* ---------------------------
   WITHDRAW SYSTEM
----------------------------*/
document.getElementById("withdraw").addEventListener("click", () => {
    const wallet = document.getElementById("wallet").value;

    if (!wallet) {
        document.getElementById("withdrawStatus").textContent = "Enter wallet!";
        return;
    }

    document.getElementById("withdrawStatus").textContent =
        "Processing withdrawal... (simulate sending NRX)";
});
