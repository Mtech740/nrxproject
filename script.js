// -----------------------------
// SETTINGS
// -----------------------------

let ogadsWindow = null;
let ogadsCheckInterval = null;

let miningAllowed = false;       // Only becomes TRUE after OGADS completion
let miningStarted = false;

// -----------------------------
// MINING BUTTON CLICK
// -----------------------------

document.getElementById("startMiningBtn").addEventListener("click", () => {

    // Prevent users from starting mining again if OGADS not done
    if (miningAllowed === false) {
        openOgads();
        return;
    }

    startMining();
});

// -----------------------------
// OPEN OGADS OFFER PAGE
// -----------------------------

function openOgads() {

    // Open OGADS window
    ogadsWindow = window.open(
        "https://www.ogads.com/path-to-offer",
        "ogadsWindow",
        "width=500,height=700"
    );

    if (!ogadsWindow) {
        alert("Please allow popups for this site.");
        return;
    }

    // Begin checking if OGADS is closed or left before completing
    startOgadsTracking();
}

// -----------------------------
// TRACK OGADS WINDOW
// -----------------------------

function startOgadsTracking() {

    if (ogadsCheckInterval) clearInterval(ogadsCheckInterval);

    ogadsCheckInterval = setInterval(() => {

        // If user closes OGADS window BEFORE completion
        if (ogadsWindow.closed && miningAllowed === false) {

            stopMining(true);  // FORCE STOP
            alert("You must complete the OGADS task before mining can continue.");
            clearInterval(ogadsCheckInterval);
        }

    }, 800);
}

// -----------------------------
// CALL THIS WHEN USER COMPLETES OGADS TASK
// (YOU trigger this part by your own callback server-side or JS event)
// -----------------------------

function markOgadsComplete() {
    miningAllowed = true;
    alert("Task completed! You can now start mining.");
}

// -----------------------------
// START MINING
// -----------------------------

function startMining() {

    if (miningAllowed === false) {
        alert("You must complete the OGADS task first.");
        return;
    }

    miningStarted = true;
    document.getElementById("status").innerText = "Mining started...";

    // Your mining logic here
}

// -----------------------------
// STOP MINING
// -----------------------------

function stopMining(forced = false) {

    miningStarted = false;

    if (forced) {
        miningAllowed = false;  // They MUST complete OGADS again
        document.getElementById("status").innerText =
            "Mining stopped. Please complete OGADS to continue.";
    } else {
        document.getElementById("status").innerText = "Mining stopped.";
    }

    // Your stop logic here
}
