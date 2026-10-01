/* ============================================================
 * Oracle Study Guide — guide.js
 * Renders the level-matched study guide: concepts, examples,
 * pitfalls, glossary, exercises. Print-friendly.
 * Requires: Oracle.store (progress.js), Oracle.loadTopic (app.js)
 * Exposes:  Oracle.renderGuide(main, topicId, level)
 *           Oracle.renderRich(raw, opts)  — structured text renderer
 *           Oracle.richInline(text, opts) — inline pipeline
 * Typography pass: paragraphs split on blank lines, ALL-CAPS/colon
 * lead-in labels styled, "- " lines become lists, statute citations
 * (BEM 212, 7 CFR 273.1, MCL …) render as chips, key terms bolded
 * on first use (topic.keyTerms). Text content is never altered.
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

  /* ── Markdown link rendering ──────────────────────────────
   * Converts table-of-contents style links inside JSON content
   * into real, clickable anchors (styled to match the site).
   * Handles:
   *   [text](url)                         → <a href="url" ...>text</a>
   *   bare http:// or https:// URL        → <a href="url" ...>url</a>
   * Runs AFTER content has been HTML-escaped so the generated
   * anchor markup is never escaped away.
   */
  Oracle.markdownLinks = function (html) {
    const LINK_CLASS = 'text-cyan-400 underline';
    const placeholders = [];
    const stash = (a) => {
      placeholders.push(a);
      return '\u0001' + (placeholders.length - 1) + '\u0001';
    };
    const anchor = (url, label) =>
      `<a href="${url}" target="_blank" rel="noopener" class="${LINK_CLASS}">${label}</a>`;
    let out = String(html == null ? '' : html);

    // 1) [text](url) — stashed so the URL pass below can't re-wrap it
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      (m, label, url) => stash(anchor(url, label)));

    // 2) bare http(s):// URLs not already an href value
    out = out.replace(/(?<![\"=])https?:\/\/[^\s<]+/g, (m) => {
      const url = m.replace(/[.,;:!?\])]+$/, '');
      return stash(anchor(url, url));
    });

    // 3) restore stashed anchors (markdown links first)
    return out.replace(/\u0001(\d+)\u0001/g, (m, i) => placeholders[Number(i)]);
  };

  /* ── Citation chips ───────────────────────────────────────
   * Single-pass alternation so chips can never nest inside each
   * other. Runs after markdownLinks, so link hrefs/labels (which
   * are stashed behind \u0001N\u0001 placeholders) are untouched.
   *   BEM 212 / ERM 103, 205, 208 / BPB 2026-025 / RFT 250 / RFB 2025-006 …
   *   7 CFR 273.1(b)(1)(ii) / 42 CFR 435.603(f)(2) / bare 435.603(f)
   *   MCL 500.3135(3)  ·  form numbers MDHHS-1171, DHS-1514
   */
  const CITE_RE = new RegExp([
    '\\b((?:BEM|ERM|ERB|BPB|RFT|RFB|BAM|PAM|FIM|AAM)\\s+\\d{2,4}(?:-\\d{1,4})*(?:\\.\\d+)?(?:\\s*,\\s*\\d{2,4}(?:-\\d{1,4})*(?:\\.\\d+)?)*)\\b',
    '\\b(\\d{1,3}\\s+CFR\\s+[\\d.]+(?:\\([^)]{1,10}\\))*)',
    '\\b(?<![-/])(\\d{3}\\.\\d{1,4}(?:\\([a-zA-Z0-9.]+\\))*)',
    '\\b(MCL\\s+[\\d.]+(?:\\([a-zA-Z0-9]+\\))*)',
    '\\b((?:MDHHS|DHS)-\\d{3,5})\\b'
  ].join('|'), 'g');

  /* Program labels that open a paragraph in worked scenarios. */
  const PROG_LABEL_RE = /^((?:FAP|FIP|SER|MAGI|Medicaid)(?:\/SNAP|\s*\(\s*MAGI\s*\))?):\s+/;

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ── Inline pipeline: esc → key-term bold → program label → links → chips ── */
  Oracle.richInline = function (text, opts) {
    opts = opts || {};
    let s = Oracle.esc(text);
    if (opts.terms && opts.terms.length) {
      for (const t of opts.terms) {
        const re = new RegExp('\\b(' + escapeRe(t) + ')\\b', 'i');
        s = s.replace(re, '<strong class="term">$1</strong>');
      }
    }
    if (opts.progLabels) {
      s = s.replace(PROG_LABEL_RE, '<strong class="prog">$1:</strong> ');
    }
    s = Oracle.markdownLinks(s);
    s = s.replace(CITE_RE, (m) => '<span class="cite">' + m + '</span>');
    return s;
  };

  /* ── Figure tables ────────────────────────────────────────
   * Narrow, label-triggered parsers for the two reference-table
   * paragraphs (FAP income limits RFT 250, FIP grant standards
   * RFT 210). Only the "/" and ";" separator glyphs between
   * figures are consumed as cell/row structure — every label,
   * number, and word is preserved verbatim.
   */
  function splitTop(s, sep) { // split on sep, ignoring parens depth
    const parts = [];
    let depth = 0, cur = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && s.startsWith(sep, i)) { parts.push(cur); cur = ''; i += sep.length - 1; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts;
  }

  function tableHtml(head, rows, nCols) {
    let h = '<div class="rich-table-wrap"><table class="rich-table">';
    if (head) {
      h += '<thead><tr>' + head.map(x => '<th>' + Oracle.richInline(x, {}) + '</th>').join('') + '</tr></thead>';
    }
    h += '<tbody>' + rows.map(function (r) {
      let tds = '<td>' + Oracle.richInline(r.label, {}) + '</td>';
      if (nCols === 2 && r.cells.length === 1) {
        tds += '<td colspan="2">' + Oracle.richInline(r.cells[0], {}) + '</td>';
      } else {
        for (let i = 0; i < nCols; i++) {
          tds += r.cells[i] != null ? '<td>' + Oracle.richInline(r.cells[i], {}) + '</td>' : '<td></td>';
        }
      }
      return '<tr>' + tds + '</tr>';
    }).join('') + '</tbody></table></div>';
    return h;
  }

  Oracle.richTable = function (label, body) {
    if (/^INCOME LIMITS/i.test(label)) {
      const rows = splitTop(body, '; ').map(s => s.trim()).filter(Boolean).map(function (seg) {
        const m = seg.match(/^(\d{1,3}% FPL(?: \([^)]{1,60}\))?)\s+(.+)$/);
        if (!m) return null;
        return { label: m[1], cells: m[2].split(/\s*\/\s*/).map(c => c.trim()).filter(Boolean) };
      });
      if (rows.length >= 2 && rows.every(Boolean) && rows.every(r => r.cells.length >= 2)) {
        const n = Math.max.apply(null, rows.map(r => r.cells.length));
        const head = [''].concat(Array.from({ length: n }, (_, i) => String(i + 1)));
        return tableHtml(head, rows, n);
      }
    }
    if (/^GRANT STANDARDS/i.test(label)) {
      const rows = splitTop(body, '; ').map(s => s.trim()).filter(Boolean).map(function (seg) {
        const m = seg.match(/^(.+?)\s+—\s+(.+)$/);
        if (!m) return null;
        return { label: m[1], cells: m[2].split(/\s*\/\s*/).map(c => c.trim()).filter(Boolean) };
      });
      if (rows.length >= 2 && rows.every(Boolean)) {
        const n = Math.max.apply(null, rows.map(r => r.cells.length));
        if (n === 2) return tableHtml(['', 'Eligible grantee', 'Ineligible grantee'], rows, n);
      }
    }
    return null;
  };

  /* ── Structured text → paragraphs / lead-ins / lists / tables ──
   * Data conventions (whitespace-only in JSON):
   *   "\n\n"  paragraph break          "\n"    lead-in label separator
   *   "\n- "  list item marker
   * A block starting with "⚠" gets warning-callout styling.
   * Text without newlines renders exactly as before (one <p>).
   */
  Oracle.renderRich = function (raw, opts) {
    opts = opts || {};
    const blocks = String(raw == null ? '' : raw).split(/\n{2,}/);
    let out = '';
    for (const rawBlock of blocks) {
      if (!rawBlock.trim()) continue;
      const lines = rawBlock.split('\n');
      let label = null;
      let rest = lines;
      if (lines.length > 1 && lines[0].length <= 180 && /[—–:]$/.test(lines[0].trim())) {
        label = lines[0].trim();
        rest = lines.slice(1);
      }
      const isList = rest.length > 0 && rest.every(l => /^- /.test(l));
      const isWarn = /^⚠/.test(rawBlock.trim());
      let inner = '';
      if (isList) {
        inner = '<ul>' + rest.map(l =>
          '<li>' + Oracle.richInline(l.replace(/^- /, ''), opts) + '</li>').join('') + '</ul>';
      } else {
        const body = rest.join(' ').trim();
        const tbl = label ? Oracle.richTable(label, body) : null;
        inner = tbl || '<p>' + Oracle.richInline(body, opts) + '</p>';
      }
      out += '<div class="rich-block' + (isWarn ? ' rich-warn' : '') + '">'
        + (label ? '<h4 class="rich-lead">' + Oracle.richInline(label, {}) + '</h4>' : '')
        + inner + '</div>';
    }
    return out;
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
    const terms = topic.keyTerms || [];
    const richOpts = { terms, progLabels: true };

    Oracle.store.recordGuideRead(topic.id, lvl);

    const tabbar = `
      <div class="tabbar no-print flex gap-2 flex-wrap">
        ${LEVEL_ORDER.filter(l => levels[l]).map(l => {
          const active = l === lvl;
          return `<a href="#guide/${encodeURIComponent(topic.id)}/${l}"
            class="px-4 py-2 rounded-lg text-sm font-semibold border transition ${active ? 'bg-teal text-navy border-teal' : 'border-white/10 text-slate-300 hover:border-teal/40 hover:text-white'}">${LEVEL_LABEL[l]}</a>`;
        }).join('')}
      </div>`;

    // Concepts — single-column reading cards: bold underlined titles,
    // paragraphed prose with lead-in labels, lists, tables, cite chips.
    let concepts = '';
    for (const c of (content.concepts || [])) {
      concepts += `
        <div class="print-block rounded-xl border border-white/10 bg-navy-2/60 p-5">
          <h3 class="font-display font-700 text-base sm:text-lg text-teal pb-2 mb-3 border-b border-teal/25">${Oracle.esc(c.title)}</h3>
          <div class="rich text-sm text-slate-300 leading-[1.7]">${Oracle.renderRich(c.text, richOpts)}</div>
        </div>`;
    }

    // Examples — highlighted scenario → outcome, gold accent rail
    let examples = '';
    for (const ex of (content.examples || [])) {
      examples += `
        <div class="print-block rounded-xl border border-gold/30 border-l-4 border-l-gold/70 bg-gold/[.06] p-5">
          <h3 class="font-display font-600 text-gold mb-2">💡 ${Oracle.esc(ex.title)}</h3>
          <p class="text-sm text-slate-300 leading-[1.7] mb-3"><span class="text-slate-400 font-semibold">Scenario:</span> ${Oracle.richInline(ex.scenario, richOpts)}</p>
          <div class="text-sm text-slate-300 leading-[1.7]">
            <span class="text-teal font-semibold">What it means:</span>
            <div class="rich mt-1.5">${Oracle.renderRich(ex.outcome, richOpts)}</div>
          </div>
        </div>`;
    }

    // Pitfalls — default ⚠ boxes, dashed gold MYTH boxes, solid red boundary boxes
    let pitfalls = '';
    for (const p of (content.pitfalls || [])) {
      const isMyth = /^MYTH:/.test(p);
      const isBoundary = /^VERIFY-AT-MDHHS BOUNDARY:/.test(p);
      let box = 'border border-danger/25 bg-danger/[.06]';
      let body = Oracle.richInline(p, {});
      let icon = '<span class="shrink-0 mt-0.5">⚠️</span>';
      if (isMyth) {
        box = 'border border-dashed border-gold/45 bg-gold/[.05]';
        body = body.replace(/^MYTH:/, '<strong class="myth-tag">MYTH:</strong>');
        icon = '';
      } else if (isBoundary) {
        box = 'border border-danger/40 border-l-4 border-l-danger bg-danger/[.09]';
        body = body.replace(/^VERIFY-AT-MDHHS BOUNDARY:/, '<strong class="boundary-tag">VERIFY-AT-MDHHS BOUNDARY:</strong>');
      }
      pitfalls += `
        <div class="print-block flex items-start gap-3 rounded-xl ${box} p-4">
          ${icon}
          <p class="text-sm text-slate-300 leading-[1.7]">${body}</p>
        </div>`;
    }

    // Exercises
    let exercises = '';
    (content.exercises || []).forEach((ex, i) => {
      exercises += `
        <div class="print-block flex items-start gap-3 rounded-xl border border-white/10 bg-navy-2/60 p-4">
          <span class="grid place-items-center w-7 h-7 rounded-lg bg-teal/10 border border-teal/30 text-teal text-xs font-bold shrink-0">${i + 1}</span>
          <p class="text-sm text-slate-300 leading-[1.7]">${Oracle.richInline(ex, {})}</p>
        </div>`;
    });

    // Glossary
    let glossary = '';
    for (const g of (topic.glossary || [])) {
      glossary += `
        <div class="print-block grid sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 rounded-lg border border-white/5 bg-white/[.02] px-4 py-3">
          <dt class="text-teal font-semibold text-sm">${Oracle.esc(g.term)}</dt>
          <dd class="text-sm text-slate-300 leading-[1.7]">${Oracle.richInline(g.definition, {})}</dd>
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
          <div class="space-y-4">${concepts}</div>
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