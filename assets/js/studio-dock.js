// ── SBS Studio Dock ─────────────────────────────────────────────────────
// A compact docking/panel system for the Audio Studio, modeled on the
// workflow of Premiere Pro / Audition:
//   • Panels live in a binary layout tree: splits (h/v) → tab groups → panels
//   • Drag a panel header to re-dock: edge drops split the target,
//     center drops tabify, dropping outside the dock floats the panel
//   • Splitters between split children resize them
//   • Panels can float (draggable/resizable windows), collapse, maximize
//   • The whole layout persists to localStorage; a reset restores defaults
// Panel CONTENT nodes are moved, never recreated, so every listener the
// audio engine attached survives rearrangement.

const DOCK_DEFAULTS = {
  minSplitPct: 8,
  edgeZone: 0.28, // fraction of target edge that triggers a split drop
};

class StudioDock {
  constructor(rootEl, panels, opts = {}) {
    this.root = rootEl;
    // panels: { id: { title, icon, el } }
    this.panels = panels;
    this.storageKey = opts.storageKey || "sbs-audio-studio-layout-v1";
    this.opts = { ...DOCK_DEFAULTS, ...opts };
    this.floats = new Map(); // id -> {x,y,w,h}
    this.collapsed = new Set();
    this.maximized = null;
    this._zTop = 100;
    this._menu = null;

    this.tree = this._load() || this._defaultTree();
    this._buildChrome();
    this.render();
    this._enableResponsive();
  }

  // ── layout tree ────────────────────────────────────────────────────────
  _defaultTree() {
    return {
      type: "split",
      dir: "h",
      sizes: [26, 48, 26],
      children: [
        {
          type: "split",
          dir: "v",
          sizes: [62, 38],
          children: [
            { type: "panel", panel: "visualizer" },
            { type: "panel", panel: "edit-tools" },
          ],
        },
        { type: "panel", panel: "tracks" },
        {
          type: "tabs",
          active: "mixer",
          panels: ["mixer", "effects", "export"],
        },
      ],
    };
  }

  _allPanelIds(node, acc = []) {
    if (!node) return acc;
    if (node.type === "panel") acc.push(node.panel);
    else if (node.type === "tabs") acc.push(...node.panels);
    else node.children.forEach((c) => this._allPanelIds(c, acc));
    return acc;
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.tree) return null;
      const known = new Set(Object.keys(this.panels));
      const floated = new Set((data.floats || []).map((f) => f.id));
      const expected = [...known].filter((id) => !floated.has(id));
      const ids = this._allPanelIds(data.tree);
      // the tree must hold exactly the non-floated panels, once each
      if (
        expected.length > 0 &&
        (ids.length !== expected.length ||
          !ids.every((id) => known.has(id)) ||
          new Set(ids).size !== ids.length ||
          !expected.every((id) => ids.includes(id)))
      )
        return null;
      (data.floats || []).forEach((f) => {
        if (known.has(f.id)) this.floats.set(f.id, f);
      });
      if (Array.isArray(data.collapsed))
        this.collapsed = new Set(data.collapsed);
      return data.tree;
    } catch {
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          tree: this.tree,
          floats: [...this.floats.values()],
          collapsed: [...this.collapsed],
        }),
      );
    } catch {
      /* storage blocked — layout just won't persist */
    }
  }

  resetLayout() {
    this.floats.clear();
    this.collapsed.clear();
    this.maximized = null;
    this._savedTree = null;
    this.tree = this._defaultTree();
    this.render();
  }

  // Find the reference chain from root to the node holding panel `id`.
  _pathToPanel(id, node = this.tree, path = []) {
    if (!node) return null;
    if (node.type === "panel" && node.panel === id)
      return [...path, { node, key: null }];
    if (node.type === "tabs" && node.panels.includes(id)) {
      const i = node.panels.indexOf(id);
      return [...path, { node, key: i }];
    }
    if (node.type === "split") {
      for (let i = 0; i < node.children.length; i++) {
        const found = this._pathToPanel(id, node.children[i], [
          ...path,
          { node, key: i },
        ]);
        if (found) return found;
      }
    }
    return null;
  }

  // Remove panel id from the tree, then clean up empty splits / singleton
  // wrappers so the tree stays canonical.
  _removePanel(id) {
    const path = this._pathToPanel(id);
    if (!path) return;
    const ref = path[path.length - 1];
    if (ref.node.type === "tabs") {
      ref.node.panels.splice(ref.key, 1);
      if (!ref.node.panels.includes(ref.node.active))
        ref.node.active = ref.node.panels[0];
    } else if (path.length > 1) {
      const parentRef = path[path.length - 2];
      const i = parentRef.key;
      parentRef.node.children.splice(i, 1);
      parentRef.node.sizes.splice(i, 1);
    } else {
      this.tree = null;
    }
    this.tree = this._cleanup(this.tree);
  }

  _cleanup(node) {
    if (!node) return null;
    if (node.type === "tabs") {
      if (node.panels.length === 0) return null;
      if (node.panels.length === 1)
        return { type: "panel", panel: node.panels[0] };
      return node;
    }
    if (node.type === "split") {
      const kept = [];
      node.children.forEach((c, i) => {
        const cleaned = this._cleanup(c);
        if (cleaned)
          kept.push({
            node: cleaned,
            size: node.sizes[i] ?? 100 / node.children.length,
          });
      });
      if (kept.length === 0) return null;
      if (kept.length === 1) return kept[0].node;
      const total = kept.reduce((a, k) => a + k.size, 0) || 100;
      node.children = kept.map((k) => k.node);
      node.sizes = kept.map((k) => (k.size / total) * 100);
      return node;
    }
    return node;
  }

  _swapNode(oldNode, newNode, parentNode) {
    // parentNode is the raw parent NODE (not a path entry)
    if (!parentNode) {
      this.tree = newNode;
      return;
    }
    if (parentNode.type === "split") {
      const i = parentNode.children.indexOf(oldNode);
      if (i >= 0) parentNode.children[i] = newNode;
    }
  }

  _insertPanel(id, targetPanelId, placement) {
    // placement: 'left'|'right'|'top'|'bottom'|'tab'
    const path = this._pathToPanel(targetPanelId);
    if (!path) return;
    const ref = path[path.length - 1];
    const newNode = { type: "panel", panel: id };

    if (placement === "tab") {
      if (ref.node.type === "tabs") {
        ref.node.panels.push(id);
        ref.node.active = id;
      } else {
        // plain panel → convert to tabs group
        const group = {
          type: "tabs",
          active: id,
          panels: [targetPanelId, id],
        };
        const parentRef = path.length > 1 ? path[path.length - 2] : null;
        this._swapNode(ref.node, group, parentRef ? parentRef.node : null);
      }
      return;
    }

    // split placement
    const dir = placement === "left" || placement === "right" ? "h" : "v";
    const before = placement === "left" || placement === "top";
    const group = {
      type: "split",
      dir,
      sizes: before ? [50, 50] : [50, 50],
      children: before ? [newNode, ref.node] : [ref.node, newNode],
    };
    const parentRef = path.length > 1 ? path[path.length - 2] : null;
    this._swapNode(ref.node, group, parentRef ? parentRef.node : null);
  }

  // ── chrome ─────────────────────────────────────────────────────────────
  _buildChrome() {
    if (!document.getElementById("studio-dock-style")) {
      const style = document.createElement("style");
      style.id = "studio-dock-style";
      style.textContent = `
.dock-root{position:relative;display:flex;min-height:0;min-width:0;overflow:hidden}
.dock-split{display:flex;min-height:0;min-width:0}
.dock-split.h{flex-direction:row}
.dock-split.v{flex-direction:column}
.dock-split>div{min-width:0;min-height:0;display:flex}
.dock-sizer{flex:0 0 6px;z-index:5}
.dock-sizer.h{cursor:col-resize;margin:0 3px;width:6px}
.dock-sizer.v{cursor:row-resize;margin:3px 0;height:6px}
.dock-sizer::after{content:"";display:block;width:100%;height:100%;border-radius:3px;background:transparent;transition:background .15s}
.dock-sizer:hover::after,.dock-sizer.active::after{background:var(--accent-cyan,#22d3ee)}
.dock-tabs{display:flex;flex-direction:column;min-width:0;min-height:0}
.dock-tabbar{display:flex;align-items:stretch;gap:1px;background:rgba(0,0,0,.35);border-bottom:1px solid var(--border,#1e2a45);overflow-x:auto;scrollbar-width:none}
.dock-tabbar::-webkit-scrollbar{display:none}
.dock-tab{display:flex;align-items:center;gap:6px;padding:8px 12px 7px;font:600 10.5px/1 var(--font-body,Inter);letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted,#8b9bb4);background:transparent;border:0;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap}
.dock-tab:hover{color:var(--text-secondary,#c7d2e4)}
.dock-tab.active{color:var(--accent-cyan,#22d3ee);border-bottom-color:var(--accent-cyan,#22d3ee);background:rgba(34,211,238,.06)}
.dock-tab svg{width:12px;height:12px}
.dock-tab-content{flex:1;display:flex;min-height:0;min-width:0}
.dock-tab-content>.dock-panel{flex:1}
.dock-panel{display:flex;flex-direction:column;min-width:200px;min-height:72px;background:var(--bg-card,#0c1122);border:1px solid var(--border,#1e2a45);border-radius:8px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,.35)}
.dock-panel-header{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 10px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.12));border-bottom:1px solid var(--border,#1e2a45);cursor:grab;user-select:none;flex:0 0 auto;touch-action:none}
.dock-panel-header:active{cursor:grabbing}
.dock-grip{display:grid;grid-template-columns:repeat(2,2px);gap:2px;opacity:.4;flex:0 0 auto}
.dock-grip i{width:2px;height:2px;border-radius:50%;background:var(--text-muted,#8b9bb4)}
.dock-title{display:flex;align-items:center;gap:7px;font:700 10.5px/1 var(--font-body,Inter);letter-spacing:.12em;text-transform:uppercase;color:var(--text-secondary,#c7d2e4);flex:1;pointer-events:none;white-space:nowrap;overflow:hidden}
.dock-title svg{width:13px;height:13px;color:var(--accent-cyan,#22d3ee);flex:0 0 auto}
.dock-panel-header .dock-actions{display:flex;gap:2px}
.dock-btn{display:grid;place-items:center;width:22px;height:22px;border:0;border-radius:5px;background:transparent;color:var(--text-muted,#8b9bb4);cursor:pointer}
.dock-btn:hover{background:rgba(255,255,255,.07);color:var(--text-primary,#e6edf7)}
.dock-btn svg{width:12px;height:12px}
.dock-panel-body{flex:1;display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden}
.dock-panel.collapsed .dock-panel-body{display:none}
.dock-panel.collapsed{min-height:0}
.dock-float-layer{position:fixed;inset:0;pointer-events:none;z-index:3000}
.dock-float{position:fixed;display:flex;flex-direction:column;min-width:260px;min-height:140px;background:var(--bg-card,#0c1122);border:1px solid rgba(34,211,238,.35);border-radius:10px;box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden;pointer-events:auto}
.dock-float-resize{position:absolute;right:2px;bottom:2px;width:14px;height:14px;cursor:nwse-resize;z-index:5}
.dock-float-resize::after{content:"";position:absolute;right:3px;bottom:3px;width:7px;height:7px;border-right:2px solid var(--text-muted,#8b9bb4);border-bottom:2px solid var(--text-muted,#8b9bb4);border-radius:1px}
.dock-drop-bar{position:fixed;z-index:4000;pointer-events:none;background:rgba(34,211,238,.25);border:2px solid var(--accent-cyan,#22d3ee);border-radius:6px;box-shadow:0 0 18px rgba(34,211,238,.35);display:none}
.dock-drop-tab{position:fixed;z-index:4000;pointer-events:none;background:rgba(34,211,238,.12);border:2px dashed var(--accent-cyan,#22d3ee);border-radius:8px;display:none}
.dock-drag-ghost{position:fixed;z-index:5000;pointer-events:none;display:flex;align-items:center;gap:7px;padding:6px 12px;background:rgba(10,14,26,.92);border:1px solid rgba(34,211,238,.5);border-radius:7px;font:700 10.5px/1 var(--font-body,Inter);letter-spacing:.1em;text-transform:uppercase;color:var(--accent-cyan,#22d3ee);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.dock-context-menu{position:fixed;z-index:6000;min-width:180px;background:var(--bg-elevated,#111832);border:1px solid var(--border,#1e2a45);border-radius:8px;padding:5px;box-shadow:0 14px 40px rgba(0,0,0,.55)}
.dock-context-menu button{display:flex;align-items:center;gap:9px;width:100%;padding:7px 10px;border:0;border-radius:5px;background:transparent;color:var(--text-secondary,#c7d2e4);font:500 12px var(--font-body,Inter);cursor:pointer;text-align:left}
.dock-context-menu button:hover{background:rgba(34,211,238,.1);color:var(--text-primary,#e6edf7)}
.dock-context-menu button.danger{color:#f87171}
.dock-context-menu button.danger:hover{background:rgba(239,68,68,.12)}
.dock-context-menu svg{width:13px;height:13px;opacity:.75}
@media (max-width: 900px){
  .dock-root{display:flex !important;flex-direction:column;overflow:visible}
  .dock-split{display:flex !important;flex-direction:column !important}
  .dock-split>div{display:flex !important}
  .dock-sizer{display:none !important}
  .dock-float-layer{display:none !important}
  .dock-panel{min-height:0}
}
`;
      document.head.appendChild(style);
    }
    this.floatLayer = document.createElement("div");
    this.floatLayer.className = "dock-float-layer";
    this.dropBar = document.createElement("div");
    this.dropBar.className = "dock-drop-bar";
    this.dropTab = document.createElement("div");
    this.dropTab.className = "dock-drop-tab";
    document.body.append(this.floatLayer, this.dropBar, this.dropTab);
  }

  // ── rendering ──────────────────────────────────────────────────────────
  render() {
    if (!this.tree) this.tree = this._defaultTree();
    this.root.classList.add("dock-root");
    this.root.innerHTML = "";
    this.floatLayer.innerHTML = "";
    if (this.maximized) {
      this.root.appendChild(this._renderPanel(this.maximized));
    } else {
      this.root.appendChild(this._renderNode(this.tree));
    }
    this.floats.forEach((geo, id) => this._renderFloat(id, geo));
    if (typeof lucide !== "undefined") lucide.createIcons();
    this.save();
    this.root.dispatchEvent(
      new CustomEvent("docklayout", { bubbles: true, detail: { dock: this } }),
    );
  }

  _renderNode(node) {
    if (node.type === "panel") return this._renderPanel(node.panel);
    if (node.type === "tabs") return this._renderTabs(node);
    return this._renderSplit(node);
  }

  _renderSplit(node) {
    const el = document.createElement("div");
    el.className = `dock-split ${node.dir}`;
    node.children.forEach((child, i) => {
      const wrap = document.createElement("div");
      wrap.style.flex = `${node.sizes[i] ?? 100 / node.children.length} 1 0`;
      wrap.appendChild(this._renderNode(child));
      el.appendChild(wrap);
      if (i < node.children.length - 1)
        el.appendChild(this._renderSizer(node, i, el));
    });
    return el;
  }

  _renderSizer(node, index, splitEl) {
    const sizer = document.createElement("div");
    sizer.className = `dock-sizer ${node.dir === "h" ? "h" : "v"}`;
    sizer.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      sizer.setPointerCapture(e.pointerId);
      sizer.classList.add("active");
      const wraps = [...splitEl.children].filter(
        (c) => !c.classList.contains("dock-sizer"),
      );
      const before = wraps[index].getBoundingClientRect();
      const after = wraps[index + 1].getBoundingClientRect();
      const total =
        node.dir === "h"
          ? before.width + after.width
          : before.height + after.height;
      const startPos = node.dir === "h" ? e.clientX : e.clientY;
      const startBefore = node.dir === "h" ? before.width : before.height;
      const move = (ev) => {
        const delta = (node.dir === "h" ? ev.clientX : ev.clientY) - startPos;
        const pct = ((startBefore + delta) / total) * 100;
        const clamped = Math.min(
          100 - this.opts.minSplitPct,
          Math.max(this.opts.minSplitPct, pct),
        );
        node.sizes[index] = clamped;
        node.sizes[index + 1] = 100 - clamped;
        wraps[index].style.flex = `${clamped} 1 0`;
        wraps[index + 1].style.flex = `${100 - clamped} 1 0`;
        this.root.dispatchEvent(
          new CustomEvent("docklayout", { bubbles: true }),
        );
      };
      const up = () => {
        sizer.removeEventListener("pointermove", move);
        sizer.removeEventListener("pointerup", up);
        sizer.classList.remove("active");
        // renormalize so all children sum to 100
        const total = node.sizes.reduce((a, b) => a + b, 0) || 100;
        node.sizes = node.sizes.map((s) => (s / total) * 100);
        [...splitEl.children]
          .filter((c) => !c.classList.contains("dock-sizer"))
          .forEach((w, i) => (w.style.flex = `${node.sizes[i]} 1 0`));
        this.save();
      };
      sizer.addEventListener("pointermove", move);
      sizer.addEventListener("pointerup", up);
    });
    return sizer;
  }

  _renderTabs(node) {
    const el = document.createElement("div");
    el.className = "dock-tabs";
    const bar = document.createElement("div");
    bar.className = "dock-tabbar";
    const content = document.createElement("div");
    content.className = "dock-tab-content";
    if (!node.panels.includes(node.active)) node.active = node.panels[0];
    node.panels.forEach((id) => {
      const meta = this.panels[id];
      const tab = document.createElement("button");
      tab.className = "dock-tab" + (node.active === id ? " active" : "");
      tab.innerHTML = `${meta.icon ? `<i data-lucide="${meta.icon}"></i>` : ""}<span>${meta.title}</span>`;
      tab.addEventListener("click", () => {
        node.active = id;
        this.render();
      });
      bar.appendChild(tab);
    });
    content.appendChild(this._renderPanel(node.active, node));
    el.append(bar, content);
    return el;
  }

  _renderPanel(id) {
    const meta = this.panels[id];
    const el = meta.el;
    el.classList.add("dock-panel");
    el.dataset.panel = id;
    if (this.collapsed.has(id)) el.classList.add("collapsed");

    if (!el.querySelector(".dock-panel-header")) {
      const header = document.createElement("div");
      header.className = "dock-panel-header";
      header.innerHTML = `
        <span class="dock-grip" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span class="dock-title">${meta.icon ? `<i data-lucide="${meta.icon}"></i>` : ""}${meta.title}</span>
        <span class="dock-actions"></span>`;
      el.prepend(header);
      header.addEventListener("dblclick", (e) => {
        if (e.target.closest(".dock-btn")) return;
        this.toggleMaximize(id);
      });
      header.addEventListener("pointerdown", (e) =>
        this._headerPointerDown(e, id),
      );
      header.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._contextMenu(e, id);
      });
    }
    // header action buttons are rebuilt each render (state-dependent)
    const actions = el.querySelector(".dock-actions");
    actions.innerHTML = "";
    const btn = (action, icon, title) => {
      const b = document.createElement("button");
      b.className = "dock-btn";
      b.dataset.action = action;
      b.title = title;
      b.innerHTML = `<i data-lucide="${icon}"></i>`;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        if (action === "collapse") this.toggleCollapse(id);
        if (action === "maximize") this.toggleMaximize(id);
        if (action === "restore") this.toggleMaximize(id);
        if (action === "float") this.floatPanel(id);
        if (action === "dockback") this.dockFloat(id);
      });
      actions.appendChild(b);
    };
    if (this.maximized === id) {
      btn("restore", "minimize-2", "Restore layout");
    } else if (!this.floats.has(id)) {
      btn(
        "collapse",
        this.collapsed.has(id) ? "chevron-down" : "chevron-up",
        this.collapsed.has(id) ? "Expand panel" : "Collapse panel",
      );
      btn("maximize", "maximize-2", "Maximize (or double-click header)");
      btn("float", "picture-in-picture-2", "Float panel");
    } else {
      btn("dockback", "pin", "Dock panel back");
    }

    // body wrapper: park all non-header children in a body div (once)
    if (!el.querySelector(".dock-panel-body")) {
      const body = document.createElement("div");
      body.className = "dock-panel-body";
      [...el.children].forEach((child) => {
        if (!child.classList.contains("dock-panel-header"))
          body.appendChild(child);
      });
      el.appendChild(body);
    }
    return el;
  }

  // ── panel state actions ────────────────────────────────────────────────
  toggleCollapse(id) {
    if (this.collapsed.has(id)) this.collapsed.delete(id);
    else this.collapsed.add(id);
    this.panels[id].el.classList.toggle("collapsed", this.collapsed.has(id));
    this.save();
    this.root.dispatchEvent(new CustomEvent("docklayout", { bubbles: true }));
  }

  toggleMaximize(id) {
    if (this.floats.has(id)) return;
    if (this.maximized === id) {
      this.maximized = null;
    } else {
      this.maximized = id;
    }
    this.render();
  }

  floatPanel(id, geo) {
    this._removePanel(id);
    if (!this.tree) this.tree = this._defaultTree();
    this.maximized = null;
    this.collapsed.delete(id);
    this.floats.set(id, geo || this._defaultFloatGeo(id));
    this.render();
  }

  dockFloat(id) {
    this.floats.delete(id);
    const tabs = this._findTabs(this.tree);
    if (tabs) {
      tabs.panels.push(id);
      tabs.active = id;
    } else if (this.tree.type === "split") {
      this.tree.children.push({ type: "panel", panel: id });
      this.tree.sizes.push(this.opts.minSplitPct);
      const total = this.tree.sizes.reduce((a, b) => a + b, 0);
      this.tree.sizes = this.tree.sizes.map((s) => (s / total) * 100);
    } else {
      this.tree = {
        type: "split",
        dir: "h",
        sizes: [50, 50],
        children: [this.tree, { type: "panel", panel: id }],
      };
    }
    this.render();
  }

  _defaultFloatGeo(id) {
    const r = this.root.getBoundingClientRect();
    const n = this.floats.size;
    return {
      x: Math.round(r.left + 60 + n * 32),
      y: Math.round(r.top + 60 + n * 28),
      w: Math.min(480, Math.round(r.width * 0.42)),
      h: Math.min(400, Math.round(r.height * 0.6)),
    };
  }

  _findTabs(node) {
    if (!node) return null;
    if (node.type === "tabs") return node;
    if (node.type === "split")
      for (const c of node.children) {
        const f = this._findTabs(c);
        if (f) return f;
      }
    return null;
  }

  // ── header drag → re-dock / float ──────────────────────────────────────
  _headerPointerDown(e, id) {
    if (e.button !== 0) return;
    if (e.target.closest(".dock-btn")) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    const header = e.currentTarget;
    const ghost = document.createElement("div");
    ghost.className = "dock-drag-ghost";
    ghost.textContent = this.panels[id].title;

    const move = (ev) => {
      if (!active) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return;
        active = true;
        document.body.append(ghost);
        header.style.opacity = "0.35";
      }
      ghost.style.left = ev.clientX + 12 + "px";
      ghost.style.top = ev.clientY + 10 + "px";
      this._showDropZone(ev, id);
    };

    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      header.style.opacity = "";
      ghost.remove();
      this._hideDropZones();
      if (!active) return;
      const zone = this._hitTestDrop(ev, id);
      if (!zone) return;
      this.floats.delete(id);
      if (zone.kind === "float") {
        this.floatPanel(id, {
          x: Math.round(ev.clientX - 100),
          y: Math.round(ev.clientY - 12),
          w: 480,
          h: 360,
        });
      } else if (zone.kind === "tab") {
        this._removePanel(id);
        if (!this.tree) this.tree = this._defaultTree();
        this._insertPanel(id, zone.targetId, "tab");
        this.render();
      } else {
        this._removePanel(id);
        if (!this.tree) this.tree = this._defaultTree();
        this._insertPanel(id, zone.targetId, zone.side);
        this.render();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  _hitTestDrop(ev, dragId) {
    const dockRect = this.root.getBoundingClientRect();
    const insideDock =
      ev.clientX >= dockRect.left &&
      ev.clientX <= dockRect.right &&
      ev.clientY >= dockRect.top &&
      ev.clientY <= dockRect.bottom;
    if (!insideDock) return { kind: "float" };

    // tab bars first (thin targets win over the panel below them)
    for (const tabsEl of this.root.querySelectorAll(".dock-tabs")) {
      const bar = tabsEl.querySelector(".dock-tabbar");
      if (!bar) continue;
      const r = bar.getBoundingClientRect();
      if (
        ev.clientX >= r.left &&
        ev.clientX <= r.right &&
        ev.clientY >= r.top - 3 &&
        ev.clientY <= r.bottom + 3
      ) {
        const activeId = tabsEl.querySelector(".dock-tab-content > .dock-panel")
          ?.dataset?.panel;
        if (activeId && activeId !== dragId)
          return { kind: "tab", targetId: activeId };
      }
    }

    for (const el of this.root.querySelectorAll(".dock-panel")) {
      const id = el.dataset.panel;
      if (id === dragId) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (
        ev.clientX < r.left ||
        ev.clientX > r.right ||
        ev.clientY < r.top ||
        ev.clientY > r.bottom
      )
        continue;
      const rx = (ev.clientX - r.left) / r.width;
      const ry = (ev.clientY - r.top) / r.height;
      const ez = this.opts.edgeZone;
      let side;
      if (rx < ez) side = "left";
      else if (rx > 1 - ez) side = "right";
      else if (ry < ez) side = "top";
      else if (ry > 1 - ez) side = "bottom";
      if (side) return { kind: "split", side, targetId: id, targetEl: el };
      return { kind: "tab", targetId: id };
    }
    return null;
  }

  _showDropZone(ev, dragId) {
    const zone = this._hitTestDrop(ev, dragId);
    if (!zone) return this._hideDropZones();
    if (zone.kind === "float") return this._hideDropZones();
    if (zone.kind === "tab") {
      const el = this.root.querySelector(
        `.dock-panel[data-panel="${zone.targetId}"]`,
      );
      if (!el) return this._hideDropZones();
      const t = el.getBoundingClientRect();
      Object.assign(this.dropTab.style, {
        display: "block",
        left: t.left + 4 + "px",
        top: t.top + 4 + "px",
        width: t.width - 8 + "px",
        height: t.height - 8 + "px",
      });
      this.dropBar.style.display = "none";
      return;
    }
    const r = zone.targetEl.getBoundingClientRect();
    const thick = Math.max(
      14,
      (zone.side === "left" || zone.side === "right" ? r.width : r.height) *
        this.opts.edgeZone,
    );
    const s = this.dropBar.style;
    s.display = "block";
    if (zone.side === "left")
      Object.assign(s, {
        left: r.left + 2 + "px",
        top: r.top + 2 + "px",
        width: thick + "px",
        height: r.height - 4 + "px",
      });
    if (zone.side === "right")
      Object.assign(s, {
        left: r.right - 2 - thick + "px",
        top: r.top + 2 + "px",
        width: thick + "px",
        height: r.height - 4 + "px",
      });
    if (zone.side === "top")
      Object.assign(s, {
        left: r.left + 2 + "px",
        top: r.top + 2 + "px",
        width: r.width - 4 + "px",
        height: thick + "px",
      });
    if (zone.side === "bottom")
      Object.assign(s, {
        left: r.left + 2 + "px",
        top: r.bottom - 2 - thick + "px",
        width: r.width - 4 + "px",
        height: thick + "px",
      });
    this.dropTab.style.display = "none";
  }

  _hideDropZones() {
    this.dropBar.style.display = "none";
    this.dropTab.style.display = "none";
  }

  // ── floating windows ───────────────────────────────────────────────────
  _renderFloat(id, geo) {
    const panel = this._renderPanel(id);
    const win = document.createElement("div");
    win.className = "dock-float";
    win.style.left = geo.x + "px";
    win.style.top = geo.y + "px";
    win.style.width = geo.w + "px";
    win.style.height = geo.h + "px";
    win.style.zIndex = ++this._zTop;
    win.appendChild(panel);
    const rz = document.createElement("div");
    rz.className = "dock-float-resize";
    win.appendChild(rz);

    const header = panel.querySelector(".dock-panel-header");
    header.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".dock-btn")) return;
      win.style.zIndex = ++this._zTop;
      const sx = e.clientX - geo.x;
      const sy = e.clientY - geo.y;
      const move = (ev) => {
        geo.x = ev.clientX - sx;
        geo.y = Math.max(0, ev.clientY - sy);
        win.style.left = geo.x + "px";
        win.style.top = geo.y + "px";
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        this.save();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    rz.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      rz.setPointerCapture(e.pointerId);
      const sw = e.clientX - geo.w;
      const sh = e.clientY - geo.h;
      const move = (ev) => {
        geo.w = Math.max(260, ev.clientX - sw);
        geo.h = Math.max(140, ev.clientY - sh);
        win.style.width = geo.w + "px";
        win.style.height = geo.h + "px";
        this.root.dispatchEvent(
          new CustomEvent("docklayout", { bubbles: true }),
        );
      };
      const up = () => {
        rz.removeEventListener("pointermove", move);
        rz.removeEventListener("pointerup", up);
        this.save();
      };
      rz.addEventListener("pointermove", move);
      rz.addEventListener("pointerup", up);
    });
    this.floatLayer.appendChild(win);
  }

  // ── context menu ───────────────────────────────────────────────────────
  _contextMenu(e, id) {
    this._closeContextMenu();
    const menu = document.createElement("div");
    menu.className = "dock-context-menu";
    const items = this.floats.has(id)
      ? [
          ["pin", "Dock panel back", () => this.dockFloat(id)],
          [
            "rotate-ccw",
            "Reset whole layout",
            () => this.resetLayout(),
            "danger",
          ],
        ]
      : [
          [
            "maximize-2",
            this.maximized === id ? "Restore panel" : "Maximize panel",
            () => this.toggleMaximize(id),
          ],
          ["picture-in-picture-2", "Float panel", () => this.floatPanel(id)],
          [
            this.collapsed.has(id) ? "chevron-down" : "chevron-up",
            this.collapsed.has(id) ? "Expand panel" : "Collapse panel",
            () => this.toggleCollapse(id),
          ],
          [
            "rotate-ccw",
            "Reset whole layout",
            () => this.resetLayout(),
            "danger",
          ],
        ];
    items.forEach(([icon, label, fn, cls]) => {
      const b = document.createElement("button");
      if (cls) b.className = cls;
      b.textContent = label;
      b.innerHTML = `<i data-lucide="${icon}"></i>${label}`;
      b.addEventListener("click", () => {
        this._closeContextMenu();
        fn();
      });
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.min(e.clientX, innerWidth - r.width - 8) + "px";
    menu.style.top = Math.min(e.clientY, innerHeight - r.height - 8) + "px";
    if (typeof lucide !== "undefined") lucide.createIcons();
    this._menu = menu;
    setTimeout(() => {
      window.addEventListener("pointerdown", this._closeContextMenu, {
        once: true,
      });
    }, 0);
  }

  _closeContextMenu = () => {
    this._menu?.remove();
    this._menu = null;
  };

  _enableResponsive() {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => this.root.classList.toggle("dock-mobile", mq.matches);
    mq.addEventListener("change", apply);
    apply();
  }
}

window.StudioDock = StudioDock;
export {};
