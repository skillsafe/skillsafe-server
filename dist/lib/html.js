function h(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const LOGO_SVG = `<svg class="logo-mark" width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d8eff"/>
      <stop offset="100%" stop-color="#1a5fd4"/>
    </linearGradient>
  </defs>
  <path d="M16 2 L28 7 C28 7 29 17.5 23 23 C19.5 27 16 29 16 29 C16 29 12.5 27 9 23 C3 17.5 4 7 4 7 Z" fill="url(#logoGrad)"/>
  <path d="M10.5 16 L14 19.8 L22 11.5" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const GLOBAL_CSS = `
/* \u2500\u2500\u2500 CSS Variables \u2014 Dark theme (default) \u2500\u2500\u2500 */
:root, [data-theme="dark"] {
  --bg: #08090d;
  --bg-elevated: #0e1017;
  --bg-surface: #13151d;
  --bg-surface-hover: #1a1d28;
  --bg-overlay: rgba(8,9,13,0.9);
  --border: #1e2130;
  --border-hover: #2d3148;
  --border-accent: #2b4fff40;
  --text: #e8eaf0;
  --text-secondary: #9ba1b7;
  --text-tertiary: #a0a7bf;
  --accent: #2563eb;
  --accent-fg: #5b94f5;
  --accent-glow: #2563eb30;
  --accent-hover: #3b82f6;
  --btn-primary-hover: #1d4ed8;
  --accent-muted: #152040;
  --green: #4ade80;
  --green-dim: #0f3d22;
  --amber: #fbbf24;
  --amber-dim: #613d05;
  --red: #f87171;
  --red-dim: #451515;
  --btn-danger-bg: #c53030;
  --cyan: #06b6d4;
  --cyan-dim: #0e3a42;
  --purple: #8b5cf6;
  --purple-dim: #2e1a5e;
  --code-bg: #0c0d14;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 16px;
  --font-mono: "JetBrains Mono","SF Mono","Fira Code",monospace;
  --font-sans: "DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  --max-w: 1200px;
  --max-w-narrow: 900px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 20px var(--accent-glow);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.2),0 0 0 1px rgba(255,255,255,0.03);
  --shadow-card-hover: 0 8px 24px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.05);
  --shadow-card-active: 0 8px 24px rgba(0,0,0,0.35),0 0 20px var(--accent-glow);
  --border-subtle: rgba(255,255,255,0.04);
  --transition: 150ms cubic-bezier(0.4,0,0.2,1);
  --transition-slow: 250ms cubic-bezier(0.4,0,0.2,1);
}

/* \u2500\u2500\u2500 Light theme \u2500\u2500\u2500 */
[data-theme="light"] {
  --bg: #f8f9fc;
  --bg-elevated: #ffffff;
  --bg-surface: #ffffff;
  --bg-surface-hover: #f0f1f5;
  --bg-overlay: rgba(248,249,252,0.92);
  --border: #d8dce6;
  --border-hover: #bfc4d1;
  --border-accent: #2b7fff40;
  --text: #1a1d2b;
  --text-secondary: #555b72;
  --text-tertiary: #5f6574;
  --accent: #1558c9;
  --accent-fg: #1558c9;
  --accent-glow: #1558c920;
  --accent-hover: #104ab0;
  --btn-primary-hover: var(--accent-hover);
  --accent-muted: #dce8fd;
  --green: #15803d;
  --green-dim: #dcfce7;
  --amber: #92400e;
  --amber-dim: #fef3c7;
  --red: #b91c1c;
  --red-dim: #fee2e2;
  --btn-danger-bg: var(--red);
  --cyan: #0891b2;
  --cyan-dim: #e0f7fa;
  --purple: #7c3aed;
  --purple-dim: #ede9fe;
  --code-bg: #f1f3f8;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.1);
  --shadow-glow: 0 0 20px var(--accent-glow);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04),0 0 0 1px rgba(0,0,0,0.03);
  --shadow-card-hover: 0 8px 24px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.05);
  --shadow-card-active: 0 8px 24px rgba(0,0,0,0.08),0 0 20px var(--accent-glow);
  --border-subtle: rgba(0,0,0,0.04);
}

/* \u2500\u2500\u2500 Reset & base \u2500\u2500\u2500 */
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  font-family:var(--font-sans);
  background:var(--bg);
  color:var(--text);
  line-height:1.6;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  min-height:100vh;
}
body::before{
  content:"";position:fixed;top:0;left:0;right:0;height:600px;
  background:radial-gradient(ellipse 80% 50% at 50% -20%,var(--accent-glow),transparent);
  pointer-events:none;z-index:0;
}
[data-theme="light"] body::before{
  background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(26,107,239,0.06),transparent);
}
a{color:var(--accent-fg);text-decoration:none;transition:color var(--transition)}
a:hover{color:var(--accent-hover)}
code,pre{font-family:var(--font-mono)}
code{
  background:var(--code-bg);padding:2px 7px;border-radius:4px;font-size:.85em;
  border:1px solid var(--border);overflow-wrap:break-word;word-break:break-word;
}
pre{
  background:var(--code-bg);border:1px solid var(--border);border-radius:var(--radius);
  padding:16px 20px;overflow-x:auto;font-size:.85rem;line-height:1.7;
}
pre code{background:none;padding:0;border:none;font-size:inherit}
::selection{background:var(--accent);color:#fff}
[hidden]{display:none!important}

/* \u2500\u2500\u2500 Layout \u2500\u2500\u2500 */
.container{max-width:var(--max-w);margin:0 auto;padding:0 24px;position:relative;z-index:1}
.container-narrow{max-width:var(--max-w-narrow);margin:0 auto;padding:0 24px;position:relative;z-index:1}

/* \u2500\u2500\u2500 Buttons \u2500\u2500\u2500 */
.btn{
  display:inline-flex;align-items:center;gap:8px;padding:8px 16px;
  border-radius:var(--radius-sm);font-size:.875rem;font-weight:500;
  font-family:var(--font-sans);cursor:pointer;transition:all var(--transition);
  border:1px solid transparent;text-decoration:none;white-space:nowrap;line-height:1.4;
}
.btn:hover{text-decoration:none}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:var(--shadow-glow)}
.btn-primary:hover{background:var(--btn-primary-hover);border-color:var(--btn-primary-hover);color:#fff}
.btn-secondary{background:var(--bg-surface);color:var(--text);border-color:var(--border)}
.btn-secondary:hover{background:var(--bg-surface-hover);border-color:var(--border-hover);color:var(--text)}
.btn-ghost{background:transparent;color:var(--text-secondary);border-color:transparent}
.btn-ghost:hover{background:var(--bg-surface);color:var(--text)}
.btn-danger{display:inline-flex;align-items:center;gap:6px;color:#fff;background:var(--btn-danger-bg);border:1px solid var(--btn-danger-bg);transition:background var(--transition),border-color var(--transition)}
.btn-danger:hover{background:color-mix(in srgb,var(--btn-danger-bg) 85%,black);border-color:color-mix(in srgb,var(--btn-danger-bg) 85%,black)}
.btn-xs{padding:2px 8px;font-size:.75rem}
.btn-sm{padding:5px 10px;font-size:.8rem}
.btn-lg{padding:12px 24px;font-size:1rem}

/* \u2500\u2500\u2500 Badges \u2500\u2500\u2500 */
.badge{
  display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;
  font-size:.75rem;font-weight:500;letter-spacing:.02em;
}
.badge-green{background:var(--green-dim);color:var(--green)}
.badge-amber{background:var(--amber-dim);color:var(--amber)}
.badge-red{background:var(--red-dim);color:var(--red)}
.badge-blue{background:var(--accent-muted);color:var(--accent-fg)}
.badge-orange{background:var(--amber-dim);color:var(--amber)}
.badge-purple{background:var(--purple-dim);color:var(--purple)}
.badge-neutral{background:var(--bg-elevated);color:var(--text-tertiary);border:1px solid var(--border)}

/* \u2500\u2500\u2500 Inputs \u2500\u2500\u2500 */
.input{
  width:100%;padding:10px 14px;background:var(--bg-elevated);border:1px solid var(--border);
  border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-sans);font-size:.9rem;
  transition:border-color var(--transition),box-shadow var(--transition);
}
.input:focus{outline:2px solid var(--accent);outline-offset:2px;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
.input-mono{font-family:var(--font-mono);font-size:.85rem}
.input-label{display:block;font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px}
select.input,.select-input{
  width:auto;padding:8px 32px 8px 12px;background:var(--bg-elevated);border:1px solid var(--border);
  border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-sans);font-size:.875rem;
  cursor:pointer;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ba1b7' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
}
select.input:focus,.select-input:focus{outline:2px solid var(--accent);outline-offset:2px}

/* \u2500\u2500\u2500 Cards \u2500\u2500\u2500 */
.card{background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-card);transition:border-color var(--transition),box-shadow var(--transition),transform var(--transition)}
.card-hover:hover{border-color:var(--border-hover);box-shadow:var(--shadow-md)}
.card-interactive:hover{border-color:var(--accent);box-shadow:var(--shadow-glow)}

/* \u2500\u2500\u2500 Scrollbar \u2500\u2500\u2500 */
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:var(--border-hover)}

/* \u2500\u2500\u2500 Smooth theme transitions \u2500\u2500\u2500 */
html.theme-transitioning,html.theme-transitioning *,html.theme-transitioning *::before,html.theme-transitioning *::after{
  transition:background-color .3s ease,color .2s ease,border-color .3s ease,box-shadow .3s ease!important;
}

/* \u2500\u2500\u2500 Animations \u2500\u2500\u2500 */
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.animate-in{animation:fadeInUp .4s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
.stagger-1{animation-delay:.05s}.stagger-2{animation-delay:.1s}.stagger-3{animation-delay:.15s}
.stagger-4{animation-delay:.2s}.stagger-5{animation-delay:.25s}.stagger-6{animation-delay:.3s}
.stagger-7{animation-delay:.35s}
.skeleton{
  background:linear-gradient(90deg,var(--bg-surface) 25%,var(--bg-surface-hover) 50%,var(--bg-surface) 75%);
  background-size:200% 100%;animation:pulse 1.5s ease-in-out infinite;border-radius:var(--radius-sm);
}
.divider{height:1px;background:var(--border);border:none;margin:0}
.visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.skip-link{position:absolute;top:-40px;left:0;background:var(--accent);color:#fff;padding:8px 16px;z-index:1000;border-radius:0 0 var(--radius) 0;transition:top .15s}
.skip-link:focus{top:0}

/* \u2500\u2500\u2500 Header \u2500\u2500\u2500 */
.site-header{
  position:sticky;top:0;z-index:100;
  background:var(--bg-overlay);
  backdrop-filter:blur(16px) saturate(180%);
  -webkit-backdrop-filter:blur(16px) saturate(180%);
  border-bottom:1px solid var(--border);
}
.site-nav{display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
.nav-left{display:flex;align-items:center;gap:32px}
.logo{display:flex;align-items:center;gap:8px;color:var(--text);font-weight:700;font-size:1.05rem;letter-spacing:-.02em}
.logo:hover{color:var(--accent);text-decoration:none}
.logo .logo-mark{flex-shrink:0}
.nav-links{display:flex;gap:4px}
.nav-link{padding:6px 12px;border-radius:var(--radius-sm);color:var(--text-secondary);font-size:.875rem;font-weight:500;transition:all var(--transition)}
.nav-link:hover{color:var(--text);background:var(--bg-surface);text-decoration:none}
.nav-link.active{color:var(--text);background:var(--bg-surface)}
.nav-right{display:flex;align-items:center;gap:12px}
.theme-toggle{
  display:flex;align-items:center;justify-content:center;
  width:34px;height:34px;background:var(--bg-elevated);border:1px solid var(--border);
  border-radius:var(--radius-sm);color:var(--text-tertiary);cursor:pointer;
  transition:all var(--transition);
}
.theme-toggle:hover{border-color:var(--border-hover);color:var(--text-secondary)}
.theme-icon-sun,.theme-icon-moon,.theme-icon-system{display:none}
.theme-toggle.pref-light .theme-icon-sun{display:block}
.theme-toggle.pref-dark .theme-icon-moon{display:block}
.theme-toggle.pref-system .theme-icon-system{display:block}
.local-badge{
  display:inline-flex;align-items:center;gap:5px;padding:3px 10px;
  background:var(--accent-muted);border:1px solid var(--border-accent);
  border-radius:20px;font-size:.72rem;font-weight:600;color:var(--accent-fg);
  letter-spacing:.04em;
}
.local-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0}
.mobile-menu-btn{display:none}

/* \u2500\u2500\u2500 Footer \u2500\u2500\u2500 */
.site-footer{border-top:1px solid var(--border);margin-top:80px;padding:40px 0}
.footer-inner{display:flex;justify-content:space-between;align-items:flex-start;gap:32px}
.footer-left{display:flex;flex-direction:column;gap:8px}
.footer-logo{
  display:flex;align-items:center;gap:8px;color:var(--text-tertiary);
  font-size:.9rem;font-weight:600;
}
.footer-logo:hover{color:var(--text-secondary);text-decoration:none}
.footer-tagline{color:var(--text-tertiary);font-size:.8rem}
.footer-copy{color:var(--text-tertiary);font-size:.75rem}
.footer-links{display:flex;gap:20px;font-size:.85rem}
.footer-links a{color:var(--text-tertiary)}
.footer-links a:hover{color:var(--text-secondary)}

/* \u2500\u2500\u2500 Toast \u2500\u2500\u2500 */
.toast-container{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.toast{
  background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);
  padding:12px 20px;font-size:.875rem;box-shadow:var(--shadow-lg);
  animation:slideDown .3s ease forwards;display:flex;align-items:center;gap:8px;
}
.toast-success{border-color:var(--green)}
.toast-error{border-color:var(--red)}
.toast-hiding{opacity:0;transform:translateY(-8px);transition:opacity .25s ease,transform .25s ease}

/* \u2500\u2500\u2500 Focus ring \u2500\u2500\u2500 */
.btn:focus-visible,.nav-link:focus-visible,.theme-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* \u2500\u2500\u2500 Responsive \u2500\u2500\u2500 */
@media (max-width:768px){
  .mobile-menu-btn{display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-tertiary);cursor:pointer}
  .nav-links{display:none;position:absolute;top:60px;left:0;right:0;background:var(--bg-elevated);border-bottom:1px solid var(--border);padding:8px 24px;flex-direction:column;gap:4px;z-index:99}
  .nav-links.open{display:flex}
  .footer-inner{flex-direction:column;gap:12px}
  .footer-links{flex-wrap:wrap;gap:12px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
  .animate-in{opacity:1!important}
}
`;
function baseHtml(opts) {
  const { title, path, head = "", css = "", body, scripts = "", dataDir = "" } = opts;
  const isDashboard = path === "/" || path === "/dashboard" || path.startsWith("/skill/") || path.startsWith("/agent/");
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${h(title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
  <script>
    (function(){
      var t=localStorage.getItem("ss_theme")||"system";
      var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute("data-theme",dark?"dark":"light");
      document.documentElement.setAttribute("data-theme-pref",t);
    })();
  </script>
  <style>${GLOBAL_CSS}${css}</style>
  ${head}
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="site-header">
    <nav class="container site-nav" aria-label="Main navigation">
      <div class="nav-left">
        <a href="/" class="logo">
          ${LOGO_SVG}
          <span>SkillSafe</span>
        </a>
        <div id="nav-links" class="nav-links">
          <a href="/dashboard" class="nav-link${isDashboard ? " active" : ""}">Dashboard</a>
        </div>
        <button id="mobile-menu-btn" class="mobile-menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div class="nav-right">
        <span class="local-badge">LOCAL</span>
        <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle theme">
          <svg class="theme-icon-sun" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="theme-icon-moon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="theme-icon-system" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </button>
      </div>
    </nav>
  </header>

  <main id="main-content">
    ${body}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <a href="/" class="footer-logo">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs><linearGradient id="footerLogoGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3d8eff"/><stop offset="100%" stop-color="#1a5fd4"/></linearGradient></defs>
            <path d="M16 2 L28 7 C28 7 29 17.5 23 23 C19.5 27 16 29 16 29 C16 29 12.5 27 9 23 C3 17.5 4 7 4 7 Z" fill="url(#footerLogoGrad)"/>
            <path d="M10.5 16 L14 19.8 L22 11.5" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          SkillSafe Local
        </a>
        <span class="footer-copy">&copy; ${year} SkillSafe</span>
      </div>
      <nav aria-label="Footer navigation">
        <div class="footer-links">
          <a href="https://skillsafe.ai/docs/" target="_blank" rel="noopener noreferrer">Docs</a>
          <a href="https://skillsafe.ai/" target="_blank" rel="noopener noreferrer">skillsafe.ai</a>
          <a href="https://github.com/skillsafe/skillsafe-cli" target="_blank" rel="noopener noreferrer">CLI</a>
        </div>
      </nav>
    </div>
  </footer>

  <div class="toast-container" id="toast-container" role="status" aria-live="polite"></div>

  <script>
    // \u2500\u2500\u2500 Theme toggle \u2500\u2500\u2500
    (function(){
      var btn=document.getElementById("theme-toggle");
      function applyTheme(t){
        var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.setAttribute("data-theme",dark?"dark":"light");
        document.documentElement.setAttribute("data-theme-pref",t);
        document.documentElement.classList.add("theme-transitioning");
        setTimeout(function(){document.documentElement.classList.remove("theme-transitioning")},400);
        btn.classList.remove("pref-light","pref-dark","pref-system");
        btn.classList.add("pref-"+t);
      }
      var pref=localStorage.getItem("ss_theme")||"system";
      applyTheme(pref);
      btn.addEventListener("click",function(){
        var cur=localStorage.getItem("ss_theme")||"system";
        var next=cur==="system"?"dark":cur==="dark"?"light":"system";
        localStorage.setItem("ss_theme",next);
        applyTheme(next);
      });
    })();

    // \u2500\u2500\u2500 Mobile menu \u2500\u2500\u2500
    (function(){
      var btn=document.getElementById("mobile-menu-btn");
      var nav=document.getElementById("nav-links");
      if(!btn||!nav)return;
      btn.addEventListener("click",function(){
        var open=nav.classList.toggle("open");
        btn.setAttribute("aria-expanded",open?"true":"false");
      });
    })();

    // \u2500\u2500\u2500 Toast helper \u2500\u2500\u2500
    window.showToast=function(msg,type){
      var c=document.getElementById("toast-container");
      if(!c)return;
      var t=document.createElement("div");
      t.className="toast"+(type?" toast-"+type:"");
      t.textContent=msg;
      c.appendChild(t);
      setTimeout(function(){t.classList.add("toast-hiding");setTimeout(function(){t.remove()},300)},3000);
    };

    // \u2500\u2500\u2500 Copy helper \u2500\u2500\u2500
    window.copyText=function(text,label){
      navigator.clipboard.writeText(text).then(function(){
        window.showToast((label||"Copied")+"!","success");
      }).catch(function(){window.showToast("Copy failed","error")});
    };
  </script>
  ${scripts}
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
function notFound(path) {
  return baseHtml({
    title: "Not Found \u2014 SkillSafe Local",
    path,
    body: `
<div class="container" style="padding-top:80px;padding-bottom:80px;text-align:center">
  <div class="animate-in">
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" style="margin-bottom:16px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <h1 style="font-size:1.5rem;margin-bottom:8px">Page not found</h1>
    <p style="color:var(--text-secondary);margin-bottom:24px">The page you're looking for doesn't exist.</p>
    <a href="/" class="btn btn-primary">Back to Skills</a>
  </div>
</div>`
  });
}
export {
  baseHtml,
  h,
  notFound
};
//# sourceMappingURL=html.js.map
