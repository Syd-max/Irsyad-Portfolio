/* Complete animation & interaction engine ============================================================ */

(function () {
  'use strict';

  /* Feature Detection ---- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* DOM Cache ---- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  /* Utility ---- */
  function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function randInt(a, b) { return Math.floor(rand(a, b)); }
  function pick(arr) { return arr[randInt(0, arr.length)]; }

  /* 1. LOADER ============================================================ */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    if (prefersReducedMotion) {
      loader.classList.add('is-done');
      return;
    }
    setTimeout(() => {
      loader.classList.add('is-done');
      startHeroSequence();
    }, 1600);
  }

  /* 2. CUSTOM CURSOR ============================================================ */
  let cursorX = -100, cursorY = -100;
  let ringX = -100, ringY = -100;

  function initCursor() {
    if (!hasPointer || prefersReducedMotion) return;

    const cursor = $('#cursor');
    const dot = cursor ? $('.cursor-dot', cursor) : null;
    const ring = cursor ? $('.cursor-ring', cursor) : null;
    const textEl = cursor ? $('.cursor-text', cursor) : null;
    if (!cursor || !dot || !ring) return;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    });

    function updateCursor() {
      ringX = lerp(ringX, cursorX, 0.12);
      ringY = lerp(ringY, cursorY, 0.12);
      dot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    /* hover targets */
    const hoverTargets = $$('[data-cursor]');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hovering');
        if (textEl) textEl.textContent = el.getAttribute('data-cursor') || '';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hovering');
        if (textEl) textEl.textContent = '';
      });
    });

    /* magnetic buttons */
    const magnetics = $$('.magnetic');
    magnetics.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.25;
        const dy = (e.clientY - cy) * 0.25;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* 3. NAVIGATION & SCROLL STATE ============================================================ */
  function initNav() {
    const nav = $('#nav');
    const toggle = $('#navToggle');
    const links = $('#navLinks');
    if (!nav) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 50) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
      lastScroll = y;
    }, { passive: true });

    /* Toggle */
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('is-open');
        toggle.classList.toggle('is-active');
        toggle.setAttribute('aria-expanded', isOpen);
      });

      $$('.nav-link', links).forEach((link) => {
        link.addEventListener('click', () => {
          links.classList.remove('is-open');
          toggle.classList.remove('is-active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = $(targetId);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* 4. HERO ANIMATION (TETRIS BLOCKS) ============================================================ */
  const SHAPES = [
    { cells: [[0,0],[1,0],[2,0],[3,0]], cols: 4, rows: 1, name: 'I' },
    { cells: [[0,0],[0,1],[1,0],[1,1]], cols: 2, rows: 2, name: 'O' },
    { cells: [[0,1],[1,0],[1,1],[1,2]], cols: 3, rows: 2, name: 'T' },
    { cells: [[0,0],[1,0],[1,1],[1,2]], cols: 3, rows: 2, name: 'L' },
    { cells: [[0,2],[1,0],[1,1],[1,2]], cols: 3, rows: 2, name: 'J' },
    { cells: [[0,1],[0,2],[1,0],[1,1]], cols: 3, rows: 2, name: 'S' },
    { cells: [[0,0],[0,1],[1,1],[1,2]], cols: 3, rows: 2, name: 'Z' },
  ];
  const COLORS = ['violet', 'lime', 'amber', 'metal'];
  const CELL_SIZE = 20;

  function createBlock(container, shape, x, y, color, delay) {
    const block = document.createElement('div');
    block.className = 'hero-block';
    block.setAttribute('data-color', color);
    block.style.gridTemplateColumns = `repeat(${shape.cols}, ${CELL_SIZE}px)`;
    block.style.gridTemplateRows = `repeat(${shape.rows}, ${CELL_SIZE}px)`;

    const startY = -(100 + rand(50, 300));
    const rotation = pick([0, 90, 180, 270]);
    block.style.left = x + 'px';
    block.style.top = startY + 'px';
    block.style.transform = `rotate(${rotation}deg)`;

    const totalCells = shape.cols * shape.rows;
    const filledSet = new Set(shape.cells.map(([r, c]) => r * shape.cols + c));
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'hero-block-cell' + (filledSet.has(i) ? ' filled' : '');
      if (!filledSet.has(i)) {
        cell.style.border = 'none';
        cell.style.background = 'transparent';
      }
      block.appendChild(cell);
    }
    container.appendChild(block);

    const targetRotation = pick([0, 90, 180, 270]);
    setTimeout(() => {
      block.style.top = y + 'px';
      block.style.transform = `rotate(${targetRotation}deg)`;
      block.classList.add('is-placed');
    }, delay);

    return block;
  }

  function initHeroBlocks() {
    const container = $('#heroBlocks');
    if (!container || prefersReducedMotion) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const blocks = [];
    const count = vw < 768 ? 6 : 12;

    for (let i = 0; i < count; i++) {
      const shape = pick(SHAPES);
      const color = pick(COLORS);
      const x = rand(vw * 0.05, vw * 0.9);
      const y = rand(vh * 0.1, vh * 0.85);
      const delay = 1800 + i * 150 + rand(0, 200);
      const block = createBlock(container, shape, x, y, color, delay);
      blocks.push(block);
    }

    let time = 0;
    function ambientFloat() {
      time += 0.005;
      blocks.forEach((block, i) => {
        if (!block.classList.contains('is-placed')) return;
        const offsetY = Math.sin(time + i * 0.7) * 3;
        const offsetX = Math.cos(time * 0.7 + i * 0.5) * 2;
        const baseRotation = parseFloat(block.style.transform.replace(/[^0-9.-]/g, '')) || 0;
        block.style.transform = `rotate(${baseRotation}deg) translate(${offsetX}px, ${offsetY}px)`;
      });
      requestAnimationFrame(ambientFloat);
    }
    setTimeout(() => requestAnimationFrame(ambientFloat), 4000);
  }

  function initHeroChars() {
    const container = $('#heroChars');
    if (!container || prefersReducedMotion) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789∑∆∏λ∞≈≠≤≥÷×'.split('');
    const count = window.innerWidth < 768 ? 10 : 20;

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'hero-char-float';
      span.textContent = pick(chars);
      span.style.left = rand(5, 95) + '%';
      span.style.top = rand(10, 90) + '%';
      span.style.animationDelay = rand(0, 12) + 's';
      span.style.animationDuration = rand(8, 16) + 's';
      container.appendChild(span);
    }
  }

  function startHeroSequence() {
    const grid = $('#heroGrid');
    if (grid) setTimeout(() => grid.classList.add('is-visible'), 200);
    $$('.hero-char').forEach((char, i) => setTimeout(() => char.classList.add('is-revealed'), 600 + i * 120));
    ['.hero-overline', '.hero-subtitle', '.hero-cta'].forEach((sel) => {
      const el = $(sel);
      if (el) setTimeout(() => el.classList.add('is-visible'), 400);
    });
    initHeroBlocks();
    initHeroChars();
  }

  function startHeroImmediate() {
    const grid = $('#heroGrid');
    if (grid) grid.classList.add('is-visible');
    $$('.hero-char').forEach((c) => c.classList.add('is-revealed'));
    $$('.hero-overline, .hero-subtitle, .hero-cta').forEach((el) => el.classList.add('is-visible'));
  }

  /* 5. INTERSECTION OBSERVERS ============================================================ */
  function initObservers() {
    const animElements = $$('[data-animate="fade-up"], [data-animate="reveal"], [data-animate="project-enter"]');
    if (animElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -20px 0px' });

    animElements.forEach((el) => observer.observe(el));

    /* Skills & Transform Step */
    const transformContainer = $('.about-transform');
    if (transformContainer) {
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          $$('.transform-step').forEach(s => s.classList.add('is-visible'));
        }
      }, { threshold: 0.3 }).observe(transformContainer);
    }

    /* Titles */
    $$('.section-title').forEach((title) => {
      if (prefersReducedMotion) return;
      const text = title.textContent;
      title.innerHTML = '';
      title.style.opacity = '0';
      text.split(' ').forEach((word, wi, arr) => {
        const span = document.createElement('span');
        span.style.display = 'inline-block'; span.style.overflow = 'hidden';
        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.display = 'inline-block'; inner.style.transform = 'translateY(100%)';
        inner.style.transition = `transform 0.6s ${wi * 0.08}s var(--ease-out)`;
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

  /* 6. SKILLS INTERACTION ============================================================ */
  const SKILL_VIZ_MAP = {
    'data-analysis': 'SELECT insights FROM raw_data;',
    'sql': 'SELECT * FROM patterns WHERE signal = TRUE;',
    'mysql': 'JOIN datasets ON meaning.id = noise.id;',
    'machine-learning': 'fit(X_train, y_train) → predict(X_test)',
    'classification': 'label(x) → P(class|features) → category',
    'powerbi': 'DAX → interactive dashboard → insights',
    'python': 'import pandas as pd → df.describe()',
    'java': 'public static void solve(Data input) { }',
    'javascript': 'const insight = transform(rawData);',
    'php': '<?php echo process($server_data); ?>',
    'automata': 'L = { w ∈ Σ* | w satisfies pattern }',
    'nfa': 'q0 →ε q1 →a q2 →b q3 [accept]',
    'algorithms': 'O(n log n) → divide → conquer → merge',
    'comp-thinking': 'decompose → abstract → pattern → algorithm',
    'gcloud': 'gcloud compute instances create → deploy',
    'apache': 'VirtualHost *:443 → SSLEngine on → serve',
    'wordpress': 'theme → functions.php → hooks → deploy',
    'figma': 'auto-layout → components → prototype',
    'github': 'git push origin main → CI/CD → live'
  };

  function initSkills() {
    const vizOutput = $('#skillViz');
    $$('.skill-item').forEach((item) => {
      const skill = item.getAttribute('data-skill');
      const vizText = SKILL_VIZ_MAP[skill] || '';
      const showViz = () => { if (vizOutput && vizText) { vizOutput.textContent = vizText; vizOutput.classList.add('is-visible'); } };
      const hideViz = () => { if (vizOutput) vizOutput.classList.remove('is-visible'); };
      item.addEventListener('mouseenter', showViz);
      item.addEventListener('mouseleave', hideViz);
      item.addEventListener('focus', showViz);
      item.addEventListener('blur', hideViz);
    });
  }

  /* 7. POKEMON CARD TILT (CERTIFICATES) ============================================================ */
  function initTiltCards() {
    if (prefersReducedMotion || !hasPointer) return;

    $$('.cert-card').forEach(card => {
      const inner = $('.cert-inner', card);
      const holo = $('.cert-holo', card);
      const glare = $('.cert-glare', card);

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;  
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12; 
        const rotateY = ((x - centerX) / centerX) * 12;

        inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;
        
        if(holo) holo.style.backgroundPosition = `${px}% ${py}%`;
        if(glare) {
          glare.style.transform = `translate(${x - rect.width}px, ${y - rect.height}px)`;
          glare.style.opacity = 0.4;
        }
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        if(holo) holo.style.backgroundPosition = `50% 50%`;
        if(glare) glare.style.opacity = 0;
      });
    });
  }

  /* 8. SCROLL & CIPHER EFFECTS ============================================================ */
  let ticking = false;
  function updateScrollEffects() {
    ticking = false;
    if (prefersReducedMotion) return;

    const scrollY = window.scrollY;

    /* Grid stretch */
    const heroGrid = $('#heroGrid');
    if (heroGrid && scrollY < window.innerHeight) {
      const progress = scrollY / window.innerHeight;
      heroGrid.style.backgroundSize = `${80 + progress * 40}px ${80 + progress * 60}px`;
      heroGrid.style.transform = `translateY(${scrollY * 0.15}px)`;
    }

    /* Cipher Grid removed, handled by CSS animations for smoothness */
  }

  function initCipherDecrypter() {
    const textEl = $('#cipherDecodeText');
    if (!textEl) return;
    
    const stages = ['RAW DATA', 'NOISE', 'PATTERN', 'SIGNAL', 'INSIGHT'];
    let stageIdx = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    setInterval(() => {
      if (prefersReducedMotion) {
        stageIdx = (stageIdx + 1) % stages.length;
        textEl.textContent = stages[stageIdx];
        return;
      }
      
      stageIdx = (stageIdx + 1) % stages.length;
      const target = stages[stageIdx];
      let iterations = 0;
      const maxIters = 12;
      
      const interval = setInterval(() => {
        let res = '';
        for (let i = 0; i < target.length; i++) {
          if (target[i] === ' ') res += ' ';
          else if (iterations >= maxIters) res += target[i];
          else res += chars[Math.floor(Math.random() * chars.length)];
        }
        textEl.textContent = res;
        
        if (iterations >= maxIters) clearInterval(interval);
        iterations++;
      }, 50);
    }, 3500);
  }

  function initCipherTicksAnd3D() {
    const ticksGroup = $('.cipher-ticks');
    if (ticksGroup) {
      for (let i = 0; i < 60; i++) {
        const rad = ((i / 60) * 360 * Math.PI) / 180;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        // Center is 300, 300 in the new viewBox
        line.setAttribute('x1', 300 + 295 * Math.cos(rad));
        line.setAttribute('y1', 300 + 295 * Math.sin(rad));
        line.setAttribute('x2', 300 + 300 * Math.cos(rad));
        line.setAttribute('y2', 300 + 300 * Math.sin(rad));
        ticksGroup.appendChild(line);
      }
    }
    
    const machine = $('#cipherMachine');
    const wrapper = $('#cipher3D');
    
    if (hasPointer && machine && wrapper && !prefersReducedMotion) {
      machine.addEventListener('mousemove', (e) => {
        const rect = machine.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate tilt
        const rotateX = ((y - centerY) / centerY) * -35; 
        const rotateY = ((x - centerX) / centerX) * 35;
        
        wrapper.style.transform = `rotateX(${rotateX + 15}deg) rotateY(${rotateY}deg)`;
      });
      
      machine.addEventListener('mouseleave', () => {
        wrapper.style.transform = `rotateX(15deg) rotateY(0deg)`;
      });
    }
  }

  /* 9. INIT ============================================================ */
  function init() {
    initLoader();
    initCursor();
    initNav();
    initSmoothScroll();
    initObservers();
    initSkills();
    initTiltCards();
    initCipherTicksAnd3D();
    initCipherDecrypter();

    /* Number scramble on projects */
    if (!prefersReducedMotion) {
      $$('.project').forEach(project => {
        const num = $('.project-num', project);
        if (!num) return;
        const orig = num.textContent.trim();
        project.addEventListener('mouseenter', () => {
          let iters = 0;
          const iv = setInterval(() => {
            num.textContent = String(randInt(0, 9)).padStart(2, '0');
            if (++iters >= 6) { clearInterval(iv); num.textContent = orig; }
          }, 60);
        });
      });
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateScrollEffects); ticking = true; }
    }, { passive: true });

    if (prefersReducedMotion) startHeroImmediate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* OPENING SOUNDTRACK (INVISIBLE TRIGGER) ================================================================ */
(function() {
  const openingSound = new Audio('assets/audio/mori_sound-opening-game-502888.mp3');
  openingSound.volume = 0.4; 
  openingSound.loop = false; 

  let hasPlayed = false;

  const playSound = () => {
    if (hasPlayed) return;
    openingSound.play().then(() => {
      hasPlayed = true;
      ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(evt => {
        document.removeEventListener(evt, playSound);
      });
    }).catch(e => {
    });
  };

  window.addEventListener('load', () => {
    openingSound.play().then(() => {
        hasPlayed = true;
    }).catch(e => {
      ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(evt => {
        document.addEventListener(evt, playSound, { once: true, passive: true });
      });
    });
  });
})();
