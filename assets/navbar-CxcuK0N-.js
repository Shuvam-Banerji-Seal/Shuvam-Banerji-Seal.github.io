function u(){const c=document.getElementById("navbar-container");if(!c)return;const o=window.location.pathname,e=o.endsWith("index.html")||o.endsWith("/"),t=o.includes("/tools/"),l=e?"":t?"../../":"../",r=[{name:"About",href:e?"#about":l+"index.html#about",type:"link"},{name:"Resume",href:e?"pages/resume.html":t?"../resume.html":"resume.html",type:"link"},{name:"Projects",href:e?"#projects":l+"index.html#projects",type:"link"},{name:"Resources",type:"dropdown",items:[{name:"GitHub Projects",href:e?"pages/github-projects.html":t?"../github-projects.html":"github-projects.html",icon:"github"},{name:"Gallery",href:e?"pages/gallery.html":t?"../gallery.html":"gallery.html",icon:"image"},{name:"Blog",href:e?"pages/blog.html":t?"../blog.html":"blog.html",icon:"book-open"},{name:"Notes",href:e?"pages/notes.html":t?"../notes.html":"notes.html",icon:"file-text"}]},{name:"Apps",type:"dropdown",items:[{name:"E-Reader",href:e?"pages/reader.html":t?"../reader.html":"reader.html",icon:"book"},{name:"Music Player",href:e?"pages/music.html":t?"../music.html":"music.html",icon:"music"},{name:"Mermaid Editor",href:e?"pages/mermaid-tool.html":t?"../mermaid-tool.html":"mermaid-tool.html",icon:"git-branch"},{name:"Audio Studio",href:e?"pages/tools/audio-studio.html":t?"audio-studio.html":"tools/audio-studio.html",icon:"mic"},{name:"Thermodynamics",href:e?"pages/thermodynamics.html":t?"../thermodynamics.html":"thermodynamics.html",icon:"thermometer"}]},{name:"Tools",type:"dropdown",items:[{name:"All Tools",href:e?"pages/tools.html":t?"../tools.html":"tools.html",icon:"wrench",divider:!0},{name:"LLM Chat",href:e?"pages/tools/llm-chat.html":t?"llm-chat.html":"tools/llm-chat.html",icon:"message-circle"},{name:"Research Papers",href:e?"pages/tools/paper-finder.html":t?"paper-finder.html":"tools/paper-finder.html",icon:"search"},{name:"PDF to JPG",href:e?"pages/tools/pdf-to-jpg.html":t?"pdf-to-jpg.html":"tools/pdf-to-jpg.html",icon:"image"},{name:"PDF Compressor",href:e?"pages/tools/pdf-reducer.html":t?"pdf-reducer.html":"tools/pdf-reducer.html",icon:"minimize-2"},{name:"Molecule 3D",href:e?"pages/tools/molecule-viz.html":t?"molecule-viz.html":"tools/molecule-viz.html",icon:"atom"},{name:"Periodic Table",href:e?"pages/tools/periodic-table.html":t?"periodic-table.html":"tools/periodic-table.html",icon:"table-2"},{name:"Unit Converter",href:e?"pages/tools/unit-converter.html":t?"unit-converter.html":"tools/unit-converter.html",icon:"ruler"},{name:"Mol. Weight Calc",href:e?"pages/tools/mol-weight.html":t?"mol-weight.html":"tools/mol-weight.html",icon:"calculator"},{name:"Equation Balancer",href:e?"pages/tools/equation-balancer.html":t?"equation-balancer.html":"tools/equation-balancer.html",icon:"scale"},{name:"pH Calculator",href:e?"pages/tools/ph-calculator.html":t?"ph-calculator.html":"tools/ph-calculator.html",icon:"droplet"},{name:"Chemistry Games",href:e?"pages/tools/games.html":t?"games.html":"tools/games.html",icon:"gamepad-2"}]}],i=`
    <nav id="navbar" class="${e?"":"scrolled"}">
        <div class="container nav-content glassmorphic">
            <a href="${e?"index.html":l+"index.html"}" class="nav-logo">
                <i data-lucide="atom" class="mr-2"></i>
                <span>SBS</span>
            </a>
            <div class="nav-links">
                ${r.map(n=>n.type==="dropdown"?`
                        <div class="nav-dropdown">
                            <button class="nav-link dropdown-toggle">
                                ${n.name}
                                <i data-lucide="chevron-down" class="dropdown-arrow"></i>
                            </button>
                            <div class="dropdown-menu">
                                ${n.items.map(s=>`
                                    <a href="${s.href}" class="dropdown-item ${s.divider?"has-divider":""}">
                                        <i data-lucide="${s.icon}"></i>
                                        <span>${s.name}</span>
                                    </a>
                                `).join("")}
                            </div>
                        </div>
                        `:`<a href="${n.href}" class="nav-link ${g(n.href)?"active":""}">${n.name}</a>`).join("")}
                <a href="${e?"#contact":l+"index.html#contact"}" class="btn btn-primary nav-contact-btn">Contact</a>
            </div>
            <div class="nav-actions">
                <button data-theme-toggle class="theme-toggle-btn" aria-label="Toggle theme">
                    <i data-lucide="moon" class="w-5 h-5"></i>
                </button>
                <button id="menu-btn" aria-label="Open mobile menu">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>
    `;c.innerHTML=i;const d=`
    <div id="mobile-menu">
        <div class="mobile-menu-header">
            <span class="mobile-menu-title">Menu</span>
            <button id="close-menu-btn">
                <i data-lucide="x" class="w-8 h-8"></i>
            </button>
        </div>
        <div class="mobile-menu-content">
            ${r.map(n=>n.type==="dropdown"?`
                    <div class="mobile-accordion">
                        <button class="mobile-accordion-toggle">
                            <span>${n.name}</span>
                            <i data-lucide="chevron-down" class="accordion-arrow"></i>
                        </button>
                        <div class="mobile-accordion-content">
                            ${n.items.map(s=>`
                                <a href="${s.href}" class="mobile-menu-link mobile-submenu-link">
                                    <i data-lucide="${s.icon}"></i>
                                    <span>${s.name}</span>
                                </a>
                            `).join("")}
                        </div>
                    </div>
                    `:`<a href="${n.href}" class="mobile-menu-link">${n.name}</a>`).join("")}
            <a href="${e?"#contact":l+"index.html#contact"}" class="btn btn-primary mobile-menu-link">Contact</a>
        </div>
    </div>
    <div id="mobile-menu-backdrop"></div>
    `,a=document.getElementById("mobile-menu");a&&a.remove();const m=document.getElementById("mobile-menu-backdrop");m&&m.remove(),document.body.insertAdjacentHTML("beforeend",d),typeof lucide<"u"&&lucide.createIcons(),p(),v()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u):u();function p(){document.querySelectorAll(".nav-dropdown").forEach(o=>{const e=o.querySelector(".dropdown-toggle"),t=o.querySelector(".dropdown-menu");o.addEventListener("mouseenter",()=>{t.classList.add("show"),e.classList.add("active")}),o.addEventListener("mouseleave",()=>{t.classList.remove("show"),e.classList.remove("active")}),e.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation();const r=t.classList.contains("show");document.querySelectorAll(".dropdown-menu").forEach(i=>i.classList.remove("show")),document.querySelectorAll(".dropdown-toggle").forEach(i=>i.classList.remove("active")),r||(t.classList.add("show"),e.classList.add("active"))})}),document.addEventListener("click",()=>{document.querySelectorAll(".dropdown-menu").forEach(o=>o.classList.remove("show")),document.querySelectorAll(".dropdown-toggle").forEach(o=>o.classList.remove("active"))})}function v(){const c=document.getElementById("menu-btn"),o=document.getElementById("close-menu-btn"),e=document.getElementById("mobile-menu"),t=document.getElementById("mobile-menu-backdrop"),l=document.querySelectorAll(".mobile-menu-link");function r(){e&&e.classList.add("active"),t&&t.classList.add("active"),document.body.style.overflow="hidden"}function i(){e&&e.classList.remove("active"),t&&t.classList.remove("active"),document.body.style.overflow=""}c&&c.addEventListener("click",a=>{a.stopPropagation(),r()}),o&&o.addEventListener("click",a=>{a.stopPropagation(),i()}),t&&t.addEventListener("click",i),l.forEach(a=>{a.addEventListener("click",i)}),document.querySelectorAll(".mobile-accordion-toggle").forEach(a=>{a.addEventListener("click",()=>{const m=a.closest(".mobile-accordion"),n=m.querySelector(".mobile-accordion-content"),s=m.classList.contains("open");document.querySelectorAll(".mobile-accordion").forEach(h=>{h.classList.remove("open"),h.querySelector(".mobile-accordion-content").style.maxHeight=null}),s||(m.classList.add("open"),n.style.maxHeight=n.scrollHeight+"px")})}),document.addEventListener("keydown",a=>{a.key==="Escape"&&i()}),document.dispatchEvent(new Event("navbarLoaded"))}function g(c){const e=window.location.pathname.split("/").pop()||"index.html";return c.startsWith("#")&&(e==="index.html"||e==="")?!1:!!(c.includes(e)&&e!=="index.html")}
