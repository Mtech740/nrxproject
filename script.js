// script.js — Neura NRX Mockup logic (mining + tasks + countdown)
// CONFIG
const CONFIG = {
  LAUNCH_TS: Date.parse('December 15, 2025 12:00:00 UTC'), // listing countdown
  MINING_START_TS: Date.parse('November 22, 2025 00:00:00 UTC'), // mining start
  DAILY_LIMIT: 10.0,       // NRX / day
  SESSION_SECONDS: 120,    // seconds per mining session
  RATE_PER_SEC: 0.05,      // NRX per second (base)
  TASK_REWARD: 5.0,        // reward when verifying a task
  BOOST_PCT: 25,           // boost percent from task
  BOOST_MINUTES: 30,       // boost duration
  OGADS_LINK: 'https://lockedapp.org/cl/i/j76pvj',
  WITHDRAW_MIN: 40.0       // min withdraw NRX
};

// State persisted in localStorage
let state = JSON.parse(localStorage.getItem('nrx_state')) || {
  balance: 0.0,
  minedToday: 0.0,
  lastMineDate: (new Date()).toDateString(),
  tasks: {}, // e.g., { offer: true }
  boosts: [] // { until: timestamp, pct }
};

function saveState(){ localStorage.setItem('nrx_state', JSON.stringify(state)); }

// ====== Countdown & Time ======
function startCountdown(){
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  const currentTime = document.getElementById('currentTime');
  const dateDisplay = document.getElementById('dateDisplay');

  function tick(){
    const now = Date.now();
    // listing countdown
    let diff = CONFIG.LAUNCH_TS - now;
    if (diff < 0) diff = 0;
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const m = Math.floor((diff % (1000*60*60)) / (1000*60));
    const s = Math.floor((diff % (1000*60)) / 1000);
    daysEl.textContent = d; hoursEl.textContent = h; minsEl.textContent = m; secsEl.textContent = s;

    // current time display
    const nowObj = new Date();
    const timestr = nowObj.toUTCString().replace(' GMT',' UTC');
    currentTime.textContent = `${nowObj.toLocaleTimeString()} (local) • ${nowObj.toUTCString().split(' ')[4]} UTC`;
  }
  tick();
  setInterval(tick, 1000);

  // display human date above countdown
  const dd = new Date(CONFIG.LAUNCH_TS);
  const human = dd.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  dateDisplay.textContent = human;
}

// ====== Mining logic ======
let miningInterval = null;
let sessionTimerInterval = null;
let sessionSecondsLeft = CONFIG.SESSION_SECONDS;
const startMineBtn = document.getElementById('startMine');
const boostBtn = document.getElementById('boostBtn');
const stopBtn = document.getElementById('stopMine');

function resetDailyIfNeeded(){
  const today = (new Date()).toDateString();
  if (state.lastMineDate !== today){
    state.minedToday = 0.0;
    state.lastMineDate = today;
    saveState();
  }
}

function getBoostMultiplier(){
  const now = Date.now();
  // remove expired boosts
  state.boosts = state.boosts.filter(b => b.until > now);
  let pct = state.boosts.reduce((acc,b)=>acc+b.pct, 0);
  return 1 + pct/100;
}

function updateUI(){
  document.getElementById('balance').textContent = state.balance.toFixed(4);
  document.getElementById('minedToday').textContent = state.minedToday.toFixed(4);

  // task button update
  if (state.tasks.offer){
    document.getElementById('verifyTask').textContent = 'Completed';
    document.getElementById('verifyTask').disabled = true;
  }

  // disable mining until mining start
  const now = Date.now();
  if (now < CONFIG.MINING_START_TS){
    startMineBtn.disabled = true;
    startMineBtn.textContent = 'Mining opens ' + new Date(CONFIG.MINING_START_TS).toLocaleDateString();
    boostBtn.disabled = true;
  } else {
    // normal
    if (!miningInterval) {
      startMineBtn.disabled = false;
      startMineBtn.textContent = 'Mine Now';
      boostBtn.disabled = false;
    }
  }
}

function startMining(){
  // check mining start date
  if (Date.now() < CONFIG.MINING_START_TS){
    alert('Mining has not started yet. Mining opens on ' + new Date(CONFIG.MINING_START_TS).toLocaleString());
    return;
  }

  resetDailyIfNeeded();

  if (state.minedToday >= CONFIG.DAILY_LIMIT){
    alert('You have reached your daily mining limit. Come back tomorrow.');
    return;
  }

  // start session
  startMineBtn.disabled = true;
  stopBtn.disabled = false;
  boostBtn.disabled = false;
  startMineBtn.textContent = 'Mining...';

  sessionSecondsLeft = CONFIG.SESSION_SECONDS;
  document.getElementById('sessionTimer').textContent = formatTime(sessionSecondsLeft);

  miningInterval = setInterval(()=>{
    const multiplier = getBoostMultiplier();
    const earn = CONFIG.RATE_PER_SEC * multiplier;
    // enforce daily cap
    if (state.minedToday + earn > CONFIG.DAILY_LIMIT){
      const allowed = CONFIG.DAILY_LIMIT - state.minedToday;
      state.balance += allowed; state.minedToday += allowed;
      stopMining();
      saveState(); updateUI();
      return;
    }
    state.balance += earn;
    state.minedToday += earn;
    saveState();
    updateUI();
  }, 1000);

  sessionTimerInterval = setInterval(()=>{
    sessionSecondsLeft--;
    document.getElementById('sessionTimer').textContent = formatTime(sessionSecondsLeft);
    if (sessionSecondsLeft <= 0) stopMining();
  }, 1000);
}

function stopMining(){
  clearInterval(miningInterval); miningInterval = null;
  clearInterval(sessionTimerInterval); sessionTimerInterval = null;
  startMineBtn.disabled = false;
  stopBtn.disabled = true;
  startMineBtn.textContent = 'Mine Now';
  document.getElementById('sessionTimer').textContent = '00:00';
  saveState(); updateUI();
}

function formatTime(sec){
  if (sec < 0) sec = 0;
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Boost mine behavior: if user clicks Boost (they must open OGAds first), we open OGAds link
function applyBoost(){
  // open offerwall
  window.open(CONFIG.OGADS_LINK, '_blank');

  // we expect user to click "I've Completed" after finishing offer. But we can also give them a temporary small boost to encourage.
  alert('Offer opened in a new tab. Complete the offer and return to click "I\'ve Completed". You will receive reward + temporary boost on verification.');
}

// Task verification (manual)
function verifyTaskManual(){
  if (state.tasks.offer){
    alert('Task already completed.');
    return;
  }
  const ok = confirm('Did you complete the offer in the new tab? Click OK to confirm (manual verification).');
  if (!ok) return;

  // grant reward + boost
  state.balance += CONFIG.TASK_REWARD;
  state.minedToday += CONFIG.TASK_REWARD; // counts toward daily
  const until = Date.now() + CONFIG.BOOST_MINUTES*60*1000;
  state.boosts.push({ until: until, pct: CONFIG.BOOST_PCT });
  state.tasks.offer = true;
  saveState();
  updateUI();
  alert(`Thanks — you received ${CONFIG.TASK_REWARD} NRX and a ${CONFIG.BOOST_PCT}% mining boost for ${CONFIG.BOOST_MINUTES} minutes.`);
}

// Withdraw simulation
function claimWithdraw(){
  const addr = document.getElementById('withdrawAddress').value.trim();
  const amt = parseFloat(document.getElementById('withdrawAmount').value);
  const note = document.getElementById('withdrawNote');

  if (!addr || !addr.startsWith('0x') || addr.length < 10){
    note.textContent = 'Please enter a valid BSC wallet address (0x...).';
    return;
  }
  if (!amt || amt <= 0){
    note.textContent = 'Enter a withdrawal amount.';
    return;
  }
  if (amt > state.balance){
    note.textContent = 'Insufficient balance.';
    return;
  }
  if (amt < CONFIG.WITHDRAW_MIN){
    note.textContent = `Minimum withdraw is ${CONFIG.WITHDRAW_MIN} NRX.`;
    return;
  }
  if (!state.tasks.offer){
    // require at least one task
    const openOffer = confirm('Withdrawals require completion of at least one task. Open an offer now?');
    if (openOffer){
      window.open(CONFIG.OGADS_LINK,'_blank');
      note.textContent = 'Offer opened. Complete it and click "I\'ve Completed", then try withdraw again.';
      return;
    } else {
      note.textContent = 'Complete a task to enable withdrawals.';
      return;
    }
  }

  // simulate fee distribution (project/thirdweb cut)
  const feePercent = 0.007; // 0.7% simulated owner cut
  const fee = amt * feePercent;
  const toUser = amt - fee;

  state.balance -= amt;
  saveState();
  updateUI();

  note.textContent = `Withdrawal simulated: ${toUser.toFixed(4)} NRX will be sent to ${addr}. Project fee: ${fee.toFixed(4)} NRX.`;
  alert('Withdrawal simulated. For production, integrate on-chain transfer with Thirdweb or server processes.');
}

// NAV / small helpers
document.getElementById('menuToggle').addEventListener('click', ()=>{
  const nl = document.getElementById('navList');
  nl.style.display = (nl.style.display === 'flex') ? 'none' : 'flex';
});

// set OGAds open link
document.getElementById('openOffer').href = CONFIG.OGADS_LINK;
document.getElementById('startTopBtn').addEventListener('click', ()=>{ document.getElementById('mining').scrollIntoView({behavior:'smooth'}) });

// event wiring
document.getElementById('startMine').addEventListener('click', startMining);
document.getElementById('stopMine').addEventListener('click', stopMining);
document.getElementById('boostBtn').addEventListener('click', applyBoost);
document.getElementById('verifyTask').addEventListener('click', verifyTaskManual);
document.getElementById('withdrawBtn').addEventListener('click', claimWithdraw);

// INIT
function init(){
  // reset daily if needed
  resetDailyIfNeeded();
  updateUI();
  startCountdown();
}
init();
