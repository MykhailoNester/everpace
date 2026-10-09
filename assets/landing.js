(() => {
  // ?shot: everything shown at once, for static captures of the page.
  const shot = new URLSearchParams(location.search).has("shot");
  const reduce = shot || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, fn, threshold = .3) => {
    const o = new IntersectionObserver((es) => { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold });
    o.observe(el);
  };

  // Headlines rise word by word.
  if (!reduce) $$("h1.rv, h2.rv").forEach((h) => {
    let i = 0;
    [...h.childNodes].forEach((n) => {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(" "); return; }
        const w = document.createElement("span"), inner = document.createElement("span");
        w.className = "w"; inner.textContent = part; inner.style.setProperty("--i", i++);
        w.append(inner); frag.append(w);
      });
      n.replaceWith(frag);
    });
    h.classList.add("split");
  });

  if (shot) $$(".rv").forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .15, rootMargin: "0px 0px -5% 0px" });
    $$(".rv").forEach((el) => io.observe(el));
  }

  // Scroll-driven: nav progress, current section, hero depth, records drift, film growing in.
  const nav = $("#nav"), scene = $(".scene"), pair = $(".pair"), player = $("#player");
  const links = $$(".nav nav a").map((a) => [a, $(a.getAttribute("href"))]).filter(([, s]) => s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const centre = (el) => { const r = el.getBoundingClientRect(); return (r.top + r.height / 2 - innerHeight / 2) / innerHeight; };
  let ticking = false;
  const frame = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", scrollY > 8);
    nav.style.setProperty("--sp", max > 0 ? (scrollY / max).toFixed(4) : 0);
    let cur = null;
    links.forEach(([a, s]) => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = a; });
    links.forEach(([a]) => a.classList.toggle("on", a === cur));
    if (reduce) return;
    if (scene) scene.style.setProperty("--p", clamp(scrollY / 700, 0, 1).toFixed(3));
    if (pair) pair.style.setProperty("--q", clamp(centre(pair), -1, 1).toFixed(3));
    if (player) player.style.setProperty("--fs", (.9 + .1 * clamp(1 - centre(player) * 1.6, 0, 1)).toFixed(4));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  frame();

  // A soft light follows the pointer across the hero.
  const hero = $(".hero");
  if (hero && !reduce && matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  // The hero watch runs a real EMOM: power cleans and burpees, alternating each minute.
  const ring = $("#ring");
  if (ring) {
    const C = 298.45, f = { t: $("#fTitle"), c: $("#fClock"), a: $("#fMv1"), b: $("#fMv2"), hr: $("#fHr"), time: $("#fTime"), k: $("#fKcal") };
    const work = [["Power Clean", "3 · 70kg"], ["Burpee", "8"]];
    let minute = 4, left = 42, elapsed = 198, kcal = 41, hr = 148, last = 0;
    const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const paint = () => {
      f.c.textContent = mmss(left);
      ring.style.strokeDashoffset = (C * (1 - left / 60)).toFixed(2);
      f.t.textContent = `EMOM ${minute}/10`;
      const [x, y] = minute % 2 ? work : [work[1], work[0]];
      f.a.innerHTML = `<span>${x[0]}</span><span>${x[1]}</span>`;
      f.b.innerHTML = `<span>${y[0]}</span><span>${y[1]}</span>`;
      f.hr.textContent = Math.round(hr); f.time.textContent = mmss(elapsed); f.k.textContent = Math.round(kcal);
    };
    const tick = (now) => {
      const dt = last ? Math.min(.25, (now - last) / 1000) : 0; last = now;
      left -= dt; elapsed += dt; kcal += dt * .2;
      hr += (Math.sin(now / 1400) * .5 + (left < 20 ? .4 : -.2)) * dt * 2; hr = Math.max(134, Math.min(172, hr));
      if (left <= 0) { left += 60; minute = minute % 10 + 1; }
      paint(); requestAnimationFrame(tick);
    };
    paint();
    if (!reduce) requestAnimationFrame(tick);
  }

  // 01: the coach's text types in, the read counts up, then the phone shows Everpace's read of it.
  const box = $("#paste-text"), swap = $("#swap"), pct = $("#pct");
  const text = "Strength\n5 sets\n5 back squats 80 kg\n\nWOD\nAMRAP 12\n10 cal row\n12 wall balls 9/6 kg\n6 power cleans 60/40 kg\n200 m run";
  const done = () => { swap.classList.add("read"); pct.textContent = "100% read"; pct.classList.add("gain"); };
  if (box) {
    if (reduce) { box.textContent = text; done(); }
    else seen(box, () => {
      let i = 0;
      const step = () => {
        i = Math.min(text.length, i + 1);
        box.innerHTML = text.slice(0, i) + '<span class="caret"></span>';
        pct.textContent = `Reading… ${Math.round(i / text.length * 99)}%`;
        if (i < text.length) setTimeout(step, text[i - 1] === "\n" ? 160 : 34);
        else setTimeout(done, 450);
      };
      setTimeout(step, 350);
    }, .4);
  }

  // 02: the segmented control, as in the app; it steps on its own until someone picks.
  const seg = $("#seg");
  if (seg) {
    const btns = $$("button", seg), imgs = $$("#watch .dial img"), cap = $("#caption");
    const pill = document.createElement("span"), bar = document.createElement("div");
    pill.className = "pill"; seg.prepend(pill); seg.classList.add("has-pill");
    bar.className = "tick"; bar.innerHTML = "<i></i>"; cap.after(bar);
    let idx = 0, timer = null, auto = !reduce;
    const place = () => { const b = btns[idx]; pill.style.left = `${b.offsetLeft}px`; pill.style.width = `${b.offsetWidth}px`; };
    const run = () => { bar.classList.remove("run"); void bar.offsetWidth; if (auto) bar.classList.add("run"); else bar.classList.add("off"); };
    const show = (n) => {
      idx = (n + btns.length) % btns.length;
      btns.forEach((b, k) => b.classList.toggle("on", k === idx));
      imgs.forEach((im) => im.classList.toggle("on", im.dataset.k === btns[idx].dataset.k));
      place();
      if (reduce) { cap.textContent = btns[idx].dataset.c; return; }
      cap.classList.add("out");
      setTimeout(() => { cap.textContent = btns[idx].dataset.c; cap.classList.remove("out"); }, 220);
    };
    const loop = () => { clearTimeout(timer); run(); if (auto) timer = setTimeout(() => { show(idx + 1); loop(); }, 4200); };
    btns.forEach((b, k) => b.addEventListener("click", () => { auto = false; clearTimeout(timer); run(); show(k); }));
    addEventListener("resize", place);
    document.fonts?.ready.then(place);
    place();
    if (reduce) bar.classList.add("off"); else seen(seg, loop);
  }

  const film = $("#player"), video = $("#video");
  if (film) {
    $("#cover").addEventListener("click", () => { video.controls = true; video.play(); });
    video.addEventListener("play", () => film.classList.add("playing"));
    video.addEventListener("ended", () => { film.classList.remove("playing"); video.controls = false; });
  }
})();
