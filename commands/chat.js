import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header } from "../utils/ui.js";
import { getConfig } from "../utils/config.js";
import boxen from "boxen";

const SYSTEM = `You are DevMind AI, a helpful, knowledgeable developer assistant.
Answer coding questions, help debug issues, explain concepts, review code, and assist with project planning.
Be concise, practical, and always provide working code examples when relevant.
Format your responses clearly for terminal display.`;

export function chatCommand(program) {
    program
        .command("chat")
        .description("💬 Start an interactive AI chat session for coding help")
        .action(async () => {
            const config = getConfig();

            header("💬", "DevMind AI Chat");

            console.log(
                boxen(
                    chalk.white("Welcome to DevMind AI Chat! 🧠\n") +
                    chalk.gray("Type your coding questions, paste errors, or ask for help.\n") +
                    chalk.dim('Type "exit" or "quit" to end the session.') +
                    (config.apiKey
                        ? "\n" + chalk.green("✅ Connected to OpenAI")
                        : "\n" + chalk.yellow("⚠️  Demo mode — set API key for live AI: devmind config --set-key YOUR_KEY")),
                    {
                        padding: { top: 0, bottom: 0, left: 2, right: 2 },
                        borderStyle: "round",
                        borderColor: config.apiKey ? "green" : "yellow",
                        margin: { top: 0, bottom: 1 },
                    }
                )
            );

            const history = [];
            let turn = 0;

            while (true) {
                let input = "";
                try {
                    const answers = await inquirer.prompt([
                        {
                            type: "input",
                            name: "input",
                            message: chalk.cyan("You →"),
                            prefix: "",
                        },
                    ]);
                    input = answers.input;
                } catch (err) {
                    if (err.name === "ExitPromptError" || err.message.includes("force closed")) {
                        console.log(chalk.cyan("\n  👋 Goodbye! Happy coding!\n"));
                        process.exit(0);
                    }
                    console.error(chalk.red("\n  ⚠️ Chat ended due to error.\n"));
                    process.exit(1);
                }

                const trimmed = input.trim();
                if (!trimmed) continue;
                if (["exit", "quit", "bye", "q"].includes(trimmed.toLowerCase())) {
                    console.log(
                        chalk.cyan("\n  👋 Goodbye! Happy coding!\n")
                    );
                    process.exit(0);
                }

                turn++;
                history.push({ role: "user", content: trimmed });

                const spinner = createSpinner("Thinking...").start();

                try {
                    // Build contextual prompt with history
                    const contextPrompt = history
                        .slice(-6) // last 3 exchanges for context
                        .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
                        .join("\n");

                    const result = await askAI(SYSTEM, contextPrompt, {
                        mockType: getResponseType(trimmed),
                        maxTokens: 1000,
                    });

                    spinner.clear();

                    console.log("\n" + chalk.bold.cyan("  DevMind →"));
                    console.log(chalk.dim("  " + "─".repeat(46)));

                    const lines = result.split("\n");
                    lines.forEach((line) => {
                        if (line.startsWith("```")) {
                            console.log(chalk.dim("  " + line));
                        } else if (line.startsWith("#")) {
                            console.log(chalk.bold.white("  " + line));
                        } else if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
                            console.log(chalk.gray("  " + line));
                        } else {
                            console.log(chalk.white("  " + line));
                        }
                    });
                    console.log();

                    history.push({ role: "assistant", content: result });

                } catch (err) {
                    spinner.error({ text: chalk.red("Failed to get response") });
                    console.error(chalk.red("  " + err.message + "\n"));
                }
            }
        });
}

function getResponseType(input) {
    const i = input.toLowerCase();
    if (i.includes("error") || i.includes("TypeError") || i.includes("undefined")) return "fix";
    if (i.includes("idea") || i.includes("project")) return "idea";
    if (i.includes("stack") || i.includes("tech") || i.includes("framework")) return "stack";
    if (i.includes("roadmap") || i.includes("plan")) return "roadmap";
    return "generic";
}
