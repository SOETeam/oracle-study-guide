/* ============================================================
 * Oracle Study Guide — private.js
 * Passphrase-protected study area (#private/court-prep).
 * Entry: hidden "Sophi" link at the bottom of the page.
 *
 * Exposes: Oracle.private
 *   .isUnlocked()          — has a valid passphrase been entered?
 *   .openModal()           — show the passphrase modal
 *   .closeModal(force)     — hide the passphrase modal
 *   .exitPrivateMode()     — restore public shell when leaving #private/*
 *   .handleRoute(main,args)— route handler for #private/<module>
 *   .recordQuiz(score)     — persist best quiz score
 * ============================================================ */
window.Oracle = window.Oracle || {};

(function () {
  'use strict';

  /* ── Passphrase (casual obfuscation only — not security) ── */
  const PASS = 'so mote it be';
  const PASS_HASH = (function () { try { return btoa(PASS); } catch (e) { return ''; } })();
  const AUTH_KEY = 'oracle.private.auth.v1';
  const PROGRESS_KEY = 'oracle.private.progress.v1';

  const esc = function (s) { return Oracle.esc(s); };

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load ' + url);
    return res.json();
  }

  /* ── Auth ───────────────────────────────────────────────── */
  function isUnlocked() {
    try { return localStorage.getItem(AUTH_KEY) === PASS_HASH; } catch (e) { return false; }
  }

  function unlock() {
    try { localStorage.setItem(AUTH_KEY, PASS_HASH); } catch (e) { /* private mode */ }
  }

  function lock() {
    try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
  }

  /* ── Private progress store ─────────────────────────────── */
  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      if (raw && typeof raw === 'object') {
        return {
          sections: Array.isArray(raw.sections) ? raw.sections : [],
          quizBest: typeof raw.quizBest === 'number' ? raw.quizBest : 0
        };
      }
    } catch (e) { /* corrupted — start fresh */ }
    return { sections: [], quizBest: 0 };
  }

  function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
  }

  Oracle.private = {};
  Oracle.private.isUnlocked = isUnlocked;

  /** Persist best quiz score */
  Oracle.private.recordQuiz = function (score) {
    const p = loadProgress();
    if (score > p.quizBest) { p.quizBest = score; saveProgress(p); }
  };

  /* ── Passphrase modal ───────────────────────────────────── */
  Oracle.private.openModal = function () {
    const modal = document.getElementById('pass-modal');
    if (!modal) return;
    if (isUnlocked()) {            // already in — skip the door
      if (!location.hash.startsWith('#private/')) location.hash = '#private/court-prep';
      else Oracle.private.handleRoute(document.getElementById('app'), ['court-prep']);
      return;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const err = document.getElementById('pass-error');
    if (err) err.classList.add('hidden');
    const input = document.getElementById('pass-input');
    if (input) { input.value = ''; setTimeout(() => input.focus(), 80); }
  };

  Oracle.private.closeModal = function (force) {
    const modal = document.getElementById('pass-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  function submitPass() {
    const input = document.getElementById('pass-input');
    const err = document.getElementById('pass-error');
    const val = (input.value || '').trim().toLowerCase();
    let ok = false;
    try { ok = btoa(val) === PASS_HASH; } catch (e) {}
    if (ok) {
      unlock();
      Oracle.private.closeModal(true);
      if (location.hash.replace(/^#\/?/, '').startsWith('private/')) {
        Oracle.private.handleRoute(document.getElementById('app'), ['court-prep']);
      } else {
        location.hash = '#private/court-prep';
      }
    } else {
      if (err) {
        err.textContent = 'Access denied';
        err.classList.remove('hidden');
      }
      const card = document.getElementById('pass-card');
      if (card) {
        card.classList.remove('shake');
        void card.offsetWidth;                 // restart the animation
        card.classList.add('shake');
      }
      if (input) input.select();
    }
  }

  /* ── Public shell management ────────────────────────────── */
  Oracle.private.exitPrivateMode = function () {
    const main = document.getElementById('app');
    const area = document.getElementById('private-area');
    if (main) main.classList.remove('hidden');
    if (area) { area.classList.add('hidden'); area.innerHTML = ''; }
    Oracle.private.closeModal(true);
  };

  /* ── Locked placeholder ─────────────────────────────────── */
  function renderLocked(area) {
    area.innerHTML = `
      <div class="fade-in max-w-md mx-auto text-center py-16">
        <div class="text-5xl mb-5">🔒</div>
        <h1 class="font-display text-2xl font-700 text-white mb-2">This area is private</h1>
        <p class="text-slate-400 text-sm leading-relaxed mb-8">A passphrase is required to enter.</p>
        <button id="unlock-cta" class="px-7 py-3 rounded-xl bg-teal text-navy font-bold text-sm shadow-glow hover:bg-teal/90 transition">
          Enter passphrase
        </button>
      </div>`;
    area.querySelector('#unlock-cta').addEventListener('click', () => Oracle.private.openModal());
  }

  /* ── Route handler (#private/*) ─────────────────────────── */
  Oracle.private.handleRoute = async function (main, args) {
    const area = document.getElementById('private-area');
    if (!args[0]) { location.hash = '#home'; return; }
    if (!area) return;

    // Enter private mode: hide public shell, show private area
    main.classList.add('hidden');
    area.classList.remove('hidden');

    if (!isUnlocked()) {
      renderLocked(area);
      Oracle.private.openModal();
      return;
    }

    try {
      const data = await fetchJSON('data/court-prep.json');
      renderModule(area, data);
    } catch (e) {
      console.error('Private module error:', e);
      area.innerHTML = `
        <div class="fade-in max-w-xl mx-auto text-center py-16">
          <div class="text-5xl mb-4">🤔</div>
          <h1 class="font-display text-2xl font-600 text-white mb-2">Something went wrong</h1>
          <p class="text-slate-400 text-sm mb-6">Could not load the private study module.</p>
          <a href="#home" class="inline-block px-6 py-3 rounded-xl bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">Back to home</a>
        </div>`;
    }
  };

  /* ── Content helpers ────────────────────────────────────── */
  function toBullets(text) {
    return String(text || '')
      .split(/\.\s+|;\s+|\n+/)
      .map(s => s.replace(/^['"“”\s]+/, '').replace(/['"“”\s]+$/, ''))
      .map(s => s.trim())
      .filter(Boolean);
  }

  function sectionBullets(title, content) {
    let mark = '›';
    let markClass = 'text-teal';
    if (title === 'What to Say') { mark = '✓'; markClass = 'text-emerald-400'; }
    if (title === 'What NOT to Say') { mark = '✗'; markClass = 'text-danger'; }
    return toBullets(content)
      .map(s => `<li class="flex gap-2.5 leading-relaxed"><span class="${markClass} font-bold shrink-0 mt-0.5">${mark}</span><span class="${title === 'What NOT to Say' ? 'text-red-200/90' : (title === 'What to Say' ? 'text-emerald-100/90' : 'text-slate-200')}">${Oracle.markdownLinks ? Oracle.markdownLinks(esc(s)) : esc(s)}</span></li>`)
      .join('');
  }

  function progressBarHtml(progress, total, quizTotal) {
    const reviewed = Math.min(progress.sections.length, total);
    const pct = total ? Math.round((reviewed / total) * 100) : 0;
    return `
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span class="text-slate-300">📖 <span class="font-bold text-white">${reviewed}/${total}</span> sections reviewed</span>
        <span class="text-slate-300">🎯 Best quiz: <span class="font-bold text-gold">${progress.quizBest}/${quizTotal}</span></span>
        <button id="reset-private-progress" class="text-xs text-slate-500 hover:text-danger transition">Reset progress</button>
      </div>
      <div class="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-500" style="width:${pct}%"></div>
      </div>`;
  }

  /* ── Module page ────────────────────────────────────────── */
  function renderModule(area, data) {
    document.title = (data.title || 'Private Study') + ' — Oracle Study Guide';
    const progress = loadProgress();
    const quizTotal = (data.quiz || []).length;

    const sectionsHtml = (data.sections || []).map((s, i) => `
      <details data-section="${i}" class="group rounded-2xl border border-white/10 bg-navy-2/70 overflow-hidden">
        <summary class="cursor-pointer select-none flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-white/5 transition list-none">
          <div class="flex items-center gap-3 min-w-0">
            <span class="grid place-items-center w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 font-display font-bold text-teal text-sm shrink-0">${i + 1}</span>
            <span class="font-display font-600 text-white text-sm sm:text-base">${esc(s.title)}</span>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </summary>
        <div class="px-5 sm:px-6 pb-5">
          <ul class="space-y-2 text-sm">${sectionBullets(s.title, s.content)}</ul>
        </div>
      </details>`).join('');

    area.innerHTML = `
      <div class="fade-in space-y-8">
        <!-- Top bar -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <a href="#home" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal transition">← Home</a>
          <div class="flex items-center gap-2">
            <button id="print-sheet-btn" class="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/15 text-slate-200 hover:border-teal/50 hover:text-teal transition">🖨️ Print quick reference</button>
            <button id="lock-btn" class="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/15 text-slate-400 hover:border-danger/50 hover:text-danger transition">🔒 Lock</button>
          </div>
        </div>

        <!-- Header -->
        <header class="rounded-3xl border border-white/10 bg-gradient-to-br from-navy-2 to-navy-3 p-7 sm:p-10 relative overflow-hidden">
          <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal/10 blur-3xl pointer-events-none"></div>
          <div class="relative">
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="px-3 py-1 rounded-full text-[11px] font-semibold border border-teal/40 bg-teal/10 text-teal">🔐 Private</span>
              <span class="px-3 py-1 rounded-full text-[11px] font-semibold border border-white/15 bg-white/5 text-slate-300">⚖️ 74th District Court · Bay City</span>
              <span class="px-3 py-1 rounded-full text-[11px] font-semibold border border-gold/40 bg-gold/10 text-gold">📅 Mon, Aug 10 · 9:30 AM</span>
            </div>
            <h1 class="font-display text-2xl sm:text-4xl font-700 text-white text-glow">⚖️ ${esc(data.title)}</h1>
            <p class="text-slate-300 mt-3 max-w-2xl leading-relaxed text-sm sm:text-base">${esc(data.description)} — study the sections, run the quiz, print the card.</p>
          </div>
        </header>

        <!-- Progress -->
        <section id="private-progress" class="rounded-2xl border border-white/10 bg-navy-2/60 p-5 sm:p-6">
          <h2 class="font-display text-lg font-600 text-white mb-3">Your preparation</h2>
          ${progressBarHtml(progress, (data.sections || []).length, quizTotal)}
        </section>

        <!-- Sections -->
        <section>
          <h2 class="font-display text-xl font-600 text-white mb-4">📖 Study sections <span class="text-slate-500 text-sm font-normal">— tap a card to open</span></h2>
          <div class="space-y-3">${sectionsHtml}</div>
        </section>

        <!-- Quiz -->
        <section>
          <h2 class="font-display text-xl font-600 text-white mb-4">🎯 Prep quiz</h2>
          <div id="private-quiz">
            <div class="rounded-2xl border border-white/10 bg-navy-2/70 p-6 sm:p-8 text-center">
              <div class="text-4xl mb-3">🎯</div>
              <h3 class="font-display text-lg font-600 text-white mb-2">${quizTotal} questions — no pressure</h3>
              <p class="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
                Multiple choice &amp; true/false on your hearing: dates, facts, procedure, and what to say.
                The order changes every time — instant feedback with a short explanation after every answer.
                ${progress.quizBest ? `<br /><span class="text-gold font-semibold">Your best so far: ${progress.quizBest}/${quizTotal}</span>` : ''}
              </p>
              <button id="start-p-quiz" class="px-7 py-3 rounded-xl bg-teal text-navy font-bold text-sm shadow-glow hover:bg-teal/90 transition">Start the quiz</button>
            </div>
          </div>
        </section>

        <!-- Print sheet (rendered on demand, hidden on screen) -->
        <div id="print-sheet"></div>
      </div>`;

    // Wire up: sections → progress tracking
    area.querySelectorAll('details[data-section]').forEach(d => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        const title = data.sections[Number(d.dataset.section)].title;
        const p = loadProgress();
        if (!p.sections.includes(title)) {
          p.sections.push(title);
          saveProgress(p);
          refreshProgressBar((data.sections || []).length);
        }
      });
    });

    function refreshProgressBar(total) {
      const el = area.querySelector('#private-progress');
      if (el) {
        el.innerHTML = `
          <h2 class="font-display text-lg font-600 text-white mb-3">Your preparation</h2>
          ${progressBarHtml(loadProgress(), total, quizTotal)}`;
        const resetBtn = el.querySelector('#reset-private-progress');
        if (resetBtn) resetBtn.addEventListener('click', onResetProgress);
      }
    }

    function onResetProgress() {
      if (!window.confirm('Reset all private study progress? Your unlocked status stays.')) return;
      try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {}
      renderModule(area, data);
    }

    area.querySelector('#reset-private-progress').addEventListener('click', onResetProgress);
    area.querySelector('#start-p-quiz').addEventListener('click', () => startQuiz(area, data));
    area.querySelector('#print-sheet-btn').addEventListener('click', () => printSheet(data));
    area.querySelector('#lock-btn').addEventListener('click', () => {
      lock();
      Oracle.private.exitPrivateMode();
      location.hash = '#home';
    });
  }

  /* ── Prep quiz (same look & feel as the main quiz engine) ─ */
  /** Fisher-Yates shuffle — returns a new array, original untouched. */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz(area, data) {
    const qs = shuffle(data.quiz || []);
    const s = { questions: qs, index: 0, score: 0, answers: [] };
    renderQuestion(area, data, s);
  }

  function renderQuestion(area, data, s) {
    const q = s.questions[s.index];
    const n = s.questions.length;
    const pct = (s.index / n) * 100;

    let choices = '';
    if (q.type === 'true-false') {
      choices = `
        <div class="grid sm:grid-cols-2 gap-3 mt-6">
          ${['True', 'False'].map((val, i) => `
            <button data-choice="${i}" class="quiz-option text-left rounded-xl border border-white/10 bg-navy-2/70 px-5 py-4 font-semibold text-white">
              <span class="text-teal mr-2">${i === 0 ? '✓' : '✗'}</span>${val}
            </button>`).join('')}
        </div>`;
    } else {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      choices = `
        <div class="space-y-3 mt-6">
          ${q.options.map((opt, i) => `
            <button data-choice="${i}" class="quiz-option w-full text-left rounded-xl border border-white/10 bg-navy-2/70 px-5 py-3.5 text-slate-200">
              <span class="inline-grid place-items-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-teal mr-3">${letters[i]}</span>${esc(opt)}
            </button>`).join('')}
        </div>`;
    }

    document.getElementById('private-quiz').innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-navy-2/70 p-6 sm:p-8 shadow-card fade-in">
        <div class="mb-5">
          <div class="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Question ${s.index + 1} of ${n}</span><span>${s.score} correct so far 🎯</span>
          </div>
          <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-300" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="grid place-items-center w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 text-teal text-sm font-bold shrink-0 mt-0.5">Q${s.index + 1}</span>
          <h3 class="font-display text-xl sm:text-2xl font-600 text-white leading-snug">${esc(q.question)}</h3>
        </div>
        ${choices}
        <div id="p-feedback" class="mt-6"></div>
      </div>`;

    document.querySelectorAll('#private-quiz [data-choice]').forEach(btn => {
      btn.addEventListener('click', () => choose(area, data, s, Number(btn.dataset.choice), btn));
    });
  }

  function choose(area, data, s, picked, btn) {
    const q = s.questions[s.index];
    const correct = q.type === 'true-false' ? picked === (q.correct ? 0 : 1) : picked === q.correct;

    document.querySelectorAll('#private-quiz [data-choice]').forEach(b => {
      b.disabled = true;
      b.classList.add('cursor-not-allowed');
      const i = Number(b.dataset.choice);
      const isCorrect = q.type === 'true-false' ? i === (q.correct ? 0 : 1) : i === q.correct;
      if (isCorrect) {
        b.classList.remove('border-white/10', 'hover:border-teal/40');
        b.classList.add('border-emerald-400/60', 'bg-emerald-400/15');
      } else if (i === picked) {
        b.classList.remove('border-white/10');
        b.classList.add('border-danger/60', 'bg-danger/15');
      }
    });

    if (correct) s.score++;
    s.answers.push({ question: q, picked, correct });

    const isLast = s.index === s.questions.length - 1;
    const fb = document.getElementById('p-feedback');
    fb.innerHTML = `
      <div class="rounded-xl border ${correct ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-danger/40 bg-danger/10'} p-4">
        <div class="font-semibold ${correct ? 'text-emerald-300' : 'text-danger'} mb-1.5">${correct ? '✅ Nice one! Correct.' : '❌ Not quite.'}</div>
        ${q.explanation ? `<p class="text-sm text-slate-300 leading-relaxed">${esc(q.explanation)}</p>` : ''}
        <button id="p-next-btn" class="mt-4 px-5 py-2.5 rounded-lg bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">
          ${isLast ? 'See my results 🎉' : 'Next question →'}
        </button>
      </div>`;
    fb.querySelector('#p-next-btn').addEventListener('click', () => {
      s.index++;
      if (isLast) renderResults(area, data, s);
      else renderQuestion(area, data, s);
    });
  }

  function renderResults(area, data, s) {
    // Persist best score
    Oracle.private.recordQuiz(s.score);

    const total = s.answers.length;
    // Bands scaled to quiz length: 80%+ ready, 50%+ almost there
    const band = s.score >= total * 0.8
      ? { emoji: '🎯', title: 'Ready', msg: `You know your case — ${s.score}/${total}. Walk in calm and confident. Review the quick reference card once more before bed.` }
      : s.score >= total * 0.5
        ? { emoji: '📖', title: 'Almost there', msg: `${s.score}/${total} — solid, but a few gaps. Re-read the sections you missed, then retake.` }
        : { emoji: '🌱', title: 'Keep studying', msg: `${s.score}/${total} — take your time with the sections above and try again. You've got this.` };

    let review = '';
    s.answers.forEach((a, i) => {
      const q = a.question;
      const rightText = q.type === 'true-false' ? (q.correct ? 'True' : 'False') : (q.options[q.correct] || '');
      const gotText = q.type === 'true-false' ? (a.picked === 0 ? 'True' : 'False') : (q.options[a.picked] || '—');
      review += `
        <div class="rounded-xl border ${a.correct ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-danger/30 bg-danger/5'} p-4">
          <div class="flex items-start gap-2.5">
            <span class="mt-0.5">${a.correct ? '✅' : '❌'}</span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-white leading-snug">${esc(q.question)}</p>
              <p class="text-xs mt-1.5 text-slate-400">Your answer: <span class="${a.correct ? 'text-emerald-300' : 'text-danger'}">${esc(gotText)}</span>${a.correct ? '' : ' · Correct: <span class="text-emerald-300">' + esc(rightText) + '</span>'}</p>
              ${q.explanation ? `<p class="text-xs mt-1.5 text-slate-500 leading-relaxed">${esc(q.explanation)}</p>` : ''}
            </div>
          </div>
        </div>`;
    });

    document.getElementById('private-quiz').innerHTML = `
      <div class="fade-in">
        <div class="rounded-2xl border border-white/10 bg-navy-2/70 p-6 sm:p-8 text-center shadow-card">
          <div class="text-5xl mb-3">${band.emoji}</div>
          <h3 class="font-display text-2xl font-700 text-white">${s.score}/${s.answers.length}</h3>
          <div class="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-teal/40 bg-teal/10 text-teal">${band.title}</div>
          <p class="text-slate-300 mt-3 max-w-lg mx-auto leading-relaxed text-sm">${esc(band.msg)}</p>
          <div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button id="p-retake-btn" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">🔄 Retake quiz</button>
            <button id="p-back-btn" class="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/15 text-slate-200 font-semibold text-sm hover:bg-white/5 transition">← Back to study area</button>
            <button id="p-print-btn" class="w-full sm:w-auto px-6 py-3 rounded-xl text-sm text-slate-400 hover:text-teal transition">🖨️ Print quick reference</button>
          </div>
        </div>
        <details class="mt-6 rounded-2xl border border-white/10 bg-navy-2/60 overflow-hidden">
          <summary class="cursor-pointer px-6 py-4 font-semibold text-white text-sm select-none hover:bg-white/5 transition list-none">Review your answers (${s.score}/${s.answers.length})</summary>
          <div class="px-6 pb-6 space-y-3">${review}</div>
        </details>
      </div>`;

    document.getElementById('p-retake-btn').addEventListener('click', () => startQuiz(area, data));
    document.getElementById('p-back-btn').addEventListener('click', () => renderModule(area, data));
    document.getElementById('p-print-btn').addEventListener('click', () => printSheet(data));
  }

  /* ── Print quick reference (one page, high density) ─────── */
  function printSheet(data) {
    const sheet = document.getElementById('print-sheet');
    if (!sheet) return;
    sheet.innerHTML = buildPrintSheetHtml(data);
    document.body.classList.add('print-sheet-only');
    const cleanup = () => {
      document.body.classList.remove('print-sheet-only');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 3000);   // safety net for browsers without afterprint
    window.print();
  }

  function buildPrintSheetHtml(data) {
    return `
      <div class="ps-header">
        <h1>⚖️ Court Preparation — Quick Reference</h1>
        <p><strong>74th District Court · Bay City, MI</strong> — Monday, August 10, 2026 · 9:30 AM (arrive 9:00)</p>
        <p class="ps-case"><strong>CASE:</strong> Vehicle collision, June 7, 2026 — other party claims ~$6,000. <strong>KEY FACT:</strong> your medical damages were NOT listed in their claim.</p>
      </div>
      <div class="ps-grid">
        <div class="ps-col">
          <h2>✅ Say this</h2>
          <ul>
            <li>“I’m here to respond to the claim.”</li>
            <li>“I’d like to see proof of service.”</li>
            <li>“My medical damages were not included in their claim.”</li>
            <li>“I’d like more time to prepare.”</li>
            <li>“I have documentation of my own damages.”</li>
          </ul>
          <h2>🚫 Never say</h2>
          <ul>
            <li>Do NOT admit fault — let the plaintiff prove their case.</li>
            <li>Do NOT rely on the $3,000 threshold theory (UNVERIFIED).</li>
            <li>Do NOT make emotional statements.</li>
            <li>Do NOT discuss legal theories you can’t support.</li>
            <li>Do NOT discuss your insurance without consulting an attorney.</li>
          </ul>
        </div>
        <div class="ps-col">
          <h2>⚖️ Your rights</h2>
          <ul>
            <li>Present evidence</li>
            <li>Cross-examine witnesses</li>
            <li>Request adjournment (not guaranteed)</li>
            <li>Representation (not required in small claims)</li>
            <li>File a counterclaim</li>
          </ul>
          <h2>🏛️ Court procedure</h2>
          <ol>
            <li>Arrive by 9:00 AM — check in with the clerk</li>
            <li>Wait for your case to be called</li>
            <li>Stand when speaking</li>
            <li>Address the judge as “Your Honor”</li>
            <li>Present your response clearly</li>
            <li>Take notes during the hearing</li>
          </ol>
        </div>
        <div class="ps-col">
          <h2>📚 Key law</h2>
          <ul>
            <li>Small claims: MCL 600.8355–8359</li>
            <li>Jurisdictional ceiling: ~$6,500</li>
            <li>Tort statute of limitations: 3 years (MCL 600.5807)</li>
            <li>Burden of proof: plaintiff must prove damages</li>
            <li>Mini-tort (MCL 500.3135): $3,000 cap — vehicle damage only</li>
          </ul>
          <h2>🎒 Bring</h2>
          <ul>
            <li>The 11-page filing</li>
            <li>Insurance documents</li>
            <li>Police records</li>
            <li>Photos of damage</li>
            <li>Medical records (your damages)</li>
            <li>Notepad &amp; pen</li>
          </ul>
        </div>
      </div>
      <p class="ps-foot">Educational summary only — not legal advice. · ${esc(data.title || 'Oracle Study Guide')} · generated ${new Date().toLocaleDateString()}</p>`;
  }

  /* ── Secret entrance ("Sophi" button) ───────────────────── */
  function initEntries() {
    const trigger = document.getElementById('sophi-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => Oracle.private.openModal());
    }

    const modal = document.getElementById('pass-modal');
    if (modal) {
      const submit = document.getElementById('pass-submit');
      if (submit) submit.addEventListener('click', submitPass);
      const input = document.getElementById('pass-input');
      if (input) {
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submitPass(); });
      }
      const closeBtn = document.getElementById('pass-close');
      if (closeBtn) closeBtn.addEventListener('click', () => Oracle.private.closeModal(true));
      modal.addEventListener('click', e => { if (e.target === modal) Oracle.private.closeModal(true); });
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') Oracle.private.closeModal(true);
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    initEntries();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();