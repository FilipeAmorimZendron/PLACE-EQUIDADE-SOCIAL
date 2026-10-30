/* =========================================================
   PLACE · Equidade Social — interações
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Cabeçalho: sombra + barra de progresso ---------- */
  const topbar = $(".topbar");
  const progress = $("#progress");

  function onScroll() {
    const y = window.scrollY;
    topbar.classList.toggle("is-scrolled", y > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const nav = $("#nav");
  const menuToggle = $("#menuToggle");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  menuToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Link ativo no menu ---------- */
  const navLinks = $$("a", nav);
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));

    /* ---------- Revelar ao rolar ---------- */
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    $$(".reveal").forEach((el) => revealObserver.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
  }

  /* =========================================================
     Advogado animado
     - computador: olhos e cabeça seguem o cursor
     - celular: olham para onde a pessoa toca
     - clique nele: acena e mostra a próxima dica
     ========================================================= */
  const lawyer = $("#lawyer");
  if (lawyer) {
    const svg = $(".lawyer__svg", lawyer);
    const head = $("#lawyerHead");
    const pupils = $("#lawyerPupils");
    const tipEl = $("#lawyerTip");
    const hintEl = $("#lawyerHint");
    const touch = window.matchMedia("(hover: none)").matches;
    const EYE = { x: 150, y: 164 - 78 }; // centro dos olhos (viewBox começa em y=78)

    const tips = [
      "Olá! Eu sou o Dr. Place e vou te acompanhar nesta leitura.",
      touch
        ? "Toque no ☰ lá em cima para pular direto para um tema."
        : "Use o menu lá em cima para pular direto para um tema.",
      touch
        ? "Procurando algo? Toque na lupa e digite uma palavra, como “aluguel”."
        : "Procurando algo? Clique em Pesquisar ou aperte / e digite uma palavra.",
      "Role a página: são 5 capítulos sobre moradia, território e oportunidades.",
      "Você sabia? Mulheres chefiam 62,6% dos domicílios em déficit habitacional.",
      "Na periferia de SP, são 2h47 por dia só no transporte. Tempo é desigualdade.",
      "No fim, uma pergunta para refletir: o lugar onde moramos define quem somos?"
    ];
    let tipIndex = 0;
    hintEl.textContent = touch ? "Toque em mim para uma dica" : "Clique em mim para uma dica";

    // Posição atual e alvo (em unidades normalizadas -1..1)
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let resetTimer = null;
    let running = false;
    let visible = true;

    function aimAt(clientX, clientY) {
      const r = svg.getBoundingClientRect();
      const scale = r.width / 300;
      const cx = r.left + EYE.x * scale;
      const cy = r.top + EYE.y * scale;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const strength = Math.min(dist / 180, 1); // perto = movimento menor
      target.x = (dx / dist) * strength;
      target.y = (dy / dist) * strength;
      start();
    }

    function relax(delay) {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        target.x = 0;
        target.y = 0;
        start();
      }, delay);
    }

    function frame() {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;

      pupils.setAttribute("transform", `translate(${(cur.x * 5.5).toFixed(2)} ${(cur.y * 5).toFixed(2)})`);
      head.setAttribute(
        "transform",
        `translate(${(cur.x * 7).toFixed(2)} ${(cur.y * 5).toFixed(2)}) rotate(${(cur.x * 7).toFixed(2)} 150 230)`
      );

      const settled = Math.abs(target.x - cur.x) < 0.002 && Math.abs(target.y - cur.y) < 0.002;
      if (settled || !visible) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || !visible) return;
      running = true;
      requestAnimationFrame(frame);
    }

    if (!touch) {
      document.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse" || e.pointerType === "pen") aimAt(e.clientX, e.clientY);
      }, { passive: true });
      document.addEventListener("mouseleave", () => relax(0));
    }
    // Toques (e cliques) em qualquer lugar: ele olha para lá
    document.addEventListener("pointerdown", (e) => {
      aimAt(e.clientX, e.clientY);
      lawyer.classList.add("is-surprised");
      setTimeout(() => lawyer.classList.remove("is-surprised"), 350);
      if (e.pointerType !== "mouse") relax(2500);
    }, { passive: true });

    // Pausa a animação quando o advogado sai da tela
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      }).observe(lawyer);
    }

    // Piscar
    (function blinkLoop() {
      setTimeout(() => {
        lawyer.classList.add("is-blinking");
        setTimeout(() => lawyer.classList.remove("is-blinking"), 130);
        blinkLoop();
      }, 2200 + Math.random() * 3000);
    })();

    function wave() {
      lawyer.classList.remove("is-waving");
      void lawyer.offsetWidth;
      lawyer.classList.add("is-waving");
    }
    lawyer.addEventListener("animationend", (e) => {
      if (e.animationName === "wave") lawyer.classList.remove("is-waving");
    });

    function nextTip() {
      tipIndex = (tipIndex + 1) % tips.length;
      tipEl.classList.add("is-changing");
      setTimeout(() => {
        tipEl.textContent = tips[tipIndex];
        tipEl.classList.remove("is-changing");
      }, 180);
      hintEl.textContent = `Dica ${tipIndex + 1} de ${tips.length}`;
      wave();
    }
    $("#lawyerBtn").addEventListener("click", nextTip);

    setTimeout(wave, 700); // aceno de boas-vindas
  }

  /* =========================================================
     Pesquisa
     - ignora acentos e maiúsculas ("saude" encontra "saúde")
     - aceita várias palavras (todas precisam aparecer)
     ========================================================= */
  const search = $("#search");
  const input = $("#searchInput");
  const resultsEl = $("#searchResults");
  const metaEl = $("#searchMeta");
  const suggestEl = $("#searchSuggest");
  let lastFocus = null;
  let activeIndex = -1;
  let currentResults = [];

  // Remove acentos mantendo o mapeamento de posições com o texto original
  function normalizeWithMap(str) {
    let out = "";
    const map = [];
    for (let i = 0; i < str.length; i++) {
      const n = str[i].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      for (let k = 0; k < n.length; k++) {
        out += n[k];
        map.push(i);
      }
    }
    return { text: out, map };
  }
  const normalize = (s) => normalizeWithMap(s).text;

  // Índice montado a partir do próprio conteúdo da página
  const index = $$(".searchable").map((el) => {
    const text = el.textContent.replace(/\s+/g, " ").trim();
    const norm = normalizeWithMap(text);
    return { el, text, norm, section: el.dataset.section || "" };
  });

  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function buildSnippet(item, terms) {
    const { text, norm } = item;
    // Encontra todas as ocorrências dos termos
    let ranges = [];
    terms.forEach((t) => {
      let from = 0;
      let pos;
      while ((pos = norm.text.indexOf(t, from)) !== -1) {
        const start = norm.map[pos];
        const end = norm.map[pos + t.length - 1] + 1;
        ranges.push([start, end]);
        from = pos + t.length;
      }
    });
    ranges.sort((a, b) => a[0] - b[0]);
    // Junta intervalos sobrepostos
    const merged = [];
    ranges.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push(r.slice());
    });

    // Recorta um trecho em volta da primeira ocorrência
    const LIMIT = 220;
    let sStart = 0;
    let sEnd = text.length;
    if (text.length > LIMIT && merged.length) {
      sStart = Math.max(0, merged[0][0] - 70);
      if (sStart > 0) {
        const space = text.indexOf(" ", sStart);
        if (space !== -1 && space < merged[0][0]) sStart = space + 1;
      }
      sEnd = Math.min(text.length, sStart + LIMIT);
      if (sEnd < text.length) {
        const space = text.lastIndexOf(" ", sEnd);
        if (space > merged[0][1]) sEnd = space;
      }
    }

    let html = sStart > 0 ? "… " : "";
    let cursor = sStart;
    merged.forEach(([a, b]) => {
      if (b <= sStart || a >= sEnd) return;
      a = Math.max(a, sStart);
      b = Math.min(b, sEnd);
      html += escapeHtml(text.slice(cursor, a)) + "<mark>" + escapeHtml(text.slice(a, b)) + "</mark>";
      cursor = b;
    });
    html += escapeHtml(text.slice(cursor, sEnd));
    if (sEnd < text.length) html += " …";
    return { html, count: ranges.length };
  }

  function runSearch(query) {
    const terms = normalize(query).split(/\s+/).filter((t) => t.length > 0);
    activeIndex = -1;

    if (!terms.length) {
      currentResults = [];
      resultsEl.innerHTML = "";
      metaEl.textContent = "";
      suggestEl.hidden = false;
      return;
    }
    suggestEl.hidden = true;

    currentResults = index
      .filter((item) => terms.every((t) => item.norm.text.includes(t)))
      .map((item) => ({ item, snip: buildSnippet(item, terms) }))
      .sort((a, b) => b.snip.count - a.snip.count);

    if (!currentResults.length) {
      resultsEl.innerHTML = "";
      metaEl.textContent = `Nenhum resultado para “${query.trim()}”. Tente outra palavra.`;
      return;
    }

    resultsEl.innerHTML = currentResults
      .map(
        (r, i) => `
        <li class="result" role="option" id="res-${i}" data-i="${i}" aria-selected="false">
          <span class="result__section">${escapeHtml(r.item.section)}</span>
          <span class="result__text">${r.snip.html}</span>
        </li>`
      )
      .join("");

    const n = currentResults.length;
    metaEl.textContent = `${n} ${n === 1 ? "resultado" : "resultados"} · ↑ ↓ para navegar · Enter para abrir`;
    setActive(0);
  }

  function setActive(i) {
    const items = $$(".result", resultsEl);
    if (!items.length) return;
    activeIndex = (i + items.length) % items.length;
    items.forEach((el, k) => el.setAttribute("aria-selected", String(k === activeIndex)));
    items[activeIndex].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", items[activeIndex].id);
  }

  function goTo(i) {
    const r = currentResults[i];
    if (!r) return;
    closeSearch(false);
    const el = r.item.el;
    el.classList.add("is-visible");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("is-found");
    void el.offsetWidth; // reinicia a animação
    el.classList.add("is-found");
    setTimeout(() => el.classList.remove("is-found"), 2600);
  }

  function openSearch() {
    lastFocus = document.activeElement;
    setMenu(false);
    search.hidden = false;
    document.body.style.overflow = "hidden";
    input.focus();
    input.select();
  }

  function closeSearch(restoreFocus = true) {
    search.hidden = true;
    document.body.style.overflow = "";
    if (restoreFocus && lastFocus) lastFocus.focus();
  }

  $("#searchOpen").addEventListener("click", openSearch);
  $$("[data-open-search]").forEach((b) => b.addEventListener("click", openSearch));
  $$("[data-close-search]").forEach((b) => b.addEventListener("click", () => closeSearch()));

  input.addEventListener("input", () => runSearch(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIndex + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIndex - 1); }
    else if (e.key === "Enter") { e.preventDefault(); goTo(activeIndex); }
  });

  resultsEl.addEventListener("click", (e) => {
    const li = e.target.closest(".result");
    if (li) goTo(Number(li.dataset.i));
  });

  $$("button", suggestEl).forEach((b) =>
    b.addEventListener("click", () => {
      input.value = b.textContent;
      runSearch(input.value);
      input.focus();
    })
  );

  // Atalhos: "/" ou Ctrl/Cmd + K abrem; Esc fecha
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (!search.hidden && e.key === "Escape") { e.preventDefault(); closeSearch(); return; }
    if (search.hidden && ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"))) {
      e.preventDefault();
      openSearch();
    }
  });
})();
