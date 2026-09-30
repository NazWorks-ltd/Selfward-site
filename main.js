// Selfward site: scroll scenes, card rail, modal and map hotspots. No dependencies.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Scroll progress for sticky scenes ---------- */
  const scenes = $$('[data-scroll]');
  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const run = el.offsetHeight - innerHeight;
    return run > 0 ? clamp(-r.top / run) : 0;
  };

  // Statement: split into words that light up in turn once it's in view.
  const statement = $('[data-words]');
  const hlFrom = statement.textContent.indexOf('Selfward builds identity.');
  let pos = 0;
  statement.innerHTML = statement.textContent.split(' ').map((w, i) => {
    const hl = pos >= hlFrom && pos < hlFrom + 'Selfward builds identity.'.length;
    pos += w.length + 1;
    return `<span class="w${hl ? ' hl' : ''}" style="--i:${i}">${w}</span>`;
  }).join(' ');

  const heroCopy = $('.hero-copy');
  const heroRange = $('.hero-range');
  const heroVeil = $('.hero-veil');
  const heroHint = $('.scroll-cue');
  const story = $('#story');
  // One snap point in the middle of each step (two on the last: the question, then "Locked in").
  for (const f of [.5, 1.5, 2.5, 3.5, 4.5, 5.2, 5.8]) {
    const mark = document.createElement('i');
    mark.className = 'snap';
    mark.setAttribute('aria-hidden', 'true');
    mark.style.setProperty('--f', f);
    story.append(mark);
  }
  const segs = $$('.seg');
  const keys = $$('.fk');
  const tower = [...$$('.tb')].reverse(); // bottom (routine) first
  const towerStatus = $('#towerStatus');
  const towerText = [
    'Your routine: the anchor',
    'Building: put on my running shoes',
    'Shoes locked in. Now: walk to the corner',
    'Two locked in. Now: run for 10 minutes',
    'A whole morning, one habit at a time',
  ];
  const nav = $('#nav');

  // The phone moves one step at a time and holds each briefly, so a fast scroll
  // still shows every screen instead of jumping from step 2 to step 5.
  const HOLD = reduced ? 0 : 450;
  let storyShown = 0, storyTarget = 0, storyLate = false, storyTimer = null;
  function stepStory() {
    if (storyTimer) return;
    if (storyShown !== storyTarget) storyShown += storyTarget > storyShown ? 1 : -1;
    story.dataset.step = storyShown;
    story.classList.toggle('late', storyShown === 5 && storyTarget === 5 && storyLate);
    if (storyShown !== storyTarget) {
      storyTimer = setTimeout(() => { storyTimer = null; stepStory(); }, HOLD);
    }
  }

  function render() {
    nav.classList.toggle('scrolled', scrollY > 10);
    for (const el of scenes) {
      const p = progress(el);
      if (el.classList.contains('hero')) {
        if (!reduced) {
          heroCopy.style.transform = `translateY(${-p * 160}px)`;
          heroCopy.style.opacity = clamp(1 - p * 1.8);
          heroRange.style.transform = `scale(${1 + p * p * 2.4})`;
        }
        heroVeil.style.opacity = clamp((p - .55) / .45);
        heroHint.style.visibility = p > .02 ? 'hidden' : '';
      } else if (el === story) {
        const f = p * 6;
        storyTarget = Math.min(5, Math.floor(f));
        storyLate = f - 5 > .45;
        stepStory();
      } else if (el.classList.contains('formula-wrap')) {
        const cur = Math.min(3, Math.floor(clamp((p - .05) / .8) * 4));
        const done = p > .9;
        segs.forEach((s, i) => {
          s.classList.toggle('on', i < cur || done);
          s.classList.toggle('cur', i === cur && !done);
        });
        keys.forEach((k, i) => k.classList.toggle('on', i <= cur));
      } else if (el.classList.contains('tower-wrap')) {
        const level = Math.min(4, Math.floor(p * 5));
        tower.forEach((b, i) => {
          if (i === 0) return;
          b.classList.toggle('show', i <= level);
          b.classList.toggle('building', i === level);
          b.classList.toggle('locked', i < level);
        });
        towerStatus.textContent = towerText[level];
      }
    }
  }
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      // Catch a nav that changed height since the last fit (a viewer's header, the safe area settling).
      if (nav.offsetHeight !== fittedNavH) fitPhone();
      render();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { fitPhone(); render(); });

  // Scale the phone to fit short mobile screens.
  // Pinned scenes start below the nav, which is taller when the phone reports a top safe area.
  // The captions box fits its tallest caption, so no step's words run under the nav or into the phone.
  const caps = [...document.querySelectorAll('.cap')];
  let fittedNavH = 0;
  function fitPhone() {
    const navH = nav.offsetHeight;
    fittedNavH = navH;
    document.documentElement.style.setProperty('--nav-h', `${navH}px`);
    const capH = innerWidth < 768 ? Math.max(150, ...caps.map((c) => c.scrollHeight)) : 300;
    story.style.setProperty('--cap-h', `${capH}px`);
    const s = innerWidth < 768 ? clamp((innerHeight - navH - 12 - capH - 32) / 620, .5, .9) : clamp((innerHeight - navH - 48) / 620, .6, 1);
    story.style.setProperty('--phone-scale', s.toFixed(3));
  }
  fitPhone();

  // Play the statement once most of it is on screen.
  new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) { statement.classList.add('play'); obs.disconnect(); }
  }, { threshold: .6 }).observe(statement);

  // If nobody has scrolled a few seconds after the intro, make the cue harder to miss.
  setTimeout(() => { if (scrollY < 10) heroHint.classList.add('urgent'); }, 8000);
  heroHint.addEventListener('click', (e) => {
    e.preventDefault();
    const intro = $('#intro');
    scrollTo({ top: intro.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
  });

  // The nav can grow after load (a viewer's header, the safe area settling); re-fit when it does.
  if ('ResizeObserver' in window) new ResizeObserver(() => fitPhone()).observe(nav, { box: 'border-box' });
  document.fonts?.ready.then(fitPhone);
  render();

  /* ---------- Reveal on enter, and counters ---------- */
  const countUp = (el) => {
    const to = +el.dataset.count;
    if (reduced) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1200;
    const step = (t) => {
      const k = clamp((t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    }
  }, { threshold: .2 });
  $$('.reveal, .card').forEach((el) => io.observe(el));

  /* ---------- Card rail ---------- */
  const rail = $('#rail');
  const [prev, next] = $$('.rail-btn');
  const cardStep = () => {
    const c = $('.card', rail);
    return c.offsetWidth + parseFloat(getComputedStyle(rail).columnGap || 20);
  };
  const updateRail = () => {
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
  };
  $$('.rail-btn').forEach((b) => b.addEventListener('click', () => {
    rail.scrollBy({ left: +b.dataset.dir * cardStep(), behavior: reduced ? 'auto' : 'smooth' });
  }));
  rail.addEventListener('scroll', updateRail, { passive: true });
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      rail.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * cardStep(), behavior: 'smooth' });
    }
  });
  updateRail();

  // Drag to scroll with a mouse; touch uses native scrolling.
  let drag = null;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
    drag = { x: e.clientX, left: rail.scrollLeft, moved: false };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4 && !drag.moved) { drag.moved = true; rail.classList.add('dragging'); }
    if (drag.moved) rail.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    rail.classList.remove('dragging');
    // Settle on the nearest card.
    const s = cardStep();
    rail.scrollTo({ left: Math.round(rail.scrollLeft / s) * s, behavior: 'smooth' });
  });

  /* ---------- Card modal ---------- */
  const modal = $('#modal');
  const modalBody = $('#modalBody');
  let opener = null;
  $$('.card-more-btn').forEach((b) => b.addEventListener('click', () => {
    opener = b;
    modalBody.innerHTML = $('.card-more', b.closest('.card')).innerHTML;
    modal.showModal();
    modal.scrollTop = 0;
  }));
  $('.modal-x').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener('close', () => opener && opener.focus());

  /* ---------- Map hotspots ---------- */
  const HS = {
    peak: ['Every peak is a stack.', 'Each stack of habits becomes its own mountain. Lock in every habit on the way up and the summit is yours.'],
    trail: ['Solid is walked. Dashed is ahead.', 'The amber trail shows habits you’ve locked in. The dashed line is your queue, projected forward at the pace you’ve actually been keeping.'],
    stops: ['Stops are habits.', 'A filled stop is locked in. A glowing ring is the one you’re building now. A hollow stop is up next.'],
    flag: ['The flag is who you’re becoming.', 'The summit isn’t a streak count. It’s “I am a runner.” Every stop on every trail leads there.'],
    eta: ['An honest arrival date.', 'Selfward projects your queue forward, one habit at a time, and tells you when you’ll get there at your current pace. It’s realistic, not a promise to change everything by Friday.'],
    pathway: ['Pathways run alongside.', 'Supporting pathways, like great mobility or deep sleep, get their own trails. Filter the map to see one at a time.'],
  };
  const stage = $('#mapStage');
  const mapScroll = $('#mapScroll');
  const pop = $('#pop');
  const popTitle = $('#popTitle');
  const popBody = $('#popBody');
  const spots = $$('.hotspot');
  const pills = $$('.map-pills button');
  let openKey = null;

  function closePop() {
    pop.hidden = true;
    spots.forEach((s) => s.setAttribute('aria-expanded', 'false'));
    pills.forEach((p) => p.classList.remove('on'));
    openKey = null;
  }
  function openPop(key, focus) {
    if (openKey === key) { closePop(); return; }
    const spot = $(`.hotspot[data-hs="${key}"]`);
    closePop();
    openKey = key;
    spot.setAttribute('aria-expanded', 'true');
    pills.forEach((p) => p.classList.toggle('on', p.dataset.hs === key));
    [popTitle.textContent, popBody.textContent] = HS[key];
    pop.hidden = false;
    if (innerWidth >= 768) {
      const sw = stage.clientWidth, sh = stage.clientHeight;
      const x = spot.offsetLeft, y = spot.offsetTop;
      const pw = pop.offsetWidth, ph = pop.offsetHeight;
      const left = x + 30 + pw < sw ? x + 30 : x - 30 - pw;
      pop.style.left = `${clamp(left, 12, sw - pw - 12)}px`;
      pop.style.top = `${clamp(y - 30, 12, sh - ph - 12)}px`;
    } else {
      // Bring the spot into view in the scrollable map.
      mapScroll.scrollTo({ left: spot.offsetLeft - mapScroll.clientWidth / 2, behavior: 'smooth' });
    }
    if (focus) $('.pop-x', pop).focus();
  }
  spots.forEach((s) => s.addEventListener('click', (e) => { e.stopPropagation(); openPop(s.dataset.hs, e.detail === 0); }));
  pills.forEach((p) => p.addEventListener('click', (e) => { e.stopPropagation(); openPop(p.dataset.hs, false); }));
  $('.pop-x', pop).addEventListener('click', () => {
    const k = openKey;
    closePop();
    if (k) $(`.hotspot[data-hs="${k}"]`).focus();
  });
  pop.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => openKey && closePop());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && openKey) closePop(); });

  // Start the phone-width map centred on the tallest peak.
  if (mapScroll.scrollWidth > mapScroll.clientWidth) {
    mapScroll.scrollLeft = (mapScroll.scrollWidth - mapScroll.clientWidth) / 2;
  }
})();
