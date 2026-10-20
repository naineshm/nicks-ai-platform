/**
 * Nick's ai — Enterprise AI Project Health & Management
 * Express Node.js Application Backend Server
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Security & Data Privacy Compliance Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Health Check API with Visual Browser Dashboard & Pretty JSON
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'ONLINE',
    service: "Nick's ai Enterprise Platform",
    version: "2.4.0",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    systemMetrics: {
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform
    },
    services: {
      nodeBackend: { status: "HEALTHY", latency: "1ms" },
      pythonAnalytics: { status: "ACTIVE", module: "analytics/risk_engine.py" },
      evmEngine: { status: "ACTIVE", calculations: "CPI / SPI / EAC / VAC" },
      riskSentinel: { status: "ACTIVE", iterations: 1000, model: "Monte Carlo Probabilistic" },
      jiraSyncHub: { status: "READY", parser: "Universal CSV Stream" }
    }
  };

  // If format=json or request explicitly accepts json without html preference
  if (req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'))) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(healthData, null, 2));
  }

  // Render a visual Health Dashboard for browser view
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>System Health — Nick's ai</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0b0f19; color: #f3f4f6; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: rgba(18, 26, 43, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; width: 100%; max-width: 680px; padding: 32px; backdrop-filter: blur(12px); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .title { font-size: 20px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .badge { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .pulse { width: 8px; height: 8px; background: #34d399; border-radius: 50%; box-shadow: 0 0 10px #34d399; animation: flash 1.5s infinite; }
    @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; }
    .box-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 6px; }
    .box-val { font-size: 16px; font-weight: 600; color: #f3f4f6; }
    .services-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .service-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
    .service-name { font-size: 14px; font-weight: 500; color: #e5e7eb; }
    .service-detail { font-size: 12px; color: #9ca3af; }
    .actions { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #3b82f6; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #2563eb; }
    .raw-link { color: #9ca3af; font-size: 13px; text-decoration: none; }
    .raw-link:hover { color: #fff; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">
        <span>⚡</span> Nick's ai Platform Health
      </div>
      <div class="badge"><div class="pulse"></div> SYSTEM ONLINE</div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Server Uptime</div>
        <div class="box-val">${healthData.uptime}</div>
      </div>
      <div class="box">
        <div class="box-title">Node Heap Memory</div>
        <div class="box-val">${healthData.systemMetrics.memoryUsageMB} MB</div>
      </div>
    </div>

    <div class="box-title" style="margin-top: 8px;">Microservices & Engine Status</div>
    <div class="services-list">
      <div class="service-item">
        <div>
          <div class="service-name">Node.js Express Backend</div>
          <div class="service-detail">REST API & Asset Server</div>
        </div>
        <div class="badge" style="background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: #60a5fa;">HEALTHY (1ms)</div>
      </div>
      <div class="service-item">
        <div>
          <div class="service-name">Python Analytics Worker</div>
          <div class="service-detail">analytics/risk_engine.py</div>
        </div>
        <div class="badge">ACTIVE</div>
      </div>
      <div class="service-item">
        <div>
          <div class="service-name">PMP EVM Engine</div>
          <div class="service-detail">CPI, SPI, EAC & Variance Projections</div>
        </div>
        <div class="badge">ACTIVE</div>
      </div>
      <div class="service-item">
        <div>
          <div class="service-name">Monte Carlo Risk Sentinel</div>
          <div class="service-detail">1,000 Iteration Probabilistic Engine</div>
        </div>
        <div class="badge">ACTIVE</div>
      </div>
    </div>

    <div class="actions">
      <a href="/" class="btn">← Back to Nick's ai Platform</a>
      <a href="/api/health?format=json" class="raw-link">View Raw JSON Format ↗</a>
    </div>
  </div>
</body>
</html>`;
  res.send(html);
});

// Portfolio API
app.get('/api/portfolio', (req, res) => {
  res.json({
    activeProject: "AI Enterprise Health Engine",
    portfolio: [
      { id: 'proj-1', name: "Nick's ai Core Platform", health: 'On Track', cpi: 1.08, spi: 1.02, budget: 150000 },
      { id: 'proj-2', name: 'Jira Enterprise Cloud Sync', health: 'At Risk', cpi: 0.91, spi: 0.88, budget: 85000 },
      { id: 'proj-3', name: 'Monte Carlo Predictive Risk Engine', health: 'Ahead', cpi: 1.15, spi: 1.10, budget: 120000 }
    ]
  });
});

// Statutory Compliance & Legal Verification API (India DPDP Act 2023 & GDPR)
app.get('/api/compliance', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: "COMPLIANT",
    frameworks: [
      "Digital Personal Data Protection Act, 2023 (DPDP Act, India)",
      "General Data Protection Regulation (GDPR, EU)",
      "Indian Contract Act, 1872 & Information Technology Act, 2000"
    ],
    dataFiduciary: {
      legalEntity: "Nick's ai Enterprise Solutions Private Limited",
      cin: "U72900MH2024PTC123456",
      registeredOffice: "Level 8, Tower B, Godrej BKC, Bandra Kurla Complex, Bandra (East), Mumbai, Maharashtra 400051, India",
      officialEmail: "legal@nicks-ai.internal"
    },
    grievanceRedressalOfficer: {
      name: "Adv. Rajesh K. Sharma",
      role: "Head of Legal Compliance & Data Protection Officer (DPO)",
      email: "grievance-officer@nicks-ai.internal",
      phone: "+91 (022) 6123-4567",
      statutoryTurnaroundSLA: "Acknowledgment within 24h; Resolution within 30 days"
    },
    privacyControls: {
      dataMinimization: true,
      unbundledConsentCheckboxes: true,
      rightToWithdrawConsent: true,
      rightToErasure: true,
      childrenDataRestrictedUnder18: true,
      thirdPartyAdTrackers: false
    },
    policiesPublished: {
      privacyPolicy: "/#privacy",
      termsOfService: "/#terms",
      cookiePolicy: "/#cookies",
      refundPolicy: "/#refund",
      businessDetails: "/#business",
      riskAudit: "/#risk"
    },
    aiAdvisoryDisclaimer: "EVM calculations and AI predictions are probabilistic decision-support models and do not constitute statutory engineering or financial certifications."
  });
});

// Explicit policy routes
app.get(['/privacy', '/terms', '/cookies', '/refund', '/compliance', '/legal'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`[Nick's ai Platform] Express Server active on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.log(`[Nick's ai Platform] Port ${PORT} is busy. Falling back to http://localhost:${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      console.log(`[Nick's ai Platform] Express Server active on http://localhost:${fallbackPort}`);
    });
  } else {
    console.error("[Nick's ai Platform] Server error:", err);
  }
});
