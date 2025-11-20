/* script.js
   Mining + Tasks + Countdown + OGAds integration (manual verify placeholder)
   - Mining starts: 22 Nov 2025 12:00 UTC
   - Listing: 15 Dec 2025 12:00 UTC
   - Withdraw requires: >=1 completed task AND >= 40 NRX
*/

// CONFIG
const LAUNCH_TS = Date.parse('December 15, 2025 12:00:00 UTC'); // listing
const MINING_START_TS = Date.parse('November 22, 2025 12:00:00 UTC'); // mining start
const SESSION_SECONDS = 120;         // seconds per mining session
const RATE_PER_SEC = 0.05;           // NRX per second base (small)
const DAILY_LIMIT = 10.0;            // NRX daily cap
const MIN_WITHDRAW = 40.0;           // minimum withdrawal
const TASK_REWARDS = { ogads: 5, twitter: 2, telegram: 2 };
const TASK_BOOST_MIN = 30;
const TASK_BOOST_PCT = 20;

// STATE (persist)
let state = JSON.parse(localStorage.getItem('nrx_state')) || {
  balance: 0,
  minedToday: 0,
  lastMineDate: new Date().toDateString(),
  tasks: {}, // completed tasks map
  boosts: [] // {until: timestamp, pct}
};

function save(){
  localStorage.setItem('nrx_state', JSON.stringify(state));
}

// -- Countdown --
function startCountdown(){
  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');

  function tick(){
    let diff = LAUNCH_TS - Date.now();
    if (diff <= 0){
      dEl.textContent = '0'; hEl.textContent='0'; mEl.textContent='0'; sEl.textContent='0';
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    diff -= days*(1000*60*60*24);
    const hours = Math.floor(diff / (1000*60*60));
    diff -= hours*(1000*60*60);
    const mins = Math.floor(diff / (1000*60));
    diff -= mins*(1000*60);
    const secs = Math.floor(diff/1000);
    dEl.textContent = days; hEl.textContent = hours; mEl.textContent = mins; sEl.textContent = secs;
  }
  tick(); setInterval(tick, 1000);
}

// -- Mining logic --
let miningInterval = null;
let sessionTimer = null;
let sessionLeft = SESSION_SECONDS;

function resetDaily(){
  const today = new Date().toDateString();
  if (state.lastMineDate !== today){
    state.minedToday = 0;
    state.lastMineDate = today;
    save();
  }
}
function getBoostMultiplier(){
  const now = Date.now();
  state.boosts = state.boosts.filter(b => b.until > now);
  let pct = state.boosts.reduce((acc,b)=>acc+b.pct,0);
  return 1 + pct/100;
}

function updateUI(){
  document.getElementById('balance').textContent = state.balance.toFixed(4);
  document.getElementById('minedToday').textContent = state.minedToday.toFixed(4);
  // mark completed tasks
  ['ogads','twitter','telegram'].forEach(t=>{
    const btn = document.querySelector(`[data-task="${t}"]`) || document.getElementById(t+'Verify');
    if (state.tasks[t]) {
      if (btn){ btn.textContent = 'Completed'; btn.disabled=true; }
    }
  });
}

function startMining(){
  // check mining start date
  if (Date.now() < MINING_START_TS){
    alert('Mining has not started yet. Mining opens on 22 Nov 2025 12:00 UTC.');
    return;
  }
  resetDaily();
  if (state.minedToday >= DAILY_LIMIT){ alert('Daily limit reached. Come back tomorrow.'); return; }

  document.getElementById('mineNow').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('boostBtn').disabled = false;

  sessionLeft = SESSION_SECONDS;
  sessionTimer = setInterval(()=>{
    sessionLeft--;
    const mm = Math.floor(sessionLeft/60);
    const ss = sessionLeft%60;
    document.getElementById('sessionTimer').textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    if (sessionLeft <= 0) stopMining();
  }, 1000);

  miningInterval = setInterval(()=>{
    const mult = getBoostMultiplier();
    const earn = RATE_PER_SEC * mult;
    // ensure daily cap
    if (state.minedToday + earn > DAILY_LIMIT){
      const allowed = DAILY_LIMIT - state.minedToday;
      state.balance += allowed;
      state.minedToday += allowed;
      save(); updateUI();
      stopMining();
      return;
    }
    state.balance += earn;
    state.minedToday += earn;
    save(); updateUI();
  }, 1000);
}

function stopMining(){
  clearInterval(miningInterval); miningInterval=null;
  clearInterval(sessionTimer); sessionTimer=null;
  document.getElementById('sessionTimer').textContent = '00:00';
  document.getElementById('mineNow').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  // Reset Mine button text if it was Boost Mine
  document.getElementById('mineNow').textContent = 'Mine Now';
  save(); updateUI();
}

// Boost mine handler (instant boost that starts a short session)
function boostMine(){
  // open the OGAds locker to force action or encourage users to complete offer
  window.open('https://lockedapp.org/cl/i/j76pvj','_blank');
  // small simulated reward/boost on user confirmation
  const ok = confirm('After completing the offer, click OK to claim a boost (+20% mining for 30 min and +5 NRX). (Manual verification placeholder)');
  if (!ok) return;
  // mark ogads completed
  const until = Date.now() + TASK_BOOST_MIN*60*1000;
  state.boosts.push({until, pct: TASK_BOOST_PCT});
  state.tasks['ogads'] = true;
  // immediate reward
  state.balance += TASK_REWARDS.ogads;
  state.minedToday += TASK_REWARDS.ogads;
  save(); updateUI();
  alert(`Thanks! You received ${TASK_REWARDS.ogads} NRX and a ${TASK_BOOST_PCT}% boost for ${TASK_BOOST_MIN} minutes.`);
  // set button text
  document.getElementById('mineNow').textContent = 'Boost Mine';
  startMining();
}

// verify manual tasks (placeholder)
function verifyTask(task){
  if (state.tasks[task]) { alert('Task already completed'); return; }
  const ok = confirm('Confirm you completed the task in the new tab. This is manual verification placeholder.');
  if (!ok) return;
  state.tasks[task] = true;
  // reward + small boost for tasks
  const reward = TASK_REWARDS[task] || 1;
  state.balance += reward; state.minedToday += reward;
  const until = Date.now() + TASK_BOOST_MIN*60*1000;
  state.boosts.push({until, pct: TASK_BOOST_PCT});
  save(); updateUI();
  alert(`Rewarded ${reward} NRX and a ${TASK_BOOST_PCT}% boost for ${TASK_BOOST_MIN} minutes.`);
}

// Withdraw flow (simulation)
function withdraw(){
  const addr = document.getElementById('withdrawAddr').value.trim();
  const amt = parseFloat(document.getElementById('withdrawAmt').value);
  if (!addr || !addr.startsWith('0x')){ alert('Enter a valid BSC address (0x...)'); return; }
  if (!amt || amt <= 0){ alert('Enter a valid amount'); return; }
  if (amt > state.balance){ alert('Insufficient balance'); return; }
  if (amt < MIN_WITHDRAW){ alert(`Minimum withdraw is ${MIN_WITHDRAW} NRX`); return; }
  if (!Object.keys(state.tasks).length){ // require tasks
    const go = confirm('Withdrawals require at least one completed task. Open OGAds now to complete a task?');
    if (go) window.open('https://lockedapp.org/cl/i/j76pvj','_blank');
    return;
  }

  // simulate fee (project takes small fee)
  const fee = amt * 0.007; // 0.7% example
  const send = amt - fee;
  state.balance -= amt; save(); updateUI();
  alert(`Withdrawal simulated: ${send.toFixed(4)} NRX sent to ${addr}. Project fee: ${fee.toFixed(4)} NRX.`);
}

// init
function init(){
  // wire buttons
  document.getElementById('mineNow').addEventListener('click', ()=>{
    // toggle between boost and normal
    const btn = document.getElementById('mineNow');
    if (btn.textContent.trim() === 'Mine Now') startMining();
    else if (btn.textContent.trim() === 'Boost Mine') boostMine();
  });
  document.getElementById('stopBtn').addEventListener('click', stopMining);
  document.getElementById('boostBtn').addEventListener('click', boostMine);
  document.getElementById('ogadsVerify').addEventListener('click', ()=>verifyTask('ogads'));
  document.getElementById('twitterVerify').addEventListener('click', ()=>verifyTask('twitter'));
  document.getElementById('teleVerify').addEventListener('click', ()=>verifyTask('telegram'));
  document.getElementById('withdrawNow').addEventListener('click', withdraw);

  // top mining button
  document.getElementById('startMiningTop').addEventListener('click', ()=> {
    document.getElementById('mineNow').scrollIntoView({behavior:'smooth', block:'center'});
    document.getElementById('mineNow').focus();
  });

  resetDaily();
  updateUI();
  startCountdown();
}

document.addEventListener('DOMContentLoaded', init);
