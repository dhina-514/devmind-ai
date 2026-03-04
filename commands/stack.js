import chalk from "chalk";
import Table from "cli-table3";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header } from "../utils/ui.js";

const SYSTEM = `You are DevMind AI, a senior software architect with expertise in choosing tech stacks.
Given a project description, recommend the best technologies for each layer.
Respond ONLY with valid JSON in this format:
{
  "stack": [
    { "layer": "Frontend", "tech": "React + TypeScript", "reason": "Component-based, type-safe, huge ecosystem" },
    { "layer": "Backend", "tech": "Node.js + Express", "reason": "Fast, scalable, JS throughout" },
    ...
  ],
  "deployment": "Docker + AWS EC2",
  "extras": ["Redis for caching", "GitHub Actions for CI/CD"]
}
Include 6-8 layers covering frontend, backend, database, auth, caching, deployment, testing, monitoring as appropriate.`;

export function stackCommand(program) {
    program
        .command("stack <project>")
        .description("🛠️  Get AI tech stack recommendations for your project")
        .action(async (project) => {
            header("🛠️", `Tech Stack Suggestions: ${chalk.yellow(project)}`);

            const spinner = createSpinner("Analyzing best tech stack...").start();

            try {
                const prompt = `Suggest the best tech stack for this project: "${project}".
Consider: scalability, developer experience, community support, and suitability for the project type.
Provide specific technology choices with brief reasoning.`;

                const result = await askAI(SYSTEM, prompt, {
                    mockType: "stack",
                    maxTokens: 1000,
                });

                spinner.success({ text: chalk.green("Stack analyzed!\n") });

                // Try to parse JSON response
                let stackData = null;
                try {
                    const jsonMatch = result.match(/\{[\s\S]*\}/);
                    if (jsonMatch) stackData = JSON.parse(jsonMatch[0]);
                } catch { }

                if (stackData && stackData.stack) {
                    // Render as a beautiful table
                    const table = new Table({
                        head: [
                            chalk.bold.cyan("Layer"),
                            chalk.bold.cyan("Technology"),
                            chalk.bold.cyan("Why"),
                        ],
                        style: { border: ["dim"], head: [] },
                        colWidths: [16, 24, 40],
                        wordWrap: true,
                    });

                    stackData.stack.forEach(({ layer, tech, reason }) => {
                        table.push([
                            chalk.bold.white(layer),
                            chalk.green(tech),
                            chalk.gray(reason),
                        ]);
                    });

                    console.log(table.toString());

                    if (stackData.deployment) {
                        console.log(
                            chalk.bold.white("\n  🚢 Deployment: ") +
                            chalk.green(stackData.deployment)
                        );
                    }

                    if (stackData.extras && stackData.extras.length) {
                        console.log(chalk.bold.white("\n  ⚡ Additional Tools:"));
                        stackData.extras.forEach((e) =>
                            console.log(chalk.gray(`     • ${e}`))
                        );
                    }
                } else {
                    // Fallback: print the raw markdown result
                    console.log(chalk.white(result));
                }

                console.log(
                    "\n" +
                    chalk.dim(
                        `💡 Use ${chalk.cyan(
                            "devmind scaffold <project>"
                        )} to generate a project structure using this stack.`
                    )
                );
            } catch (err) {
                spinner.error({ text: chalk.red("Failed to analyze stack") });
                console.error(chalk.red(err.message));
            }
        });
}
