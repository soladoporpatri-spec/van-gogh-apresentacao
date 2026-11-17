/* =========================================================
   Exposições interativas — Van Gogh
   1) As Três Fases Artísticas   (#fases-root)
   2) Galeria de Autorretratos    (#autorretratos-root)
   JS puro, sem dependências. Transições por FLIP (Web Animations API).
   ========================================================= */
(() => {
  "use strict";

  const COMMONS = "https://commons.wikimedia.org/wiki/File:";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const EASE = "cubic-bezier(.22,.7,.18,1)";

  /* ======================= TELA CHEIA DA OBRA ======================= */
  const LB = (() => {
    let el = null, lastFocus = null;

    function onKey(e) {
      if (!el) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === "Tab") { e.preventDefault(); el.querySelector(".lb-x").focus(); }
      e.stopPropagation(); // nada por trás (slides, exposição) reage enquanto a obra está ampliada
    }

    function close() {
      if (!el) return;
      const node = el;
      el = null;
      document.removeEventListener("keydown", onKey, true);
      document.documentElement.classList.remove("lb-open");
      if (reduce.matches) node.remove();
      else { node.classList.add("is-out"); setTimeout(() => node.remove(), 280); }
      if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function open({ src, thumb, alt = "", title = "", sub = "" }) {
      if (el) return;
      lastFocus = document.activeElement;
      el = document.createElement("div");
      el.className = "lb";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-label", title || alt || "Obra ampliada");
      el.innerHTML = `
        <button type="button" class="x-btn lb-x" aria-label="Fechar"></button>
        <div class="lb-fig">
          <img class="lb-img" alt="">
          <p class="lb-cap"></p>
        </div>`;
      const img = el.querySelector(".lb-img");
      const cap = el.querySelector(".lb-cap");
      img.alt = alt;
      if (title || sub) {
        cap.innerHTML = `${title ? "<b></b>" : ""}${sub ? "<span></span>" : ""}`;
        if (title) cap.querySelector("b").textContent = title;
        if (sub) cap.querySelector("span").textContent = sub;
      } else cap.remove();

      img.addEventListener("load", () => el && el.classList.add("is-loaded"));
      img.addEventListener("error", () => {
        if (!el) return;
        el.classList.add("is-failed");
        if (!el.querySelector(".lb-fail")) {
          const m = document.createElement("p");
          m.className = "lb-fail";
          m.textContent = "Imagem indisponível";
          el.querySelector(".lb-fig").prepend(m);
        }
      });
      img.src = thumb || src;
      if (thumb && thumb !== src) {
        const big = new Image();
        big.decoding = "async";
        big.onload = () => { if (el && img.isConnected) img.src = big.src; };
        big.src = src;
      }

      el.addEventListener("click", e => {
        if (e.target.closest(".lb-x")) { close(); return; }
        if (!e.target.closest(".lb-img, .lb-cap")) close();
      });
      document.body.appendChild(el);
      document.documentElement.classList.add("lb-open");
      document.addEventListener("keydown", onKey, true);
      el.querySelector(".lb-x").focus({ preventScroll: true });
    }
    return { open, close };
  })();
  window.PZLightbox = LB;

  /* ======================= MOTOR ======================= */
  function createExhibit(root, cfg) {
    if (!root) return;
    const { groups, works, blocks, dir, hint, single } = cfg;

    const byId = Object.fromEntries(works.map(w => [w.id, w]));
    const byGroup = groups.map((_, i) => works.filter(w => w.phase === i));
    const lastSel = byGroup.map(l => l[0].id);
    const alt = w => `${w.title}, ${w.year}. Pintura de Vincent van Gogh.`;
    const g = i => groups[i];
    const kicker = p => p.kicker || `Fase ${p.num}`;
    const label = p => p.label || `Fase ${p.num} · ${p.name} · ${p.period}`;

    /* ---------- marcação ---------- */
    const artHTML = (w, i) => `
      <button type="button" class="fx-art" data-id="${w.id}" style="--r:${(w.w / w.h).toFixed(4)};--i:${i}" aria-label="${w.title}, ${w.year}">
        <img src="${dir}/${w.slug}-m.jpg" width="${w.w}" height="${w.h}" alt="${alt(w)}" loading="lazy" decoding="async" draggable="false">
        <span class="fx-ph" aria-hidden="true">${w.title}</span>
        <span class="fx-idx" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <span class="fx-lab" aria-hidden="true"><b>${w.title}</b><i>${w.year}</i></span>
      </button>`;

    const groupHTML = (p, i) => `
      <article class="fx-phase" data-p="${i}" style="--acc:${p.accent};--p:${i}" aria-label="${p.aria || kicker(p) + ": " + p.name}">
        <header class="fx-head">
          <span class="fx-num">${kicker(p)}</span>
          <h3>${p.name}</h3>
          <span class="tag">${p.period}</span>
          <p class="fx-tagline">${p.tagline}</p>
          <p class="fx-desc">${p.desc}</p>
          <ul class="fx-dots" aria-hidden="true">${p.dots.map(c => `<li style="background:${c}"></li>`).join("")}</ul>
          <button type="button" class="fx-open" data-open="${i}">${p.openLabel || "Explorar esta fase"} <span aria-hidden="true">→</span></button>
        </header>
        <div class="fx-wall">${byGroup[i].map(artHTML).join("")}</div>
      </article>`;

    root.innerHTML = `
      <div class="fx" data-mode="overview"${single ? " data-single" : ""}${works.length > 6 ? " data-many" : ""}>
        <div class="fx-bar">
          <p class="fx-hint">${hint}</p>
          <div class="fx-tabs" role="group" aria-label="Navegação da exposição">
            <button type="button" class="fx-tab" data-tab="overview" aria-pressed="true">Visão geral</button>
            ${groups.map((p, i) => `<button type="button" class="fx-tab" data-tab="${i}" aria-pressed="false">${p.tab || p.num + " · " + p.name} <small>${p.period}</small></button>`).join("")}
          </div>
        </div>
        <div class="fx-stage">
          ${groups.map(groupHTML).join("")}
          <button type="button" class="x-btn fx-x" data-act="overview" aria-label="Fechar e voltar à visão geral" title="Fechar (Esc)"></button>
          <div class="fx-info" role="region" aria-label="Informações da obra selecionada" hidden></div>
        </div>
        <p class="sr-only" aria-live="polite"></p>
      </div>`;

    /* ---------- referências ---------- */
    const fx = root.querySelector(".fx");
    const info = root.querySelector(".fx-info");
    const status = root.querySelector(".sr-only");
    const phases = [...root.querySelectorAll(".fx-phase")];
    const tabs = [...root.querySelectorAll(".fx-tab")];
    const arts = new Map([...root.querySelectorAll(".fx-art")].map(b => [b.dataset.id, b]));

    /* carregamento e falha das imagens */
    arts.forEach(b => {
      const img = b.querySelector("img");
      const ok = () => { b.classList.remove("is-failed"); b.classList.add("is-loaded"); };
      const fail = () => { if (!img.dataset.big) { b.classList.remove("is-loaded"); b.classList.add("is-failed"); } };
      img.addEventListener("load", ok);
      img.addEventListener("error", fail);
      if (img.complete) (img.naturalWidth ? ok() : fail());
    });

    /* troca a miniatura pela versão grande quando a obra é selecionada */
    function upgrade(id) {
      const img = arts.get(id).querySelector("img");
      if (img.dataset.big) return;
      img.dataset.big = "1";
      const big = new Image();
      big.decoding = "async";
      big.onload = () => { img.src = big.src; };
      big.onerror = () => { delete img.dataset.big; };
      big.src = `${dir}/${byId[id].slug}-l.jpg`;
    }

    /* ---------- painel de informações ---------- */
    function infoHTML(w) {
      const p = g(w.phase);
      const list = byGroup[w.phase];
      const n = list.findIndex(x => x.id === w.id) + 1;
      const src = w.link
        ? `<a href="${w.link[1]}" target="_blank" rel="noopener">${w.link[0]}</a>`
        : `<a href="${COMMONS}${encodeURIComponent(w.file.replace(/ /g, "_"))}" target="_blank" rel="noopener">Ver o arquivo no Wikimedia Commons</a>`;
      const meta = [["Título original", w.orig], ["Data", w.date], ["Acervo", w.place]]
        .filter(m => m[1]).map(m => `<div><dt>${m[0]}</dt><dd>${m[1]}</dd></div>`).join("");
      return `
        <p class="fx-eyebrow">${label(p)}</p>
        <h3 class="fx-title">${w.title}</h3>
        <p class="fx-by">Vincent van Gogh — ${w.year}</p>
        <dl class="fx-meta">${meta}</dl>
        ${blocks.map(([h, k]) => w[k] ? `<div class="fx-block"><h4>${h}</h4><p>${w[k]}</p></div>` : "").join("")}
        <p class="fx-credit">Obra em domínio público. Acervo: ${w.place}. ${src}.</p>
        <div class="fx-nav">
          <button type="button" data-act="prev" ${n === 1 ? "disabled" : ""}><span aria-hidden="true">←</span> Anterior</button>
          <span class="fx-count">${n} / ${list.length}</span>
          <button type="button" data-act="next" ${n === list.length ? "disabled" : ""}>Próxima <span aria-hidden="true">→</span></button>
          <button type="button" data-act="overview" class="fx-back">Visão geral</button>
        </div>`;
    }

    /* ---------- estado ---------- */
    let shown = { mode: "overview", phase: null, sel: null }; // o que o DOM exibe
    let target = shown;                                         // último estado pedido
    let token = 0;
    let running = [];
    const same = (a, b) => a.mode === b.mode && a.phase === b.phase && a.sel === b.sel;

    function apply(s) {
      fx.dataset.mode = s.mode;
      phases.forEach((ph, i) => ph.classList.toggle("is-active", s.mode === "phase" && s.phase === i));
      const tabKey = s.mode === "overview" ? "overview" : String(s.phase);
      tabs.forEach(t => t.setAttribute("aria-pressed", String(t.dataset.tab === tabKey)));

      works.forEach(w => {
        const b = arts.get(w.id);
        b.classList.remove("is-sel", "before", "after");
        b.style.removeProperty("--d");
        b.removeAttribute("aria-current");
        b.removeAttribute("title");
        b.setAttribute("aria-label", s.mode === "overview" ? `Abrir ${w.title}, ${w.year}` : `${w.title}, ${w.year}`);
      });

      if (s.mode === "phase") {
        const list = byGroup[s.phase];
        const si = list.findIndex(w => w.id === s.sel);
        list.forEach((w, i) => {
          const b = arts.get(w.id);
          if (i === si) {
            b.classList.add("is-sel");
            b.setAttribute("aria-current", "true");
            b.setAttribute("aria-label", `${w.title}, ${w.year} — obra selecionada. Ativar para ampliar`);
            b.title = "Clique para ampliar";
          } else {
            b.classList.add(i < si ? "before" : "after");
            b.style.setProperty("--d", Math.abs(i - si));
            b.setAttribute("aria-label", `Selecionar ${w.title}, ${w.year}`);
          }
        });
        info.innerHTML = infoHTML(byId[s.sel]);
        info.hidden = false;
        lastSel[s.phase] = s.sel;
        upgrade(s.sel);
        status.textContent = `Obra selecionada: ${byId[s.sel].title}, ${byId[s.sel].year}.`;
      } else {
        info.hidden = true;
        info.innerHTML = "";
        status.textContent = "Visão geral da exposição.";
      }
      shown = { ...s };
    }

    /* ---------- animação ---------- */
    function play(node, frames, opts) {
      const a = node.animate(frames, { fill: "both", ...opts });
      running.push(a);
      // o estado final de toda animação é o estado natural do elemento
      a.finished.then(() => { a.cancel(); running = running.filter(x => x !== a); }).catch(() => {});
      return a;
    }
    /* espera o fim das animações, mas nunca trava: se o navegador pausar os quadros (aba em segundo plano), segue após o tempo-limite */
    const done = (list, ms = 700) => Promise.race([
      Promise.allSettled(list.map(a => a.finished)),
      new Promise(r => setTimeout(r, ms))
    ]);

    function flip(id, first, dur, delay) {
      const b = arts.get(id), f = first.get(id);
      if (!f) return false;
      const l = b.getBoundingClientRect();
      if (!l.width) return false;
      const dx = f.left - l.left, dy = f.top - l.top, s = f.width / l.width;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(s - 1) < 0.01) return true;
      play(b, [
        { transformOrigin: "0 0", transform: `translate(${dx}px,${dy}px) scale(${s})` },
        { transformOrigin: "0 0", transform: "none" }
      ], { duration: dur, delay, easing: EASE });
      return true;
    }

    function enter(node, delay = 0, dur = 640) {
      play(node, [
        { opacity: 0, transform: "translateY(26px) scale(.97)" },
        { opacity: 1, transform: "none" }
      ], { duration: dur, delay, easing: EASE });
    }

    function flipGroup(pi, first, selId) {
      const list = byGroup[pi];
      const si = Math.max(0, list.findIndex(w => w.id === selId));
      list.forEach((w, i) => {
        if (!flip(w.id, first, 820, Math.abs(i - si) * 38)) enter(arts.get(w.id), 120 + i * 60);
      });
    }

    function settleScroll() {
      const slide = fx.closest(".slide");
      if (slide) { slide.scrollTo({ top: 0, behavior: "instant" }); return; }
      const r = fx.getBoundingClientRect();
      if (r.top < 40 || r.top > window.innerHeight * 0.5) {
        window.scrollTo({ top: window.scrollY + r.top - 76, behavior: "instant" });
      }
    }

    async function go(next, opts = {}) {
      if (same(next, target) && same(next, shown)) return;
      target = next;
      const my = ++token;
      const kind =
        shown.mode === "overview" && next.mode === "phase" ? "enter" :
        shown.mode === "phase" && next.mode === "overview" ? "leave" :
        shown.mode === "phase" && next.mode === "phase" ? (shown.phase === next.phase ? "select" : "switch") : "none";

      if (reduce.matches || kind === "none") {
        running.forEach(a => a.cancel()); running = [];
        apply(next);
        if (kind !== "none") settleScroll();
        if (opts.focus && next.sel) arts.get(next.sel).focus({ preventScroll: true });
        return;
      }

      /* mede as posições atuais (com animações em curso) e só então cancela */
      const first = new Map();
      arts.forEach((b, id) => { const r = b.getBoundingClientRect(); if (r.width) first.set(id, r); });
      const prev = { ...shown };
      running.forEach(a => a.cancel()); running = [];

      if (kind === "enter" || kind === "switch") {
        const targets = kind === "enter" ? phases.filter((_, i) => i !== next.phase) : [phases[prev.phase], info];
        const fades = targets.map(n => play(n, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-out" }));
        if (fades.length) await done(fades);
        if (my !== token) return;
        apply(next);
        fades.forEach(a => a.cancel());
        settleScroll();
        if (kind === "enter") flipGroup(next.phase, first, next.sel);
        else byGroup[next.phase].forEach((w, i) => enter(arts.get(w.id), 80 + i * 70));
        enter(phases[next.phase].querySelector(".fx-head"), 60, 560);
        enter(info, 260, 620);
      } else if (kind === "leave") {
        apply(next);
        settleScroll();
        phases.forEach((p, i) => {
          if (i !== prev.phase) play(p, [{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 320, easing: "ease-out" });
        });
        flipGroup(prev.phase, first, prev.sel);
        enter(phases[prev.phase].querySelector(".fx-head"), 80, 560);
      } else { /* select: mesma fase, outra obra */
        const out = play(info, [{ opacity: 1 }, { opacity: 0 }], { duration: 130, easing: "ease-out" });
        await done([out]);
        if (my !== token) return;
        out.cancel();
        apply(next);
        flipGroup(next.phase, first, next.sel);
        play(info, [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "none" }
        ], { duration: 560, delay: 220, easing: EASE });
      }
      if (opts.focus && next.sel) arts.get(next.sel).focus({ preventScroll: true });
    }

    /* ---------- ações ---------- */
    const openWork = (id, opts) => go({ mode: "phase", phase: byId[id].phase, sel: id }, opts);
    const openGroup = (i, opts) => openWork(lastSel[i], opts);
    const toOverview = opts => go({ mode: "overview", phase: null, sel: null }, opts);
    function step(d, opts) {
      if (target.mode !== "phase") return;
      const list = byGroup[target.phase];
      const i = list.findIndex(w => w.id === target.sel) + d;
      if (i >= 0 && i < list.length) openWork(list[i].id, opts);
    }

    function zoom(id) {
      const w = byId[id];
      LB.open({ src: `${dir}/${w.slug}-l.jpg`, thumb: `${dir}/${w.slug}-m.jpg`, alt: alt(w), title: w.title, sub: `${w.year} · ${w.place}` });
    }

    fx.addEventListener("click", e => {
      const art = e.target.closest(".fx-art");
      if (art) {
        if (art.classList.contains("is-sel") && target.mode === "phase" && target.sel === art.dataset.id) { zoom(art.dataset.id); return; }
        openWork(art.dataset.id);
        return;
      }
      const open = e.target.closest("[data-open]");
      if (open) { openGroup(+open.dataset.open); return; }
      const tab = e.target.closest("[data-tab]");
      if (tab) { tab.dataset.tab === "overview" ? toOverview() : openGroup(+tab.dataset.tab); return; }
      const act = e.target.closest("[data-act]");
      if (act) act.dataset.act === "overview" ? toOverview() : step(act.dataset.act === "next" ? 1 : -1);
    });

    fx.addEventListener("keydown", e => {
      if (target.mode !== "phase" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") { e.preventDefault(); toOverview(); return; }
      if (!e.target.closest(".fx-wall, .fx-info")) return;
      const inWall = !!e.target.closest(".fx-wall");
      const list = byGroup[target.phase];
      /* nos limites da fase, a tecla não é consumida: quem trata é a apresentação (próximo/anterior slide) */
      const idx = list.findIndex(w => w.id === target.sel);
      switch (e.key) {
        case "ArrowDown": case "ArrowRight": if (idx < list.length - 1) { e.preventDefault(); step(1, { focus: inWall }); } break;
        case "ArrowUp": case "ArrowLeft": if (idx > 0) { e.preventDefault(); step(-1, { focus: inWall }); } break;
        case "Home": e.preventDefault(); openWork(list[0].id, { focus: true }); break;
        case "End": e.preventDefault(); openWork(list[list.length - 1].id, { focus: true }); break;
      }
    });

    apply(shown);
  }

  /* ======================= 1) AS TRÊS FASES ======================= */
  const PHASES = [
    {
      num: "I", name: "Holanda", period: "1880–1885",
      tagline: "A origem de sua identidade artística",
      desc: "Entre a decisão de ser artista, em 1880, e a partida de Nuenen, em 1885, Van Gogh aprende desenhando camponeses, tecelões e paisagens rurais. A paleta é terrosa e sombria, e o interesse central é a dignidade de quem trabalha a terra.",
      dots: ["#3b2f22", "#6e5a3a", "#2f4638", "#b88a4a"], accent: "#9a7b4a"
    },
    {
      num: "II", name: "Paris", period: "1886–1888",
      tagline: "A transformação de sua linguagem visual",
      desc: "Em Montmartre, ao lado do irmão Theo, descobre o Impressionismo, o pontilhismo e as estampas japonesas. A paleta clareia, a pincelada se fragmenta e as cores complementares passam a organizar o quadro.",
      dots: ["#6fa3c4", "#e9a05a", "#c85a54", "#e8d18a"], accent: "#5f8fb8"
    },
    {
      num: "III", name: "Sul da França", period: "1888–1890",
      tagline: "A consolidação de seu estilo expressivo",
      desc: "Em Arles, Saint-Rémy e Auvers, cor e pincelada tornam-se linguagem própria: amarelos incandescentes, azuis profundos e contornos vibrantes traduzem emoção, não apenas aparência.",
      dots: ["#f2c230", "#1f3f9a", "#3f7f4a", "#e07a2f"], accent: "#d9a21b"
    }
  ];

  const WORKS = [
    /* ===== FASE I — HOLANDA ===== */
    {
      id: "comedores", phase: 0, slug: "comedores", w: 1400, h: 1068,
      title: "Os Comedores de Batata", orig: "De Aardappeleters", year: "1885",
      place: "Van Gogh Museum, Amsterdã",
      link: ["Ver no acervo do Van Gogh Museum", "https://www.vangoghmuseum.nl/en/collection/s0005V1962"],
      ctx: "A obra representa uma família de camponeses reunida ao redor de uma mesa, compartilhando uma refeição simples de batatas. Van Gogh procurou representar a realidade dos trabalhadores rurais, valorizando suas condições de vida e o trabalho que realizavam. As mesmas mãos que cavam a terra servem, à luz de uma lamparina, o alimento que ela deu.",
      feel: "A pintura transmite uma atmosfera de cansaço, simplicidade e dignidade. Os rostos marcados e a iluminação limitada reforçam a dureza da vida rural, mas também revelam a união familiar.",
      imp: "A obra representa um dos momentos mais importantes da primeira fase de Van Gogh, demonstrando sua preocupação com a representação humana e social. Foi a primeira tela de grande ambição que ele considerou digna de apresentar ao mundo.",
      tech: "Óleo sobre tela, 82 × 114 cm, pintado em Nuenen entre abril e maio de 1885. Paleta de verdes sujos, marrons e ocres; luz concentrada na lamparina, à maneira do claro-escuro holandês; pinceladas ásperas e rostos angulosos, sem idealização."
    },
    {
      id: "igreja", phase: 0, slug: "igreja", w: 1164, h: 1500,
      title: "A Igreja de Nuenen", orig: "Het uitgaan van de Hervormde Kerk te Nuenen (Fiéis saindo da Igreja Reformada)", year: "1884–85",
      place: "Van Gogh Museum, Amsterdã",
      file: "Het uitgaan van de Hervormde Kerk te Nuenen - s0003V1962 - Van Gogh Museum.jpg",
      ctx: "A pequena igreja reformada de Nuenen era o lugar onde o pai de Vincent, o pastor Theodorus, pregava. Van Gogh pintou o edifício em janeiro de 1884 e, no outono de 1885, acrescentou os fiéis que deixam o culto, vestidos de preto sob árvores nuas. A tela une o vínculo familiar e a vida comunitária de um povoado.",
      feel: "Silêncio, frio e recolhimento. O inverno, o céu cinzento e os vultos escuros caminhando em grupo criam uma atmosfera de austeridade religiosa, mas também de pertencimento: é uma comunidade que se dispersa em conjunto.",
      imp: "Registra a relação íntima e conflituosa de Van Gogh com a fé e a família, tema que o acompanharia por toda a vida. A obra também ficou famosa fora da história da arte: foi roubada do Van Gogh Museum em 2002 e recuperada em 2016.",
      tech: "Óleo sobre tela de pequeno formato. Composição vertical dominada pela silhueta triangular da igreja, perspectiva central e paleta de cinzas, verdes acinzentados e marrons, com os fiéis como pequenas manchas escuras."
    },
    {
      id: "biblia", phase: 0, slug: "biblia", w: 1500, h: 1242,
      title: "Natureza-Morta com Bíblia", orig: "Stilleven met bijbel (Still Life with Open Bible, Extinguished Candle and Novel)", year: "1885",
      place: "Van Gogh Museum, Amsterdã",
      file: "Stilleven met bijbel - s0008V1962 - Van Gogh Museum.jpg",
      ctx: "Pintada em outubro de 1885, meses depois da morte do pai, o pastor Theodorus van Gogh, a tela reúne a grande Bíblia da família, aberta no livro de Isaías, e uma vela apagada. Diante dela, um pequeno romance de capa amarela, A Alegria de Viver, de Émile Zola, contrapõe a fé paterna à literatura moderna que Vincent admirava.",
      feel: "Luto, memória e tensão silenciosa. A vela apagada e a penumbra sugerem o fim de uma vida e de uma autoridade, enquanto o livro amarelo surge como um ponto de luz e de desafio.",
      imp: "Uma das telas mais pessoais de Van Gogh: um acerto de contas simbólico com o pai e com a herança religiosa. Está entre as últimas grandes obras de Nuenen, antes de ele partir para Antuérpia, no fim de 1885.",
      tech: "Óleo sobre tela, 65,7 × 78,5 cm. Fundo escuro, volume monumental da Bíblia construído com empastes claros nas páginas e o amarelo do romance como único contraponto vivo aos tons de terra."
    },
    {
      id: "camponesa", phase: 0, slug: "camponesa", w: 1148, h: 1500,
      title: "Cabeça de Camponesa", orig: "Head of a Peasant Woman", year: "1885",
      place: "National Galleries of Scotland, Edimburgo",
      file: "Vincent van Gogh - Head of a Peasant Woman (1885).jpg",
      ctx: "No inverno de 1884–85, Van Gogh pintou dezenas de cabeças de camponeses de Nuenen, como estudos de rosto e de caráter para a composição maior de Os Comedores de Batata. Esta mulher de touca branca e roupa escura pertence a esse conjunto: não é um retrato de salão, mas o registro de uma pessoa do campo.",
      feel: "Gravidade e cansaço sem dramatismo. O olhar direto e a boca fechada transmitem uma dureza silenciosa, a serenidade de quem aprendeu a suportar.",
      imp: "Mostra o método de Van Gogh antes de sua obra-prima holandesa: estudar muitos rostos até compreender a verdade de cada tipo humano. Ele valorizava a rudeza dessas figuras mais do que o embelezamento acadêmico.",
      tech: "Óleo sobre tela. Fundo escuro e vestido em verdes e azuis profundos criam contraste intenso com a touca clara; pinceladas largas e opacas modelam o rosto em tons de terra."
    },
    {
      id: "tecelao", phase: 0, slug: "tecelao", w: 1500, h: 1104,
      title: "O Tecelão", orig: "Weaver (Tecelão voltado para a esquerda, com roda de fiar)", year: "1884",
      place: "Museum of Fine Arts, Boston",
      file: "Vincent van Gogh - Weaver - Google Art Project.jpg",
      ctx: "Em Nuenen, muitas famílias ainda trabalhavam em teares artesanais dentro de casa, ofício ameaçado pela indústria têxtil. Do fim de 1883 a meados de 1884, Van Gogh dedicou ao tema vários desenhos e pinturas. Aqui o tecelão aparece quase engolido pela estrutura de madeira do tear, com a roda de fiar em primeiro plano.",
      feel: "Confinamento e persistência. A máquina domina o homem, e o espaço fechado transmite o peso da rotina; ao mesmo tempo, o cuidado com cada detalhe do ofício revela respeito pelo trabalho manual.",
      imp: "A série dos tecelões consolida o interesse de Van Gogh pelo trabalho como assunto central e prepara os camponeses de 1885. Também mostra seu esforço em dominar a perspectiva e estruturas complexas de madeira.",
      tech: "Óleo sobre tela. Paleta de verdes-oliva, marrons e ocres; as linhas fortes do tear criam uma geometria rigorosa, e o vermelho do tecido surge como único acento quente."
    },
    {
      id: "torre", phase: 0, slug: "torre", w: 1500, h: 1220,
      title: "A Torre do Cemitério Antigo de Nuenen", orig: "De oude kerktoren te Nuenen (Het boerenkerkhof)", year: "1885",
      place: "Van Gogh Museum, Amsterdã",
      file: "De oude kerktoren te Nuenen (`Het boerenkerkhof') - s0002V1962 - Van Gogh Museum.jpg",
      ctx: "Van Gogh pintou a velha torre da igreja de Nuenen em maio de 1885, em meio ao cemitério dos camponeses. Em carta ao irmão, comentou que as ruínas mostravam como a morte e o sepultamento do camponês são simples: um pouco de terra revolvida, como a queda de uma folha de outono.",
      feel: "Melancolia, finitude e silêncio. O céu pesado, a torre solitária e as pequenas cruzes no chão sugerem a passagem do tempo e a humildade diante da morte.",
      imp: "Aproxima o tema religioso do mundo rural e fecha o ciclo de Nuenen: a espiritualidade deixa de estar na instituição e passa a estar na terra e na vida simples de quem a trabalha.",
      tech: "Óleo sobre tela. Composição central e simétrica, paleta de cinzas, verdes escuros e ocres, e pinceladas largas e secas que dão ao muro o aspecto de pedra desgastada, com aves escuras no céu."
    },

    /* ===== FASE II — PARIS ===== */
    {
      id: "palha", phase: 1, slug: "palha", w: 1187, h: 1500,
      title: "Autorretrato com Chapéu de Palha", orig: "Self-Portrait with a Straw Hat", year: "1887",
      place: "The Metropolitan Museum of Art, Nova York",
      file: "Van Gogh Self-Portrait with Straw Hat 1887-Metropolitan.jpg",
      ctx: "Em Paris, Van Gogh pintou mais de vinte autorretratos, em parte porque modelos custavam caro. Este foi feito no verso de uma tela de Nuenen, a do Descascador de Batatas, reaproveitada por economia, e mostra o artista como um parisiense de chapéu de verão.",
      feel: "Vitalidade, concentração e um olhar direto, de quem se observa para entender a própria técnica. O ambiente é luminoso e quase festivo, bem diferente da penumbra holandesa.",
      imp: "Marca o contato com o pontilhismo e com a teoria das cores complementares: pinceladas curtas, em várias direções, constroem tanto o fundo quanto a figura.",
      tech: "Óleo. Pinceladas curtas e paralelas, azuis e violetas contra laranjas e amarelos; o chapéu amarelo converte-se no grande foco de luz da composição."
    },
    {
      id: "tanguy", phase: 1, slug: "tanguy", w: 800, h: 1008,
      title: "Retrato de Père Tanguy", orig: "Portrait of Père Tanguy", year: "1887",
      place: "Musée Rodin, Paris",
      file: "Van Gogh - Portrait of Pere Tanguy 1887-8.JPG",
      ctx: "Julien Tanguy, o “Père Tanguy”, vendia tintas em Montmartre e aceitava quadros como pagamento, o que o tornou amigo e apoiador de jovens artistas, entre eles Van Gogh, Émile Bernard e Cézanne. Van Gogh o retratou diante de uma parede de estampas japonesas, num fundo que revela sua paixão pelo Japonismo.",
      feel: "Acolhimento e frontalidade. O senhor sentado, de mãos juntas, olha de frente com doçura, e a explosão de cores ao redor o transforma numa espécie de santo laico diante de uma vitrine de um mundo novo.",
      imp: "É a obra em que Van Gogh mais se aproxima da gravura japonesa, com cores puras, planos e contornos. Ele pintou três versões do retrato, e esta é a do Musée Rodin.",
      tech: "Óleo sobre tela, cerca de 92 × 75 cm. Plano frontal sem profundidade; casaco azul contra um fundo de cores vivas, com o monte Fuji de uma das estampas aparecendo ao fundo; pinceladas curtas no rosto e áreas chapadas nas gravuras."
    },
    {
      id: "segatori", phase: 1, slug: "segatori", w: 1245, h: 1500,
      title: "Agostina Segatori no Café du Tambourin", orig: "In het café: Agostina Segatori in Le Tambourin", year: "1887",
      place: "Van Gogh Museum, Amsterdã",
      file: "In het café Agostina Segatori in Le Tambourin - s0017V1962 - Van Gogh Museum.jpg",
      ctx: "Agostina Segatori, ex-modelo de pintores franceses, dirigia o Café du Tambourin, no boulevard de Clichy, onde Van Gogh chegou a expor sua coleção de estampas japonesas. Aqui ela aparece sentada a uma mesa em forma de pandeiro, com um copo de cerveja e um cigarro.",
      feel: "Introspecção e pausa. De braços cruzados, a mulher parece distante em meio ao movimento do café; a atmosfera é de intimidade e de certa melancolia urbana.",
      imp: "Une retrato psicológico e cena da vida noturna parisiense, temas caros aos impressionistas, mas já com sinais de linguagem própria, como a cor sintética e a disposição quase decorativa dos objetos.",
      tech: "Óleo sobre tela. Paleta de verdes, azuis acinzentados e o vermelho-alaranjado do chapéu; pinceladas curtas e finas; estampas orientais ao fundo, à direita."
    },
    {
      id: "asnieres", phase: 1, slug: "asnieres", w: 960, h: 780,
      title: "A Ponte de Asnières", orig: "Bridges across the Seine at Asnières", year: "1887",
      place: "Coleção E. G. Bührle, Zurique",
      file: "Vincent van Gogh - Bridges across the Seine at Asnieres.jpg",
      ctx: "No verão de 1887, Van Gogh pintou as margens do Sena em Asnières, subúrbio operário e de lazer, às vezes ao lado de Émile Bernard e Paul Signac. A tela mostra a ponte ferroviária, com um trem a vapor, e a ponte de pedestres sobre o rio, com barcos amarrados e uma figura de vermelho na margem.",
      feel: "Movimento leve e frescor de dia de sol. O trem, os barcos e o passeio comunicam a modernidade de uma cidade em transformação.",
      imp: "Resume a assimilação do Impressionismo e do Neoimpressionismo por Van Gogh: temas da vida moderna, cor luminosa e pinceladas fragmentadas.",
      tech: "Óleo sobre tela. Azuis e laranjas complementares; pinceladas pequenas e direcionadas na água; a arquitetura da ponte organiza uma diagonal forte."
    },
    {
      id: "vaso", phase: 1, slug: "vaso", w: 1233, h: 1500,
      title: "Flores em um Vaso (Gladíolos e Ásteres-da-China)", orig: "Vaas met tuingladiolen en Chinese asters", year: "1886",
      place: "Van Gogh Museum, Amsterdã",
      file: "Vaas met tuingladiolen en Chinese asters - s0144V1962 - Van Gogh Museum.jpg",
      ctx: "Flores eram modelos baratos e pacientes. No verão de 1886, recém-chegado a Paris, Van Gogh multiplicou estudos de buquês para testar contrastes de cor, estimulado pelo exemplo de Delacroix e pelos impressionistas.",
      feel: "Delicadeza e leveza. O buquê parece vibrar ao sabor de uma brisa, e o ambiente dispensa a sombra espessa de Nuenen.",
      imp: "Os estudos de flores foram o laboratório de sua nova paleta: aqui já se vê o abandono dos tons terrosos em favor de azuis, vermelhos e brancos brilhantes, que preparam os futuros Girassóis.",
      tech: "Óleo sobre tela. Fundo azul acinzentado em pinceladas curtas e variadas; flores em vermelho, rosa e branco, com toques de cor complementar; superfície mais leve que a das telas de Nuenen."
    },
    {
      id: "autorretrato", phase: 1, slug: "autorretrato", w: 1187, h: 1500,
      title: "Autorretrato", orig: "Self-Portrait", year: "1887",
      place: "Art Institute of Chicago",
      file: "Vincent van Gogh - Self-Portrait - Google Art Project (454045).jpg",
      ctx: "Pintado no segundo ano em Paris, mostra Van Gogh de três quartos, com o casaco escuro e a barba ruiva. Ele aplicou a lição dos neoimpressionistas: fundo, roupa e rosto são construídos por pequenas pinceladas separadas, quase em ondas.",
      feel: "Intensidade contida. O olhar atento e firme de quem se examina sem concessões, com uma tensão emocional visível sob a superfície organizada.",
      imp: "Exemplifica o método de Van Gogh em Paris: usar cores complementares, como o laranja da barba contra o verde-azulado do fundo, para dar vibração à figura, preparando o estilo autoral que viria em Arles.",
      tech: "Óleo. Pinceladas radiais e ritmadas ao redor da cabeça, paleta fria no fundo e quente no rosto, contornos suaves e superfície inteiramente trabalhada em pequenos toques."
    },

    /* ===== FASE III — SUL DA FRANÇA ===== */
    {
      id: "noite", phase: 2, slug: "noite", w: 1400, h: 1108,
      title: "A Noite Estrelada", orig: "De sterrennacht", year: "1889",
      place: "The Museum of Modern Art (MoMA), Nova York",
      link: ["Ver no acervo do MoMA", "https://www.moma.org/collection/works/79802"],
      ctx: "Pintada em junho de 1889, no sanatório de Saint-Paul-de-Mausole, em Saint-Rémy, a tela parte da vista da janela de seu quarto, mas a transfigura pela memória e pela imaginação: a aldeia, com sua torre de igreja de feição holandesa, é inventada, e o cipreste ocupa o primeiro plano como um elo entre a terra e o céu.",
      feel: "Êxtase e esperança. A noite não é tratada como escuridão morta, mas como um espetáculo vibrante de energia vital, com estrelas incandescentes e um céu em turbilhão.",
      imp: "Marco da pintura moderna: a visão subjetiva do artista se sobrepõe à reprodução do mundo visível, antecipando o Expressionismo. A estrela matutina mais brilhante corresponde ao planeta Vênus, visível naquele mês.",
      tech: "Óleo sobre tela, 73,7 × 92,1 cm. Pinceladas espessas, onduladas e rítmicas; contraste entre o azul-cobalto e o ultramarino do céu e o amarelo-ouro das estrelas e da lua."
    },
    {
      id: "girassois", phase: 2, slug: "girassois", w: 1180, h: 1500,
      title: "Girassóis", orig: "Sunflowers", year: "1888",
      place: "National Gallery, Londres",
      file: "Vincent van Gogh - Sunflowers (1888, National Gallery London).jpg",
      ctx: "Em agosto de 1888, em Arles, Van Gogh pintou uma série de buquês de girassóis para decorar o quarto reservado a Paul Gauguin na Casa Amarela. Preparava a chegada do amigo na esperança de fundar ali um ateliê coletivo.",
      feel: "Calor, vitalidade e generosidade. O amarelo domina em variações que vão do verde ao laranja: é uma celebração da luz do sul e, ao mesmo tempo, um gesto de hospitalidade.",
      imp: "Tornou-se um símbolo do artista e provou que um só tom pode ser orquestrado como uma sinfonia. Van Gogh voltou ao tema depois, em versões repetidas.",
      tech: "Óleo sobre tela, 92,1 × 73 cm. Fundo amarelo claro, mesa ocre e tinta espessa em relevo nas pétalas e no miolo das flores; a assinatura aparece no vaso."
    },
    {
      id: "quarto", phase: 2, slug: "quarto", w: 1500, h: 1190,
      title: "O Quarto em Arles", orig: "De slaapkamer", year: "1888",
      place: "Van Gogh Museum, Amsterdã",
      file: "Vincent van Gogh - De slaapkamer - Google Art Project.jpg",
      ctx: "Em outubro de 1888, depois de se instalar na Casa Amarela, Van Gogh pintou seu próprio quarto, com cama, cadeiras e quadros na parede. Disse ao irmão Theo que queria exprimir repouso absoluto por meio da cor. Em 1889 fez mais duas versões, hoje em Chicago e em Paris.",
      feel: "Aconchego e simplicidade com leve estranheza: o piso inclinado e as paredes tortas dão uma sensação de instabilidade sob a calma.",
      imp: "Obra central para entender a pintura moderna: cor pura e planos chapados substituem sombras e modelagem, numa influência direta da estampa japonesa.",
      tech: "Óleo sobre tela, 72,4 × 91,3 cm. Perspectiva deformada, contornos escuros e cores chapadas: amarelo da cama, verde das janelas e paredes que eram violeta e desbotaram para azul."
    },
    {
      id: "cafe", phase: 2, slug: "cafe", w: 1500, h: 1184,
      title: "O Café Noturno", orig: "Le Café de nuit", year: "1888",
      place: "Yale University Art Gallery, New Haven",
      file: "Van Gogh - The Night Café (1888).jpg",
      ctx: "Pintado em setembro de 1888, na Place Lamartine, em Arles, mostra um café que ficava aberto a noite toda e acolhia andarilhos e boêmios. Vincent escreveu que tentara exprimir as terríveis paixões humanas por meio do vermelho e do verde.",
      feel: "Opressão, insônia e desamparo. O calor dos lampiões não aquece; as figuras quase dormem sobre as mesas, e o relógio marca perto de meia-noite e quinze.",
      imp: "Exemplo mais radical de cor psicológica: o artista abandona o realismo cromático para transmitir um estado de espírito, aproximando-se do que viria a ser o Expressionismo.",
      tech: "Óleo sobre tela. Piso amarelo em perspectiva acentuada, lampiões com halos, mesa de bilhar ao centro e contraste direto de vermelho e verde nas paredes e no teto."
    },
    {
      id: "terraco", phase: 2, slug: "terraco", w: 1196, h: 1500,
      title: "Terraço do Café à Noite", orig: "Terrasse du café le soir (Place du Forum)", year: "1888",
      place: "Kröller-Müller Museum, Otterlo",
      file: "Vincent Willem van Gogh - Cafe Terrace at Night (Yorck).jpg",
      ctx: "Pintado à noite, ao ar livre, na Place du Forum, em Arles, em setembro de 1888, tem o gás do café iluminando o terraço. Foi sua primeira tela com um céu estrelado, e Van Gogh evitou o preto: a noite é feita de azuis, violetas e verdes.",
      feel: "Acolhimento e encanto noturno. A luz amarela do café contrasta com o azul profundo e cria um refúgio em meio à noite.",
      imp: "Anuncia A Noite Estrelada: mostra que a noite pode ser tão colorida quanto o dia e que a luz artificial é um tema legítimo da pintura.",
      tech: "Óleo sobre tela, 80,7 × 65,3 cm. Pinceladas curtas e pontuais nas estrelas, perspectiva diagonal pelas pedras do calçamento e contraste entre o amarelo do gás e o azul-cobalto do céu."
    },
    {
      id: "trigal", phase: 2, slug: "trigal", w: 1500, h: 719,
      title: "Campo de Trigo com Corvos", orig: "Korenveld met kraaien", year: "1890",
      place: "Van Gogh Museum, Amsterdã",
      file: "Korenveld met kraaien - s0149V1962 - Van Gogh Museum.jpg",
      ctx: "Pintado em julho de 1890 em Auvers-sur-Oise, poucas semanas antes de sua morte, mostra um trigal sob céu carregado, cortado por três caminhos, com corvos em voo. Em carta, Van Gogh disse ter retratado vastos campos sob céus turbulentos e que não precisara se esforçar para exprimir tristeza e extrema solidão.",
      feel: "Inquietação e solidão, mas também vitalidade: as cores são fortes e o movimento das pinceladas parece vibrar. Ele também escreveu que via no campo algo de saudável e fortificante.",
      imp: "Costuma ser apontada como sua última pintura, mas essa tradição não é comprovada. Ainda assim, sintetiza seu estilo final: formato panorâmico, ritmo de pinceladas e cor expressiva.",
      tech: "Óleo sobre tela, 50,5 × 103 cm, formato de duplo quadrado. Céu azul-cobalto, trigal amarelo e caminho de terra avermelhada, com pinceladas grossas e dinâmicas."
    }
  ];

  createExhibit(document.getElementById("fases-root"), {
    groups: PHASES, works: WORKS, dir: "img/fases",
    hint: "Clique em uma pintura para abrir a exposição. Use as setas do teclado para percorrer a fase e Esc para voltar.",
    blocks: [
      ["Contexto e significado", "ctx"],
      ["Sentimento transmitido", "feel"],
      ["Importância artística", "imp"],
      ["Características técnicas e visuais", "tech"]
    ]
  });

  /* ======================= 2) AUTORRETRATOS ======================= */
  const SELF_GROUPS = [
    {
      kicker: "Galeria", num: "", name: "Autorretratos", period: "1886–1889",
      tab: "Autorretratos", label: "Autorretratos · 1886–1889", aria: "Galeria de autorretratos",
      openLabel: "Percorrer a galeria",
      tagline: "O pintor diante de si mesmo",
      desc: "Entre 1886 e 1889, Van Gogh pintou mais de 35 autorretratos. Sem dinheiro para modelos, fez do próprio rosto um laboratório de cor e técnica e, aos poucos, um diário da própria vida. A galeria inclui também a caveira de Antuérpia e as duas cadeiras de Arles, retratos simbólicos de Vincent e de Gauguin.",
      dots: ["#2d3a2a", "#c0602f", "#e3b23c", "#3d6f9e"], accent: "#c0602f"
    }
  ];

  const SELF_WORKS = [
    {
      id: "caveira", phase: 0, slug: "caveira", w: 1131, h: 1500,
      title: "Caveira com Cigarro Aceso", orig: "Kop van een skelet met brandende sigaret", year: "1885–86",
      date: "Inverno de 1885–1886, Antuérpia", place: "Van Gogh Museum, Amsterdã",
      file: "Kop van een skelet met brandende sigaret - s0083V1962 - Van Gogh Museum.jpg",
      life: "Depois de deixar Nuenen, Vincent passou o inverno de 1885–86 em Antuérpia e frequentou a Academia de Belas-Artes, onde o estudo de anatomia incluía desenhar esqueletos. Doente, mal alimentado e quase sem dinheiro, pintou esta caveira pouco antes de partir para Paris, em 1886.",
      mean: "Um esqueleto fumando zomba das regras acadêmicas e funciona como um memento mori irônico: a morte exibindo um hábito da vida. Não é um autorretrato no sentido estrito, mas costuma ser lido como um olhar sarcástico do artista sobre a própria fragilidade, numa fase de saúde precária.",
      tech: "Óleo sobre tela, 32 × 24,5 cm. Fundo escuro, ossos modelados em tons claros e esverdeados, fumaça em pinceladas finas. A paleta ainda é a sombria da fase holandesa."
    },
    {
      id: "feltro", phase: 0, slug: "feltro", w: 1236, h: 1500,
      title: "Autorretrato com Chapéu de Feltro Cinza", orig: "Zelfportret met grijze vilthoed", year: "1887",
      date: "1887, Paris", place: "Van Gogh Museum, Amsterdã",
      file: "Zelfportret met grijze vilthoed - s0016V1962 - Van Gogh Museum.jpg",
      life: "No segundo ano em Paris, Vincent morava com o irmão Theo em Montmartre e convivia com pintores como Signac, Bernard e Toulouse-Lautrec. Sem recursos para pagar modelos, usava o próprio rosto como campo de experiências.",
      mean: "Apresenta um homem urbano, de chapéu e gravata, já distante do pregador de Borinage. O halo de pinceladas ao redor da cabeça dá ao rosto uma energia quase elétrica: é ao mesmo tempo um retrato de identidade e um manifesto de técnica.",
      tech: "Pinceladas curtas e separadas, inspiradas no pontilhismo, que seguem a direção das formas; azuis e laranjas complementares fazem vibrar o rosto e o fundo."
    },
    {
      id: "pintor", phase: 0, slug: "pintor", w: 1153, h: 1500,
      title: "Autorretrato como Pintor", orig: "Zelfportret als schilder", year: "1887–88",
      date: "Dezembro de 1887 – fevereiro de 1888, Paris", place: "Van Gogh Museum, Amsterdã",
      file: "Zelfportret als schilder - s0022V1962 - Van Gogh Museum.jpg",
      life: "É o último autorretrato de Paris, pintado pouco antes da partida para Arles, em fevereiro de 1888. Cansado da cidade e com a saúde abalada, Vincent se mostra diante do cavalete, com a paleta e os pincéis nas mãos.",
      mean: "Uma afirmação de identidade profissional: depois de dois anos de aprendizado em Paris, ele se apresenta como pintor. As cores dispostas na paleta são as mesmas do quadro, revelando o seu método; o semblante, porém, é sério e fatigado.",
      tech: "Óleo sobre tela, 65,5 × 50,5 cm. Pinceladas tramadas em azul, laranja e vermelho; cores complementares postas lado a lado na paleta e no rosto."
    },
    {
      id: "dedicado-gauguin", phase: 0, slug: "dedicado-gauguin", w: 1228, h: 1500,
      title: "Autorretrato Dedicado a Paul Gauguin", orig: "Self-Portrait Dedicated to Paul Gauguin", year: "1888",
      date: "Setembro de 1888, Arles", place: "Harvard Art Museums (Fogg Museum), Cambridge, EUA",
      file: "Vincent van Gogh - Self-Portrait Dedicated to Paul Gauguin - 1951.65 - Fogg Museum.jpg",
      life: "Em Arles, Vincent sonhava com um “Ateliê do Sul” e propôs a Gauguin e a Émile Bernard uma troca de autorretratos. Pintou-se de cabeça raspada e dedicou o quadro ao amigo, semanas antes de Gauguin chegar à Casa Amarela.",
      mean: "Em carta a Gauguin, contou que se imaginou como um bonzo, um monge simples adorador do Buda eterno. A imagem idealiza o Japão como modelo de vida despojada e de fraternidade entre artistas, o projeto que ele queria fundar no Sul.",
      tech: "Óleo sobre tela, 62 × 52 cm. Fundo verde-claro uniforme, sem sombras; rosto modelado em laranjas e verdes; olhos levemente oblíquos e contornos simplificados, à maneira japonesa."
    },
    {
      id: "cadeira-vincent", phase: 0, slug: "cadeira-vincent", w: 1170, h: 1500,
      title: "A Cadeira de Van Gogh", orig: "Van Gogh's Chair", year: "1888",
      date: "Novembro–dezembro de 1888, Arles", place: "National Gallery, Londres",
      file: "Vincent Willem van Gogh 138.jpg",
      life: "Pintada na Casa Amarela durante a convivência com Gauguin, forma par com A Cadeira de Gauguin. A relação entre os dois se deteriorava, e em 23 de dezembro de 1888 terminaria na crise em que Vincent feriu a própria orelha.",
      mean: "Um autorretrato sem rosto. A cadeira rústica de palha, com o cachimbo e o tabaco, representa a personalidade simples e camponesa de Vincent, em contraste com a poltrona elegante do amigo. Ao fundo, uma caixa de cebolas traz a assinatura “Vincent”.",
      tech: "Óleo sobre tela, 93 × 73,5 cm. Luz diurna e cores claras: amarelo da cadeira, azul da porta e piso de lajotas vermelhas em perspectiva inclinada, com contornos fortes."
    },
    {
      id: "cadeira-gauguin", phase: 0, slug: "cadeira-gauguin", w: 1188, h: 1500,
      title: "A Cadeira de Gauguin", orig: "De stoel van Gauguin", year: "1888",
      date: "Novembro–dezembro de 1888, Arles", place: "Van Gogh Museum, Amsterdã",
      file: "De stoel van Gauguin - s0048V1962 - Van Gogh Museum.jpg",
      life: "Par da cadeira de Vincent, pintada no mesmo período em que os dois artistas dividiam a Casa Amarela e discutiam cada vez mais sobre arte. Pouco depois Gauguin deixaria Arles e não voltaria a viver com o amigo.",
      mean: "Um retrato do amigo ausente: uma poltrona de braços, com dois romances e uma vela acesa sobre o assento, num ambiente noturno iluminado por um lampião a gás. Simboliza a imaginação e o temperamento intelectual de Gauguin, em contraste com a simplicidade da cadeira de Vincent.",
      tech: "Óleo sobre tela. Cena noturna em verdes e vermelhos intensos, tapete estampado, luz artificial e pincelada carregada."
    },
    {
      id: "orelha", phase: 0, slug: "orelha", w: 1234, h: 1500,
      title: "Autorretrato com a Orelha Enfaixada", orig: "Self-Portrait with Bandaged Ear", year: "1889",
      date: "Janeiro de 1889, Arles", place: "The Courtauld Gallery, Londres",
      file: "Vincent van Gogh - Self-portrait with bandaged ear (1889, Courtauld Institute).jpg",
      life: "Em 23 de dezembro de 1888, depois de uma discussão com Gauguin, Vincent feriu a própria orelha esquerda e foi internado no hospital de Arles; Gauguin voltou para Paris. Ao receber alta, em janeiro, pintou este autorretrato. A atadura aparece à direita porque ele se pintou diante do espelho.",
      mean: "Não é um retrato de desespero. Ele se mostra vestido para o frio, de gorro de pele, ao lado de um cavalete e de uma gravura japonesa, como quem anuncia que voltou ao trabalho e à arte que admirava.",
      tech: "Óleo sobre tela, 60 × 49 cm. Casaco verde, gorro de pele e fundo dividido entre a tela no cavalete, a janela e a estampa japonesa; cores mais contidas e pinceladas firmes."
    },
    {
      id: "orsay", phase: 0, slug: "orsay", w: 1234, h: 1500,
      title: "Autorretrato de Saint-Rémy", orig: "Portrait de l'artiste", year: "1889",
      date: "Setembro de 1889, Saint-Rémy-de-Provence", place: "Musée d'Orsay, Paris",
      file: "Vincent van Gogh - Self-Portrait - Google Art Project.jpg",
      life: "Pintado no asilo de Saint-Paul-de-Mausole, em Saint-Rémy, depois de uma crise grave no verão de 1889. É um dos últimos autorretratos que ele fez; menos de um ano depois, morreria em Auvers-sur-Oise.",
      mean: "O artista encara o observador com firmeza e sobriedade. O fundo de arabescos azuis parece se mover, ligando o estado interior à superfície do quadro: o ambiente vibra enquanto o rosto se mantém sereno.",
      tech: "Óleo sobre tela. Azuis e verdes frios na roupa e no fundo contrastam com o laranja do cabelo e da barba; pinceladas ondulantes e contínuas cobrem toda a superfície."
    }
  ];
  createExhibit(document.getElementById("autorretratos-root"), {
    groups: SELF_GROUPS, works: SELF_WORKS, dir: "img/autorretratos", single: true,
    hint: "Clique em um autorretrato para abri-lo. Use as setas do teclado para percorrer a galeria e Esc para voltar.",
    blocks: [
      ["Contexto da vida", "life"],
      ["Significado", "mean"],
      ["Características técnicas e visuais", "tech"]
    ]
  });
})();
