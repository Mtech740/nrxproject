/***********************
 * GLOBAL STATE
 ***********************/
let mining = false;
let miningInterval = null;
let miningTimer = null;

let balance = 0;
let miningSpeed = 1;

let ogadsForceLock = false;
let ogadsCompleted = false;

const OGADS_LINKS = [
  "https://applocked.org/cl/i/j76pvj"
];

let ogadsIndex = 0;

/***********************
 * UTILITIES
 ***********************/
function getNextOGAdsLink() {
  const link = OGADS_LINKS[ogadsIndex] || OGADS_LINKS[0];
  ogadsIndex = (ogadsIndex + 1) % OGADS_LINKS.length;
  return link;
}

function updateUI() {
  const bal = document.getElementById("balance");
  if (bal) bal.textContent = balance.toFixed(4);
}

function updateMiningButton(state) {
  const btn = document.getElementById("startMiningBtn");
  if (!btn) return;
  btn.disabled = !state;
}

/***********************
 * SAVE / LOAD
 ***********************/
function saveLocalProgress() {
  localStorage.setItem("nrx_balance", balance);
  localStorage.setItem("nrx_mining", mining);
}

function loadLocalProgress() {
  const savedBal = localStorage.getItem("nrx_balance");
  if (savedBal) balance = parseFloat(savedBal);
  updateUI();
}

/***********************
 * MINING CORE
 ***********************/
function startMining() {
  if (ogadsForceLock) return;

  mining = true;
  updateMiningButton(false);

  miningInterval = setInterval(() => {
    balance += miningSpeed * 0.01;
    updateUI();
    saveLocalProgress();
  }, 1000);

  startMiningTimer();
}

function stopMining() {
  mining = false;

  if (miningInterval) {
    clearInterval(miningInterval);
    miningInterval = null;
  }

  if (miningTimer) {
    clearTimeout(miningTimer);
    miningTimer = null;
  }

  updateMiningButton(true);
  saveLocalProgress();
}

function startMiningTimer() {
  if (miningTimer) clearTimeout(miningTimer);

  miningTimer = setTimeout(() => {
    openOGAdsLocker("timer");
  }, 5 * 60 * 1000); // 5 minutes
}

/***********************
 * OGADS LOCKER (YOUR FUNCTION – SAFE)
 ***********************/
function openOGAdsLocker(reason) {
  stopMining();
  saveLocalProgress();

  ogadsForceLock = true;
  ogadsCompleted = false;
  updateMiningButton(false);

  const existing = document.getElementById("ogads-container");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = "ogads-container";
  container.style.cssText = `
    position:fixed;
    top:0; left:0;
    width:100%; height:100%;
    background:#000;
    z-index:999999;
    display:flex;
    flex-direction:column;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    padding:12px;
    background:#111;
    color:#f39c12;
    text-align:center;
    font-size:14px;
    border-bottom:2px solid #f39c12;
  `;
  header.innerHTML = `
    ⛏ Mining Paused<br>
    <small>Complete one task to continue mining</small>
  `;

  const iframe = document.createElement("iframe");
  iframe.src = getNextOGAdsLink();
  iframe.style.cssText = "flex:1;width:100%;border:none;";
  iframe.sandbox = "allow-scripts allow-forms allow-same-origin allow-popups";

  container.appendChild(header);
  container.appendChild(iframe);
  document.body.appendChild(container);

  iframe.addEventListener("load", () => {
    console.log("OGADS loaded");
  });
}

/***********************
 * OGADS COMPLETION (ONLY EXIT)
 ***********************/
function ogadsTaskCompleted() {
  ogadsCompleted = true;
  ogadsForceLock = false;

  const container = document.getElementById("ogads-container");
  if (container) container.remove();

  saveLocalProgress();
  startMining();
}

/***********************
 * SAFETY: PAGE LEAVE
 ***********************/
window.addEventListener("beforeunload", () => {
  saveLocalProgress();
});

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  loadLocalProgress();

  const btn = document.getElementById("startMiningBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      if (!mining && !ogadsForceLock) {
        startMining();
      }
    });
  }
});
