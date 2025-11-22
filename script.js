// script.js - mining + countdown + OGAds task flow (client-only simulation)

// CONFIG
const CONFIG = {
  LAUNCH_TS: Date.parse('December 15, 2025 12:00:00 UTC'), // listing
  MINING_OPEN_TS: Date.parse('November 22, 2025 00:00:00 UTC'), // mining opens
  DAILY_LIMIT: 10.0,     // NRX/day
  SESSION_SECONDS: 120,  // seconds per session
  RATE_PER_SEC: 0.0833,  // base NRX/sec (so session ~10 NRX if full)
  WITHDRAW_MIN: 40.0,    // minimum NRX to withdraw
  OGADS_LINK: 'https://lockedapp.org/cl/i/j76pvj'
};

// STATE
let state = JSON.parse(localStorage.getItem('nrx_state_v1')) || {
  balance: 0.0,
  minedToday: 0.0,
  lastMineDate: (new Date()).toDateString(),
  tasks: { ogads: false, telegram: false },
  boosts: [] // {until:ts, pct}
};

function save(){ localStorage.setItem('nrx_state_v1', JSON.stringify(state)); }

// ================= COUNTDOWN =================
function el(id){ return document.getElementById(id) }

function startCountdown(){
  function tick(){
    const now = Date.now();
    let diff = CONFIG.LAUNCH_TS - now;
    if (diff <= 0){
      el('cd-days').textContent='0';
      el('cd-hours').textContent='0';
      el('cd-mins').textContent='0';
      el('cd-secs').textContent='0';
      return;
    }
    const d = Math.floor(diff / (1000*60*60*24));
    diff -= d*(1000*60*60*24);
    const h = Math.floor(diff / (1000*60*60));
    diff -= h*(1000*60*60);
    const m = Math.floor(diff / (1000*60));
    diff -= m*(1000*60);
    const s = Math.floor(diff/1000);
    el('cd-days').textContent = d;
    el('cd-hours').textContent = h;
    el('cd-mins').textContent = m;
    el('cd-secs').textContent = s;
  }
  tick();
  setInterval(tick, 1000);
}

// ================ UTILS =================
function resetDailyIfNeeded(){
  const today = (new Date()).toDateString();
  if (state.lastMineDate !== today){
    state.minedToday = 0;
    state.lastMineDate = today;
    save();
  }
}
function getBoostMultiplier(){
  const now = Date.now();
  state.boosts = state.boosts.filter(b => b.until > now);
  const pct = state.boosts.reduce((a,b)=>a+b.pct,0);
  return 1 + pct/100;
}

// ================ UI UPDATE =================
function updateUI(){
  resetDailyIfNeeded();
  el('balance').textContent = state.balance.toFixed(3);
  el('minedToday').textContent = state.minedToday.toFixed(3);

  // tasks UI
  if (state.tasks.ogads){
    document.getElementById('verifyTask').textContent='Completed';
    document.getElementById('verifyTask').disabled = true;
  }
  if (state.tasks.telegram){
    document.getElementById('verifyTG').textContent='Joined';
    document.getElementById('verifyTG').disabled = true;
  }
}

// ================ MINING LOGIC =================
let miningInterval = null;
let sessionInterval = null;
let sessionSecondsLeft = CONFIG.SESSION_SECONDS;
let miningActive = false;

function enableFans(on){
  const fans = document.querySelectorAll('.fan');
  fans.forEach((f,i)=>{
    f.style.animation = on ? `spin ${on ? (i===0?1.2:1.6) : 0}s linear infinite` : 'none';
  });
}

function startMiningSession(){
  const now = Date.now();
  if (now < CONFIG.MINING_OPEN_TS){
    alert('Mining is not open yet. Mining opens on 22 Nov 2025.');
    return;
  }
  resetDailyIfNeeded();
  if (state.minedToday >= CONFIG.DAILY_LIMIT){
    alert('Daily mining limit reached. Come back tomorrow.');
    return;
  }
  if (miningActive) return;
  miningActive = true;
  sessionSecondsLeft = CONFIG.SESSION_SECONDS;
  document.getElementById('startMine').disabled = true;
  document.getElementById('stopMine').disabled = false;
  document.getElementById('boostBtn').disabled = false;

  enableFans(true);

  miningInterval = setInterval(()=>{
    const multiplier = getBoostMultiplier();
    const earn = CONFIG.RATE_PER_SEC * multiplier;
    // check daily cap
    if (state.minedToday + earn > CONFIG.DAILY_LIMIT){
      const allowed = CONFIG.DAILY_LIMIT - state.minedToday;
      state.balance += allowed;
      state.minedToday += allowed;
      save();
      updateUI();
      stopMiningSession();
      return;
    }
    state.balance += earn;
    state.minedToday += earn;
    save();
    updateUI();
  }, 1000);

  sessionInterval = setInterval(()=>{
    sessionSecondsLeft--;
    const mm = Math.floor(sessionSecondsLeft/60).toString().padStart(2,'0');
    const ss = (sessionSecondsLeft%60).toString().padStart(2,'0');
    el('sessionTimer').textContent = `${mm}:${ss}`;
    if (sessionSecondsLeft <= 0) stopMiningSession();
  },1000);
}

function stopMiningSession(){
  clearInterval(miningInterval); miningInterval = null;
  clearInterval(sessionInterval); sessionInterval = null;
  miningActive = false;
  document.getElementById('startMine').disabled = false;
  document.getElementById('stopMine').disabled = true;
  document.getElementById('boostBtn').disabled = true;
  el('sessionTimer').textContent = '00:00';
  enableFans(false);
  // ensure 'Mine Now' label reset if it was changed
  document.getElementById('startMine').textContent = 'Mine Now';
}

// boost mine click -> opens OGAds and grants temporary boost once user verifies
function applyBoostTemporary(){
  // open OGAds in new tab
  window.open(CONFIG.OGADS_LINK, '_blank');
  // tell user how to verify
  alert('Complete an OGAds offer in the new tab. Then return and click "I\'ve Completed" to receive boost and NRX.');
}

// ================ TASKS =================
document.getElementById('ogadsLink').href = CONFIG.OGADS_LINK;
document.getElementById('verifyTask').onclick = function(){
  if (state.tasks.ogads){ alert('Already completed.'); return; }
  const ok = confirm('Did you finish the OGAds offer? Click OK to confirm (manual verification).');
  if (!ok) return;
  // grant reward and boost
  state.tasks.ogads = true;
  state.balance += 5.0;
  state.minedToday += 5.0;
  const until = Date.now() + 30*60*1000; // 30 minutes
  state.boosts.push({until, pct: 20});
  save();
  updateUI();
  alert('Thank you — you received 5 NRX and a 20% mining boost for 30 minutes.');
};

document.getElementById('verifyTG').onclick = function(){
  if (state.tasks.telegram){ alert('Already confirmed.'); return; }
  const ok = confirm('Did you join the Telegram? Click OK to confirm.');
  if (!ok) return;
  state.tasks.telegram = true;
  state.balance += 2.0;
  state.minedToday += 2.0;
  const until = Date.now() + 20*60*1000; // 20 minutes
  state.boosts.push({until, pct: 15});
  save();
  updateUI();
  alert('Thanks! You received 2 NRX and a 15% boost for 20 minutes.');
};

// ================ BUTTON HOOKS =================
document.getElementById('startMine').onclick = function(){
  // If label is "Mine Now" -> start session, then change label to "Boost Mine" while active
  if (!miningActive){
    startMiningSession();
    this.textContent = 'Boost Mine';
    // allow boost button to open OGAds
    document.getElementById('boostBtn').disabled = false;
  } else {
    // if clicked while active, treat as boost open
    applyBoostTemporary();
  }
};

document.getElementById('boostBtn').onclick = function(){
  applyBoostTemporary();
};

document.getElementById('stopMine').onclick = function(){
  stopMiningSession();
};

// Withdraw flow
document.getElementById('withdrawNow').onclick = function(){
  const wallet = document.getElementById('walletAddr').value.trim();
  if (!wallet || !wallet.startsWith('0x') || wallet.length < 10){
    alert('Enter a valid BSC wallet address (0x...)');
    return;
  }
  if (!state.tasks.ogads){
    if (!confirm('Withdrawals require at least one OGAds completion. Open OGAds now?')) return;
    window.open(CONFIG.OGADS_LINK,'_blank');
    return;
  }
  if (state.balance < CONFIG.WITHDRAW_MIN){
    alert(`You need at least ${CONFIG.WITHDRAW_MIN} NRX to withdraw. Your balance: ${state.balance.toFixed(3)} NRX`);
    return;
  }

  // simulate withdraw (in production replace with server-side on-chain transfer)
  const amt = parseFloat(prompt(`Enter amount to withdraw (available ${state.balance.toFixed(3)} NRX):`));
  if (!amt || isNaN(amt) || amt <=0) return;
  if (amt > state.balance) { alert('Insufficient balance.'); return; }

  // project fee simulation (0.7%)
  const fee = amt * 0.007;
  const toUser = amt - fee;
  state.balance -= amt;
  save();
  updateUI();
  el('withdrawLog').textContent = `Simulated: Sent ${toUser.toFixed(3)} NRX to ${wallet}. Project fee ${fee.toFixed(3)} NRX retained.`;
  alert(`Withdrawal simulated: ${toUser.toFixed(3)} NRX sent (fee ${fee.toFixed(3)} NRX).`);
};

// ================= INIT =================
function init(){
  // show launch date text
  const d = new Date(CONFIG.LAUNCH_TS);
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  el('launchDateDisplay').textContent = d.toLocaleDateString(undefined, opts);

  // menu (mobile)
  document.getElementById('menuBtn').onclick = function(){
    const nav = document.getElementById('nav');
    nav.style.display = (nav.style.display === 'flex') ? 'none' : 'flex';
  };

  // start countdown
  startCountdown();

  // restore UI
  updateUI();

  // ensure fans off initially
  enableFans(false);
}

init();
