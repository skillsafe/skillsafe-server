import { Hono } from "hono";
import { baseHtml, notFound, h } from "../lib/html.js";
function uiRoutes() {
  const app = new Hono();
  app.get("/favicon.svg", (c) => {
    c.header("Content-Type", "image/svg+xml");
    c.header("Cache-Control", "public, max-age=86400");
    return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d8eff"/>
      <stop offset="100%" stop-color="#1a5fd4"/>
    </linearGradient>
  </defs>
  <path d="M16 2 L28 7 C28 7 29 17.5 23 23 C19.5 27 16 29 16 29 C16 29 12.5 27 9 23 C3 17.5 4 7 4 7 Z" fill="url(#g)"/>
  <path d="M10.5 16 L14 19.8 L22 11.5" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
  });
  app.get("/", dashboardPage);
  app.get("/skills", dashboardPage);
  app.get("/explore", (c) => c.redirect("/skills"));
  app.get("/skill/*", skillDetailPage);
  app.notFound((c) => notFound(new URL(c.req.url).pathname));
  return app;
}
function dashboardPage(c) {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const path = url.pathname;
  return baseHtml({
    title: "Dashboard \u2014 SkillSafe Local",
    path,
    css: DASH_CSS,
    body: `
<div class="container dash-page">
  <!-- Header -->
  <div class="dash-header animate-in">
    <div class="dash-greeting">
      <h1 class="dash-title">Dashboard</h1>
      <p>Local registry \u2014 data stays on your machine.</p>
    </div>
    <div class="dash-header-stats">
      <div class="header-stat">
        <span class="header-stat-value" id="stat-agent-count">\u2014</span>
        <span class="header-stat-label">Agents</span>
      </div>
      <span class="header-stat-sep"></span>
      <div class="header-stat">
        <span class="header-stat-value" id="stat-skill-count">\u2014</span>
        <span class="header-stat-label">Skills</span>
      </div>
    </div>
  </div>

  <!-- Agents -->
  <div class="agents-section animate-in stagger-2">
    <div class="section-header">
      <h2>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
        Your Agents
      </h2>
    </div>
    <div id="agents-list" class="agents-grid">
      <div class="skeleton" style="height:64px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:64px;border-radius:var(--radius)"></div>
    </div>
    <div id="agents-empty" class="agents-empty-state" hidden>
      <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
      <p>Back up your AI agent's identity and memory. Send this to your AI:</p>
      <pre><code>/skillsafe agent save</code></pre>
    </div>
  </div>

  <!-- Skills -->
  <div class="my-skills animate-in stagger-3">
    <div class="section-header">
      <h2>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        Your Skills
      </h2>
      <div class="toolbar-right">
        <div class="skills-search-wrap">
          <svg class="skills-search-icon" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="skills-search" class="input input-sm skills-search-input" type="text" placeholder="Filter skills..." aria-label="Filter skills" />
        </div>
        <select id="skills-sort" class="input input-sm skills-sort-select" aria-label="Sort skills">
          <option value="updated">Recent</option>
          <option value="name">Name A\u2013Z</option>
        </select>
      </div>
    </div>
    <div id="my-skills-list" class="my-skills-list" aria-busy="true">
      <div class="skeleton" style="height:64px;margin-bottom:8px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:64px;margin-bottom:8px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:64px;border-radius:var(--radius)"></div>
    </div>
    <div id="my-skills-pagination" class="pagination-bar" hidden></div>
    <div id="my-skills-empty" class="empty-state" hidden>
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      <p>No skills saved yet. To save your first skill, run:</p>
      <pre><code>skillsafe --api-base ${origin} save ./my-skill --version 1.0.0</code></pre>
    </div>
  </div>
</div>`,
    scripts: `<script>
(function(){
  function hEsc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}

  function timeAgo(iso){
    if(!iso)return "";
    var diff=Date.now()-new Date(iso).getTime();
    var m=Math.floor(diff/60000);
    if(m<1)return "just now";
    if(m<60)return m+"m ago";
    var h=Math.floor(m/60);
    if(h<24)return h+"h ago";
    var d=Math.floor(h/24);
    if(d<30)return d+"d ago";
    return new Date(iso).toLocaleDateString();
  }

  // \u2500\u2500\u2500 Agents \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  var platformColors={claude:"var(--accent)",openclaw:"var(--green)",cursor:"var(--amber)",windsurf:"#06b6d4",cline:"#a78bfa"};

  function renderAgentCard(a){
    var color=platformColors[a.platform]||"var(--text-secondary)";
    return '<a href="/agent/'+hEsc(a.id)+'/" class="agent-card card card-interactive">'
      +'<div class="agent-card-icon" style="background:'+color+'15;color:'+color+'">'
      +'<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>'
      +'</div>'
      +'<div class="agent-card-info">'
      +'<span class="agent-card-name">'+hEsc(a.name)+'</span>'
      +'<span class="agent-card-meta">'+hEsc(a.platform)+' \xB7 '+timeAgo(a.updated_at||a.created_at)+'</span>'
      +'</div>'
      +'<span class="badge badge-neutral badge-sm">'+hEsc(a.platform)+'</span>'
      +'<svg class="agent-card-arrow" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
      +'</a>';
  }

  fetch("/v1/agents")
    .then(function(r){return r.json()})
    .then(function(res){
      var list=document.getElementById("agents-list");
      var empty=document.getElementById("agents-empty");
      var agents=res.data||[];
      document.getElementById("stat-agent-count").textContent=String(agents.length);
      if(agents.length===0){
        list.innerHTML="";
        empty.hidden=false;
        return;
      }
      list.innerHTML=agents.map(renderAgentCard).join("");
    })
    .catch(function(){
      document.getElementById("agents-list").innerHTML="";
      document.getElementById("agents-empty").hidden=false;
      document.getElementById("stat-agent-count").textContent="0";
    });

  // \u2500\u2500\u2500 Skills \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  var allSkills=[];
  var skillsPage=0;
  var SKILLS_PER_PAGE=20;

  function renderSkillRow(s){
    var ns=hEsc(s.namespace||"");
    var name=hEsc(s.name||"");
    var href="/skill/"+(s.namespace||"")+"/"+(s.name||"");
    var desc=hEsc(s.description||"");
    var ver=hEsc(s.latest_version||"\u2014");
    var cat=s.category?'<span class="badge badge-neutral badge-sm">'+hEsc(s.category)+'</span>':"";
    return '<a href="'+href+'" class="my-skill-item card card-interactive">'
      +'<div class="my-skill-left">'
      +'<div class="my-skill-icon"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>'
      +'<div class="my-skill-info">'
      +'<div class="my-skill-name"><span class="ns">'+ns+'</span>/<strong>'+name+'</strong>'
      +' <span class="version-tag">'+ver+'</span></div>'
      +(desc?'<span class="my-skill-desc">'+desc+'</span>':"")
      +'</div>'
      +'</div>'
      +'<div class="my-skill-right">'+cat
      +'<span class="my-skill-time">'+timeAgo(s.updated_at)+'</span>'
      +'</div>'
      +'</a>';
  }

  function applySkillFilters(reset){
    var q=(document.getElementById("skills-search").value||"").toLowerCase().trim();
    var sort=document.getElementById("skills-sort").value;
    var filtered=allSkills.slice();
    if(q)filtered=filtered.filter(function(s){
      return (s.namespace+"").toLowerCase().includes(q)||(s.name+"").toLowerCase().includes(q)||(s.description+"").toLowerCase().includes(q);
    });
    if(sort==="name")filtered.sort(function(a,b){return(a.name||"").localeCompare(b.name||"")});
    if(reset)skillsPage=0;
    renderSkillsPage(filtered);
  }

  function renderSkillsPage(filtered){
    var list=document.getElementById("my-skills-list");
    var empty=document.getElementById("my-skills-empty");
    var pagEl=document.getElementById("my-skills-pagination");
    list.setAttribute("aria-busy","false");
    if(filtered.length===0){list.innerHTML="";empty.hidden=false;pagEl.hidden=true;return;}
    empty.hidden=true;
    var start=skillsPage*SKILLS_PER_PAGE;
    var slice=filtered.slice(start,start+SKILLS_PER_PAGE);
    list.innerHTML=slice.map(renderSkillRow).join("");
    var totalPages=Math.ceil(filtered.length/SKILLS_PER_PAGE);
    if(totalPages>1){
      var btns="";
      if(skillsPage>0)btns+='<button class="btn btn-secondary btn-sm" id="sp-prev">\u2190 Prev</button>';
      btns+='<span class="page-info">Page '+(skillsPage+1)+' of '+totalPages+'</span>';
      if(skillsPage<totalPages-1)btns+='<button class="btn btn-secondary btn-sm" id="sp-next">Next \u2192</button>';
      pagEl.innerHTML=btns;pagEl.hidden=false;
      if(document.getElementById("sp-prev"))document.getElementById("sp-prev").addEventListener("click",function(){skillsPage--;applySkillFilters(false);window.scrollTo({top:0,behavior:"smooth"});});
      if(document.getElementById("sp-next"))document.getElementById("sp-next").addEventListener("click",function(){skillsPage++;applySkillFilters(false);window.scrollTo({top:0,behavior:"smooth"});});
    } else {pagEl.hidden=true;}
  }

  fetch("/v1/skills?limit=500")
    .then(function(r){return r.json()})
    .then(function(res){
      allSkills=res.data||[];
      document.getElementById("stat-skill-count").textContent=String(allSkills.length);
      applySkillFilters(true);
    })
    .catch(function(){
      document.getElementById("my-skills-list").innerHTML='<p style="color:var(--red);padding:20px">Failed to load skills.</p>';
      document.getElementById("my-skills-list").setAttribute("aria-busy","false");
      document.getElementById("stat-skill-count").textContent="0";
    });

  document.getElementById("skills-search").addEventListener("input",function(){applySkillFilters(true)});
  document.getElementById("skills-sort").addEventListener("change",function(){applySkillFilters(true)});
})();
</script>`
  });
}
function skillDetailPage(c) {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const path = url.pathname;
  const raw = path.replace(/^\/skill\//, "");
  const parts = raw.split("/");
  let ns = decodeURIComponent(parts[0] || "");
  if (!ns.startsWith("@")) ns = "@" + ns;
  const name = decodeURIComponent(parts[1] || "");
  if (!ns || !name) return notFound(path);
  return baseHtml({
    title: `${h(ns)}/${h(name)} \u2014 SkillSafe Local`,
    path,
    css: SKILL_CSS,
    body: `
<div class="container skill-page">
  <!-- Breadcrumb -->
  <nav class="breadcrumb-bar animate-in" aria-label="Breadcrumb">
    <div class="breadcrumb">
      <a href="/skills">Skills</a>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      <span class="breadcrumb-ns">${h(ns)}</span>
      <span class="breadcrumb-sep">/</span>
      <span>${h(name)}</span>
    </div>
  </nav>

  <!-- Skill header -->
  <div class="skill-header animate-in stagger-1" id="skill-header">
    <div class="skill-header-left">
      <div class="skill-identity">
        <div class="skill-icon">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <div>
          <h1 class="skill-name">${h(ns)}/${h(name)}</h1>
          <p id="skill-desc" class="skill-desc">Loading...</p>
        </div>
      </div>
    </div>
    <div class="skill-actions" id="skill-actions">
      <button id="copy-install-btn" class="btn btn-secondary" type="button" onclick="copyInstall()">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        Copy install
      </button>
      <button id="share-btn" class="btn btn-secondary" type="button" onclick="copyText(location.href,'Link')">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>
    </div>
  </div>

  <!-- Stats bar -->
  <div class="stats-bar animate-in stagger-2" id="stats-bar" hidden>
    <div class="stat-item" id="stat-versions-wrap" hidden>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
      <span id="stat-versions">0</span> versions
    </div>
    <div class="stat-item" id="stat-category-wrap" hidden>
      <span class="stat-category-pill" id="stat-category"></span>
    </div>
    <div class="stat-item" id="stat-scan-wrap" hidden>
      <span id="stat-scan-badge"></span>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs animate-in stagger-2" role="tablist" aria-label="Skill information">
    <button class="tab active" data-tab="readme" type="button" role="tab" aria-selected="true" aria-controls="tab-readme" id="tab-btn-readme" tabindex="0">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      README
    </button>
    <button class="tab" data-tab="security" type="button" role="tab" aria-selected="false" aria-controls="tab-security" id="tab-btn-security" tabindex="-1">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Security
    </button>
    <button class="tab" data-tab="files" type="button" role="tab" aria-selected="false" aria-controls="tab-files" id="tab-btn-files" tabindex="-1">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      Files
    </button>
    <button class="tab" data-tab="versions" type="button" role="tab" aria-selected="false" aria-controls="tab-versions" id="tab-btn-versions" tabindex="-1">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
      Versions
    </button>
  </div>

  <!-- Tab content + sidebar layout -->
  <div class="skill-layout">
    <div class="tab-content">

      <!-- README tab -->
      <div id="tab-readme" class="tab-panel" role="tabpanel" aria-labelledby="tab-btn-readme">
        <div id="readme-loading" class="skeleton" style="height:200px;border-radius:var(--radius)"></div>
        <div id="readme-content" class="readme-body" hidden></div>
        <div id="readme-empty" class="empty-state" hidden>
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <p>No README found for this skill.</p>
        </div>
      </div>

      <!-- Security tab -->
      <div id="tab-security" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-security">
        <div id="security-loading" class="skeleton" style="height:200px;border-radius:var(--radius)"></div>
        <div id="security-content" hidden></div>
        <div id="security-empty" class="empty-state" hidden>
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p>No scan report found. Run <code>skillsafe scan</code> and re-save to generate one.</p>
        </div>
      </div>

      <!-- Files tab -->
      <div id="tab-files" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-files">
        <div id="files-loading" class="skeleton" style="height:200px;border-radius:var(--radius)"></div>
        <div id="files-content" hidden></div>
        <div id="files-empty" class="empty-state" hidden>
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <p>No files found for this version.</p>
        </div>
      </div>

      <!-- Versions tab -->
      <div id="tab-versions" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-versions">
        <div id="versions-loading" class="skeleton" style="height:200px;border-radius:var(--radius)"></div>
        <div id="versions-content" hidden></div>
        <div id="versions-empty" class="empty-state" hidden>
          <p>No versions found.</p>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="skill-sidebar animate-in stagger-3">
      <div class="sidebar-section card">
        <h3 class="sidebar-heading">Install</h3>
        <div class="install-block">
          <p class="install-label">via CLI</p>
          <div class="copy-row">
            <code id="install-cmd" class="install-code">skillsafe --api-base ${origin} install ${h(ns)}/${h(name)}</code>
            <button class="copy-btn" type="button" onclick="copyInstall()" title="Copy install command">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="install-block">
          <p class="install-label">via curl</p>
          <div class="copy-row">
            <code class="install-code" id="curl-cmd">curl -fsSL https://skillsafe.ai/scripts/skillsafe.py | python3 - install --api-base ${origin} ${h(ns)}/${h(name)}</code>
            <button class="copy-btn" type="button" onclick="copyCurl()" title="Copy curl command">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar-section card" id="sidebar-meta">
        <h3 class="sidebar-heading">Details</h3>
        <dl class="meta-list">
          <dt>Namespace</dt><dd>${h(ns)}</dd>
          <dt>Name</dt><dd>${h(name)}</dd>
          <dt>Latest version</dt><dd id="meta-version"><span class="skeleton" style="height:16px;width:60px;display:inline-block"></span></dd>
          <dt>Category</dt><dd id="meta-category">\u2014</dd>
          <dt>Updated</dt><dd id="meta-updated">\u2014</dd>
        </dl>
      </div>

      <div class="sidebar-section card" id="sidebar-tags" hidden>
        <h3 class="sidebar-heading">Tags</h3>
        <div id="meta-tags" class="tag-list"></div>
      </div>
    </aside>
  </div>
</div>`,
    scripts: `<script>
(function(){
  var NS="${h(ns)}";
  var NAME="${h(name)}";
  var latestVersion=null;
  var skillData=null;

  // \u2500\u2500\u2500 Tab switching \u2500\u2500\u2500
  document.querySelectorAll(".tab").forEach(function(btn){
    btn.addEventListener("click",function(){
      var tab=btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(function(b){
        b.classList.remove("active");b.setAttribute("aria-selected","false");b.tabIndex=-1;
      });
      document.querySelectorAll(".tab-panel").forEach(function(p){p.hidden=true});
      btn.classList.add("active");btn.setAttribute("aria-selected","true");btn.tabIndex=0;
      document.getElementById("tab-"+tab).hidden=false;
      if(tab==="security"&&!secLoaded)loadSecurity();
      if(tab==="files"&&!filesLoaded)loadFiles();
      if(tab==="versions"&&!versionsLoaded)loadVersions();
    });
  });

  // \u2500\u2500\u2500 Load skill metadata \u2500\u2500\u2500
  fetch("/v1/skills/"+NS+"/"+encodeURIComponent(NAME))
    .then(function(r){return r.json()})
    .then(function(res){
      if(!res.ok){showError("Skill not found.");return}
      var d=res.data;
      skillData=d;
      latestVersion=d.latest_version;
      document.getElementById("skill-desc").textContent=d.description||"No description.";
      document.getElementById("stat-versions").textContent=d.version_count||0;
      document.getElementById("stat-versions-wrap").hidden=false;
      if(d.category){
        document.getElementById("stat-category").textContent=d.category;
        document.getElementById("stat-category-wrap").hidden=false;
        document.getElementById("meta-category").textContent=d.category;
      }
      document.getElementById("stats-bar").hidden=false;
      document.getElementById("meta-version").textContent=d.latest_version||"\u2014";
      document.getElementById("meta-updated").textContent=d.updated_at?new Date(d.updated_at).toLocaleDateString():"\u2014";
      if(d.tags&&d.tags.length){
        document.getElementById("sidebar-tags").hidden=false;
        document.getElementById("meta-tags").innerHTML=d.tags.map(function(t){
          return '<a href="/skills?q='+encodeURIComponent(t)+'" class="skill-tag">'+hEsc(t)+'</a>';
        }).join("");
      }
      loadReadme();
    })
    .catch(function(){showError("Failed to load skill.")});

  function showError(msg){
    document.getElementById("skill-desc").textContent=msg;
    document.getElementById("readme-loading").hidden=true;
    document.getElementById("readme-empty").hidden=false;
  }

  function hEsc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}

  // \u2500\u2500\u2500 README \u2500\u2500\u2500
  function loadReadme(){
    if(!latestVersion){
      document.getElementById("readme-loading").hidden=true;
      document.getElementById("readme-empty").hidden=false;
      return;
    }
    fetch("/v1/skills/"+NS+"/"+encodeURIComponent(NAME)+"/download/"+encodeURIComponent(latestVersion))
      .then(function(r){return r.json()})
      .then(function(res){
        document.getElementById("readme-loading").hidden=true;
        if(!res.ok||!res.data||!res.data.files||res.data.files.length===0){
          document.getElementById("readme-empty").hidden=false;
          return;
        }
        var mdFile=res.data.files.find(function(f){return f.path.match(/^(SKILL|README|skill|readme)\\.(md|txt)$/i)});
        if(!mdFile){
          // Show a file listing as fallback
          var html='<p style="color:var(--text-secondary);margin-bottom:12px">No SKILL.md or README found. See the <button class="btn-link" onclick="switchTab(&apos;files&apos;)">Files tab</button> for all files.</p>';
          document.getElementById("readme-content").innerHTML=html;
          document.getElementById("readme-content").hidden=false;
          return;
        }
        // Fetch the blob
        var hash=mdFile.hash.replace("sha256:","");
        fetch("/v1/blobs/"+encodeURIComponent(mdFile.hash))
          .then(function(r){return r.text()})
          .then(function(text){
            document.getElementById("readme-content").innerHTML='<pre class="skill-raw-md">'+hEsc(text)+'</pre>';
            document.getElementById("readme-content").hidden=false;
          })
          .catch(function(){document.getElementById("readme-empty").hidden=false});
      })
      .catch(function(){
        document.getElementById("readme-loading").hidden=true;
        document.getElementById("readme-empty").hidden=false;
      });
  }

  // \u2500\u2500\u2500 Security \u2500\u2500\u2500
  var secLoaded=false;
  function loadSecurity(){
    secLoaded=true;
    if(!latestVersion){
      document.getElementById("security-loading").hidden=true;
      document.getElementById("security-empty").hidden=false;
      return;
    }
    fetch("/v1/skills/"+NS+"/"+encodeURIComponent(NAME)+"/versions/"+encodeURIComponent(latestVersion)+"/scan")
      .then(function(r){return r.json()})
      .then(function(res){
        document.getElementById("security-loading").hidden=true;
        if(!res.ok||!res.data){
          document.getElementById("security-empty").hidden=false;
          // Update stat badge
          document.getElementById("stat-scan-badge").innerHTML='<span class="badge badge-neutral">No scan</span>';
          document.getElementById("stat-scan-wrap").hidden=false;
          return;
        }
        var report=res.data;
        var verdict=report.verdict||"unknown";
        var findings=report.findings||[];
        var critical=findings.filter(function(f){return f.severity==="critical"});
        var high=findings.filter(function(f){return f.severity==="high"});
        var medium=findings.filter(function(f){return f.severity==="medium"});
        var low=findings.filter(function(f){return f.severity==="low"||f.severity==="info"});

        var scanClass=verdict==="clean"?"badge-green":verdict==="critical"?"badge-red":"badge-amber";
        var scanLabel=verdict==="clean"?"Scan safe":verdict==="critical"?"Critical issues":"Issues found";
        var scanIcon=verdict==="clean"?'<svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>':'<svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
        document.getElementById("stat-scan-badge").innerHTML='<span class="badge '+scanClass+'">'+scanIcon+' '+hEsc(scanLabel)+'</span>';
        document.getElementById("stat-scan-wrap").hidden=false;

        var html='<div class="security-overview card">'
          +'<div class="security-verdict">'
          +'<span class="badge badge-'+scanClass+' badge-lg">'+scanIcon+' '+hEsc(scanLabel)+'</span>'
          +'<span class="security-scanned">Scanned '+(report.scanned_at?new Date(report.scanned_at).toLocaleDateString():"")+'</span>'
          +'</div>';

        if(findings.length===0){
          html+='<p class="security-clean-msg">No security issues found in this skill.</p>';
        } else {
          html+='<div class="security-counts">';
          if(critical.length)html+='<span class="badge badge-red">'+critical.length+' Critical</span>';
          if(high.length)html+='<span class="badge badge-red">'+high.length+' High</span>';
          if(medium.length)html+='<span class="badge badge-amber">'+medium.length+' Medium</span>';
          if(low.length)html+='<span class="badge badge-neutral">'+low.length+' Low/Info</span>';
          html+='</div>';
        }
        html+='</div>';

        if(findings.length>0){
          html+='<div class="findings-list">';
          findings.forEach(function(f){
            var sev=f.severity||"info";
            var sevClass=sev==="critical"||sev==="high"?"badge-red":sev==="medium"?"badge-amber":"badge-neutral";
            html+='<div class="finding-item card">'
              +'<div class="finding-header">'
              +'<span class="badge '+sevClass+'">'+hEsc(sev)+'</span>'
              +'<span class="finding-rule">'+hEsc(f.rule||f.type||"")+'</span>'
              +'</div>'
              +(f.message?'<p class="finding-msg">'+hEsc(f.message)+'</p>':"")
              +(f.file?'<code class="finding-file">'+hEsc(f.file)+(f.line?":"+f.line:"")+'</code>':"")
              +'</div>';
          });
          html+='</div>';
        }

        document.getElementById("security-content").innerHTML=html;
        document.getElementById("security-content").hidden=false;
      })
      .catch(function(){
        document.getElementById("security-loading").hidden=true;
        document.getElementById("security-empty").hidden=false;
      });
  }

  // \u2500\u2500\u2500 Files \u2500\u2500\u2500
  var filesLoaded=false;
  function loadFiles(){
    filesLoaded=true;
    if(!latestVersion){
      document.getElementById("files-loading").hidden=true;
      document.getElementById("files-empty").hidden=false;
      return;
    }
    fetch("/v1/skills/"+NS+"/"+encodeURIComponent(NAME)+"/download/"+encodeURIComponent(latestVersion))
      .then(function(r){return r.json()})
      .then(function(res){
        document.getElementById("files-loading").hidden=true;
        if(!res.ok||!res.data||!res.data.files||res.data.files.length===0){
          document.getElementById("files-empty").hidden=false;
          return;
        }
        var files=res.data.files;
        var html='<div class="files-header"><span class="files-count">'+files.length+' file'+(files.length===1?"":"s")+'</span><span class="files-hash">tree: <code>'+hEsc((res.data.tree_hash||"").substring(0,20))+'\u2026</code></span></div>'
          +'<div class="files-list">';
        files.forEach(function(f){
          var size=f.size?formatSize(f.size):"";
          html+='<div class="file-row">'
            +'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
            +'<span class="file-path">'+hEsc(f.path)+'</span>'
            +(size?'<span class="file-size">'+hEsc(size)+'</span>':"")
            +'<code class="file-hash">'+hEsc((f.hash||"").replace("sha256:","").substring(0,12))+'\u2026</code>'
            +'</div>';
        });
        html+='</div>';
        document.getElementById("files-content").innerHTML=html;
        document.getElementById("files-content").hidden=false;
      })
      .catch(function(){
        document.getElementById("files-loading").hidden=true;
        document.getElementById("files-empty").hidden=false;
      });
  }

  function formatSize(bytes){
    if(bytes<1024)return bytes+"B";
    if(bytes<1048576)return(bytes/1024).toFixed(1)+"KB";
    return(bytes/1048576).toFixed(1)+"MB";
  }

  // \u2500\u2500\u2500 Versions \u2500\u2500\u2500
  var versionsLoaded=false;
  function loadVersions(){
    versionsLoaded=true;
    fetch("/v1/skills/"+NS+"/"+encodeURIComponent(NAME)+"/versions")
      .then(function(r){return r.json()})
      .then(function(res){
        document.getElementById("versions-loading").hidden=true;
        if(!res.ok||!res.data||res.data.length===0){
          document.getElementById("versions-empty").hidden=false;
          return;
        }
        var versions=res.data;
        var html='<div class="versions-table"><table><thead><tr><th>Version</th><th>Saved</th><th>Status</th><th>Changelog</th></tr></thead><tbody>';
        versions.forEach(function(v){
          var isLatest=v.version===latestVersion;
          html+='<tr class="version-row'+(v.yanked?" version-yanked":"")+'">'
            +'<td><span class="ver-num">'+hEsc(v.version)+'</span>'+(isLatest?'<span class="badge badge-blue" style="margin-left:6px">latest</span>':"")+(v.yanked?'<span class="badge badge-red" style="margin-left:6px">yanked</span>':"")+'</td>'
            +'<td class="ver-date">'+(v.saved_at?new Date(v.saved_at).toLocaleDateString():"\u2014")+'</td>'
            +'<td>'+(v.yanked?'<span class="badge badge-red">Yanked</span>':isLatest?'<span class="badge badge-green">Current</span>':'<span class="badge badge-neutral">Old</span>')+'</td>'
            +'<td class="ver-changelog">'+hEsc(v.changelog||"\u2014")+'</td>'
            +'</tr>';
        });
        html+='</tbody></table></div>';
        document.getElementById("versions-content").innerHTML=html;
        document.getElementById("versions-content").hidden=false;
      })
      .catch(function(){
        document.getElementById("versions-loading").hidden=true;
        document.getElementById("versions-empty").hidden=false;
      });
  }

  // \u2500\u2500\u2500 Install helpers \u2500\u2500\u2500
  window.copyInstall=function(){
    window.copyText(document.getElementById("install-cmd").textContent,"Install command");
  };
  window.copyCurl=function(){
    window.copyText(document.getElementById("curl-cmd").textContent,"curl command");
  };
  window.switchTab=function(tab){
    var btn=document.getElementById("tab-btn-"+tab);
    if(btn)btn.click();
  };
})();
</script>`
  });
}
const DASH_CSS = `
/* \u2500\u2500 Dashboard layout \u2500\u2500 */
.dash-page { padding: 32px 24px 80px; }
.dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; gap: 24px; flex-wrap: wrap; }
.dash-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; }
.dash-greeting p { color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px; }
/* Stats */
.dash-header-stats { display: flex; align-items: center; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.header-stat { display: flex; flex-direction: column; align-items: center; padding: 10px 20px; min-width: 72px; }
.header-stat-value { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
.header-stat-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.03em; font-weight: 500; }
.header-stat-sep { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }
/* Section header */
.section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.section-header h2 { display: flex; align-items: center; gap: 7px; font-size: 1.05rem; font-weight: 700; white-space: nowrap; }
.toolbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.input-sm { padding: 5px 10px; font-size: 0.82rem; }
.skills-sort-select { width: auto; min-width: 0; appearance: auto; }
.skills-search-wrap { position: relative; display: flex; align-items: center; }
.skills-search-icon { position: absolute; left: 8px; color: var(--text-tertiary); pointer-events: none; }
.skills-search-input { padding-left: 28px !important; width: 150px; }
/* Agents */
.agents-section { margin-bottom: 36px; }
.agents-grid { display: flex; flex-direction: column; gap: 8px; }
.agent-card { display: flex; align-items: center; gap: 12px; padding: 14px 18px; text-decoration: none; color: var(--text); transition: border-color var(--transition); }
.agent-card:hover { text-decoration: none; border-color: var(--accent); }
.agent-card-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; }
.agent-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.agent-card-name { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agent-card-meta { font-size: 0.78rem; color: var(--text-tertiary); }
.agent-card-arrow { color: var(--text-tertiary); flex-shrink: 0; }
.agents-empty-state { padding: 2rem 1.5rem; text-align: center; border: 1px dashed var(--border); border-radius: var(--radius); background: var(--bg-surface); }
.agents-empty-state p { color: var(--text-secondary); margin: 0.75rem 0; font-size: 0.9rem; }
.agents-empty-state pre { display: inline-block; margin: 0; padding: 0.5rem 1rem; background: var(--bg-elevated); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; }
/* Skills list */
.my-skills { margin-bottom: 40px; }
.my-skills-list { display: flex; flex-direction: column; gap: 8px; }
.my-skill-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; text-decoration: none; color: var(--text); gap: 16px; transition: border-color var(--transition); }
.my-skill-item:hover { text-decoration: none; border-color: var(--accent); }
.my-skill-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
.my-skill-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--accent-muted); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.my-skill-info { min-width: 0; flex: 1; }
.my-skill-name { font-size: 0.9rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px; }
.my-skill-name .ns { color: var(--text-tertiary); font-weight: 400; }
.my-skill-desc { font-size: 0.78rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 400px; }
.my-skill-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.my-skill-time { font-size: 0.72rem; color: var(--text-tertiary); white-space: nowrap; }
.version-tag { font-size: 0.7rem; padding: 1px 6px; background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; color: var(--text-secondary); font-family: var(--font-mono); }
/* Empty / pagination */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 20px; color: var(--text-secondary); text-align: center; }
.empty-state p { margin: 0; font-size: 0.9rem; }
.empty-state pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 16px; font-size: .82rem; margin-top: 4px; }
.pagination-bar { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.page-info { color: var(--text-secondary); font-size: .875rem; }
.badge-sm { font-size: 0.7rem !important; padding: 1px 6px !important; }
@media (max-width: 768px) {
  .dash-page { padding: 20px 16px 60px; }
  .dash-header { margin-bottom: 24px; }
  .toolbar-right { flex-wrap: wrap; }
  .skills-search-input { width: 120px; }
  .my-skill-desc { max-width: 200px; }
}
@media (max-width: 375px) {
  .dash-header-stats { flex-wrap: wrap; }
  .header-stat { flex: 1 1 40%; padding: 6px 10px; }
  .header-stat-sep { display: none; }
}
`;
const SKILL_CSS = `
.skill-page { padding-top: 24px; padding-bottom: 80px; }
/* Breadcrumb */
.breadcrumb-bar { margin-bottom: 20px; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: .85rem; color: var(--text-tertiary); flex-wrap: wrap; }
.breadcrumb a { color: var(--text-secondary); }
.breadcrumb a:hover { color: var(--accent-fg); }
.breadcrumb-sep { color: var(--border-hover); }
/* Header */
.skill-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; }
.skill-header-left { flex: 1; min-width: 0; }
.skill-identity { display: flex; align-items: flex-start; gap: 14px; }
.skill-icon { width: 42px; height: 42px; background: var(--accent-muted); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; color: var(--accent-fg); flex-shrink: 0; margin-top: 2px; }
.skill-name { font-size: 1.5rem; font-weight: 700; letter-spacing: -.02em; word-break: break-word; }
.skill-desc { color: var(--text-secondary); font-size: .95rem; margin-top: 4px; }
.skill-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 4px; }
/* Stats bar */
.stats-bar { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.stat-item { display: flex; align-items: center; gap: 6px; font-size: .875rem; color: var(--text-secondary); }
.stat-category-pill { padding: 2px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; font-size: .78rem; color: var(--text-secondary); }
/* Tabs */
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 24px; overflow-x: auto; }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--text-secondary); font-size: .875rem; font-weight: 500; font-family: var(--font-sans); cursor: pointer; transition: all var(--transition); white-space: nowrap; margin-bottom: -1px; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent-fg); border-bottom-color: var(--accent); }
.tab-content { flex: 1; min-width: 0; }
.tab-panel { padding-top: 8px; }
/* Layout */
.skill-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
/* README */
.readme-body { font-size: .95rem; line-height: 1.8; }
.skill-raw-md { white-space: pre-wrap; word-break: break-word; font-size: .85rem; line-height: 1.7; }
/* Sidebar */
.skill-sidebar { display: flex; flex-direction: column; gap: 16px; }
.sidebar-section { padding: 16px; }
.sidebar-heading { font-size: .78rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; }
.install-block { margin-bottom: 12px; }
.install-label { font-size: .75rem; color: var(--text-tertiary); margin-bottom: 4px; }
.copy-row { display: flex; align-items: center; gap: 6px; background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 10px; overflow: hidden; }
.install-code { background: none; border: none; padding: 0; font-size: .75rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.copy-btn { flex-shrink: 0; background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: 2px; display: flex; transition: color var(--transition); }
.copy-btn:hover { color: var(--accent-fg); }
.meta-list { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: .85rem; }
.meta-list dt { color: var(--text-tertiary); font-weight: 500; }
.meta-list dd { color: var(--text); word-break: break-word; }
.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
/* Files */
.files-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: .85rem; color: var(--text-secondary); }
.files-list { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.file-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; font-size: .85rem; border-bottom: 1px solid var(--border); }
.file-row:last-child { border-bottom: none; }
.file-path { flex: 1; font-family: var(--font-mono); font-size: .8rem; word-break: break-all; }
.file-size { color: var(--text-tertiary); font-size: .75rem; flex-shrink: 0; }
.file-hash { font-size: .7rem; color: var(--text-tertiary); flex-shrink: 0; background: none; border: none; padding: 0; }
/* Versions */
.versions-table { overflow-x: auto; }
.versions-table table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.versions-table th { text-align: left; padding: 8px 12px; color: var(--text-tertiary); font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); }
.versions-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
.version-yanked td { opacity: .5; }
.ver-num { font-family: var(--font-mono); font-weight: 600; font-size: .9rem; }
.ver-date { color: var(--text-secondary); }
.ver-changelog { color: var(--text-secondary); max-width: 300px; }
/* Security */
.security-overview { padding: 16px; margin-bottom: 16px; }
.security-verdict { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.security-scanned { font-size: .8rem; color: var(--text-tertiary); }
.security-clean-msg { color: var(--green); font-size: .875rem; }
.security-counts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.findings-list { display: flex; flex-direction: column; gap: 10px; }
.finding-item { padding: 12px 14px; }
.finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.finding-rule { font-family: var(--font-mono); font-size: .8rem; color: var(--text-secondary); }
.finding-msg { font-size: .875rem; color: var(--text); margin-bottom: 4px; }
.finding-file { font-size: .78rem; color: var(--text-tertiary); background: none; border: none; padding: 0; }
/* Empty states */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--text-secondary); text-align: center; }
@media (max-width:768px){
  .skill-layout { grid-template-columns: 1fr; }
  .skill-header { flex-direction: column; }
  .skill-sidebar { order: -1; }
}
`;
export {
  uiRoutes
};
//# sourceMappingURL=ui.js.map
