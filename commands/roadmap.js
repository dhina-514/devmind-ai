import chalk from "chalk";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header } from "../utils/ui.js";

const SYSTEM = `You are DevMind AI, a project planning expert and senior engineering manager.
Create detailed, phased project roadmaps with realistic timelines.
Structure your response as clear phases, each with: phase name, duration, specific tasks (numbered), deliverable, and milestone.
Use clear markdown formatting suitable for terminal display.`;

export function roadmapCommand(program) {
    program
        .command("roadmap <project>")
        .description("🗺️  Generate a detailed project roadmap with phases")
        .option("-w, --weeks <number>", "Target project duration in weeks", "8")
        .option("-l, --level <level>", "Skill level: beginner|intermediate|advanced", "intermediate")
        .action(async (project, opts) => {
            header("🗺️", `Project Roadmap: ${chalk.yellow(project)}`);

            console.log(
                chalk.dim(`  Duration: ${opts.weeks} weeks │ Level: ${opts.level}\n`)
            );

            const spinner = createSpinner("Generating roadmap...").start();

            try {
                const prompt = `Create a ${opts.weeks}-week project roadmap for: "${project}"
Skill level: ${opts.level}
Break into 4-6 clear phases. Each phase should have 4-6 specific tasks.
Include milestones and deliverables. Be specific and actionable.`;

                const result = await askAI(SYSTEM, prompt, {
                    mockType: "roadmap",
                    maxTokens: 2000,
                });

                spinner.success({ text: chalk.green("Roadmap generated!\n") });

                // Pretty-print the roadmap
                const lines = result.split("\n");
                let inPhase = false;

                lines.forEach((line) => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        console.log();
                        return;
                    }

                    // Phase headers
                    if (trimmed.match(/^##?\s*(phase|step|week|stage)/i) || trimmed.match(/^\*\*phase/i)) {
                        inPhase = true;
                        console.log("\n" + chalk.bold.cyan("━".repeat(50)));
                        console.log(
                            chalk.bold.white(
                                "  " + trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "")
                            )
                        );
                        console.log(chalk.dim("  " + "─".repeat(46)));
                    }
                    // Numbered tasks
                    else if (trimmed.match(/^\d+\./)) {
                        console.log(chalk.white("    " + trimmed));
                    }
                    // Bullet tasks
                    else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                        const task = trimmed.slice(1).trim();
                        if (task.toLowerCase().includes("milestone") || task.toLowerCase().includes("deliverable")) {
                            console.log(chalk.yellow("    🏁 " + task));
                        } else if (task.startsWith("[") && task.includes("]")) {
                            console.log(chalk.white("    ☐  " + task.replace(/^\[.\]\s*/, "")));
                        } else {
                            console.log(chalk.gray("    •  " + task));
                        }
                    }
                    // Section headers
                    else if (trimmed.startsWith("#")) {
                        console.log("\n" + chalk.bold.cyan(trimmed.replace(/^#+\s*/, "→ ")));
                    }
                    // Bold text (milestones)
                    else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                        console.log(chalk.yellow("\n  🏆 " + trimmed.replace(/\*\*/g, "")));
                    }
                    // Normal text
                    else {
                        console.log(chalk.gray("  " + trimmed));
                    }
                });

                console.log("\n" + chalk.dim("─".repeat(50)));
                console.log(
                    chalk.dim(
                        `\n💡 Use ${chalk.cyan("devmind build \"" + project + "\"")} to auto-scaffold this project!`
                    )
                );
            } catch (err) {
                spinner.error({ text: chalk.red("Roadmap generation failed") });
                console.error(chalk.red(err.message));
            }
        });
}
