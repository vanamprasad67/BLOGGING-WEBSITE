/* ===== EDIT YOUR POSTS HERE =====
   Newest first. `slug` becomes the URL: #/post/your-slug
   `body` is HTML: use <p>, <h2>, <blockquote>, <code>. */
const POSTS = [
  {
    slug: "why-i-started-writing",
    title: "Why I started writing",
    date: "2026-09-20",
    tags: ["Personal"],
    summary: "Writing forces me to finish thoughts I'd otherwise leave half-formed.",
    body: `<p>I kept having ideas that disappeared by the next morning. Writing them down turned out to be the fix.</p>
           <h2>What I'll cover</h2>
           <p>Mostly what I'm learning, what broke, and how I fixed it.</p>
           <blockquote>Publish before you feel ready.</blockquote>`
  },
  {
    slug: "building-this-blog",
    title: "How I built this blog",
    date: "2026-09-27",
    tags: ["Tech"],
    summary: "One HTML file, no build step, hosted for free.",
    body: `<p>This blog is a single file. Posts live in a JavaScript array, and the page reads the URL hash to decide what to show.</p>
           <p>To add a post, copy an entry in the <code>POSTS</code> list and change the text.</p>`
  }
].sort((a, b) => b.date.localeCompare(a.date));
