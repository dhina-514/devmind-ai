import chalk from "chalk";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header } from "../utils/ui.js";

const SYSTEM = `You are DevMind AI, an expert software project advisor. 
When asked for project ideas in a domain, generate 5 detailed, unique, and impressive project ideas.
For each idea include: project name, one-line description, key features (3-4 bullet points), difficulty level, and estimated time.
Format output in a clean, readable way using markdown-style text for terminal output.`;

export function ideaCommand(program) {
    program
        .command("idea <domain>")
        .description("💡 Generate top project ideas for any domain")
        .option("-n, --count <number>", "Number of ideas to generate", "5")
        .action(async (domain, opts) => {
            header("💡", `Generating Project Ideas: ${chalk.yellow(domain)}`);

            const spinner = createSpinner("Brainstorming ideas with AI...").start();

            try {
                const prompt = `Generate ${opts.count} impressive, unique project ideas in the domain of: "${domain}". 
Each idea should be practical, resume-worthy, and achievable by a student or junior developer.
For each include: project name, description, 3 key features, difficulty (Beginner/Intermediate/Advanced), and estimated build time.`;

                const result = await askAI(SYSTEM, prompt, { mockType: "idea" });
                spinner.success({ text: chalk.green("Ideas generated!\n") });
                console.log(chalk.white(result));

                console.log(
                    "\n" +
                    chalk.dim(
                        `💡 Use ${chalk.cyan(
                            "devmind scaffold <project-name>"
                        )} to generate a folder structure for any of these ideas.`
                    )
                );
            } catch (err) {
                spinner.error({ text: chalk.red("Failed to generate ideas") });
                console.error(chalk.red(err.message));
            }
        });
}
