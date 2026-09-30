/* ===== Storage: posts you publish in the browser are kept in localStorage ===== */
const STORE_KEY = "myblog.posts";

function loadSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function saveAll(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
  catch (e) { alert("Couldn't save. Browser storage is full or blocked."); return false; }
}
const HIDE_KEY = "myblog.hidden"; // sample posts from posts.js that you deleted
function loadHidden() {
  try { const v = JSON.parse(localStorage.getItem(HIDE_KEY)); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
}
function removePost(p) {
  if (p.mine) return saveAll(loadSaved().filter(x => x.slug !== p.slug));
  try { localStorage.setItem(HIDE_KEY, JSON.stringify([...loadHidden(), p.slug])); return true; }
  catch (e) { alert("Couldn't delete. Browser storage is full or blocked."); return false; }
}
function storageWorks() {
  try { localStorage.setItem("myblog.test", "1"); localStorage.removeItem("myblog.test"); return true; }
  catch (e) { return false; }
}
function allPosts() {
  // POSTS comes from posts.js; fall back to an empty list if it failed to load
  const hidden = loadHidden();
  const base = ((typeof POSTS !== "undefined" && Array.isArray(POSTS)) ? POSTS : []).filter(p => !hidden.includes(p.slug));
  const mine = loadSaved().filter(p => p && p.slug && p.title).map(p => ({ ...p, mine: true }));
  return [...mine, ...base]
    .filter(p => p && p.slug && p.title)
    .map(p => ({ date: "1970-01-01", summary: "", body: "", ...p, tags: Array.isArray(p.tags) && p.tags.length ? p.tags : ["General"] }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/* ===== Helpers ===== */
const app = document.getElementById("app");
const fmt = d => new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
let activeTag = "All";

// Turns plain text into HTML: blank line = new paragraph, "## " = heading, "> " = quote
function textToHtml(text) {
  return text.trim().split(/\n\s*\n/).map(block => {
    const b = block.trim();
    if (b.startsWith("## ")) return `<h2>${esc(b.slice(3))}</h2>`;
    if (b.startsWith("> ")) return `<blockquote>${esc(b.slice(2))}</blockquote>`;
    return `<p>${esc(b).replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
}

/* ===== Pages ===== */
function home() {
  document.title = "My Blog";
  const posts = allPosts();
  const tags = ["All", ...new Set(posts.flatMap(p => p.tags))];
  if (!tags.includes(activeTag)) activeTag = "All";
  const list = posts.filter(p => activeTag === "All" || p.tags.includes(activeTag));
  app.innerHTML = `
    <div class="filters" role="group" aria-label="Filter by topic">
      ${tags.map(t => `<button aria-pressed="${t === activeTag}" data-tag="${esc(t)}">${esc(t)}</button>`).join("")}
    </div>
    ${list.length ? list.map(p => `
      <div class="post-row">
        <time datetime="${p.date}">${fmt(p.date)}</time>
        <div>
          <h2><a href="#/post/${p.slug}">${esc(p.title)}</a></h2>
          <p>${esc(p.summary)}</p>
          <button class="btn danger small" data-del="${p.slug}">Delete</button>
        </div>
      </div>`).join("") : "<p>No posts yet. Select Write to publish your first one.</p>"}`;
  app.querySelectorAll("[data-tag]").forEach(b => b.onclick = () => { activeTag = b.dataset.tag; home(); });
  app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    if (removePost(posts.find(x => x.slug === b.dataset.del))) home();
  });
}

function post(slug) {
  const p = allPosts().find(x => x.slug === slug);
  if (!p) { app.innerHTML = `<article><h1>Post not found</h1><p>It may have been deleted. <a href="#/">Back to all posts</a>.</p></article>`; return; }
  document.title = p.title + " | My Blog";
  app.innerHTML = `<article>
    <h1>${esc(p.title)}</h1>
    <div class="meta"><time datetime="${p.date}">${fmt(p.date)}</time> &middot; ${p.tags.map(esc).join(", ")}</div>
    ${p.body}
    <div class="actions">
      ${p.mine ? `<a class="btn" href="#/write/${p.slug}">Edit post</a>` : ""}
      <button class="btn danger" id="del">Delete post</button>
    </div>
    <a class="back" href="#/">Back to all posts</a>
  </article>`;
  const del = document.getElementById("del");
  if (del) del.onclick = () => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    if (removePost(p)) location.hash = "#/";
  };
}

function write(slug) {
  const existing = slug ? loadSaved().find(x => x.slug === slug) : null;
  document.title = (existing ? "Edit post" : "Write") + " | My Blog";
  app.innerHTML = `<article>
    <h1>${existing ? "Edit post" : "Write a post"}</h1>
    <div class="form">
      <label for="f-title">Title</label>
      <input id="f-title" type="text" value="${existing ? esc(existing.title) : ""}">
      <label for="f-tags">Topics (separate with commas)</label>
      <input id="f-tags" type="text" value="${existing ? esc(existing.tags.join(", ")) : ""}" placeholder="Tech, Personal">
      <label for="f-summary">Summary (shown on the home page)</label>
      <input id="f-summary" type="text" value="${existing ? esc(existing.summary) : ""}">
      <label for="f-body">Post</label>
      <textarea id="f-body" rows="12" placeholder="Leave a blank line between paragraphs.&#10;Start a line with ## for a heading or > for a quote.">${existing ? esc(existing.raw || "") : ""}</textarea>
      <p class="error" id="f-error" role="alert"></p>
      <div class="actions">
        <button class="btn primary" id="f-save">${existing ? "Save changes" : "Publish"}</button>
        <a class="btn" href="#/">Cancel</a>
      </div>
    </div>
  </article>`;

  document.getElementById("f-save").onclick = () => {
    const title = document.getElementById("f-title").value.trim();
    const raw = document.getElementById("f-body").value.trim();
    const err = document.getElementById("f-error");
    if (!title || !raw) { err.textContent = "Add a title and some text before publishing."; return; }
    const tags = document.getElementById("f-tags").value.split(",").map(t => t.trim()).filter(Boolean);
    const summary = document.getElementById("f-summary").value.trim() || raw.replace(/\s+/g, " ").slice(0, 120);
    const saved = loadSaved();
    const entry = {
      slug: existing ? existing.slug : (title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "post") + "-" + Date.now().toString(36),
      title, summary, raw, body: textToHtml(raw),
      tags: tags.length ? tags : ["General"],
      date: existing ? existing.date : today()
    };
    const next = existing ? saved.map(x => x.slug === slug ? entry : x) : [entry, ...saved];
    if (saveAll(next)) location.hash = "#/post/" + entry.slug;
  };
}

function about() {
  document.title = "About | My Blog";
  app.innerHTML = `<article><h1>About</h1>
    <p>Hi, I'm Vanam. I write about what I'm learning.</p>
    <p>Contact: <a href="mailto:vanamprasad67@gmail.com">vanamprasad67@gmail.com</a></p></article>`;
}

/* ===== Router ===== */
function route() {
  try { renderRoute(); } catch (e) {
    app.innerHTML = `<article><h1>Something went wrong</h1><p class="notice">${esc(e.message || e)}</p><p>Check that posts.js is in the same folder and has no typing mistakes.</p></article>`;
    console.error(e);
  }
}

function renderRoute() {
  const h = location.hash.replace(/^#\/?/, "");
  document.querySelectorAll("nav a").forEach(a => a.removeAttribute("aria-current"));
  const mark = id => document.getElementById(id).setAttribute("aria-current", "page");
  if (h.startsWith("post/")) post(h.slice(5));
  else if (h === "write" || h.startsWith("write/")) { write(h.slice(6)); mark("nav-write"); }
  else if (h === "about") { about(); mark("nav-about"); }
  else { home(); mark("nav-home"); }
  if (!storageWorks()) {
    app.insertAdjacentHTML("afterbegin", `<p class="notice" role="alert">Your browser is blocking saved posts on this page, so published posts will disappear. Open the blog through VS Code's Live Server, or allow site data / turn off private mode, then reload.</p>`);
  }
  window.scrollTo(0, 0);
}

document.getElementById("year").textContent = new Date().getFullYear();
window.addEventListener("hashchange", route);
route();
