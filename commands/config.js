import chalk from "chalk";
import { getConfig, saveConfig } from "../utils/config.js";
import { header, successBox, errorBox } from "../utils/ui.js";
import boxen from "boxen";
import path from "path";
import os from "os";

// ─── Provider Detection ───────────────────────────────────────────────────────
function detectProvider(key) {
    if (!key) return null;
    if (key.startsWith("gsk_")) return { name: "Groq", emoji: "⚡", color: "cyan", free: true, defaultModel: "llama3-8b-8192" };
    if (key.startsWith("AIza")) return { name: "Google Gemini", emoji: "🔵", color: "blue", free: true, defaultModel: "gemini-1.5-flash" };
    if (key.startsWith("sk-")) return { name: "OpenAI", emoji: "🟢", color: "green", free: false, defaultModel: "gpt-4o-mini" };
    return { name: "Unknown", emoji: "❓", color: "yellow", free: false, defaultModel: "unknown" };
}

const MODELS = {
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    groq: ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma-7b-it"],
    gemini: ["gemini-1.5-flash", "gemini-1.5-pro"],
};

export function configCommand(program) {
    const cmd = program
        .command("config")
        .description("⚙️  Manage DevMind AI configuration (API key, model, etc.)");

    cmd
        .option("--set-key <key>", "Set your AI API key (OpenAI / Groq / Gemini)")
        .option("--set-model <model>", "Set AI model")
        .option("--show", "Show current configuration")
        .option("--clear", "Reset all configuration")
        .option("--providers", "List all supported free/paid AI providers")
        .action((opts) => {
            header("⚙️", "DevMind Configuration");

            // ── List providers ──────────────────────────────────────────────
            if (opts.providers) {
                showProviders();
                return;
            }

            // ── Set API key ─────────────────────────────────────────────────
            if (opts.setKey) {
                const provider = detectProvider(opts.setKey);

                if (provider.name === "Unknown") {
                    console.log(chalk.yellow(
                        "  ⚠️  Unrecognized key format. Saving anyway...\n" +
                        "  Expected prefixes: sk- (OpenAI)  gsk_ (Groq)  AIza (Gemini)"
                    ));
                }

                saveConfig({ apiKey: opts.setKey });

                console.log(
                    boxen(
                        `${provider.emoji}  ${chalk.bold.white("Provider:")}  ${chalk[provider.color](provider.name)}\n` +
                        `🤖  ${chalk.bold.white("Default Model:")} ${chalk.cyan(provider.defaultModel)}\n` +
                        `✅  ${chalk.bold.green("API key saved! AI features unlocked.")}`,
                        { padding: { top: 1, bottom: 1, left: 2, right: 2 }, borderStyle: "round", borderColor: provider.color, margin: { top: 0, bottom: 1 } }
                    )
                );

                console.log(chalk.dim(`  Key stored in: ${path.join(os.homedir(), ".devmind", "config.json")}`));
                console.log(chalk.dim(`  Try: ${chalk.cyan("devmind idea \"web scraper\"")} to test it!\n`));
                return;
            }

            // ── Set model ───────────────────────────────────────────────────
            if (opts.setModel) {
                const allModels = [...MODELS.openai, ...MODELS.groq, ...MODELS.gemini];
                if (!allModels.includes(opts.setModel)) {
                    console.log(chalk.yellow(`  ⚠️  Unrecognized model. Common models:`));
                    Object.entries(MODELS).forEach(([p, ms]) => {
                        console.log(chalk.dim(`     ${p}: `) + chalk.white(ms.join(", ")));
                    });
                    console.log();
                }
                saveConfig({ model: opts.setModel });
                successBox(`Model set to: ${opts.setModel}`);
                return;
            }

            // ── Clear config ────────────────────────────────────────────────
            if (opts.clear) {
                saveConfig({ apiKey: null, model: "gpt-4o-mini" });
                console.log(chalk.yellow("  Configuration reset to defaults.\n"));
                return;
            }

            // ── Show config (default) ───────────────────────────────────────
            const config = getConfig();
            const provider = detectProvider(config.apiKey);
            const configPath = path.join(os.homedir(), ".devmind", "config.json");

            const keyDisplay = config.apiKey
                ? chalk.green(`...${config.apiKey.slice(-6)}  ✅`)
                : chalk.red("Not set  ❌");

            const providerDisplay = config.apiKey
                ? `${provider.emoji}  ${chalk[provider.color](provider.name)}${provider.free ? chalk.green(" (FREE)") : ""}`
                : chalk.dim("None");

            console.log(
                boxen(
                    chalk.bold.white("Current Configuration\n") +
                    chalk.dim("─".repeat(38)) + "\n" +
                    chalk.dim("  API Key:   ") + keyDisplay + "\n" +
                    chalk.dim("  Provider:  ") + providerDisplay + "\n" +
                    chalk.dim("  Model:     ") + chalk.cyan(config.model) + "\n" +
                    chalk.dim("  Config:    ") + chalk.gray(configPath),
                    {
                        padding: { top: 1, bottom: 1, left: 2, right: 2 },
                        borderStyle: "round",
                        borderColor: config.apiKey ? (provider.free ? "cyan" : "green") : "yellow",
                        margin: { top: 0, bottom: 1 },
                    }
                )
            );

            if (!config.apiKey) {
                showFreeKeyGuide();
            }
        });
}

// ─── Show Free Key Guide ──────────────────────────────────────────────────────
function showFreeKeyGuide() {
    console.log(chalk.bold.yellow("  ⚡ No API key set. Choose a FREE provider:\n"));

    const options = [
        {
            emoji: "🥇",
            name: "Groq  (BEST — Free + Fast)",
            steps: [
                "Go to  https://console.groq.com",
                "Sign up → API Keys → Create Key",
                'Key starts with "gsk_"',
            ],
            cmd: 'devmind config --set-key gsk_your_key_here',
        },
        {
            emoji: "🥈",
            name: "Google Gemini  (Free — 1500 req/day)",
            steps: [
                "Go to  https://aistudio.google.com/app/apikey",
                "Login with Google → Create API Key",
                'Key starts with "AIza"',
            ],
            cmd: 'devmind config --set-key AIzaYour_key_here',
        },
        {
            emoji: "🥉",
            name: "OpenAI  ($5 free credit on signup)",
            steps: [
                "Go to  https://platform.openai.com/api-keys",
                "Create account → API Keys",
                'Key starts with "sk-"',
            ],
            cmd: 'devmind config --set-key sk-your_key_here',
        },
    ];

    options.forEach(({ emoji, name, steps, cmd }) => {
        console.log(`  ${emoji}  ${chalk.bold.white(name)}`);
        steps.forEach((s, i) => {
            console.log(chalk.dim(`       Step ${i + 1}: `) + chalk.white(s));
        });
        console.log(chalk.dim("       Then run: ") + chalk.cyan(cmd));
        console.log();
    });

    console.log(chalk.dim("  ──────────────────────────────────────────────"));
    console.log(chalk.dim("  See all providers: ") + chalk.cyan("devmind config --providers\n"));
}

// ─── Show All Providers Table ─────────────────────────────────────────────────
function showProviders() {
    console.log(chalk.bold.white("\n  Supported AI Providers\n"));
    console.log(chalk.dim("  " + "─".repeat(60)));

    const rows = [
        ["🥇", "Groq", "gsk_...", "llama3-8b-8192", "Free", "⚡ Fastest"],
        ["🥈", "Google Gemini", "AIza...", "gemini-1.5-flash", "Free", "1500 req/day"],
        ["🥉", "OpenAI", "sk-...", "gpt-4o-mini", "$5 credit", "Best quality"],
        ["🔵", "Mistral AI", "any", "mistral-7b", "Free tier", "Open source"],
        ["🟡", "Together AI", "any", "llama3-70b", "$1 credit", "Many models"],
    ];

    const headers = ["", "Provider", "Key Prefix", "Default Model", "Cost", "Notes"];
    const widths = [3, 16, 12, 22, 12, 14];

    const row = (cols) => "  " + cols.map((c, i) => String(c).padEnd(widths[i])).join("  ");

    console.log(chalk.bold.cyan(row(headers)));
    console.log(chalk.dim("  " + "─".repeat(60)));
    rows.forEach(r => console.log(chalk.white(row(r))));
    console.log(chalk.dim("  " + "─".repeat(60)));

    console.log(chalk.dim("\n  Set a key: ") + chalk.cyan("devmind config --set-key YOUR_KEY"));
    console.log(chalk.dim("  The provider is auto-detected from the key prefix.\n"));
}
