// ── SHARED CONFIG ──
const CFG = {
  API: 'https://bot-production-168c.up.railway.app',
  GUILD: '1411327756968661125',
  CLIENT: '1485034551108702268',

  // ✅ FIXED: Clean URL — Discord Developer Portal mein bhi yahi daalni hai
  REDIR: 'https://www.elevateiq.shop/',

  // ✅ Azure Client ID — portal.azure.com se copy karo (App Registrations → Overview)
  AZURE_CLIENT: '45cafe0a-6832-4192-a100-bf47cde26f28'
};

const PRICES = {
  mc:'Rs.899', rb50:'Rs.1,499', rb100:'Rs.2,499',
  xbox:'Rs.1,999', nitrobasic:'Rs.1,199', nitroboost:'Rs.5,999'
};

// ── STORAGE ──
function getUser()  { try { return JSON.parse(localStorage.getItem('eiq_user')); } catch { return null; } }
function setUser(u) { localStorage.setItem('eiq_user', JSON.stringify(u)); }
function getCoins() { return parseInt(localStorage.getItem('eiq_coins') || '0'); }
function setCoins(n){ localStorage.setItem('eiq_coins', String(Math.max(0, n))); updateNavUI(); }
function addCoins(n, label){ setCoins(getCoins() + n); toast('🪙', `+${n.toLocaleString()} IQCoins${label ? ' — ' + label : ''}`); }
function spendCoins(n){
  const c = getCoins();
  if (c < n){ toast('✕', `Need ${(n-c).toLocaleString()} more IQCoins`); return false; }
  setCoins(c - n); return true;
}
function avURL(u){
  if (!u) return '';
  if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
  return '';
}
function getOrds(){ try { return JSON.parse(localStorage.getItem('eiq_ords')) || []; } catch { return []; } }
function saveOrd(o){ const a = getOrds(); a.unshift(o); localStorage.setItem('eiq_ords', JSON.stringify(a)); }

// ── SERVER SYNC ──
function syncCoins(uid){
  fetch(`${CFG.API}/api/user/${uid}`)
    .then(r => r.json())
    .then(d => { if (d.success && d.coins != null) setCoins(d.coins); })
    .catch(() => {});
}

// ── AUTH ──
function logout(){
  localStorage.removeItem('eiq_user');
  localStorage.removeItem('eiq_coins');
  localStorage.removeItem('eiq_token');
  window.location.href = '/';
}

function dcLogin(){
  const url = `https://discord.com/api/oauth2/authorize`
    + `?client_id=${CFG.CLIENT}`
    + `&redirect_uri=${encodeURIComponent(CFG.REDIR)}`
    + `&response_type=code`
    + `&scope=identify`;
  window.location.href = url;
}

// OAuth callback — fires only when ?code= is in URL
function handleOAuthCallback(){
  const p    = new URLSearchParams(window.location.search);
  const code = p.get('code');
  if (!code) return;
  history.replaceState({}, '', '/'); // clean URL immediately
  fetch(`${CFG.API}/api/discord/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(CFG.REDIR)}`)
    .then(r => r.json())
    .then(d => {
      if (d.user){
        setUser(d.user);
        if (d.token) localStorage.setItem('eiq_token', d.token);
        syncCoins(d.user.id);
        renderNavAuth();
        toast('👋', `Welcome, ${d.user.global_name || d.user.username}!`);
      } else {
        toast('✕', d.error || 'Login failed — try again');
      }
    })
    .catch(() => toast('✕', 'Login failed. Please try again.'));
}

// ── NAV RENDER ──
function renderNavAuth(){
  const el = document.getElementById('nav-auth');
  if (!el) return;
  const u = getUser();
  if (u){
    const av = avURL(u);
    el.innerHTML = `<div class="nav-user">
      ${av ? `<img class="nav-avatar" src="${av}" onerror="this.style.display='none'"/>` : ''}
      <span class="nav-name">${u.global_name || u.username}</span>
      <button class="btn-signout" onclick="logout()">Sign out</button>
    </div>`;
    const pill = document.getElementById('cpill');
    if (pill) pill.style.display = 'flex';
  } else {
    el.innerHTML = `<button class="btn-discord" onclick="dcLogin()">Login with Discord</button>`;
    const pill = document.getElementById('cpill');
    if (pill) pill.style.display = 'none';
  }
}

function updateNavUI(){
  const nc   = document.getElementById('nav-coins');
  if (nc) nc.textContent = getCoins().toLocaleString();
  const pill = document.getElementById('cpill');
  if (pill) pill.style.display = getUser() ? 'flex' : 'none';
}

// ── TOAST ──
function toast(ico, msg){
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = `<span>${ico}</span><span>${msg}</span>`;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── HAMBURGER ──
function initHamburger(){
  const btn = document.getElementById('hbgBtn');
  const mob = document.getElementById('mobNav');
  if (!btn || !mob) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    mob.classList.toggle('open');
  });
}

// ── FAQ TOGGLE ──
function toggleFaq(el){
  const a   = el.querySelector('.faq-a');
  const arr = el.querySelector('.faq-arr');
  a.classList.toggle('open');
  arr.classList.toggle('open');
}

// ── INVOICE BUILDER ──
function buildInv(d){
  const u      = getUser();
  const name   = u ? (u.global_name || u.username) : (d.account || 'Customer');
  const isCode = d.redeemType === 'code';
  return `<div class="inv-card">
    <div class="inv-head">
      <div style="display:flex;align-items:center;gap:9px">
        <div class="inv-logo">IQ</div>
        <div><div class="inv-ttl">Rewards Portal</div><div class="inv-sub">Official Receipt</div></div>
      </div>
      <div><div class="inv-nov">${d.invoiceNo}</div><div class="inv-nod">${d.date}</div></div>
    </div>
    <div class="inv-bar"><div class="inv-dot"></div><span class="inv-bt">PAYMENT CONFIRMED — REWARD PROCESSING</span></div>
    <div class="inv-rows">
      <div class="inv-row"><span class="inv-k">Customer</span><span class="inv-v">${name}</span></div>
      <div class="inv-row"><span class="inv-k">Reward</span><span class="inv-v">${d.game}</span></div>
      ${d.plan   ? `<div class="inv-row"><span class="inv-k">Plan</span><span class="inv-v">${d.plan}</span></div>`   : ''}
      ${isCode   ? `<div class="inv-row"><span class="inv-k">Code</span><span class="inv-v code">${d.code}</span></div>` : ''}
      ${!isCode  ? `<div class="inv-row"><span class="inv-k">Coins Spent</span><span class="inv-v" style="color:#b45309">🪙 ${(d.coinsSpent||0).toLocaleString()}</span></div>` : ''}
      <div class="inv-row"><span class="inv-k">Price</span><span class="inv-v price">${d.inrPrice || '—'}</span></div>
      <div class="inv-row"><span class="inv-k">Activation</span><span class="inv-v" style="color:#b45309">Within 72 hours</span></div>
      <div class="inv-row"><span class="inv-k">Invoice No.</span><span class="inv-v" style="font-size:11px">${d.invoiceNo}</span></div>
    </div>
    <div class="inv-ft">
      <div class="inv-ft-t">support@rewardsportal.net</div>
      <div class="inv-ft-t">© 2026 Rewards Portal</div>
    </div>
  </div>`;
}

// ── PDF ──
function dlPDF(data){
  if (typeof data === 'string'){
    if (data === 'rd'   && window.RD) data = window.RD.inv;
    else if (data === 'coin' && window.CI) data = window.CI.inv;
  }
  if (!data || !data.invoiceNo){ toast('!', 'Invoice not found'); return; }
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF){ toast('!', 'PDF library not loaded'); return; }
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const W = 210, M = 22; let y = M;
  const u     = getUser();
  const uname = u ? (u.global_name || u.username) : (data.account || 'Customer');
  const isCode = data.redeemType === 'code';
  doc.setFillColor(124,92,252); doc.rect(0,0,W,58,'F');
  doc.setFillColor(255,255,255); doc.roundedRect(M,y,32,13,3,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(124,92,252);
  doc.text('IQ', M+16, y+8, {align:'center'});
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.text('Rewards Portal', M+40, y+8);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(220,210,255);
  doc.text('Official Receipt', M+40, y+14);
  y=65; doc.setFillColor(240,253,244); doc.rect(0,y,W,10,'F');
  doc.setFillColor(16,185,129); doc.circle(M+4, y+5, 2.5,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(5,150,105);
  doc.text('PAYMENT CONFIRMED — REWARD PROCESSING', M+10, y+6);
  y+=18; doc.setFontSize(14); doc.setTextColor(26,21,53); doc.text(uname, M, y+5);
  if (u?.id){ doc.setFontSize(9); doc.setTextColor(155,147,196); doc.setFont('helvetica','normal'); doc.text('Discord ID: '+u.id, M, y+13); }
  y+=28; doc.setDrawColor(237,233,255); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); y+=12;
  const rows = [['Reward', data.game, '']];
  if(data.plan) rows.push(['Plan', data.plan, '']);
  if(isCode)    rows.push(['Code', data.code||'', '']);
  else          rows.push(['Coins Spent', (data.coinsSpent||0).toLocaleString(), '']);
  rows.push(['Price','',data.inrPrice||'—'], ['Invoice',data.invoiceNo,''], ['Activation','Within 72 hours','']);
  rows.forEach((r,i) => {
    if(i%2===0){ doc.setFillColor(248,247,255); doc.rect(M,y,W-M*2,7,'F'); }
    doc.setTextColor(155,147,196); doc.text(r[0], M+3, y+5);
    doc.setTextColor(26,21,53);    doc.text(r[1], M+55, y+5);
    if(r[2]) doc.text(r[2], W-M-3, y+5, {align:'right'});
    y+=7;
  });
  y+=10; doc.setDrawColor(237,233,255); doc.line(M,y,W-M,y); y+=10;
  doc.setFontSize(8); doc.setTextColor(155,147,196);
  doc.text('support@rewardsportal.net', M, y);
  doc.text('© 2026 Rewards Portal. All rights reserved.', W-M, y, {align:'right'});
  doc.save(`invoice-${data.invoiceNo}.pdf`);
}

// ── DARK MODE ──
function initTheme() {
  const saved = localStorage.getItem('eiq_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('eiq_theme', next);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderNavAuth();
  updateNavUI();
  initHamburger();
  handleOAuthCallback();
  enforceLogin();
});

// ✅ LOGIN GATE — koi bhi page bina login nahi dekh sakta
function enforceLogin() {
  // Index page pe login gate nahi (wahan login button hai)
  const isIndex = window.location.pathname.endsWith('index.html') || 
                  window.location.pathname.endsWith('/') ||
                  window.location.pathname === '';
  if (isIndex) return;

  // Agar user logged in nahi hai
  if (!getUser()) {
    // Overlay show karo
    const overlay = document.createElement('div');
    overlay.id = 'login-gate';
    overlay.innerHTML = `
      <div style="
        position:fixed;inset:0;z-index:99999;
        background:rgba(248,247,255,0.97);
        backdrop-filter:blur(20px);
        display:flex;align-items:center;justify-content:center;
        font-family:'DM Sans',sans-serif;
      ">
        <div style="
          background:#fff;border:1px solid rgba(124,92,252,0.2);
          border-radius:28px;padding:52px 44px;text-align:center;
          max-width:420px;width:90%;
          box-shadow:0 20px 60px rgba(124,92,252,0.15);
        ">
          <div style="font-size:52px;margin-bottom:20px">🔐</div>
          <div style="font-family:'Fraunces',serif;font-size:26px;font-weight:600;color:#1a1535;margin-bottom:12px">
            Login Required
          </div>
          <div style="font-size:15px;color:#5b5480;margin-bottom:32px;line-height:1.7">
            Yeh page dekhne ke liye pehle Discord se login karo. 
            IQCoins earn karne ke liye account zaroori hai.
          </div>
          <button onclick="dcLogin()" style="
            background:linear-gradient(135deg,#7c5cfc,#5b35e8);
            color:#fff;border:none;border-radius:100px;
            padding:16px 36px;font-size:15px;font-weight:600;
            cursor:pointer;width:100%;font-family:'DM Sans',sans-serif;
            box-shadow:0 4px 18px rgba(124,92,252,0.38);
            transition:all 0.2s;
          " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            Login with Discord
          </button>
          <div style="font-size:12px;color:#9b93c4;margin-top:16px">
            Free • Secure • Takes 10 seconds
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Page content blur karo
    document.querySelector('.wrap, .wrap-md, .wrap-sm, .page-body')?.setAttribute('style', 
      'filter:blur(8px);pointer-events:none;user-select:none'
    );
  }
}
