/**
 * Shared site navigation (Element system, plans/design-element.md).
 * Builds the top bar, the grouped Tools menu and the mobile sheet,
 * and owns the light/dark preference for every page.
 */

// ---------- Theme: two modes, system default, explicit choice wins ----------
const DARK_ALIASES = [
  "dark",
  "quantum",
  "dark-coffee",
  "amber",
  "tokyo-night",
  "absolute-dark",
  "forest",
  "dracula",
];

function isDarkTheme(theme) {
  return DARK_ALIASES.includes(theme);
}

function resolveTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem("theme");
  } catch (_) {
    /* storage blocked: fall through to system preference */
  }
  if (saved === "light") return "light";
  if (saved && isDarkTheme(saved)) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setThemeAttr(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (document.body) document.body.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

// Apply as early as this module runs, before DOMContentLoaded work.
setThemeAttr(resolveTheme());

document.addEventListener("DOMContentLoaded", function () {
  const navbarContainer = document.getElementById("navbar-container");
  if (!navbarContainer) return;

  const currentPath = window.location.pathname;
  const isHome =
    currentPath.endsWith("index.html") || currentPath.endsWith("/");
  const pathSegments = currentPath.split("/").filter(Boolean);
  const pathDepth = isHome ? "" : pathSegments.map(() => "../").join("");
  const to = (p) => (isHome ? p : pathDepth + p);
  const home = (hash) => (isHome ? hash : pathDepth + "index.html" + hash);

  // Tools grouped by what people use them for.
  const toolGroups = [
    {
      group: "Chemistry",
      items: [
        ["Periodic table", "pages/tools/periodic-table.html"],
        ["Molecular weight", "pages/tools/mol-weight.html"],
        ["Equation balancer", "pages/tools/equation-balancer.html"],
        ["pH calculator", "pages/tools/ph-calculator.html"],
        ["Molecule viewer", "pages/tools/molecule-viz.html"],
        ["Thermodynamics", "pages/thermodynamics.html"],
        ["Chemistry games", "pages/tools/games.html"],
      ],
    },
    {
      group: "Documents",
      items: [
        ["PDF Studio", "pages/tools/pdf-studio.html"],
        ["Reader", "pages/reader.html"],
        ["Mermaid editor", "pages/mermaid-tool.html"],
        ["Paper finder", "pages/tools/paper-finder.html"],
        ["Unit converter", "pages/tools/unit-converter.html"],
      ],
    },
    {
      group: "Audio and image",
      items: [
        ["Audio Studio", "pages/tools/audio-studio.html"],
        ["Music player", "pages/music.html"],
        ["Image Studio", "pages/tools/image-studio.html"],
        ["Webcam and air guitar", "pages/tools/webcam-tester.html"],
        ["YouTube downloader", "pages/tools/youtube-downloader.html"],
      ],
    },
    {
      group: "Language models and code",
      items: [
        ["LLM chat", "pages/tools/llm-chat.html"],
        ["LLM Studio", "pages/tools/llm-studio.html"],
        ["HTML playground", "pages/tools/playground.html"],
        ["Public APIs", "pages/apis.html"],
        ["File sharing", "pages/tools/file-share.html"],
        ["Fullscreen timer", "pages/tools/fullscreen-timer.html"],
      ],
    },
  ];

  const navStructure = [
    { name: "Research", href: home("#research"), type: "link" },
    { name: "Software", href: home("#software"), type: "link" },
    {
      name: "Tools",
      type: "dropdown",
      wide: true,
      groups: toolGroups,
      footer: ["See all tools", "pages/tools.html"],
    },
    {
      name: "Writing",
      type: "dropdown",
      groups: [
        {
          group: null,
          items: [
            ["Blog", "pages/blog.html"],
            ["Notes", "pages/notes.html"],
            ["GitHub projects", "pages/github-projects.html"],
            ["Gallery", "pages/gallery.html"],
          ],
        },
      ],
    },
    { name: "CV", href: to("pages/resume.html"), type: "link" },
    { name: "Contact", href: home("#contact"), type: "link" },
  ];

  const renderGroups = (item) =>
    item.groups
      .map(
        (g) => `
          <div class="nav-group">
            ${g.group ? `<p class="nav-group-title">${g.group}</p>` : ""}
            ${g.items
              .map(
                ([name, href]) =>
                  `<a href="${to(href)}" class="dropdown-item">${name}</a>`,
              )
              .join("")}
          </div>`,
      )
      .join("");

  const navbarHTML = `
    <nav id="navbar" class="${!isHome ? "scrolled" : ""}" aria-label="Main">
        <div class="container nav-content">
            <a href="${to("index.html")}" class="nav-logo">Shuvam Banerji Seal</a>
            <div class="nav-links">
                ${navStructure
                  .map((item) => {
                    if (item.type === "dropdown") {
                      return `
                        <div class="nav-dropdown">
                            <button class="nav-link dropdown-toggle" aria-expanded="false" aria-haspopup="true">
                                ${item.name}
                                <i data-lucide="chevron-down" class="dropdown-arrow" aria-hidden="true"></i>
                            </button>
                            <div class="dropdown-menu${item.wide ? " dropdown-menu--wide" : ""}">
                                <div class="nav-groups">${renderGroups(item)}</div>
                                ${item.footer ? `<a class="nav-menu-footer" href="${to(item.footer[1])}">${item.footer[0]}</a>` : ""}
                            </div>
                        </div>`;
                    }
                    return `<a href="${item.href}" class="nav-link ${isActive(item.href) ? "active" : ""}">${item.name}</a>`;
                  })
                  .join("")}
            </div>
            <div class="nav-actions">
                <button data-theme-toggle class="theme-toggle-btn" aria-label="Switch to dark mode">
                    <i data-lucide="moon" class="w-5 h-5"></i>
                </button>
                <button id="menu-btn" aria-label="Open menu">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>
    `;

  navbarContainer.innerHTML = navbarHTML;

  const mobileMenuHTML = `
    <div id="mobile-menu" aria-label="Menu">
        <div class="mobile-menu-header">
            <span class="mobile-menu-title">Menu</span>
            <button id="close-menu-btn" aria-label="Close menu">
                <i data-lucide="x" class="w-8 h-8"></i>
            </button>
        </div>
        <div class="mobile-menu-content">
            ${navStructure
              .map((item) => {
                if (item.type === "dropdown") {
                  return `
                    <div class="mobile-accordion">
                        <button class="mobile-accordion-toggle">
                            <span>${item.name}</span>
                            <i data-lucide="chevron-down" class="accordion-arrow"></i>
                        </button>
                        <div class="mobile-accordion-content">
                            ${item.groups
                              .flatMap((g) => g.items)
                              .map(
                                ([name, href]) =>
                                  `<a href="${to(href)}" class="mobile-menu-link mobile-submenu-link"><span>${name}</span></a>`,
                              )
                              .join("")}
                            ${item.footer ? `<a href="${to(item.footer[1])}" class="mobile-menu-link mobile-submenu-link"><span>${item.footer[0]}</span></a>` : ""}
                        </div>
                    </div>`;
                }
                return `<a href="${item.href}" class="mobile-menu-link">${item.name}</a>`;
              })
              .join("")}
        </div>
    </div>
    <div id="mobile-menu-backdrop"></div>
    `;

  const existingMenu = document.getElementById("mobile-menu");
  if (existingMenu) existingMenu.remove();
  const existingBackdrop = document.getElementById("mobile-menu-backdrop");
  if (existingBackdrop) existingBackdrop.remove();

  document.body.insertAdjacentHTML("beforeend", mobileMenuHTML);

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  initDropdowns();
  initMobileMenuLogic();
  initThemeToggle();
});

function initThemeToggle() {
  function paintToggles(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      const dark = isDarkTheme(theme);
      btn.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode",
      );
      const icon = btn.querySelector("i, svg");
      if (icon) {
        const fresh = document.createElement("i");
        fresh.setAttribute("data-lucide", dark ? "sun" : "moon");
        fresh.className = "w-5 h-5";
        icon.replaceWith(fresh);
      }
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function applyTheme(theme, persist) {
    setThemeAttr(theme);
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (_) {
        /* preference just won't persist */
      }
    }
    paintToggles(theme);
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme } }),
    );
  }

  applyTheme(resolveTheme(), false);

  window.__themeToggleWired = true;
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener("click", function () {
      const current =
        document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(isDarkTheme(current) ? "light" : "dark", true);
    });
  });

  // Follow the system while the visitor has not chosen.
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function () {
      let saved = null;
      try {
        saved = localStorage.getItem("theme");
      } catch (_) {}
      if (!saved) applyTheme(resolveTheme(), false);
    });
}

function initDropdowns() {
  const dropdowns = document.querySelectorAll(".nav-dropdown");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    const menu = dropdown.querySelector(".dropdown-menu");

    // Desktop hover behavior
    dropdown.addEventListener("mouseenter", () => {
      menu.classList.add("show");
      toggle.classList.add("active");
    });

    dropdown.addEventListener("mouseleave", () => {
      menu.classList.remove("show");
      toggle.classList.remove("active");
    });

    // Click behavior: toggle on touch devices only.
    // On hover-capable devices the menu already opens on hover, so a click
    // toggling it closed would be a UX trap — clicks there just (re-)open it.
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.matchMedia("(hover: hover)").matches) {
        menu.classList.add("show");
        toggle.classList.add("active");
        toggle.setAttribute("aria-expanded", "true");
        return;
      }

      const isOpen = menu.classList.contains("show");

      // Close all other dropdowns
      document
        .querySelectorAll(".dropdown-menu")
        .forEach((m) => m.classList.remove("show"));
      document
        .querySelectorAll(".dropdown-toggle")
        .forEach((t) => t.classList.remove("active"));

      if (!isOpen) {
        menu.classList.add("show");
        toggle.classList.add("active");
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((m) => m.classList.remove("show"));
    document.querySelectorAll(".dropdown-toggle").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-expanded", "false");
    });
  });

  // Escape closes any open dropdown and restores focus to its toggle
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
      m.classList.remove("show");
      const t = m.parentElement.querySelector(".dropdown-toggle");
      if (t) {
        t.classList.remove("active");
        t.setAttribute("aria-expanded", "false");
        t.focus();
      }
    });
  });
}

function initMobileMenuLogic() {
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-menu-backdrop");
  const mobileLinks = document.querySelectorAll(".mobile-menu-link");

  function openMenu() {
    if (mobileMenu) mobileMenu.classList.add("active");
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
    // Hamburger → X
    if (menuBtn) {
      const icon = menuBtn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "x");
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
      menuBtn.setAttribute("aria-label", "Close mobile menu");
    }
  }

  function closeMenu() {
    if (mobileMenu) mobileMenu.classList.remove("active");
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
    // X → Hamburger
    if (menuBtn) {
      const icon = menuBtn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
      menuBtn.setAttribute("aria-label", "Open mobile menu");
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openMenu();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeMenu();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu);
  }

  // Close menu when clicking a link (but not accordion toggles)
  mobileLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!e.target.closest(".mobile-accordion-toggle")) {
        closeMenu();
      }
    });
  });

  // Mobile accordion functionality
  const accordionToggles = document.querySelectorAll(
    ".mobile-accordion-toggle",
  );
  accordionToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const accordion = toggle.closest(".mobile-accordion");
      const content = accordion.querySelector(".mobile-accordion-content");

      // Toggle current accordion
      const isOpen = accordion.classList.contains("open");

      // Close all accordions
      document.querySelectorAll(".mobile-accordion").forEach((acc) => {
        acc.classList.remove("open");
        acc.querySelector(".mobile-accordion-content").style.maxHeight = null;
      });

      // Open clicked accordion if it was closed
      if (!isOpen) {
        accordion.classList.add("open");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Dispatch event to signal navbar is ready
  document.dispatchEvent(new Event("navbarLoaded"));
}

function isActive(href) {
  const currentPath = window.location.pathname;
  const normalizedCurrent = currentPath.replace(/\/+/g, "/").replace(/\/$/, "");

  if (href.startsWith("#")) {
    return false;
  }

  const hrefFilename = href.split("/").pop();
  const currentFilename = normalizedCurrent.split("/").pop();
  if (
    hrefFilename &&
    currentFilename &&
    hrefFilename === currentFilename &&
    hrefFilename !== "index.html"
  ) {
    return true;
  }

  return false;
}

// Global notification system
window.showNotification = function (message, type = "error") {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.style.cssText = `padding:12px 16px;border-radius:8px;color:#fff;font-weight:500;box-shadow:var(--lift);transition:opacity 0.3s,transform 0.3s;transform:translateY(20px);opacity:0;`;
  toast.style.background =
    type === "error" ? "#c92a39" : type === "success" ? "#1f7a4d" : "#2445c2";
  toast.textContent = message;
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });

  // Auto remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};
