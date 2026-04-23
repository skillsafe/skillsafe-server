/**
 * Web UI routes — matches the skillsafe.ai design (simplified for local server).
 *
 * Pages:
 *   GET /           → Redirect to /dashboard
 *   GET /skills     → Redirect to /dashboard
 *   GET /explore    → Redirect to /dashboard
 *   GET /dashboard  → Dashboard (agents + skills)
 *   GET /skill/*    → Skill detail (tabs: README, Versions, Files, Security)
 *   GET /agent/:id  → Agent detail (tabs: README, Details, Metadata)
 */

import { Hono } from "hono";
import { baseHtml, notFound, h } from "../lib/html.js";

let _dataDir = "";

export function uiRoutes(dataDir?: string): Hono {
  _dataDir = dataDir || "";
  const app = new Hono();

  // ─── Favicon ─────────────────────────────────────────────────────────────
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

  // ─── Redirects ────────────────────────────────────────────────────────────
  app.get("/", (c) => c.redirect("/dashboard/"));
  app.get("/skills", (c) => c.redirect("/dashboard/"));
  app.get("/explore", (c) => c.redirect("/dashboard/"));

  // ─── Dashboard ────────────────────────────────────────────────────────────
  app.get("/dashboard", (c) => c.redirect("/dashboard/", 301));
  app.get("/dashboard/", dashboardPage);

  // ─── Skill detail ─────────────────────────────────────────────────────────
  app.get("/skill/*", skillDetailPage);

  // ─── Agent detail ─────────────────────────────────────────────────────────
  app.get("/agent/:id", agentDetailPage);
  app.get("/agent/:id/", agentDetailPage);

  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────────────────────────────────────

function dashboardPage(c: Parameters<Parameters<Hono["get"]>[1]>[0]) {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const path = url.pathname;
  return baseHtml({
    title: "Dashboard — SkillSafe Local",
    path,
    dataDir: _dataDir,
    css: DASH_CSS,
    body: `
<div class="container dash-page">
  <!-- Header -->
  <div class="dash-header animate-in">
    <div class="dash-greeting">
      <h1 class="dash-title">Dashboard</h1>
      <p>Local registry — data stays on your machine.</p>
      <p class="dash-data-path">
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <code id="data-path-display">${_dataDir}</code>
        <button type="button" class="data-path-edit-btn" id="data-path-edit-btn" title="Change data directory">
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </p>
    </div>
    <div class="dash-header-right">
      <div class="dash-header-stats">
        <div class="header-stat">
          <span class="header-stat-value" id="stat-agent-count">0</span>
          <span class="header-stat-label">Agents</span>
        </div>
        <span class="header-stat-sep"></span>
        <div class="header-stat">
          <span class="header-stat-value" id="stat-skill-count">0</span>
          <span class="header-stat-label">Skills</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Agents -->
  <div id="agents-section" class="agents-section animate-in stagger-2">
    <div class="section-header">
      <h2>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
        Your Agents
      </h2>
    </div>
    <div id="agents-list" class="agents-grid">
      <div class="skeleton" style="height:64px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:64px;border-radius:var(--radius)"></div>
      <div class="skeleton" style="height:64px;border-radius:var(--radius)"></div>
    </div>
    <div id="agents-pagination" class="pagination-bar" hidden></div>
    <div id="agents-empty" class="empty-state agents-empty-state" hidden>
      <svg aria-hidden="true" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
      <p>Back up your AI agent's identity and memory. Send this to your AI:</p>
      <pre><code>skillsafe --api-base ${origin} agent save</code></pre>
    </div>
  </div>

  <!-- Skills list -->
  <div class="my-skills animate-in stagger-4">
    <div class="section-header">
      <h2>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        Your Skills
      </h2>
      <div class="section-actions skills-toolbar">
        <div class="filter-chips" role="group" aria-label="Filter skills">
          <button type="button" class="chip chip-active" data-filter="all" aria-pressed="true">All</button>
          <button type="button" class="chip" data-filter="shared" aria-pressed="false">Shared</button>
          <button type="button" class="chip" data-filter="private" aria-pressed="false">Private</button>
          <button type="button" class="chip" data-filter="verified" aria-pressed="false">Verified</button>
        </div>
        <div class="toolbar-right">
          <button id="bulk-select-toggle" class="btn btn-ghost btn-sm bulk-select-toggle" type="button">Select</button>
          <select id="my-skills-sort" class="input input-sm skills-sort-select" aria-label="Sort skills">
            <option value="recent" selected>Recent</option>
            <option value="popular">Popular</option>
          </select>
          <div class="skills-search-wrap">
            <svg class="skills-search-icon" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="my-skills-search" class="input input-sm skills-search-input" type="text" placeholder="Filter skills..." aria-label="Filter your skills" />
          </div>
        </div>
      </div>
    </div>
    <div class="visually-hidden" aria-live="polite" role="status" id="skills-load-status"></div>
    <div id="bulk-action-bar" class="bulk-action-bar" hidden>
      <label class="bulk-action-select-all">
        <input type="checkbox" id="bulk-select-all" />
        <span>Select all</span>
      </label>
      <span id="bulk-selected-count" class="bulk-selected-count">0 selected</span>
      <button type="button" id="bulk-delete-btn" class="btn btn-danger btn-sm" disabled>Delete Selected</button>
    </div>
    <div id="my-skills-list" class="my-skills-list" aria-busy="true">
      <div class="skeleton" style="height:64px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:64px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:64px"></div>
    </div>
    <div id="my-skills-pagination" class="pagination-bar" hidden></div>
    <div id="my-skills-empty" class="empty-state agents-empty-state" hidden>
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      <p>No skills saved yet. To save your first skill, run:</p>
      <pre><code>skillsafe --api-base ${origin} save ./my-skill</code></pre>
    </div>
  </div>

  <!-- Bookmarked skills -->
  <div id="bookmarks-section" class="bookmarks-section animate-in" hidden>
    <div class="section-header">
      <h2>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        Bookmarks
      </h2>
    </div>
    <div id="bookmarks-list" class="bookmarks-list"></div>
  </div>

  <!-- Shared modal (used by Share Link Management, Quick Share, Yank) -->
  <div id="dash-modal-overlay" class="dash-modal-overlay" hidden>
    <div class="dash-modal card" role="dialog" aria-modal="true" aria-labelledby="dash-modal-title">
      <div class="dash-modal-header">
        <h3 id="dash-modal-title" aria-live="polite"></h3>
        <button type="button" class="btn btn-ghost btn-sm dash-modal-close" aria-label="Close" id="dash-modal-close-btn">&times;</button>
      </div>
      <div id="dash-modal-body" class="dash-modal-body"></div>
      <div id="dash-modal-footer" class="dash-modal-footer"></div>
    </div>
  </div>
</div>`,
    scripts: `<script>
(function(){
  function hEsc(s){var t=String(s||"");t=t.split("&").join("&amp;");t=t.split(String.fromCharCode(60)).join("&lt;");t=t.split(">").join("&gt;");t=t.split('"').join("&quot;");return t}

  document.getElementById("data-path-edit-btn").addEventListener("click",function(){
    alert("To change the data directory, restart the server with:\\n\\nnode dist/index.js --data /your/path");
  });

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

  // ─── Agents ───────────────────────────────────────────────────────────
  var platformColors={claude:"var(--accent)",openclaw:"var(--green)",cursor:"var(--amber)",windsurf:"#06b6d4",cline:"#a78bfa"};

  function renderAgentCard(a){
    var color=platformColors[a.platform]||"var(--text-secondary)";
    return '<div class="agent-card-wrap">'
      +'<a href="/agent/'+hEsc(a.id)+'/" class="agent-card card card-interactive">'
      +'<div class="agent-card-icon" style="background:'+color+'15;color:'+color+'">'
      +'<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>'
      +'</div>'
      +'<div class="agent-card-info">'
      +'<span class="agent-card-name">'+hEsc(a.name)+'</span>'
      +'<span class="agent-card-meta">'+hEsc(a.platform)+' · '+timeAgo(a.updated_at||a.created_at)+'</span>'
      +'</div>'
      +'<span class="badge badge-neutral badge-sm">'+hEsc(a.platform)+'</span>'
      +'<svg class="agent-card-arrow" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
      +'</a>'
      +'<button class="btn-delete btn-delete-agent" title="Delete agent" data-id="'+hEsc(a.id)+'" onclick="deleteAgent(event,\\''+hEsc(a.id)+'\\',\\''+hEsc(a.name)+'\\')">'
      +'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>'
      +'</button>'
      +'</div>';
  }

  window.deleteAgent=function(evt,id,name){
    evt.preventDefault();evt.stopPropagation();
    if(!confirm("Delete agent \\""+name+"\\"? This cannot be undone."))return;
    fetch("/v1/agents/"+encodeURIComponent(id),{method:"DELETE"})
      .then(function(r){return r.json()})
      .then(function(res){
        if(res.ok){
          var wrap=evt.target.closest(".agent-card-wrap");
          if(wrap)wrap.remove();
          var remaining=document.querySelectorAll(".agent-card-wrap").length;
          document.getElementById("stat-agent-count").textContent=String(remaining);
          if(remaining===0)document.getElementById("agents-empty").hidden=false;
        } else {alert("Delete failed: "+(res.error&&res.error.message||"unknown error"));}
      })
      .catch(function(){alert("Delete failed: network error");});
  };

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

  // ─── Skills ───────────────────────────────────────────────────────────
  var allSkills=[];
  var filteredSkills=[];
  var skillsPage=0;
  var SKILLS_PER_PAGE=20;
  var currentFilter="all";
  var selectionMode=false;
  var selectedSkillIds=new Set();

  function renderSkillRow(s,i){
    var rawNs=(s.namespace||"").replace(/^@/,"");
    var ns=hEsc(s.namespace||"");
    var name=hEsc(s.name||"");
    var href="/skill/"+rawNs+"/"+(s.name||"")+"/?from=dashboard";
    var desc=hEsc(s.description||"No description");
    var ver=s.latest_version?'<code class="version-tag">v'+hEsc(s.latest_version)+'</code>':"";
    var cat=s.category?'<span class="my-skill-cat">'+hEsc(s.category)+'</span>':"";
    var updated=s.updated_at?'<span class="my-skill-time">Updated '+timeAgo(s.updated_at)+'</span>':"";
    var isVerified=s.scan_status==="verified";
    var scanBadge=isVerified?'<span class="badge badge-verified-inline">Verified</span>':'<span class="badge badge-unverified">Unverified</span>';
    var installs=(s.install_count||0)+(s.sh_install_count||0);
    var stars=s.star_count||0;
    var statsMeta='<span class="my-skill-stats">'
      +'<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+installs
      +' <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> '+stars
      +'</span>';
    var cbHtml=selectionMode?'<label class="bulk-checkbox" data-stop-propagation><input type="checkbox" class="bulk-skill-cb" data-ns="'+ns+'" data-name="'+name+'" /></label>':"";
    return '<div class="my-skill-item card card-hover animate-in" data-ns-name="'+ns+'/'+name+'" style="animation-delay:'+(i*0.03)+'s">'
      +cbHtml
      +'<a href="'+href+'" class="my-skill-left">'
      +'<div class="my-skill-icon"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>'
      +'<div class="my-skill-info">'
      +'<div class="my-skill-name"><span class="ns">'+ns+'/</span><strong>'+name+'</strong> '+ver+'</div>'
      +'<span class="my-skill-desc">'+desc+'</span>'
      +'<div class="my-skill-tags"><span class="badge badge-dim">Private</span> '+scanBadge+' '+cat+'</div>'
      +'</div>'
      +'</a>'
      +'<div class="my-skill-right">'
      +'<div class="my-skill-actions">'
      +'<button class="btn btn-ghost btn-sm btn-icon btn-icon-danger btn-delete-skill" title="Delete skill" data-ns="'+ns+'" data-name="'+name+'">'
      +'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      +'</button>'
      +'</div>'
      +'<div class="my-skill-meta-row">'+statsMeta+updated+'</div>'
      +'</div>'
      +'</div>';
  }

  function applySkillFilters(reset){
    var q=(document.getElementById("my-skills-search").value||"").toLowerCase().trim();
    var filtered=allSkills.slice();
    if(currentFilter==="private")filtered=filtered.filter(function(s){return true;});// all local skills are private
    if(currentFilter==="shared")filtered=[];// sharing not available locally
    if(currentFilter==="verified")filtered=filtered.filter(function(s){return s.scan_status==="verified";});
    if(q)filtered=filtered.filter(function(s){
      return (s.namespace+"").toLowerCase().includes(q)||(s.name+"").toLowerCase().includes(q)||(s.description+"").toLowerCase().includes(q);
    });
    filteredSkills=filtered;
    if(reset)skillsPage=0;
    renderSkillsPage();
  }

  function renderSkillsPage(){
    var list=document.getElementById("my-skills-list");
    var empty=document.getElementById("my-skills-empty");
    var pagEl=document.getElementById("my-skills-pagination");
    var statusEl=document.getElementById("skills-load-status");
    list.setAttribute("aria-busy","false");
    if(statusEl)statusEl.textContent=filteredSkills.length>0?filteredSkills.length+" skills loaded":"";
    if(filteredSkills.length===0&&allSkills.length>0){
      list.innerHTML='<div class="activity-empty"><p>No skills match your filter.</p></div>';
      empty.hidden=true;pagEl.hidden=true;return;
    }
    if(filteredSkills.length===0){list.innerHTML="";empty.hidden=false;pagEl.hidden=true;return;}
    empty.hidden=true;
    var start=skillsPage*SKILLS_PER_PAGE;
    var slice=filteredSkills.slice(start,start+SKILLS_PER_PAGE);
    list.innerHTML=slice.map(renderSkillRow).join("");
    // Store nav list for prev/next on detail page
    try{
      var navList=filteredSkills.map(function(s){return{ns:(s.namespace||"").replace(/^@/,""),name:s.name,display:s.name};});
      sessionStorage.setItem("dash_skills",JSON.stringify(navList));
    }catch(e){}
    var totalPages=Math.ceil(filteredSkills.length/SKILLS_PER_PAGE);
    renderPagination(pagEl,skillsPage,totalPages,function(p){skillsPage=p;renderSkillsPage();});
  }

  function renderPagination(container,currentPage,totalPages,onPage){
    if(totalPages<=1){container.hidden=true;return;}
    container.hidden=false;
    container.innerHTML='<button type="button" class="btn btn-ghost btn-sm pagination-prev"'+(currentPage===0?' disabled':'')+'>← Prev</button>'
      +'<span class="pagination-info">Page '+(currentPage+1)+' of '+totalPages+'</span>'
      +'<button type="button" class="btn btn-ghost btn-sm pagination-next"'+(currentPage>=totalPages-1?' disabled':'')+'>Next →</button>';
    container.querySelector(".pagination-prev").addEventListener("click",function(){if(currentPage>0)onPage(currentPage-1);});
    container.querySelector(".pagination-next").addEventListener("click",function(){if(currentPage<totalPages-1)onPage(currentPage+1);});
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

  document.getElementById("my-skills-search").addEventListener("input",function(){applySkillFilters(true)});
  document.getElementById("my-skills-sort").addEventListener("change",function(){applySkillFilters(true)});

  // Filter chips
  var filterChips=document.querySelector(".filter-chips");
  if(filterChips)filterChips.addEventListener("click",function(e){
    var chip=e.target.closest(".chip");
    if(!chip)return;
    document.querySelectorAll(".filter-chips .chip").forEach(function(c){c.classList.remove("chip-active");c.setAttribute("aria-pressed","false");});
    chip.classList.add("chip-active");chip.setAttribute("aria-pressed","true");
    currentFilter=chip.dataset.filter||"all";
    applySkillFilters(true);
  });

  // Bulk select toggle
  function updateBulkBar(){
    var count=selectedSkillIds.size;
    var countEl=document.getElementById("bulk-selected-count");
    if(countEl)countEl.textContent=count+" selected";
    var delBtn=document.getElementById("bulk-delete-btn");
    if(delBtn)delBtn.disabled=count===0;
  }

  document.getElementById("bulk-select-toggle").addEventListener("click",function(){
    selectionMode=!selectionMode;
    selectedSkillIds.clear();
    var btn=document.getElementById("bulk-select-toggle");
    btn.textContent=selectionMode?"Cancel":"Select";
    btn.classList.toggle("bulk-select-active",selectionMode);
    document.getElementById("bulk-action-bar").hidden=!selectionMode;
    updateBulkBar();
    applySkillFilters(false);
  });

  // ─── Delete skill + bulk checkbox (event delegation) ──────────────────
  document.getElementById("my-skills-list").addEventListener("click",function(evt){
    var cb=evt.target.closest(".bulk-skill-cb");
    if(cb){
      var key=cb.getAttribute("data-ns")+"/"+cb.getAttribute("data-name");
      if(cb.checked)selectedSkillIds.add(key);else selectedSkillIds.delete(key);
      var card=cb.closest(".my-skill-item");
      if(card)card.classList.toggle("bulk-selected",cb.checked);
      updateBulkBar();return;
    }
    var btn=evt.target.closest(".btn-delete-skill");
    if(!btn)return;
    evt.preventDefault();evt.stopPropagation();
    var ns=btn.getAttribute("data-ns");
    var name=btn.getAttribute("data-name");
    if(!confirm("Delete skill "+ns+"/"+name+"? This will remove all versions and cannot be undone."))return;
    fetch("/v1/skills/"+ns+"/"+encodeURIComponent(name),{method:"DELETE"})
      .then(function(r){return r.json()})
      .then(function(res){
        if(res.ok){
          var wrap=btn.closest(".my-skill-item");
          if(wrap)wrap.remove();
          allSkills=allSkills.filter(function(s){return!(s.namespace===ns&&s.name===name);});
          document.getElementById("stat-skill-count").textContent=String(allSkills.length);
          if(allSkills.length===0)document.getElementById("my-skills-empty").hidden=false;
        } else {alert("Delete failed: "+(res.error&&res.error.message||"unknown error"));}
      })
      .catch(function(){alert("Delete failed: network error");});
  });

  // Bulk delete
  document.getElementById("bulk-delete-btn").addEventListener("click",function(){
    if(selectedSkillIds.size===0)return;
    var toDelete=Array.from(selectedSkillIds);
    if(!confirm("Delete "+toDelete.length+" skill(s)? This cannot be undone."))return;
    var promises=toDelete.map(function(key){
      var parts=key.split("/");var ns=parts[0];var name=parts.slice(1).join("/");
      return fetch("/v1/skills/"+ns+"/"+encodeURIComponent(name),{method:"DELETE"}).then(function(r){return r.json();});
    });
    Promise.all(promises).then(function(){
      selectionMode=false;selectedSkillIds.clear();
      document.getElementById("bulk-select-toggle").textContent="Select";
      document.getElementById("bulk-select-toggle").classList.remove("bulk-select-active");
      document.getElementById("bulk-action-bar").hidden=true;
      fetch("/v1/skills?limit=500").then(function(r){return r.json();}).then(function(res){
        allSkills=res.data||[];
        document.getElementById("stat-skill-count").textContent=String(allSkills.length);
        applySkillFilters(true);
      });
    });
  });
})();
</script>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Skill detail page
// ─────────────────────────────────────────────────────────────────────────────

function skillDetailPage(c: Parameters<Parameters<Hono["get"]>[1]>[0]) {
  const url = new URL(c.req.url);
  const origin = url.origin; // e.g. http://localhost:9787
  const path = url.pathname;
  // path: /skill/@ns/name  or  /skill/ns/name
  const raw = path.replace(/^\/skill\//, "");
  const parts = raw.split("/");
  let ns = decodeURIComponent(parts[0] || "");
  if (!ns.startsWith("@")) ns = "@" + ns;
  const name = decodeURIComponent(parts[1] || "");

  if (!ns || !name) return notFound(path);

  const nsNoAt = ns.startsWith("@") ? ns.slice(1) : ns;
  const nsDisplay = ns.startsWith("@") ? ns : "@" + ns;

  return baseHtml({
    title: `${h(nsDisplay)}/${h(name)} — SkillSafe Local`,
    path,
    dataDir: _dataDir,
    css: SKILL_CSS,
    body: `
<div class="container skill-page">
  <!-- Breadcrumb + prev/next nav -->
  <nav class="breadcrumb-bar animate-in" id="breadcrumb-bar" aria-label="Breadcrumb">
    <div class="breadcrumb" id="breadcrumb">
      <a href="/dashboard" id="breadcrumb-back">Skills</a>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      <a href="/dashboard?ns=${h(nsNoAt)}" id="breadcrumb-ns">${h(nsDisplay)}</a>
      <span class="breadcrumb-sep">/</span>
      <span id="breadcrumb-name">${h(name)}</span>
    </div>
    <div class="skill-nav" id="skill-nav" hidden>
      <a id="nav-prev" class="skill-nav-btn" hidden aria-label="Previous skill">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        <span id="nav-prev-label">Prev</span>
      </a>
      <a id="nav-next" class="skill-nav-btn" hidden aria-label="Next skill">
        <span id="nav-next-label">Next</span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg>
      </a>
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
          <h1 id="skill-name" class="skill-name">${h(nsDisplay)}/${h(name)}</h1>
          <p id="skill-desc" class="skill-desc">Loading...</p>
        </div>
      </div>
    </div>
    <div class="skill-actions" id="skill-actions">
      <button id="star-btn" class="btn btn-secondary" type="button" hidden>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span id="star-text">Star</span>
      </button>
      <button id="bookmark-btn" class="btn btn-secondary" type="button" hidden aria-label="Bookmark this skill">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        Bookmark
      </button>
      <button id="share-btn" class="btn btn-secondary" type="button" onclick="window.copyText(location.href,'Link')" aria-label="Copy link to clipboard">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>
      <button id="copy-install-btn" class="btn btn-secondary" type="button" onclick="copyInstall()" aria-label="Copy install command">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        Install
      </button>
    </div>
  </div>

  <!-- Stats bar -->
  <div class="stats-bar animate-in stagger-2" id="stats-bar" hidden>
    <div class="stat-item">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span id="stat-downloads">0</span> downloads
    </div>
    <div class="stat-item">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span id="stat-stars">0</span> stars
    </div>
    <div class="stat-item">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span id="stat-demos">0</span> <span id="stat-demos-label">demos</span>
    </div>
    <div class="stat-item stat-item-category" id="stat-category-wrap" hidden>
      <span class="stat-category-pill" id="stat-category"></span>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs animate-in stagger-2" role="tablist" aria-label="Skill information">
    <button class="tab" data-tab="skills" type="button" role="tab" aria-selected="false" aria-controls="tab-skills" id="tab-btn-skills" tabindex="-1" hidden>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      Skills
    </button>
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
    <button class="tab" data-tab="dependencies" type="button" role="tab" aria-selected="false" aria-controls="tab-dependencies" id="tab-btn-dependencies" tabindex="-1">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      Dependencies
    </button>
    <button class="tab" data-tab="evals" type="button" role="tab" aria-selected="false" aria-controls="tab-evals" id="tab-btn-evals" tabindex="-1" hidden>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Evals
    </button>
    <button class="tab" data-tab="arenas" type="button" role="tab" aria-selected="false" aria-controls="tab-arenas" id="tab-btn-arenas" tabindex="-1" hidden>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>
      Arenas
    </button>
  </div>

  <!-- Tab content -->
  <div class="tab-content">

    <!-- Skills tab (skill sets only, hidden by default) -->
    <div id="tab-skills" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-skills">
      <div class="skillset-children">
        <div class="skillset-search">
          <input type="search" id="skillset-search-input" class="input" placeholder="Search skills in this collection..." aria-label="Search skills in this collection" />
        </div>
        <div id="skillset-children-grid" class="skills-grid">
          <div class="skeleton" style="height:140px;border-radius:var(--radius)"></div>
        </div>
        <div id="skillset-children-empty" class="empty-text" hidden>No skills found.</div>
      </div>
    </div>

    <!-- README tab (active) -->
    <div id="tab-readme" class="tab-panel active" role="tabpanel" aria-labelledby="tab-btn-readme">
      <div class="readme-card card">
        <div class="readme-header">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>SKILL.md</span>
        </div>
        <div id="readme-content" class="readme-body">
          <div class="skeleton" style="height:16px;width:60%;margin-bottom:12px"></div>
          <div class="skeleton" style="height:14px;width:90%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:14px;width:80%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:14px;width:70%;margin-bottom:24px"></div>
          <div class="skeleton" style="height:14px;width:85%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:14px;width:75%"></div>
        </div>
        <div id="security-summary-bar" class="security-summary-bar" hidden></div>
      </div>

      <!-- Sidebar inside readme panel -->
      <aside class="skill-sidebar">
        <div class="sidebar-section">
          <h2 class="sidebar-heading">Install <span class="sidebar-heading-hint">(Copy One)</span></h2>
          <div class="install-cmd" id="install-cmd-curl">
            <code id="install-cmd-text-curl">pip install skillsafe && skillsafe --api-base ${origin} install ${h(nsDisplay)}/${h(name)}</code>
            <button class="copy-btn" id="copy-install-curl" type="button" aria-label="Copy curl install command" onclick="copyCurl()">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span class="visually-hidden copy-label" aria-live="polite">Copy</span>
            </button>
          </div>
          <div class="install-cmd install-cmd-cli" id="install-cmd-cli">
            <code id="install-cmd-text-cli">skillsafe --api-base ${origin} install ${h(nsDisplay)}/${h(name)}</code>
            <button class="copy-btn" id="copy-install-cli" type="button" aria-label="Copy skillsafe install command" onclick="copyInstall()">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span class="visually-hidden copy-label" aria-live="polite">Copy</span>
            </button>
          </div>
        </div>

        <div class="sidebar-section">
          <h2 class="sidebar-heading">Details</h2>
          <div class="detail-list">
            <div class="detail-row">
              <span class="detail-label">Version</span>
              <span id="detail-version" class="detail-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Published</span>
              <span id="detail-published" class="detail-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Publisher</span>
              <span id="detail-publisher" class="detail-value">${h(nsNoAt)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">License</span>
              <span id="detail-license" class="detail-value">—</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Size</span>
              <span id="detail-size" class="detail-value">—</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section" id="tags-section" hidden>
          <h2 class="sidebar-heading">Tags</h2>
          <div id="tags-list" class="tags-list"></div>
        </div>

        <div class="sidebar-section" id="github-section" hidden>
          <h2 class="sidebar-heading">GitHub</h2>
          <div class="detail-list" id="github-details"></div>
          <a id="github-repo-link" href="#" target="_blank" rel="noopener noreferrer" class="github-repo-btn" hidden>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            View on GitHub
          </a>
        </div>
      </aside>
    </div>

    <!-- Security tab -->
    <div id="tab-security" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-security">
      <div id="security-content" class="security-content">
        <div id="sec-overview" class="sec-overview card">
          <div class="sec-overview-icon" id="sec-overview-icon">
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="sec-overview-body">
            <h2 id="sec-overview-title">Analyzing security...</h2>
            <p id="sec-overview-desc" class="sec-overview-desc">Checking scan reports and verification data.</p>
          </div>
        </div>
        <div id="sec-findings" class="sec-findings" hidden></div>
        <div id="scan-reports" class="scan-reports"></div>
        <!-- Bill of Materials -->
        <div id="bom-content" class="bom-content" hidden>
          <div class="bom-header">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
            <div>
              <h2>Bill of Materials</h2>
              <p class="sec-section-hint">Everything this skill can do — files, network, commands, and more.</p>
            </div>
          </div>
          <div id="bom-summary-cards" class="bom-summary-cards"></div>
          <div id="bom-full">
            <div id="bom-sections" class="bom-sections"></div>
          </div>
          <div id="bom-actions" class="bom-actions" hidden>
            <button id="bom-export" class="btn btn-secondary" type="button">Export JSON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Files tab -->
    <div id="tab-files" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-files">
      <div class="files-container card">
        <div class="files-sidebar">
          <div class="file-tree-header">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span id="file-tree-title">Files</span>
          </div>
          <div id="file-list" class="file-list">
            <div class="skeleton" style="height:36px;margin-bottom:4px"></div>
            <div class="skeleton" style="height:36px;margin-bottom:4px"></div>
            <div class="skeleton" style="height:36px"></div>
          </div>
        </div>
        <div class="files-main">
          <div id="file-preview-empty" class="file-preview-empty">
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>Select a file to preview</p>
          </div>
          <div id="file-preview" class="file-preview" hidden>
            <div class="file-preview-header">
              <span id="file-preview-name"></span>
              <div class="file-preview-actions">
                <span id="file-preview-size" class="file-size"></span>
                <button id="md-render-btn" class="preview-toggle-btn" type="button" aria-label="Toggle markdown preview" hidden>
                  <svg id="md-render-icon-preview" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg id="md-render-icon-code" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" hidden><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  <span id="md-render-label">Preview</span>
                </button>
                <button id="copy-file-btn" class="copy-btn" type="button" aria-label="Copy file contents">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            </div>
            <div class="file-preview-body">
              <pre id="file-preview-content"><code></code></pre>
              <div id="file-preview-rendered" class="file-preview-rendered" hidden></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Versions tab -->
    <div id="tab-versions" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-versions">
      <div id="versions-list" class="versions-list">
        <div class="skeleton" style="height:60px;margin-bottom:8px"></div>
        <div class="skeleton" style="height:60px;margin-bottom:8px"></div>
        <div class="skeleton" style="height:60px"></div>
      </div>
    </div>

    <!-- Dependencies tab -->
    <div id="tab-dependencies" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-dependencies">
      <div class="deps-content">
        <div class="deps-status-card card" id="deps-status-card">
          <div class="deps-status-header">
            <svg id="deps-status-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <div>
              <h2 id="deps-status-title">Loading...</h2>
              <p id="deps-status-text"></p>
            </div>
          </div>
        </div>
        <div id="deps-details"></div>
      </div>
    </div>

    <!-- Evals tab (hidden) -->
    <div id="tab-evals" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-evals">
      <div id="evals-content" class="evals-content">
        <div class="skeleton" style="height:120px;border-radius:var(--radius);margin-bottom:16px"></div>
        <div class="skeleton" style="height:80px;border-radius:var(--radius)"></div>
      </div>
      <div id="evals-empty" class="empty-text" hidden>
        No eval data yet. Upload with:<br>
        <code>skillsafe eval ${h(nsDisplay)}/${h(name)} --version 1.0.0</code>
      </div>
    </div>

    <!-- Arenas tab (hidden) -->
    <div id="tab-arenas" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-arenas">
      <div id="arenas-list" class="arenas-list">
        <div class="skeleton" style="height:80px;border-radius:var(--radius);margin-bottom:8px"></div>
        <div class="skeleton" style="height:80px;border-radius:var(--radius);margin-bottom:8px"></div>
      </div>
      <div id="arenas-empty" class="empty-text" hidden>No arenas yet.</div>
      <div id="arenas-load-more" class="load-more-wrap" hidden>
        <button id="arenas-load-more-btn" class="btn btn-secondary" type="button">Load more</button>
      </div>
    </div>

  </div>

  <section id="related-skills-section" class="related-skills" hidden>
    <h2 id="related-skills-heading">Related skills</h2>
    <div id="related-skills-grid" class="related-grid"></div>
  </section>


</div>`,
    scripts: `<script>
(function(){
  var NS="${h(nsNoAt)}";
  var NS_AT="@"+NS;
  var NAME="${h(name)}";
  var ORIGIN="${h(origin)}";

  // Adapters: use plain fetch locally (no auth)
  var apiFetch=function(url,opts){return fetch(url,opts);};
  var showToast=function(msg){console.log(msg);};

  // ─── From-dashboard breadcrumb + prev/next ───
  var urlParams=new URLSearchParams(window.location.search);
  if(urlParams.get("from")==="dashboard"){
    var backLink=document.getElementById("breadcrumb-back");
    if(backLink){backLink.href="/dashboard";backLink.textContent="Dashboard";}
    try{
      var raw=sessionStorage.getItem("dash_skills");
      if(raw){
        var list=JSON.parse(raw);
        var idx=list.findIndex(function(s){return s.ns===NS&&s.name===NAME;});
        if(idx!==-1){
          var navWrap=document.getElementById("skill-nav");
          if(navWrap)navWrap.hidden=false;
          if(idx>0){
            var prev=list[idx-1];
            var prevEl=document.getElementById("nav-prev");
            if(prevEl){prevEl.href="/skill/"+prev.ns+"/"+prev.name+"/?from=dashboard";prevEl.hidden=false;}
            var prevLabel=document.getElementById("nav-prev-label");
            if(prevLabel)prevLabel.textContent=prev.display;
          }
          if(idx<list.length-1){
            var next=list[idx+1];
            var nextEl=document.getElementById("nav-next");
            if(nextEl){nextEl.href="/skill/"+next.ns+"/"+next.name+"/?from=dashboard";nextEl.hidden=false;}
            var nextLabel=document.getElementById("nav-next-label");
            if(nextLabel)nextLabel.textContent=next.display;
          }
        }
      }
    }catch(e){}
  }

  // ─── Tab switching (WAI-ARIA pattern) ───
  var evalsLoaded=false,arenasLoaded=false;
  function activateTab(tab){
    var tabs=[].slice.call(document.querySelectorAll('[role="tab"]'));
    tabs.forEach(function(t){
      t.classList.remove("active");
      t.setAttribute("aria-selected","false");
      t.setAttribute("tabindex","-1");
    });
    document.querySelectorAll(".tab-panel").forEach(function(p){p.hidden=true;});
    tab.classList.add("active");
    tab.setAttribute("aria-selected","true");
    tab.setAttribute("tabindex","0");
    var target=tab.dataset.tab;
    var panel=document.getElementById("tab-"+target);
    if(panel)panel.hidden=false;
  }

  document.querySelectorAll('[role="tab"]').forEach(function(tab){
    tab.addEventListener("click",function(){
      activateTab(tab);
      var name2=tab.dataset.tab;
      if(name2)history.replaceState(null,"","#"+name2);
    });
  });

  // Arrow key navigation for tablist
  var tablist=document.querySelector('[role="tablist"]');
  if(tablist){
    tablist.addEventListener("keydown",function(e){
      var tabs=[].slice.call(tablist.querySelectorAll('[role="tab"]')).filter(function(t){return!t.hidden;});
      var idx=tabs.indexOf(document.activeElement);
      if(idx===-1)return;
      var newIdx=-1;
      if(e.key==="ArrowRight"){newIdx=(idx+1)%tabs.length;}
      if(e.key==="ArrowLeft"){newIdx=(idx-1+tabs.length)%tabs.length;}
      if(e.key==="Home"){newIdx=0;}
      if(e.key==="End"){newIdx=tabs.length-1;}
      if(newIdx!==-1){e.preventDefault();tabs[newIdx].focus();activateTab(tabs[newIdx]);}
    });
  }

  // Open tab from URL hash on load
  var hashTab=location.hash.slice(1)||new URLSearchParams(location.search).get("tab")||"";
  if(hashTab){
    var tabBtn=document.querySelector('[data-tab="'+hashTab+'"]');
    if(tabBtn&&!tabBtn.hidden)activateTab(tabBtn);
  }

  // ─── Utility functions ───
  function hEsc(s){var t=String(s||"");t=t.split("&").join("&amp;");t=t.split(String.fromCharCode(60)).join("&lt;");t=t.split(">").join("&gt;");t=t.split('"').join("&quot;");return t;}

  function formatDate(iso){
    var d=new Date(iso);
    var now=new Date();
    var diff=now.getTime()-d.getTime();
    var days=Math.floor(diff/86400000);
    if(days===0)return"today";
    if(days===1)return"yesterday";
    if(days<30)return days+" days ago";
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  }

  function formatNumber(n){
    if(n>=1000000)return(n/1000000).toFixed(1).replace(/\\.0$/,"")+"M";
    if(n>=1000)return(n/1000).toFixed(1).replace(/\\.0$/,"")+"K";
    return String(n);
  }

  function formatBytes(bytes){
    if(!bytes||bytes<0)return"0 B";
    var k=1024;
    var sizes=["B","KB","MB","GB"];
    var i=Math.floor(Math.log(bytes)/Math.log(k));
    return parseFloat((bytes/Math.pow(k,i)).toFixed(1))+" "+sizes[i];
  }

  // ─── Simple markdown renderer ───
  // Use \\x60 for backtick to avoid unescaped backtick inside template literal
  var _BT=String.fromCharCode(96);
  var _BT3=_BT+_BT+_BT;
  var _inlineMdCodeRe=new RegExp(_BT+"([^"+_BT+"]+)"+_BT,"g");
  function renderMarkdown(text){
    // Parse frontmatter into a table
    var fmMatch=text.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?([\\s\\S]*)$/);
    var tableHtml="";
    var body=text;
    if(fmMatch){
      body=fmMatch[2];
      var rows=[];
      fmMatch[1].split(/\\r?\\n/).forEach(function(line){
        var kv=line.match(/^(\\w[\\w-]*):\\s*(.+)$/);
        if(kv)rows.push('<tr><td class="fm-key">'+hEsc(kv[1])+'</td><td class="fm-val">'+hEsc(kv[2].replace(/^["']|["']$/g,"").trim())+'</td></tr>');
      });
      if(rows.length)tableHtml='<table class="fm-table"><tbody>'+rows.join("")+'</tbody></table>';
    }
    // Basic markdown to HTML
    var html=tableHtml;
    var lines=body.split(/\\r?\\n/);
    var inList=false,inCode=false,codeBuf=[];
    for(var i=0;i<lines.length;i++){
      var line=lines[i];
      if(line.startsWith(_BT3)){
        if(inCode){html+='<pre><code>'+hEsc(codeBuf.join("\\n"))+'</code></pre>';codeBuf=[];inCode=false;}
        else{inCode=true;}
        continue;
      }
      if(inCode){codeBuf.push(line);continue;}
      if(line.startsWith("### ")){if(inList){html+="</ul>";inList=false;}html+='<h3>'+hEsc(line.slice(4))+'</h3>';continue;}
      if(line.startsWith("## ")){if(inList){html+="</ul>";inList=false;}html+='<h2>'+hEsc(line.slice(3))+'</h2>';continue;}
      if(line.startsWith("# ")){if(inList){html+="</ul>";inList=false;}html+='<h1>'+hEsc(line.slice(2))+'</h1>';continue;}
      if(line.match(/^[-*] /)){if(!inList){html+="<ul>";inList=true;}html+='<li>'+inlineMd(line.slice(2))+'</li>';continue;}
      if(inList){html+="</ul>";inList=false;}
      if(line.trim()===""){html+="<br>";continue;}
      html+='<p>'+inlineMd(line)+'</p>';
    }
    if(inList)html+="</ul>";
    if(inCode)html+='<pre><code>'+hEsc(codeBuf.join("\\n"))+'</code></pre>';
    return'<div class="readme-rendered readme-markdown">'+html+'</div>';
  }
  function inlineMd(s){
    return hEsc(s)
      .replace(_inlineMdCodeRe,'<code>$1</code>')
      .replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>')
      .replace(/\\*([^*]+)\\*/g,'<em>$1</em>');
  }

  // ─── Load skill ───
  var latestVersion=null;
  var skillData=null;
  var githubRawBase=null;
  var currentFileContent="";
  var currentFilePath="";
  var mdRenderMode=true;

  loadSkill();

  function loadSkill(){
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME))
      .then(function(r){return r.json();})
      .then(function(body){
        if(!body.ok){
          var errEl=document.createElement("p");
          errEl.className="error-text";
          errEl.textContent=body.error&&body.error.message?body.error.message:"Skill not found";
          var readmeEl=document.getElementById("readme-content");
          readmeEl.textContent="";readmeEl.appendChild(errEl);
          return;
        }
        var skill=body.data;
        skillData=skill;
        // Build GitHub raw base for blob fallback
        var ghUrl=skill.github_repo_url||"";
        if(!ghUrl.startsWith("https://github.com/")&&skill.tags){
          var srcTag=String(skill.tags).split(",").find(function(t){return t.trim().startsWith("source:https://github.com/");});
          if(srcTag)ghUrl=srcTag.trim().slice("source:".length);
        }
        if(ghUrl.startsWith("https://github.com/")){
          var ghParts=ghUrl.replace("https://github.com/","").replace(/\\/+$/,"").split("/");
          if(ghParts.length>=2){
            var base="https://raw.githubusercontent.com/"+ghParts[0]+"/"+ghParts[1]+"/HEAD";
            var subpath=skill.github_subpath||(ghParts.length>4?ghParts.slice(4).join("/"):"");
            githubRawBase=subpath?base+"/"+subpath:base;
          }
        }
        var isSkillset=skill.skill_type==="skillset";
        renderSkill(skill);
        if(isSkillset){
          loadSkillsetChildren();
          loadSkillsetReadme();
        } else {
          loadVersions(skill.skill_id,skill.latest_version);
        }
      })
      .catch(function(){
        document.getElementById("readme-content").textContent="Could not connect to API.";
      });
  }

  function renderSkill(skill){
    var isSkillset=skill.skill_type==="skillset";
    document.title=skill.namespace+"/"+skill.name+" — SkillSafe Local";
    var rawNs=skill.namespace.replace(/^@+/,"");

    // Breadcrumb
    var bcNs=document.getElementById("breadcrumb-ns");
    bcNs.textContent="@"+rawNs;
    bcNs.href="/dashboard?ns="+encodeURIComponent(rawNs);
    document.getElementById("breadcrumb-name").textContent=skill.name;

    // Header
    var nameEl=document.getElementById("skill-name");
    var skillsetBadge=isSkillset?'<span class="badge badge-blue" style="font-size:0.7rem;vertical-align:middle;margin-left:8px">Skill Set</span>':"";
    nameEl.innerHTML='<a href="/dashboard?ns='+encodeURIComponent(rawNs)+'" class="ns">'+hEsc(skill.namespace)+'/</a>'+hEsc(skill.name)+skillsetBadge;
    if(isSkillset){
      var iconEl=document.querySelector(".skill-icon");
      if(iconEl)iconEl.innerHTML='<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
    }
    document.getElementById("skill-desc").textContent=skill.description||"No description provided";

    // Stats bar
    document.getElementById("stats-bar").hidden=false;
    var demoCount=skill.demo_count||0;
    if(isSkillset){
      var childCount=skill.child_skill_count||0;
      var statsDownEl=document.getElementById("stat-downloads");
      statsDownEl.parentElement.innerHTML='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>'+childCount+'</span> skills';
      document.getElementById("stat-stars").textContent=formatNumber((skill.star_count||0)+(skill.github_stars||0));
      var demosStatParent=document.getElementById("stat-demos");
      if(demosStatParent)demosStatParent.parentElement.hidden=true;
    } else {
      document.getElementById("stat-downloads").textContent=formatNumber((skill.install_count||0)+(skill.sh_install_count||0));
      document.getElementById("stat-stars").textContent=formatNumber((skill.star_count||0)+(skill.github_stars||0));
      document.getElementById("stat-demos").textContent=String(demoCount);
      document.getElementById("stat-demos-label").textContent=demoCount===1?"demo":"demos";
    }
    if(skill.category){
      document.getElementById("stat-category-wrap").hidden=false;
      document.getElementById("stat-category").textContent=skill.category;
    }

    // For skillsets: show Skills tab, hide non-applicable tabs, rebuild sidebar
    if(isSkillset){
      var skillsTab=document.getElementById("tab-btn-skills");
      skillsTab.hidden=false;
      activateTab(skillsTab);
      ["tab-btn-dependencies","tab-btn-versions","tab-btn-files","tab-btn-security","tab-btn-evals","tab-btn-arenas"].forEach(function(id){
        var el=document.getElementById(id);
        if(el)el.hidden=true;
      });
      var sidebar=document.querySelector(".skill-sidebar");
      if(sidebar){
        var childCount2=skill.child_skill_count||0;
        var totalStars2=(skill.star_count||0)+(skill.github_stars||0);
        var sHtml='<div class="sidebar-section"><h2 class="sidebar-heading">About</h2><div class="detail-list">'
          +'<div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">Skill Set</span></div>'
          +'<div class="detail-row"><span class="detail-label">Contains</span><span class="detail-value">'+childCount2+' skill'+(childCount2!==1?"s":"")+'</span></div>'
          +'<div class="detail-row"><span class="detail-label">Publisher</span><span class="detail-value">'+hEsc(skill.namespace)+'</span></div>'
          +(totalStars2>0?'<div class="detail-row"><span class="detail-label">Stars</span><span class="detail-value">'+formatNumber(totalStars2)+'</span></div>':"")
          +(skill.github_license?'<div class="detail-row"><span class="detail-label">License</span><span class="detail-value">'+hEsc(skill.github_license)+'</span></div>':"")
          +(skill.github_language?'<div class="detail-row"><span class="detail-label">Language</span><span class="detail-value">'+hEsc(skill.github_language)+'</span></div>':"")
          +'</div></div>';
        if(skill.github_repo_url&&skill.github_repo_url.startsWith("https://")){
          sHtml+='<div class="sidebar-section"><h2 class="sidebar-heading">GitHub</h2><div class="detail-list">'
            +(skill.github_stars!=null?'<div class="detail-row"><span class="detail-label">Stars</span><span class="detail-value">'+formatNumber(skill.github_stars)+'</span></div>':"")
            +(skill.github_forks!=null?'<div class="detail-row"><span class="detail-label">Forks</span><span class="detail-value">'+formatNumber(skill.github_forks)+'</span></div>':"")
            +'</div><a href="'+hEsc(skill.github_repo_url)+'" target="_blank" rel="noopener noreferrer" class="github-repo-btn"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>View on GitHub</a></div>';
        }
        sidebar.innerHTML=sHtml;
      }
      document.getElementById("readme-content").innerHTML='<div class="skeleton" style="height:16px;width:60%;margin-bottom:12px"></div><div class="skeleton" style="height:14px;width:90%;margin-bottom:8px"></div><div class="skeleton" style="height:14px;width:80%"></div>';
      return;
    }

    // Regular skill sidebar
    var curlCmd="pip install skillsafe && skillsafe --api-base "+ORIGIN+" install "+hEsc(skill.namespace)+"/"+hEsc(skill.name);
    var cliCmd="skillsafe --api-base "+ORIGIN+" install "+hEsc(skill.namespace)+"/"+hEsc(skill.name);
    document.getElementById("install-cmd-text-curl").textContent=curlCmd;
    document.getElementById("install-cmd-text-cli").textContent=cliCmd;
    document.getElementById("install-cmd-curl").title=curlCmd;
    document.getElementById("install-cmd-cli").title=cliCmd;
    // Locally always show curl prominently
    document.getElementById("install-cmd-curl").classList.add("install-cmd-primary");

    document.getElementById("detail-version").textContent=skill.latest_version||"—";
    document.getElementById("detail-published").textContent=skill.updated_at?formatDate(skill.updated_at):"—";
    document.getElementById("detail-publisher").textContent=rawNs;
    latestVersion=skill.latest_version;

    if(skill.tags){
      var tagsSection=document.getElementById("tags-section");
      var tagsList2=document.getElementById("tags-list");
      var displayTags=skill.tags.split(",").map(function(t){return t.trim();}).filter(function(t){return t&&!t.startsWith("source:");});
      if(displayTags.length>0){
        tagsSection.hidden=false;
        tagsList2.innerHTML=displayTags.map(function(t){
          return'<a href="/dashboard?q='+encodeURIComponent(t)+'" class="tag-chip">'+hEsc(t)+'</a>';
        }).join("");
      }
    }

    if(skill.github_repo_url){
      var ghSection=document.getElementById("github-section");
      ghSection.hidden=false;
      var ghDetails=document.getElementById("github-details");
      var ghHtml="";
      if(skill.github_stars!=null)ghHtml+='<div class="detail-row"><span class="detail-label">Stars</span><span class="detail-value">'+formatNumber(skill.github_stars)+'</span></div>';
      if(skill.github_forks!=null)ghHtml+='<div class="detail-row"><span class="detail-label">Forks</span><span class="detail-value">'+formatNumber(skill.github_forks)+'</span></div>';
      if(skill.github_language)ghHtml+='<div class="detail-row"><span class="detail-label">Language</span><span class="detail-value">'+hEsc(skill.github_language)+'</span></div>';
      if(skill.github_license)ghHtml+='<div class="detail-row"><span class="detail-label">License</span><span class="detail-value">'+hEsc(skill.github_license)+'</span></div>';
      if(skill.github_pushed_at)ghHtml+='<div class="detail-row"><span class="detail-label">Updated</span><span class="detail-value">'+formatDate(skill.github_pushed_at)+'</span></div>';
      if(skill.github_topics){
        try{
          var topics=JSON.parse(skill.github_topics);
          if(Array.isArray(topics)&&topics.length>0){
            ghHtml+='<div class="github-topics-row"><span class="detail-label">Topics</span><div class="github-topics-chips">'+topics.slice(0,8).map(function(t){return'<a href="/dashboard?q='+encodeURIComponent(t)+'" class="tag-chip">'+hEsc(t)+'</a>';}).join("")+'</div></div>';
          }
        }catch(e){}
      }
      ghDetails.innerHTML=ghHtml;
      var repoLink=document.getElementById("github-repo-link");
      if(skill.github_repo_url.startsWith("https://")){
        repoLink.href=skill.github_repo_url;
        repoLink.hidden=false;
      }
    }
    if(skill.github_license){
      var licEl=document.getElementById("detail-license");
      if(licEl&&licEl.textContent==="—")licEl.textContent=skill.github_license;
    }

    // README — static from description, full SKILL.md loaded via loadSkillsetReadme-style fetch
    loadReadme(skill);

    // Copy sidebar buttons
    document.getElementById("copy-install-curl").addEventListener("click",function(){
      navigator.clipboard.writeText(curlCmd).then(function(){showToast("Copied curl command!","success");}).catch(function(){showToast("Failed to copy","error");});
    });
    document.getElementById("copy-install-cli").addEventListener("click",function(){
      navigator.clipboard.writeText(cliCmd).then(function(){showToast("Copied install command!","success");}).catch(function(){showToast("Failed to copy","error");});
    });

    // Share button
    var shareBtn=document.getElementById("share-btn");
    if(shareBtn)shareBtn.addEventListener("click",function(){
      navigator.clipboard.writeText(location.href).then(function(){
        shareBtn.classList.add("shared");
        showToast("Link copied to clipboard","success");
        setTimeout(function(){shareBtn.classList.remove("shared");},1200);
      });
    });

    // Copy-install button in header
    var copyInstBtn=document.getElementById("copy-install-btn");
    if(copyInstBtn)copyInstBtn.addEventListener("click",function(){
      navigator.clipboard.writeText(cliCmd).then(function(){showToast("Install command copied","success");});
    });

    // Related skills
    loadRelatedSkills(skill);

    // Check evals
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/eval")
      .then(function(r){return r.json();})
      .then(function(body2){
        if(body2.ok&&Array.isArray(body2.data)&&body2.data.length>0){
          var evTabBtn=document.getElementById("tab-btn-evals");
          evTabBtn.hidden=false;
          var cntEl=document.getElementById("eval-tab-count");
          if(cntEl)cntEl.textContent=String(body2.data.length);
        }
      }).catch(function(){});

    // Check arenas
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/arenas?limit=1")
      .then(function(r){return r.json();})
      .then(function(body3){
        if(body3.ok&&Array.isArray(body3.data)&&body3.data.length>0){
          var arTabBtn=document.getElementById("tab-btn-arenas");
          arTabBtn.hidden=false;
        }
      }).catch(function(){});
  }

  // ─── README ───
  function loadReadme(skill){
    var rawNs2=skill.namespace.replace(/^@+/,"");
    var authorHref="/dashboard?ns="+encodeURIComponent(rawNs2);
    function renderStaticReadme(descText){
      var html='<div class="readme-rendered">'
        +'<h2>'+hEsc(skill.name||NAME)+'</h2>'
        +'<p style="font-size:1rem;line-height:1.6;margin-bottom:20px;">'+hEsc(descText)+'</p>'
        +'<p style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:20px;">by <a href="'+authorHref+'" style="color:var(--accent)">@'+hEsc(rawNs2)+'</a></p>'
        +'<div id="readme-scan-section"></div>'
        +'<h3>About</h3>'
        +'<p>This skill is saved on SkillSafe with dual-side cryptographic verification.</p>'
        +(skill.latest_version?'<p><strong>Latest version:</strong> '+hEsc(skill.latest_version)+'</p>':"")
        +'<p style="margin-top:16px;"><a href="#files" class="readme-read-more" data-click-tab="files" data-select-file="SKILL.md" style="color:var(--accent);font-size:0.9rem;">Read more in SKILL.md \u2192</a></p>'
        +'</div>';
      document.getElementById("readme-content").innerHTML=html;
    }
    if(skill.description){
      renderStaticReadme(skill.description);
    } else {
      renderStaticReadme("Loading...");
      apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/readme")
        .then(function(r){if(r.ok)return r.text();throw new Error("no readme");})
        .then(function(md){
          var fmMatch=md.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?([\\s\\S]*)$/);
          if(fmMatch){
            var descMatch=fmMatch[1].match(/^description:\\s*(.+)$/m);
            if(descMatch){renderStaticReadme(descMatch[1].replace(/^["']|["']$/g,"").trim());return;}
          }
          var body=fmMatch?fmMatch[2]:md;
          var firstLine=body.split(/\\r?\\n/).find(function(l){return l.trim().length>0;});
          renderStaticReadme(firstLine?firstLine.replace(/^#+\\s*/,"").trim():"No description provided.");
        })
        .catch(function(){renderStaticReadme("No description provided.");});
    }
  }

  // ─── Skillset children ───
  var childrenCursor=null;
  var childSearchTimeout=null;
  function loadSkillsetChildren(reset){
    if(reset===undefined)reset=true;
    var grid=document.getElementById("skillset-children-grid");
    var emptyEl=document.getElementById("skillset-children-empty");
    var loadMoreWrap=document.getElementById("skillset-load-more");
    if(reset){childrenCursor=null;grid.innerHTML="";}
    var params=new URLSearchParams();
    var qInput=document.getElementById("skillset-search-input");
    var q=qInput?qInput.value.trim():"";
    if(q)params.set("q",q);
    params.set("limit","20");
    if(childrenCursor)params.set("cursor",childrenCursor);
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/children?"+params.toString())
      .then(function(r){return r.json();})
      .then(function(body){
        if(body.ok&&body.data&&body.data.length>0){
          emptyEl.hidden=true;
          grid.setAttribute("aria-busy","false");
          body.data.forEach(function(child,i){grid.appendChild(createChildSkillCard(child,i));});
          if(body.meta&&body.meta.pagination&&body.meta.pagination.has_more&&body.meta.pagination.next_cursor){
            childrenCursor=body.meta.pagination.next_cursor;
            if(loadMoreWrap)loadMoreWrap.hidden=false;
          } else {
            if(loadMoreWrap)loadMoreWrap.hidden=true;
          }
        } else if(reset){
          grid.innerHTML="";grid.setAttribute("aria-busy","false");
          emptyEl.hidden=false;if(loadMoreWrap)loadMoreWrap.hidden=true;
        }
      })
      .catch(function(){
        grid.innerHTML="";grid.setAttribute("aria-busy","false");
        emptyEl.hidden=false;emptyEl.textContent="Failed to load skills.";
      });
  }

  function createChildSkillCard(skill,index){
    var a=document.createElement("a");
    a.href="/skill/"+(skill.namespace||"").replace("@","")+"/"+skill.name;
    a.className="skill-card card card-interactive animate-in";
    a.style.animationDelay=index*0.03+"s";
    var scanBadge="";
    if(skill.scan_clean==1){
      scanBadge='<span class="badge badge-green"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg> Scanned</span>';
    } else if(skill.scan_clean==0){
      var fc=skill.scan_findings_count||0;
      scanBadge='<span class="badge badge-amber">'+fc+' finding'+(fc!==1?"s":"")+'</span>';
    }
    var catBadge=skill.category?'<span class="badge badge-blue">'+hEsc(skill.category)+'</span>':"";
    a.innerHTML='<div class="skill-card-top"><div class="skill-card-name"><span class="skill-ns">'+hEsc(skill.namespace||"")+'/</span><strong>'+hEsc(skill.name)+'</strong></div><div class="skill-card-badges">'+scanBadge+'</div></div>'
      +'<p class="skill-card-desc">'+hEsc(skill.description||"No description")+'</p>'
      +'<div class="skill-card-bottom"><div class="skill-card-stats"><span class="stat"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+((skill.install_count||0)+(skill.sh_install_count||0))+'</span></div>'
      +'<div class="skill-card-tags">'+(skill.latest_version?'<code class="version-tag">v'+hEsc(skill.latest_version)+'</code>':"")+''+catBadge+'</div></div>';
    return a;
  }

  var searchInputEl=document.getElementById("skillset-search-input");
  if(searchInputEl)searchInputEl.addEventListener("input",function(){
    if(childSearchTimeout)clearTimeout(childSearchTimeout);
    childSearchTimeout=setTimeout(function(){loadSkillsetChildren(true);},300);
  });
  var loadMoreChildrenBtn=document.getElementById("skillset-load-more-btn");
  if(loadMoreChildrenBtn)loadMoreChildrenBtn.addEventListener("click",function(){loadSkillsetChildren(false);});

  // ─── Skillset README ───
  function loadSkillsetReadme(){
    var readmeEl=document.getElementById("readme-content");
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/readme")
      .then(function(r){
        if(r.ok)return r.text();
        throw new Error("no readme");
      })
      .then(function(md){
        readmeEl.innerHTML='<div class="readme-rendered readme-markdown">'+renderMarkdown(md)+'</div>';
      })
      .catch(function(){
        readmeEl.innerHTML='<div class="readme-rendered"><p style="color:var(--text-tertiary);font-style:italic">No SKILL.md available.</p></div>';
      });
  }

  // ─── Versions ───
  var versionsLoaded=false;
  function loadVersions(skillId,latestVer){
    if(latestVer)latestVersion=latestVer;
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/versions?limit=20")
      .then(function(r){return r.json();})
      .then(function(body){
        if(body.ok&&body.data)renderVersions(body.data);
        if(latestVersion)loadLatestVersion(latestVersion);
      })
      .catch(function(){});
  }

  function renderVersions(versions){
    var list=document.getElementById("versions-list");
    if(versions.length===0){list.innerHTML='<p class="empty-text">No versions saved yet.</p>';return;}
    var improvTypes={example:{label:"Example",cls:"badge-blue"},patch:{label:"Patch",cls:"badge-orange"},instruction:{label:"Instruction",cls:"badge-purple"},bugfix:{label:"Bugfix",cls:"badge-yellow"}};
    function parseChangelog(cl){
      if(!cl)return{type:null,text:""};
      var m=cl.match(/^\\[(example|patch|instruction|bugfix)\\]\\s*/);
      if(m)return{type:m[1],text:cl.slice(m[0].length)};
      return{type:null,text:cl};
    }
    list.innerHTML=versions.map(function(v,i){
      var parsed=parseChangelog(v.changelog);
      var typeBadge=parsed.type&&improvTypes[parsed.type]?'<span class="badge '+improvTypes[parsed.type].cls+'">'+improvTypes[parsed.type].label+'</span>':"";
      return'<div class="version-item card card-hover animate-in" style="animation-delay:'+(i*0.03)+'s">'
        +'<div class="version-main"><div class="version-label">'
        +'<code class="version-tag-lg">'+hEsc(v.version)+'</code>'
        +(v.yanked?'<span class="badge badge-red">Yanked</span>':"")
        +(i===0?'<span class="badge badge-green">Latest</span>':"")
        +typeBadge
        +'</div><div class="version-meta">'
        +'<span>Saved '+formatDate(v.saved_at)+'</span>'
        +(v.archive_size_bytes?'<span>'+formatBytes(v.archive_size_bytes)+'</span>':"")
        +'</div></div>'
        +(parsed.text?'<div class="version-changelog"><p>'+hEsc(parsed.text)+'</p></div>':"")
        +'<div class="version-hash"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><code>'+hEsc(v.tree_hash||"—")+'</code></div>'
        +'</div>';
    }).join("");
  }

  function loadLatestVersion(ver){
    var semverRe=/^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?(\\+[a-zA-Z0-9.]+)?$/;
    if(!semverRe.test(ver))return;
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/versions/"+encodeURIComponent(ver))
      .then(function(r){return r.json();})
      .then(function(body){
        if(body.ok&&body.data){
          var v=body.data;
          if(v.archive_size_bytes)document.getElementById("detail-size").textContent=formatBytes(v.archive_size_bytes);
          if(v.files&&v.files.length>0)renderFiles(v.files);
          var verifs=(v.verifications||[]).map(function(vr){
            var details={};
            if(vr.details_json){try{details=JSON.parse(vr.details_json);}catch(e){}}
            return Object.assign({},vr,{details:details});
          });
          renderSecurityTab(v.scan_reports,verifs);
          renderBomTab(v.scan_reports);
          renderDependenciesTab(v.manifest_json);
        }
      }).catch(function(){});
  }

  // ─── Security tab ───
  function renderSecurityTab(scanReports,verifications){
    var overviewTitle=document.getElementById("sec-overview-title");
    var overviewDesc=document.getElementById("sec-overview-desc");
    var overviewIconSvg=document.querySelector("#sec-overview-icon svg");
    var findingsEl=document.getElementById("sec-findings");
    var container=document.getElementById("scan-reports");

    if(!scanReports||scanReports.length===0){
      overviewTitle.textContent="Not scanned yet";
      overviewDesc.textContent="This skill version has not been scanned for security issues.";
      if(overviewIconSvg)overviewIconSvg.style.stroke="var(--text-tertiary)";
      return;
    }
    var pub=null;
    for(var i=0;i<scanReports.length;i++){if(scanReports[i].report_type==="publisher"){pub=scanReports[i];break;}}
    if(!pub){
      overviewTitle.textContent="No scan report";
      overviewDesc.textContent="The publisher did not include a scan report with this version.";
      if(overviewIconSvg)overviewIconSvg.style.stroke="var(--text-tertiary)";
      return;
    }
    var findingsCount=Number(pub.findings_count)||0;
    var isClean=pub.clean;
    if(isClean){
      if(overviewIconSvg)overviewIconSvg.style.stroke="var(--green)";
      overviewTitle.textContent="No issues found";
      overviewDesc.textContent="The security scanner checked this skill and found no problems. It looks safe to use.";
    } else {
      var hasCritical=false;
      try{var fs=typeof pub.findings_summary==="string"?JSON.parse(pub.findings_summary):pub.findings_summary;hasCritical=(fs||[]).some(function(x){return x.severity==="critical";});}catch(e){}
      if(hasCritical){
        if(overviewIconSvg)overviewIconSvg.style.stroke="var(--red)";
        overviewTitle.textContent=findingsCount+" issue"+(findingsCount!==1?"s":"")+" found — review recommended";
        overviewDesc.textContent="The scanner found critical issues. Review the findings below before using this skill.";
      } else {
        if(overviewIconSvg)overviewIconSvg.style.stroke="var(--amber)";
        overviewTitle.textContent=findingsCount+" issue"+(findingsCount!==1?"s":"")+" found";
        overviewDesc.textContent="The scanner found some items worth reviewing. These may be expected behavior for this skill.";
      }
    }

    // Verification badges
    if(verifications&&verifications.length>0){
      var last=verifications[0];
      var vLabels={verified:["badge-green","Verified","An independent re-scan confirmed the publisher's report."],divergent:["badge-amber","Divergent","The re-scan produced different results."],critical:["badge-red","Critical","The re-scan found critical differences."]};
      var vl=vLabels[last.verdict]||["badge-blue",last.verdict,""];
      var badge=document.createElement("div");
      badge.className="sec-verification-badge";
      badge.innerHTML='<span class="badge '+vl[0]+'">'+hEsc(vl[1])+'</span><span class="sec-verification-hint">'+hEsc(vl[2])+'</span>';
      var secOverviewBody=document.querySelector("#sec-overview .sec-overview-body");
      if(secOverviewBody)secOverviewBody.appendChild(badge);
    }

    // Security summary bar in README card
    var summaryBar=document.getElementById("security-summary-bar");
    if(summaryBar){
      summaryBar.innerHTML='<div class="security-summary-left"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+(isClean?"var(--green)":"var(--amber)")+'" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span class="security-summary-status '+(isClean?"is-clean":"is-findings")+'">'+(isClean?"Clean":findingsCount+" finding"+(findingsCount!==1?"s":""))+'</span></div><a href="#" class="security-summary-link" id="security-summary-link">View security details →</a>';
      summaryBar.hidden=false;
      var sumLink=document.getElementById("security-summary-link");
      if(sumLink)sumLink.addEventListener("click",function(e){e.preventDefault();var secBtn=document.getElementById("tab-btn-security");if(secBtn)secBtn.click();});
    }

    // Findings grouped by severity
    if(pub.findings_summary&&!isClean){
      var findings=[];
      try{findings=typeof pub.findings_summary==="string"?JSON.parse(pub.findings_summary):pub.findings_summary;}catch(e){}
      if(findings.length>0){
        var sevOrder=["critical","high","medium","low","info"];
        var sevLabels={
          critical:["badge-red","Critical","These issues need attention before using this skill."],
          high:["badge-red","High","Potentially risky patterns detected."],
          medium:["badge-amber","Medium","Noteworthy items — may be normal for this type of skill."],
          low:["badge-blue","Low","Minor observations, generally not a concern."],
          info:["badge-blue","Info","Informational notes about the skill."]
        };
        var grouped={};
        findings.forEach(function(f){var sev=f.severity||"info";(grouped[sev]=grouped[sev]||[]).push(f);});
        var fHtml="";
        sevOrder.forEach(function(sev){
          var items=grouped[sev];
          if(!items||items.length===0)return;
          var sl=sevLabels[sev]||["badge-blue",sev,""];
          fHtml+='<div class="sec-findings-group card"><div class="sec-findings-group-header"><span class="badge '+sl[0]+'">'+hEsc(sl[1])+'</span><span class="sec-findings-count">'+items.length+'</span><span class="sec-findings-hint">'+hEsc(sl[2])+'</span></div><div class="sec-findings-list">';
          items.forEach(function(f){
            var fileLoc=f.file?hEsc(f.file)+(f.line?":"+f.line:""):"";
            var lineNum=Number(f.line)||0;
            var clickable=f.file&&lineNum>0;
            fHtml+='<div class="sec-finding-row"><span class="sec-finding-msg">'+hEsc(f.message||"")+'</span>'
              +(fileLoc?'<a class="sec-finding-loc'+(clickable?" sec-finding-loc-link":"")+ '" href="#"'+(clickable?' data-file="'+hEsc(f.file)+'" data-line="'+lineNum+'"':"")+'>'+ fileLoc+'</a>':"")
              +'</div>';
          });
          fHtml+='</div></div>';
        });
        findingsEl.innerHTML=fHtml;
        findingsEl.hidden=false;
        findingsEl.querySelectorAll(".sec-finding-loc-link").forEach(function(link){
          link.addEventListener("click",function(e){
            e.preventDefault();
            var file=link.dataset.file||"";
            var line=Number(link.dataset.line)||0;
            if(file&&line)navigateToFileLine(file,line);
          });
        });
      }
    }

    // Scan metadata
    container.innerHTML='<div class="sec-scan-meta card"><div class="detail-list">'
      +'<div class="detail-row"><span class="detail-label">Scanner version</span><span class="detail-value">v'+hEsc(pub.scanner_version||"—")+'</span></div>'
      +'<div class="detail-row"><span class="detail-label">Ruleset</span><span class="detail-value">v'+hEsc(pub.ruleset_version||"—")+'</span></div>'
      +'<div class="detail-row"><span class="detail-label">Scanned on</span><span class="detail-value">'+(pub.submitted_at?formatDate(pub.submitted_at):"—")+'</span></div>'
      +'</div></div>';
  }

  // ─── Files tab (tree view) ───
  function fileTypeIcon(path){
    var ext=(path.split(".").pop()||"").toLowerCase();
    if(ext==="md"||ext==="mdx")return'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>';
    if(["js","ts","mjs","mts","jsx","tsx","py"].indexOf(ext)!==-1)return'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
    if(["json","yaml","yml","toml","ini","cfg"].indexOf(ext)!==-1)return'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    return'<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  function addLineNumbers(codeEl){
    var text=codeEl.textContent||"";
    var lines=text.split("\\n");
    if(lines.length>1&&lines[lines.length-1]==="")lines.pop();
    codeEl.innerHTML=lines.map(function(line,i){
      return'<span class="code-line"><span class="line-num">'+(i+1)+'</span>'+hEsc(line)+'</span>';
    }).join("\\n");
  }

  function renderFiles(files){
    var fileList=document.getElementById("file-list");
    var realFiles=files.length>1?files.filter(function(f){return f.file_path!=="archive.zip";}):files;
    var isV1Archive=realFiles.length===1&&realFiles[0].file_path==="archive.zip";
    document.getElementById("file-tree-title").textContent=realFiles.length+" file"+(realFiles.length!==1?"s":"");

    // Build tree
    var root={name:"",path:"",children:{},file:null};
    realFiles.forEach(function(f){
      var parts=(f.file_path||"").split("/");
      var node=root;
      for(var pi=0;pi<parts.length;pi++){
        var part=parts[pi];
        if(!node.children[part])node.children[part]={name:part,path:parts.slice(0,pi+1).join("/"),children:{},file:null};
        node=node.children[part];
      }
      node.file=f;
    });

    function renderNode(node,depth){
      var entries=Object.values(node.children);
      var folders=entries.filter(function(n){return Object.keys(n.children).length>0||!n.file;}).sort(function(a,b){return a.name.localeCompare(b.name);});
      var leafFiles=entries.filter(function(n){return Object.keys(n.children).length===0&&n.file;}).sort(function(a,b){return a.name.localeCompare(b.name);});
      var html="";
      var indent=depth*16;
      folders.forEach(function(folder){
        html+='<div class="tree-folder" data-folder="'+hEsc(folder.path)+'">'
          +'<div class="tree-folder-header" role="button" tabindex="0" style="padding-left:'+(12+indent)+'px">'
          +'<svg class="tree-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
          +'<svg class="tree-folder-icon" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-muted)" stroke="var(--accent)" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
          +'<span class="tree-folder-name">'+hEsc(folder.name)+'</span>'
          +'</div><div class="tree-folder-children" hidden>'+renderNode(folder,depth+1)+'</div></div>';
      });
      leafFiles.forEach(function(leaf){
        var f=leaf.file;
        html+='<div class="file-item" role="button" tabindex="0" title="'+hEsc(f.file_path)+'" data-path="'+hEsc(f.file_path)+'" data-hash="'+hEsc(f.file_hash)+'" data-size="'+(f.file_size_bytes||0)+'" style="padding-left:'+(12+indent)+'px">'
          +fileTypeIcon(f.file_path)
          +'<span class="file-name">'+hEsc(leaf.name)+'</span>'
          +'</div>';
      });
      return html;
    }
    fileList.innerHTML=renderNode(root,0);

    // Folder toggle
    fileList.querySelectorAll(".tree-folder-header").forEach(function(header){
      header.addEventListener("click",function(){
        var folder=header.parentElement;
        var children=folder.querySelector(".tree-folder-children");
        var isOpen=!children.hidden;
        children.hidden=isOpen;
        folder.classList.toggle("tree-folder-open",!isOpen);
      });
      header.addEventListener("keydown",function(e){
        if(e.key==="Enter"||e.key===" "){e.preventDefault();header.click();}
      });
    });

    // Copy button
    var copyFileBtn=document.getElementById("copy-file-btn");
    if(copyFileBtn)copyFileBtn.addEventListener("click",function(){
      navigator.clipboard.writeText(currentFileContent).then(function(){showToast("Copied!","success");}).catch(function(){showToast("Failed to copy","error");});
    });

    // Markdown toggle
    var mdRenderBtn=document.getElementById("md-render-btn");
    var mdIconPreview=document.getElementById("md-render-icon-preview");
    var mdIconCode=document.getElementById("md-render-icon-code");
    var mdLabelEl=document.getElementById("md-render-label");
    var renderedDiv=document.getElementById("file-preview-rendered");
    var preBlock=document.getElementById("file-preview-content");

    function applyMdMode(){
      var isMd=/\\.(md|mdx)$/i.test(currentFilePath);
      if(isMd&&mdRenderMode){
        renderedDiv.innerHTML=renderMarkdown(currentFileContent);
        renderedDiv.hidden=false;preBlock.hidden=true;
        mdIconPreview.hidden=true;mdIconCode.hidden=false;mdLabelEl.textContent="Code";
      } else {
        renderedDiv.hidden=true;preBlock.hidden=false;
        mdIconPreview.hidden=false;mdIconCode.hidden=true;mdLabelEl.textContent="Preview";
      }
    }

    if(mdRenderBtn)mdRenderBtn.addEventListener("click",function(){mdRenderMode=!mdRenderMode;applyMdMode();});

    fileList.querySelectorAll(".file-item").forEach(function(item){
      function activateFileItem(){
        fileList.querySelectorAll(".file-item.active").forEach(function(a){a.classList.remove("active");});
        item.classList.add("active");
        var preview=document.getElementById("file-preview");
        var emptyState=document.getElementById("file-preview-empty");
        preview.hidden=false;emptyState.hidden=true;
        var filePath=item.dataset.path||"";
        currentFilePath=filePath;
        document.getElementById("file-preview-name").textContent=filePath;
        document.getElementById("file-preview-size").textContent=formatBytes(parseInt(item.dataset.size||"0"));
        var code=document.querySelector("#file-preview-content code");
        var isMd=/\\.(md|mdx)$/i.test(filePath);
        if(mdRenderBtn)mdRenderBtn.hidden=!isMd;
        if(!isMd){renderedDiv.hidden=true;preBlock.hidden=false;}
        function showContent(text){
          currentFileContent=text;
          code.textContent=text;
          addLineNumbers(code);
          applyMdMode();
        }
        if(isV1Archive){showContent("# Download the archive to view file contents");return;}
        var hash=item.dataset.hash;
        var size=parseInt(item.dataset.size||"0");
        if(hash&&size<500000){
          currentFileContent="";code.textContent="Loading...";
          apiFetch("/v1/blobs/"+encodeURIComponent(hash))
            .then(function(r){
              if(r.ok)return r.text().then(showContent);
              if(githubRawBase&&filePath){
                var candidates=[githubRawBase+"/"+filePath,githubRawBase+"/skills/"+NAME+"/"+filePath];
                var found=false;
                function tryNext(idx){
                  if(idx>=candidates.length){if(!found)showContent("# Could not load preview");return;}
                  fetch(candidates[idx]).then(function(gr){
                    if(gr.ok){found=true;gr.text().then(showContent);}else tryNext(idx+1);
                  }).catch(function(){tryNext(idx+1);});
                }
                tryNext(0);
              } else {showContent("# Could not load preview");}
            }).catch(function(){showContent("# Could not load preview");});
        } else if(size>=500000){
          showContent("# File too large for preview ("+formatBytes(size)+")");
        } else {
          showContent("# No content hash available");
        }
      }
      item.addEventListener("click",activateFileItem);
      item.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();activateFileItem();}});
    });

    // Auto-select first file
    var firstItem=fileList.querySelector(".file-item");
    if(firstItem)firstItem.click();
  }

  function navigateToFileLine(filePath,line){
    mdRenderMode=false;
    var filesTab=document.getElementById("tab-btn-files");
    if(filesTab)filesTab.click();
    var fileList=document.getElementById("file-list");
    if(!fileList)return;
    var targetItem=null;
    fileList.querySelectorAll(".file-item").forEach(function(item){
      if(item.dataset.path===filePath)targetItem=item;
    });
    if(!targetItem)return;
    var parent=targetItem.parentElement;
    while(parent&&parent!==fileList){
      if(parent.classList.contains("tree-folder-children")){
        parent.hidden=false;
        if(parent.parentElement)parent.parentElement.classList.add("tree-folder-open");
      }
      parent=parent.parentElement;
    }
    targetItem.click();
    function scrollToLine(){
      var codeEl=document.getElementById("file-preview-content");
      if(!codeEl)return;
      var lineEls=codeEl.querySelectorAll(".code-line");
      codeEl.querySelectorAll(".code-line-highlight").forEach(function(el){el.classList.remove("code-line-highlight");});
      var targetLine=lineEls[line-1];
      if(targetLine){targetLine.classList.add("code-line-highlight");targetLine.scrollIntoView({behavior:"smooth",block:"center"});}
    }
    setTimeout(scrollToLine,300);setTimeout(scrollToLine,800);
  }

  // ─── BOM tab ───
  function renderBomTab(scanReports){
    var bomContentEl=document.getElementById("bom-content");
    var summaryEl=document.getElementById("bom-summary-cards");
    var actionsEl=document.getElementById("bom-actions");
    if(!scanReports||scanReports.length===0)return;
    var pub=null;
    for(var i=0;i<scanReports.length;i++){if(scanReports[i].report_type==="publisher"){pub=scanReports[i];break;}}
    if(!pub)return;
    var bomSummary=null;
    try{bomSummary=typeof pub.bom_summary==="string"?JSON.parse(pub.bom_summary):pub.bom_summary;}catch(e){}
    if(!bomSummary)return;
    bomContentEl.hidden=false;
    var capInfo={network:["Connects to the internet","This skill sends or receives data over the network.","🌐"],file_access:["Reads or writes files","This skill accesses files on your system.","📁"],env_read:["Reads environment variables","This skill checks settings like API keys from your environment.","🔑"],subprocess:["Runs commands","This skill executes shell commands or external programs.","⚙️"]};
    var riskColors={none:"var(--green)",low:"var(--green)",medium:"var(--amber)",high:"var(--red)"};
    var riskLabels={none:["No capabilities detected","This skill doesn't access files, network, or commands."],low:["Minimal capabilities","This skill uses only basic features."],medium:["Moderate capabilities","This skill accesses a few system features. Review what it does below."],high:["Broad capabilities","This skill accesses files, network, and/or commands. Review the details below."]};
    var risk=bomSummary.risk_surface||"none";
    var riskColor=riskColors[risk]||"var(--text-secondary)";
    var rl=riskLabels[risk]||[risk,""];
    var caps=Object.entries(bomSummary.capability_count||{});
    summaryEl.innerHTML='<div class="bom-risk-banner" style="border-left:3px solid '+riskColor+'">'
      +'<div class="bom-risk-title" style="color:'+riskColor+'">'+hEsc(rl[0])+'</div>'
      +'<div class="bom-risk-desc">'+hEsc(rl[1])+'</div>'
      +'<div class="bom-risk-meta">'+(bomSummary.total_files_scanned||0)+' files scanned, '+(bomSummary.files_with_capabilities||0)+' with capabilities</div>'
      +'</div>'
      +(caps.length>0?'<div class="bom-cap-pills">'+caps.map(function(entry){
        var cap=entry[0],count=entry[1];
        var ci=capInfo[cap]||[cap.replace(/_/g," "),"",""];
        return'<div class="bom-cap-pill card" title="'+hEsc(ci[1])+'">'
          +'<span class="bom-cap-pill-icon">'+ci[2]+'</span>'
          +'<div class="bom-cap-pill-body"><span class="bom-cap-pill-label">'+hEsc(ci[0])+'</span>'
          +'<span class="bom-cap-pill-count">'+count+' occurrence'+(count!==1?"s":"")+'</span></div>'
          +'</div>';
      }).join("")+'</div>':"");
    actionsEl.hidden=false;
    // Auto-load full BOM
    var ver=document.getElementById("detail-version");
    var verText=ver?ver.textContent.trim():"";
    if(verText&&verText!=="—"){
      apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/versions/"+encodeURIComponent(verText)+"/bom")
        .then(function(r){return r.json();})
        .then(function(body){if(body.ok&&body.data){renderFullBom(body.data);document.getElementById("bom-full").hidden=false;}})
        .catch(function(){});
    }
    var bomExport=document.getElementById("bom-export");
    if(bomExport)bomExport.addEventListener("click",function(){
      var ver2Text=document.getElementById("detail-version")?document.getElementById("detail-version").textContent.trim():"";
      if(!ver2Text||ver2Text==="—")return;
      apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/versions/"+encodeURIComponent(ver2Text)+"/bom")
        .then(function(r){return r.json();})
        .then(function(body){
          if(!body.ok||!body.data)return;
          var blob=new Blob([JSON.stringify(body.data,null,2)],{type:"application/json"});
          var url=URL.createObjectURL(blob);
          var a=document.createElement("a");a.href=url;a.download=NAME+"-bom.json";a.click();URL.revokeObjectURL(url);
        }).catch(function(){});
    });
  }

  function renderFullBom(bom){
    var sections=document.getElementById("bom-sections");
    var html="";
    var fa=bom.file_access||{};
    var fileEntries=[].concat(fa.reads||[]).concat(fa.writes||[]).concat(fa.deletes||[]);
    if(fileEntries.length>0){
      html+='<div class="bom-section card"><h4 class="bom-section-title">📁 Files this skill touches</h4><p class="bom-section-desc">Files the skill reads from, writes to, or deletes.</p><div class="bom-table-wrap"><table class="bom-table"><thead><tr><th>Location</th><th>Action</th><th>Target file</th></tr></thead><tbody>';
      (fa.reads||[]).forEach(function(r){html+='<tr><td><a class="bom-file-link" href="#" data-file="'+hEsc(r.file)+'" data-line="'+r.line+'">'+hEsc(r.file)+':'+r.line+'</a></td><td><span class="badge badge-blue">read</span></td><td>'+hEsc(r.target||"")+'</td></tr>';});
      (fa.writes||[]).forEach(function(w){html+='<tr><td><a class="bom-file-link" href="#" data-file="'+hEsc(w.file)+'" data-line="'+w.line+'">'+hEsc(w.file)+':'+w.line+'</a></td><td><span class="badge badge-amber">write</span></td><td>'+hEsc(w.target||"")+'</td></tr>';});
      (fa.deletes||[]).forEach(function(d){html+='<tr><td><a class="bom-file-link" href="#" data-file="'+hEsc(d.file)+'" data-line="'+d.line+'">'+hEsc(d.file)+':'+d.line+'</a></td><td><span class="badge badge-red">delete</span></td><td></td></tr>';});
      html+='</tbody></table></div></div>';
    }
    var net=bom.network||{};
    if((net.urls||[]).length>0){
      html+='<div class="bom-section card"><h4 class="bom-section-title">🌐 Websites and APIs this skill contacts</h4><p class="bom-section-desc">External servers this skill communicates with.</p>';
      if((net.domains||[]).length>0)html+='<div class="bom-badges">'+net.domains.map(function(d){return'<span class="badge">'+hEsc(d)+'</span>';}).join("")+'</div>';
      html+='<details class="bom-detail-toggle"><summary>Show all '+net.urls.length+' URL'+(net.urls.length!==1?"s":"")+'</summary><div class="bom-table-wrap"><table class="bom-table"><thead><tr><th>Location</th><th>URL</th></tr></thead><tbody>';
      net.urls.forEach(function(u){html+='<tr><td><a class="bom-file-link" href="#" data-file="'+hEsc(u.file)+'" data-line="'+u.line+'">'+hEsc(u.file)+':'+u.line+'</a></td><td class="bom-url">'+hEsc(u.url)+'</td></tr>';});
      html+='</tbody></table></div></details></div>';
    }
    var env=bom.environment||{};
    if((env.env_vars||[]).length>0||(env.binaries||[]).length>0){
      html+='<div class="bom-section card"><h4 class="bom-section-title">🔑 Settings and tools this skill uses</h4><p class="bom-section-desc">Environment variables (like API keys) and command-line tools the skill relies on.</p>';
      if((env.env_vars||[]).length>0){var names1=[...new Set(env.env_vars.map(function(e){return e.name;}))];html+='<div class="bom-subsection"><span class="bom-subsection-label">Environment variables</span><div class="bom-badges">'+names1.map(function(n){return'<span class="badge">'+hEsc(n)+'</span>';}).join("")+'</div></div>';}
      if((env.binaries||[]).length>0){var names2=[...new Set(env.binaries.map(function(b){return b.name;}))];html+='<div class="bom-subsection"><span class="bom-subsection-label">Command-line tools</span><div class="bom-badges">'+names2.map(function(n){return'<span class="badge">'+hEsc(n)+'</span>';}).join("")+'</div></div>';}
      html+='</div>';
    }
    var df=bom.data_flow||{};
    if((df.inputs||[]).length>0||(df.outputs||[]).length>0){
      html+='<div class="bom-section card"><h4 class="bom-section-title">🔄 How data moves through this skill</h4><p class="bom-section-desc">Where the skill gets data from and where it sends data to.</p><div class="bom-dataflow">';
      if((df.inputs||[]).length>0){html+='<div class="bom-flow-col"><h5 class="bom-flow-label">Data comes from</h5>';df.inputs.forEach(function(inp){var tl={env_var:"setting",file_read:"file"};html+='<div class="bom-flow-item"><span class="badge badge-blue">'+hEsc(tl[inp.type]||inp.type)+'</span> <span>'+hEsc(inp.name||inp.path||"")+'</span></div>';});html+='</div>';}
      if((df.inputs||[]).length>0&&(df.outputs||[]).length>0)html+='<div class="bom-flow-arrow">→</div>';
      if((df.outputs||[]).length>0){html+='<div class="bom-flow-col"><h5 class="bom-flow-label">Data goes to</h5>';df.outputs.forEach(function(out){var tl={file_write:"file",network:"server"};html+='<div class="bom-flow-item"><span class="badge badge-amber">'+hEsc(tl[out.type]||out.type)+'</span> <span>'+hEsc(out.domain||out.path||"")+'</span></div>';});html+='</div>';}
      html+='</div></div>';
    }
    var deps=bom.dependencies||{};
    var hasDeps2=(deps.python_imports||[]).length>0||(deps.js_requires||[]).length>0||(deps.shell_tools||[]).length>0;
    if(hasDeps2){
      html+='<div class="bom-section card"><h4 class="bom-section-title">📦 Libraries and tools referenced</h4><p class="bom-section-desc">Code libraries and shell tools mentioned in the skill\\'s files.</p>';
      [["python_imports","Python packages"],["js_requires","JavaScript packages"],["shell_tools","Shell tools"]].forEach(function(pair){
        var items=deps[pair[0]]||[];
        if(items.length>0)html+='<div class="bom-subsection"><span class="bom-subsection-label">'+pair[1]+'</span><div class="bom-badges">'+items.map(function(i){return'<span class="badge">'+hEsc(i)+'</span>';}).join("")+'</div></div>';
      });
      html+='</div>';
    }
    sections.innerHTML=html;
    sections.querySelectorAll(".bom-file-link").forEach(function(link){
      link.addEventListener("click",function(e){
        e.preventDefault();
        var file=link.dataset.file||"";
        var line=Number(link.dataset.line)||0;
        if(file&&line)navigateToFileLine(file,line);
      });
    });
  }

  // ─── Dependencies tab ───
  function renderDependenciesTab(manifestJson){
    var icon=document.getElementById("deps-status-icon");
    var title=document.getElementById("deps-status-title");
    var text=document.getElementById("deps-status-text");
    var details=document.getElementById("deps-details");
    var manifest=null;
    if(manifestJson){try{manifest=typeof manifestJson==="string"?JSON.parse(manifestJson):manifestJson;}catch(e){}}
    var hasDeps=manifest&&manifest.requires_install===true;
    if(!hasDeps){
      if(icon)icon.style.stroke="var(--green)";
      title.textContent="No External Dependencies";
      text.textContent="This skill runs with standard tools and does not require installing additional packages.";
      details.innerHTML="";return;
    }
    if(icon)icon.style.stroke="var(--amber)";
    title.textContent="External Dependencies Required";
    text.textContent="This skill requires additional packages or CLI tools to be installed before use.";
    var html="";
    var cmds=manifest.install_commands||[];
    if(cmds.length>0){
      html+='<div class="card deps-card"><h4 class="deps-card-title"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>Install Commands</h4><div class="deps-cmd-list">';
      cmds.forEach(function(cmd){html+='<div class="deps-cmd-block"><code>'+hEsc(cmd)+'</code><button class="copy-btn deps-copy-btn" type="button" aria-label="Copy command" data-cmd="'+hEsc(cmd)+'"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>';});
      html+='</div></div>';
    }
    var tools=manifest.cli_tools||[];
    if(tools.length>0){html+='<div class="card deps-card"><h4 class="deps-card-title"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>CLI Tools</h4><div class="deps-badge-list">'+tools.map(function(t){return'<span class="deps-tool-badge">'+hEsc(t)+'</span>';}).join("")+'</div></div>';}
    var cats=manifest.categories||[];
    if(cats.length>0){html+='<div class="card deps-card"><h4 class="deps-card-title"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Package Managers</h4><div class="deps-badge-list">'+cats.map(function(c){return'<span class="badge badge-blue">'+hEsc(c)+'</span>';}).join("")+'</div></div>';}
    details.innerHTML=html;
    details.querySelectorAll(".deps-copy-btn").forEach(function(btn){
      btn.addEventListener("click",function(){
        var cmd=btn.dataset.cmd||"";
        navigator.clipboard.writeText(cmd).then(function(){showToast("Copied!","success");}).catch(function(){showToast("Failed to copy","error");});
      });
    });
  }

  // ─── Related skills ───
  function loadRelatedSkills(skill){
    function renderRelated(skills,heading){
      if(!skills||skills.length===0)return false;
      var section=document.getElementById("related-skills-section");
      document.getElementById("related-skills-heading").textContent=heading;
      section.hidden=false;
      document.getElementById("related-skills-grid").innerHTML=skills.map(function(s){
        var totalStars=(s.star_count||0)+(s.github_stars||0);
        var scanBadge=s.scan_clean==1?'<span class="related-scan-badge" title="Scan clean">✓</span>':"";
        return'<a href="/skill/'+hEsc((s.namespace||"").replace("@",""))+"/"+hEsc(s.name)+'/" class="related-card card">'
          +'<div class="related-card-name">'+hEsc(s.name)+scanBadge+'</div>'
          +'<div class="related-card-ns">'+hEsc(s.namespace||"")+'</div>'
          +'<div class="related-card-desc">'+hEsc(s.description||"")+'</div>'
          +'<div class="related-card-meta">'
          +(totalStars>0?'<span class="related-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> '+formatNumber(totalStars)+'</span>':"")
          +(((s.install_count||0)+(s.sh_install_count||0))>0?'<span class="related-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> '+formatNumber((s.install_count||0)+(s.sh_install_count||0))+'</span>':"")
          +(s.latest_version?'<span class="related-meta-item">v'+hEsc(s.latest_version)+'</span>':"")
          +'</div></a>';
      }).join("");
      return true;
    }
    if(skill&&skill.github_repo_url){
      apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/related")
        .then(function(r){return r.json();})
        .then(function(body){
          if(body.ok&&Array.isArray(body.data)&&body.data.length>0){renderRelated(body.data,"From the same repo");return;}
          tryTagSearch();
        }).catch(tryTagSearch);
    } else {tryTagSearch();}
    function tryTagSearch(){
      var displayTags=(skill&&skill.tags||"").split(",").map(function(t){return t.trim();}).filter(function(t){return t&&!t.startsWith("source:");});
      var firstTag=displayTags[0];
      var searchParam=firstTag?"tag="+encodeURIComponent(firstTag)+"&sort=popular&limit=6":skill&&skill.category?"q="+encodeURIComponent(skill.category)+"&sort=popular&limit=6":null;
      if(searchParam){
        apiFetch("/v1/skills/search?"+searchParam)
          .then(function(r){return r.json();})
          .then(function(body){
            if(body.ok&&Array.isArray(body.data)){
              var filtered=body.data.filter(function(s){return s.name!==NAME||(s.namespace||"").replace("@","")!==NS;});
              if(filtered.length>0){renderRelated(filtered.slice(0,4),firstTag?"More "+firstTag+" skills":"More "+(skill&&skill.category||"")+" skills");return;}
            }
            tryPublisherSearch();
          }).catch(tryPublisherSearch);
      } else {tryPublisherSearch();}
    }
    function tryPublisherSearch(){
      apiFetch("/v1/skills/search?namespace="+encodeURIComponent("@"+NS)+"&sort=popular&limit=6")
        .then(function(r){return r.json();})
        .then(function(body){
          if(body.ok&&Array.isArray(body.data)){
            var filtered=body.data.filter(function(s){return s.name!==NAME;});
            renderRelated(filtered.slice(0,4),"More from @"+NS);
          }
        }).catch(function(){});
    }
  }

  // ─── Evals tab ───
  document.getElementById("tab-btn-evals").addEventListener("click",function(){
    if(!evalsLoaded){evalsLoaded=true;loadEvals();}
  });
  if(hashTab==="evals"&&!evalsLoaded){evalsLoaded=true;loadEvals();}

  function buildEvalTrendChart(evals){
    var versioned=evals.filter(function(e){return e.pass_rate!=null&&e.version;}).reduce(function(acc,e){if(!acc.find(function(x){return x.version===e.version;}))acc.push(e);return acc;},[]).reverse();
    if(versioned.length<2)return"";
    var W=480,H=100,PAD_L=8,PAD_R=8,PAD_T=16,PAD_B=28;
    var chartW=W-PAD_L-PAD_R,chartH=H-PAD_T-PAD_B,n=versioned.length;
    var points=versioned.map(function(e,i){
      return{x:PAD_L+(n===1?chartW/2:(i/(n-1))*chartW),y:PAD_T+chartH-(Math.min(100,Math.max(0,e.pass_rate))/100)*chartH,v:e.version,r:e.pass_rate};
    });
    var polyline=points.map(function(p){return p.x+","+p.y;}).join(" ");
    var y80=PAD_T+chartH-(80/100)*chartH,y60=PAD_T+chartH-(60/100)*chartH;
    var guides='<line x1="'+PAD_L+'" y1="'+y80+'" x2="'+(W-PAD_R)+'" y2="'+y80+'" stroke="var(--green)" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.35"/><text x="'+(W-PAD_R+2)+'" y="'+(y80+4)+'" font-size="8" fill="var(--green)" opacity="0.5">80%</text>'
      +'<line x1="'+PAD_L+'" y1="'+y60+'" x2="'+(W-PAD_R)+'" y2="'+y60+'" stroke="var(--amber)" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.35"/><text x="'+(W-PAD_R+2)+'" y="'+(y60+4)+'" font-size="8" fill="var(--amber)" opacity="0.5">60%</text>';
    var dots=points.map(function(p){
      var color=p.r>=80?"var(--green)":p.r>=60?"var(--amber)":"var(--red)";
      return'<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="'+color+'" stroke="var(--bg)" stroke-width="1.5"/>'
        +'<text x="'+p.x+'" y="'+(H-4)+'" font-size="8" text-anchor="middle" fill="var(--text-tertiary)">v'+hEsc(p.v)+'</text>'
        +'<text x="'+p.x+'" y="'+(p.y-7)+'" font-size="8" text-anchor="middle" fill="'+color+'">'+p.r.toFixed(0)+'%</text>';
    }).join("");
    return'<div class="eval-trend-chart"><div class="eval-trend-label">Pass rate trend</div>'
      +'<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="'+H+'" aria-label="Pass rate trend chart" role="img" style="overflow:visible">'+guides+'<polyline points="'+polyline+'" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'+dots+'</svg></div>';
  }

  function loadEvals(){
    var evalsContent=document.getElementById("evals-content");
    var evalsEmpty=document.getElementById("evals-empty");
    apiFetch("/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/eval")
      .then(function(r){return r.json();})
      .then(function(body){
        if(!body.ok||!Array.isArray(body.data)||body.data.length===0){
          evalsContent.hidden=true;evalsEmpty.hidden=false;return;
        }
        var evals=body.data;
        evalsEmpty.hidden=true;
        var trendChart=buildEvalTrendChart(evals);
        evalsContent.innerHTML=trendChart+evals.map(function(ev){
          var passRate=ev.pass_rate!=null?ev.pass_rate.toFixed(1):null;
          var tier=passRate!=null&&parseFloat(passRate)>=80?"tier-tested":passRate!=null?"tier-below":"";
          var barWidth=passRate!=null?Math.min(100,parseFloat(passRate)):0;
          return'<div class="eval-card card"><div class="eval-card-header"><div class="eval-card-title">'
            +'<span class="eval-version">v'+hEsc(ev.version||"—")+'</span>'
            +(ev.model&&ev.model!=="default"?'<span class="eval-model">'+hEsc(ev.model)+'</span>':"")
            +(ev.source!=="publisher"?'<span class="eval-source">'+hEsc(ev.source)+'</span>':"")
            +'</div>'+(passRate!=null?'<span class="eval-pass-rate '+tier+'">'+passRate+'%</span>':"")
            +'</div>'+(passRate!=null?'<div class="eval-progress-wrap"><div class="eval-progress-bar" style="width:'+barWidth+'%"></div></div>':"")
            +'<div class="eval-stats">'
            +(ev.test_cases!=null?'<span class="eval-stat"><strong>'+ev.test_cases+'</strong> test cases</span>':"")
            +(ev.pass_count!=null?'<span class="eval-stat"><strong>'+ev.pass_count+'</strong> passing</span>':"")
            +(ev.benchmark_runs!=null?'<span class="eval-stat"><strong>'+ev.benchmark_runs+'</strong> benchmark runs</span>':"")
            +(ev.avg_time_s!=null?'<span class="eval-stat">avg <strong>'+ev.avg_time_s.toFixed(1)+'s</strong></span>':"")
            +(ev.avg_tokens!=null?'<span class="eval-stat"><strong>'+ev.avg_tokens.toLocaleString()+'</strong> tokens/run</span>':"")
            +'</div><div class="eval-card-meta">Uploaded '+formatDate(ev.created_at)+'</div></div>';
        }).join("");
        evalsContent.hidden=false;
      }).catch(function(){
        evalsContent.hidden=true;evalsEmpty.hidden=false;
      });
  }

  // ─── Arenas tab ───
  var arenasCursor=null,arenasHasMore=false,arenasFetching=false;
  var arBtn=document.getElementById("tab-btn-arenas");
  if(arBtn)arBtn.addEventListener("click",function(){if(!arenasLoaded){arenasLoaded=true;fetchArenas();}});
  if(hashTab==="arenas"&&!arenasLoaded){arenasLoaded=true;fetchArenas();}
  var arLoadMoreBtn=document.getElementById("arenas-load-more-btn");
  if(arLoadMoreBtn)arLoadMoreBtn.addEventListener("click",function(){if(arenasHasMore&&arenasCursor&&!arenasFetching)fetchArenas(arenasCursor);});

  function fetchArenas(cursor){
    if(arenasFetching)return;
    arenasFetching=true;
    var arenasList=document.getElementById("arenas-list");
    var arenasEmpty=document.getElementById("arenas-empty");
    var loadMoreWrap=document.getElementById("arenas-load-more");
    var tabCount=document.getElementById("arena-tab-count");
    loadMoreWrap.hidden=true;
    if(!cursor){arenasList.hidden=false;arenasEmpty.hidden=true;}
    var url="/v1/skills/"+NS_AT+"/"+encodeURIComponent(NAME)+"/arenas?limit=10";
    if(cursor)url+="&cursor="+encodeURIComponent(cursor);
    apiFetch(url)
      .then(function(r){return r.json();})
      .then(function(body){
        if(!body.ok){if(!cursor){arenasList.innerHTML="";arenasEmpty.hidden=false;}return;}
        var arenas=body.data||[];
        if(!cursor)arenasList.innerHTML="";
        if(arenas.length===0&&!cursor){arenasEmpty.hidden=false;return;}
        arenas.forEach(function(arena){arenasList.appendChild(buildArenaCard(arena));});
        arenasCursor=body.meta&&body.meta.pagination&&body.meta.pagination.next_cursor?body.meta.pagination.next_cursor:null;
        arenasHasMore=body.meta&&body.meta.pagination&&body.meta.pagination.has_more?true:false;
        loadMoreWrap.hidden=!arenasHasMore;
        if(!cursor&&tabCount){tabCount.textContent=String(arenas.length+(arenasHasMore?"+":""));tabCount.hidden=false;}
      }).catch(function(){if(!cursor){arenasList.innerHTML="";arenasEmpty.hidden=false;}})
      .then(function(){arenasFetching=false;});
  }

  function buildArenaCard(arena){
    var card=document.createElement("div");
    card.className="arena-row";
    var prompt=arena.prompt_preview||arena.prompt||"";
    var entries=arena.entry_count||0;
    card.innerHTML='<div class="arena-row-icon"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg></div>'
      +'<div class="arena-row-body"><a href="/arena/'+hEsc(arena.arena_id)+'/" class="arena-row-title">'+hEsc(arena.title)+'</a>'
      +'<p class="arena-row-prompt">'+hEsc(prompt)+'</p>'
      +'<div class="arena-row-meta"><span>'+entries+' '+(entries===1?"entry":"entries")+'</span><span class="meta-dot">·</span><span>'+formatDate(arena.created_at)+'</span></div></div>'
      +'<a href="/arena/'+hEsc(arena.arena_id)+'/" class="btn btn-secondary arena-view-btn">View</a>';
    return card;
  }

  // ─── Install helpers ───
  window.copyInstall=function(){
    var el=document.getElementById("install-cmd-text-cli");
    if(el)navigator.clipboard.writeText(el.textContent).then(function(){showToast("Copied!","success");});
  };
  window.copyCurl=function(){
    var el=document.getElementById("install-cmd-text-curl");
    if(el)navigator.clipboard.writeText(el.textContent).then(function(){showToast("Copied!","success");});
  };
  window.switchTab=function(tab){
    var btn=document.getElementById("tab-btn-"+tab);
    if(btn)btn.click();
  };
})();
</script>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent detail page
// ─────────────────────────────────────────────────────────────────────────────

function agentDetailPage(c: Parameters<Parameters<Hono["get"]>[1]>[0]) {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const path = url.pathname;
  const id = decodeURIComponent(path.replace(/^\/agent\//, "").replace(/\/$/, ""));

  if (!id) return notFound(path);

  return baseHtml({
    title: "Agent — SkillSafe Local",
    path,
    dataDir: _dataDir,
    css: AGENT_CSS,
    body: `
<div class="container agent-page">
  <!-- Breadcrumb -->
  <nav class="breadcrumb-bar animate-in" aria-label="Breadcrumb">
    <div class="breadcrumb">
      <a href="/dashboard">Dashboard</a>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      <span id="agent-breadcrumb-name">Loading…</span>
    </div>
  </nav>

  <!-- Error state -->
  <div id="agent-error" class="empty-state" hidden>
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <p>Agent not found.</p>
    <a href="/dashboard" class="btn btn-secondary">← Back to Dashboard</a>
  </div>

  <!-- Agent header -->
  <div class="agent-header animate-in stagger-1" id="agent-header" hidden>
    <div class="agent-header-left">
      <div class="agent-identity">
        <div class="agent-icon" id="agent-icon">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
        </div>
        <div>
          <h1 class="agent-name" id="agent-name">Loading…</h1>
          <div class="agent-meta-row">
            <span class="platform-badge" id="agent-platform-badge"></span>
            <span class="agent-created-label">Created <span id="agent-created-date">—</span></span>
          </div>
        </div>
      </div>
    </div>
    <div class="agent-actions">
      <button class="btn btn-secondary" type="button" onclick="copyAgentId()">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy Agent ID
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs animate-in stagger-2" id="agent-tabs" role="tablist" aria-label="Agent information" hidden>
    <button class="tab active" data-tab="readme" type="button" role="tab" aria-selected="true" aria-controls="tab-readme" id="tab-btn-readme" tabindex="0">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      README
    </button>
    <button class="tab" data-tab="details" type="button" role="tab" aria-selected="false" aria-controls="tab-details" id="tab-btn-details" tabindex="-1">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      Details
    </button>
    <button class="tab" data-tab="metadata" type="button" role="tab" aria-selected="false" aria-controls="tab-metadata" id="tab-btn-metadata" tabindex="-1">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      Metadata
    </button>
  </div>

  <!-- Tab content + sidebar layout -->
  <div class="agent-layout" id="agent-layout" hidden>
    <div class="tab-content">

      <!-- README tab -->
      <div id="tab-readme" class="tab-panel" role="tabpanel" aria-labelledby="tab-btn-readme">
        <div id="readme-content" class="agent-readme-body"></div>
      </div>

      <!-- Details tab -->
      <div id="tab-details" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-details">
        <div class="card" style="padding:20px">
          <dl class="agent-details-list" id="agent-details-dl"></dl>
        </div>
      </div>

      <!-- Metadata tab -->
      <div id="tab-metadata" class="tab-panel" hidden role="tabpanel" aria-labelledby="tab-btn-metadata">
        <div class="card" style="padding:16px">
          <pre id="metadata-json" class="metadata-pre"></pre>
        </div>
        <div id="metadata-empty" class="empty-state" hidden>
          <p>No metadata stored for this agent.</p>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <aside class="agent-sidebar animate-in stagger-3">
      <div class="sidebar-section card">
        <h3 class="sidebar-heading">Restore</h3>
        <p class="sidebar-hint">To restore this agent's identity:</p>
        <div class="copy-row">
          <code id="restore-cmd" class="install-code">skillsafe --api-base ${origin} agent restore ${h(id)}</code>
          <button class="copy-btn" type="button" onclick="copyRestore()" title="Copy restore command">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>

      <div class="sidebar-section card">
        <h3 class="sidebar-heading">Details</h3>
        <dl class="meta-list">
          <dt>Agent ID</dt><dd id="sidebar-agent-id" class="mono-sm">${h(id)}</dd>
          <dt>Platform</dt><dd id="sidebar-platform">—</dd>
          <dt>Created</dt><dd id="sidebar-created">—</dd>
          <dt>Updated</dt><dd id="sidebar-updated">—</dd>
        </dl>
      </div>

      <div class="sidebar-section card">
        <h3 class="sidebar-heading">CLI Commands</h3>
        <p class="sidebar-hint">Save a new snapshot:</p>
        <div class="copy-row" style="margin-bottom:10px">
          <code class="install-code">skillsafe --api-base ${origin} agent save</code>
          <button class="copy-btn" type="button" onclick="window.copyText('skillsafe --api-base ${origin} agent save','Command')" title="Copy">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <p class="sidebar-hint">Delete this agent:</p>
        <div class="copy-row">
          <code class="install-code">skillsafe --api-base ${origin} agent delete ${h(id)}</code>
          <button class="copy-btn" type="button" onclick="window.copyText('skillsafe --api-base ${origin} agent delete ${h(id)}','Command')" title="Copy">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
    </aside>
  </div>
</div>`,
    scripts: `<script>
(function(){
  var AGENT_ID="${h(id)}";

  function hEsc(s){var t=String(s||"");t=t.split("&").join("&amp;");t=t.split(String.fromCharCode(60)).join("&lt;");t=t.split(">").join("&gt;");t=t.split('"').join("&quot;");return t}

  var platformColors={claude:"var(--accent)",openclaw:"var(--green)",cursor:"var(--amber)",windsurf:"#06b6d4",cline:"#a78bfa"};

  // ─── Tab switching ───
  document.querySelectorAll(".tab").forEach(function(btn){
    btn.addEventListener("click",function(){
      var tab=btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(function(b){
        b.classList.remove("active");b.setAttribute("aria-selected","false");b.tabIndex=-1;
      });
      document.querySelectorAll(".tab-panel").forEach(function(p){p.hidden=true});
      btn.classList.add("active");btn.setAttribute("aria-selected","true");btn.tabIndex=0;
      document.getElementById("tab-"+tab).hidden=false;
    });
  });

  // ─── Load agent ───
  fetch("/v1/agents/"+encodeURIComponent(AGENT_ID))
    .then(function(r){return r.json()})
    .then(function(res){
      if(!res.ok||!res.data){showError();return;}
      var a=res.data;

      // Breadcrumb + title
      document.getElementById("agent-breadcrumb-name").textContent=a.name||AGENT_ID;
      document.title=(a.name||AGENT_ID)+" — SkillSafe Local";

      // Header
      var color=platformColors[(a.platform||"").toLowerCase()]||"var(--text-secondary)";
      var icon=document.getElementById("agent-icon");
      icon.style.background=color+"15";
      icon.style.color=color;
      document.getElementById("agent-name").textContent=a.name||AGENT_ID;

      // Platform badge
      var badge=document.getElementById("agent-platform-badge");
      badge.textContent=a.platform||"unknown";
      badge.style.background=color+"20";
      badge.style.color=color;
      badge.style.borderColor=color+"40";

      document.getElementById("agent-created-date").textContent=a.created_at?new Date(a.created_at).toLocaleDateString():"—";
      document.getElementById("agent-header").hidden=false;
      document.getElementById("agent-tabs").hidden=false;
      document.getElementById("agent-layout").hidden=false;

      // Sidebar details
      document.getElementById("sidebar-platform").textContent=a.platform||"—";
      document.getElementById("sidebar-created").textContent=a.created_at?new Date(a.created_at).toLocaleDateString():"—";
      document.getElementById("sidebar-updated").textContent=a.updated_at?new Date(a.updated_at).toLocaleDateString():"—";

      // README tab — description + quick start
      var readmeHtml='';
      if(a.description){
        readmeHtml+='<div class="readme-section"><p class="readme-desc">'+hEsc(a.description)+'</p></div>';
      } else {
        readmeHtml+='<div class="readme-section"><p style="color:var(--text-tertiary);font-style:italic">No description provided.</p></div>';
      }
      readmeHtml+='<div class="readme-section"><h3 class="readme-h3">Quick Start</h3>'
        +'<p style="font-size:.875rem;color:var(--text-secondary);margin-bottom:8px">Restore this agent&apos;s identity:</p>'
        +'<pre class="readme-code">skillsafe --api-base ${origin} agent restore '+hEsc(AGENT_ID)+'</pre>'
        +'</div>';
      document.getElementById("readme-content").innerHTML=readmeHtml;

      // Details tab
      var dl=document.getElementById("agent-details-dl");
      var fields=[
        ["Agent ID",a.id],
        ["Name",a.name],
        ["Platform",a.platform],
        ["Description",a.description||"—"],
        ["Created",a.created_at?new Date(a.created_at).toLocaleString():"—"],
        ["Updated",a.updated_at?new Date(a.updated_at).toLocaleString():"—"],
      ];
      dl.innerHTML=fields.map(function(f){
        return '<dt>'+hEsc(f[0])+'</dt><dd>'+hEsc(String(f[1]||"—"))+'</dd>';
      }).join("");

      // Metadata tab
      var meta=a.metadata;
      if(meta&&typeof meta==="object"&&Object.keys(meta).length>0){
        document.getElementById("metadata-json").textContent=JSON.stringify(meta,null,2);
      } else {
        document.getElementById("metadata-json").parentElement.hidden=true;
        document.getElementById("metadata-empty").hidden=false;
      }
    })
    .catch(function(){showError();});

  function showError(){
    document.getElementById("agent-breadcrumb-name").textContent="Not found";
    document.getElementById("agent-error").hidden=false;
  }

  window.copyAgentId=function(){
    window.copyText(AGENT_ID,"Agent ID");
  };
  window.copyRestore=function(){
    window.copyText(document.getElementById("restore-cmd").textContent,"Restore command");
  };
})();
</script>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS — Explore page
// ─────────────────────────────────────────────────────────────────────────────

const DASH_CSS = `
/* ── Dashboard layout ── */
.dash-page { padding: 32px 24px 80px; }
.dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; gap: 24px; flex-wrap: wrap; }
.dash-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; }
.dash-greeting p { color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px; }
.dash-data-path { display: inline-flex; align-items: center; gap: 2px; }
.dash-data-path code { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-tertiary); }
.data-path-edit-btn { background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 2px 4px; border-radius: var(--radius-sm); transition: var(--transition); display: inline-flex; align-items: center; }
.data-path-edit-btn:hover { color: var(--accent); background: var(--bg-elevated); }
/* Stats */
.dash-header-stats { display: flex; align-items: center; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.header-stat { display: flex; flex-direction: column; align-items: center; padding: 10px 20px; min-width: 72px; }
.header-stat-value { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
.header-stat-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.03em; font-weight: 500; }
.header-stat-sep { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }
/* Section header */
.filter-chips { display: flex; gap: 4px; }
.chip { padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; border: 1px solid var(--border); background: transparent; color: var(--text-tertiary); cursor: pointer; transition: all var(--transition); white-space: nowrap; font-family: inherit; }
.chip:hover { border-color: var(--border-hover); color: var(--text-secondary); }
.chip-active { background: var(--accent-muted); border-color: var(--accent); color: var(--accent-fg); }
.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.section-header h2 { display: flex; align-items: center; gap: 7px; font-size: 1.05rem; font-weight: 700; white-space: nowrap; }
.skills-toolbar { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
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
.my-skill-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; color: var(--text); gap: 16px; transition: border-color var(--transition); }
.my-skill-item:hover { border-color: var(--border-hover); }
.my-skill-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; text-decoration: none; color: var(--text); }
.my-skill-left:hover { text-decoration: none; }
.my-skill-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--accent-muted); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.my-skill-info { min-width: 0; flex: 1; }
.my-skill-name { font-size: 0.9rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px; }
.my-skill-name .ns { color: var(--text-tertiary); font-weight: 400; }
.my-skill-desc { font-size: 0.78rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 400px; margin-bottom: 4px; }
.my-skill-tags { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.my-skill-cat { font-size: 0.7rem; color: var(--text-tertiary); background: var(--bg-surface); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
.my-skill-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.my-skill-actions { display: flex; align-items: center; gap: 4px; }
.my-skill-time { font-size: 0.72rem; color: var(--text-tertiary); white-space: nowrap; }
.version-tag { font-size: 0.7rem; padding: 1px 6px; background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; color: var(--text-secondary); font-family: var(--font-mono); }
/* Delete buttons (agent card) */
.agent-card-wrap { position: relative; display: flex; align-items: stretch; }
.agent-card-wrap .agent-card { flex: 1; min-width: 0; border-radius: var(--radius) 0 0 var(--radius); }
.btn-delete { display: flex; align-items: center; justify-content: center; width: 36px; flex-shrink: 0; background: transparent; border: 1px solid var(--border); border-left: none; border-radius: 0 var(--radius) var(--radius) 0; color: var(--text-tertiary); cursor: pointer; transition: background var(--transition), color var(--transition); }
.btn-delete:hover { background: var(--red); color: #fff; border-color: var(--red); }
/* Inline action button in skill right */
.btn-icon { width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; }
.btn-icon-danger:hover { background: var(--red-dim) !important; color: var(--red) !important; }
/* badge-dim for Private */
.badge-dim { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-tertiary); }
.badge-unverified { background: #fef9c3; border: 1px solid #fde047; color: #854d0e; font-size: 0.7rem; padding: 1px 7px; border-radius: 20px; font-weight: 500; }
.my-skill-meta-row { display: flex; align-items: center; gap: 10px; }
.my-skill-stats { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: var(--text-tertiary); white-space: nowrap; }
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

// ─────────────────────────────────────────────────────────────────────────────
// CSS — Skill detail page
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_CSS = `
  .skill-page {
    padding: 40px 24px 80px;
  }

  /* Breadcrumb bar */
  .breadcrumb-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 32px;
  }
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.84rem;
    color: var(--text-tertiary);
  }
  .breadcrumb-sep { color: var(--border); }
  .breadcrumb a {
    color: var(--text-secondary);
    transition: color var(--transition);
  }
  .breadcrumb a:hover { color: var(--accent); }
  .breadcrumb span { white-space: nowrap; }
  .breadcrumb svg { opacity: 0.5; }

  /* Prev/next nav */
  .skill-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .skill-nav[hidden] { display: none; }
  .skill-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: all var(--transition);
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .skill-nav-btn[hidden] { display: none; }
  .skill-nav-btn:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-muted);
    text-decoration: none;
  }
  .skill-nav-btn span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Skill Header */
  .skill-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 20px;
  }

  .skill-identity {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .skill-icon {
    width: 56px;
    height: 56px;
    background: var(--accent-muted);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    flex-shrink: 0;
    box-shadow: 0 0 0 1px var(--border-accent), var(--shadow-sm);
  }
  .skill-icon svg { width: 28px; height: 28px; }

  .skill-name {
    font-size: 1.7rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.25;
    background: linear-gradient(135deg, var(--text) 0%, var(--text) 50%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .skill-name .ns {
    -webkit-text-fill-color: transparent;
    text-decoration: none;
    transition: opacity var(--transition);
  }
  .skill-name a.ns:hover {
    text-decoration: underline;
  }

  .skill-desc {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-top: 6px;
    line-height: 1.55;
    max-width: 560px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .skill-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    align-items: center;
  }

  .skill-actions .btn {
    transition: all var(--transition-slow);
  }

  .starred {
    border-color: var(--amber) !important;
    color: var(--amber) !important;
    background: rgba(245, 158, 11, 0.08) !important;
  }
  .starred svg { fill: var(--amber); stroke: var(--amber); }

  .bookmarked {
    border-color: var(--accent) !important;
    color: var(--accent) !important;
    background: var(--accent-muted) !important;
  }
  .bookmarked svg { fill: var(--accent); stroke: var(--accent); }

  .shared {
    border-color: var(--green) !important;
    color: var(--green) !important;
  }

  /* Stats bar */
  .stats-bar {
    display: flex;
    gap: 0;
    padding: 0;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 28px;
    overflow: hidden;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.82rem;
    color: var(--text-secondary);
    padding: 10px 18px;
    border-right: 1px solid var(--border);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .stat-item:last-child { border-right: none; }
  .stat-item svg { color: var(--text-tertiary); flex-shrink: 0; }
  .stat-item:not(.stat-item-category) span:first-of-type {
    color: var(--text);
    font-weight: 700;
    font-size: 0.88rem;
  }

  .stat-item-category { border-left: 1px solid var(--border); margin-left: auto; }
  .stat-category-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    background: var(--accent-muted);
    color: var(--accent);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    text-transform: capitalize;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--border);
    margin-bottom: 16px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: color var(--transition), border-color var(--transition);
    position: relative;
  }
  .tab[hidden] { display: none; }
  .tab:hover { color: var(--text-secondary); }
  .tab.active { color: var(--text); border-bottom-color: var(--accent); font-weight: 600; }
  .tab svg { opacity: 0.6; }
  .tab.active svg { opacity: 1; }

  /* README Tab layout */
  #tab-readme:not([hidden]) {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 28px;
    padding: 8px 0 24px;
  }

  .readme-card {
    overflow: hidden;
  }

  .readme-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 0.84rem;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .readme-body {
    padding: 28px 24px 32px;
    line-height: 1.75;
  }

  .readme-rendered h2 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .readme-rendered h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 8px;
  }

  .readme-rendered p {
    color: var(--text-secondary);
    margin-bottom: 12px;
    font-size: 0.92rem;
  }

  .readme-rendered pre {
    margin-bottom: 16px;
  }

  /* Sidebar */
  .skill-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sidebar-section {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    box-shadow: var(--shadow-sm);
  }

  .sidebar-section .sidebar-heading {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    margin-bottom: 14px;
  }

  /* Install section prominence */
  .sidebar-section:first-child {
    border-color: var(--accent);
    border-width: 1.5px;
    box-shadow: 0 0 0 1px var(--border-accent), var(--shadow-md);
  }
  .sidebar-section:first-child .sidebar-heading {
    color: var(--accent);
    font-size: 0.82rem;
    letter-spacing: 0.06em;
  }

  .install-cmd {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    transition: border-color var(--transition);
  }
  .install-cmd:hover { border-color: var(--accent); }
  .install-cmd + .install-cmd { margin-top: 6px; }
  /* Secondary command: dimmer until hovered */
  .install-cmd-cli:not(.install-cmd-primary) {
    opacity: 0.6;
    border-style: dashed;
  }
  .install-cmd-cli:not(.install-cmd-primary):hover { opacity: 1; }
  #install-cmd-curl:not(.install-cmd-primary) {
    opacity: 0.6;
    border-style: dashed;
  }
  #install-cmd-curl:not(.install-cmd-primary):hover { opacity: 1; }

  .sidebar-heading-hint {
    font-size: 0.72rem;
    font-weight: 400;
    color: var(--text-tertiary);
  }

  .install-cmd code {
    flex: 1;
    font-size: 0.8rem;
    background: none;
    border: none;
    padding: 0;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: color var(--transition), background var(--transition);
    flex-shrink: 0;
  }
  .copy-btn:hover { color: var(--accent); background: var(--accent-muted); }

  .detail-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.84rem;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .detail-row:last-child { border-bottom: none; padding-bottom: 0; }

  .detail-label { color: var(--text-tertiary); font-size: 0.82rem; }
  .detail-value { color: var(--text); font-weight: 500; text-align: right; }
  .detail-value a { color: var(--accent); }

  .badge-validated-inline {
    display: inline-flex;
    align-items: center;
    color: var(--accent);
    margin-left: 4px;
    vertical-align: middle;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-chip {
    padding: 4px 12px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 0.76rem;
    color: var(--text-secondary);
    transition: all var(--transition);
    font-weight: 500;
  }
  .tag-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-muted);
    text-decoration: none;
    transform: translateY(-1px);
  }

  .github-repo-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding: 8px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all var(--transition);
    text-decoration: none;
  }
  .github-repo-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-muted);
  }
  .github-repo-btn[hidden] { display: none; }

  /* Versions */
  #tab-versions { padding: 24px 0; }

  .versions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .version-item {
    padding: 24px 28px;
    transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
  }
  .version-item:hover {
    border-color: var(--border-hover);
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-1px);
  }

  .version-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .version-label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .version-tag-lg {
    font-size: 0.92rem;
    padding: 4px 14px;
    font-weight: 600;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    color: var(--text);
  }

  .version-meta {
    display: flex;
    gap: 16px;
    font-size: 0.8rem;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .version-changelog {
    padding: 8px 0;
    border-top: 1px solid var(--border);
    margin-top: 4px;
  }

  .version-changelog p {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .version-hash {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    color: var(--text-tertiary);
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid var(--border-subtle);
  }
  .version-hash code {
    font-size: 0.72rem;
    background: none;
    border: none;
    padding: 0;
    color: var(--text-tertiary);
  }

  /* Files */
  #tab-files { padding: 24px 0; }

  .files-container {
    display: flex;
    overflow: hidden;
    max-height: 70vh;
  }

  .files-sidebar {
    width: 260px;
    min-width: 260px;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
  }

  .file-tree-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-elevated);
    flex-shrink: 0;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex: 1;
    padding: 6px 8px;
  }

  /* Tree: folders */
  .tree-folder-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text);
    border-radius: var(--radius-sm);
    transition: background var(--transition);
  }
  .tree-folder-header:hover { background: var(--bg-surface-hover); }
  .tree-chevron { flex-shrink: 0; color: var(--text-tertiary); transition: transform 0.15s ease; }
  .tree-folder-open > .tree-folder-header .tree-chevron { transform: rotate(90deg); }
  .tree-folder-icon { flex-shrink: 0; }
  .tree-folder-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tree-folder-open > .tree-folder-header { background: color-mix(in srgb, var(--accent) 6%, transparent); border-left: 2px solid var(--accent); }

  /* Tree: file items */
  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    font-size: 0.84rem;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
  }
  .file-item:hover { background: var(--bg-surface-hover); color: var(--text); }
  .file-item svg { color: var(--text-tertiary); flex-shrink: 0; }
  .file-item.active {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--text);
  }
  .file-item.active svg { color: var(--accent); }
  .file-name {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-size { color: var(--text-tertiary); font-size: 0.78rem; font-variant-numeric: tabular-nums; flex-shrink: 0; }

  .files-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .file-preview-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-tertiary);
    font-size: 0.85rem;
    padding: 48px 24px;
  }
  .file-preview-empty[hidden] { display: none; }

  .file-preview {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .file-preview[hidden] { display: none; }
  .file-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 0.84rem;
    font-family: var(--font-mono);
    background: var(--bg-elevated);
    flex-shrink: 0;
  }
  .file-preview-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .file-preview-body {
    flex: 1;
    overflow: auto;
  }
  .file-preview pre {
    margin: 0;
    border: none;
    border-radius: 0;
    font-size: 0.82rem;
    line-height: 0;
    padding: 16px 20px;
  }
  .file-preview pre[hidden] { display: none; }
  .file-preview pre code {
    background: none;
    border: none;
    padding: 0;
  }
  .code-line { display: block; line-height: 1; }
  .line-num {
    display: inline-block;
    width: 3.5ch;
    text-align: right;
    color: var(--text-tertiary);
    user-select: none;
    opacity: 0.5;
    margin-right: 16px;
    font-size: 0.78rem;
  }

  .preview-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 3px 10px;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-family: var(--font-sans);
    transition: color var(--transition), border-color var(--transition), background var(--transition);
  }
  .preview-toggle-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-muted); }
  .preview-toggle-btn[hidden] { display: none; }

  /* GitHub-style markdown rendering */
  .file-preview-rendered {
    padding: 32px 40px;
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
    color: var(--text);
    overflow: auto;
    flex: 1;
  }
  .file-preview-rendered[hidden] { display: none; }

  .file-preview-rendered > *:first-child { margin-top: 0 !important; }
  .file-preview-rendered > *:last-child { margin-bottom: 0 !important; }

  .file-preview-rendered h1,
  .file-preview-rendered h2 {
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--border);
  }
  .file-preview-rendered h1 { font-size: 2em; font-weight: 600; margin: 24px 0 16px; }
  .file-preview-rendered h2 { font-size: 1.5em; font-weight: 600; margin: 24px 0 16px; }
  .file-preview-rendered h3 { font-size: 1.25em; font-weight: 600; margin: 24px 0 16px; }
  .file-preview-rendered h4 { font-size: 1em; font-weight: 600; margin: 24px 0 16px; }
  .file-preview-rendered h5 { font-size: 0.875em; font-weight: 600; margin: 24px 0 16px; }
  .file-preview-rendered h6 { font-size: 0.85em; font-weight: 600; margin: 24px 0 16px; color: var(--text-tertiary); }

  .file-preview-rendered p { margin: 0 0 16px; }

  .file-preview-rendered a { color: var(--accent); text-decoration: none; }
  .file-preview-rendered a:hover { text-decoration: underline; }

  .file-preview-rendered strong { font-weight: 600; }
  .file-preview-rendered em { font-style: italic; }
  .file-preview-rendered del { text-decoration: line-through; }

  .file-preview-rendered code {
    font-family: var(--font-mono);
    font-size: 85%;
    background: var(--code-bg);
    border-radius: 6px;
    padding: 0.2em 0.4em;
    margin: 0;
  }
  .file-preview-rendered pre {
    font-family: var(--font-mono);
    font-size: 85%;
    background: var(--code-bg);
    border-radius: 6px;
    padding: 16px;
    margin: 0 0 16px;
    overflow: auto;
    line-height: 1.45;
    border: 1px solid var(--border);
  }
  .file-preview-rendered pre code {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    margin: 0;
    font-size: 100%;
    white-space: pre;
    word-break: normal;
  }

  .file-preview-rendered blockquote {
    margin: 0 0 16px;
    padding: 0 1em;
    color: var(--text-tertiary);
    border-left: 0.25em solid var(--border);
  }
  .file-preview-rendered blockquote > :first-child { margin-top: 0; }
  .file-preview-rendered blockquote > :last-child { margin-bottom: 0; }

  .file-preview-rendered ul,
  .file-preview-rendered ol {
    margin: 0 0 16px;
    padding-left: 2em;
  }
  .file-preview-rendered li { margin: 0.25em 0; }
  .file-preview-rendered li + li { margin-top: 0.25em; }
  .file-preview-rendered li > p { margin: 16px 0; }
  .file-preview-rendered li > ul,
  .file-preview-rendered li > ol { margin: 0; }

  .file-preview-rendered hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background: var(--border);
    border: 0;
    border-radius: 2px;
  }

  .file-preview-rendered table {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
    border-spacing: 0;
    border-collapse: collapse;
    margin: 0 0 16px;
  }
  .file-preview-rendered table th,
  .file-preview-rendered table td {
    padding: 6px 13px;
    border: 1px solid var(--border);
  }
  .file-preview-rendered table th {
    font-weight: 600;
    background: var(--bg-elevated);
  }
  .file-preview-rendered table tr:nth-child(2n) {
    background: var(--bg-surface);
  }

  .file-preview-rendered img {
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 6px;
  }

  /* Security summary bar (inside readme-card) */
  .security-summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 24px;
    border-top: 1px solid var(--border);
    background: var(--bg-elevated);
    font-size: 0.82rem;
  }
  .security-summary-left {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
  }
  .security-summary-status.is-clean { color: var(--green); font-weight: 600; }
  .security-summary-status.is-findings { color: var(--amber); font-weight: 600; }
  .security-summary-link {
    font-size: 0.8rem;
    color: var(--accent);
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .security-summary-link:hover { text-decoration: underline; }

  /* Security */
  #tab-security { padding: 24px 0; }

  .security-content { display: flex; flex-direction: column; gap: 16px; }

  /* Overview card */
  .sec-overview { padding: 24px; display: flex; gap: 16px; align-items: flex-start; }
  .sec-overview-icon { flex-shrink: 0; padding-top: 2px; }
  .sec-overview-body { flex: 1; }
  .sec-overview-body h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
  .sec-overview-desc { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; }
  .sec-section-hint { font-size: 0.82rem; color: var(--text-tertiary); line-height: 1.4; }
  .sec-verification-badge { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
  .sec-verification-hint { font-size: 0.78rem; color: var(--text-tertiary); }

  /* Findings */
  .sec-findings { display: flex; flex-direction: column; gap: 12px; }
  .sec-findings-group { padding: 18px; }
  .sec-findings-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .sec-findings-count { font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary); background: var(--bg-surface); padding: 2px 8px; border-radius: 10px; }
  .sec-findings-hint { font-size: 0.78rem; color: var(--text-tertiary); flex-basis: 100%; margin-top: 2px; }
  .sec-findings-list { display: flex; flex-direction: column; gap: 0; }
  .sec-finding-row { padding: 8px 0; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; }
  .sec-finding-row:last-child { border-bottom: none; }
  .sec-finding-msg { font-size: 0.84rem; color: var(--text); line-height: 1.4; }
  .sec-finding-loc { font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-tertiary); text-decoration: none; }
  .sec-finding-loc-link { color: var(--accent); cursor: pointer; }
  .sec-finding-loc-link:hover { text-decoration: underline; }

  /* Scan metadata */
  .sec-scan-meta { padding: 16px 20px; }
  .scan-reports { display: flex; flex-direction: column; gap: 8px; }

  /* Bill of Materials (inside Security tab) */
  .bom-content { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
  .bom-header { display: flex; gap: 12px; align-items: flex-start; }
  .bom-header h2 { font-size: 1rem; font-weight: 600; margin: 0 0 4px; }
  .bom-summary-cards { display: flex; flex-direction: column; gap: 12px; }
  .bom-risk-banner { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; }
  .bom-risk-title { font-size: 0.92rem; font-weight: 700; margin-bottom: 4px; }
  .bom-risk-desc { font-size: 0.84rem; color: var(--text-secondary); line-height: 1.4; }
  .bom-risk-meta { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px; }
  .bom-cap-pills { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .bom-cap-pill { padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
  .bom-cap-pill-icon { font-size: 1.3rem; flex-shrink: 0; }
  .bom-cap-pill-body { display: flex; flex-direction: column; }
  .bom-cap-pill-label { font-size: 0.84rem; font-weight: 600; color: var(--text); }
  .bom-cap-pill-count { font-size: 0.75rem; color: var(--text-tertiary); }
  .bom-actions { display: flex; gap: 8px; }
  .bom-sections { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
  .bom-section { padding: 20px; }
  .bom-section-title { font-size: 0.92rem; font-weight: 600; margin-bottom: 4px; }
  .bom-section-desc { font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 14px; line-height: 1.4; }
  .bom-detail-toggle { margin-top: 10px; }
  .bom-detail-toggle summary { font-size: 0.78rem; color: var(--text-tertiary); cursor: pointer; padding: 6px 0; user-select: none; }
  .bom-detail-toggle summary:hover { color: var(--text-secondary); }
  .bom-table-wrap { overflow-x: auto; }
  .bom-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; font-family: var(--font-mono); }
  .bom-table th { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border); color: var(--text-tertiary); font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .bom-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
  .bom-url { word-break: break-all; max-width: 400px; }
  .bom-file-link { color: var(--accent); text-decoration: none; font-family: var(--font-mono); font-size: 0.82rem; white-space: nowrap; }
  .bom-file-link:hover { text-decoration: underline; }
  .bom-badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
  .bom-subsection { margin-bottom: 12px; }
  .bom-subsection-label { font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 6px; }
  .bom-dataflow { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .bom-flow-col { flex: 1; min-width: 200px; }
  .bom-flow-label { font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
  .bom-flow-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 0.82rem; }
  .bom-flow-arrow { font-size: 1.5rem; color: var(--text-tertiary); align-self: center; padding-top: 20px; }

  /* Frontmatter table in markdown preview */
  .fm-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
  .fm-table td { padding: 8px 14px; border-bottom: 1px solid var(--border); font-size: 0.84rem; vertical-align: top; }
  .fm-table tr:last-child td { border-bottom: none; }
  .fm-key { font-weight: 600; color: var(--text-secondary); white-space: nowrap; width: 1%; font-family: var(--font-mono); font-size: 0.8rem; background: var(--bg-surface); }
  .fm-val { color: var(--text); line-height: 1.5; }
  .code-line-highlight { background: color-mix(in srgb, var(--accent) 15%, transparent); display: inline-block; width: 100%; border-left: 2px solid var(--accent); }

  .error-text { color: var(--red); }
  .empty-text { color: var(--text-tertiary); padding: 32px; text-align: center; }

  /* Dependencies */
  #tab-dependencies { padding: 24px 0; }

  .deps-content { display: flex; flex-direction: column; gap: 16px; }

  .deps-status-card { padding: 24px; }
  .deps-status-header {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .deps-status-header h2 { font-size: 1rem; font-weight: 600; margin-bottom: 4px; }
  .deps-status-header p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

  .deps-card { padding: 20px; }
  .deps-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.84rem;
    font-weight: 600;
    margin-bottom: 14px;
    color: var(--text-secondary);
  }
  .deps-card-title svg { color: var(--text-tertiary); }

  .deps-cmd-list { display: flex; flex-direction: column; gap: 8px; }
  .deps-cmd-block {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    transition: border-color var(--transition);
  }
  .deps-cmd-block:hover { border-color: var(--accent); }
  .deps-cmd-block code {
    flex: 1;
    font-size: 0.82rem;
    background: none;
    border: none;
    padding: 0;
    color: var(--text);
    user-select: all;
  }

  .deps-badge-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .deps-tool-badge {
    padding: 5px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-family: var(--font-mono);
    font-weight: 500;
    color: var(--text);
  }

  /* Skill set children */
  #tab-skills { padding: 24px 0; }
  .skillset-children { display: flex; flex-direction: column; gap: 20px; }
  .skillset-search { max-width: 400px; }
  .skillset-search .input {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    color: var(--text);
    font-family: var(--font-sans);
  }
  .skillset-search .input:focus { outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--accent); }

  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }

  .skill-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 22px 16px;
    text-decoration: none;
    color: inherit;
    transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
  }
  .skill-card:hover {
    border-color: var(--border-hover);
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .skill-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .skill-card-name {
    font-size: 0.92rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  .skill-card-name .skill-ns {
    color: var(--text-tertiary);
    font-weight: 400;
    font-size: 0.88em;
  }

  .skill-card-desc {
    font-size: 0.84rem;
    color: var(--text-secondary);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    flex: 1;
    min-height: 0;
  }

  .skill-card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border-subtle);
    margin-top: auto;
  }

  .skill-card-stats {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .skill-card-stats .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.78rem;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .skill-card-tags {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .skill-card-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .version-tag {
    font-size: 0.73rem;
    padding: 3px 8px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-weight: 500;
  }

  .load-more-wrap {
    text-align: center;
    padding: 8px 0;
  }

  /* Tab count badge */
  .tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-left: 2px;
  }
  .tab-count[hidden] { display: none; }

  /* Arenas tab */
  .arenas-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .arena-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: var(--transition);
  }
  .arena-row:hover { border-color: var(--border-hover); }

  .arena-row-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-muted);
    border-radius: var(--radius-sm);
    color: var(--accent);
  }

  .arena-row-body { flex: 1; min-width: 0; }

  .arena-row-title {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text);
    text-decoration: none;
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .arena-row-title:hover { color: var(--accent); }

  .arena-row-prompt {
    margin: 0 0 4px;
    font-size: 0.78rem;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arena-row-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
  .meta-dot { color: var(--border); }

  .arena-view-btn {
    flex-shrink: 0;
    font-size: 0.8rem;
    padding: 5px 12px;
  }

  /* Evals tab */
  .evals-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .eval-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .eval-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .eval-card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .eval-version {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
  }
  .eval-model {
    font-size: 0.72rem;
    color: var(--accent);
    background: var(--accent-muted);
    border-radius: 10px;
    padding: 1px 7px;
    font-weight: 500;
  }
  .eval-source {
    font-size: 0.72rem;
    color: var(--text-secondary);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1px 7px;
  }
  .eval-pass-rate {
    font-size: 1rem;
    font-weight: 700;
    font-family: var(--font-mono);
    flex-shrink: 0;
  }
  .eval-pass-rate.tier-tested { color: var(--green); }
  .eval-pass-rate.tier-below { color: var(--amber); }
  .eval-progress-wrap {
    height: 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 99px;
    overflow: hidden;
  }
  .eval-progress-bar {
    height: 100%;
    background: var(--green);
    border-radius: 99px;
    transition: width 0.4s ease;
  }
  .eval-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }
  .eval-stat {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }
  .eval-stat strong {
    color: var(--text);
    font-weight: 600;
  }
  .eval-card-meta {
    font-size: 0.72rem;
    color: var(--text-tertiary);
  }
  .eval-trend-chart {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 16px 8px;
    margin-bottom: 4px;
  }
  .eval-trend-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-tertiary);
    margin-bottom: 8px;
  }
  .eval-trend-chart svg text { font-family: var(--font-mono); }

  /* Readme rendered markdown */
  .readme-markdown { overflow-x: auto; }

  /* Related skills section */
  .related-skills {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 1px solid var(--border);
  }
  .related-skills h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text);
  }
  .related-grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .related-card {
    flex: 0 0 240px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    text-decoration: none;
    color: inherit;
    border-radius: var(--radius);
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .related-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .related-card-name {
    font-weight: 600;
    font-size: 0.92rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .related-scan-badge {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--green);
    background: var(--green-dim);
    border-radius: 10px;
    padding: 1px 5px;
    flex-shrink: 0;
  }
  .related-card-ns { font-size: 0.78rem; color: var(--text-tertiary); }
  .related-card-desc {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.4;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .related-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.76rem;
    color: var(--text-tertiary);
    margin-top: 4px;
  }
  .related-meta-item { display: inline-flex; align-items: center; gap: 3px; }
  .related-meta-item svg { opacity: 0.6; }


  /* GitHub topics in sidebar */
  .github-topics-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
  }
  .github-topics-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .github-topics-chips .tag-chip { font-size: 0.72rem; padding: 2px 8px; }

  /* Legacy compat */
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--text-secondary); text-align: center; }
  .empty-state p { margin: 0; font-size: .9rem; }
  .copy-row { display: flex; align-items: center; gap: 6px; background: var(--code-bg,var(--bg-elevated)); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 10px; overflow: hidden; }
  .install-code { background: none; border: none; padding: 0; font-size: .75rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); font-family: var(--font-mono); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

  @media (max-width: 768px) {
    .skill-page { padding: 20px 16px 60px; }
    .breadcrumb-bar { flex-wrap: wrap; gap: 6px; font-size: 0.82rem; }
    .skill-nav-btn { max-width: 120px; padding: 3px 8px; font-size: 0.75rem; }
    .skill-header { flex-direction: column; gap: 10px; }
    .skill-identity { gap: 12px; }
    .skill-icon { width: 40px; height: 40px; }
    .skill-icon svg { width: 20px; height: 20px; }
    .skill-name { font-size: 1.2rem; word-break: break-word; line-height: 1.3; }
    .skill-desc { max-width: 100%; font-size: 0.85rem; line-height: 1.5; -webkit-line-clamp: 3; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
    .skill-actions { flex-wrap: wrap; width: 100%; gap: 8px; }
    .skill-actions .btn { flex: 1 1 auto; justify-content: center; min-width: 80px; }
    #tab-readme:not([hidden]) { grid-template-columns: 1fr; gap: 16px; }
    #tab-readme:not([hidden]) .skill-sidebar { order: -1; }
    .install-cmd { padding: 6px 10px; }
    .install-cmd code { white-space: normal; word-break: break-all; font-size: 0.72rem; line-height: 1.35; }
    .sidebar-section { padding: 12px; }
    .stats-bar { flex-wrap: wrap; gap: 0; }
    .stat-item { border-right: none; border-bottom: 1px solid var(--border); flex: 1 1 50%; }
    .stat-item:last-child { border-bottom: none; }
    .stat-item-category { flex: 1 1 100%; border-left: none; margin-left: 0; }
    .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-right: 20px; }
    .tabs::-webkit-scrollbar { display: none; }
    .tab { white-space: nowrap; flex-shrink: 0; padding: 10px 14px; font-size: 0.82rem; gap: 5px; }
    .readme-body { padding: 20px 16px 24px; }
    .readme-rendered pre { overflow-x: auto; max-width: 100%; font-size: 0.78rem; }
    .skills-grid { grid-template-columns: 1fr; }
    .sec-overview { padding: 16px; flex-direction: column; gap: 10px; }
    .security-summary-bar { padding: 8px 16px; flex-wrap: wrap; gap: 6px; }
    .files-container { flex-direction: column; max-height: none; }
    .files-sidebar { width: 100%; min-width: 100%; border-right: none; border-bottom: 1px solid var(--border); max-height: 200px; }
.related-card { flex: 0 0 200px; }
  }

  @media (max-width: 375px) {
    .skill-name { font-size: 1.15rem; }
    .skill-desc { font-size: 0.85rem; }
    .tabs { overflow-x: scroll; -webkit-overflow-scrolling: touch; }
    .tab { padding: 9px 8px; font-size: 0.78rem; gap: 0; }
    .tab svg { display: none; }
    .stat-item { padding: 8px 12px; font-size: 0.78rem; }
    .skill-actions .btn { font-size: 0.82rem; }
    .readme-body { padding: 16px 12px 20px; }
    .install-cmd code { font-size: 0.68rem; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// CSS — Agent detail page
// ─────────────────────────────────────────────────────────────────────────────

const AGENT_CSS = `
.agent-page { padding-top: 24px; padding-bottom: 80px; }
/* Breadcrumb — reused from skill page */
.breadcrumb-bar { margin-bottom: 20px; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: .85rem; color: var(--text-tertiary); flex-wrap: wrap; }
.breadcrumb a { color: var(--text-secondary); }
.breadcrumb a:hover { color: var(--accent-fg); }
/* Header */
.agent-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
.agent-header-left { flex: 1; min-width: 0; }
.agent-identity { display: flex; align-items: flex-start; gap: 14px; }
.agent-icon { width: 48px; height: 48px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.agent-name { font-size: 1.5rem; font-weight: 700; letter-spacing: -.02em; word-break: break-word; }
.agent-meta-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
.platform-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: .78rem; font-weight: 600; border: 1px solid transparent; }
.agent-created-label { font-size: .83rem; color: var(--text-tertiary); }
.agent-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 4px; }
/* Tabs — same as skill page */
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 24px; overflow-x: auto; }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--text-secondary); font-size: .875rem; font-weight: 500; font-family: var(--font-sans); cursor: pointer; transition: all var(--transition); white-space: nowrap; margin-bottom: -1px; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent-fg); border-bottom-color: var(--accent); }
.tab-content { flex: 1; min-width: 0; }
.tab-panel { padding-top: 8px; }
/* Layout */
.agent-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
/* README tab */
.agent-readme-body { font-size: .95rem; line-height: 1.7; }
.readme-section { margin-bottom: 24px; }
.readme-desc { color: var(--text-secondary); }
.readme-h3 { font-size: 1rem; font-weight: 700; margin-bottom: 10px; }
.readme-code { display: block; background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; font-family: var(--font-mono); font-size: .82rem; white-space: pre-wrap; word-break: break-all; }
/* Details tab */
.agent-details-list { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: .875rem; }
.agent-details-list dt { color: var(--text-tertiary); font-weight: 500; }
.agent-details-list dd { color: var(--text); word-break: break-word; }
/* Metadata tab */
.metadata-pre { white-space: pre-wrap; word-break: break-word; font-family: var(--font-mono); font-size: .82rem; line-height: 1.6; color: var(--text); margin: 0; }
/* Sidebar */
.agent-sidebar { display: flex; flex-direction: column; gap: 16px; }
.sidebar-section { padding: 16px; }
.sidebar-heading { font-size: .78rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
.sidebar-hint { font-size: .78rem; color: var(--text-tertiary); margin-bottom: 6px; }
.copy-row { display: flex; align-items: center; gap: 6px; background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 10px; overflow: hidden; }
.install-code { background: none; border: none; padding: 0; font-size: .75rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.copy-btn { flex-shrink: 0; background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: 2px; display: flex; transition: color var(--transition); }
.copy-btn:hover { color: var(--accent-fg); }
.meta-list { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: .85rem; }
.meta-list dt { color: var(--text-tertiary); font-weight: 500; }
.meta-list dd { color: var(--text); word-break: break-word; }
.mono-sm { font-family: var(--font-mono); font-size: .75rem; }
/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--text-secondary); text-align: center; }
@media (max-width:768px){
  .agent-layout { grid-template-columns: 1fr; }
  .agent-header { flex-direction: column; }
  .agent-sidebar { order: -1; }
}
`;
