/* ============================================================
 * Oracle Study Guide — quiz.js
 * Quiz engine: intro/level pick → one-question-at-a-time play
 * with instant feedback → results with score band + explanation.
 * Requires: Oracle.store (progress.js), Oracle.loadTopic (app.js)
 * Exposes:  Oracle.renderQuiz(main, topicId)
 *           Oracle.bandForScore(score, total)
 * ============================================================ */
window.Oracle = window.Oracle || {};

(function () {
  'use strict';

  const QUESTIONS_PER_QUIZ = 10;

  const LEVEL_META = {
    beginner:     { label: 'Beginner',     emoji: '🌱', blurb: 'New to this topic — start with the essentials.', desc: 'Core facts, plain language. ~10 questions' },
    intermediate: { label: 'Intermediate', emoji: '📈', blurb: 'You know the basics and want to go deeper.',       desc: 'Real scenarios and finer detail. ~10 questions' },
    advanced:     { label: 'Advanced',     emoji: '🚀', blurb: 'Sharpen your edge cases and nuance.',              desc: 'Edge cases, nuance, and fine print. ~10 questions' }
  };

  /** Score → skill band: 0-3 beginner, 4-6 intermediate, 7-10 advanced */
  Oracle.bandForScore = function (score, total) {
    const pct = total > 0 ? score / total : 0;
    if (pct < 0.4) return 'beginner';
    if (pct < 0.7) return 'intermediate';
    return 'advanced';
  };

  const BAND_COPY = {
    beginner:     { emoji: '🌱', title: 'Beginner', msg: 'Everyone starts somewhere! The guide below is built just for you — read it, then come back and try again. You\u2019ll be surprised how fast it clicks.' },
    intermediate: { emoji: '📈', title: 'Intermediate', msg: 'Solid foundation! You know more than most. Level up with the intermediate guide and aim for the advanced band.' },
    advanced:     { emoji: '🚀', title: 'Advanced', msg: 'Impressive! You\u2019ve got real command of this topic. The advanced guide will polish the last edges.' }
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── Quiz intro: pick a level ───────────────────────────── */
  Oracle.renderQuiz = async function (main, topicId) {
    document.title = 'Take the Quiz — Oracle Study Guide';
    const meta = Oracle.getTopic(topicId);
    let topic;
    try { topic = await Oracle.loadTopic(topicId); }
    catch (e) { return Oracle.renderError(main, 'Could not load quiz data for this topic.'); }

    const quizzes = (topic && topic.quiz) || {};
    const best = Oracle.store.bestScore(topicId);

    let levelCards = '';
    for (const [key, lvl] of Object.entries(LEVEL_META)) {
      const count = quizzes[key] ? quizzes[key].length : 0;
      const disabled = count < QUESTIONS_PER_QUIZ;
      levelCards += `
        <button data-level="${key}" ${disabled ? 'disabled' : ''}
          class="quiz-option text-left w-full rounded-2xl border ${disabled ? 'border-white/5 bg-white/[.02] opacity-40 cursor-not-allowed' : 'border-white/10 bg-navy-2/70 hover:border-teal/40'} p-5">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">${lvl.emoji}</span>
            <span class="font-display font-600 text-lg text-white">${lvl.label}</span>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">${lvl.blurb}</p>
          <p class="text-xs text-slate-500 mt-2">${disabled ? 'Coming soon' : lvl.desc}</p>
        </button>`;
    }

    main.innerHTML = `
      <div class="fade-in max-w-3xl mx-auto space-y-6">
        <a href="#topic/${encodeURIComponent(topicId)}" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal transition">← Back to ${Oracle.esc(meta.name)}</a>

        <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-navy-2 to-navy-3 p-8 sm:p-10 text-center relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-teal/10 blur-3xl pointer-events-none"></div>
          <div class="relative">
            <div class="text-5xl mb-4">${Oracle.esc(meta.icon)}</div>
            <h1 class="font-display text-3xl sm:text-4xl font-700 text-white text-glow">Find your level</h1>
            <p class="text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              Take a short, friendly quiz on <span class="text-teal font-semibold">${Oracle.esc(topic.title || meta.name)}</span>.
              Answer ${QUESTIONS_PER_QUIZ} questions, get instant feedback, and we\u2019ll point you to the study guide that fits you best. No grades, no pressure. 🎯
            </p>
            ${best ? `<div class="mt-4 inline-flex items-center gap-2 text-sm text-gold bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5">🏆 Your best so far: ${best.score}/${best.total} — ${Oracle.bandBadge(best.band)}</div>` : ''}
          </div>
        </div>

        <div>
          <h2 class="font-display text-lg font-600 text-white mb-3">Choose your starting point</h2>
          <div class="grid sm:grid-cols-3 gap-4">${levelCards}</div>
        </div>
      </div>`;

    main.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', () => Oracle.startQuiz(main, topic, btn.dataset.level));
    });
  };

  /* ── Quiz session ───────────────────────────────────────── */
  Oracle.startQuiz = function (main, topic, level) {
    const session = {
      topic,
      level,
      questions: shuffle(topic.quiz[level]).slice(0, QUESTIONS_PER_QUIZ),
      index: 0,
      score: 0,
      answers: []   // { question, picked, correct }
    };
    renderQuestion(main, session);
  };

  function renderQuestion(main, s) {
    const q = s.questions[s.index];
    const n = s.questions.length;
    const pct = (s.index / n) * 100;

    let choices = '';
    if (q.type === 'tf') {
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
              <span class="inline-grid place-items-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-teal mr-3">${letters[i]}</span>${Oracle.esc(opt)}
            </button>`).join('')}
        </div>`;
    }

    main.innerHTML = `
      <div class="fade-in max-w-3xl mx-auto">
        <div class="flex items-center justify-between text-sm text-slate-400 mb-3">
          <a href="#quiz/${encodeURIComponent(s.topic.id)}" class="hover:text-teal transition">← Quit</a>
          <span class="capitalize">${Oracle.bandBadge(s.level)} quiz · ${Oracle.esc(s.topic.title || s.topic.id)}</span>
        </div>

        <div class="mb-5">
          <div class="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Question ${s.index + 1} of ${n}</span><span>${s.score} correct so far 🎯</span>
          </div>
          <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-300" style="width:${pct}%"></div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-navy-2/70 p-6 sm:p-8 shadow-card">
          <div class="flex items-start gap-3">
            <span class="grid place-items-center w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 text-teal text-sm font-bold shrink-0 mt-0.5">Q${s.index + 1}</span>
            <h2 class="font-display text-xl sm:text-2xl font-600 text-white leading-snug">${Oracle.esc(q.q)}</h2>
          </div>
          ${choices}
          <div id="feedback" class="mt-6"></div>
        </div>
      </div>`;

    main.querySelectorAll('[data-choice]').forEach(btn => {
      btn.addEventListener('click', () => choose(s, Number(btn.dataset.choice), btn));
    });
  }

  function choose(s, picked, btn) {
    const q = s.questions[s.index];
    const correct = q.type === 'tf' ? (picked === 0) === !!q.answer : picked === q.answer;
    // q.answer: tf → boolean; mc → index of correct option

    main.querySelectorAll('[data-choice]').forEach(b => {
      b.disabled = true;
      b.classList.add('cursor-not-allowed');
      const i = Number(b.dataset.choice);
      const isCorrect = q.type === 'tf' ? (i === 0) === !!q.answer : i === q.answer;
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
    const fb = document.getElementById('feedback');
    fb.innerHTML = `
      <div class="rounded-xl border ${correct ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-danger/40 bg-danger/10'} p-4">
        <div class="font-semibold ${correct ? 'text-emerald-300' : 'text-danger'} mb-1.5">${correct ? '✅ Nice one! Correct.' : '❌ Not quite.'}</div>
        <p class="text-sm text-slate-300 leading-relaxed">${Oracle.esc(q.explain || '')}</p>
        <button id="next-btn" class="mt-4 px-5 py-2.5 rounded-lg bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">
          ${isLast ? 'See my results 🎉' : 'Next question →'}
        </button>
      </div>`;
    fb.querySelector('#next-btn').addEventListener('click', () => {
      s.index++;
      if (isLast) renderResults(main, s);
      else renderQuestion(main, s);
    });
  }

  /* ── Results screen ─────────────────────────────────────── */
  function renderResults(main, s) {
    const total = s.questions.length;
    const band = Oracle.bandForScore(s.score, total);
    const copy = BAND_COPY[band];
    const pct = Math.round((s.score / total) * 100);

    Oracle.store.recordQuiz({
      topicId: s.topic.id,
      level: s.level,
      score: s.score,
      total,
      band,
      date: new Date().toISOString()
    });

    let review = '';
    s.answers.forEach((a, i) => {
      const q = a.question;
      const rightText = q.type === 'tf' ? (q.answer ? 'True' : 'False') : (q.options[a.question.answer] || '');
      const gotText = q.type === 'tf' ? (a.picked === 0 ? 'True' : 'False') : (q.options[a.picked] || '—');
      review += `
        <div class="rounded-xl border ${a.correct ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-danger/30 bg-danger/5'} p-4">
          <div class="flex items-start gap-2.5">
            <span class="mt-0.5">${a.correct ? '✅' : '❌'}</span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-white leading-snug">${Oracle.esc(q.q)}</p>
              <p class="text-xs mt-1.5 text-slate-400">Your answer: <span class="${a.correct ? 'text-emerald-300' : 'text-danger'}">${Oracle.esc(gotText)}</span>${a.correct ? '' : ' · Correct: <span class="text-emerald-300">' + Oracle.esc(rightText) + '</span>'}</p>
              ${a.question.explain ? `<p class="text-xs mt-1.5 text-slate-500 leading-relaxed">${Oracle.esc(a.question.explain)}</p>` : ''}
            </div>
          </div>
        </div>`;
    });

    main.innerHTML = `
      <div class="fade-in max-w-3xl mx-auto">
        <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-navy-2 to-navy-3 p-8 sm:p-10 text-center shadow-card relative overflow-hidden">
          <div class="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl pointer-events-none"></div>
          <div class="relative">
            <div class="text-6xl mb-4">${copy.emoji}</div>
            <h1 class="font-display text-3xl sm:text-4xl font-700 text-white">${s.score}/${total}</h1>
            <div class="mt-3 flex justify-center">${Oracle.bandBadge(band)}</div>
            <p class="text-slate-300 mt-4 max-w-lg mx-auto leading-relaxed text-sm sm:text-base">${copy.msg}</p>

            <div class="mt-6 h-2.5 rounded-full bg-white/5 overflow-hidden max-w-sm mx-auto">
              <div class="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-700" style="width:${pct}%"></div>
            </div>

            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#guide/${encodeURIComponent(s.topic.id)}/${band}"
                 class="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal text-navy font-bold text-sm hover:bg-teal/90 transition">📖 Read the ${copy.title} guide</a>
              <button id="retake-btn" class="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/15 text-slate-200 font-semibold text-sm hover:bg-white/5 transition">🔄 Retake quiz</button>
              <a href="#topic/${encodeURIComponent(s.topic.id)}" class="w-full sm:w-auto px-6 py-3 rounded-xl text-sm text-slate-400 hover:text-white transition">Back to topic</a>
            </div>
          </div>
        </div>

        <details class="mt-6 rounded-2xl border border-white/10 bg-navy-2/60 overflow-hidden">
          <summary class="cursor-pointer px-6 py-4 font-semibold text-white text-sm select-none hover:bg-white/5 transition">Review your answers (${s.score}/${total})</summary>
          <div class="px-6 pb-6 space-y-3">${review}</div>
        </details>
      </div>`;

    document.getElementById('retake-btn').addEventListener('click', () => Oracle.startQuiz(main, s.topic, s.level));
  }
})();