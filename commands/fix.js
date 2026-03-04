import chalk from "chalk";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header } from "../utils/ui.js";

const SYSTEM = `You are DevMind AI, an expert software debugger and senior developer.
When given an error message or code issue, analyze it thoroughly and respond with:
1. Error Type and Classification
2. Root Cause Explanation (clear, friendly language)
3. Most Common Causes (bullet list)
4. Step-by-Step Fix with code examples
5. Prevention Tip

Use markdown-style formatting. Be concise but thorough. Always include working code examples.`;

export function fixCommand(program) {
    program
        .command('fix <error>')
        .description("🔧 Explain and fix any error or bug with AI")
        .option('-l, --lang <language>', 'Programming language for context', 'auto-detect')
        .action(async (error, opts) => {
            header("🔧", "Error Analyzer & Fixer");

            console.log(chalk.dim("  Error: ") + chalk.red.bold(`"${error}"`));
            console.log();

            const spinner = createSpinner("Analyzing error...").start();

            try {
                const prompt = `Analyze this error and provide a fix:
Error: "${error}"
Language/Context: ${opts.lang}

Be specific, practical, and show working code examples.`;

                const result = await askAI(SYSTEM, prompt, { mockType: "fix", maxTokens: 1200 });

                spinner.success({ text: chalk.green("Analysis complete!\n") });

                // Format the output
                const lines = result.split("\n");
                lines.forEach(line => {
                    if (line.startsWith("##") || line.startsWith("#")) {
                        console.log(chalk.bold.cyan("\n" + line.replace(/^#+\s*/, "→ ").toUpperCase()));
                    } else if (line.startsWith("**") && line.endsWith("**")) {
                        console.log(chalk.bold.white(line.replace(/\*\*/g, "")));
                    } else if (line.startsWith("```")) {
                        console.log(chalk.dim(line));
                    } else if (line.startsWith("-") || line.startsWith("*")) {
                        console.log(chalk.gray("  " + line));
                    } else if (line.trim().length > 0) {
                        console.log(chalk.white(line));
                    } else {
                        console.log();
                    }
                });

                console.log("\n" + chalk.dim(`💡 Use ${chalk.cyan("devmind chat")} for an interactive debugging session.`));

            } catch (err) {
                spinner.error({ text: chalk.red("Analysis failed") });
                console.error(chalk.red(err.message));
            }
        });
}
