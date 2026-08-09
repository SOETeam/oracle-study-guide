# Oracle Study Guide 📚

**A free, interactive learning platform that adapts to you.**

Pick a topic, take a quick 10-question quiz to find your level, and get a study guide tailored exactly to where you are — beginner, intermediate, or advanced.

Built with plain HTML, Tailwind CSS, and vanilla JavaScript. No frameworks, no accounts, no paywalls. Everything runs in your browser.

## ✨ Features

- 🧭 **Hash-based routing** — `#home`, `#topic/law`, `#quiz/law`, `#guide/law`
- 🎯 **Adaptive placement quizzes** — 10 questions per level (multiple choice + true/false), instant feedback with explanations
- 📖 **Level-matched study guides** — concepts, real-world examples, pitfalls, glossary, exercises
- 📊 **Progress dashboard** — quiz scores and completed topics saved in your browser (localStorage), retake anytime
- 🖨️ **Print-friendly study guides**
- 📱 **Mobile responsive**, SOETech dark theme (midnight navy / emerald teal / accent gold)

## 🗂️ Topics

| Topic | What you'll learn |
|---|---|
| ⚖️ Law & Legal | Michigan Traffic Law — the rules of the road, no-fault insurance, your rights in a stop |
| 💼 Business & Entrepreneurship | Starting and running a business |
| 💻 Technology & AI | Modern technology and artificial intelligence |
| 🏥 Health & Wellness | Personal health, nutrition, and wellness |
| 💰 Finance & Money | Personal finance and money management |

## ▶️ Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

> Note: `fetch()` is used to load topic JSON, so serve over HTTP rather than opening `index.html` directly from disk.

## ➕ Add a topic

1. Copy `data/law.json` → `data/<topic-id>.json` (same schema: `topic.levels`, `topic.quiz`, `topic.glossary`)
2. Add the topic entry to `data/topics.json`
3. Commit and push — GitHub Pages deploys automatically.

## 🌐 Deployment

Live at **https://soeteam.github.io/oracle-study-guide/** — hosted on GitHub Pages.

---

Built by SOETech. Learn anything, free forever.