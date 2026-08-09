/* ============================================================
 * Oracle Study Guide — progress.js
 * localStorage-backed progress store + progress dashboard.
 * Exposes: Oracle.store (recordQuiz, recordGuideRead, quizHistory, bestScore)
 *          Oracle.progressStats(), Oracle.renderProgress(main)
 * ============================================================ */
window.Oracle = window.Oracle || {};

(function () {
  'use strict';

  const KEY = 'oracle.progress.v1';

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') {
        return { quizzes: Array.isArray(raw.quizzes) ? raw.quizzes : [], guidesRead: Array.isArray(raw.guidesRead) ? raw.guidesRead : [] };
      }
    } catch (e) { /* corrupted storage — start fresh */ }
    return { quizzes: [], guidesRead: [] };
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }

  const Store = {
    /** Record a finished quiz: { topicId, level, score, total, band, date } */
    recordQuiz(quiz) {
      const data = load();
      data.quizzes.push(quiz);
      save(data);
      return quiz;
    },

    /** Record that the user opened a study guide at a level */
    recordGuideRead(topicId, level) {
      const data = load();
      data.guidesRead = (data.guidesRead || []).filter(g => !(g.topicId === topicId && g.level === level));
      data.guidesRead.push({ topicId, level, date: new Date().toISOString() });
      save(data);
    },

    /** All quiz attempts, newest last */
    quizHistory() { return load().quizzes; },

    /** Best score (0..total) for a topic across all levels; null if never taken */
    bestScore(topicId) {
      const scores = load().quizzes.filter(q => q.topicId === topicId);
      if (!scores.length) return null;
      let best = scores[0];
      for (const s of scores) if (s.score > best.score) best = s;
      return best;
    },

    /** Number of distinct topics with at least one attempt */
    topicsCompletedCount() {
      return new Set(load().quizzes.map(q => q.topicId)).size;
    },

    clearAll() {
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };

  Oracle.store = Store;

  /** Aggregate stats for dashboards */
  Oracle.progressStats = function () {
    const quizzes = Store.quizHistory();
    const total = quizzes.length;
    const avgPct = total
      ? Math.round(quizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / total)
      : 0;
    return {
      quizzesTaken: total,
      topicsCompleted: Store.topicsCompletedCount(),
      averagePct: avgPct,
      lastAttempt: total ? quizzes[total - 1] : null
    };
  };

  const BAND_META = {
    beginner:     { label: 'Beginner',     color: 'text-teal',    bg: 'bg-teal/10',    border: 'border-teal/40',    emoji: '🌱' },
    intermediate: { label: 'Intermediate', color: 'text-gold',    bg: 'bg-gold/10',    border: 'border-gold/40',    emoji: '📈' },
    advanced:     { label: 'Advanced',     color: 'text-purple-300', bg: 'bg-purple-400/10', border: 'border-purple-400/40', emoji: '🚀' }
  };
  Oracle.BAND_META = BAND_META;

  /** Band badge pill */
  function bandBadge(band) {
    const m = BAND_META[band] || BAND_META.beginner;
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.border} ${m.color}">${m.emoji} ${m.label}</span>`;
  }
  Oracle.bandBadge = bandBadge;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  Oracle.esc = esc;

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return ''; }
  }

  /* ──────────────────────────────────────────────────────────
   * Progress dashboard page (#progress)
   * ────────────────────────────────────────────────────────── */
  Oracle.renderProgress = function (main) {
    document.title = 'My Progress — Oracle Study Guide';
    const stats = Oracle.progressStats();
    const history = Store.quizHistory();
    const topics = Oracle.state.topics;

    const statCard = (icon, value, label) => `
      <div class="print-block rounded-2xl border border-white/10 bg-navy-2/70 p-5 flex items-center gap-4">
        <span class="grid place-items-center w-12 h-12 rounded-xl bg-teal/10 border border-teal/30 text-2xl">${icon}</span>
        <div>
          <div class="font-display text-3xl font-700 text-white">${value}</div>
          <div class="text-xs uppercase tracking-wider text-slate-400 mt-0.5">${label}</div>
        </div>
      </div>`;

    // Per-topic best scores
    let topicRows = '';
    for (const t of topics) {
      const best = Store.bestScore(t.id);
      if (!best) continue;
      const pct = Math.round((best.score / best.total) * 100);
      const band = Oracle.bandForScore(best.score, best.total);
      topicRows += `
        <div class="print-block rounded-xl border border-white/10 bg-navy-2/60 p-4">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${esc(t.icon)}</span>
              <div>
                <div class="font-semibold text-white">${esc(t.name)}</div>
                <div class="text-xs text-slate-400">best: ${best.score}/${best.total} · ${esc(best.level)} level</div>
              </div>
            </div>
            ${bandBadge(band)}
          </div>
          <div class="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all" style="width:${pct}%"></div>
          </div>
          <div class="mt-3 flex gap-2 flex-wrap">
            <a href="#quiz/${esc(t.id)}" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal/10 border border-teal/40 text-teal hover:bg-teal/20 transition">Retake quiz</a>
            <a href="#guide/${esc(t.id)}/${esc(best.level)}" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">Open guide</a>
          </div>
        </div>`;
    }

    // Recent attempts
    let rows = '';
    for (const q of history.slice(-8).reverse()) {
      const topic = topics.find(t => t.id === q.topicId);
      rows += `
        <tr class="border-b border-white/5 last:border-0">
          <td class="py-2.5 pr-3 text-slate-200">${topic ? esc(topic.icon) + ' ' + esc(topic.name) : esc(q.topicId)}</td>
          <td class="py-2.5 pr-3 capitalize text-slate-400">${esc(q.level)}</td>
          <td class="py-2.5 pr-3 text-slate-200 font-semibold">${q.score}/${q.total}</td>
          <td class="py-2.5">${bandBadge(q.band)}</td>
          <td class="py-2.5 text-xs text-slate-500 hidden sm:table-cell">${fmtDate(q.date)}</td>
        </tr>`;
    }

    main.innerHTML = `
      <div class="fade-in space-y-8">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 class="font-display text-3xl sm:text-4xl font-700 text-white">My Progress</h1>
            <p class="text-slate-400 mt-1 text-sm">Everything is saved privately in your browser.</p>
          </div>
          <button id="clear-progress" class="px-4 py-2 rounded-lg text-sm border border-danger/40 text-danger hover:bg-danger/10 transition">Clear all data</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">${statCard('🎯', stats.quizzesTaken, 'Quizzes taken')}${statCard('🗂️', stats.topicsCompleted, 'Topics completed')}${statCard('📊', stats.averagePct + '%', 'Average score')}</div>

        <section>
          <h2 class="font-display text-xl font-600 text-white mb-4">Topic mastery</h2>
          ${topicRows || '<div class="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400 text-sm">No quiz attempts yet. <a href="#home" class="text-teal hover:underline">Pick a topic</a> and take your first quiz!</div>'}
        </section>

        <section>
          <h2 class="font-display text-xl font-600 text-white mb-4">Recent attempts</h2>
          ${history.length ? `
          <div class="print-block rounded-2xl border border-white/10 bg-navy-2/60 overflow-x-auto">
            <table class="w-full text-sm min-w-[480px]">
              <thead><tr class="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/10">
                <th class="py-3 pr-3">Topic</th><th class="py-3 pr-3">Level</th><th class="py-3 pr-3">Score</th><th class="py-3">Level</th><th class="py-3 hidden sm:table-cell">Date</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : '<div class="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400 text-sm">No attempts yet — quizzes you take will show up here.</div>'}
        </section>
      </div>`;

    document.getElementById('clear-progress').addEventListener('click', function () {
      if (window.confirm('Clear all saved progress? This cannot be undone.')) {
        Store.clearAll();
        Oracle.renderProgress(main);
      }
    });
  };
})();