<div align="center">

# 🧠 DevMind AI

**AI-Powered CLI Assistant for Developers**

[![npm version](https://badge.fury.io/js/devmind-ai.svg)](https://badge.fury.io/js/devmind-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

*Generate project ideas • Scaffold structures • Get tech stacks • Fix errors • Build full starter apps*

</div>

---

## 🚀 Quick Start

```bash
npx devmind-ai
# or install globally:
npm install -g devmind-ai
devmind --help
```

---

## ✨ Commands

| Command | Description |
|---------|-------------|
| `devmind idea <domain>` | 💡 Generate project ideas |
| `devmind scaffold <stack>` | 📁 Create project folder structure |
| `devmind stack <project>` | 🛠️ Get tech stack recommendations |
| `devmind fix "<error>"` | 🔧 Explain and fix any error |
| `devmind roadmap <project>` | 🗺️ Generate a development roadmap |
| `devmind build <project>` | ⚡ Build a full starter project |
| `devmind readme` | 📝 Generate a professional README |
| `devmind scan [path]` | 🔍 Security scan for vulnerabilities |
| `devmind chat` | 💬 Interactive AI coding assistant |
| `devmind config` | ⚙️ Configure API key and settings |

---

## 📸 Usage Examples

### 💡 Generate Ideas
```bash
devmind idea "cybersecurity"
```
Output → 5 detailed project ideas with features, difficulty, and estimated time

### 📁 Scaffold a Project
```bash
devmind scaffold "node api"
# Creates: src/, routes/, controllers/, models/, tests/, package.json, .env.example
```

### 🛠️ Tech Stack
```bash
devmind stack "AI chatbot"
# Outputs a table: Frontend | Backend | Database | Auth | Deployment | ...
```

### 🔧 Fix Errors
```bash
devmind fix "TypeError: Cannot read properties of undefined"
# Output: Root cause, 3+ common causes, working code fix, prevention tip
```

### ⚡ Build Full Project (Killer Feature)
```bash
devmind build "password manager"
# Creates full project with starter code, README, package.json, .gitignore
```

### 🔍 Security Scan
```bash
devmind scan ./my-project
# Checks for: hardcoded secrets, SQL injection, eval(), weak random, HTTP URLs...
```

---

## ⚙️ Configuration (Unlock AI)

This tool works in **demo mode** out of the box with smart static responses.

To unlock **live AI capabilities** (OpenAI GPT):

```bash
devmind config --set-key sk-your-openai-key-here
```

Get your API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

```bash
# Change model (default: gpt-4o-mini)
devmind config --set-model gpt-4o

# Show current configuration
devmind config --show
```

---

## 🔍 Security Scanner Rules

| Rule | Severity | What it Detects |
|------|----------|-----------------|
| S001 | 🚨 CRITICAL | Hardcoded API keys |
| S002 | 🚨 CRITICAL | Hardcoded passwords |
| S003 | ⚠️ HIGH | Hardcoded secrets/tokens |
| S004 | ⚠️ HIGH | Dangerous `eval()` usage |
| S005 | 💛 MEDIUM | `console.log` in production |
| S006 | ⚠️ HIGH | SQL injection via template literals |
| S007 | 💛 MEDIUM | HTTP instead of HTTPS |
| S008 | ⚠️ HIGH | Weak `Math.random()` for security |
| S009 | 💛 MEDIUM | TLS verification disabled |
| S010 | ℹ️ LOW | Unresolved TODO/FIXME |

---

## 📁 Project Structure

```
devmind-ai/
├── bin/
│   └── devmind.js           # CLI entry point
├── commands/
│   ├── idea.js              # Project idea generator
│   ├── scaffold.js          # Project scaffolder
│   ├── readme.js            # README generator
│   ├── stack.js             # Tech stack advisor
│   ├── fix.js               # Error explainer
│   ├── roadmap.js           # Project roadmap
│   ├── build.js             # Full project builder
│   ├── scan.js              # Security scanner
│   ├── chat.js              # Interactive chat
│   └── config.js            # Configuration manager
├── utils/
│   ├── ai.js                # OpenAI API + mock responses
│   ├── config.js            # Config persistence
│   └── ui.js                # Shared terminal UI helpers
└── package.json
```

---

## 🏆 Why DevMind AI?

- **Works offline** — demo mode with intelligent responses, no API key required
- **10 commands** covering the full developer workflow
- **Security-focused** — built-in vulnerability scanner (great for cybersecurity students!)
- **Resume-worthy** — mentionable as a published npm package
- **Extensible** — clean command architecture makes it easy to add new commands

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/new-command`
3. Commit: `git commit -m 'feat: add new command'`
4. Push & open a PR

---

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

---

*Built with ❤️ by a cybersecurity student. Published to npm.*
