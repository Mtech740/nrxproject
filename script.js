/* script.js
   - Countdown (launch date)
   - Mining system (localStorage)
   - Boost & Withdraw require OGAds completion (manual verification placeholder)
   - Uses OGAds link: https://lockedapp.org/cl/i/j76pvj
*/

/* ---------- CONFIG ---------- */
const CONFIG = {
  LAUNCH_TS: Date.parse('December 15, 2025 12:00:00 UTC'), // listing (countdown)
  MINE_START_TS: Date.parse('November 22, 2025 00:00:00 UTC'), // mining opens
  DAILY_LIMIT: 10.0,          // NRX per day
  SESSION_SECONDS: 120,       // seconds per mining session
  BASE_RATE_PER_SEC: 0.02,    // NRX per second base (small)
  TASK_REWARDS: { telegram: 1, twitter: 1, survey: 3 },
  TASK_BOOST_PERCENT: 25,     // boost percent applied for TASK_BOOST_MINUTES
  TASK_BOOST_MINUTES: 20,
  OGADS_LINK: 'https://lockedapp.org/cl/i/j76pvj',
  MIN_WITHDRAW: 40.0
};

/* ---------- STATE (persisted) ---------- */
let state = JSON.parse(localStorage.getItem('nrx_state')) || {
  balance: 0.0,
  minedToday: 0.0,
  lastMineDate: (new Date()).toDateString(),
  tasks: {}, // e.g. {telegram:true}
  boosts: [] // array of {until:ts,pct}
};

function saveState(){ localStorage.setItem('nrx_state', JSON.stringify(state)); }

/* ---------- COUNTDOWN & TIME DISPLAY ---------- */
function startClockAndCountdown(){
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  const dateDisplay = document.getElementById('dateDisplay');
  const timeDisplay = document.getElementById('timeDisplay');

  // Human-readable date above countdown
  const launchDate = new Date(CONFIG.LAUNCH_TS);
  const options = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  dateDisplay.textContent = launchDate.toLocaleDateString(undefined, options);

  function tick(){
    const now = Date.now();
    // Current time display (UTC)
    const nowDate = new Date();
    timeDisplay.textContent = nowDate.toUTCString().split(' ')[4] + ' UTC';

    // Countdown
    let diff = CONFIG.LAUNCH_TS - now;
    if (diff < 0) {
      daysEl.textContent = '0'; hoursEl.textContent = '0'; minsEl.textContent = '0'; secsEl.textContent = '0';
    } else {
      const d = Math.floor(diff / (1000*60*60*24)); diff -= d*(1000*60*60*24);
      const h = Math.floor(diff / (1000*60*60)); diff -= h*(1000*60*60);
      const m = Math.floor(diff / (1000*60)); diff -= m*(1000*60);
      const s = Math.floor(diff/1000);
      daysEl.textContent = d; hoursEl.textContent = h; minsEl.textContent = m; secsEl.textContent = s;
    }
  }
  tick(); setInterval(tick,1000);
}

/* ---------- MINING ---------- */
let mineInterval = null, sessionInterval = null, sessionLeft = CONFIG.SESSION_SECONDS;

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
  // purge expired boosts
  state.boosts = state.boosts.filter(b => b.until > now);
  let pct = state.boosts.reduce((acc,b)=>acc + (b.pct||0), 0);
  return 1 + pct/100;
}

function updateUI(){
  document.getElementById('balance').textContent = state.balance.toFixed(4);
  document.getElementById('minedToday').textContent = state.minedToday.toFixed(4);
  // update mine button label based on boost
  const mineBtn = document.getElementById('mineBtn');
  const boostActive = state.boosts.length > 0;
  mineBtn.textContent = boostActive ? 'Boost Mine' : (isMining() ? 'Mining...' : 'Mine Now');
}

function isMining(){ return !!mineInterval; }

function startMining(){
  // check mining start date
  if (Date.now() < CONFIG.MINE_START_TS){
    alert('Mining has not started yet. Mining opens on 22 Nov 2025.');
    return;
  }
  resetDailyIfNeeded();
  if (state.minedToday >= CONFIG.DAILY_LIMIT){
    alert('You reached the daily mining limit. Come back tomorrow.');
    return;
  }
  // disable start, enable stop
  document.getElementById('mineBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  sessionLeft = CONFIG.SESSION_SECONDS;

  mineInterval = setInterval(()=>{
    const multiplier = getBoostMultiplier();
    const earn = CONFIG.BASE_RATE_PER_SEC * multiplier;
    if (state.minedToday + earn > CONFIG.DAILY_LIMIT){
      const allowed = CONFIG.DAILY_LIMIT - state.minedToday;
      state.balance += allowed; state.minedToday += allowed;
      stopMining();
      saveState(); updateUI();
      return;
    }
    state.balance += earn;
    state.minedToday += earn;
    saveState(); updateUI();
  }, 1000);

  sessionInterval = setInterval(()=>{
    sessionLeft--;
    const mm = Math.floor(sessionLeft/60);
    const ss = sessionLeft % 60;
    document.getElementById('sessionTimer').textContent = `${mm}:${ss<10?'0'+ss:ss}`;
    if (sessionLeft <= 0) stopMining();
  }, 1000);
  updateUI();
}

function stopMining(){
  document.getElementById('mineBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  clearInterval(mineInterval); mineInterval = null;
  clearInterval(sessionInterval); sessionInterval = null;
  document.getElementById('sessionTimer').textContent = '00:00';
  saveState(); updateUI();
}

/* ---------- TASKS & OGADS flow ---------- */
function openOgadsOffer(){
  window.open(CONFIG.OGADS_LINK, '_blank', 'noopener');
  alert('OGAds offer opened in a new tab. Complete the offer and then come back and click "I\'ve Completed the Offer".');
}
function verifyOgadsClaim(){
  // Manual verification placeholder: ask user to confirm
  const ok = confirm('Did you finish the OGAds offer? Click OK to confirm (manual verification).');
  if (!ok) return;
  // reward for verifying
  if (!state.tasks.ogads){
    state.tasks.ogads = true;
    // give small reward and a boost
    state.balance += 3.0;
    state.minedToday += 3.0;
    const until = Date.now() + CONFIG.TASK_BOOST_MINUTES * 60 * 1000;
    state.boosts.push({until: until, pct: CONFIG.TASK_BOOST_PERCENT});
    saveState(); updateUI();
    alert('Thanks — OGAds verified. You received +3 NRX and a temporary mining boost.');
  } else {
    alert('OGAds task was already confirmed earlier.');
  }
}

function verifySimpleTask(task){
  if (state.tasks[task]){
    alert('Task already completed.');
    return;
  }
  const ok = confirm('Did you complete the task in the new tab? Click OK to confirm (manual verification).');
  if (!ok) return;
  state.tasks[task] = true;
  const reward = CONFIG.TASK_REWARDS[task] || 0;
  state.balance += reward;
  state.minedToday += reward;
  // add boost
  const until = Date.now() + CONFIG.TASK_BOOST_MINUTES*60*1000;
  state.boosts.push({until: until, pct: CONFIG.TASK_BOOST_PERCENT});
  saveState(); updateUI();
  alert(`Thanks! You received ${reward} NRX and a ${CONFIG.TASK_BOOST_PERCENT}% boost for ${CONFIG.TASK_BOOST_MINUTES} minutes.`);
}

/* ---------- WITHDRAW ---------- */
function withdrawNow(){
  // check tasks completed at least OGAds
  if (!state.tasks.ogads){
    const openOffer = confirm('Withdrawals require completion of an OGAds offer. Open OGAds offer now?');
    if (openOffer) openOgadsOffer();
    return;
  }
  // check amount
  const want = parseFloat(prompt(`Your balance: ${state.balance.toFixed(4)} NRX. Enter amount to withdraw (min ${CONFIG.MIN_WITHDRAW} NRX):`,''));
  if (!want || isNaN(want) || want <= 0){ alert('Invalid amount'); return; }
  if (want < CONFIG.MIN_WITHDRAW){ alert(`Minimum withdraw is ${CONFIG.MIN_WITHDRAW} NRX.`); return; }
  if (want > state.balance){ alert('Insufficient balance'); return; }
  const addr = document.getElementById('withdrawAddress').value.trim();
  if (!addr || addr.length < 20){ alert('Enter a valid BSC wallet address'); return; }

  // simulate fee retained by project (example 0.7%)
  const feePercent = 0.7/100;
  const fee = want * feePercent;
  const toUser = want - fee;

  // deduct
  state.balance -= want; saveState(); updateUI();
  alert(`Withdraw request accepted (simulated).
Sent: ${toUser.toFixed(4)} NRX to ${addr}
Fee retained by project: ${fee.toFixed(4)} NRX.

NOTE: This demo simulates withdrawals. Replace with server-side / on-chain transfer (Thirdweb) when ready.`);
}

/* ---------- INIT ---------- */
function initUI(){
  // buttons
  document.getElementById('mineBtn').onclick = ()=> {
    if (isMining()) { return; }
    // change label logic: user wanted Mine Now -> becomes Boost Mine when clicked; here we treat boost via state.boosts
    startMining();
  };
  document.getElementById('stopBtn').onclick = stopMining;
  document.getElementById('boostBtn').onclick = ()=> {
    // force user to open OGAds and verify to activate boost
    const openOffer = confirm('Boost requires completing OGAds offer. Open OGAds now?');
    if (openOffer) openOgadsOffer();
  };
  document.getElementById('ogadsOpen').onclick = (e)=> { /* fallback, link already opens */ };
  document.getElementById('ogadsVerify').onclick = verifyOgadsClaim;

  document.querySelectorAll('.task-verify').forEach(btn=>{
    btn.onclick = (ev)=> {
      const task = ev.target.getAttribute('data-task');
      if (!task) return;
      verifySimpleTask(task);
    }
  });

  document.getElementById('withdrawBtn').onclick = withdrawNow;

  // nav menu toggler on mobile
  const menuBtn = document.getElementById('menuBtn');
  const navList = document.getElementById('navList');
  menuBtn && menuBtn.addEventListener('click', ()=> {
    navList.style.display = (navList.style.display === 'flex') ? 'none' : 'flex';
  });

  // load state UI
  resetDailyIfNeeded();
  updateUI();
  startClockAndCountdown();
}

// kick off
initUI();
