
/* =====================================================================
   Nick's ai — State & Persistence Engine
===================================================================== */
const state = {
  theme: localStorage.getItem('pulsepm_theme') || 'light',
  authMode:'login',
  registeredUsers: JSON.parse(localStorage.getItem('pulsepm_users') || '{}'),
  user: JSON.parse(localStorage.getItem('pulsepm_active_user') || 'null'),
  role: localStorage.getItem('pulsepm_role') || null,
  tools: JSON.parse(localStorage.getItem('pulsepm_tools') || '[]'),
  goals: JSON.parse(localStorage.getItem('pulsepm_goals') || '[]'),
  profile: JSON.parse(localStorage.getItem('pulsepm_profile') || '{"fullName":"","email":"","org":"","experience":"Experienced","bio":""}'),
  tasks: JSON.parse(localStorage.getItem('pulsepm_tasks') || '[]'),
  analysis: null,
  chatMessages: [],
  activeDashTab: 'overview',
  sortCol: 'name',
  sortAsc: true
};

function saveState(){
  localStorage.setItem('nicks_ai_theme', state.theme);
  localStorage.setItem('nicks_ai_users', JSON.stringify(state.registeredUsers));
  localStorage.setItem('nicks_ai_active_user', JSON.stringify(state.user));
  localStorage.setItem('nicks_ai_role', state.role || '');
  localStorage.setItem('nicks_ai_tools', JSON.stringify(state.tools));
  localStorage.setItem('nicks_ai_goals', JSON.stringify(state.goals));
  localStorage.setItem('nicks_ai_profile', JSON.stringify(state.profile));
  localStorage.setItem('nicks_ai_tasks', JSON.stringify(state.tasks));
}


function setThemePalette(name){
  if(name === 'aurora') {
    document.documentElement.removeAttribute('data-theme');
    state.theme = 'light';
  } else {
    document.documentElement.setAttribute('data-theme', name);
    state.theme = name;
  }
  localStorage.setItem('nicks_ai_theme', name);
  const themeNames = {
    sapphire: '🌌 Midnight Sapphire (Linear Dark)',
    emerald: '🌲 Enterprise Emerald (Stripe Slate)',
    aurora: '🔮 Nordic Glass (Purple Aurora)',
    frost: '☀️ Frost Minimal (Apple Light)'
  };
  showToast('🎨 Switched to ' + (themeNames[name] || name) + ' Theme');
  try { renderCharts(); } catch(e) {}
}

function toggleTheme(){
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  saveState();
  showToast('Switched to ' + state.theme + ' theme');
}

const ROLES = [
  {id:'pm', label:'Project Manager', icon:'◈', blurb:'Coordinating a team, timelines, and stakeholders.'},
  {id:'startup', label:'Solo Startup Founder', icon:'✦', blurb:'Running a lean project with limited hands.'},
  {id:'student', label:'Student', icon:'🎓', blurb:'Managing coursework, group work, or a capstone.'},
  {id:'it', label:'IT Professional', icon:'⌁', blurb:'Shipping technical projects and sprints.'},
  {id:'freelancer', label:'Freelancer', icon:'◐', blurb:'Juggling multiple client projects at once.'},
  {id:'lead', label:'Team / Dept. Lead', icon:'▣', blurb:'Overseeing several projects and people.'}
];

const TOOLS = ['Jira','Trello','Asana','Monday.com','ClickUp','Notion','Microsoft Project','Excel / Google Sheets','Slack','Basecamp','Airtable','Wrike','None of these — plain docs'];
const GOALS = ['Learn PM fundamentals','Save time on admin & reporting','Consolidate tools','Catch risks earlier','Improve team collaboration','Automate status reports','Track budget accurately'];

function goToScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
  if(id === 'screen-role') renderRoleGrid();
  if(id === 'screen-tools') renderToolsGrid();
  if(id === 'screen-goals') renderGoalsGrid();
}

function showToast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 6000);
}

function initials(name){
  if(!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0]||'') + (parts[1]?.[0]||'')).toUpperCase() || name[0].toUpperCase();
}

/* =====================================================================
   AUTH & ONBOARDING
===================================================================== */
function setAuthMode(mode){
  state.authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode==='login');
  document.getElementById('tab-signup').classList.toggle('active', mode==='signup');
  document.getElementById('login-panel').style.display = mode==='login' ? 'block':'none';
  document.getElementById('signup-panel').style.display = mode==='signup' ? 'block':'none';
}

function handleSignup(){
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;
  const consentTerms = document.getElementById('signup-consent-terms');
  const consentDpdp = document.getElementById('signup-consent-dpdp');

  if(!name || !email || password.length < 6){ 
    showToast('⚠️ Fill in all required fields (password >= 6 chars)'); 
    return; 
  }

  // Mandatory unbundled consent verification (India DPDP Act 2023 & GDPR)
  if(consentTerms && !consentTerms.checked){
    showToast('⚠️ Please agree to the Terms of Service and Refund Policy.');
    consentTerms.focus();
    return;
  }

  if(consentDpdp && !consentDpdp.checked){
    showToast('⚠️ Explicit consent under India DPDP Act 2023 is required to create an account.');
    consentDpdp.focus();
    return;
  }

  state.registeredUsers[email] = {
    name, 
    email, 
    password,
    consentTerms: true,
    consentDpdp: true,
    consentTimestamp: new Date().toISOString()
  };
  state.user = {name, email};
  state.profile.fullName = name;
  state.profile.email = email;
  saveState();
  showToast('🎉 Account created with verified DPDP Act consent!');
  goToScreen('screen-role');
  renderRoleGrid();
}

function handleLogin(){
  let email = document.getElementById('login-email').value.trim().toLowerCase();
  let password = document.getElementById('login-password').value;
  if(!email) email = 'you@company.com';
  if(!password) password = 'password123';

  const acct = state.registeredUsers[email] || {name: (email.split('@')[0] || 'User'), email, password};
  state.user = {name: acct.name, email: acct.email};
  state.profile.fullName = acct.name;
  state.profile.email = acct.email;
  saveState();
  showToast('👋 Welcome back, ' + (acct.name ? acct.name.split(' ')[0] : 'User'));

  if(state.role) enterDashboard();
  else { goToScreen('screen-role'); renderRoleGrid(); }
}

function handleLogout(){
  state.user = null;
  saveState();
  goToScreen('screen-auth');
}

function renderRoleGrid(){
  const grid = document.getElementById('role-grid');
  grid.innerHTML = ROLES.map(r => `
    <button class="option-card ${state.role===r.id?'selected':''}" onclick="selectRole('${r.id}')">
      <span class="check">✓</span>
      <div class="icon-badge">${r.icon}</div>
      <h4>${r.label}</h4>
      <p>${r.blurb}</p>
    </button>`).join('');
  document.getElementById('role-continue').disabled = !state.role;
}
function selectRole(id){ state.role = id; saveState(); renderRoleGrid(); }

function renderToolsGrid(){
  const grid = document.getElementById('tools-grid');
  if(!grid) return;
  grid.innerHTML = TOOLS.map(t => `
    <button class="chip ${state.tools.includes(t)?'selected':''}" onclick="toggleTool('${t}')">${state.tools.includes(t)?'✓ ':''}${t}</button>
  `).join('');
  const countEl = document.getElementById('tools-count');
  if(countEl) countEl.textContent = `${state.tools.length} tool${state.tools.length===1?'':'s'} selected`;
}
function toggleTool(t){
  const i = state.tools.indexOf(t);
  if(i>-1) state.tools.splice(i,1); else state.tools.push(t);
  saveState(); renderToolsGrid();
}

function renderGoalsGrid(){
  const grid = document.getElementById('goals-grid');
  if(!grid) return;
  grid.innerHTML = GOALS.map(g => `
    <button class="chip ${state.goals.includes(g)?'selected':''}" onclick="toggleGoal('${g}')">${state.goals.includes(g)?'✓ ':''}${g}</button>
  `).join('');
  const countEl = document.getElementById('goals-count');
  if(countEl) countEl.textContent = `${state.goals.length} goal${state.goals.length===1?'':'s'} selected`;
}
function toggleGoal(g){
  const i = state.goals.indexOf(g);
  if(i>-1) state.goals.splice(i,1); else state.goals.push(g);
  saveState(); renderGoalsGrid();
}

function finishOnboarding(){
  const name = document.getElementById('prof-fullname').value.trim();
  if(!name){ showToast('Enter your name'); return; }
  state.profile.fullName = name;
  state.profile.email = document.getElementById('prof-email').value.trim();
  state.profile.org = document.getElementById('prof-org').value.trim();
  state.profile.experience = document.getElementById('prof-exp').value;
  state.profile.bio = document.getElementById('prof-bio').value.trim();
  saveState();
  enterDashboard();
}

function enterDashboard(){
  goToScreen('screen-dashboard');
  renderSidebarUser();
  if(state.tasks && state.tasks.length){
    state.tasks.forEach(t=>{
      if(t.start && typeof t.start==='string') t.start = new Date(t.start);
      if(t.due && typeof t.due==='string') t.due = new Date(t.due);
    });
    afterDataLoaded();
  } else {
    renderOverview();
  }
  switchDashTab(state.activeDashTab || 'overview');
  seedChat();
}

function renderSidebarUser(){
  const name = state.profile.fullName || (state.user && state.user.name) || 'User';
  document.getElementById('side-avatar').textContent = initials(name);
  document.getElementById('side-name').textContent = name;
  const r = ROLES.find(x=>x.id===state.role);
  document.getElementById('side-role').textContent = r ? r.label : "Nick's ai Lead";
}

function switchDashTab(tab){
  state.activeDashTab = tab;
  document.querySelectorAll('.nav-item[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.dash-tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if(tab==='overview') renderOverview();
  if(tab==='kanban') renderKanbanBoard();
  if(tab==='gantt') renderGanttView();
  if(tab==='risk') renderRiskTab();
  if(tab==='simulator') runSimulation();
  if(tab==='profile') renderProfileTab();
  if(tab==='assistant') seedChat();
}

/* =====================================================================
   DATA & FILE UPLOAD ENGINE (RESILIENT & PARSE SAFE)
===================================================================== */
function normalizeStatus(raw){
  if(!raw) return 'not started';
  const s = String(raw).toLowerCase();
  if(s.includes('block') || s.includes('stuck')) return 'blocked';
  if(s.includes('complet') || s.includes('done')) return 'completed';
  if(s.includes('progress') || s.includes('doing') || s.includes('active')) return 'in progress';
  return 'not started';
}

function normalizePriority(raw){
  if(!raw) return 'medium';
  const s = String(raw).toLowerCase();
  if(s.includes('high') || s.includes('urgent') || s.includes('critical')) return 'high';
  if(s.includes('low')) return 'low';
  return 'medium';
}

function findKey(row, candidates){
  const keys = Object.keys(row);
  for(const cand of candidates){
    const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g,'') === cand.toLowerCase().replace(/[^a-z0-9]/g,''));
    if(found) return row[found];
  }
  return null;
}

function fallbackParseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });
    data.push(obj);
  }
  return data;
}

function parseCSVData(file, onComplete) {
  if (typeof Papa !== 'undefined') {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        onComplete(results.data || []);
      },
      error: function(err) {
        console.warn('PapaParse fallback triggered:', err);
        const reader = new FileReader();
        reader.onload = function(e) {
          onComplete(fallbackParseCSV(e.target.result));
        };
        reader.readAsText(file);
      }
    });
  } else {
    const reader = new FileReader();
    reader.onload = function(e) {
      onComplete(fallbackParseCSV(e.target.result));
    };
    reader.readAsText(file);
  }
}

function processSelectedFile(file){
  if(!file) return;
  const uploadStatus = document.getElementById('upload-status');
  if(uploadStatus) uploadStatus.textContent = 'Parsing ' + file.name + '...';

  parseCSVData(file, function(rows) {
    if(!rows || !rows.length){
      if(uploadStatus) uploadStatus.textContent = 'No valid data rows found in CSV file.';
      showToast('❌ No valid task rows found in CSV');
      return;
    }

    state.tasks = rows.map((r, idx) => {
      const nameVal = findKey(r, ['Task Name','Task','name','title','activity']) || ('Task ' + (idx+1));
      const statusVal = findKey(r, ['Status','state']) || 'not started';
      const startVal = findKey(r, ['Start Date','Start','begin date']);
      const dueVal = findKey(r, ['Due Date','Due','end date','deadline']);
      const pctVal = findKey(r, ['% Complete','Percent Complete','Progress','pct','% done']);
      const priorityVal = findKey(r, ['Priority','severity']);
      const assigneeVal = findKey(r, ['Assignee','Owner','assigned to']);
      const estVal = findKey(r, ['Estimated Cost','Est Cost','planned cost','budget']);
      const actVal = findKey(r, ['Actual Cost','Actual','spent','cost']);

      return {
        id: idx+1,
        name: String(nameVal),
        status: normalizeStatus(statusVal),
        start: startVal ? new Date(startVal) : new Date(),
        due: dueVal ? new Date(dueVal) : new Date(Date.now()+86400000*14),
        pct: Math.min(100, Math.max(0, parseFloat(pctVal||0))),
        priority: normalizePriority(priorityVal),
        assignee: assigneeVal ? String(assigneeVal) : 'Unassigned',
        estCost: parseFloat(estVal||1000),
        actCost: parseFloat(actVal||500)
      };
    });

    saveState();
    showToast('🎉 Successfully imported ' + state.tasks.length + ' tasks!');
    if(uploadStatus) uploadStatus.textContent = '✓ Loaded ' + state.tasks.length + ' tasks from ' + file.name;
    afterDataLoaded();
  });
}

function handleFileInputChange(evt){
  if(evt.target && evt.target.files && evt.target.files.length > 0) {
    processSelectedFile(evt.target.files[0]);
  }
}

function setupDragAndDropUpload(){
  const zone = document.getElementById('upload-zone');
  if(!zone) return;

  zone.addEventListener('click', function(e){
    if(e.target.id !== 'file-input') {
      document.getElementById('file-input').click();
    }
  });

  ['dragenter', 'dragover'].forEach(ev => {
    zone.addEventListener(ev, function(e){
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(ev => {
    zone.addEventListener(ev, function(e){
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('dragover');
    });
  });

  zone.addEventListener('drop', function(e){
    const files = e.dataTransfer.files;
    if(files && files.length > 0){
      processSelectedFile(files[0]);
    }
  });
}

function loadSampleData(){
  const today = new Date();
  const days = n => new Date(today.getTime() + n*86400000);
  state.tasks = [
    {id:1, name:'Discovery & Requirements Gathering', status:'completed', start:days(-30), due:days(-20), pct:100, priority:'high', assignee:'Aditi Rao', estCost:2200, actCost:2350},
    {id:2, name:'System Architecture & Schema Design', status:'completed', start:days(-25), due:days(-15), pct:100, priority:'high', assignee:'Sam Okafor', estCost:3000, actCost:2900},
    {id:3, name:'UI Design System Scaffolding', status:'in progress', start:days(-15), due:days(-2), pct:85, priority:'medium', assignee:'Marcus Lin', estCost:1800, actCost:1600},
    {id:4, name:'Auth & RBAC Security Layer', status:'blocked', start:days(-10), due:days(-1), pct:40, priority:'high', assignee:'Sam Okafor', estCost:2500, actCost:1900},
    {id:5, name:'Frontend Dashboard & Visuals', status:'in progress', start:days(-8), due:days(4), pct:65, priority:'high', assignee:'Priya Nair', estCost:3200, actCost:2100},
    {id:6, name:'EVM & Analytics Calculation Engine', status:'in progress', start:days(-5), due:days(5), pct:50, priority:'high', assignee:'Sam Okafor', estCost:2800, actCost:1400},
    {id:7, name:'Automated E2E QA Test Suite', status:'blocked', start:days(-2), due:days(6), pct:25, priority:'medium', assignee:'Wei Zhang', estCost:1500, actCost:600},
    {id:8, name:'Security Vulnerability Audit', status:'not started', start:days(10), due:days(20), pct:0, priority:'high', assignee:'External Auditor', estCost:4500, actCost:0}
  ];
  saveState();
  showToast('⚡ Sample project dataset loaded!');
  const uploadStatus = document.getElementById('upload-status');
  if(uploadStatus) uploadStatus.textContent = '✓ Loaded 8 sample tasks into active workspace';
  afterDataLoaded();
}

function loadCollegeData(){
  fetch('college_of_engineering_dataset.csv')
    .then(res => res.text())
    .then(csvText => {
      const rows = (typeof Papa !== 'undefined') 
        ? Papa.parse(csvText, { header: true, skipEmptyLines: true }).data 
        : fallbackParseCSV(csvText);
      if(!rows || !rows.length) return;
      state.tasks = rows.map((r, idx) => {
        const nameVal = findKey(r, ['Task Name','Task','name','title','activity']) || ('Task ' + (idx+1));
        const statusVal = findKey(r, ['Status','state']) || 'not started';
        const startVal = findKey(r, ['Start Date','Start','begin date']);
        const dueVal = findKey(r, ['Due Date','Due','end date','deadline']);
        const pctVal = findKey(r, ['% Complete','Percent Complete','Progress','pct','% done']);
        const priorityVal = findKey(r, ['Priority','severity']);
        const assigneeVal = findKey(r, ['Assignee','Owner','assigned to']);
        const estVal = findKey(r, ['Estimated Cost','Est Cost','planned cost','budget']);
        const actVal = findKey(r, ['Actual Cost','Actual','spent','cost']);

        return {
          id: idx+1,
          name: String(nameVal),
          status: normalizeStatus(statusVal),
          start: startVal ? new Date(startVal) : new Date(),
          due: dueVal ? new Date(dueVal) : new Date(Date.now()+86400000*14),
          pct: Math.min(100, Math.max(0, parseFloat(pctVal||0))),
          priority: normalizePriority(priorityVal),
          assignee: assigneeVal ? String(assigneeVal) : 'Unassigned',
          estCost: parseFloat(estVal||1000),
          actCost: parseFloat(actVal||500)
        };
      });
      saveState();
      showToast('🎓 Loaded College of Engineering Dataset (' + state.tasks.length + ' tasks)!');
      const uploadStatus = document.getElementById('upload-status');
      if(uploadStatus) uploadStatus.textContent = '✓ Loaded ' + state.tasks.length + ' College of Engineering tasks';
      afterDataLoaded();
    })
    .catch(err => {
      console.warn('Error loading college data:', err);
      showToast('❌ Error loading College of Engineering dataset');
    });
}

function afterDataLoaded(){
  document.getElementById('data-table-panel').style.display = 'block';
  state.analysis = analyzeProject(state.tasks);
  renderDataTable();
  renderKanbanBoard();
  renderGanttView();
  renderRiskTab();
  try { renderOverview(); renderTeamWorkload(); renderAuditStream(); render5x5RiskMatrix(); try{ renderCalendarTab(); }catch(e){} } catch(e) { console.warn('renderOverview safe error:', e); }
}

function analyzeProject(tasks){
  if(!tasks || !tasks.length) return null;
  const total = tasks.length;
  const completed = tasks.filter(t=>t.status==='completed').length;
  const inProgress = tasks.filter(t=>t.status==='in progress').length;
  const blocked = tasks.filter(t=>t.status==='blocked').length;
  const notStarted = tasks.filter(t=>t.status==='not started').length;

  const today = new Date();
  const overdueCount = tasks.filter(t=>t.status!=='completed' && t.due && new Date(t.due) < today).length;
  const avgProgress = tasks.reduce((s,t)=>s+t.pct,0)/total;

  const totalEst = tasks.reduce((s,t)=>s+(t.estCost||0),0);
  const totalAct = tasks.reduce((s,t)=>s+(t.actCost||0),0);

  const EV = tasks.reduce((s,t)=>s+((t.estCost||0)*(t.pct/100)), 0);
  const PV = totalEst * (avgProgress/100);
  const AC = totalAct;

  const CV = EV - AC;
  const SV = EV - PV;

  const CPI = AC > 0 ? (EV / AC) : 1.0;
  const SPI = PV > 0 ? (EV / PV) : 1.0;
  const EAC = CPI > 0 ? (totalEst / CPI) : totalEst;

  const healthScore = Math.round(Math.max(0, Math.min(100, (CPI*35 + SPI*35 + (1 - overdueCount/total)*30)*100/100)));
  const riskLevel = healthScore >= 75 ? 'Low' : healthScore >= 50 ? 'Medium' : 'High';

  return {
    total, completed, inProgress, blocked, notStarted, overdueCount,
    avgProgress, totalEst, totalAct, EV, PV, AC, CV, SV, CPI, SPI, EAC,
    healthScore, riskLevel
  };
}

/* =====================================================================
   RENDER DASHBOARD VIEWS
===================================================================== */
function renderOverview(){
  const a = state.analysis;
  if(!a){ return; }
  document.getElementById('overview-greeting').textContent = 'Welcome back, ' + (state.profile.fullName.split(' ')[0] || 'User');
  document.getElementById('stat-total').textContent = a.total;
  document.getElementById('stat-total-sub').textContent = a.completed + ' Done · ' + a.inProgress + ' Active';
  document.getElementById('stat-progress').textContent = Math.round(a.avgProgress) + '%';
  document.getElementById('stat-progress-sub').textContent = a.completed + ' of ' + a.total + ' tasks completed';
  document.getElementById('stat-progress-sub').className = 'stat-sub up';
  document.getElementById('stat-overdue').textContent = a.overdueCount;
  document.getElementById('stat-overdue-sub').textContent = a.overdueCount > 0 ? (a.overdueCount + ' require attention') : 'All tasks on schedule';
  document.getElementById('stat-overdue-sub').className = a.overdueCount > 0 ? 'stat-sub down' : 'stat-sub up';
  document.getElementById('stat-budget').textContent = '$' + Math.round(a.AC).toLocaleString();
  document.getElementById('stat-budget-sub').textContent = 'Est: $' + Math.round(a.totalEst).toLocaleString();

  const badge = document.getElementById('overview-risk-badge');
  if(badge){
    badge.className = 'badge badge-' + a.riskLevel.toLowerCase();
    badge.innerHTML = `<span class="badge-dot"></span>${a.riskLevel} Risk Profile`;
  }

  const color = a.riskLevel==='Low'?'#3DB88F':a.riskLevel==='Medium'?'#E8A94B':'#E27A72';
  
  const circum = 263.89; // 2 * PI * 42
  const dashoffset = circum - (a.healthScore / 100) * circum;

  document.getElementById('overview-health-body').innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <!-- Top Row: Animated Gauge + AI Assessment Summary -->
      <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
        <div style="position:relative; width:105px; height:105px; flex-shrink:0;">
          <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-soft)" stroke-width="10"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="10" 
                    stroke-dasharray="${circum}" stroke-dashoffset="${dashoffset}" stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease;"/>
          </svg>
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <span style="font-family:var(--font-display); font-size:26px; font-weight:800; color:${color}; line-height:1;">${a.healthScore}</span>
            <span style="font-size:9.5px; font-weight:700; color:var(--ink-faint); text-transform:uppercase; margin-top:2px;">/ 100</span>
          </div>
        </div>

        <div style="flex:1; min-width:210px; background:var(--lav-50); border:1px solid var(--border-soft); border-radius:var(--radius-sm); padding:12px 16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
            <span style="font-weight:700; font-size:14px; color:${color};">${a.riskLevel} Risk Profile</span>
            <span style="font-size:11px; font-weight:700; background:var(--surface); color:var(--purple); padding:2px 8px; border-radius:999px; border:1px solid var(--border-soft);">AI Assessment</span>
          </div>
          <p style="font-size:12.5px; color:var(--ink-soft); line-height:1.45;">
            ${a.healthScore >= 75 
              ? `Project is performing smoothly with solid cost efficiency (CPI: ${a.CPI.toFixed(2)}). Focus on unblocking <strong>${a.blocked} blocked tasks</strong> to prevent delivery delays.`
              : a.healthScore >= 50 
              ? `Project requires attention. Schedule pace (SPI: ${a.SPI.toFixed(2)}) is lagging behind target timelines.`
              : `High risk detected! Budget overruns and ${a.overdueCount} overdue tasks require immediate manager intervention.`}
          </p>
        </div>
      </div>

      <!-- Bottom Row: 3 Health Drivers -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
        <div style="background:var(--surface-alt); border:1px solid var(--border-soft); border-radius:var(--radius-sm); padding:10px 12px;">
          <div style="font-size:11px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">Cost Efficiency</div>
          <div style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:${a.CPI>=1?'var(--mint)':'var(--coral)'}; margin:4px 0 2px;">
            ${(a.CPI*100).toFixed(0)}% <small style="font-size:10px; font-weight:600; color:var(--ink-soft);">(CPI ${a.CPI.toFixed(2)})</small>
          </div>
          <div style="height:4px; background:var(--border-soft); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${Math.min(100, a.CPI*100)}%; background:${a.CPI>=1?'var(--mint)':'var(--coral)'};"></div>
          </div>
        </div>

        <div style="background:var(--surface-alt); border:1px solid var(--border-soft); border-radius:var(--radius-sm); padding:10px 12px;">
          <div style="font-size:11px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">Schedule Pace</div>
          <div style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:${a.SPI>=1?'var(--mint)':'var(--amber)'}; margin:4px 0 2px;">
            ${(a.SPI*100).toFixed(0)}% <small style="font-size:10px; font-weight:600; color:var(--ink-soft);">(SPI ${a.SPI.toFixed(2)})</small>
          </div>
          <div style="height:4px; background:var(--border-soft); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${Math.min(100, a.SPI*100)}%; background:${a.SPI>=1?'var(--mint)':'var(--amber)'};"></div>
          </div>
        </div>

        <div style="background:var(--surface-alt); border:1px solid var(--border-soft); border-radius:var(--radius-sm); padding:10px 12px;">
          <div style="font-size:11px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">On-Time Velocity</div>
          <div style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:${a.overdueCount===0?'var(--mint)':'var(--coral)'}; margin:4px 0 2px;">
            ${Math.round(((a.total - a.overdueCount)/a.total)*100)}% <small style="font-size:10px; font-weight:600; color:var(--ink-soft);">(${a.total-a.overdueCount}/${a.total})</small>
          </div>
          <div style="height:4px; background:var(--border-soft); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${Math.round(((a.total - a.overdueCount)/a.total)*100)}%; background:${a.overdueCount===0?'var(--mint)':'var(--coral)'};"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderCharts();
}

function renderFallbackCharts(a){
  const wrapperStatus = document.getElementById('chart-status-container');
  const wrapperProg = document.getElementById('chart-progress-container');

  if(wrapperStatus){
    const total = a.total || 1;
    const pComp = Math.round((a.completed / total) * 100);
    const pProg = Math.round((a.inProgress / total) * 100);
    const pBlock = Math.round((a.blocked / total) * 100);
    const pTodo = Math.max(0, 100 - pComp - pProg - pBlock);

    const circ = 251.32;
    const dashComp = (pComp / 100) * circ;
    const dashProg = (pProg / 100) * circ;
    const dashBlock = (pBlock / 100) * circ;
    const dashTodo = (pTodo / 100) * circ;

    let offset = 0;
    const segComp = `${dashComp} ${circ - dashComp}`; offset -= dashComp;
    const segProg = `${dashProg} ${circ - dashProg}`; const offProg = offset; offset -= dashProg;
    const segBlock = `${dashBlock} ${circ - dashBlock}`; const offBlock = offset; offset -= dashBlock;
    const segTodo = `${dashTodo} ${circ - dashTodo}`; const offTodo = offset;

    wrapperStatus.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-around; height:100%; gap:16px; padding:6px 0;">
        <div style="position:relative; width:135px; height:135px; flex-shrink:0;">
          <svg viewBox="0 0 100 100" style="width:100%; height:100%; transform:rotate(-90deg);">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-soft)" stroke-width="14"/>
            ${pTodo > 0 ? `<circle cx="50" cy="50" r="40" fill="none" stroke="#CBB6EE" stroke-width="14" stroke-dasharray="${segTodo}" stroke-dashoffset="${offTodo}"/>` : ''}
            ${pBlock > 0 ? `<circle cx="50" cy="50" r="40" fill="none" stroke="#E27A72" stroke-width="14" stroke-dasharray="${segBlock}" stroke-dashoffset="${offBlock}"/>` : ''}
            ${pProg > 0 ? `<circle cx="50" cy="50" r="40" fill="none" stroke="#8A5FD1" stroke-width="14" stroke-dasharray="${segProg}" stroke-dashoffset="${offProg}"/>` : ''}
            ${pComp > 0 ? `<circle cx="50" cy="50" r="40" fill="none" stroke="#3DB88F" stroke-width="14" stroke-dasharray="${segComp}" stroke-dashoffset="0"/>` : ''}
          </svg>
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
            <span style="font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--ink);">${a.total}</span>
            <span style="font-size:10px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">Tasks</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; font-size:12.5px; font-weight:600; flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:#3DB88F;"></span> Completed</span><span style="font-weight:700; color:var(--ink);">${a.completed} (${pComp}%)</span></div>
          <div style="display:flex; align-items:center; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:#8A5FD1;"></span> In Progress</span><span style="font-weight:700; color:var(--ink);">${a.inProgress} (${pProg}%)</span></div>
          <div style="display:flex; align-items:center; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:#E27A72;"></span> Blocked</span><span style="font-weight:700; color:var(--ink);">${a.blocked} (${pBlock}%)</span></div>
          <div style="display:flex; align-items:center; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:#CBB6EE;"></span> To Do</span><span style="font-weight:700; color:var(--ink);">${a.notStarted} (${pTodo}%)</span></div>
        </div>
      </div>
    `;
  }

  if(wrapperProg){
    const list = state.tasks.slice(0, 6);
    wrapperProg.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:11px; height:100%; overflow-y:auto; padding-right:4px;">
        ${list.map(t => {
          const color = t.status === 'completed' ? '#3DB88F' : t.status === 'blocked' ? '#E27A72' : t.status === 'in progress' ? '#8A5FD1' : '#9A8AB8';
          return `
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; font-weight:600; margin-bottom:4px;">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65%; color:var(--ink);">${t.name}</span>
                <span style="font-family:var(--font-mono); font-size:12px; color:${color}; font-weight:700;">${t.pct}% · ${t.assignee}</span>
              </div>
              <div style="height:10px; background:var(--lav-50); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:${t.pct}%; background:${color}; border-radius:999px; transition:width 0.5s ease;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

function renderCharts(){
  const a = state.analysis;
  if(!a) return;

  const statusContainer = document.getElementById('chart-status-container');
  const progressContainer = document.getElementById('chart-progress-container');

  if(typeof Chart === 'undefined'){
    renderFallbackCharts(a);
    return;
  }

  try {
    if(statusContainer && !document.getElementById('chart-status')){
      statusContainer.innerHTML = '<canvas id="chart-status"></canvas>';
    }
    if(progressContainer && !document.getElementById('chart-progress')){
      progressContainer.innerHTML = '<canvas id="chart-progress"></canvas>';
    }

    const ctxStatus = document.getElementById('chart-status');
    if(ctxStatus) {
      if(window.statusChart && typeof window.statusChart.destroy === 'function') window.statusChart.destroy();
      window.statusChart = new Chart(ctxStatus, {
        type:'doughnut',
        data:{ labels:['Completed','In Progress','Blocked','To Do'], datasets:[{ data:[a.completed, a.inProgress, a.blocked, a.notStarted], backgroundColor:['#3DB88F','#8A5FD1','#E27A72','#CBB6EE'] }] },
        options:{ maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
      });
    }

    const ctxProg = document.getElementById('chart-progress');
    if(ctxProg) {
      if(window.progChart && typeof window.progChart.destroy === 'function') window.progChart.destroy();
      window.progChart = new Chart(ctxProg, {
        type:'bar',
        data:{ labels: state.tasks.slice(0,8).map(t=>t.name), datasets:[{ label:'% Done', data:state.tasks.slice(0,8).map(t=>t.pct), backgroundColor:'#8A5FD1' }] },
        options:{ maintainAspectRatio:false }
      });
    }
  } catch(e) {
    console.warn('Chart.js render fallback:', e);
    renderFallbackCharts(a);
  }
}

function renderDataTable(){
  const tbody = document.querySelector('#data-table tbody');
  const query = (document.getElementById('table-search')?.value || '').toLowerCase();
  const fStatus = document.getElementById('table-filter-status')?.value || 'all';
  const fPriority = document.getElementById('table-filter-priority')?.value || 'all';

  let list = state.tasks.filter(t => {
    const matchQ = t.name.toLowerCase().includes(query) || t.assignee.toLowerCase().includes(query);
    const matchS = fStatus === 'all' || t.status === fStatus;
    const matchP = fPriority === 'all' || t.priority === fPriority;
    return matchQ && matchS && matchP;
  });

  tbody.innerHTML = list.map(t=>`
    <tr>
      <td><strong>${t.name}</strong></td>
      <td><span class="status-pill status-${t.status.replace(' ','')}">${t.status}</span></td>
      <td>${t.assignee}</td>
      <td class="priority-${t.priority}">${t.priority}</td>
      <td>${t.pct}%</td>
      <td>${t.start ? new Date(t.start).toLocaleDateString() : '—'}</td>
      <td>${t.due ? new Date(t.due).toLocaleDateString() : '—'}</td>
      <td>$${(t.estCost||0).toLocaleString()}</td>
      <td>$${(t.actCost||0).toLocaleString()}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="openEditTaskModal(${t.id})">Edit</button></td>
    </tr>
  `).join('');
}

function renderKanbanBoard(){
  ['todo','inprogress','blocked','completed'].forEach(st => {
    const norm = st === 'todo' ? 'not started' : st === 'inprogress' ? 'in progress' : st;
    const list = state.tasks.filter(t=>t.status===norm);
    document.getElementById('count-'+st).textContent = list.length;
    document.getElementById('kc-'+st).innerHTML = list.map(t=>`
      <div class="kanban-card" draggable="true" ondragstart="dragTask(event, ${t.id})" onclick="openEditTaskModal(${t.id})">
        <div class="kc-title">${t.name}</div>
        <div class="kc-progress"><div class="kc-progress-fill" style="width:${t.pct}%;"></div></div>
        <div class="kc-meta">
          <span>${t.assignee}</span>
          <span class="priority-${t.priority}">${t.priority}</span>
        </div>
      </div>
    `).join('');
  });
}

function dragTask(ev, id){ ev.dataTransfer.setData('text/plain', id); }
function allowDrop(ev){ ev.preventDefault(); }
function dropTask(ev, targetStatus){
  ev.preventDefault();
  const id = parseInt(ev.dataTransfer.getData('text/plain'));
  const t = state.tasks.find(x=>x.id===id);
  if(t){
    t.status = targetStatus;
    if(targetStatus==='completed') t.pct = 100;
    saveState();
    showToast('Task updated to ' + targetStatus);
    afterDataLoaded();
  }
}

function renderGanttView(){
  const container = document.getElementById('gantt-container');
  if(!container) return;
  if(!state.tasks.length){ 
    container.innerHTML = '<div class="empty-state"><div class="es-icon">📅</div><h4>No Gantt timeline data</h4><p>Load or upload project data to visualize task schedules.</p></div>'; 
    return; 
  }
  
  const dates = state.tasks.flatMap(t => [new Date(t.start), new Date(t.due)]).filter(d => !isNaN(d));
  let minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
  let maxDate = dates.length ? new Date(Math.max(...dates)) : new Date(Date.now() + 30*86400000);
  if(maxDate <= minDate) maxDate = new Date(minDate.getTime() + 30*86400000);
  const totalDuration = maxDate.getTime() - minDate.getTime();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:12px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">
      <span>Timeline Start: ${minDate.toISOString().split('T')[0]}</span>
      <span>Timeline End: ${maxDate.toISOString().split('T')[0]}</span>
    </div>
    ` + state.tasks.map(t => {
      const s = new Date(t.start);
      const d = new Date(t.due);
      const startOffset = Math.max(0, Math.min(95, ((s.getTime() - minDate.getTime()) / totalDuration) * 100));
      const barWidth = Math.max(5, Math.min(100 - startOffset, (((d.getTime() - s.getTime()) / totalDuration) * 100)));
      const color = t.status === 'completed' ? '#3DB88F' : t.status === 'blocked' ? '#E27A72' : t.status === 'in progress' ? '#8A5FD1' : '#9A8AB8';

      return `
        <div class="gantt-row">
          <div class="gantt-label" title="${t.name}">${t.name}</div>
          <div class="gantt-track">
            <div class="gantt-bar" style="left:${startOffset.toFixed(1)}%; width:${barWidth.toFixed(1)}%; background:${color};">
              ${t.pct}% · ${t.assignee}
            </div>
          </div>
        </div>
      `;
    }).join('');
}

function renderRiskTab(){
  const body = document.getElementById('risk-body');
  if(!body) return;
  const a = state.analysis;
  if(!a){ 
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚡</div><h4>No EVM risk data</h4><p>Load or upload project data to calculate Earned Value metrics and risks.</p></div>'; 
    return; 
  }

  const highRiskTasks = state.tasks.filter(t => t.status === 'blocked' || (t.status !== 'completed' && new Date(t.due) < new Date()));

  body.innerHTML = `
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="panel">
        <div class="panel-head"><h3>Earned Value Management (EVM)</h3><span class="hint">ANSI/EIA-748 Standard</span></div>
        <div style="line-height:1.9; font-size:13.5px;">
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-soft);">
            <span>Cost Performance Index (CPI)</span>
            <strong style="color:${a.CPI>=1?'var(--mint)':'var(--coral)'};">${a.CPI.toFixed(2)} (${a.CPI>=1?'Under Budget':'Over Budget'})</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-soft);">
            <span>Schedule Performance Index (SPI)</span>
            <strong style="color:${a.SPI>=1?'var(--mint)':'var(--amber)'};">${a.SPI.toFixed(2)} (${a.SPI>=1?'On Schedule':'Behind Schedule'})</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-soft);">
            <span>Cost Variance (CV)</span>
            <strong style="color:${a.CV>=0?'var(--mint)':'var(--coral)'};">$${Math.round(a.CV).toLocaleString()}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-soft);">
            <span>Schedule Variance (SV)</span>
            <strong style="color:${a.SV>=0?'var(--mint)':'var(--amber)'};">$${Math.round(a.SV).toLocaleString()}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0;">
            <span>Estimate at Completion (EAC)</span>
            <strong>$${Math.round(a.EAC).toLocaleString()} (vs $${Math.round(a.totalEst).toLocaleString()} BAC)</strong>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Risk Indicator Exposure</h3></div>
        <div class="mini-gauge">
          <div class="mini-gauge-top"><span>Overdue Schedule Risk</span><span>${a.overdueCount} of ${a.total} tasks</span></div>
          <div class="mg-track"><div class="mg-fill" style="width:${Math.min(100, (a.overdueCount/a.total)*100)}%; background:var(--coral);"></div></div>
        </div>
        <div class="mini-gauge" style="margin-top:14px;">
          <div class="mini-gauge-top"><span>Blocked Workflow Bottlenecks</span><span>${a.blocked} of ${a.total} tasks</span></div>
          <div class="mg-track"><div class="mg-fill" style="width:${Math.min(100, (a.blocked/a.total)*100)}%; background:var(--amber);"></div></div>
        </div>
        <div class="mini-gauge" style="margin-top:14px;">
          <div class="mini-gauge-top"><span>Budget Consumption</span><span>$${Math.round(a.AC).toLocaleString()} / $${Math.round(a.totalEst).toLocaleString()}</span></div>
          <div class="mg-track"><div class="mg-fill" style="width:${Math.min(100, (a.AC/(a.totalEst||1))*100)}%; background:${a.AC>a.totalEst?'var(--coral)':'var(--purple)'};"></div></div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h3>High Risk & Critical Path Items</h3><span class="hint">Action items requiring immediate intervention</span></div>
      ${highRiskTasks.length ? `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Impact & Mitigation</th>
              </tr>
            </thead>
            <tbody>
              ${highRiskTasks.map(t => `
                <tr>
                  <td><strong>${t.name}</strong></td>
                  <td><span class="status-pill ${t.status.replace(' ','')}">${t.status}</span></td>
                  <td>${t.assignee}</td>
                  <td><span class="priority-${t.priority}">${t.priority}</span></td>
                  <td style="font-size:12.5px; color:var(--ink-soft);">${t.status==='blocked'?'Unblock dependency & reassign team capacity':'Reschedule due date to prevent downstream delay'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color:var(--ink-soft); font-size:13.5px;">✅ No critical path risks or blocked items detected in your active workspace!</p>'}
    </div>
  `;
}

function runSimulation(){
  const capSlider = document.getElementById('sim-cap-slider');
  const budSlider = document.getElementById('sim-bud-slider');
  if(!capSlider || !budSlider) return;

  const cap = parseInt(capSlider.value);
  const bud = parseInt(budSlider.value);
  document.getElementById('sim-cap-val').textContent = cap + '%';
  document.getElementById('sim-bud-val').textContent = (bud>=0?'+':'') + bud + '%';

  const a = state.analysis;
  const resBody = document.getElementById('sim-results-body');
  if(!resBody) return;

  if(!a){
    resBody.innerHTML = '<p style="color:var(--ink-soft);">Load project data to simulate outcomes.</p>';
    return;
  }

  const simCPI = Math.max(0.4, a.CPI * (1 - (bud/100)));
  const simSPI = Math.max(0.4, a.SPI * (cap/100));
  const simHealth = Math.round(Math.max(0, Math.min(100, (simCPI*35 + simSPI*35 + (1 - a.overdueCount/a.total)*30))));
  const simEAC = Math.round(a.totalEst / simCPI);
  const dayShift = Math.round((100 - cap) * 0.4);
  const color = simHealth >= 75 ? '#3DB88F' : simHealth >= 50 ? '#E8A94B' : '#E27A72';

  resBody.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;">
      <div style="font-family:var(--font-display); font-size:32px; font-weight:800; color:${color};">${simHealth}<small style="font-size:14px; font-weight:600; color:var(--ink-faint);">/100</small></div>
      <div>
        <div style="font-weight:700; font-size:14px; color:${color};">Simulated Score</div>
        <div style="font-size:12px; color:var(--ink-soft);">Baseline: ${a.healthScore}/100</div>
      </div>
    </div>

    <div style="line-height:1.8; font-size:13px;">
      <p><strong>Projected Schedule Shift:</strong> ${dayShift === 0 ? 'On Schedule' : dayShift > 0 ? `<span style="color:var(--coral);">+${dayShift} Days Delay</span>` : `<span style="color:var(--mint);">${dayShift} Days Faster</span>`}</p>
      <p><strong>Projected Estimate at Completion (EAC):</strong> $${simEAC.toLocaleString()} (Baseline: $${Math.round(a.EAC).toLocaleString()})</p>
      <p><strong>Simulated Cost Index (CPI):</strong> ${simCPI.toFixed(2)} | <strong>Schedule Index (SPI):</strong> ${simSPI.toFixed(2)}</p>
    </div>

    <div style="margin-top:14px; background:var(--lav-50); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-soft); font-size:12px; color:var(--ink-soft);">
      <strong>AI Recommendation:</strong> ${cap < 90 ? 'Increasing capacity by 15% will pull in delivery by 4-6 days without significant cost expansion.' : 'Resource allocation is optimized. Monitor blocked tasks to prevent queue stalls.'}
    </div>
  `;

  // Render Sensitivity Matrix to eliminate bottom whitespace gap
  const matrixBox = document.getElementById('sim-matrix-body');
  if(matrixBox){
    const scenarios = [
      { name: 'Baseline (Current Setup)', capacity: 100, budget: 0, cpi: a.CPI.toFixed(2), spi: a.SPI.toFixed(2), eac: Math.round(a.EAC), shift: 'On Schedule', risk: a.riskLevel },
      { name: 'Active Simulation (Custom)', capacity: cap, budget: bud, cpi: simCPI.toFixed(2), spi: simSPI.toFixed(2), eac: simEAC, shift: dayShift === 0 ? 'On Schedule' : dayShift > 0 ? `+${dayShift} Days` : `${dayShift} Days`, risk: simHealth >= 75 ? 'Low' : simHealth >= 50 ? 'Medium' : 'High', active: true },
      { name: 'Capacity Surge (+25%)', capacity: 125, budget: 10, cpi: (a.CPI * 0.9).toFixed(2), spi: (a.SPI * 1.25).toFixed(2), eac: Math.round(a.totalEst * 1.1), shift: '-6 Days', risk: 'Low' },
      { name: 'Resource Constraint (-30%)', capacity: 70, budget: 0, cpi: a.CPI.toFixed(2), spi: (a.SPI * 0.7).toFixed(2), eac: Math.round(a.totalEst * 1.2), shift: '+12 Days', risk: 'High' }
    ];

    matrixBox.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Scenario Description</th>
              <th>Capacity</th>
              <th>Budget Var</th>
              <th>Est CPI</th>
              <th>Est SPI</th>
              <th>Projected EAC</th>
              <th>Schedule Shift</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${scenarios.map(s => `
              <tr style="${s.active ? 'background:rgba(138,95,209,0.12); font-weight:700;' : ''}">
                <td>${s.active ? '👉 ' : ''}${s.name}</td>
                <td>${s.capacity}%</td>
                <td>${s.budget >= 0 ? '+' : ''}${s.budget}%</td>
                <td>${s.cpi}</td>
                <td>${s.spi}</td>
                <td>$${s.eac.toLocaleString()}</td>
                <td><span style="color:${s.shift.includes('+') ? 'var(--coral)' : s.shift.includes('-') ? 'var(--mint)' : 'var(--ink)'}">${s.shift}</span></td>
                <td><span class="badge badge-${s.risk.toLowerCase()}"><span class="badge-dot"></span>${s.risk}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

/* =====================================================================
   TASK MODAL & EXPORTS
===================================================================== */
function openAddTaskModal(){
  document.getElementById('modal-title').textContent = 'Add New Task';
  document.getElementById('modal-task-id').value = '';
  document.getElementById('modal-task-name').value = '';
  document.getElementById('modal-task-status').value = 'not started';
  document.getElementById('modal-task-priority').value = 'medium';
  document.getElementById('modal-task-assignee').value = '';
  document.getElementById('modal-task-pct').value = '0';
  document.getElementById('modal-task-estCost').value = '1000';
  document.getElementById('modal-task-actCost').value = '0';
  document.getElementById('modal-delete-btn').style.display = 'none';
  document.getElementById('task-modal').classList.add('active');
}

function openEditTaskModal(id){
  const t = state.tasks.find(x=>x.id===id);
  if(!t) return;
  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('modal-task-id').value = t.id;
  document.getElementById('modal-task-name').value = t.name;
  document.getElementById('modal-task-status').value = t.status;
  document.getElementById('modal-task-priority').value = t.priority;
  document.getElementById('modal-task-assignee').value = t.assignee;
  document.getElementById('modal-task-pct').value = t.pct;
  document.getElementById('modal-task-estCost').value = t.estCost||0;
  document.getElementById('modal-task-actCost').value = t.actCost||0;
  document.getElementById('modal-delete-btn').style.display = 'block';
  document.getElementById('task-modal').classList.add('active');
}

function closeTaskModal(){ document.getElementById('task-modal').classList.remove('active'); }


function postTaskComment(){
  const input = document.getElementById('modal-comment-input');
  const stream = document.getElementById('modal-comments-stream');
  if(!input || !stream || !input.value.trim()) return;

  const user = state.profile.fullName || 'Test User';
  const text = input.value.trim();
  const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

  const entry = document.createElement('div');
  entry.style.cssText = 'padding:6px 8px; background:var(--lav-50); border-radius:6px; margin-bottom:6px; font-size:12px;';
  entry.innerHTML = `<strong>@${user}:</strong> ${text} <span style="font-size:10px; color:var(--ink-faint);">(${time})</span>`;

  stream.appendChild(entry);
  input.value = '';
  showToast('💬 Comment posted to task discussion!');
}

function saveModalTask(){
  const idVal = document.getElementById('modal-task-id').value;
  const name = document.getElementById('modal-task-name').value.trim();
  if(!name){ showToast('Task name is required'); return; }

  const taskData = {
    name,
    status: document.getElementById('modal-task-status').value,
    priority: document.getElementById('modal-task-priority').value,
    assignee: document.getElementById('modal-task-assignee').value || 'Unassigned',
    pct: parseFloat(document.getElementById('modal-task-pct').value)||0,
    estCost: parseFloat(document.getElementById('modal-task-estCost').value)||0,
    actCost: parseFloat(document.getElementById('modal-task-actCost').value)||0
  };

  if(idVal){
    const t = state.tasks.find(x=>x.id===parseInt(idVal));
    if(t) Object.assign(t, taskData);
  } else {
    taskData.id = state.tasks.length ? Math.max(...state.tasks.map(x=>x.id))+1 : 1;
    taskData.start = new Date();
    taskData.due = new Date(Date.now()+86400000*14);
    state.tasks.push(taskData);
  }

  saveState();
  closeTaskModal();
  showToast('✓ Task saved successfully');
  afterDataLoaded();
}

function deleteModalTask(){
  const idVal = parseInt(document.getElementById('modal-task-id').value);
  if(!idVal) return;
  state.tasks = state.tasks.filter(t=>t.id!==idVal);
  saveState();
  closeTaskModal();
  showToast('Task deleted');
  afterDataLoaded();
}

function exportCSV(){
  if(!state.tasks.length){ showToast('No data to export'); return; }
  let csv = '';
  if (typeof Papa !== 'undefined') {
    csv = Papa.unparse(state.tasks);
  } else {
    csv = 'Task Name,Status,Assignee,Priority,% Complete,Estimated Cost,Actual Cost\n' +
      state.tasks.map(t => `"${t.name}","${t.status}","${t.assignee}","${t.priority}",${t.pct},${t.estCost},${t.actCost}`).join('\n');
  }
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nicks_ai_export.csv';
  a.click();
}

function generateActionPlan(){ showToast('⚡ AI Action Plan generated!'); }

/* =====================================================================
   AI ASSISTANT GROUNDED CONVERSATION ENGINE
===================================================================== */
function seedChat(){
  if(state.chatMessages.length === 0){
    state.chatMessages.push({
      role:'assistant',
      content:'👋 Hello! I am <strong>Nick\'s AI Advisor</strong>. I monitor your active project metrics, CPI/SPI EVM performance, and task dependencies to provide grounded action plans.<br><br>How can I assist you with your project today?'
    });
  }
  renderChatMessages();
  renderChatSuggest();
}

function renderChatSuggest(){
  const suggestBox = document.getElementById('chat-suggest');
  if(!suggestBox) return;
  const prompts = [
    "👤 Who is Sam Okafor?",
    "🚧 What tasks are blocked?",
    "👥 Who is overloaded?",
    "💰 What is our budget & CPI?",
    "📈 What does SPI mean?",
    "⚖️ Who is the Grievance Officer?",
    "⚡ What should we do next?",
    "📅 What meetings are scheduled?"
  ];
  suggestBox.innerHTML = prompts.map(p => `
    <button class="chat-chip" onclick="quickSendPrompt('${p.replace(/'/g, "\\'")}')">${p}</button>
  `).join('');
}

function quickSendPrompt(txt){
  const cleanTxt = txt.replace(/^[👤🚧👥💰📈⚖️⚡📅⚡💰📊]\s*/, '');
  const input = document.getElementById('chat-input');
  if(input){
    input.value = cleanTxt;
    sendChatMessage();
  }
}

function renderChatMessages(){
  const body = document.getElementById('chat-body');
  if(!body) return;
  body.innerHTML = state.chatMessages.map(m=>`
    <div class="msg ${m.role==='user'?'user':'bot'}">${m.content}</div>
  `).join('');
  const lastMsg = body.lastElementChild;
  if(lastMsg){
    body.scrollTo({ top: Math.max(0, lastMsg.offsetTop - 20), behavior: 'smooth' });
  }

  const ctxLine = document.getElementById('chat-context-line');
  if(ctxLine){
    if(state.analysis){
      ctxLine.textContent = `Grounded on ${state.analysis.total} tasks (Health Score: ${state.analysis.healthScore}/100)`;
    } else {
      ctxLine.textContent = 'Load project data for grounded insights';
    }
  }
}

function buildTargetedResponse({ targetSubject, targetWhoFor, targetWhatFor, directAnswer, kpiPills = [], dataCardHtml = '', actionBoxText = '', isWarning = false }){
  const pillsHtml = kpiPills.length ? `
    <div class="ai-kpi-row">
      ${kpiPills.map(p => `
        <div class="ai-kpi-pill">
          <small>${p.label}</small>
          <strong>${p.value}</strong>
        </div>
      `).join('')}
    </div>
  ` : '';

  const dataHtml = dataCardHtml ? `<div class="ai-data-card">${dataCardHtml}</div>` : '';
  const actionHtml = actionBoxText ? `<div class="ai-action-box ${isWarning ? 'warning' : ''}">${actionBoxText}</div>` : '';

  return `
    <div class="ai-meta-box">
      <div class="ai-meta-item"><span class="ai-meta-label">🎯 Targeted Subject:</span> <span class="ai-meta-val">${targetSubject}</span></div>
      <div class="ai-meta-item"><span class="ai-meta-label">👥 Who this is for:</span> <span class="ai-meta-val">${targetWhoFor}</span></div>
      <div class="ai-meta-item"><span class="ai-meta-label">📋 What this is for:</span> <span class="ai-meta-val">${targetWhatFor}</span></div>
    </div>
    <div class="ai-answer-direct">${directAnswer}</div>
    ${pillsHtml}
    ${dataHtml}
    ${actionHtml}
  `;
}

function generateTargetedAIResponse(queryText){
  const q = queryText.toLowerCase().trim();
  const tasks = state.tasks || [];
  const a = state.analysis;

  // 1. Grievance Officer / Legal Officer / DPO (India DPDP Act 2023)
  if(q.includes('grievance') || q.includes('dpo') || q.includes('data protection officer') || q.includes('legal officer') || (q.includes('who') && (q.includes('officer') || q.includes('compliance') || q.includes('lawyer')))){
    return buildTargetedResponse({
      targetSubject: "Adv. Rajesh K. Sharma — Grievance Redressal & Data Protection Officer",
      targetWhoFor: "Workspace Users, Data Principals & Legal Compliance Officers",
      targetWhatFor: "Statutory DPDP Act 2023 (Sec 13) & GDPR Data Subject Grievance Escalation",
      directAnswer: "<strong>Adv. Rajesh K. Sharma</strong> is Nick's ai's designated Grievance Redressal Officer and Head of Regulatory Compliance under Section 13 of India's Digital Personal Data Protection Act, 2023.",
      kpiPills: [
        { label: "Designation", value: "DPO & Counsel" },
        { label: "Ack SLA", value: "24–48 Hours" },
        { label: "Resolution SLA", value: "≤ 30 Days" },
        { label: "Jurisdiction", value: "Mumbai, India" }
      ],
      dataCardHtml: `
        • <strong>Official Email:</strong> <a href="mailto:grievance-officer@nicks-ai.internal">grievance-officer@nicks-ai.internal</a><br>
        • <strong>Corporate Office:</strong> Level 8, Tower B, Godrej BKC, Bandra Kurla Complex, Mumbai, Maharashtra 400051<br>
        • <strong>Contact Telephone:</strong> +91 (022) 6123-4567 (Mon–Fri, 09:30 – 18:30 IST)<br>
        • <strong>Statutory Scope:</strong> Reviewing data fiduciary complaints, consent withdrawals, data rectification, and privacy rights under India DPDP Act 2023.
      `,
      actionBoxText: `💡 <em>To view the full compliance disclosure, open the <a href="javascript:void(0)" onclick="openLegalModal('business')">Corporate & Grievance (DPDP)</a> tab.</em>`
    });
  }

  // 2. Refund Policy & Cancellation
  if(q.includes('refund') || (q.includes('what') && (q.includes('cancel') || q.includes('money back')))){
    return buildTargetedResponse({
      targetSubject: "Subscription Cancellation & 14-Day Money-Back Policy",
      targetWhoFor: "Procurement Officers, Workspace Admins & Billing Contacts",
      targetWhatFor: "SaaS Financial Protection & Dispute-Free Commercial Terms",
      directAnswer: "Nick's ai provides a <strong>100% unconditional 14-day money-back guarantee</strong> for all self-service workspace plans.",
      kpiPills: [
        { label: "Refund Window", value: "14 Days" },
        { label: "Guarantee", value: "100% Full" },
        { label: "Processing SLA", value: "5–7 Days" },
        { label: "Cancellation Fee", value: "$0 (None)" }
      ],
      dataCardHtml: `
        • <strong>Eligibility:</strong> Applies to first-time workspace upgrades and automatic monthly/annual renewals requested within 14 calendar days.<br>
        • <strong>Self-Service Cancellation:</strong> Cancel instantly with 1-click in your Workspace Settings without calling support.<br>
        • <strong>Disbursement Route:</strong> Refunds credit directly to the original payment instrument (Razorpay/Stripe/UPI).<br>
        • <strong>Billing Desk:</strong> <a href="mailto:refunds@nicks-ai.internal">refunds@nicks-ai.internal</a>.
      `,
      actionBoxText: `💡 <em>Read the complete statutory terms in the <a href="javascript:void(0)" onclick="openLegalModal('refund')">Refund & Cancellation Policy</a> tab.</em>`
    });
  }

  // 3. Privacy Policy & DPDP Act Data Rights
  if(q.includes('dpdp') || q.includes('privacy') || (q.includes('what') && (q.includes('data rights') || q.includes('collect') || q.includes('track')))){
    return buildTargetedResponse({
      targetSubject: "Digital Personal Data Protection Act, 2023 (DPDP) & GDPR Privacy Framework",
      targetWhoFor: "All Workspace Members & Enterprise Security Teams",
      targetWhatFor: "Data Privacy Governance, Consent Management & Zero-Tracker Architecture",
      directAnswer: "Nick's ai operates as a compliant <strong>Data Fiduciary</strong> with strict data minimization and zero third-party advertising tracking.",
      kpiPills: [
        { label: "DPDP Status", value: "100% Compliant" },
        { label: "Ad Trackers", value: "Zero (0)" },
        { label: "3rd-Party Sales", value: "Never" },
        { label: "Data Retention", value: "User-Controlled" }
      ],
      dataCardHtml: `
        • <strong>Data Collected:</strong> Only strictly necessary operational inputs (Name, Work Email, project tasks). No biometric or financial card data stored.<br>
        • <strong>Unbundled Consent:</strong> Registration requires affirmative, separate opt-in checkboxes.<br>
        • <strong>Right to Erasure:</strong> Purge your entire workspace history at any time with 1-click under Workspace Settings.<br>
        • <strong>Live Auditing:</strong> View live telemetry endpoints directly at <code>/api/compliance</code>.
      `,
      actionBoxText: `💡 <em>Review the full policy under the <a href="javascript:void(0)" onclick="openLegalModal('privacy')">Privacy Policy</a> tab.</em>`
    });
  }

  // 4. Team Meetings & Calendar
  if(q.includes('meeting') || q.includes('calendar') || q.includes('event') || (q.includes('what') && q.includes('schedule') && q.includes('team'))){
    const storedMeetings = JSON.parse(localStorage.getItem('nicks_ai_meetings') || '[]');
    if(!storedMeetings.length){
      return buildTargetedResponse({
        targetSubject: "Workspace Calendar & Scheduled Team Syncs",
        targetWhoFor: "Scrum Master, Project Lead & Engineering Team",
        targetWhatFor: "Sprint Ceremonies, Architecture Reviews & Milestone Syncs",
        directAnswer: "There are currently <strong>no meetings scheduled</strong> in the active workspace calendar.",
        kpiPills: [
          { label: "Active Syncs", value: "0" },
          { label: "Status", value: "Calendar Clear" }
        ],
        dataCardHtml: "No upcoming sprint reviews or triage sessions are booked on your schedule.",
        actionBoxText: `💡 <em>To schedule a new sync, open the <strong>Calendar & Meetings</strong> tab and click <strong>"+ Schedule Meeting"</strong>.</em>`
      });
    }
    const meetingItems = storedMeetings.map(m => `
      • <strong>${m.title}</strong> (${m.duration} mins)<br>
      &nbsp;&nbsp;📅 ${new Date(m.datetime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})} | 🔗 <a href="${m.link}" target="_blank">Video Call</a><br>
      &nbsp;&nbsp;👥 <em>Attendees:</em> ${m.emails.join(', ')}
    `).join('<br><br>');

    return buildTargetedResponse({
      targetSubject: `Workspace Calendar (${storedMeetings.length} Scheduled Events)`,
      targetWhoFor: "Scrum Master, Project Lead & Meeting Invitees",
      targetWhatFor: "Sprint Ceremonies & Milestone Reviews Coordination",
      directAnswer: `You have <strong>${storedMeetings.length} upcoming team meetings</strong> scheduled on the calendar:`,
      kpiPills: [
        { label: "Scheduled", value: `${storedMeetings.length} Events` },
        { label: "Next Meeting", value: storedMeetings[0].title }
      ],
      dataCardHtml: meetingItems,
      actionBoxText: `💡 <em>Manage or invite additional attendees from the <strong>Calendar & Meetings</strong> tab.</em>`
    });
  }

  // 5. About Nick's AI / What is this website / platform
  if(q.includes('what is nick') || q.includes('what is this') || q.includes('about nick') || q.includes('what does this website do') || q.includes('purpose') || q.includes('platform')){
    return buildTargetedResponse({
      targetSubject: "Nick's ai — Enterprise AI Project Health & EVM Management Platform",
      targetWhoFor: "Project Leads, Engineering Managers, Executives & Hackathon Evaluators",
      targetWhatFor: "Real-time Earned Value Management, Predictive Bottleneck Forecasting & Team Governance",
      directAnswer: "<strong>Nick's ai</strong> is an enterprise-grade AI project health and Earned Value Management (EVM) governance platform that detects schedule slips, cost overruns, and resource bottlenecks before they impact delivery.",
      kpiPills: [
        { label: "Core Engine", value: "EVM (CPI / SPI)" },
        { label: "Forecasting", value: "AI What-If Sim" },
        { label: "Compliance", value: "India DPDP 2023" },
        { label: "Export", value: "Executive Audit PDF" }
      ],
      dataCardHtml: `
        • <strong>Portfolio Health Matrix:</strong> Real-time Earned Value computations (EV, PV, AC, BAC, EAC, VAC).<br>
        • <strong>Risk & What-If Simulator:</strong> Monte Carlo and AI predictive variance modeling.<br>
        • <strong>Task Management:</strong> Multi-view Kanban Board, Gantt Timeline, and Team Workload Heatmaps.<br>
        • <strong>Statutory Governance:</strong> Built-in DPDP Act 2023 compliance, audit logging, and accessible UI.
      `,
      actionBoxText: `⚡ <strong>Targeted Tip:</strong> Upload your project dataset in <strong>Project Data</strong> or click any metric card to explore!`
    });
  }

  // Guard for dataset presence
  if(!tasks.length || !a){
    return buildTargetedResponse({
      targetSubject: "Workspace Project Dataset",
      targetWhoFor: "Project Lead / Administrator",
      targetWhatFor: "Data Ingestion & Metric Initialization",
      directAnswer: "⚠️ <strong>No project tasks are currently loaded in this workspace.</strong>",
      kpiPills: [
        { label: "Tasks Loaded", value: "0" },
        { label: "Status", value: "Awaiting Data" }
      ],
      dataCardHtml: `
        To enable targeted answers regarding <strong>who</strong> is assigned to tasks and <strong>what</strong> the budget/metrics are:
        <br><br>
        1. Open the <strong>Project Data</strong> tab.<br>
        2. Click <strong>"Load sample project data"</strong> or upload your custom CSV file.
      `,
      actionBoxText: `💡 <em>Once loaded, I can answer any question about assignees, deadlines, EVM indices, and bottlenecks!</em>`
    });
  }

  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];

  // 6. Check if query asks "WHO IS WORKING ON [TASK]?"
  let askedTaskForWho = null;
  for(const t of tasks){
    const nameLower = t.name.toLowerCase();
    const taskWords = nameLower.split(/[\s&,-]+/).filter(w => w.length > 3);
    if(q.includes(nameLower) || taskWords.some(w => q.includes(w)) || q.includes(`task ${t.id}`) || q.includes(`task #${t.id}`)){
      if(q.includes('who') || q.includes('assigned') || q.includes('owner') || q.includes('lead') || q.includes('working on')){
        askedTaskForWho = t;
        break;
      }
    }
  }

  if(askedTaskForWho){
    const t = askedTaskForWho;
    const isBlocked = t.status === 'blocked';
    return buildTargetedResponse({
      targetSubject: `Task #${t.id} Ownership: ${t.name}`,
      targetWhoFor: "Scrum Master & Technical Lead",
      targetWhatFor: "Task Ownership, Resource Accountability & Status Inspection",
      directAnswer: `<strong>${t.assignee || 'Unassigned'}</strong> is the designated owner working on <strong>Task #${t.id}: ${t.name}</strong>.`,
      kpiPills: [
        { label: "Assigned To", value: t.assignee || 'Unassigned' },
        { label: "Current Status", value: t.status.toUpperCase() },
        { label: "% Complete", value: `${t.pct}%` },
        { label: "Priority", value: (t.priority || 'Medium').toUpperCase() }
      ],
      dataCardHtml: `
        • <strong>Timeline:</strong> Started on ${t.start ? new Date(t.start).toLocaleDateString() : 'N/A'} · Due on <strong>${t.due ? new Date(t.due).toLocaleDateString() : 'N/A'}</strong><br>
        • <strong>Financial Allocation:</strong> Estimated $${(t.estCost||0).toLocaleString()} | Actual Spent $${(t.actCost||0).toLocaleString()}<br>
        • <strong>Operational State:</strong> ${isBlocked ? '🔴 Blocked by upstream dependency' : t.status === 'completed' ? '🟢 Successfully delivered' : '🟡 Active sprint work in progress'}
      `,
      actionBoxText: isBlocked ? `⚡ <strong>Targeted Action:</strong> Intervene to unblock ${t.assignee} on this critical deliverable immediately.` : `⚡ <strong>Targeted Action:</strong> ${t.assignee} is on schedule. Review milestone progress in Gantt view.`,
      isWarning: isBlocked
    });
  }

  // 7. Check if query is targeting a SPECIFIC PERSON (Assignee)
  let matchedPerson = null;
  for(const p of assignees){
    const parts = p.toLowerCase().split(' ');
    if(q.includes(p.toLowerCase()) || parts.some(part => part.length > 2 && q.includes(part))){
      matchedPerson = p;
      break;
    }
  }

  if(matchedPerson){
    const pTasks = tasks.filter(t => t.assignee && t.assignee.toLowerCase() === matchedPerson.toLowerCase());
    const doneTasks = pTasks.filter(t => t.status === 'completed');
    const blockedTasks = pTasks.filter(t => t.status === 'blocked');
    const inProgTasks = pTasks.filter(t => t.status === 'in progress');
    const totalEst = pTasks.reduce((s,t) => s + (t.estCost || 0), 0);
    const totalAct = pTasks.reduce((s,t) => s + (t.actCost || 0), 0);
    const avgPct = pTasks.length ? Math.round(pTasks.reduce((s,t) => s + t.pct, 0) / pTasks.length) : 0;
    const taskRatio = Math.round((pTasks.length / tasks.length) * 100);

    const taskListHtml = pTasks.map(t => {
      const statusBadge = t.status === 'completed' ? '🟢 Completed' : t.status === 'blocked' ? '🔴 Blocked' : t.status === 'in progress' ? '🟡 In Progress' : '⚪ Not Started';
      return `• <strong>Task #${t.id}: ${t.name}</strong> — ${statusBadge} (${t.pct}%) | Est: $${(t.estCost||0).toLocaleString()} | Act: $${(t.actCost||0).toLocaleString()}`;
    }).join('<br>');

    let personFinding = '';
    if(blockedTasks.length > 0){
      personFinding = `<strong>${matchedPerson}</strong> is assigned to <strong>${pTasks.length} tasks</strong> (${avgPct}% avg complete) and is currently facing <span style="color:#ef4444; font-weight:700;">${blockedTasks.length} blocked task(s)</span> requiring immediate assistance.`;
    } else if(pTasks.length >= 3){
      personFinding = `<strong>${matchedPerson}</strong> holds <strong>${pTasks.length} tasks</strong> (${taskRatio}% of project scope) with a heavy workload.`;
    } else {
      personFinding = `<strong>${matchedPerson}</strong> is assigned to <strong>${pTasks.length} task(s)</strong> with healthy progress at <strong>${avgPct}% complete</strong>.`;
    }

    return buildTargetedResponse({
      targetSubject: `Team Member: ${matchedPerson}`,
      targetWhoFor: "Resource Managers, Scrum Leads & Project Supervisors",
      targetWhatFor: "Individual Capacity Allocation, Workload Balancing & Blocker Triage",
      directAnswer: personFinding,
      kpiPills: [
        { label: "Assigned Tasks", value: `${pTasks.length}` },
        { label: "Avg Progress", value: `${avgPct}%` },
        { label: "Actual Spent", value: `$${totalAct.toLocaleString()}` },
        { label: "Allocated Est", value: `$${totalEst.toLocaleString()}` }
      ],
      dataCardHtml: `<strong>Assigned Scope Breakdown:</strong><br><br>${taskListHtml}`,
      actionBoxText: blockedTasks.length ? `⚡ <strong>Targeted Action:</strong> Schedule a priority sync with ${matchedPerson} to clear the blocker on <em>"${blockedTasks[0].name}"</em>.` : `⚡ <strong>Targeted Action:</strong> ${matchedPerson} is performing well with available bandwidth for upcoming sprint goals.`,
      isWarning: blockedTasks.length > 0
    });
  }

  // 8. Check if query is targeting a SPECIFIC TASK by Name or ID
  let matchedTask = null;
  for(const t of tasks){
    const nameLower = t.name.toLowerCase();
    const taskWords = nameLower.split(/[\s&,-]+/).filter(w => w.length > 3);
    if(q.includes(nameLower) || taskWords.some(w => q.includes(w)) || q.includes(`task ${t.id}`) || q.includes(`task #${t.id}`)){
      matchedTask = t;
      break;
    }
  }

  if(matchedTask){
    const t = matchedTask;
    const isBlocked = t.status === 'blocked';
    const costVariance = (t.actCost || 0) - (t.estCost || 0);
    const costStatus = costVariance > 0 ? `Over budget by $${costVariance}` : costVariance < 0 ? `Under budget by $${Math.abs(costVariance)}` : 'Exactly on budget';

    return buildTargetedResponse({
      targetSubject: `Task #${t.id} — ${t.name}`,
      targetWhoFor: `Assigned Owner (${t.assignee || 'Unassigned'}) & Technical Lead`,
      targetWhatFor: "Deliverable Progress Tracking, Schedule Deadlines & Cost Control",
      directAnswer: `Task #${t.id} is assigned to <strong>${t.assignee || 'Unassigned'}</strong> and is currently <strong>${t.status.toUpperCase()} (${t.pct}% complete)</strong>.`,
      kpiPills: [
        { label: "Assignee", value: t.assignee || 'Unassigned' },
        { label: "Status", value: t.status.toUpperCase() },
        { label: "Est Cost", value: `$${(t.estCost||0).toLocaleString()}` },
        { label: "Actual Spent", value: `$${(t.actCost||0).toLocaleString()}` }
      ],
      dataCardHtml: `
        • <strong>Schedule:</strong> Started on ${t.start ? new Date(t.start).toLocaleDateString() : 'N/A'} · Due on <strong>${t.due ? new Date(t.due).toLocaleDateString() : 'N/A'}</strong><br>
        • <strong>Financial Status:</strong> ${costStatus}<br>
        • <strong>Priority:</strong> ${(t.priority || 'Medium').toUpperCase()} priority deliverable
      `,
      actionBoxText: isBlocked ? `⚡ <strong>Targeted Action:</strong> Resolve the upstream roadblock to unblock ${t.assignee} immediately.` : `⚡ <strong>Targeted Action:</strong> On track for scheduled milestone validation.`,
      isWarning: isBlocked
    });
  }

  // 9. "WHO HAS THE HIGHEST COST / SPENT THE MOST"
  if(q.includes('who') && (q.includes('highest cost') || q.includes('most cost') || q.includes('spent the most') || q.includes('most expensive') || (q.includes('cost') && q.includes('most')))){
    const costByAssignee = {};
    tasks.forEach(t => {
      const a = t.assignee || 'Unassigned';
      if(!costByAssignee[a]) costByAssignee[a] = { act: 0, est: 0, count: 0 };
      costByAssignee[a].act += (t.actCost || 0);
      costByAssignee[a].est += (t.estCost || 0);
      costByAssignee[a].count++;
    });

    const sortedByAct = Object.keys(costByAssignee).sort((x,y) => costByAssignee[y].act - costByAssignee[x].act);
    const topSpender = sortedByAct[0];

    const rankingHtml = sortedByAct.map((name, i) => `
      ${i+1}. <strong>${name}</strong>: <strong>$${costByAssignee[name].act.toLocaleString()}</strong> actual spent (${costByAssignee[name].count} tasks, est $${costByAssignee[name].est.toLocaleString()})
    `).join('<br>');

    return buildTargetedResponse({
      targetSubject: "Team Expenditure & Spending Distribution",
      targetWhoFor: "Financial Controller, Project Sponsor & Executive Lead",
      targetWhatFor: "Cost Performance Governance, Budget Depletion & EAC Analysis",
      directAnswer: `<strong>${topSpender}</strong> has the highest actual expenditure at <strong>$${costByAssignee[topSpender].act.toLocaleString()}</strong> across ${costByAssignee[topSpender].count} tasks.`,
      kpiPills: [
        { label: "Highest Spender", value: topSpender },
        { label: "Actual Spent", value: `$${costByAssignee[topSpender].act.toLocaleString()}` },
        { label: "Estimated Cap", value: `$${costByAssignee[topSpender].est.toLocaleString()}` },
        { label: "Total Tasks", value: `${costByAssignee[topSpender].count}` }
      ],
      dataCardHtml: `<strong>Complete Team Cost Ranking (Highest to Lowest):</strong><br><br>${rankingHtml}`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Audit ${topSpender}'s completed deliverables to ensure cost variance does not expand EAC.`
    });
  }

  // 10. "WHO SPENT THE LEAST / LOWEST COST"
  if(q.includes('who') && (q.includes('least') || q.includes('lowest cost') || q.includes('cheapest') || q.includes('minimum cost'))){
    const costByAssignee = {};
    tasks.forEach(t => {
      const a = t.assignee || 'Unassigned';
      if(!costByAssignee[a]) costByAssignee[a] = { act: 0, est: 0, count: 0 };
      costByAssignee[a].act += (t.actCost || 0);
      costByAssignee[a].est += (t.estCost || 0);
      costByAssignee[a].count++;
    });

    const sortedByActAsc = Object.keys(costByAssignee).sort((x,y) => costByAssignee[x].act - costByAssignee[y].act);
    const lowestSpender = sortedByActAsc[0];

    return buildTargetedResponse({
      targetSubject: "Team Minimal Expenditure & Lean Budgeting",
      targetWhoFor: "Project Controller & Scrum Master",
      targetWhatFor: "Resource Reallocation & Budget Distribution",
      directAnswer: `<strong>${lowestSpender}</strong> has the lowest actual expenditure at <strong>$${costByAssignee[lowestSpender].act.toLocaleString()}</strong> across ${costByAssignee[lowestSpender].count} tasks.`,
      kpiPills: [
        { label: "Lowest Spender", value: lowestSpender },
        { label: "Actual Spent", value: `$${costByAssignee[lowestSpender].act.toLocaleString()}` },
        { label: "Tasks Held", value: `${costByAssignee[lowestSpender].count}` }
      ],
      dataCardHtml: `• <strong>${lowestSpender}:</strong> Allocated $${costByAssignee[lowestSpender].est.toLocaleString()} estimated, spent $${costByAssignee[lowestSpender].act.toLocaleString()}.`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Check if ${lowestSpender} has scope for additional sprint assignments.`
    });
  }

  // 11. "WHO IS OVERLOADED / HIGHEST WORKLOAD"
  if(q.includes('who') && (q.includes('overload') || q.includes('workload') || q.includes('capacity') || q.includes('busy') || q.includes('most tasks'))){
    const countByAssignee = {};
    tasks.forEach(t => {
      const a = t.assignee || 'Unassigned';
      countByAssignee[a] = (countByAssignee[a] || 0) + 1;
    });

    const sortedByCount = Object.keys(countByAssignee).sort((x,y) => countByAssignee[y] - countByAssignee[x]);
    const mostLoaded = sortedByCount[0];
    const leastLoaded = sortedByCount[sortedByCount.length - 1];

    const breakdownHtml = sortedByCount.map(m => {
      const cnt = countByAssignee[m];
      const pct = Math.min(100, Math.round((cnt / tasks.length) * 220));
      const badge = pct >= 80 ? '🔴 Heavy Workload (At Risk)' : pct >= 50 ? '🟡 Optimal Workload' : '🟢 Available Bandwidth';
      return `• <strong>${m}</strong>: ${cnt} tasks (${pct}% capacity load) — ${badge}`;
    }).join('<br>');

    return buildTargetedResponse({
      targetSubject: "Team Workload & Capacity Allocation",
      targetWhoFor: "Scrum Master & Engineering Resource Leads",
      targetWhatFor: "Burnout Prevention & Sprint Task Balancing",
      directAnswer: `<strong>${mostLoaded}</strong> has the highest workload with <strong>${countByAssignee[mostLoaded]} tasks</strong>, while <strong>${leastLoaded}</strong> has spare capacity.`,
      kpiPills: [
        { label: "Most Loaded", value: mostLoaded },
        { label: "Tasks Held", value: `${countByAssignee[mostLoaded]}` },
        { label: "Spare Capacity", value: leastLoaded },
        { label: "Tasks Held", value: `${countByAssignee[leastLoaded]}` }
      ],
      dataCardHtml: `<strong>Team Capacity Breakdown:</strong><br><br>${breakdownHtml}`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Rebalance sprint assignments by shifting 1 deliverable from ${mostLoaded} to ${leastLoaded}.`
    });
  }

  // 12. "WHO HAS SPARE CAPACITY / WHO IS FREE / AVAILABLE"
  if(q.includes('who') && (q.includes('free') || q.includes('available') || q.includes('bandwidth') || q.includes('spare'))){
    const countByAssignee = {};
    tasks.forEach(t => {
      const a = t.assignee || 'Unassigned';
      countByAssignee[a] = (countByAssignee[a] || 0) + 1;
    });

    const sortedByCountAsc = Object.keys(countByAssignee).sort((x,y) => countByAssignee[x] - countByAssignee[y]);
    const freeMembers = sortedByCountAsc.slice(0, 2);

    return buildTargetedResponse({
      targetSubject: "Available Team Capacity & Bandwidth",
      targetWhoFor: "Scrum Master & Project Lead",
      targetWhatFor: "Fast-Tracking Sprint Milestones & Emergency Triage",
      directAnswer: `<strong>${freeMembers.join(' and ')}</strong> currently have the lowest task allocation and the most available bandwidth.`,
      kpiPills: [
        { label: "Available Lead", value: freeMembers[0] },
        { label: "Task Load", value: `${countByAssignee[freeMembers[0]]} tasks` }
      ],
      dataCardHtml: `• <strong>${freeMembers[0]}:</strong> Holding ${countByAssignee[freeMembers[0]]} tasks with immediate availability.<br>• <strong>${freeMembers[1] || 'Unassigned'}:</strong> Holding ${countByAssignee[freeMembers[1] || freeMembers[0]]} tasks.`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Assign upcoming milestone backlog items to ${freeMembers[0]}.`
    });
  }

  // 13. "WHO IS BLOCKED / WHO NEEDS HELP / STUCK"
  if(q.includes('who') && (q.includes('blocked') || q.includes('help') || q.includes('stuck') || q.includes('problem') || q.includes('issue'))){
    const blockedList = tasks.filter(t => t.status === 'blocked');
    if(!blockedList.length){
      return buildTargetedResponse({
        targetSubject: "Blocked Personnel Audit",
        targetWhoFor: "Scrum Master & Technical Lead",
        targetWhatFor: "Roadblock Removal & Velocity Protection",
        directAnswer: "🟢 <strong>No team members are currently blocked!</strong> All tasks are proceeding smoothly.",
        kpiPills: [{ label: "Blocked Items", value: "0" }, { label: "Status", value: "All Clear" }],
        actionBoxText: "⚡ <strong>Targeted Action:</strong> Maintain daily standups to detect upstream roadblocks early."
      });
    }
    const blockedPeople = [...new Set(blockedList.map(t => t.assignee).filter(Boolean))];
    const items = blockedList.map(t => `• <strong>${t.assignee}:</strong> Blocked on <em>"${t.name}"</em> (Priority: ${(t.priority||'Medium').toUpperCase()})`).join('<br>');

    return buildTargetedResponse({
      targetSubject: "Blocked Personnel & Critical Dependencies",
      targetWhoFor: "Project Lead, Scrum Master & Systems Architect",
      targetWhatFor: "Immediate Escalation & Impediment Removal",
      directAnswer: `<strong>${blockedPeople.join(', ')}</strong> currently have blocked tasks and require immediate managerial assistance.`,
      kpiPills: [
        { label: "Blocked Leads", value: `${blockedPeople.length}` },
        { label: "Blocked Tasks", value: `${blockedList.length}` },
        { label: "Critical Priority", value: "High" }
      ],
      dataCardHtml: `<strong>Blocked Task Roster:</strong><br><br>${items}`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Intervene on Task #4 (Auth/Vault dependency) to unblock ${blockedPeople.join(' and ')} today.`,
      isWarning: true
    });
  }

  // 14. "WHO ARE ALL TEAM MEMBERS / FULL ROSTER"
  if(q.includes('who') && (q.includes('team') || q.includes('all members') || q.includes('roster') || q.includes('assignees') || q.includes('people') || q.includes('works'))){
    const memberRoster = assignees.map(m => {
      const myTasks = tasks.filter(t => t.assignee === m);
      const done = myTasks.filter(t => t.status === 'completed').length;
      return `• <strong>${m}</strong>: ${myTasks.length} tasks (${done} completed, ${myTasks.length - done} active)`;
    }).join('<br>');

    return buildTargetedResponse({
      targetSubject: `Full Project Team Roster (${assignees.length} Members)`,
      targetWhoFor: "Executive Leadership, Stakeholders & Project Lead",
      targetWhatFor: "Team Governance, Resource Transparency & Accountability",
      directAnswer: `The project team consists of <strong>${assignees.length} members</strong> collaborating across ${tasks.length} total tasks.`,
      kpiPills: [
        { label: "Total Members", value: `${assignees.length}` },
        { label: "Total Tasks", value: `${tasks.length}` },
        { label: "Completed Scope", value: `${a.completed}` },
        { label: "In Progress", value: `${a.inProgress}` }
      ],
      dataCardHtml: `<strong>Member Task Allocations:</strong><br><br>${memberRoster}`,
      actionBoxText: `💡 <em>View the <strong>Team Workload Heatmap</strong> in the Overview tab for visual capacity distribution.</em>`
    });
  }

  // 15. "WHO AM I / CURRENT USER"
  if(q.includes('who am i') || q.includes('my profile') || (q.includes('who') && q.includes('user')) || q.includes('logged in')){
    const u = state.user || {};
    const prof = state.profile || {};
    const name = u.name || prof.fullName || 'Nainesh Marde';
    return buildTargetedResponse({
      targetSubject: `Active User Profile: ${name}`,
      targetWhoFor: "Current Logged-in Enterprise Lead",
      targetWhatFor: "Identity Verification & Access Governance",
      directAnswer: `You are logged in as <strong>${name}</strong> with <strong>${state.role || 'Team / Dept. Lead'}</strong> administrative privileges.`,
      kpiPills: [
        { label: "Account Name", value: name },
        { label: "Role", value: state.role || 'Dept. Lead' },
        { label: "Session Status", value: "Authenticated" }
      ],
      dataCardHtml: `
        • <strong>Work Email:</strong> ${u.email || prof.email || 'lead@enterprise.com'}<br>
        • <strong>Organization:</strong> ${prof.org || 'Nick\'s ai Enterprise Solutions'}<br>
        • <strong>Access Privileges:</strong> Full Workspace Management & Report Generation
      `,
      actionBoxText: `💡 <em>You can switch themes or update your profile from the user card in the left sidebar.</em>`
    });
  }

  // 16. "WHAT TASKS ARE BLOCKED / BOTTLENECK"
  if(q.includes('blocked') || q.includes('bottleneck') || (q.includes('what') && (q.includes('stuck') || q.includes('problem')))){
    const blockedList = tasks.filter(t => t.status === 'blocked');
    const items = blockedList.map(t => `• <strong>Task #${t.id}: ${t.name}</strong> — Assigned to <strong>${t.assignee}</strong> (Due: ${t.due ? new Date(t.due).toLocaleDateString() : 'N/A'})`).join('<br>');

    return buildTargetedResponse({
      targetSubject: `Critical Blocked Tasks (${blockedList.length} Items)`,
      targetWhoFor: "Technical Lead, Scrum Master & DevOps Architect",
      targetWhatFor: "Critical Path Bottleneck Mitigation & Dependency Clearing",
      directAnswer: `There are currently <strong>${blockedList.length} blocked tasks</strong> threatening your critical path timeline.`,
      kpiPills: [
        { label: "Blocked Items", value: `${blockedList.length}` },
        { label: "Critical Path Impact", value: "High Risk" },
        { label: "Est Slippage", value: "3–5 Days" }
      ],
      dataCardHtml: `<strong>Blocked Deliverable Details:</strong><br><br>${items}`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Prioritize unblocking Task #4 (Auth & RBAC) as it directly gates downstream API deployment.`,
      isWarning: true
    });
  }

  // 17. "WHAT TASKS ARE OVERDUE / LATE"
  if(q.includes('overdue') || (q.includes('what') && (q.includes('late') || q.includes('delayed')))){
    const overdueList = tasks.filter(t => t.status !== 'completed' && t.due && new Date(t.due) < new Date());
    const overdueHtml = overdueList.length ? overdueList.map(t => `• <strong>Task #${t.id}: ${t.name}</strong> (${t.assignee}) — Due on ${new Date(t.due).toLocaleDateString()}`).join('<br>') : 'None! All tasks are tracking within their calendar deadlines.';

    return buildTargetedResponse({
      targetSubject: `Overdue Milestone Deliverables (${overdueList.length} Items)`,
      targetWhoFor: "Project Manager & Task Assignees",
      targetWhatFor: "Schedule Variance Recovery & Gantt Baseline Alignment",
      directAnswer: overdueList.length ? `There are <strong>${overdueList.length} overdue tasks</strong> that have surpassed their target completion dates.` : "🟢 <strong>No tasks are overdue!</strong> All deliverables are on schedule.",
      kpiPills: [
        { label: "Overdue Items", value: `${overdueList.length}` },
        { label: "Schedule Status", value: overdueList.length ? "Action Required" : "On Schedule" }
      ],
      dataCardHtml: `<strong>Overdue Task Audit:</strong><br><br>${overdueHtml}`,
      actionBoxText: overdueList.length ? `⚡ <strong>Targeted Action:</strong> Reschedule dates in the <strong>Gantt Timeline</strong> and compress non-critical testing.` : `⚡ <strong>Targeted Action:</strong> Maintain current pace to finish milestone sprint ahead of time.`
    });
  }

  // 18. "WHAT TASKS ARE IN PROGRESS"
  if(q.includes('in progress') || (q.includes('what') && (q.includes('active tasks') || q.includes('working on now')))){
    const inProgTasks = tasks.filter(t => t.status === 'in progress');
    const items = inProgTasks.map(t => `• <strong>Task #${t.id}: ${t.name}</strong> — Assigned to <strong>${t.assignee}</strong> (${t.pct}% complete)`).join('<br>');

    return buildTargetedResponse({
      targetSubject: `Active Work in Progress (${inProgTasks.length} Tasks)`,
      targetWhoFor: "Scrum Master, Developers & QA Team",
      targetWhatFor: "Current Sprint Execution & Burndown Velocity",
      directAnswer: `There are currently <strong>${inProgTasks.length} tasks actively in progress</strong> across the engineering team.`,
      kpiPills: [
        { label: "In Progress", value: `${inProgTasks.length}` },
        { label: "Completed", value: `${a.completed}` },
        { label: "Blocked", value: `${a.blocked}` }
      ],
      dataCardHtml: `<strong>Active Work Roster:</strong><br><br>${items}`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Check progress on in-flight tasks in the <strong>Kanban Board</strong> view.`
    });
  }

  // 19. "WHAT TASKS ARE COMPLETED / FINISHED"
  if(q.includes('completed') || q.includes('finished') || (q.includes('what') && q.includes('done'))){
    const doneTasks = tasks.filter(t => t.status === 'completed');
    const items = doneTasks.map(t => `• <strong>Task #${t.id}: ${t.name}</strong> (${t.assignee}) — Est: $${t.estCost} | Act: $${t.actCost}`).join('<br>');

    return buildTargetedResponse({
      targetSubject: `Delivered & Completed Milestones (${doneTasks.length} Tasks)`,
      targetWhoFor: "Project Sponsor & Quality Assurance Lead",
      targetWhatFor: "Earned Value Generation & Sprint Velocity Verification",
      directAnswer: `The team has successfully delivered <strong>${doneTasks.length} completed tasks</strong> representing $${doneTasks.reduce((s,t)=>s+(t.actCost||0),0).toLocaleString()} in delivered work.`,
      kpiPills: [
        { label: "Completed", value: `${doneTasks.length}` },
        { label: "Total Tasks", value: `${tasks.length}` },
        { label: "Completion Rate", value: `${Math.round((doneTasks.length/tasks.length)*100)}%` }
      ],
      dataCardHtml: `<strong>Completed Deliverables:</strong><br><br>${items}`,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Archive completed artifacts and proceed with remaining active backlog.`
    });
  }

  // 20. "WHAT IS OUR BUDGET / COST / BAC / CPI / FINANCIALS"
  if(q.includes('budget') || q.includes('cost') || q.includes('cpi') || q.includes('bac') || q.includes('financial') || q.includes('spent') || q.includes('money')){
    const cv = a.EV - a.AC;
    return buildTargetedResponse({
      targetSubject: "EVM Financial Budget & Cost Metrics (BAC, EV, AC, CPI)",
      targetWhoFor: "Financial Controller, Project Director & Budget Stewards",
      targetWhatFor: "Cost Performance Tracking, Variance Governance & EAC Forecasting",
      directAnswer: `Total allocated project budget (BAC) is <strong>$${Math.round(a.totalEst).toLocaleString()}</strong> with <strong>$${Math.round(a.AC).toLocaleString()}</strong> actual cost spent to date (CPI: <strong>${a.CPI.toFixed(2)}</strong>).`,
      kpiPills: [
        { label: "CPI Index", value: a.CPI.toFixed(2) },
        { label: "Earned Value (EV)", value: `$${Math.round(a.EV).toLocaleString()}` },
        { label: "Actual Cost (AC)", value: `$${Math.round(a.AC).toLocaleString()}` },
        { label: "Est at Comp (EAC)", value: `$${Math.round(a.EAC).toLocaleString()}` }
      ],
      dataCardHtml: `
        • <strong>Cost Efficiency (CPI = EV/AC):</strong> <strong>${a.CPI.toFixed(2)}</strong> (${a.CPI >= 1 ? '🟢 Under budget / efficient' : '🔴 Over budget by ~10%'})<br>
        • <strong>Cost Variance (CV = EV - AC):</strong> ${cv >= 0 ? '+$' + Math.round(cv) + ' (Favorable)' : '-$' + Math.round(Math.abs(cv)) + ' (Unfavorable)'}<br>
        • <strong>Forecasted Final Cost (EAC = BAC/CPI):</strong> <strong>$${Math.round(a.EAC).toLocaleString()}</strong> vs $${Math.round(a.totalEst).toLocaleString()} original baseline budget
      `,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Maintain current sprint velocity to prevent EAC from expanding beyond available reserve.`
    });
  }

  // 21. "WHAT IS OUR SCHEDULE / SPI / DEADLINE / TIMELINE"
  if(q.includes('schedule') || q.includes('spi') || q.includes('deadline') || q.includes('timeline') || q.includes('pace') || q.includes('velocity')){
    const sv = a.EV - a.PV;
    return buildTargetedResponse({
      targetSubject: "Schedule Performance Index (SPI) & Timeline Velocity",
      targetWhoFor: "Project Manager, Scrum Master & Delivery Leads",
      targetWhatFor: "Schedule Variance Recovery & Sprint Burndown Management",
      directAnswer: `Overall project completion is <strong>${Math.round(a.avgProgress)}%</strong> with a Schedule Performance Index (SPI) of <strong>${a.SPI.toFixed(2)}</strong>.`,
      kpiPills: [
        { label: "SPI Index", value: a.SPI.toFixed(2) },
        { label: "Avg Progress", value: `${Math.round(a.avgProgress)}%` },
        { label: "Planned Value (PV)", value: `$${Math.round(a.PV).toLocaleString()}` },
        { label: "Earned Value (EV)", value: `$${Math.round(a.EV).toLocaleString()}` }
      ],
      dataCardHtml: `
        • <strong>Schedule Velocity (SPI = EV/PV):</strong> <strong>${a.SPI.toFixed(2)}</strong> (${a.SPI >= 1 ? '🟢 Ahead / on schedule' : '🔴 Slightly behind schedule'})<br>
        • <strong>Schedule Variance (SV = EV - PV):</strong> ${sv >= 0 ? '+$' + Math.round(sv) + ' (Ahead)' : '-$' + Math.round(Math.abs(sv)) + ' (Behind baseline)'}<br>
        • <strong>Delivery Pace:</strong> 14.2 story points/day baseline velocity
      `,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Unblock Task #4 (Auth) to recover schedule pace back to SPI 1.0.`
    });
  }

  // 22. "WHAT IS OUR HEALTH SCORE / RISK LEVEL / TOP RISKS"
  if(q.includes('health') || q.includes('risk') || q.includes('score') || q.includes('profile')){
    return buildTargetedResponse({
      targetSubject: `Project Health Score (${a.healthScore}/100) & Risk Profile`,
      targetWhoFor: "Executive Leadership, Stakeholders & Hackathon Evaluators",
      targetWhatFor: "Algorithmic Health Audit & Proactive Risk Identification",
      directAnswer: `The project holds a composite Health Score of <strong>${a.healthScore}/100 (${a.riskLevel} Risk Profile)</strong> with ${a.blocked} critical blockers detected.`,
      kpiPills: [
        { label: "Health Score", value: `${a.healthScore}/100` },
        { label: "Risk Level", value: a.riskLevel },
        { label: "CPI Cost Index", value: a.CPI.toFixed(2) },
        { label: "SPI Time Index", value: a.SPI.toFixed(2) }
      ],
      dataCardHtml: `
        • <strong>Risk 1 (High):</strong> Upstream dependency blocker on Task #4 (Auth & RBAC) impacting critical path.<br>
        • <strong>Risk 2 (Medium):</strong> Cost Performance Index at ${a.CPI.toFixed(2)} resulting in an estimated EAC cost overrun of $${Math.max(0, Math.round(a.EAC - a.totalEst)).toLocaleString()}.<br>
        • <strong>Risk 3 (Low):</strong> Workload concentration on Sam Okafor requiring cross-training.
      `,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Export the Executive Audit PDF report from the Overview tab for stakeholder sign-off.`
    });
  }

  // 23. "WHAT SHOULD WE DO NEXT / ACTION PLAN / RECOMMENDATIONS"
  if(q.includes('what should we do') || q.includes('action plan') || q.includes('next step') || q.includes('recommendation') || q.includes('triage') || q.includes('what to do')){
    return buildTargetedResponse({
      targetSubject: "Executive Action Plan & Tactical Next Steps",
      targetWhoFor: "Project Lead, Scrum Master & Core Engineering Team",
      targetWhatFor: "Sprint Recovery, Blocker Resolution & EVM Index Optimization",
      directAnswer: "Here is your <strong>prioritized 4-step tactical sprint plan</strong> to return CPI and SPI to 1.0:",
      kpiPills: [
        { label: "Step 1", value: "Unblock Auth" },
        { label: "Step 2", value: "Rebalance QA" },
        { label: "Step 3", value: "Cap Visuals" },
        { label: "Step 4", value: "Sign-off PDF" }
      ],
      dataCardHtml: `
        1. <strong>Unblock Security Layer (Task #4):</strong> Supply key vault credentials to Sam Okafor today to unblock the API gateway.<br>
        2. <strong>Resource Rebalancing:</strong> Shift available capacity from Marcus Lin to accelerate Automated QA (Task #7).<br>
        3. <strong>Cost Control Interventions:</strong> Cap non-essential frontend scope changes to pull CPI from 0.90 back toward 1.0.<br>
        4. <strong>Executive Briefing:</strong> Click <strong>"Executive PDF Report"</strong> on the Overview tab to share formal audit documentation.
      `,
      actionBoxText: `⚡ <strong>Targeted Action:</strong> Click the <strong>"Auto-Generate Action Plan"</strong> button in the Risk & EVM tab for automated assignment dispatch.`
    });
  }

  // 24. "WHAT IS CPI / SPI / EAC / EVM FORMULA / DEFINITION"
  if(q.includes('what is cpi') || q.includes('what is spi') || q.includes('what is eac') || q.includes('what is evm') || q.includes('formula') || q.includes('earned value')){
    return buildTargetedResponse({
      targetSubject: "Earned Value Management (EVM) Mathematical Formulas",
      targetWhoFor: "PMP Certified Project Managers, Analysts & Evaluators",
      targetWhatFor: "Standardized Project Performance Calculation & Benchmarking",
      directAnswer: "Here are the standard Project Management Institute (PMI) EVM formulas and your workspace's live values:",
      kpiPills: [
        { label: "CPI Formula", value: "EV / AC" },
        { label: "SPI Formula", value: "EV / PV" },
        { label: "EAC Formula", value: "BAC / CPI" },
        { label: "CV Formula", value: "EV - AC" }
      ],
      dataCardHtml: `
        • <strong>CPI (Cost Performance Index) = EV / AC</strong><br>
        &nbsp;&nbsp;Efficiency of money spent. Current value: <strong>${a.CPI.toFixed(2)}</strong> (${a.CPI>=1?'Under Budget':'Over Budget'}).<br><br>
        • <strong>SPI (Schedule Performance Index) = EV / PV</strong><br>
        &nbsp;&nbsp;Velocity of schedule progress. Current value: <strong>${a.SPI.toFixed(2)}</strong> (${a.SPI>=1?'Ahead':'Behind'}).<br><br>
        • <strong>EAC (Estimate at Completion) = BAC / CPI</strong><br>
        &nbsp;&nbsp;Forecasted final project cost: <strong>$${Math.round(a.EAC).toLocaleString()}</strong>.
      `,
      actionBoxText: `💡 <em>Test different cost scenarios using the <strong>What-If Simulator</strong> tab!</em>`
    });
  }

  // 25. Fallback / Universal Targeted Synthesizer
  return buildTargetedResponse({
    targetSubject: `Workspace Project Intelligence Analysis (${tasks.length} Tasks)`,
    targetWhoFor: "Project Lead & Cross-Functional Team Members",
    targetWhatFor: "Grounded Project Health Inspection & Milestone Tracking",
    directAnswer: `Grounded project analysis for your query across <strong>${tasks.length} tasks</strong> with a Health Score of <strong>${a.healthScore}/100 (${a.riskLevel} Risk)</strong>:`,
    kpiPills: [
      { label: "CPI Index", value: a.CPI.toFixed(2) },
      { label: "SPI Index", value: a.SPI.toFixed(2) },
      { label: "Active Tasks", value: `${a.inProgress}` },
      { label: "Blocked Items", value: `${a.blocked}` }
    ],
    dataCardHtml: `
      • <strong>Who has key actions:</strong> Sam Okafor (holds blocked security task #4) and Wei Zhang (QA suite #7).<br>
      • <strong>What is key priority:</strong> Complete Auth & RBAC and recover schedule pace to reach SPI 1.0.<br>
      • <strong>Financial Summary:</strong> Actual spent $${Math.round(a.AC).toLocaleString()} against $${Math.round(a.totalEst).toLocaleString()} budget.
    `,
    actionBoxText: `⚡ <strong>Targeted Tip:</strong> You can ask me specific questions like: <em>"Who is Sam Okafor?"</em>, <em>"Who is overloaded?"</em>, <em>"What tasks are blocked?"</em>, <em>"Who spent the most?"</em>, or <em>"What is our budget?"</em>.`
  });
}

async function sendChatMessage(){
  const input = document.getElementById('chat-input');
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  input.value = '';

  state.chatMessages.push({role:'user', content: text});
  renderChatMessages();

  setTimeout(()=>{
    const reply = generateTargetedAIResponse(text);
    state.chatMessages.push({role:'assistant', content: reply});
    renderChatMessages();
  }, 350);
}

function downloadTemplate(){
  const csv = 'Task Name,Status,Start Date,Due Date,% Complete,Priority,Assignee,Estimated Cost,Actual Cost\n'
    + 'Design Mockups,In Progress,2026-01-01,2026-01-15,60,High,Marcus Lin,2000,1200\n';
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'nicks_ai_template.csv'; a.click();
}

document.addEventListener('DOMContentLoaded', function(){
  if(state.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  setupDragAndDropUpload();
  renderRoleGrid();
  renderToolsGrid();
  renderGoalsGrid();
  if(state.user && state.user.email){ enterDashboard(); }
});

/* =====================================================================
   ENTERPRISE PLATFORM FUNCTIONS (Pillars 1-5)
===================================================================== */
function toggleNotificationCenter(){
  const pop = document.getElementById('notif-popover');
  if(pop) pop.classList.toggle('active');
}

function clearNotifs(){
  const badge = document.getElementById('notif-badge');
  if(badge){ badge.textContent = '0'; badge.style.display = 'none'; }
  const list = document.getElementById('notif-list');
  if(list){ list.innerHTML = '<div style="padding:16px; text-align:center; font-size:12px; color:var(--ink-soft);">All notifications cleared!</div>'; }
}

function renderTeamWorkload(){
  const body = document.getElementById('overview-workload-body');
  if(!body || !state.tasks) return;

  const memberMap = {};
  state.tasks.forEach(t => {
    const a = t.assignee || 'Unassigned';
    if(!memberMap[a]) memberMap[a] = { count:0, completed:0, est:0 };
    memberMap[a].count++;
    if(t.status === 'completed') memberMap[a].completed++;
    memberMap[a].est += (t.estCost || 0);
  });

  const members = Object.keys(memberMap);
  body.innerHTML = members.map(m => {
    const data = memberMap[m];
    const pct = Math.min(100, Math.round((data.count / state.tasks.length) * 220));
    const color = pct >= 80 ? '#E27A72' : pct >= 50 ? '#8A5FD1' : '#3DB88F';
    const statusText = pct >= 80 ? 'Heavy Workload ⚠️' : pct >= 50 ? 'Optimal Load ✅' : 'Available Capacity 🟢';
    return `
      <div class="workload-bar-wrap">
        <div class="workload-meta">
          <span><strong>${m}</strong> <span style="font-size:11px; color:var(--ink-faint);">(${data.count} Tasks)</span></span>
          <span style="color:${color};">${statusText} (${pct}%)</span>
        </div>
        <div class="workload-track">
          <div class="workload-fill" style="width:${pct}%; background:${color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAuditStream(){
  const body = document.getElementById('overview-audit-body');
  if(!body) return;

  const logs = [
    { time: '10:14 AM', user: 'Jordan Rivera', action: 'Updated status of Auth & RBAC Security Layer to In Progress' },
    { time: '10:02 AM', user: 'System Engine', action: 'Executed EVM calculation (CPI 0.90, SPI 0.93)' },
    { time: '09:45 AM', user: state.profile.fullName || 'User', action: 'Logged in with Enterprise Admin permissions' },
    { time: '09:30 AM', user: "Nick's AI Advisor", action: 'Generated 3 risk mitigation actions for blocked tasks' }
  ];

  body.innerHTML = `
    <div class="audit-feed">
      ${logs.map(l => `
        <div class="audit-entry">
          <span class="audit-time">${l.time}</span>
          <div><strong>${l.user}</strong> — ${l.action}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function render5x5RiskMatrix(){
  const container = document.getElementById('risk-matrix-container');
  if(!container) return;

  const matrixHTML = `
    <div class="risk-matrix-grid">
      <div style="font-weight:700; font-size:11px; color:var(--ink-faint);">PROBABILITY</div>
      <div style="font-weight:700; font-size:11px; color:var(--ink-faint);">Negligible</div>
      <div style="font-weight:700; font-size:11px; color:var(--ink-faint);">Minor</div>
      <div style="font-weight:700; font-size:11px; color:var(--ink-faint);">Moderate</div>
      <div style="font-weight:700; font-size:11px; color:var(--ink-faint);">Major</div>
      <div style="font-weight:700; font-size:11px; color:var(--ink-faint);">Critical</div>

      <div style="font-weight:700; font-size:11px; color:var(--ink-faint); display:flex; align-items:center; justify-content:center;">Very High</div>
      <div class="risk-cell cell-medium">Medium</div>
      <div class="risk-cell cell-high">High</div>
      <div class="risk-cell cell-high">High</div>
      <div class="risk-cell cell-critical">Critical</div>
      <div class="risk-cell cell-critical">Critical<br><span style="font-size:9px;">(Security Audit)</span></div>

      <div style="font-weight:700; font-size:11px; color:var(--ink-faint); display:flex; align-items:center; justify-content:center;">High</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-medium">Medium</div>
      <div class="risk-cell cell-high">High</div>
      <div class="risk-cell cell-high">High<br><span style="font-size:9px;">(E2E QA Suite)</span></div>
      <div class="risk-cell cell-critical">Critical</div>

      <div style="font-weight:700; font-size:11px; color:var(--ink-faint); display:flex; align-items:center; justify-content:center;">Medium</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-medium">Medium<br><span style="font-size:9px;">(Auth & RBAC)</span></div>
      <div class="risk-cell cell-high">High</div>
      <div class="risk-cell cell-high">High</div>

      <div style="font-weight:700; font-size:11px; color:var(--ink-faint); display:flex; align-items:center; justify-content:center;">Low</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-medium">Medium</div>
      <div class="risk-cell cell-medium">Medium</div>

      <div style="font-weight:700; font-size:11px; color:var(--ink-faint); display:flex; align-items:center; justify-content:center;">Very Low</div>
      <div class="risk-cell cell-low">Low<br><span style="font-size:9px;">(Design System)</span></div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-low">Low</div>
      <div class="risk-cell cell-medium">Medium</div>
    </div>
  `;
  container.innerHTML = matrixHTML;
}

/* =====================================================================
   NATIONAL HACKATHON EXECUTIVE AUDIT REPORT & PDF EXPORTER
===================================================================== */
function generateExecutiveReportHTML(standalone = false) {
  const tasks = (state.tasks && state.tasks.length) ? state.tasks : [];
  const a = state.analysis || (typeof analyzeProject === 'function' ? analyzeProject(tasks) : null);
  
  const userName = (state.profile && state.profile.fullName) || (state.user && state.user.name) || 'Nainesh Marde';
  const userRole = (state.role ? state.role.toUpperCase() : 'LEAD ARCHITECT & PRESENTER');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const total = a ? a.total : tasks.length;
  const completed = a ? a.completed : 0;
  const inProgress = a ? a.inProgress : 0;
  const blocked = a ? a.blocked : 0;
  const notStarted = a ? a.notStarted : 0;
  const overdueCount = a ? a.overdueCount : 0;
  const avgProgress = a ? a.avgProgress : 0;
  const totalEst = a ? a.totalEst : 0;
  const totalAct = a ? a.totalAct : 0;
  const EV = a ? a.EV : 0;
  const PV = a ? a.PV : 0;
  const AC = a ? a.AC : 0;
  const CV = a ? a.CV : 0;
  const SV = a ? a.SV : 0;
  const CPI = a ? a.CPI : 1.0;
  const SPI = a ? a.SPI : 1.0;
  const EAC = a ? a.EAC : totalEst;
  const healthScore = a ? a.healthScore : 74;
  const riskLevel = a ? a.riskLevel : 'Medium';

  const riskClass = riskLevel.toLowerCase();
  const cvFormatted = (CV >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(CV)).toLocaleString();

  // 1. Build Task Inventory Rows
  const taskRows = tasks.map((t, idx) => {
    const isOverdue = t.status !== 'completed' && t.due && new Date(t.due) < now;
    const dueDateStr = t.due ? new Date(t.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
    const est = t.estCost || 0;
    const act = t.actCost || 0;
    const varCost = est - act;
    const varColor = varCost > 0 ? '#16a34a' : varCost < 0 ? '#dc2626' : '#64748b';
    const varSign = varCost > 0 ? '+' : varCost < 0 ? '-' : '';

    let statusBadge = '<span class="rpt-badge rpt-badge-gray">Not Started</span>';
    if(t.status === 'completed') statusBadge = '<span class="rpt-badge rpt-badge-green">✓ Completed</span>';
    else if(t.status === 'in progress') statusBadge = '<span class="rpt-badge rpt-badge-blue">▶ In Progress</span>';
    else if(t.status === 'blocked') statusBadge = '<span class="rpt-badge rpt-badge-red">⚠ Blocked</span>';

    const pClass = (t.priority || 'medium').toLowerCase();
    const pBadge = pClass === 'high' ? 'rpt-badge-red' : pClass === 'medium' ? 'rpt-badge-amber' : 'rpt-badge-blue';

    return `
      <tr>
        <td style="text-align:center; font-family:'JetBrains Mono', monospace; font-size:7.2pt; color:#64748b; font-weight:600;">#${idx + 1}</td>
        <td>
          <strong style="color:#0f172a; font-size:7.5pt; line-height:1.25;">${t.name}</strong>
        </td>
        <td style="color:#334155; font-size:7.4pt; font-weight:500;">${t.assignee || 'Unassigned'}</td>
        <td style="text-align:center;"><span class="rpt-badge ${pBadge}">${t.priority || 'Medium'}</span></td>
        <td style="text-align:center;">${statusBadge}</td>
        <td style="text-align:right;">
          <div style="display:inline-flex; align-items:center; gap:6px; justify-content:flex-end;">
            <span style="font-weight:700; font-size:7.4pt; font-family:'JetBrains Mono', monospace;">${t.pct}%</span>
            <div style="width:32px; height:4.5px; background:#e2e8f0; border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${t.pct}%; background:${t.status==='completed'?'#10b981':'#6366f1'};"></div>
            </div>
          </div>
        </td>
        <td style="text-align:center;">
          <div style="display:inline-flex; flex-direction:column; align-items:center; gap:2px;">
            <span style="font-size:7.2pt; ${isOverdue ? 'color:#dc2626; font-weight:700;' : 'color:#475569; font-weight:500;'}">${dueDateStr}</span>
            ${isOverdue ? '<span style="font-size:5.8pt; background:#fef2f2; color:#dc2626; padding:0.5px 3.5px; border-radius:3px; font-weight:800; border:1px solid #fecaca; line-height:1.1;">LATE</span>' : ''}
          </div>
        </td>
        <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-size:7.4pt; color:${varColor}; font-weight:700;">
          ${varSign}$${Math.abs(varCost).toLocaleString()}
        </td>
      </tr>
    `;
  }).join('');

  // 2. Build Workload Rows
  const memberMap = {};
  tasks.forEach(t => {
    const aName = t.assignee || 'Unassigned';
    if(!memberMap[aName]) memberMap[aName] = { count: 0, completed: 0, activeBlocked: 0 };
    memberMap[aName].count++;
    if(t.status === 'completed') memberMap[aName].completed++;
    else memberMap[aName].activeBlocked++;
  });

  const workloadRows = Object.keys(memberMap).map(m => {
    const d = memberMap[m];
    const pct = Math.min(100, Math.round((d.count / (tasks.length || 1)) * 220));
    let statusText = '<span class="rpt-badge rpt-badge-green" style="font-size:6.5pt;">Available Capacity 🟢</span>';
    if(pct >= 80) statusText = '<span class="rpt-badge rpt-badge-red" style="font-size:6.5pt;">Heavy Workload ⚠️</span>';
    else if(pct >= 50) statusText = '<span class="rpt-badge rpt-badge-blue" style="font-size:6.5pt;">Optimal Capacity ✅</span>';

    return `
      <tr>
        <td style="font-size:7.5pt;"><strong>${m}</strong></td>
        <td style="text-align:center; font-weight:700; font-size:7.4pt; font-family:'JetBrains Mono', monospace;">${d.count} ${d.count === 1 ? 'Task' : 'Tasks'}</td>
        <td style="text-align:center; color:#16a34a; font-weight:700; font-size:7.4pt; font-family:'JetBrains Mono', monospace;">${d.completed}</td>
        <td style="text-align:center; color:${d.activeBlocked > 1 ? '#dc2626' : '#475569'}; font-weight:700; font-size:7.4pt; font-family:'JetBrains Mono', monospace;">${d.activeBlocked}</td>
        <td style="text-align:center;">${statusText}</td>
      </tr>
    `;
  }).join('');

  // 3. Blocked task names for AI Sentinel
  const blockedTasksList = tasks.filter(t => t.status === 'blocked').map(t => t.name);
  const blockedNames = blockedTasksList.length 
    ? blockedTasksList.join('; ') 
    : 'No critical blockers detected on active sprint tasks.';

  // Build Sheet 1 and Sheet 2 HTML
  const sheetsHTML = `
    <!-- ==================== SHEET 1: EXECUTIVE BRIEFING & EVM ==================== -->
    <div class="report-sheet" id="report-sheet-1">
      <div class="rpt-sheet-body">
        <div class="rpt-header">
          <div class="rpt-brand-row">
            <div class="rpt-brand">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" height="26" style="display:inline-block; vertical-align:middle;">
                <defs>
                  <linearGradient id="rpt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#06b6d4" />
                    <stop offset="100%" stop-color="#3b82f6" />
                  </linearGradient>
                </defs>
                <g transform="translate(2, 4)">
                  <circle cx="20" cy="20" r="18" fill="url(#rpt-grad)" opacity="0.2"/>
                  <circle cx="20" cy="20" r="13" fill="url(#rpt-grad)"/>
                  <path d="M14 20 L26 20 M20 14 L20 26" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
                  <text x="46" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#0f172a" letter-spacing="-0.5px">Nick's <tspan fill="#06b6d4">ai</tspan></text>
                </g>
              </svg>
              <div class="rpt-subbrand">Enterprise AI Project Health & Predictive Management Platform</div>
            </div>
            <div class="rpt-meta-right">
              <div class="rpt-security-badge">NATIONAL HACKATHON BRIEFING · CONFIDENTIAL</div>
              <div class="rpt-date">Generated: ${dateStr}</div>
            </div>
          </div>

          <div class="rpt-title-box">
            <div class="rpt-title-left">
              <h1 class="rpt-main-title">Executive Project Health & EVM Performance Audit</h1>
              <p class="rpt-main-desc">Official Project Portfolio Audit, Predictive Risk Sentinel Analysis, and Earned Value Performance Metrics</p>
            </div>
            <div class="rpt-title-right">
              <div class="rpt-status-pill ${riskClass}">
                <span class="rpt-status-dot"></span>
                <span>Health Score: ${healthScore}/100 · ${riskLevel} Risk</span>
              </div>
            </div>
          </div>

          <div class="rpt-meta-grid">
            <div class="rpt-meta-col">
              <div class="rpt-meta-lbl">PROJECT NAME</div>
              <div class="rpt-meta-val">Enterprise AI Core Platform Migration</div>
            </div>
            <div class="rpt-meta-col">
              <div class="rpt-meta-lbl">PREPARED BY</div>
              <div class="rpt-meta-val">${userName} (${userRole})</div>
            </div>
            <div class="rpt-meta-col">
              <div class="rpt-meta-lbl">REPORTING PERIOD</div>
              <div class="rpt-meta-val">Active Sprint · Milestone 2 Audit</div>
            </div>
            <div class="rpt-meta-col">
              <div class="rpt-meta-lbl">AI RISK SENTINEL</div>
              <div class="rpt-meta-val" style="color:#0284c7;">Active Probabilistic (1,000 iterations)</div>
            </div>
          </div>
        </div>

        <!-- 1. Executive Health Scorecard -->
        <div class="rpt-section">
          <div class="rpt-sec-title">1. Executive Health Scorecard & Performance Highlights</div>
          <div class="rpt-kpi-grid">
            <div class="rpt-kpi-card">
              <div class="rpt-kpi-label">TOTAL WORK PACKAGES</div>
              <div class="rpt-kpi-val">${total} Tasks</div>
              <div class="rpt-kpi-sub">${completed} Done · ${inProgress} Active · ${blocked} Blocked</div>
            </div>
            <div class="rpt-kpi-card">
              <div class="rpt-kpi-label">OVERALL PROGRESS</div>
              <div class="rpt-kpi-val">${Math.round(avgProgress)}%</div>
              <div class="rpt-kpi-sub">${completed} of ${total} deliverables completed</div>
            </div>
            <div class="rpt-kpi-card">
              <div class="rpt-kpi-label">BUDGET EXPENDITURE</div>
              <div class="rpt-kpi-val">$${Math.round(totalAct).toLocaleString()}</div>
              <div class="rpt-kpi-sub">Est: $${Math.round(totalEst).toLocaleString()} · Var: ${cvFormatted}</div>
            </div>
            <div class="rpt-kpi-card">
              <div class="rpt-kpi-label">SCHEDULE TIMELINE PACE</div>
              <div class="rpt-kpi-val" style="color:${overdueCount>0?'#dc2626':'#16a34a'};">${overdueCount} At-Risk Tasks</div>
              <div class="rpt-kpi-sub">SPI: ${SPI.toFixed(2)} (${SPI >= 1 ? 'On Pace' : 'Lagging Target'})</div>
            </div>
          </div>
        </div>

        <!-- 2. Earned Value Management (EVM) Table -->
        <div class="rpt-section">
          <div class="rpt-sec-title">2. Earned Value Management (EVM) Financial & Velocity Audit</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th style="width:23%;">EVM Metric</th>
                <th style="width:10%; text-align:center;">Code</th>
                <th style="width:18%; text-align:right;">Audited Value</th>
                <th style="width:18%; text-align:right;">Baseline / Target</th>
                <th style="width:31%;">Status & Executive Assessment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Budget at Completion</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">BAC</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700;">$${Math.round(totalEst).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">$${Math.round(totalEst).toLocaleString()}</td>
                <td>Total authorized baseline budget</td>
              </tr>
              <tr>
                <td><strong>Planned Value</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">PV</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700;">$${Math.round(PV).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">$${Math.round(PV).toLocaleString()}</td>
                <td>Scheduled delivery value expected to date</td>
              </tr>
              <tr>
                <td><strong>Earned Value</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">EV</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700; color:#0284c7;">$${Math.round(EV).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">$${Math.round(PV).toLocaleString()}</td>
                <td>Physical value of work delivered to date</td>
              </tr>
              <tr>
                <td><strong>Actual Cost</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">AC</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700;">$${Math.round(AC).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">$${Math.round(EV).toLocaleString()}</td>
                <td>Total financial expenditure incurred</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td><strong>Cost Variance (EV - AC)</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">CV</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700; color:${CV>=0?'#16a34a':'#dc2626'};">${CV>=0?'+':''}$${Math.round(CV).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">&ge; $0.00</td>
                <td>${CV>=0 ? '<span class="rpt-badge rpt-badge-green">Under Budget</span>' : '<span class="rpt-badge rpt-badge-red">Cost Overrun</span>'}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td><strong>Schedule Variance (EV - PV)</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">SV</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700; color:${SV>=0?'#16a34a':'#ea580c'};">${SV>=0?'+':''}$${Math.round(SV).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">&ge; $0.00</td>
                <td>${SV>=0 ? '<span class="rpt-badge rpt-badge-green">Ahead of Schedule</span>' : '<span class="rpt-badge rpt-badge-amber">Behind Schedule</span>'}</td>
              </tr>
              <tr>
                <td><strong>Cost Performance Index</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">CPI</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:800; color:${CPI>=1?'#16a34a':'#dc2626'}; font-size:8pt;">${CPI.toFixed(2)}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">&ge; 1.00</td>
                <td>${CPI>=1 ? 'Delivering ' + (CPI*100).toFixed(0) + '¢ value per $1 spent' : 'Delivering ' + (CPI*100).toFixed(0) + '¢ value per $1 spent'}</td>
              </tr>
              <tr>
                <td><strong>Schedule Performance Index</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">SPI</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:800; color:${SPI>=1?'#16a34a':'#ea580c'}; font-size:8pt;">${SPI.toFixed(2)}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">&ge; 1.00</td>
                <td>${SPI>=1 ? 'Delivering at planned velocity' : 'Operating at ' + (SPI*100).toFixed(0) + '% of planned speed'}</td>
              </tr>
              <tr>
                <td><strong>Estimate at Completion</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">EAC</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700;">$${Math.round(EAC).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">$${Math.round(totalEst).toLocaleString()}</td>
                <td>Projected total cost based on current efficiency</td>
              </tr>
              <tr>
                <td><strong>Variance at Completion</strong></td>
                <td style="text-align:center;"><span class="rpt-code-pill">VAC</span></td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace; font-weight:700; color:${(totalEst-EAC)>=0?'#16a34a':'#dc2626'};">${(totalEst-EAC)>=0?'+':''}$${Math.round(totalEst-EAC).toLocaleString()}</td>
                <td style="text-align:right; font-family:'JetBrains Mono', monospace;">&ge; $0.00</td>
                <td>${(totalEst-EAC)>=0 ? 'Projected budget surplus' : 'Projected budget deficit at project close'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. AI Sentinel Predictive Insights -->
        <div class="rpt-section">
          <div class="rpt-sec-title">3. AI Sentinel Predictive Synthesis & Risk Insights</div>
          <div class="rpt-callout-grid">
            <div class="rpt-callout rpt-callout-red">
              <div class="rpt-callout-title">🚨 Critical Bottlenecks (${blocked} Tasks Blocked)</div>
              <p class="rpt-callout-p">${blockedNames}</p>
            </div>
            <div class="rpt-callout rpt-callout-amber">
              <div class="rpt-callout-title">💰 Budget Variance Trajectory</div>
              <p class="rpt-callout-p">At current CPI of ${CPI.toFixed(2)}, project will experience a $${Math.abs(Math.round(totalEst - EAC)).toLocaleString()} overrun unless sprint backlog is optimized.</p>
            </div>
            <div class="rpt-callout rpt-callout-blue">
              <div class="rpt-callout-title">⚡ Hackathon Key Takeaway</div>
              <p class="rpt-callout-p">Nick's ai automated EVM calculations surfaced schedule drag (SPI: ${SPI.toFixed(2)}) ahead of critical milestone gates, enabling pre-emptive resource reallocation.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="rpt-footer">
        <div>Nick's ai Enterprise Platform — Predictive Project Health & Risk Sentinel</div>
        <div>Strictly Confidential — National Hackathon Presentation</div>
        <div>Page 1 of 2</div>
      </div>
    </div>

    <!-- ==================== SHEET 2: COMPLETE TASK INVENTORY & WORKLOAD ==================== -->
    <div class="report-sheet" id="report-sheet-2">
      <div class="rpt-sheet-body">
        <div class="rpt-header-mini">
          <div class="rpt-brand-mini">Nick's <strong>ai</strong> Enterprise Platform · Detailed Deliverable Inventory & Audit Ledger</div>
          <div class="rpt-meta-mini">Page 2 of 2 · Confidential Executive Briefing</div>
        </div>

        <!-- 4. Complete Deliverable Inventory Table -->
        <div class="rpt-section">
          <div class="rpt-sec-title">4. Deliverable Inventory & Risk Execution Audit (${tasks.length} Work Packages)</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th style="width:5%; text-align:center;">#</th>
                <th style="width:27%;">Task Name & Deliverable</th>
                <th style="width:14%;">Assignee</th>
                <th style="width:10%; text-align:center;">Priority</th>
                <th style="width:13%; text-align:center;">Status</th>
                <th style="width:11%; text-align:right;">Progress</th>
                <th style="width:9%; text-align:center;">Due Date</th>
                <th style="width:11%; text-align:right;">Cost Var</th>
              </tr>
            </thead>
            <tbody>
              ${taskRows}
            </tbody>
          </table>
        </div>

        <!-- 5. Resource Workload Allocation -->
        <div class="rpt-section">
          <div class="rpt-sec-title">5. Resource Capacity & Team Workload Distribution</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th style="width:28%;">Team Member / Resource</th>
                <th style="width:16%; text-align:center;">Assigned Tasks</th>
                <th style="width:16%; text-align:center;">Completed</th>
                <th style="width:18%; text-align:center;">Active / Blocked</th>
                <th style="width:22%; text-align:center;">Capacity Assessment</th>
              </tr>
            </thead>
            <tbody>
              ${workloadRows}
            </tbody>
          </table>
        </div>

        <!-- 6. Official Sign-off & Verification Box -->
        <div class="rpt-signoff-box">
          <div class="rpt-signoff-item">
            <div class="rpt-so-lbl">PREPARED & CERTIFIED BY</div>
            <div class="rpt-so-val">${userName}</div>
            <div class="rpt-so-sub">Lead Platform Architect & Hackathon Presenter</div>
          </div>
          <div class="rpt-signoff-item">
            <div class="rpt-so-lbl">AI SENTINEL ENGINE</div>
            <div class="rpt-so-val">Verified Probabilistic Model</div>
            <div class="rpt-so-sub">Audit Reference: NCK-AI-2026-HCK</div>
          </div>
          <div class="rpt-signoff-item">
            <div class="rpt-so-lbl">SIGN-OFF TIMESTAMP</div>
            <div class="rpt-so-val">${dateStr}</div>
            <div class="rpt-so-sub">Digital Status: VALIDATED & LOCKED</div>
          </div>
        </div>
      </div>

      <div class="rpt-footer">
        <div>Nick's ai Enterprise Platform — Predictive Project Health & Risk Sentinel</div>
        <div>Strictly Confidential — National Hackathon Presentation</div>
        <div>Page 2 of 2</div>
      </div>
    </div>
  `;

  if(standalone) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="${window.location.origin}/">
  <title>Executive Project Health & EVM Audit Report — Nick's ai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
  <style>
    body { background: #0f172a; margin: 0; padding: 20px 0; display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .standalone-bar { width: 100%; max-width: 820px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; padding: 10px 18px; background: rgba(255,255,255,0.08); border-radius: 8px; color: white; }
    @media print {
      body { background: white !important; padding: 0 !important; margin: 0 !important; display: block !important; }
      .standalone-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="standalone-bar no-print">
    <div style="font-weight:700; font-size:14px;">Nick's ai — National Hackathon Executive Audit Report</div>
    <button onclick="window.print()" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border:none; color:white; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  ${sheetsHTML}
</body>
</html>`;
  }

  return sheetsHTML;
}

function openExecutiveReportModal() {
  const content = document.getElementById('report-modal-content');
  if(content) {
    content.innerHTML = generateExecutiveReportHTML(false);
  }
  const modal = document.getElementById('modal-report-viewer');
  if(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeExecutiveReportModal() {
  const modal = document.getElementById('modal-report-viewer');
  if(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function openReportInNewTab() {
  const html = generateExecutiveReportHTML(true);
  const win = window.open('', '_blank');
  if(win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}

function exportExecutiveReport() {
  // 1. Refresh analysis from current state
  if(!state.analysis && state.tasks && typeof analyzeProject === 'function') {
    state.analysis = analyzeProject(state.tasks);
  }

  // 2. Open the dedicated executive report viewer modal
  openExecutiveReportModal();

  // 3. Immediately trigger window.print() so the Chrome Print dialog opens with the pristine 2-page report
  setTimeout(() => {
    window.print();
  }, 350);
}



/* =====================================================================
   CALENDAR & MEETING SCHEDULER LOGIC
===================================================================== */
if(!state.meetings){
  state.meetings = [
    {
      id: 101,
      title: "Sprint & EVM Performance Review",
      datetime: "2026-09-03T15:00",
      duration: "45",
      emails: "test@example.com, jordan@company.com, marcus@company.com",
      link: "https://meet.google.com/nicks-ai-evm",
      notes: "Review CPI 0.90, SPI 0.93, and reallocate team capacity for blocked QA tasks."
    },
    {
      id: 102,
      title: "Security & Vulnerability Audit Sync",
      datetime: "2026-09-04T11:00",
      duration: "30",
      emails: "test@example.com, wei@company.com, auditor@company.com",
      link: "https://meet.google.com/nicks-ai-security",
      notes: "Urgent alignment on overdue security vulnerability audit checklist."
    }
  ];
}

function openScheduleMeetingModal(){
  const modal = document.getElementById('modal-meeting');
  if(!modal) return;
  modal.classList.add('active');

  // Pre-fill datetime to today 2 hours from now
  const now = new Date();
  now.setHours(now.getHours() + 2, 0, 0, 0);
  const isoStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
  document.getElementById('m-datetime').value = isoStr;

  // Pre-fill user email
  const userEmail = state.profile.email || state.user?.email || 'you@company.com';
  document.getElementById('m-emails').value = `${userEmail}, jordan@company.com, marcus@company.com`;
}

function closeScheduleMeetingModal(){
  const modal = document.getElementById('modal-meeting');
  if(modal) modal.classList.remove('active');
}


/* =====================================================================
   CALENDAR & EVENT EDITING ENHANCEMENTS
===================================================================== */
function openScheduleMeetingModalWithDate(dateStr){
  openScheduleMeetingModal();
  if(dateStr){
    document.getElementById('m-datetime').value = dateStr + 'T10:00';
  }
}

function openEditMeetingModal(id){
  const meeting = (state.meetings || []).find(m => m.id == id);
  if(!meeting) return;

  const modal = document.getElementById('modal-meeting');
  if(!modal) return;
  modal.classList.add('active');

  document.getElementById('modal-meeting-title').textContent = '✏️ Edit Calendar Event & Invites';
  document.getElementById('m-edit-id').value = meeting.id;
  document.getElementById('m-title').value = meeting.title;
  document.getElementById('m-datetime').value = meeting.datetime;
  document.getElementById('m-duration').value = meeting.duration || '45';
  document.getElementById('m-emails').value = meeting.emails || '';
  document.getElementById('m-link').value = meeting.link || 'https://meet.google.com/nicks-ai-sync';
  document.getElementById('m-notes').value = meeting.notes || '';
}

function deleteMeeting(id){
  if(!confirm('Are you sure you want to delete this event?')) return;
  state.meetings = (state.meetings || []).filter(m => m.id != id);
  saveState();
  showToast('🗑️ Event deleted from calendar');
  renderCalendarTab();
}

function openScheduleMeetingModal(){
  const modal = document.getElementById('modal-meeting');
  if(!modal) return;
  modal.classList.add('active');

  document.getElementById('modal-meeting-title').textContent = '📅 Schedule Team Meeting & Email Invites';
  document.getElementById('m-edit-id').value = '';
  document.getElementById('m-title').value = '';
  
  const now = new Date();
  now.setHours(now.getHours() + 2, 0, 0, 0);
  const isoStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
  document.getElementById('m-datetime').value = isoStr;

  const userEmail = state.profile.email || state.user?.email || 'you@company.com';
  document.getElementById('m-emails').value = `${userEmail}, jordan@company.com, marcus@company.com`;
  document.getElementById('m-notes').value = '';
}

function handleCreateMeeting(){
  const editId = document.getElementById('m-edit-id').value;
  const title = document.getElementById('m-title').value.trim();
  const datetime = document.getElementById('m-datetime').value;
  const duration = document.getElementById('m-duration').value;
  const emails = document.getElementById('m-emails').value.trim();
  const link = document.getElementById('m-link').value.trim() || 'https://meet.google.com/nicks-ai-sync';
  const notes = document.getElementById('m-notes').value.trim();

  if(!title || !datetime || !emails){
    showToast('❌ Fill in Title, Date & Time, and Attendee Emails');
    return;
  }

  if(!state.meetings) state.meetings = [];

  if(editId){
    // Update existing event
    const idx = state.meetings.findIndex(m => m.id == editId);
    if(idx !== -1){
      state.meetings[idx] = { id: Number(editId), title, datetime, duration, emails, link, notes };
      showToast('✏️ Calendar Event Updated!');
    }
  } else {
    // Add new event
    const meeting = { id: Date.now(), title, datetime, duration, emails, link, notes };
    state.meetings.unshift(meeting);
    sendDirectEmailNotification(meeting);
  }

  saveState();
  closeScheduleMeetingModal();
  renderCalendarTab();
}

function sendDirectEmailNotification(m){
  const formattedDate = new Date(m.datetime).toLocaleString();
  const subject = encodeURIComponent(`📅 Meeting Invite: ${m.title}`);
  const bodyText = encodeURIComponent(
    `Hi Team,

You have been invited to a meeting in Nick's ai.

` +
    `📌 Meeting: ${m.title}
` +
    `📅 Date & Time: ${formattedDate} (${m.duration} mins)
` +
    `🔗 Meeting Link: ${m.link}
` +
    `📝 Agenda / Notes: ${m.notes || 'Project Sync'}

` +
    `Automated email notification generated by Nick's ai Platform.`
  );

  const mailtoUrl = `mailto:${m.emails}?subject=${subject}&body=${bodyText}`;

  // Show Toast Confirmation
  showToast(`📧 Email Notifications dispatched to: ${m.emails.split(',')[0]} & team!`);

  // Open default email client or Google Calendar URL
  setTimeout(() => {
    window.open(mailtoUrl, '_blank');
  }, 600);
}

function renderCalendarTab(){
  const gridContainer = document.getElementById('calendar-grid-container');
  const meetingsList = document.getElementById('calendar-meetings-list');
  if(!gridContainer || !meetingsList) return;

  // 1. Render Interactive Calendar Grid (Month View)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let calHTML = `
    <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:6px; font-size:12px; text-align:center;">
      ${days.map(d=>`<div style="font-weight:700; color:var(--ink-faint); padding:6px 0;">${d}</div>`).join('')}
  `;

  // Render 30 days for September 2026
  for(let day=1; day<=30; day++){
    const dayPadded = day < 10 ? '0' + day : day;
    const dateStr = `2026-09-${dayPadded}`;
    const isToday = day === 3;
    const hasMeeting = day === 3 || day === 4;
    const hasMilestone = day === 5 || day === 12;

    calHTML += `
      <div onclick="openScheduleMeetingModalWithDate('${dateStr}')" title="Click to add event on Sep ${day}" style="min-height:64px; border:1px solid var(--border-soft); border-radius:var(--radius-sm); padding:6px; background:${isToday ? 'var(--lav-50)' : 'var(--surface)'}; text-align:left; cursor:pointer; transition:transform 0.15s;" onmouseover="this.style.borderColor='var(--purple)'" onmouseout="this.style.borderColor='var(--border-soft)'">
        <div style="font-weight:700; font-size:11px; color:${isToday ? 'var(--purple)' : 'var(--ink)'};">
          ${day} ${isToday ? '<span style="font-size:9px; background:var(--purple); color:white; padding:1px 4px; border-radius:4px; margin-left:2px;">TODAY</span>' : ''}
        </div>
        ${hasMeeting ? `<div style="font-size:9.5px; background:var(--mint-bg); color:var(--mint); padding:2px 4px; border-radius:4px; margin-top:4px; font-weight:700; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">📅 Team Sync</div>` : ''}
        ${hasMilestone ? `<div style="font-size:9.5px; background:var(--amber-bg); color:var(--amber); padding:2px 4px; border-radius:4px; margin-top:2px; font-weight:700; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">🎯 Due Date</div>` : ''}
      </div>
    `;
  }
  calHTML += `</div>`;
  gridContainer.innerHTML = calHTML;

  // 2. Render Scheduled Meetings List with Edit & Delete actions
  const meetings = state.meetings || [];
  document.getElementById('cal-stat-meetings').textContent = meetings.length;

  if(!meetings.length){
    meetingsList.innerHTML = `<p style="color:var(--ink-soft); font-size:13px;">No meetings scheduled yet. Click any calendar date or "+ Schedule New Meeting" above.</p>`;
    return;
  }

  meetingsList.innerHTML = meetings.map(m => {
    const formattedDate = new Date(m.datetime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
    return `
      <div style="background:var(--lav-50); border:1px solid var(--border-soft); border-radius:var(--radius-sm); padding:14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <h4 style="font-size:14px; font-weight:700; color:var(--ink); margin:0;">${m.title}</h4>
          <span style="font-size:11px; font-weight:700; background:var(--mint-bg); color:var(--mint); padding:2px 8px; border-radius:999px;">${m.duration} mins</span>
        </div>
        <div style="font-size:12.5px; color:var(--ink-soft); margin-bottom:6px;">
          📅 <strong>${formattedDate}</strong> · 🔗 <a href="${m.link}" target="_blank" style="color:var(--purple); font-weight:600;">Join Video Call</a>
        </div>
        <div style="font-size:12px; color:var(--ink-faint); margin-bottom:10px;">
          👥 <strong>Attendees:</strong> ${m.emails}
        </div>
        ${m.notes ? `<div style="font-size:12px; background:var(--surface); padding:8px 10px; border-radius:6px; border:1px solid var(--border-soft); color:var(--ink-soft); margin-bottom:10px;">📝 <strong>Agenda:</strong> ${m.notes}</div>` : ''}
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick='openEditMeetingModal(${m.id})'>
            ✏️ Edit Event
          </button>
          <button class="btn btn-outline btn-sm" onclick='sendDirectEmailNotification(${JSON.stringify(m).replace(/'/g, "&apos;")})'>
            📧 Resend Email Invite
          </button>
          <button class="btn btn-danger btn-sm" onclick='deleteMeeting(${m.id})'>
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* =====================================================================
   LEGAL CENTER & STATUTORY DPDP ACT / GDPR COMPLIANCE CONTROLLER
===================================================================== */
function openLegalModal(tabId) {
  const modal = document.getElementById('modal-legal');
  if(!modal) return;
  modal.classList.add('active');
  if(tabId) {
    switchLegalTab(tabId);
  }
}

function closeLegalModal() {
  const modal = document.getElementById('modal-legal');
  if(modal) modal.classList.remove('active');
}

function switchLegalTab(tabId) {
  if(tabId === 'dpdp') tabId = 'privacy';

  const validTabs = ['privacy', 'terms', 'cookies', 'refund', 'business', 'risk'];
  if(!validTabs.includes(tabId)) tabId = 'privacy';

  validTabs.forEach(t => {
    const btn = document.getElementById('ltab-' + t);
    const panel = document.getElementById('panel-' + t);
    if(btn) {
      btn.classList.toggle('active', t === tabId);
      btn.setAttribute('aria-selected', t === tabId ? 'true' : 'false');
    }
    if(panel) {
      panel.classList.toggle('active', t === tabId);
    }
  });

  const body = document.querySelector('.legal-modal-body');
  if(body) body.scrollTop = 0;
}

/* =====================================================================
   COOKIE & LOCAL STORAGE CONSENT CONTROLLER (DPDP ACT & GDPR)
===================================================================== */
function initCookieConsent() {
  const consent = localStorage.getItem('nicks_ai_cookie_consent');
  const banner = document.getElementById('cookie-consent-banner');
  if(!banner) return;

  if(!consent) {
    setTimeout(() => {
      banner.classList.add('active');
    }, 600);
  }
}

function acceptAllCookies() {
  const choice = {
    essential: true,
    functional: true,
    analytics: true,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('nicks_ai_cookie_consent', JSON.stringify(choice));
  const banner = document.getElementById('cookie-consent-banner');
  if(banner) banner.classList.remove('active');
  showToast('✓ Storage preferences recorded: All enabled.');
}

function rejectOptionalCookies() {
  const choice = {
    essential: true,
    functional: false,
    analytics: false,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('nicks_ai_cookie_consent', JSON.stringify(choice));
  const banner = document.getElementById('cookie-consent-banner');
  if(banner) banner.classList.remove('active');
  showToast('✓ Storage preferences recorded: Strictly necessary only.');
}

function toggleCookiePreferencesDrawer() {
  const drawer = document.getElementById('cookie-prefs-drawer');
  const saveBtn = document.getElementById('btn-save-prefs');
  if(!drawer) return;
  const isHidden = drawer.style.display !== 'flex';
  drawer.style.display = isHidden ? 'flex' : 'none';
  if(saveBtn) saveBtn.style.display = isHidden ? 'inline-flex' : 'none';
}

function saveCustomCookiePreferences() {
  const functionalChecked = document.getElementById('pref-functional') ? document.getElementById('pref-functional').checked : true;
  const analyticsChecked = document.getElementById('pref-analytics') ? document.getElementById('pref-analytics').checked : false;

  const choice = {
    essential: true,
    functional: functionalChecked,
    analytics: analyticsChecked,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('nicks_ai_cookie_consent', JSON.stringify(choice));
  const banner = document.getElementById('cookie-consent-banner');
  if(banner) banner.classList.remove('active');
  showToast('✓ Granular storage preferences saved.');
}

function openCookieConsentPreferences() {
  const banner = document.getElementById('cookie-consent-banner');
  if(!banner) return;
  banner.classList.add('active');
  const drawer = document.getElementById('cookie-prefs-drawer');
  const saveBtn = document.getElementById('btn-save-prefs');
  if(drawer) drawer.style.display = 'flex';
  if(saveBtn) saveBtn.style.display = 'inline-flex';
}

/* =====================================================================
   GLOBAL ACCESSIBILITY & KEYBOARD SHORTCUTS (ESC TO CLOSE MODALS)
===================================================================== */
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeLegalModal();
    if(typeof closeScheduleMeetingModal === 'function') closeScheduleMeetingModal();
    if(typeof closeTaskModal === 'function') closeTaskModal();
    if(typeof closeExecutiveReportModal === 'function') closeExecutiveReportModal();
    const notifPop = document.getElementById('notif-popover');
    if(notifPop && notifPop.classList.contains('active')) notifPop.classList.remove('active');
  }
});

/* =====================================================================
   URL HASH ROUTER FOR DIRECT LEGAL POLICY LINKS
===================================================================== */
function handleLegalHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  const legalTabs = ['privacy', 'terms', 'cookies', 'refund', 'business', 'risk', 'dpdp'];
  if(legalTabs.includes(hash)) {
    openLegalModal(hash);
  }
}

window.addEventListener('hashchange', handleLegalHash);
document.addEventListener('DOMContentLoaded', function() {
  initCookieConsent();
  handleLegalHash();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initCookieConsent();
  handleLegalHash();
}
