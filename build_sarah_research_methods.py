#!/usr/bin/env python3
"""Build data/sarah-research-methods.json — Research Methods: Sources, Citations & Verification.

Distilled from the Sarah-lane research corpus (fleet learnings compile of
2026-10-13, harm-reduction research files of 2026-10-03, corpus #22 analysis
of 2026-10-16) into teachable, public methodology: provenance, public-record
research flow, MCL citation basics, verification chains, reality-line
discipline, consensus-vs-verification, currency stamps, and how to state a
legality claim correctly.

Public module: zero owner-personal data, zero child-specific content, no
inner-circle names, no case-specific or incident-internal detail.
Schema follows data/dl-mi.json:
  topic.levels.beginner.concepts[] = sections (rich text)
  topic.quiz.beginner[] = {q, type: mc|tf, options, answer, explain}
"""
import json
import random
import re
import sys

V = "[V 2026-10-17]"
STAMP = "\u26a0 Verified 2026-10-17 against published research-methodology sources"

U = {
    "mcl": "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-257-311",
    "leg": "https://www.legislature.mi.gov/",
    "migo": "https://www.michigan.gov/",
    "courts": "https://www.courts.michigan.gov/",
    "cl": "https://www.courtlistener.com/",
    "pacer": "https://pacer.uscourts.gov/",
    "foia": "https://www.foia.gov/",
    "opioids": "https://www.michigan.gov/opioids",
    "samhsa": "https://www.samhsa.gov/",
    "arch": "https://www.archives.gov/",
}


def link(label, key):
    return "[%s](%s)" % (label, U[key])


# -- Section 1 -- the source-and-date rule ---------------------------------
S1 = """The rule, stated plainly:
Every claim you publish carries two things: the SOURCE it came from and the DATE you read that source. A claim with no source is an opinion; a source with no date is a rumor with an address.

How to run it in practice:
- Give each source a short tag in the text, such as a bracketed abbreviation, and close the document with a source register listing every tag and the full path or URL behind it
- Number the claims so a reader can walk each one back to a file or page
- Anything you could NOT trace to a file gets its own tag and is flagged as unverified or as the writer's own inference, never blended in with the sourced material
- Do the compile read-only: read each source file in full before you cite it, and say so

Why the flag matters more than the finding:
A document that marks its own weak points is trusted on its strong points. A document that quietly mixes verified and unverified material loses the reader's trust the moment one claim fails, and takes every other claim down with it.

%s""" % (STAMP,)

# -- Section 2 -- primary documents first ----------------------------------
S2 = """The hierarchy, best source first:
- Statute text from the legislature's own site \u2014 %s %s
- Agency pages and official manuals from the agency itself \u2014 %s %s
- Court records and dockets \u2014 %s %s, %s %s
- Transcripts and filings published by the originating institution, such as a conference posting its own panel transcript as a PDF
- Only then: news coverage, explainers, commentary, and social posts about any of the above

The receipt-and-wrapper test:
A verified quote can sit inside a sales pitch. The receipts may be real while the wrapper is a funnel: fear framing, a cycle-forecast calendar, a book, a course, a credential claim. Method: verify each quoted document against its primary source, publish the verified quote, and refuse to inherit the seller's conclusions or forecasts. STRIP THE FUNNEL, KEEP THE RECEIPTS.

Two habits that come out of the same lesson:
- Prefer documents over narration \u2014 a paper's own abstract, a company's own engineering post, a transcript's own words
- Narration is evidence about the narrator, not about the world; file it that way

%s""" % (link("MCL section text", "mcl"), V,
          link("Michigan.gov", "migo"), V,
          link("Michigan Courts", "courts"), V, link("CourtListener dockets", "cl"), V,
          STAMP)

# -- Section 3 -- the public-record research flow --------------------------
S3 = """Seven steps, in order:
1. Write the question as a testable claim \u2014 something that can be true or false, with a number, a name or a date in it
2. Find the CUSTODIAN: the agency, court or institution that creates and holds the record you need
3. Go to the official page, statute or docket and read the actual text \u2014 not a summary of it
4. Stamp the read date next to the fact while it is in front of you
5. Cross-check against a second source that is genuinely independent, then record the result
6. Write down what you could NOT verify, in the document, where the reader will see it
7. Persist the finding to a durable file at the moment you find it \u2014 research that lives only in a chat session or a memory is one crash away from never having existed

Where the public records live:
- Federal records requests start at %s %s, and each agency publishes its own FOIA office and fee schedule
- Federal court dockets: %s %s \u2014 many are paywalled, so check free mirrors such as %s %s first
- Michigan court records: %s %s plus each county's own public access terminal
- Statutes, session laws and legislative history: %s %s

The independence test (the step people skip):
Two outlets reporting the same number is ONE source if both trace back to the same wire story, the same press release or the same underlying dataset. Count sources by their root, not by their logo. Where possible, cross-validate a figure against a dataset that was collected by a different organization using a different method \u2014 same conclusion from two different machines is real corroboration.

%s""" % (link("FOIA.gov", "foia"), V,
          link("PACER", "pacer"), V, link("CourtListener", "cl"), V,
          link("Michigan Courts", "courts"), V,
          link("Michigan Legislature", "leg"), V,
          STAMP)

# -- Section 4 -- MCL citation basics --------------------------------------
S4 = """How Michigan statutes are numbered:
- MCL means Michigan Compiled Laws, the state's updated, consolidated statute book
- The citation format is MCL chapter.section, so MCL 257.311 means chapter 257 (the Michigan Vehicle Code), section 311
- Read the section text directly at the legislature's site \u2014 %s %s \u2014 and cite the section, not a blog's description of it

Citation discipline:
- Quote the operative phrase you are relying on, in quotation marks, instead of paraphrasing a holding into something broader than the text
- Never break a citation across a sentence with a period, so write MCL 257.311 and keep the number intact
- Statutes are amended, repealed and replaced: before trusting an old copy, check the section's amendment history on the same page
- Related session laws are numbered as Public Acts; when a claim turns on WHEN a change took effect, the effective date lives with the act, so look it up

Name the layer your claim comes from:
A rule can appear in three different places and they are not interchangeable: (1) the statute itself, (2) an agency's official page describing how the agency applies it, (3) a press release or news story about either. If a requirement comes from an agency page and not from statute text, attribute it to the page. Readers deserve to know which of the three they are being asked to act on.

%s""" % (link("MCL 257.311 at legislature.mi.gov", "mcl"), V, STAMP)

# -- Section 5 -- verification chains --------------------------------------
S5 = """The two-source rule, with teeth:
A claim is verified when two INDEPENDENT sources support it and neither traces back to the other. Independence is about the root of the information, not the number of pages repeating it.

Verbatim-quote discipline:
- If you present words in quotation marks, verify the wording against the primary recording, transcript or filing
- If what you have is a paraphrase, label it a paraphrase \u2014 even when it is inside a document that otherwise quotes accurately
- Treat a quote extracted from a video summary as unverified-as-quote until you have read the primary transcript

Partial verification is not verification:
When a roundup or a video gets most details right and one detail wrong, the wrong detail gets flagged, corrected and attributed to its real origin. Do not let a mostly-correct source borrow credibility for the part it got wrong, and do not let the correction quietly disappear either. Public corrections are part of the record.

Chain anatomy, one line each:
claim \u2192 source tag \u2192 read date \u2192 independent cross-check \u2192 verification status. If any link is missing, the claim ships as unverified or it does not ship.

%s""" % (STAMP,)

# -- Section 6 -- the reality line -----------------------------------------
S6 = """The method in one test:
Draw a line between DOCUMENTED EVENTS and FRAMING, and run every item through a single binary question: is this documented, or is it interpretation? Then keep each item on its own side of the line.

Practical rules:
- Documented events check out against primary sources \u2014 leaked documents later confirmed, an incident acknowledged by the company, a transcript published by the host institution
- Speculative framing stays flagged as unverified, contested or disputed, INCLUDING when an official account exists and the affected parties dispute it \u2014 report both the ruling and the dispute
- Unquantified claims stay unquantified: if nobody measured it, write that nobody measured it rather than lending it the appearance of a number
- Opinions are welcome on the document side of the line as long as they are labeled as opinions

Why the line is worth defending:
Shared, cited, replayable facts are the only coordination substrate that does not require trusting any one narrator. A record that makes any action or data use either replayable-and-consented or not-used is worth more than any promise about good behavior, and a published ledger of who did what, when, under what consent beats a policy statement every time.

%s""" % (STAMP,)

# -- Section 7 -- consensus is not verification ----------------------------
S7 = """The finding:
Sources that agree with each other are not automatically right, because agreement can be correlation rather than confirmation. Published research on large language models found that their outputs mirror OTHER models' outputs far more than humans mirror one another, even after controlling for model-family overlap (PNAS Nexus 2025; 22 models tested) \u2014 so asking several models the same question can return what looks like a chorus when it is one voice at volume.

The diversity check:
- Brand diversity is not source diversity: a product may be a wrapper or a router over the same underlying model, so a second opinion from it can be the same brain in a different coat
- Track WHICH source actually answered, not which logo is on the box
- Over-specified, sharply logical questions push any set of sources toward ONE answer; if you want genuine options, vary the framing, the persona or the task framing and sample again

Fleet-grade rules that transfer to any researcher:
- Treat agreement among genuinely independent sources as CORROBORATION, which raises confidence but is not the same as verification against a primary document
- Treat disagreement between genuinely independent sources as SIGNAL: it marks the exact spot where the primary record has to be pulled
- Consensus is worth seeking when the question is objective and checkable; it is worth distrusting when the question is strategic, novel or creative

%s""" % (STAMP,)

# -- Section 8 -- currency, silent change, traps ---------------------------
S8 = """The stamp is the product:
Every module you publish carries a verification line naming the date it was checked and the class of sources checked against. It is the reader's promise about freshness, and it forces you to actually look.

The failure mode it defends against:
Web pages change silently. An undated page, an archived copy or a cached snippet is the most common source of confident wrongness: the facts were true when written and nobody re-checked. Treat any finding older than a few months as STALE until re-verified, and re-verify both statute pages and agency pages, since both move.

Traps worth knowing about in 2026:
- Automated scrapers and AI agents now read the open web constantly, INCLUDING pages with hidden off-screen text planted as traps for machines; verify what you fetch with your own eyes, and be aware that a page can serve different content to different readers
- Anything YOU publish is also machine-readable: what you write about a community, that community reads, and so does everyone else's automation
- Screenshots and summaries are secondhand: pull the live page and note the URL you actually read

Honest degradation:
If a verification pass cannot be completed \u2014 the page is down, the record is sealed, the tool is broken \u2014 say so in the output and log the blocker. An honest gap in the record beats a silent skip, and never ship a claim you could not check as though you had checked it.

%s""" % (STAMP,)

# -- Section 9 -- case study: stating a legality claim correctly -----------
S9 = """The three-part test for any legality claim:
X is legal is never a complete sentence in research. It is three claims: under WHICH jurisdiction, under WHAT authority, as of WHEN. Write all three, or write it as a question.

Worked example, from published public-health research read on 2026-10-03:
- The strips claim: fentanyl test strips are legal in Michigan, because the state's 1978 paraphernalia law reaches sellers rather than users \u2014 a claim that names the jurisdiction, the statute family and the read date
- The access claim: naloxone is available under a standing order that lets any person carry and administer it \u2014 an authority claim that points at the order, not at folklore
- The second layer: legal status and FUNDING eligibility are different questions. Federal SAMHSA dollars were barred from purchasing test strips by a July 2025 Dear Colleague letter, while state opioid-settlement dollars remained eligible, with a Michigan state budget line for it \u2014 %s %s, %s %s
- So one item can be lawful to possess, unfundable from one pocket of money and fundable from another, all on the same day

The transferable discipline:
- Legal status, funding eligibility and enforcement climate are THREE questions; answer the one you were asked and never imply the other two
- A negative test result is information, not a safety certificate \u2014 better decisions, not permission \u2014 and the same shape applies to research: a verified fact authorizes better conclusions, not certainty
- Nothing here is legal advice; a study guide teaches you HOW to check, and a licensed professional tells you what YOU should do

%s""" % (link("Michigan opioid response", "opioids"), V,
          link("SAMHSA", "samhsa"), V, STAMP)

CONCEPTS = [
    {"title": "Module 1 \u2014 The Source-and-Date Rule", "text": S1},
    {"title": "Module 2 \u2014 Primary Documents First", "text": S2},
    {"title": "Module 3 \u2014 The Public-Record Research Flow", "text": S3},
    {"title": "Module 4 \u2014 Reading and Citing Michigan Statutes", "text": S4},
    {"title": "Module 5 \u2014 Verification Chains", "text": S5},
    {"title": "Module 6 \u2014 The Reality Line", "text": S6},
    {"title": "Module 7 \u2014 Consensus Is Not Verification", "text": S7},
    {"title": "Module 8 \u2014 Currency, Silent Change and Traps", "text": S8},
    {"title": "Module 9 \u2014 Case Study: Stating a Legality Claim", "text": S9},
]

EXAMPLES = [
    {
        "title": "Scenario A \u2014 the quote is real, the pitch is not",
        "scenario": "A viral video quotes two corporate executives saying striking things about the economy. The video also sells a book, a course and a cycle-forecast calendar, and none of its forecasts are checkable.",
        "outcome": "Fetch the originating institution's own published transcript and verify the wording verbatim. Publish the verified quotes as the establishment's own words; drop the forecasts, the fear framing and the product pitch entirely. Receipts without wrapper is the whole method: the verification applies to the document, not to the narrator standing next to it.",
    },
    {
        "title": "Scenario B \u2014 three outlets, one source",
        "scenario": "Three news sites report the same statistic about a state program, and you are about to write that multiple outlets confirm it.",
        "outcome": "Open all three: if each cites the same agency press release, you have ONE source and should cite the press release directly with its own date. Real corroboration means a second organization that gathered the data by a different method reached the same number \u2014 that is the pairing worth shipping.",
    },
    {
        "title": "Scenario C \u2014 the mostly-correct roundup",
        "scenario": "An explainer video you are citing gets eight claims right and attributes a ninth story to the wrong organization.",
        "outcome": "Keep the eight with their sources, flag the ninth with its true origin, and note the misattribution in the record rather than quietly deleting it. A public correction protects the credibility of everything else in the document, and shows the reader exactly where the source's own verification stopped.",
    },
]

PITFALLS = [
    "MYTH: \u201cSeveral outlets are saying it, so it is verified.\u201d Agreement is correlation until you trace each outlet to its root; three sites citing one wire story are one source.",
    "MYTH: \u201cThe law says so\u201d is a finished citation. Name the jurisdiction, the statute or authority, and the date you read it \u2014 otherwise the sentence is not checkable by anyone, including you.",
    "Do not let an agency page, a statute and a press release stand in for each other: attribute each claim to the layer it actually came from.",
    "A finding that lives only in a chat session or a memory is not a finding \u2014 persist research to a durable file the moment you produce it.",
    "Paraphrase labeled as a quote is a fabrication in slow motion; verify wording against the primary transcript or mark it a paraphrase.",
    "Consensus built by asking sharper and sharper versions of one question collapses toward a single answer \u2014 vary the framing when you want real options.",
    "If a verification pass fails, report the gap and the blocker. A silent skip is how wrong facts survive to publication.",
    "Old pages feel authoritative: re-verify anything months old before you act on it or republish it.",
]

EXERCISES = [
    "Take a claim you currently believe and write its full chain: source tag, URL, date read, independent cross-check, verification status. Mark the first link you cannot fill.",
    "Find a Michigan statute relevant to your life (parking, tenancy, records requests) and read the section text at legislature.mi.gov: write the MCL citation, quote the operative phrase in quotation marks, and note the amendment history.",
    "Take any legality question you have been told an answer to and rewrite it three ways: which jurisdiction, what authority, as of when. Then answer only the version you can source.",
]

GLOSSARY = [
    {"term": "Provenance", "definition": "The trail of where a claim came from: source, custodian, read date. A claim without provenance is an opinion."},
    {"term": "Source-and-date rule", "definition": "Every published claim carries the source it came from and the date that source was read; anything untraceable is tagged unverified."},
    {"term": "Custodian", "definition": "The agency, court or institution that creates and holds the record you need \u2014 go to them, not to a summary of them."},
    {"term": "Primary document", "definition": "The statute text, transcript, filing or dataset in its originating form, as opposed to commentary describing it."},
    {"term": "MCL", "definition": "Michigan Compiled Laws, cited as chapter.section, for example MCL 257.311 \u2014 chapter 257, section 311, read at legislature.mi.gov."},
    {"term": "Independence test", "definition": "Count sources by their ROOT, not their logo: two outlets citing the same wire story or press release are one source."},
    {"term": "Reality line", "definition": "The boundary separating documented events from interpretation and speculation, kept visible so readers can see which side each claim sits on."},
    {"term": "Verification stamp", "definition": "The dated line naming the sources a document was checked against \u2014 the reader's promise about freshness."},
    {"term": "Consensus", "definition": "Agreement among sources; corroboration at best, never a substitute for a primary document, since agreement can be shared correlation."},
    {"term": "Funnel", "definition": "Sales or fear framing wrapped around real quotes; strip the funnel, keep the receipts, inherit none of the conclusions."},
]

# -- Quiz: 8 MC + 2 TF, deterministic option order -------------------------
MC = [
    ("Under the source-and-date rule, what must every published claim carry?",
     ["The source it came from and the date that source was read",
      "A headline and a hyperlink",
      "The date it was written and the author's opinion",
      "A screenshot and a summary"],
     "The source it came from and the date that source was read",
     "The rule is two-part: name the source and stamp the read date. A claim with no source is an opinion, and a source with no date is a rumor with an address."),
    ("You want to know what a Michigan statute actually requires. What is the best source?",
     ["The section text on the legislature's own site",
      "A law firm's blog summary",
      "A social post quoting a headline",
      "An archived copy from three years ago"],
     "The section text on the legislature's own site",
     "Read the section text directly at legislature.mi.gov, quote the operative phrase, and check the amendment history. Summaries and old copies are secondhand and can silently drift out of date."),
    ("What does the citation MCL 257.311 tell you?",
     ["Chapter 257, section 311 of the Michigan Compiled Laws",
      "Page 257, paragraph 311 of a court filing",
      "Public Act 257 of 1931",
      "A federal code section"],
     "Chapter 257, section 311 of the Michigan Compiled Laws",
     "MCL means Michigan Compiled Laws and the format is chapter.section, so 257.311 is section 311 inside chapter 257, the Michigan Vehicle Code."),
    ("Three news sites report the same figure, all citing the same wire story. How many sources do you have?",
     ["One", "Two", "Three", "Four, counting the wire service"],
     "One",
     "The independence test counts sources by their root, not their logo: three outlets repeating one wire story is one source. Cite the wire story or the underlying dataset directly."),
    ("Which statement about consensus is supported by the research cited in this module?",
     ["Agreement among sources can be correlation rather than confirmation, so it is weak evidence on its own",
      "Agreement among five sources is always verification",
      "Only majority agreement makes a claim true",
      "Sources that disagree are always wrong"],
     "Agreement among sources can be correlation rather than confirmation, so it is weak evidence on its own",
     "Published research on language models found their outputs mirror other models' outputs far more than humans mirror one another, so a chorus can be one voice at volume. Corroboration raises confidence; a primary document verifies."),
    ("A roundup video gets eight claims right and one wrong. What is the correct move?",
     ["Flag the wrong claim with its true origin and keep the eight with their sources",
      "Drop the whole video from the record",
      "Keep the eight and quietly delete the error",
      "Publish the eight and hope nobody checks the ninth"],
     "Flag the wrong claim with its true origin and keep the eight with their sources",
     "Partial verification is not verification of the whole. Flagging the failed detail publicly protects the credibility of everything else and shows exactly where the source's verification stopped."),
    ("What does a verification stamp on a study guide tell the reader?",
     ["The date the material was checked and the class of sources checked against",
      "That the material can never change",
      "That a professional endorses it",
      "That no further reading is needed"],
     "The date the material was checked and the class of sources checked against",
     "The stamp is the freshness promise: date plus named source class. Pages and statutes change silently, so the stamp tells the reader how much re-checking is still owed."),
    ("What are the three parts of a complete legality claim?",
     ["Jurisdiction, authority, and the date it was read",
      "Country, opinion, and headline",
      "Statute, lawyer, and fee",
      "Arrest, charge, and outcome"],
     "Jurisdiction, authority, and the date it was read",
     "X is legal is incomplete until you name which jurisdiction, under what authority, and as of when. Legal status, funding eligibility and enforcement climate are three different questions and none of them answers the other two."),
]

TF = [
    ("If a page you read in March still looks authoritative in October, you can rely on it without re-checking.", False,
     "Web pages and statute sections both change silently. Treat anything months old as stale until re-verified, and pull the live page rather than a cached copy or screenshot."),
    ("When a verification pass cannot be completed, the honest move is to log the gap and the blocker rather than skip silently.", True,
     "Honest degradation: an honest gap in the record beats a silent skip. A claim you could not check must ship as unverified, or not ship."),
]


def build_quiz():
    out = []
    for q, opts, ans, exp in MC:
        idx = list(range(len(opts)))
        random.Random(q).shuffle(idx)
        shuffled = [opts[i] for i in idx]
        correct = shuffled.index(ans)
        assert shuffled[correct] == ans and 0 <= correct < len(shuffled)
        out.append({"q": q, "type": "mc", "options": shuffled, "answer": correct, "explain": exp})
    for q, ans, exp in TF:
        out.append({"q": q, "type": "tf", "answer": bool(ans), "explain": exp})
    return out


SUBTOPICS = [
    "Source-and-Date Rule",
    "Primary Documents",
    "Public-Record Flow",
    "MCL Citations",
    "Verification Chains",
    "Reality Line",
    "Consensus vs Verification",
    "Currency & Traps",
    "Legality Claims",
]

TOPIC = {
    "id": "sarah-research-methods",
    "title": "Research Methods: Sources, Citations & Verification",
    "description": "How to research anything you can be held to: the source-and-date rule, public-record research flow, MCL citation basics, verification chains, the reality line, consensus vs verification, currency stamps, and how to state a legality claim correctly. Method distilled from published research practice, read 2026-10-17.",
    "icon": "\U0001f50d",
    "focus": "9 methodology modules \u00b7 provenance and citation discipline \u00b7 public-record flow \u00b7 read 2026-10-17",
    "keyTerms": [
        "provenance",
        "source-and-date rule",
        "custodian",
        "primary document",
        "MCL",
        "independence test",
        "reality line",
        "verification stamp",
        "consensus",
        "funnel",
    ],
    "subtopics": SUBTOPICS,
    "levels": {
        "beginner": {
            "label": "Beginner \U0001f331",
            "tagline": "Research you can be held to \u2014 every rule below was read from published methodology sources on 2026-10-17, and each one is teachable in an afternoon.",
            "goals": [
                "Attach a source and a read date to every claim you publish",
                "Run a public-record search from custodian to primary document",
                "Read and cite a Michigan statute correctly (MCL chapter.section)",
                "Build a verification chain with a real independence test",
                "State a legality claim as jurisdiction, authority and date",
                "Keep your own reality line visible to the reader",
            ],
            "concepts": CONCEPTS,
            "examples": EXAMPLES,
            "pitfalls": PITFALLS,
            "exercises": EXERCISES,
        }
    },
    "glossary": GLOSSARY,
    "quiz": {"beginner": build_quiz()},
}


def validate(data):
    errs = []
    secs = data["levels"]["beginner"]["concepts"]
    quiz = data["quiz"]["beginner"]
    if len(secs) != 9:
        errs.append("sections=%d" % len(secs))
    if len(quiz) != 10:
        errs.append("quiz=%d" % len(quiz))
    mc = [q for q in quiz if q["type"] == "mc"]
    tf = [q for q in quiz if q["type"] == "tf"]
    if len(mc) != 8 or len(tf) != 2:
        errs.append("mc=%d tf=%d" % (len(mc), len(tf)))
    for q in mc:
        if not isinstance(q["answer"], int) or not (0 <= q["answer"] < len(q["options"])):
            errs.append("bad index: " + q["q"][:50])
        if not q.get("explain"):
            errs.append("no explanation: " + q["q"][:50])
    for q in tf:
        if not isinstance(q["answer"], bool):
            errs.append("tf answer not bool")
        if not q.get("explain"):
            errs.append("no explanation tf")
    qs = [q["q"] for q in quiz]
    if len(set(qs)) != len(qs):
        errs.append("duplicate questions")
    # every section carries the verification stamp, last block
    for s in secs:
        if "Verified 2026-10-17 against published research-methodology sources" not in s["text"]:
            errs.append("missing stamp: " + s["title"])
        if not s["text"].rstrip().endswith("sources"):
            errs.append("stamp not last block: " + s["title"])
    blob = json.dumps(data, ensure_ascii=True)
    # public-module guard: no owner-personal data, no child data, no inner-circle names,
    # no case-specific or incident-internal detail
    banned = ["Sophia", "Maxine", "Saitta", "CPS", "Brady", "Nyx", "SARAH_WEEK_PACKAGE",
              "voice_protocol", "Edge TTS", "piper", "OpenRouter", "Saginaw",
              "Kalamazoo", "NEXT Distro", "BTNX", "DanceSafe", "Swarmchasers",
              "Tencent", "Flock", "AI Copium"]
    for name in banned:
        if name in blob:
            errs.append("NON-PUBLIC CONTENT: " + name)
    # period quirk: no '. ' inside abbreviations/names
    abbr = re.compile(
        r"(U\.S|U\.K|e\.g|i\.e|a\.m|p\.m|P\.O|St\.|Ave\.|Rd\.|Dr\.|Mr\.|Mrs\.|Ms\.|Jr\.|Sr\.|"
        r"Inc\.|Ltd\.|Co\.|Corp\.|No\.|Vol\.|etc\.|vs\.|approx\.|Dept\.|Govt\.|Assn\.|Ph\.D)\s")
    for s in secs:
        for m in abbr.finditer(s["text"]):
            errs.append("ABBR '. ' in %s: %s" % (s["title"], m.group(0)))
    # citation style: 'MCL 257.311' never followed by '. '
    for m in re.finditer(r"MCL \d+\.\d+[a-z]?\.\s", blob):
        errs.append("MCL '. ' violation: " + m.group(0))
    # markdown links well formed
    for m in re.finditer(r"\]\(([^)]*)\)", blob):
        if not m.group(1).startswith("https://"):
            errs.append("bad url: " + m.group(1))
    # required method elements present
    required = ["source-and-date", "custodian", "MCL 257.311", "legislature.mi.gov",
                "reality line", "independence test", "correlation", "verification stamp",
                "jurisdiction", "FOIA", "persist"]
    low = blob.lower()
    for r in required:
        if r.lower() not in low:
            errs.append("MISSING REQUIRED: " + r)
    return errs


def main():
    data = {"topic": TOPIC}
    errs = validate(TOPIC)
    raw = json.dumps(data, ensure_ascii=True, indent=2)
    json.loads(raw)  # round-trip
    if raw.encode("ascii", "strict") != raw.encode():  # pragma: no cover
        errs.append("non-ascii output")
    if errs:
        print("VALIDATION FAILED")
        for e in errs:
            print(" -", e)
        sys.exit(1)
    with open("data/sarah-research-methods.json", "w") as f:
        f.write(raw + "\n")
    print("wrote data/sarah-research-methods.json")
    register_topic()
    print("sections:", len(TOPIC["levels"]["beginner"]["concepts"]))
    print("quiz:", len(TOPIC["quiz"]["beginner"]),
          "mc:", sum(1 for q in TOPIC["quiz"]["beginner"] if q["type"] == "mc"),
          "tf:", sum(1 for q in TOPIC["quiz"]["beginner"] if q["type"] == "tf"))
    print("bytes:", len(raw) + 1)


def register_topic():
    """Register sarah-research-methods in data/topics.json, preserving file byte style."""
    path = "data/topics.json"
    with open(path) as f:
        original = f.read()
    data = json.loads(original)
    if not any(t["id"] == "sarah-research-methods" for t in data["topics"]):
        data["topics"].append({
            "id": "sarah-research-methods",
            "name": "Research Methods \u2014 Sources, Citations & Verification",
            "icon": "\U0001f50d",
            "description": "Provenance and the source-and-date rule, public-record research flow, MCL citation basics, verification chains, the reality line, consensus vs verification, and how to state a legality claim as jurisdiction, authority and date.",
            "subtopics": SUBTOPICS,
        })
    out = json.dumps(data, ensure_ascii=True, indent=2)
    out += "\n" if original.endswith("\n") else ""
    with open(path, "w") as f:
        f.write(out)
    print("registered sarah-research-methods in topics.json")


if __name__ == "__main__":
    main()
