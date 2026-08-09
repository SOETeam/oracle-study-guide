/* ============================================================
 * Oracle Study Guide — guide.js
 * Renders the level-matched study guide: concepts, examples,
 * pitfalls, glossary, exercises. Print-friendly.
 * Requires: Oracle.store (progress.js), Oracle.loadTopic (app.js)
 * Exposes:  Oracle.renderGuide(main, topicId, level)
 * ============================================================ */
window.Oracle = window.Oracle || {};

(function () {
  'use strict';

  const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];
  const LEVEL_LABEL = {
    beginner: 'Beginner 🌱',
    intermediate: 'Intermediate 📈',
    advanced: 'Advanced 🚀'
  };

  function sectionTitle(emoji, title, sub) {
    return `
      <div class="flex items-center gap-3 mb-4">
        <span class="grid place-items-center w-10 h-10 rounded-xl bg-teal/10 border border-teal/30 text-xl">${emoji}</span>
        <div>
          <h2 class="font-display text-xl font-600 text-white">${title}</h2>
          ${sub ? `<p class="text-xs text-slate-500 mt-0.5">${sub}</p>` : ''}
        </div>
      </div>`;
  }

  /* ── Main guide page ────────────────────────────────────── */
  Oracle.renderGuide = async function (main, topicId, level) {
    document.title = 'Study Guide — Oracle Study Guide';
    const meta = Oracle.getTopic(topicId);
    let topic;
    try { topic = await Oracle.loadTopic(topicId); }
    catch (e) { return Oracle.renderError(main, 'Could not load the study guide for this topic.'); }

    const levels = topic.levels || {};
    const lvl = LEVEL_ORDER.includes(level) && levels[level] ? level : (LEVEL_ORDER.find(l => levels[l]) || 'beginner');
    const content = levels[lvl];

    Oracle.store.recordGuideRead(topic.id, lvl);

    const tabbar = `
      <div class="tabbar no-print flex gap-2 flex-wrap">
        ${LEVEL_ORDER.filter(l => levels[l]).map(l => {
          const active = l === lvl;
          return `<a href="#guide/${encodeURIComponent(topic.id)}/${l}"
            class="px-4 py-2 rounded-lg text-sm font-semibold border transition ${active ? 'bg-teal text-navy border-teal' : 'border-white/10 text-slate-300 hover:border-teal/40 hover:text-white'}">${LEVEL_LABEL[l]}</a>`;
        }).join('')}
      </div>`;

    // Concepts
    let concepts = '';
    for (const c of (content.concepts || [])) {
      concepts += `
        <div class="print-block rounded-xl border border-white/10 bg-navy-2/60 p-5">
          <h3 class="font-display font-600 text-teal mb-2">${Oracle.esc(c.title)}</h3>
          <p class="text-sm text-slate-300 leading-relaxed">${Oracle.esc(c.text)}</p>
        </div>`;
    }

    // Examples — highlighted scenario → outcome
    let examples = '';
    for (const ex of (content.examples || [])) {
      examples += `
        <div class="print-block rounded-xl border border-gold/30 bg-gold/[.06] p-5">
          <h3 class="font-display font-600 text-gold mb-2">💡 ${Oracle.esc(ex.title)}</h3>
          <p class="text-sm text-slate-300 leading-relaxed mb-2"><span class="text-slate-400 font-semibold">Scenario:</span> ${Oracle.esc(ex.scenario)}</p>
          <p class="text-sm text-slate-300 leading-relaxed"><span class="text-teal font-semibold">What it means:</span> ${Oracle.esc(ex.outcome)}</p>
        </div>`;
    }

    // Pitfalls
    let pitfalls = '';
    for (const p of (content.pitfalls || [])) {
      pitfalls += `
        <div class="print-block flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/[.06] p-4">
          <span class="shrink-0 mt-0.5">⚠️</span>
          <p class="text-sm text-slate-300 leading-relaxed">${Oracle.esc(p)}</p>
        </div>`;
    }

    // Exercises
    let exercises = '';
    (content.exercises || []).forEach((ex, i) => {
      exercises += `
        <div class="print-block flex items-start gap-3 rounded-xl border border-white/10 bg-navy-2/60 p-4">
          <span class="grid place-items-center w-7 h-7 rounded-lg bg-teal/10 border border-teal/30 text-teal text-xs font-bold shrink-0">${i + 1}</span>
          <p class="text-sm text-slate-300 leading-relaxed">${Oracle.esc(ex)}</p>
        </div>`;
    });

    // Glossary
    let glossary = '';
    for (const g of (topic.glossary || [])) {
      glossary += `
        <div class="print-block grid sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 rounded-lg border border-white/5 bg-white/[.02] px-4 py-3">
          <dt class="text-teal font-semibold text-sm">${Oracle.esc(g.term)}</dt>
          <dd class="text-sm text-slate-300 leading-relaxed">${Oracle.esc(g.definition)}</dd>
        </div>`;
    }

    main.innerHTML = `
      <div class="fade-in max-w-4xl mx-auto space-y-8">
        <a href="#topic/${encodeURIComponent(topic.id)}" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal transition no-print">← Back to ${Oracle.esc(meta.name)}</a>

        <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="text-4xl">${Oracle.esc(meta.icon)}</span>
              <span class="text-xs uppercase tracking-widest text-teal font-semibold">Study guide · ${LEVEL_LABEL[lvl]}</span>
            </div>
            <h1 class="font-display text-3xl sm:text-4xl font-700 text-white text-glow">${Oracle.esc(topic.title || meta.name)}</h1>
            ${content.tagline ? `<p class="text-slate-400 mt-2 max-w-2xl leading-relaxed">${Oracle.esc(content.tagline)}</p>` : ''}
          </div>
          <button onclick="window.print()"
            class="no-print shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-teal/40 bg-teal/10 text-teal text-sm font-semibold hover:bg-teal/20 transition">
            🖨️ Print / Save PDF
          </button>
        </header>

        ${tabbar}

        ${content.goals && content.goals.length ? `
        <section>
          ${sectionTitle('🎯', 'What you\u2019ll learn', 'By the end of this guide you should be able to…')}
          <div class="flex flex-wrap gap-2">
            ${content.goals.map(g => `<span class="px-3 py-1.5 rounded-full border border-teal/25 bg-teal/[.06] text-xs sm:text-sm text-slate-200">${Oracle.esc(g)}</span>`).join('')}
          </div>
        </section>` : ''}

        <section>
          ${sectionTitle('📘', 'Core concepts', 'The ideas that matter')}
          <div class="grid md:grid-cols-2 gap-4">${concepts}</div>
        </section>

        <section>
          ${sectionTitle('💡', 'Examples', 'Real scenarios, plain English')}
          <div class="space-y-4">${examples}</div>
        </section>

        <section>
          ${sectionTitle('⚠️', 'Common pitfalls', 'Tricky spots people get wrong')}
          <div class="space-y-3">${pitfalls}</div>
        </section>

        <section>
          ${sectionTitle('✏️', 'Exercises', 'Try these to make it stick')}
          <div class="space-y-3">${exercises}</div>
        </section>

        <section>
          ${sectionTitle('📖', 'Glossary', 'Terms used in this guide')}
          <dl class="space-y-2">${glossary}</dl>
          <p class="text-xs text-slate-500 mt-4 leading-relaxed no-print">Educational overview only — for specific situations, consult official sources or a qualified professional.</p>
        </section>

        <div class="no-print flex flex-col sm:flex-row gap-3 pt-2">
          <a href="#quiz/${encodeURIComponent(topic.id)}" class="flex-1 text-center px-6 py-3 rounded-xl bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">Test yourself — take the quiz</a>
          <a href="#topic/${encodeURIComponent(topic.id)}" class="flex-1 text-center px-6 py-3 rounded-xl border border-white/15 text-slate-200 font-semibold text-sm hover:bg-white/5 transition">More about this topic</a>
        </div>
      </div>`;
  };
})();