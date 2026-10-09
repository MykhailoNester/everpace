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

  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  if (shot) $$(".rv").forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .15, rootMargin: "0px 0px -5% 0px" });
    $$(".rv").forEach((el) => io.observe(el));
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

  // 01: the coach's text types in, then the phone shows Everpace's read of it.
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
    let idx = 0, timer = null, auto = !reduce;
    const show = (n) => {
      idx = (n + btns.length) % btns.length;
      btns.forEach((b, k) => b.classList.toggle("on", k === idx));
      imgs.forEach((im) => im.classList.toggle("on", im.dataset.k === btns[idx].dataset.k));
      cap.textContent = btns[idx].dataset.c;
    };
    const loop = () => { clearTimeout(timer); if (auto) timer = setTimeout(() => { show(idx + 1); loop(); }, 4200); };
    btns.forEach((b, k) => b.addEventListener("click", () => { auto = false; clearTimeout(timer); show(k); }));
    seen(seg, loop);
  }

  const film = $("#film"), video = $("#video");
  if (film) {
    $("#cover").addEventListener("click", () => { film.classList.add("playing"); video.controls = true; video.play(); });
    video.addEventListener("ended", () => film.classList.remove("playing"));
  }
})();
