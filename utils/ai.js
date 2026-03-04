import axios from "axios";
import chalk from "chalk";
import { getConfig } from "./config.js";

// ─── Provider Endpoints ───────────────────────────────────────────────────────
const PROVIDERS = {
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
        detect: (key) => key.startsWith("sk-"),
    },
    groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        defaultModel: "llama3-8b-8192",
        detect: (key) => key.startsWith("gsk_"),
    },
    gemini: {
        url: null, // uses separate function
        defaultModel: "gemini-1.5-flash",
        detect: (key) => key.startsWith("AIza"),
    },
};

/**
 * Auto-detect provider from API key prefix, then call the right API.
 * Falls back to mock responses if no API key is configured.
 */
export async function askAI(systemPrompt, userPrompt, opts = {}) {
    const config = getConfig();

    if (!config.apiKey) {
        return getMockResponse(userPrompt, opts.mockType || "generic");
    }

    const provider = detectProvider(config.apiKey);

    if (provider === "gemini") {
        return callGemini(config.apiKey, systemPrompt, userPrompt, opts);
    }

    // Groq and OpenAI share the same API format
    return callOpenAICompatible(provider, config, systemPrompt, userPrompt, opts);
}

// ─── Detect Provider from Key Prefix ─────────────────────────────────────────
function detectProvider(key) {
    if (PROVIDERS.groq.detect(key)) return "groq";
    if (PROVIDERS.gemini.detect(key)) return "gemini";
    return "openai"; // default
}

// ─── OpenAI-Compatible Call (works for OpenAI + Groq) ────────────────────────
async function callOpenAICompatible(provider, config, systemPrompt, userPrompt, opts) {
    const p = PROVIDERS[provider];
    const model = config.model || p.defaultModel;

    const response = await axios.post(
        p.url,
        {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            max_tokens: opts.maxTokens || 1500,
            temperature: opts.temperature ?? 0.7,
        },
        {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data.choices[0].message.content.trim();
}

// ─── Google Gemini Call ───────────────────────────────────────────────────────
async function callGemini(apiKey, systemPrompt, userPrompt, opts) {
    // Try models in order from lightest to most capable
    const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];

    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const response = await axios.post(url, {
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userPrompt }]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: opts.maxTokens || 1500,
                    temperature: opts.temperature ?? 0.7,
                },
            });

            return response.data.candidates[0].content.parts[0].text.trim();

        } catch (err) {
            const status = err.response?.status;
            const detail = err.response?.data?.error?.message || err.message;

            if (status === 429) {
                // Extract retry delay from Gemini error message
                const retryMatch = detail.match(/retry in ([\d.]+)s/i);
                const waitSec = retryMatch ? Math.min(Math.ceil(parseFloat(retryMatch[1])), 60) : 30;

                if (model !== models[models.length - 1]) {
                    // Try next model
                    continue;
                }

                // Last model: wait and retry once
                process.stdout.write(chalk.yellow(`\n  ⏳ Rate limited. Waiting ${waitSec}s then retrying...`));
                await new Promise(r => setTimeout(r, waitSec * 1000));
                process.stdout.write(chalk.green(" Done!\n"));

                try {
                    const retry = await axios.post(url, {
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                        generationConfig: { maxOutputTokens: opts.maxTokens || 1500, temperature: opts.temperature ?? 0.7 },
                    });
                    return retry.data.candidates[0].content.parts[0].text.trim();
                } catch (retryErr) {
                    const retryDetail = retryErr.response?.data?.error?.message || retryErr.message;
                    throw new Error(`Gemini API error after retry: ${retryDetail}`);
                }
            }

            // Not a rate limit error — throw immediately
            throw new Error(`Gemini API error (${status}): ${detail}`);
        }
    }
}

// ─── Mock Responses (for demo / no API key) ───────────────────────────────────
function getMockResponse(prompt, type) {
    const domain = prompt.toLowerCase();

    const mocks = {
        idea: `## 💡 Project Ideas for "${prompt}"

**1. Advanced Threat Intelligence Dashboard**
   Build a real-time threat monitoring system with IP reputation scoring and geolocation mapping.

**2. Automated Penetration Testing Suite**
   A modular CLI tool that chains nmap, nikto, and sqlmap for structured pen-test workflows.

**3. Encrypted Password Vault**
   AES-256 encrypted credential manager with master-password derived keys (PBKDF2).

**4. Network Anomaly Detector**
   ML-based tool that baselines normal traffic and alerts on deviations using Z-score analysis.

**5. Phishing URL Analyzer**
   Checks URLs against VirusTotal API, WHOIS data, and heuristic scoring algorithms.

${chalk.dim("─".repeat(50))}
${chalk.yellow("⚡ Tip: Run `devmind config --set-key YOUR_KEY` for live AI-generated ideas!")}`,

        scaffold: `## 📁 Project Structure Generated

\`\`\`
${prompt}/
├── src/
│   ├── index.js          # Entry point
│   ├── config.js         # Configuration loader
│   └── utils.js          # Shared utilities
├── controllers/
│   ├── authController.js
│   └── dataController.js
├── models/
│   └── userModel.js
├── routes/
│   ├── auth.js
│   └── api.js
├── middleware/
│   └── validator.js
├── tests/
│   └── index.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
\`\`\``,

        stack: `## 🛠️ Recommended Tech Stack for "${prompt}"

| Layer        | Technology         | Reason                          |
|-------------|--------------------|---------------------------------|
| Frontend     | React + TypeScript | Component-based, type-safe      |
| Backend      | Node.js + Express  | Fast, scalable, JS ecosystem    |
| Database     | PostgreSQL         | Relational + JSON support       |
| Auth         | JWT + bcrypt       | Industry-standard security      |
| Cache        | Redis              | Session & rate limiting         |
| Deployment   | Docker + Railway   | Container-ready, free tier      |
| AI Feature   | OpenAI API         | Best-in-class language model    |`,

        fix: `## 🔧 Error Analysis

**Error Received:**
\`${prompt}\`

**Root Cause:**
This error typically occurs when you try to access a property or call a method on a value that is \`undefined\` or \`null\`.

**Common Causes:**
1. Variable not initialized before use
2. Async data not awaited properly
3. API response has a different shape than expected
4. Typo in variable/property name

**Fix:**
\`\`\`javascript
// ❌ Wrong
const result = data.user.name;

// ✅ Use optional chaining
const result = data?.user?.name;

// ✅ Or add a guard
if (data && data.user) {
  const result = data.user.name;
}
\`\`\`

**Prevention:**
- Enable TypeScript for type safety
- Always validate API response shapes  
- Use optional chaining (\`?.\`) liberally`,

        roadmap: `## 🗺️ Project Roadmap: "${prompt}"

**Phase 1 — Foundation (Week 1-2)**
- [ ] Define requirements and architecture
- [ ] Set up development environment
- [ ] Initialize repository with CI/CD pipeline
- [ ] Create base project structure

**Phase 2 — Core Development (Week 3-5)**
- [ ] Implement core business logic
- [ ] Build database schema and models
- [ ] Create REST API endpoints
- [ ] Write unit tests (aim for 80%+ coverage)

**Phase 3 — Features (Week 6-8)**
- [ ] Build frontend UI
- [ ] Integrate authentication system
- [ ] Connect all components end-to-end
- [ ] Implement error handling & logging

**Phase 4 — Polish & Deploy (Week 9-10)**
- [ ] Performance optimization
- [ ] Security audit
- [ ] Write documentation
- [ ] Deploy to production`,

        generic: `## 🧠 DevMind AI Response

Based on your query: "${prompt}"

This is a demo response. To unlock full AI capabilities with personalized, 
context-aware answers, set your OpenAI API key:

${chalk.cyan("  devmind config --set-key sk-your-openai-key-here")}

Then try again for live AI-powered responses!`,
    };

    return mocks[type] || mocks.generic;
}
