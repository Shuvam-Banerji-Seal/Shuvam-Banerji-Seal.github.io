/**
 * home.js: small homepage behaviours.
 *  - "Run it on this page" swaps the Molecule3D poster (ATP figure) for the
 *    live app in an iframe, and Close puts the poster back.
 *  - Project rows marked data-repo get language and stars from the build-time
 *    GitHub snapshot (assets/data/github-repos.json).
 */
const APP = "https://shuvam-banerji-seal.github.io/lammps-web-gui/";

const section = document.getElementById("molecule3d");
const view = section?.querySelector("[data-m3d-view]");
const runBtn = section?.querySelector("[data-m3d-run]");
const closeBtn = section?.querySelector("[data-m3d-close]");
if (section && view && runBtn && closeBtn) {
  const poster = view.firstElementChild;
  let frame = null;
  runBtn.addEventListener("click", () => {
    if (!frame) {
      frame = document.createElement("iframe");
      frame.src = APP;
      frame.title = "Molecule3D, the LAMMPS workbench, running inside this page";
      frame.allow = "fullscreen; clipboard-write";
      frame.loading = "eager";
    }
    poster.remove();
    view.appendChild(frame);
    section.classList.add("is-running");
    closeBtn.hidden = false;
    runBtn.textContent = "Running below";
    runBtn.disabled = true;
    section.querySelector(".m3d-window").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  closeBtn.addEventListener("click", () => {
    frame?.remove();
    frame = null;
    view.appendChild(poster);
    section.classList.remove("is-running");
    closeBtn.hidden = true;
    runBtn.disabled = false;
    runBtn.textContent = "Run it on this page";
    runBtn.focus();
  });
}

const rows = document.querySelectorAll("[data-repo]");
if (rows.length) {
  fetch("/assets/data/github-repos.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return;
      const by = new Map(data.repos.map((r) => [r.name.toLowerCase(), r]));
      rows.forEach((li) => {
        const r = by.get(li.dataset.repo.toLowerCase());
        if (!r || li.querySelector(".repo-meta")) return;
        const meta = document.createElement("span");
        meta.className = "repo-meta";
        meta.textContent = [r.language, r.stars ? `★ ${r.stars}` : ""].filter(Boolean).join("  ");
        meta.title = `${r.language || "Repository"}, ${r.stars} star${r.stars === 1 ? "" : "s"} on GitHub`;
        if (meta.textContent) li.appendChild(meta);
      });
    })
    .catch(() => {});
}
