(() => {
  // ?shot&y=N: everything shown at once and scrolled to N, for static captures of the page.
  const q = new URLSearchParams(location.search);
  const shot = q.has("shot");
  const reduce = shot || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (shot) document.documentElement.classList.add("shot");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (shot) $$(".rv, .fade").forEach((el) => el.classList.add("in"));

  // Nav gains a backdrop once the page moves.
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 12);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Reveal on scroll.
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".rv, .fade").forEach((el) => io.observe(el));

  // Hero depth: phone and watch drift a little with the pointer.
  const stage = $("#stage");
  if (stage && !reduce && matchMedia("(pointer: fine)").matches) {
    const layers = $$("[data-depth]", stage).map((el) => ({ el, d: +el.dataset.depth }));
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      layers.forEach(({ el, d }) => {
        el.style.setProperty("--px", `${(-cx * d).toFixed(2)}px`);
        el.style.setProperty("--py", `${(-cy * d).toFixed(2)}px`);
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // The live watch face: a 10-minute EMOM of power cleans and burpees.
  const face = {
    ring: $("#ring"), title: $("#fTitle"), clock: $("#fClock"), next: $("#fNext"),
    mv1: $("#fMv1"), mv2: $("#fMv2"), hr: $("#fHr"), time: $("#fTime"), kcal: $("#fKcal"), flash: $("#flash"),
  };
  if (face.ring) {
    const C = 298.45, MIN = 60;
    const work = [["Power Clean", "3 · 70kg"], ["Burpee", "8"]];
    let minute = 4, left = 42, elapsed = 198, kcal = 41, hr = 148, last = performance.now();
    const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const paint = () => {
      face.clock.textContent = mmss(left);
      face.ring.style.strokeDashoffset = (C * (1 - left / MIN)).toFixed(2);
      face.title.textContent = `EMOM ${minute}/10`;
      face.next.textContent = `Minute ${minute} of 10`;
      const [a, b] = minute % 2 ? [work[0], work[1]] : [work[1], work[0]];
      face.mv1.innerHTML = `<span>${a[0]}</span><span>${a[1]}</span>`;
      face.mv2.innerHTML = `<span>${b[0]}</span><span>${b[1]}</span>`;
      face.hr.textContent = Math.round(hr); face.time.textContent = mmss(elapsed); face.kcal.textContent = Math.round(kcal);
    };
    const tick = (now) => {
      const dt = Math.min(1, (now - last) / 1000); last = now;
      // The demo runs at 4x so a visitor sees a minute turn over.
      const step = dt * 4;
      left -= step; elapsed += step; kcal += step * .21;
      hr += (Math.sin(now / 900) * .6 + (left < 20 ? .35 : -.15)) * step; hr = Math.max(132, Math.min(176, hr));
      if (left <= 0) {
        left += MIN; minute = minute % 10 + 1;
        face.flash.classList.remove("go"); void face.flash.offsetWidth; face.flash.classList.add("go");
      }
      paint();
      requestAnimationFrame(tick);
    };
    paint();
    if (!reduce) requestAnimationFrame((t) => { last = t; requestAnimationFrame(tick); });
  }

  // Paste → read: the coach's text types in, then the plan assembles.
  const note = $("#note"), plan = $("#plan"), pct = $("#readPct");
  const text = "Strength\n5 sets building to 80%\n5 back squats @ 70-80%\n\nMetcon\nAMRAP 12'\n12 cal row\n15 wall balls 9/6kg\n10 T2B\n\nFinisher\nFor time, cap 6'\n50 DU";
  if (note && plan) {
    const blocks = $$(".block", plan);
    const run = () => {
      if (reduce) { note.textContent = text; blocks.forEach((b) => b.classList.add("in")); pct.textContent = "100% read"; return; }
      let i = 0;
      note.innerHTML = '<span class="caret"></span>';
      const type = () => {
        i = Math.min(text.length, i + (text[i] === "\n" ? 1 : 2));
        note.innerHTML = text.slice(0, i).replace(/&/g, "&amp;").replace(/</g, "&lt;") + '<span class="caret"></span>';
        if (i < text.length) setTimeout(type, text[i - 1] === "\n" ? 140 : 26);
        else {
          blocks.forEach((b, k) => setTimeout(() => {
            b.classList.add("in");
            pct.textContent = `${Math.round(((k + 1) / blocks.length) * 100)}% read`;
            if (k === blocks.length - 1) pct.classList.add("ok");
          }, 260 + k * 320));
        }
      };
      setTimeout(type, 300);
    };
    const once = new IntersectionObserver((es) => { if (es[0].isIntersecting) { run(); once.disconnect(); } }, { threshold: .35 });
    once.observe(note);
  }

  // Watch modes: tabs advance on their own until the visitor picks one.
  const modes = $("#modes");
  if (modes) {
    const tabs = $$(".tab", modes), imgs = $$(".dial img", modes);
    let idx = 0, timer = null, auto = !reduce;
    const show = (n) => {
      idx = (n + tabs.length) % tabs.length;
      tabs.forEach((t, k) => { t.classList.toggle("on", k === idx); t.setAttribute("aria-selected", k === idx); });
      const key = tabs[idx].dataset.img;
      imgs.forEach((im) => im.classList.toggle("on", im.dataset.k === key));
      tabs[idx].querySelector(".bar i")?.getAnimations?.().forEach((a) => { a.cancel(); a.play(); });
    };
    const schedule = () => { clearTimeout(timer); if (auto) timer = setTimeout(() => { show(idx + 1); schedule(); }, 5500); };
    tabs.forEach((t, k) => t.addEventListener("click", () => { auto = false; modes.classList.add("paused"); clearTimeout(timer); show(k); }));
    const vis = new IntersectionObserver((es) => { if (es[0].isIntersecting) schedule(); else clearTimeout(timer); }, { threshold: .3 });
    vis.observe(modes);
  }

  // Figures count up once.
  $$("[data-count]").forEach((el) => {
    const to = +el.dataset.count;
    const o = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 1400;
      const f = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }, { threshold: .6 });
    o.observe(el);
  });

  // Film: the cover plays the video with sound controls.
  const film = $("#film"), video = $("#video"), cover = $("#cover");
  if (film && video) {
    cover.addEventListener("click", () => { film.classList.add("playing"); video.controls = true; video.play(); });
    video.addEventListener("ended", () => film.classList.remove("playing"));
  }
})();
