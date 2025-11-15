// script.js — NRX Mining + Tasks + ZebMoney placeholders
// CONFIG
const CONFIG = {
  LAUNCH_TS: Date.parse('December 7, 2025 12:00:00 UTC'), // listing date/time
  CLAIM_DURATION_DAYS: 14,   // claim window length (from first visit)
  DAILY_LIMIT: 20.0,         // NRX per day
  SESSION_SECONDS: 120,      // seconds per mining session
  RATE_PER_SEC: 0.02,        // base NRX/sec
  TASK_REWARDS: { telegram: 2, twitter: 2, survey: 5 },
  TASK_BOOST_MINUTES: 30,
  TASK_BOOST_PERCENT: 20,
  ZEBLINKS: {
    telegram: 'ZEBLINK_TELEGRAM', // <--- replace with real ZebMoney link
    twitter: 'ZEBLINK_TWITTER',
    survey: 'ZEBLINK_SURVEY',
    offer1: 'ZEBLINK_OFFER_1',
    offer2: 'ZEBLINK_OFFER_2',
    offer3: 'ZEBLINK_OFFER_3'
  },
  CONTRACT: '0x843359Fc72AB9C741c88EA32a224005f9AED5eD7'
};

// State (localStorage)
const initialState = {
  balance: 0.0,
  minedToday: 0.0,
  lastMineDate: new Date().toDateString(),
  tasks: {}, // e.g. {telegram:true}
  boosts: [], // {until, pct}
  firstVisitTs: Date.now() // used to compute claim window
};

let state = JSON.parse(localStorage.getItem('nrx_state')) || initialState;
if (!state.firstVisitTs) state.firstVisitTs = Date.now();

function saveState(){ localStorage.setItem('nrx_state', JSON.stringify(state)); }

// UI references
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMins = document.getElementById('cd-mins');
const cdSecs = document.getElementById('cd-secs');
const dateDisplay = document.getElementById('dateDisplay');
const currentTimeEl = document.getElementById('currentTime');

const balanceEl = document.getElementById('balance');
const minedTodayEl = document.getElementById('minedToday');
const startBtn = document.getElementById('startMine');
const stopBtn = document.getElementById('stopMine');
const sessionTimer = document.getElementById('sessionTimer');
const claimBtn = document.getElementById('claimBtn');

const tasksCompletedEl = document.getElementById('tasksCompleted');
const taskOpenBtns = document.querySelectorAll('.task-open');
const taskDoneBtns = document.querySelectorAll('.task-done');

const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawAddr = document.getElementById('withdrawAddress');
const withdrawAmt = document.getElementById('withdrawAmount');
const withdrawLog = document.getElementById('withdrawLog');

const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');

const countdownGrid = document.getElementById('countdownGrid');

// ----- Utility
function fmt(n, d=4){ return parseFloat(n).toFixed(d); }
function nowUTC(){ return new Date(); }

// ----- Countdown / current time logic
function startCountdown(){
  function tick(){
    const now = Date.now();
    const diff = Math.max(0, CONFIG.LAUNCH_TS - now);
    const days = Math.floor(diff / (1000*60*60*24));
    let rem = diff - days*(1000*60*60*24);
    const hours = Math.floor(rem / (1000*60*60));
    rem -= hours*(1000*60*60);
    const mins = Math.floor(rem / (1000*60));
    rem -= mins*(1000*60);
    const secs = Math.floor(rem / 1000);

    cdDays.textContent = days;
    cdHours.textContent = hours;
    cdMins.textContent = mins;
    cdSecs.textContent = secs;
  }
  tick(); setInterval(tick, 1000);
}

// date display & current time
function startClock(){
  function tick(){
    const d = new Date(CONFIG.LAUNCH_TS);
    const options = { weekday: 'long', year:'numeric', month:'long', day:'numeric' };
    dateDisplay.textContent = d.toLocaleDateString('en-GB', options); // e.g. Sunday, December 7, 2025
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2,'0');
    const mm = String(now.getUTCMinutes()).padStart(2,'0');
    const ss = String(now.getUTCSeconds()).padStart(2,'0');
    currentTimeEl.textContent = `${hh}:${mm}:${ss}`;
  }
  tick(); setInterval(tick, 1000);
}

// ----- Mining logic
let miningInterval = null;
let sessionInterval = null;
let sessionLeft = CONFIG.SESSION_SECONDS;

function resetDailyIfNeeded(){
  const today = new Date().toDateString();
  if (state.lastMineDate !== today){
    state.minedToday = 0.0;
    state.lastMineDate = today;
    saveState();
  }
}

function getBoostMultiplier(){
  const now = Date.now();
  state.boosts = state.boosts.filter(b => b.until > now);
  const pct = state.boosts.reduce((s,b)=> s + b.pct, 0);
  return 1 + pct/100;
}

function updateUI(){
  balanceEl.textContent = fmt(state.balance,4);
  minedTodayEl.textContent = fmt(state.minedToday,4);
  tasksCompletedEl.textContent = Object.keys(state.tasks).length;
}

function startMining(){
  resetDailyIfNeeded();
  if (state.minedToday >= CONFIG.DAILY_LIMIT){
    alert('Daily mining limit reached. Come back tomorrow.');
    return;
  }
  startBtn.disabled = true; stopBtn.disabled = false;
  sessionLeft = CONFIG.SESSION_SECONDS;

  miningInterval = setInterval(()=>{
    const multiplier = getBoostMultiplier();
    const earn = CONFIG.RATE_PER_SEC * multiplier;
    if (state.minedToday + earn > CONFIG.DAILY_LIMIT){
      const allowed = CONFIG.DAILY_LIMIT - state.minedToday;
      state.balance += allowed; state.minedToday += allowed;
      stopMining();
      saveState(); updateUI();
      return;
    }
    state.balance += earn; state.minedToday += earn;
    saveState(); updateUI();
  }, 1000);

  sessionInterval = setInterval(()=>{
    sessionLeft--;
    const m = Math.floor(sessionLeft/60); const s = sessionLeft % 60;
    sessionTimer.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (sessionLeft <= 0) stopMining();
  }, 1000);
}

function stopMining(){
  startBtn.disabled = false; stopBtn.disabled = true;
  clearInterval(miningInterval); miningInterval = null;
  clearInterval(sessionInterval); sessionInterval = null;
  sessionTimer.textContent = '00:00';
  saveState(); updateUI();
}

// ----- Tasks & CPA flow
function wireTaskButtons(){
  // set real links (from CONFIG)
  document.querySelectorAll('.task-open').forEach(btn=>{
    const linkKey = btn.getAttribute('data-link');
    // map token keys to real urls in CONFIG.ZEBLINKS
    let href = '#';
    if (linkKey === 'ZEBLINK_TELEGRAM') href = CONFIG.ZEBLINKS.telegram;
    if (linkKey === 'ZEBLINK_TWITTER') href = CONFIG.ZEBLINKS.twitter;
    if (linkKey === 'ZEBLINK_SURVEY') href = CONFIG.ZEBLINKS.survey;
    btn.href = href;
    btn.onclick = ()=>{ /* leave default navigation — opens in new tab */};
  });

  document.querySelectorAll('.task-done').forEach(btn=>{
    btn.onclick = () => {
      const task = btn.getAttribute('data-task');
      if (state.tasks[task]) { alert('Task already done'); return; }
      const ok = confirm('Did you complete the task in the opened tab? Click OK to confirm (manual verification).');
      if (!ok) return;
      // grant reward + boost
      const reward = CONFIG.TASK_REWARDS[task] || 0;
      state.balance += reward;
      state.minedToday += reward;
      state.boosts.push({ until: Date.now() + CONFIG.TASK_BOOST_MINUTES*60000, pct: CONFIG.TASK_BOOST_PERCENT });
      state.tasks[task] = true;
      saveState(); updateUI();
      btn.textContent = 'Completed'; btn.disabled = true; btn.classList.add('done');
      alert(`You received ${reward} NRX and a ${CONFIG.TASK_BOOST_PERCENT}% boost for ${CONFIG.TASK_BOOST_MINUTES} minutes.`);
    };
  });
}

// ----- Withdraw (SIMULATED)
function claimWithdraw(){
  // require at least one completed task
  if (Object.keys(state.tasks).length === 0){
    const goToOffer = confirm('Withdrawals require at least one completed task to protect the project. Open a recommended offer?');
    if (goToOffer) window.open(CONFIG.ZEBLINKS.survey, '_blank');
    return;
  }

  const addr = withdrawAddr.value?.trim();
  const amt = parseFloat(withdrawAmt.value?.trim());
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)){ alert('Enter a valid BSC address (0x...)'); return; }
  if (!amt || amt <= 0){ alert('Enter a valid amount'); return; }
  if (amt > state.balance){ alert('Insufficient balance'); return; }

  // simulate project fee (e.g., 0.7%)
  const feePct = 0.7/100;
  const fee = amt * feePct;
  const send = amt - fee;
  state.balance -= amt;
  saveState(); updateUI();

  withdrawLog.textContent = `Simulated: ${send.toFixed(4)} NRX would be sent to ${addr}. Project fee ${fee.toFixed(4)} NRX retained.`;
  alert('Withdrawal simulated. For real transfers, integrate a backend + Thirdweb wallet.');
}

// ----- Claim window: hide tasks when claim window ends
function claimWindowEnded(){
  // compute claim end: either firstVisit + CONFIG.CLAIM_DURATION_DAYS OR earlier if that exceeds LAUNCH_TS
  const byFirstVisit = state.firstVisitTs + CONFIG.CLAIM_DURATION_DAYS * 24*3600*1000;
  const claimEnd = Math.min(byFirstVisit, CONFIG.LAUNCH_TS); // never after launch
  return Date.now() > claimEnd;
}

function hideTasksIfEnded(){
  if (claimWindowEnded()){
    // remove tasks section
    const tasksSec = document.getElementById('tasks');
    if (tasksSec) tasksSec.style.display = 'none';
    const offersSec = document.getElementById('offers');
    if (offersSec) offersSec.style.display = 'none';
    const claimNote = document.createElement('div');
    claimNote.className = 'muted small';
    claimNote.textContent = 'The free claim period has ended. Follow socials for updates and listing info.';
    const parent = document.querySelector('.container');
    parent.insertBefore(claimNote, document.getElementById('withdraw'));
  }
}

// ----- Menu wiring
menuToggle.onclick = ()=>{ sideMenu.classList.add('open'); sideMenu.setAttribute('aria-hidden','false'); };
closeMenu.onclick = ()=>{ sideMenu.classList.remove('open'); sideMenu.setAttribute('aria-hidden','true'); };

// ----- Init
function init(){
  // fill offers with zeb links
  document.querySelectorAll('.offer').forEach((a, i)=>{
    const key = ['offer1','offer2','offer3'][i];
    a.href = CONFIG.ZEBLINKS[key] || '#';
  });

  // fill any data where needed
  document.querySelectorAll('[data-link]').forEach(el=>{
    const data = el.getAttribute('data-link');
    if (data === 'ZEBLINK_TELEGRAM') el.href = CONFIG.ZEBLINKS.telegram;
    if (data === 'ZEBLINK_TWITTER') el.href = CONFIG.ZEBLINKS.twitter;
    if (data === 'ZEBLINK_SURVEY') el.href = CONFIG.ZEBLINKS.survey;
  });

  // wire UI
  startBtn.onclick = startMining;
  stopBtn.onclick = stopMining;
  claimBtn.onclick = claimWithdraw;
  withdrawBtn.onclick = claimWithdraw;

  // task buttons
  wireTaskButtons();

  // restore task UI state
  document.querySelectorAll('.task-done').forEach(btn=>{
    const t = btn.getAttribute('data-task');
    if (state.tasks[t]){ btn.textContent = 'Completed'; btn.disabled = true; btn.classList.add('done'); }
  });

  // reset daily if needed and update UI
  resetDailyIfNeeded();
  updateUI();

  startCountdown();
  startClock();

  // hide tasks if claim window ended
  hideTasksIfEnded();

  // Small visual pulse when numbers change (optional)
  const observer = new MutationObserver(()=>{ /* placeholder for animation */ });
  observer.observe(balanceEl, { childList: true, subtree:true });

  // set contract in UI (if missing)
  const contractEls = document.querySelectorAll('.mono');
  contractEls.forEach(el=>{
    if (el.textContent.includes('0x843359')) el.textContent = CONFIG.CONTRACT;
  });

  // help: populate withdraw address placeholder with the user's address if available (not implemented)
  // future: integrate wallet connect
}

init();
