/* ============================================================
 * Oracle Study Guide — app.js
 * State management, hash routing, data loading, page renders.
 * Routes:
 *   #home                → learning portal (hero + topics + how it works)
 *   #topic/<id>          → topic detail page
 *   #quiz/<id>           → quiz intro / level pick
 *   #guide/<id>/<level>  → level-matched study guide
 *   #progress            → progress dashboard
 *   #about               → about page
 * ============================================================ */
window.Oracle = window.Oracle || {};

(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────── */
  const state = {
    topics: [],           // from data/topics.json
    topicData: {},        // id → full topic object (cached)
    level: 'beginner'     // last-used guide level
  };
  Oracle.state = state;

  /* ── Small helpers ──────────────────────────────────────── */
  function esc(s) { return Oracle.esc(s); }

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load ' + url);
    return res.json();
  }

  /** Load & cache the topic list */
  Oracle.loadTopics = async function (force) {
    if (state.topics.length && !force) return state.topics;
    const data = await fetchJSON('data/topics.json');
    state.topics = data.topics || [];
    return state.topics;
  };

  /** Load & cache a single topic's full content (levels, quiz, glossary) */
  Oracle.loadTopic = async function (id, force) {
    if (state.topicData[id] && !force) return state.topicData[id];
    const data = await fetchJSON('data/' + encodeURIComponent(id) + '.json');
    state.topicData[id] = data.topic;
    return data.topic;
  };

  /** Metadata for a topic id (falls back gracefully) */
  Oracle.getTopic = function (id) {
    return state.topics.find(t => t.id === id) || { id, name: id, icon: '📘', description: '' };
  };

  Oracle.renderError = function (main, msg) {
    main.innerHTML = `
      <div class="fade-in max-w-xl mx-auto text-center py-16">
        <div class="text-5xl mb-4">🤔</div>
        <h1 class="font-display text-2xl font-600 text-white mb-2">Something went wrong</h1>
        <p class="text-slate-400 text-sm mb-6">${esc(msg)}</p>
        <a href="#home" class="inline-block px-6 py-3 rounded-xl bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">Back to home</a>
      </div>`;
  };

  /* ── Router ─────────────────────────────────────────────── */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    return { page: parts[0] || 'home', args: parts.slice(1) };
  }

  function setActiveNav(page) {
    document.querySelectorAll('[data-nav]').forEach(a => {
      const active = a.dataset.nav === page;
      a.classList.toggle('text-teal', active);
      a.classList.toggle('bg-teal/10', active);
      a.classList.toggle('text-slate-300', !active && !a.classList.contains('text-teal'));
    });
  }

  async function route() {
    const { page, args } = parseHash();
    const main = document.getElementById('app');
    setActiveNav(page);
    window.scrollTo({ top: 0 });
    document.getElementById('mobile-nav').classList.add('hidden');

    try {
      switch (page) {
        case 'topic':
          if (!args[0]) return route();
          await renderTopic(main, args[0]);
          break;
        case 'quiz':
          if (!args[0]) return route();
          await Oracle.renderQuiz(main, args[0]);
          break;
        case 'guide':
          if (!args[0]) return route();
          state.level = args[1] || state.level;
          await Oracle.renderGuide(main, args[0], args[1]);
          break;
        case 'progress':
          await loadTopicsIfNeeded();
          Oracle.renderProgress(main);
          break;
        case 'about':
          renderAbout(main);
          break;
        case 'home':
        default:
          await renderHome(main);
          break;
      }
    } catch (e) {
      console.error('Route error:', e);
      Oracle.renderError(main, 'Could not load that page. The topic data may not exist yet — try another topic.');
    }
  }

  async function loadTopicsIfNeeded() {
    try { await Oracle.loadTopics(); } catch (e) { /* topics list already empty */ }
  }

  /* ── Home page ──────────────────────────────────────────── */
  async function renderHome(main) {
    document.title = 'Oracle Study Guide — Learn anything, free';
    await loadTopicsIfNeeded();

    const stats = Oracle.progressStats();

    let cards = '';
    for (const t of state.topics) {
      const best = Oracle.store.bestScore(t.id);
      cards += `
        <a href="#topic/${encodeURIComponent(t.id)}"
           class="card-hover group rounded-2xl border border-white/10 bg-navy-2/70 p-6 shadow-card">
          <div class="flex items-start justify-between mb-3">
            <span class="grid place-items-center w-14 h-14 rounded-2xl bg-teal/10 border border-teal/25 text-3xl transition-transform group-hover:scale-110">${esc(t.icon)}</span>
            ${best ? `<span class="text-xs font-semibold ${Oracle.BAND_META[best.band].color}">${Oracle.BAND_META[best.band].emoji} best ${best.score}/${best.total}</span>` : ''}
          </div>
          <h3 class="font-display text-lg font-600 text-white mb-1.5 group-hover:text-teal transition-colors">${esc(t.name)}</h3>
          <p class="text-sm text-slate-400 leading-relaxed mb-4">${esc(t.description)}</p>
          <div class="flex flex-wrap gap-1.5 mb-5">
            ${(t.subtopics || []).map(s => `<span class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-400">${esc(s)}</span>`).join('')}
          </div>
          <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-teal">Start learning <span class="transition-transform group-hover:translate-x-1">→</span></span>
        </a>`;
    }

    main.innerHTML = `
      <div class="fade-in space-y-14">
        <!-- Hero -->
        <section class="text-center pt-6 sm:pt-12 pb-2 relative">
          <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-[560px] h-[280px] bg-teal/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div class="relative">
            <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal/30 bg-teal/10 text-teal text-xs font-semibold mb-6">
              ✨ Free forever · No sign-up · No paywall
            </span>
            <h1 class="font-display text-4xl sm:text-6xl font-700 text-white leading-tight text-glow max-w-3xl mx-auto">
              Learn anything,<br class="hidden sm:block" /> <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal to-gold">at your level.</span>
            </h1>
            <p class="text-slate-300 mt-5 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg">
              Pick a topic, take a short friendly quiz, and Oracle builds you a study guide
              that fits exactly where you are — beginner, intermediate, or advanced. 🎯
            </p>
            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#home" data-scroll="topics" class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal text-navy font-bold shadow-glow hover:bg-teal/90 transition">Browse topics ↓</a>
              <a href="#about" class="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/15 text-slate-200 font-semibold hover:bg-white/5 transition">How it works</a>
            </div>
            ${stats.quizzesTaken ? `
            <div class="mt-10 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-navy-2/70 px-6 py-4 text-sm">
              <span>🎯 <span class="font-bold text-white">${stats.quizzesTaken}</span> <span class="text-slate-400">quizzes taken</span></span>
              <span class="text-slate-600">·</span>
              <span>🗂️ <span class="font-bold text-white">${stats.topicsCompleted}</span> <span class="text-slate-400">topics started</span></span>
              <span class="text-slate-600">·</span>
              <a href="#progress" class="text-teal font-semibold hover:underline">View progress →</a>
            </div>` : ''}
          </div>
        </section>

        <!-- Topics -->
        <section id="topics" class="scroll-mt-24">
          <div class="flex items-end justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 class="font-display text-2xl sm:text-3xl font-700 text-white">Choose a topic</h2>
              <p class="text-slate-400 text-sm mt-1">Every topic has a quiz and a level-matched study guide.</p>
            </div>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">${cards}</div>
        </section>

        <!-- How it works -->
        <section>
          <h2 class="font-display text-2xl sm:text-3xl font-700 text-white text-center mb-8">How it works</h2>
          <div class="grid sm:grid-cols-3 gap-5">
            ${[
              ['1', '🎯', 'Take a short quiz', '10 friendly questions, instant feedback — no grades, no pressure.'],
              ['2', '📊', 'Find your level', 'Your score places you as beginner, intermediate, or advanced.'],
              ['3', '📖', 'Get your guide', 'A study guide built for your level: concepts, examples, pitfalls, exercises.']
            ].map(([n, e, t, d]) => `
              <div class="print-block relative rounded-2xl border border-white/10 bg-navy-2/70 p-6 pt-8">
                <span class="absolute -top-4 left-6 grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-teal to-gold text-navy font-bold text-sm">${n}</span>
                <div class="text-3xl mb-3">${e}</div>
                <h3 class="font-display font-600 text-white mb-1.5">${t}</h3>
                <p class="text-sm text-slate-400 leading-relaxed">${d}</p>
              </div>`).join('')}
          </div>
        </section>
      </div>`;
  }

  /* ── Topic page ─────────────────────────────────────────── */
  async function renderTopic(main, id) {
    const meta = Oracle.getTopic(id);
    let topic;
    try { topic = await Oracle.loadTopic(id); }
    catch (e) { return Oracle.renderError(main, 'This topic is coming soon — no content yet.'); }

    document.title = `${meta.name} — Oracle Study Guide`;
    const best = Oracle.store.bestScore(id);
    const hasQuiz = topic.quiz && Object.keys(topic.quiz).some(k => (topic.quiz[k] || []).length >= 10);
    const hasGuide = topic.levels && Object.keys(topic.levels).length > 0;

    main.innerHTML = `
      <div class="fade-in max-w-4xl mx-auto space-y-8">
        <a href="#home" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal transition">← All topics</a>

        <header class="rounded-3xl border border-white/10 bg-gradient-to-br from-navy-2 to-navy-3 p-8 sm:p-10 relative overflow-hidden">
          <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal/10 blur-3xl pointer-events-none"></div>
          <div class="relative">
            <div class="text-5xl mb-4">${esc(meta.icon)}</div>
            <h1 class="font-display text-3xl sm:text-4xl font-700 text-white text-glow">${esc(topic.title || meta.name)}</h1>
            <p class="text-slate-300 mt-3 max-w-2xl leading-relaxed">${esc(topic.description || meta.description)}</p>
            ${topic.focus ? `<p class="text-xs uppercase tracking-widest text-gold font-semibold mt-4">Focus · ${esc(topic.focus)}</p>` : ''}
            ${best ? `<div class="mt-4 inline-flex items-center gap-2 text-sm text-gold bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5">🏆 Best score: ${best.score}/${best.total} ${Oracle.bandBadge(best.band)}</div>` : ''}
          </div>
        </header>

        <div class="grid sm:grid-cols-2 gap-4">
          <a href="#quiz/${encodeURIComponent(id)}" class="card-hover rounded-2xl border border-teal/30 bg-teal/[.06] p-6 ${hasQuiz ? '' : 'pointer-events-none opacity-50'}">
            <div class="text-3xl mb-3">🎯</div>
            <h2 class="font-display font-600 text-white text-lg mb-1">Take the quiz</h2>
            <p class="text-sm text-slate-400 leading-relaxed">${hasQuiz ? '10 quick questions to find your level — with instant feedback on every answer.' : 'Quiz coming soon.'}</p>
            <span class="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-teal">${hasQuiz ? 'Start →' : 'Soon'}</span>
          </a>
          <a href="#guide/${encodeURIComponent(id)}/beginner" class="card-hover rounded-2xl border border-gold/30 bg-gold/[.05] p-6 ${hasGuide ? '' : 'pointer-events-none opacity-50'}">
            <div class="text-3xl mb-3">📖</div>
            <h2 class="font-display font-600 text-white text-lg mb-1">Read the study guide</h2>
            <p class="text-sm text-slate-400 leading-relaxed">${hasGuide ? 'Concepts, examples, pitfalls, and exercises — matched to your level.' : 'Guide coming soon.'}</p>
            <span class="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-gold">${hasGuide ? 'Open →' : 'Soon'}</span>
          </a>
        </div>

        ${topic.subtopics && topic.subtopics.length ? `
        <section>
          <h2 class="font-display text-xl font-600 text-white mb-4">What\u2019s inside</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            ${topic.subtopics.map(s => `
              <div class="rounded-xl border border-white/10 bg-navy-2/60 px-5 py-4 flex items-center gap-3">
                <span class="w-2 h-2 rounded-full bg-teal shrink-0"></span>
                <span class="text-sm text-slate-200">${esc(s)}</span>
              </div>`).join('')}
          </div>
        </section>` : ''}

        ${topic.levels ? `
        <section>
          <h2 class="font-display text-xl font-600 text-white mb-4">Levels available</h2>
          <div class="grid sm:grid-cols-3 gap-3">
            ${Object.entries(topic.levels).map(([key, lvl]) => `
              <a href="#guide/${encodeURIComponent(id)}/${key}" class="rounded-xl border border-white/10 bg-navy-2/60 p-4 hover:border-teal/40 hover:bg-navy-2 transition">
                <div class="font-semibold text-white text-sm capitalize">${Oracle.BAND_META[key] ? Oracle.BAND_META[key].emoji + ' ' : ''}${key}</div>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">${esc(lvl.tagline || '')}</p>
              </a>`).join('')}
          </div>
        </section>` : ''}
      </div>`;
  }

  /* ── About page ─────────────────────────────────────────── */
  function renderAbout(main) {
    document.title = 'About — Oracle Study Guide';
    main.innerHTML = `
      <div class="fade-in max-w-3xl mx-auto space-y-8">
        <header class="text-center pt-4">
          <div class="text-6xl mb-4">📚</div>
          <h1 class="font-display text-3xl sm:text-4xl font-700 text-white text-glow">Why Oracle Study Guide?</h1>
          <p class="text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">Because the best way to learn anything is to start where you are — not where a one-size-fits-all course thinks you should be.</p>
        </header>

        <section class="grid sm:grid-cols-2 gap-4">
          ${[
            ['🎯', 'Adaptive by design', 'A quick quiz places you at the right level, and your study guide adapts to it.'],
            ['🆓', 'Free, forever', 'No accounts, no paywalls, no ads. Everything runs right in your browser.'],
            ['🔒', 'Private by default', 'Your progress is stored only in your own browser — we never see it.'],
            ['📱', 'Works everywhere', 'Mobile-first, print-friendly, and it ships as plain static files.'],
            ['🧩', 'Open by nature', 'New topics are simple JSON files. Add one, and the whole app adapts.'],
            ['🖨️', 'Study anywhere', 'Take your guide to the printer or PDF — study guides are print-friendly.']
          ].map(([e, t, d]) => `
            <div class="print-block rounded-2xl border border-white/10 bg-navy-2/70 p-6">
              <div class="text-2xl mb-3">${e}</div>
              <h3 class="font-display font-600 text-white mb-1.5">${t}</h3>
              <p class="text-sm text-slate-400 leading-relaxed">${d}</p>
            </div>`).join('')}
        </section>

        <section class="rounded-2xl border border-white/10 bg-navy-2/60 p-6">
          <h2 class="font-display font-600 text-white mb-2">A note on accuracy</h2>
          <p class="text-sm text-slate-400 leading-relaxed">
            Content is researched and written to be accurate, but it is educational material — not legal, financial, or medical advice.
            Laws and data change; always confirm with official sources for decisions that matter.
          </p>
        </section>

        <section class="rounded-2xl border border-white/10 bg-navy-2/60 p-6">
          <h2 class="font-display font-600 text-white mb-2">Built with</h2>
          <div class="flex flex-wrap gap-2">
            ${['Plain HTML5', 'Tailwind CSS', 'Vanilla JavaScript', 'JSON content', 'GitHub Pages'].map(t => `<span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">${t}</span>`).join('')}
          </div>
          <p class="text-xs text-slate-500 mt-4">No frameworks. No trackers. No cookies.</p>
        </section>

        <div class="text-center">
          <a href="#home" data-scroll="topics" class="inline-block px-8 py-3.5 rounded-xl bg-teal text-navy font-bold shadow-glow hover:bg-teal/90 transition">Pick a topic and start 🚀</a>
        </div>
      </div>`;
  }

  /* ── Mobile nav toggle ──────────────────────────────────── */
  function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    toggle.addEventListener('click', () => mobileNav.classList.toggle('hidden'));

    // Smooth-scroll "Topics" links when already on home
    document.querySelectorAll('[data-scroll]').forEach(a => {
      a.addEventListener('click', function (e) {
        const targetId = this.dataset.scroll;
        const target = () => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        const onHome = ['', '#', '#home'].includes(location.hash);
        if (onHome) { e.preventDefault(); target(); }
        else {
          location.hash = '#home';
          setTimeout(target, 400);
        }
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    initNav();
    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();