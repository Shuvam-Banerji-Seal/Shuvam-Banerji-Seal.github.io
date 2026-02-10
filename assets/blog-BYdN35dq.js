import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        *//* empty css               *//* empty css                  */import"./navbar-CxcuK0N-.js";import"./enhanced-rJVzSnir.js";document.addEventListener("DOMContentLoaded",()=>{const t=new URLSearchParams(window.location.search).get("post");t?h(t):g()});async function g(){const r=document.getElementById("blog-content");if(r){r.innerHTML='<div class="text-center"><span class="loading-spinner"></span> Loading posts...</div>';try{let t;try{if(t=await fetch("../blog-manifest.json?v="+Date.now()),!t.ok)throw new Error("Relative path failed")}catch{console.log("Retrying with root path..."),t=await fetch("/blog-manifest.json?v="+Date.now())}if(!t.ok)throw new Error(`Failed to load blog manifest: ${t.status} ${t.statusText}`);const e=await t.json();if(e.length===0){r.innerHTML='<p class="text-center text-gray-500">No posts found.</p>';return}let s='<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">';e.forEach(a=>{s+=`
                <article class="card glassmorphic blog-post-card animate-on-scroll">
                    <header>
                        <div class="mb-2">
                            ${a.tags.map(o=>`<span class="tech-tag">${o}</span>`).join("")}
                        </div>
                        <h2 class="blog-title">
                            <a href="?post=${a.filename}">${a.title}</a>
                        </h2>
                        <p class="blog-meta">Published on: ${new Date(a.date).toLocaleDateString()}</p>
                    </header>
                    <p class="blog-excerpt">
                        ${a.description||"Click to read more..."}
                    </p>
                    <a href="?post=${a.filename}" class="read-more-link">Read More <i data-lucide="arrow-right" class="inline-block w-4 h-4 ml-1"></i></a>
                </article>
            `}),s+="</div>",r.innerHTML=s,typeof lucide<"u"&&lucide.createIcons(),f()}catch(t){console.error("Error loading blog list:",t),r.innerHTML='<p class="text-center text-red-500">Error loading posts. Please try again later.</p>'}}}async function h(r){const t=document.getElementById("blog-content");if(t){t.innerHTML='<div class="text-center"><span class="loading-spinner"></span> Loading post...</div>';try{let e;try{if(e=await fetch(`../posts/${r}`),!e.ok)throw new Error("Relative path failed")}catch{e=await fetch(`/posts/${r}`)}if(!e.ok)throw new Error("Failed to load post");const s=await e.text(),a=s.split(/^---\s*$/m);let o=s,i={};if(a.length>=3){const n=a[1];o=a.slice(2).join("---"),i=m(n)}marked.setOptions({highlight:function(n,l){return l&&hljs.getLanguage(l)?hljs.highlight(n,{language:l}).value:hljs.highlightAuto(n).value},breaks:!0});let c=marked.parse(o);c=c.replace(/\$\$([\s\S]+?)\$\$/g,(n,l)=>{try{return katex.renderToString(l,{displayMode:!0})}catch{return n}}),c=c.replace(/\$([^$]+?)\$/g,(n,l)=>{try{return katex.renderToString(l,{displayMode:!1})}catch{return n}});const d=`
            <div class="max-w-4xl mx-auto">
                <a href="blog.html" class="btn btn-secondary mb-8 inline-flex items-center">
                    <i data-lucide="arrow-left" class="mr-2"></i> Back to Blog
                </a>
                
                <article class="glassmorphic p-8 rounded-xl">
                    <header class="mb-8 text-center">
                        <div class="mb-4">
                            ${(i.tags||[]).map(n=>`<span class="tech-tag mr-2">${n}</span>`).join("")}
                        </div>
                        <h1 class="text-4xl font-bold mb-4 gradient-text">${i.title||"Untitled Post"}</h1>
                        <p class="text-gray-500 dark:text-gray-400">
                            Published on: ${i.date?new Date(i.date).toLocaleDateString():"Unknown Date"}
                        </p>
                    </header>
                    
                    <div class="prose dark:prose-invert max-w-none">
                        ${c}
                    </div>
                </article>
            </div>
        `;t.innerHTML=d,typeof lucide<"u"&&lucide.createIcons(),window.scrollTo(0,0)}catch(e){console.error("Error loading blog post:",e),t.innerHTML='<p class="text-center text-red-500">Error loading post. Please try again later.</p>'}}}function m(r){const t={};return r.split(`
`).forEach(e=>{const[s,...a]=e.split(":");if(s&&a.length>0){let o=a.join(":").trim();o.startsWith("[")&&o.endsWith("]")&&(o=o.slice(1,-1).split(",").map(i=>i.trim())),t[s.trim()]=o}}),t}function f(){const r=new IntersectionObserver(t=>{t.forEach(e=>{e.isIntersecting&&e.target.classList.add("is-visible")})},{threshold:.1});document.querySelectorAll(".animate-on-scroll").forEach(t=>r.observe(t))}
