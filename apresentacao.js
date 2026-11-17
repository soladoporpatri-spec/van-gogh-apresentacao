/* =========================================================
   Modo apresentação — o site inteiro em slides de tela cheia.
   Avançar: → · PageDown · Espaço · estrela amarela · deslizar para a esquerda
   Voltar:  ← · PageUp · Shift+Espaço · girassol · deslizar para a direita
   Tela cheia: F ou botão do canto superior direito
   ========================================================= */
(() => {
  "use strict";

  const html = document.documentElement;
  if (!html.classList.contains("pz-on")) return;

  const slides = [...document.querySelectorAll(".slide[data-slide]")];
  if (!slides.length) { html.classList.remove("pz-on"); return; }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const N = slides.length;
  let cur = -1;
  let loading = !!document.getElementById("pz-loader");

  /* ---------- interface ---------- */
  const ui = document.createElement("div");
  ui.className = "pz-ui";
  ui.innerHTML = `
    <button type="button" class="pz-fs" title="Tela cheia (F)">Tela cheia</button>
    <button type="button" class="pz-back" title="Voltar (←)">Voltar</button>
    <span class="pz-count" aria-hidden="true"></span>
    <button type="button" class="pz-next" title="Avançar (→)">Avançar</button>
    <p class="sr-only" aria-live="polite"></p>`;
  document.body.appendChild(ui);

  const btnFs = ui.querySelector(".pz-fs");
  const btnBack = ui.querySelector(".pz-back");
  const btnNext = ui.querySelector(".pz-next");
  const count = ui.querySelector(".pz-count");
  const live = ui.querySelector(".sr-only");

  /* acessibilidade: cada slide é um grupo nomeado pelo seu título (leitores de tela) */
  slides.forEach((s, i) => {
    const h = s.querySelector("h1,h2");
    s.setAttribute("role", "group");
    s.setAttribute("aria-roledescription", "slide");
    s.setAttribute("aria-label", `${i + 1} de ${N}${h ? ": " + h.textContent.trim() : ""}`);
    s.tabIndex = -1;
    s.inert = true;
  });

  /* ---------- navegação ---------- */
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return 0;
    if (/^\d+$/.test(h)) return Math.max(0, Math.min(N - 1, parseInt(h, 10) - 1));
    const i = slides.findIndex(s => s.id === h);
    return i < 0 ? 0 : i;
  }

  function show(i, { silent = false } = {}) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === cur) return;
    const dir = i > cur ? 1 : -1;
    html.style.setProperty("--pz-x", `${dir * 4}%`);

    const prev = cur >= 0 ? slides[cur] : null;
    const next = slides[i];

    slides.forEach(s => {
      if (s !== next && s !== prev) { s.classList.remove("is-active", "is-leaving"); s.inert = true; }
    });

    if (prev) {
      prev.classList.remove("is-active");
      prev.inert = true;
      clearTimeout(prev._t);
      if (reduce.matches) prev.classList.remove("is-leaving");
      else {
        prev.classList.add("is-leaving");
        prev._t = setTimeout(() => prev.classList.remove("is-leaving"), 460);
      }
    }

    clearTimeout(next._t);
    next.classList.remove("is-leaving");
    next.classList.add("is-active");
    next.inert = false;
    next.scrollTop = 0;
    cur = i;

    count.textContent = `${i + 1} / ${N}`;
    btnBack.disabled = i === 0;
    btnNext.disabled = i === N - 1;
    live.textContent = `Slide ${i + 1} de ${N}`;
    if (!silent) history.replaceState(null, "", `#${i + 1}`);
    next.focus({ preventScroll: true });
  }

  const next = () => show(cur + 1);
  const prev = () => show(cur - 1);

  btnNext.addEventListener("click", next);
  btnBack.addEventListener("click", prev);
  window.addEventListener("hashchange", () => show(fromHash(), { silent: true }));

  /* ---------- teclado ---------- */
  document.addEventListener("keydown", e => {
    /* as exposições interativas consomem as setas enquanto há obras a percorrer; nos limites, a tecla chega aqui */
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (loading) return;
    const t = e.target;
    if (t.closest && t.closest("input,textarea,select,[contenteditable]")) return;
    const onControl = !!(t.closest && t.closest("button,a"));

    switch (e.key) {
      case "ArrowRight": case "PageDown": e.preventDefault(); next(); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); prev(); break;
      case " ":
        if (!onControl) { e.preventDefault(); e.shiftKey ? prev() : next(); }
        break;
      case "Home": e.preventDefault(); show(0); break;
      case "End": e.preventDefault(); show(N - 1); break;
      case "f": case "F": toggleFullscreen(); break;
    }
  });

  /* ---------- toque: deslizar ---------- */
  let sx = null, sy = 0, sEl = null;
  window.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; sEl = e.target;
  }, { passive: true });
  window.addEventListener("touchend", e => {
    if (sx === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    const inScroller = sEl && sEl.closest && sEl.closest(".fx-tabs");
    sx = null;
    if (inScroller) return;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) (dx < 0 ? next : prev)();
  }, { passive: true });

  /* ---------- tela cheia ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else html.requestFullscreen().catch(() => {});
  }
  if (!document.fullscreenEnabled) btnFs.hidden = true;
  btnFs.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    const on = !!document.fullscreenElement;
    btnFs.textContent = on ? "Sair da tela cheia" : "Tela cheia";
    btnFs.title = on ? "Sair da tela cheia (F)" : "Tela cheia (F)";
  });

  /* ---------- controles discretos quando o mouse fica parado ---------- */
  let idle;
  const wake = () => {
    ui.classList.remove("is-idle");
    clearTimeout(idle);
    idle = setTimeout(() => ui.classList.add("is-idle"), 3200);
  };
  ["mousemove", "pointerdown", "keydown", "touchstart"].forEach(ev => window.addEventListener(ev, wake, { passive: true }));
  wake();

  /* ---------- índices para escalonar as animações de entrada ---------- */
  slides.forEach(s => {
    s.querySelectorAll(".card").forEach((c, i) => {
      c.style.setProperty("--i", i);
      c.querySelectorAll("li").forEach((li, j) => li.style.setProperty("--j", j));
    });
  });
  const h1 = document.querySelector(".hero h1");
  if (h1) {
    h1.setAttribute("aria-label", h1.textContent.trim());
    h1.innerHTML = h1.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w" aria-hidden="true" style="--wi:${i}"><span>${w}</span></span>`).join(" ");
  }

  /* ---------- imagens dos slides: clique para ampliar em tela cheia ---------- */
  const HI = {
    "img/autorretrato-1889.jpg": "img/autorretratos/orsay-l.jpg",
    "img/autorretrato-1887.jpg": "img/autorretratos/feltro-l.jpg"
  };
  document.querySelectorAll(".slide figure img, .slide .ref img").forEach(img => {
    if (!window.PZLightbox) return;
    const raw = img.getAttribute("src");
    const cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
    const zoom = () => window.PZLightbox.open({
      src: HI[raw] || raw, thumb: raw, alt: img.alt,
      title: cap ? cap.textContent.trim() : (img.alt || ""), sub: ""
    });
    img.classList.add("is-zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.title = "Clique para ampliar";
    img.addEventListener("click", zoom);
    img.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); zoom(); }
    });
  });

  /* ---------- carregamento de abertura ---------- */
  function runLoader() {
    const loader = document.getElementById("pz-loader");
    if (!loader) { loading = false; html.classList.add("pz-ready"); return; }
    const bar = loader.querySelector(".pz-l-bar i");
    const pct = loader.querySelector(".pz-l-pct");
    const title = loader.querySelector(".pz-l-title");
    title.innerHTML = [...title.textContent].map((ch, i) =>
      ch === " " ? " " : `<span class="c" style="--ci:${i}">${ch}</span>`).join("");

    const quick = reduce.matches;
    const waitImg = img => img.complete ? Promise.resolve() :
      new Promise(r => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); });
    const jobs = [
      (document.fonts && document.fonts.ready) || Promise.resolve(),
      ...[...slides[cur].querySelectorAll("img")].map(waitImg)
    ];
    let done = 0;
    jobs.forEach(j => Promise.resolve(j).catch(() => {}).then(() => { done++; }));

    const MIN = quick ? 0 : 1700, MAX = 5200, t0 = performance.now();
    let p = 0;
    const timer = setInterval(() => {
      const el = performance.now() - t0;
      const target = el > MAX ? 1 : Math.min(done / jobs.length, Math.min(1, el / MIN));
      p = Math.min(1, p + (target - p) * 0.14 + (target > p ? 0.003 : 0));
      bar.style.transform = `scaleX(${p})`;
      pct.textContent = `${Math.round(p * 100)}%`;
      if (p >= 0.995) { clearInterval(timer); finish(); }
    }, 30);

    function finish() {
      bar.style.transform = "scaleX(1)"; pct.textContent = "100%";
      loader.classList.add("is-done");
      loading = false;
      setTimeout(() => html.classList.add("pz-ready"), quick ? 0 : 420);
      setTimeout(() => loader.remove(), quick ? 60 : 1500);
    }
  }

  show(fromHash(), { silent: true });
  runLoader();
})();
