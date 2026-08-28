/* SYAD PORTFOLIO ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Feature Detection ─────────────────────────────────────────── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* DOM Utilities ─────────────────────────────────────────────── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  /* Math Utilities ────────────────────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b)     { return Math.random() * (b - a) + a; }
  function randInt(a, b)  { return Math.floor(rand(a, b)); }
  function pick(arr)      { return arr[randInt(0, arr.length)]; }

  /* 1. LOADER ══════════════════════════════════════════════════════════════════ */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    if (prefersReducedMotion) {
      loader.classList.add('is-done');
      startHeroImmediate();
      return;
    }
    setTimeout(() => {
      loader.classList.add('is-done');
      startHeroSequence();
    }, 1600);
  }

  /* 2. CUSTOM CURSOR ══════════════════════════════════════════════════════════════════ */
  let cursorX = -100, cursorY = -100;
  let ringX   = -100, ringY   = -100;

  function initCursor() {
    if (!hasPointer || prefersReducedMotion) return;
    const cursor  = $('#cursor');
    const dot     = cursor ? $('.cursor-dot', cursor) : null;
    const ring    = cursor ? $('.cursor-ring', cursor) : null;
    const textEl  = cursor ? $('.cursor-text', cursor) : null;
    if (!cursor || !dot || !ring) return;

    document.addEventListener('mousemove', (e) => { cursorX = e.clientX; cursorY = e.clientY; });

    function updateCursor() {
      ringX = lerp(ringX, cursorX, 0.12);
      ringY = lerp(ringY, cursorY, 0.12);
      dot.style.transform  = `translate(${cursorX}px, ${cursorY}px)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hovering');
        if (textEl) textEl.textContent = el.getAttribute('data-cursor') || '';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hovering');
        if (textEl) textEl.textContent = '';
      });
    });

    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width  / 2) * 0.25;
        const dy = (e.clientY - rect.top  - rect.height / 2) * 0.25;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* 3. NAVIGATION ══════════════════════════════════════════════════════════════════ */
  function initNav() {
    const nav    = $('#nav');
    const toggle = $('#navToggle');
    const links  = $('#navLinks');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 50);
    }, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('is-open');
        toggle.classList.toggle('is-active');
        toggle.setAttribute('aria-expanded', isOpen);
      });
      $$('.nav-link', links).forEach(link => {
        link.addEventListener('click', () => {
          links.classList.remove('is-open');
          toggle.classList.remove('is-active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && links.classList.contains('is-open')) {
          links.classList.remove('is-open');
          toggle.classList.remove('is-active');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* 4. HERO ANIMATION ══════════════════════════════════════════════════════════════════ */
  const SHAPES = [
    { cells: [[0,0],[1,0],[2,0],[3,0]], cols: 4, rows: 1 },
    { cells: [[0,0],[0,1],[1,0],[1,1]], cols: 2, rows: 2 },
    { cells: [[0,1],[1,0],[1,1],[1,2]], cols: 3, rows: 2 },
    { cells: [[0,0],[1,0],[1,1],[1,2]], cols: 3, rows: 2 },
    { cells: [[0,1],[0,2],[1,0],[1,1]], cols: 3, rows: 2 },
  ];
  const COLORS = ['violet', 'lime', 'amber', 'metal'];
  const CELL_SIZE = 20;

  function createBlock(container, shape, x, y, color, delay) {
    const block = document.createElement('div');
    block.className = 'hero-block';
    block.setAttribute('data-color', color);
    block.style.gridTemplateColumns = `repeat(${shape.cols}, ${CELL_SIZE}px)`;
    block.style.gridTemplateRows    = `repeat(${shape.rows}, ${CELL_SIZE}px)`;
    block.style.left = x + 'px';
    block.style.top  = -(100 + rand(50, 300)) + 'px';
    block.style.transform = `rotate(${pick([0, 90, 180, 270])}deg)`;

    const filledSet = new Set(shape.cells.map(([r, c]) => r * shape.cols + c));
    for (let i = 0; i < shape.cols * shape.rows; i++) {
      const cell = document.createElement('div');
      cell.className = 'hero-block-cell' + (filledSet.has(i) ? ' filled' : '');
      if (!filledSet.has(i)) { cell.style.border = 'none'; cell.style.background = 'transparent'; }
      block.appendChild(cell);
    }
    container.appendChild(block);

    const targetRot = pick([0, 90, 180, 270]);
    setTimeout(() => {
      block.style.top = y + 'px';
      block.style.transform = `rotate(${targetRot}deg)`;
      block.classList.add('is-placed');
    }, delay);
    return block;
  }

  function initHeroBlocks() {
    const container = $('#heroBlocks');
    if (!container || prefersReducedMotion) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const count  = vw < 768 ? 5 : 11;
    const blocks = [];
    for (let i = 0; i < count; i++) {
      const shape = pick(SHAPES), color = pick(COLORS);
      const x = rand(vw * 0.05, vw * 0.9);
      const y = rand(vh * 0.1, vh * 0.85);
      blocks.push(createBlock(container, shape, x, y, color, 1800 + i * 150 + rand(0, 200)));
    }
    let t = 0;
    function ambientFloat() {
      t += 0.005;
      blocks.forEach((b, i) => {
        if (!b.classList.contains('is-placed')) return;
        const oy = Math.sin(t + i * 0.7) * 3;
        const ox = Math.cos(t * 0.7 + i * 0.5) * 2;
        const rot = parseFloat(b.style.transform.replace(/[^0-9.-]/g, '')) || 0;
        b.style.transform = `rotate(${rot}deg) translate(${ox}px, ${oy}px)`;
      });
      requestAnimationFrame(ambientFloat);
    }
    setTimeout(() => requestAnimationFrame(ambientFloat), 4000);
  }

  function initHeroChars() {
    const container = $('#heroChars');
    if (!container || prefersReducedMotion) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789∑∆∏λ∞≈≠≤≥÷×'.split('');
    const count  = window.innerWidth < 768 ? 8 : 18;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'hero-char-float';
      span.textContent = pick(chars);
      span.style.left = rand(5, 95) + '%';
      span.style.top  = rand(10, 90) + '%';
      span.style.animationDelay    = rand(0, 12) + 's';
      span.style.animationDuration = rand(8, 16) + 's';
      container.appendChild(span);
    }
  }

  function startHeroSequence() {
    const grid = $('#heroGrid');
    if (grid) setTimeout(() => grid.classList.add('is-visible'), 200);
    ['.hero-overline', '.hero-subtitle', '.hero-cta'].forEach(sel => {
      const el = $(sel);
      if (el) setTimeout(() => el.classList.add('is-visible'), 400);
    });
    initHeroBlocks();
    initHeroChars();
  }

  function startHeroImmediate() {
    const grid = $('#heroGrid');
    if (grid) grid.classList.add('is-visible');
    $$('.hero-overline, .hero-subtitle, .hero-cta').forEach(el => el.classList.add('is-visible'));
  }

  /* 5. INTERSECTION OBSERVERS ══════════════════════════════════════════════════════════════════ */
  function initObservers() {
    const animEls = $$('[data-animate="fade-up"], [data-animate="reveal"], [data-animate="project-enter"]');
    if (!animEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    animEls.forEach(el => observer.observe(el));

    const transformContainer = $('.about-transform');
    if (transformContainer) {
      new IntersectionObserver(entries => {
        if (entries[0].isIntersecting)
          $$('.transform-step').forEach(s => s.classList.add('is-visible'));
      }, { threshold: 0.3 }).observe(transformContainer);
    }

    if (!prefersReducedMotion) {
      $$('.section-title').forEach(title => {
        const text = title.textContent;
        title.innerHTML = '';
        title.style.opacity = '0';
        text.split(' ').forEach((word, wi, arr) => {
          const span  = document.createElement('span');
          const inner = document.createElement('span');
          span.style.cssText  = 'display:inline-block;overflow:hidden;';
          inner.textContent   = word;
          inner.style.cssText = `display:inline-block;transform:translateY(100%);transition:transform 0.65s ${wi * 0.09}s cubic-bezier(0.22,1,0.36,1);`;
          span.appendChild(inner);
          title.appendChild(span);
          if (wi < arr.length - 1) title.appendChild(document.createTextNode('\u00A0'));
        });
        new IntersectionObserver((entries, obs) => {
          if (entries[0].isIntersecting) {
            title.style.opacity = '1';
            $$('span > span', title).forEach(w => w.style.transform = 'translateY(0)');
            obs.disconnect();
          }
        }, { threshold: 0.5 }).observe(title);
      });
    }
  }

  /* 6. SKILLS INTERACTION ══════════════════════════════════════════════════════════════════ */
  const SKILL_VIZ_MAP = {
    'data-analysis':  'SELECT insights FROM raw_data;',
    'sql':            'SELECT * FROM patterns WHERE signal = TRUE;',
    'mysql':          'JOIN datasets ON meaning.id = noise.id;',
    'machine-learning': 'fit(X_train, y_train) → predict(X_test)',
    'classification': 'label(x) → P(class|features) → category',
    'powerbi':        'DAX → interactive dashboard → insights',
    'python':         'import pandas as pd → df.describe()',
    'java':           'public static void solve(Data input) { }',
    'javascript':     'const insight = transform(rawData);',
    'php':            '<?php echo process($server_data); ?>',
    'automata':       'L = { w ∈ Σ* | w satisfies pattern }',
    'nfa':            'q0 →ε q1 →a q2 →b q3 [accept]',
    'algorithms':     'O(n log n) → divide → conquer → merge',
    'comp-thinking':  'decompose → abstract → pattern → algorithm',
    'gcloud':         'gcloud compute instances create → deploy',
    'apache':         'VirtualHost *:443 → SSLEngine on → serve',
    'wordpress':      'theme → functions.php → hooks → deploy',
    'figma':          'auto-layout → components → prototype',
    'github':         'git push origin main → CI/CD → live',
  };

  function initSkills() {
    const vizOutput = $('#skillViz');
    $$('.skill-item').forEach(item => {
      const skill = item.getAttribute('data-skill');
      const text  = SKILL_VIZ_MAP[skill] || '';
      const show = () => { if (vizOutput && text) { vizOutput.textContent = text; vizOutput.classList.add('is-visible'); } };
      const hide = () => { if (vizOutput) vizOutput.classList.remove('is-visible'); };
      item.addEventListener('mouseenter', show);
      item.addEventListener('mouseleave', hide);
      item.addEventListener('focus', show);
      item.addEventListener('blur',  hide);
      item.addEventListener('touchstart', () => {
        if (vizOutput && text) {
          const isVisible = vizOutput.classList.contains('is-visible');
          isVisible ? hide() : show();
        }
      }, { passive: true });
    });
  }

  /* 7. CERTIFICATE HOLOGRAPHIC TILT ══════════════════════════════════════════════════════════════════ */
  function initTiltCards() {
    if (prefersReducedMotion || !hasPointer) return;
    $$('.cert-card').forEach(card => {
      const inner  = $('.cert-inner', card);
      const holo   = $('.cert-holo',  card);
      const glare  = $('.cert-glare', card);

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const cx = rect.width / 2, cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -12, ry = ((x - cx) / cx) * 12;
        inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
        const px = (x / rect.width)  * 100;
        const py = (y / rect.height) * 100;
        if (holo)  holo.style.backgroundPosition = `${px}% ${py}%`;
        if (glare) { glare.style.transform = `translate(${x - rect.width}px, ${y - rect.height}px)`; glare.style.opacity = 0.4; }
      });
      card.addEventListener('mouseleave', () => {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        if (holo)  holo.style.backgroundPosition = '50% 50%';
        if (glare) glare.style.opacity = 0;
      });
    });
  }

  /* 8. SCROLL EFFECTS ══════════════════════════════════════════════════════════════════ */
  let ticking = false;
  function updateScrollEffects() {
    ticking = false;
    if (prefersReducedMotion) return;
    const scrollY  = window.scrollY;
    const heroGrid = $('#heroGrid');
    if (heroGrid && scrollY < window.innerHeight) {
      const p = scrollY / window.innerHeight;
      heroGrid.style.backgroundSize = `${80 + p * 40}px ${80 + p * 60}px`;
      heroGrid.style.transform      = `translateY(${scrollY * 0.15}px)`;
    }
  }

  /* 9. CIPHER MACHINE ══════════════════════════════════════════════════════════════════ */
  function initCipherDecrypter() {
    const textEl = $('#cipherDecodeText');
    if (!textEl) return;
    const stages = ['RAW DATA', 'NOISE', 'PATTERN', 'SIGNAL', 'INSIGHT'];
    const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let stageIdx = 0;

    setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      const target = stages[stageIdx];
      if (prefersReducedMotion) { textEl.textContent = target; return; }
      let iters = 0, maxIters = 12;
      const iv = setInterval(() => {
        let res = '';
        for (let i = 0; i < target.length; i++) {
          if (target[i] === ' ') { res += ' '; continue; }
          res += iters >= maxIters ? target[i] : chars[Math.floor(Math.random() * chars.length)];
        }
        textEl.textContent = res;
        if (++iters > maxIters) clearInterval(iv);
      }, 50);
    }, 3500);
  }

  function initCipherMachine() {
    const ticksGroup = $('.cipher-ticks');
    if (ticksGroup) {
      for (let i = 0; i < 60; i++) {
        const rad = (i / 60 * 360 * Math.PI) / 180;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 300 + 295 * Math.cos(rad));
        line.setAttribute('y1', 300 + 295 * Math.sin(rad));
        line.setAttribute('x2', 300 + 300 * Math.cos(rad));
        line.setAttribute('y2', 300 + 300 * Math.sin(rad));
        line.classList.add('cipher-tick-line');
        ticksGroup.appendChild(line);
      }
    }

    const machine = $('#cipherMachine'), wrapper = $('#cipher3D');
    if (hasPointer && machine && wrapper && !prefersReducedMotion) {
      machine.addEventListener('mousemove', (e) => {
        const rect = machine.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const rx = ((y - rect.height / 2) / rect.height / 2) * -35;
        const ry = ((x - rect.width  / 2) / rect.width  / 2) * 35;
        wrapper.style.transform = `rotateX(${rx + 15}deg) rotateY(${ry}deg)`;
      });
      machine.addEventListener('mouseleave', () => {
        wrapper.style.transform = 'rotateX(15deg) rotateY(0deg)';
      });
    }
  }

  /* 10. PROJECT NUMBER SCRAMBLE ══════════════════════════════════════════════════════════════════ */
  function initProjectScramble() {
    if (prefersReducedMotion) return;
    $$('.project').forEach(project => {
      const num = $('.project-num', project);
      if (!num) return;
      const orig = num.textContent.trim();
      project.addEventListener('mouseenter', () => {
        let iters = 0;
        const iv = setInterval(() => {
          num.textContent = String(randInt(0, 99)).padStart(2, '0');
          if (++iters >= 6) { clearInterval(iv); num.textContent = orig; }
        }, 60);
      });
    });
  }

  /* 11. MUSIC — hidden auto-play on first interaction ══════════════════════════════════════════════════════════════════ */
  function initMusicPlayer() {
    const audio = new Audio('assets/audio/mori_sound-opening-game-502888.mp3');
    audio.volume = 0.4;
    audio.loop   = false;

    function tryPlay() { audio.play().catch(() => {}); }

    window.addEventListener('load', () => {
      audio.play().catch(() => {
        const unlock = () => {
          tryPlay();
          ['click','keydown','touchstart','mousemove','scroll'].forEach(ev =>
            document.removeEventListener(ev, unlock));
        };
        ['click','keydown','touchstart','mousemove','scroll'].forEach(ev =>
          document.addEventListener(ev, unlock, { once: true, passive: true }));
      });
    });
  }

  /* INIT ══════════════════════════════════════════════════════════════════ */
  function init() {
    initLoader();
    initCursor();
    initNav();
    initSmoothScroll();
    initObservers();
    initSkills();
    initTiltCards();
    initCipherMachine();
    initCipherDecrypter();
    initProjectScramble();
    initMusicPlayer();

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateScrollEffects); ticking = true; }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
