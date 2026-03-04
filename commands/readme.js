import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header, successBox } from "../utils/ui.js";

const SYSTEM = `You are DevMind AI, a technical writer and software architect.
Generate a professional, detailed README.md for the given project.
The README must include: project title with emoji, description, features list, tech stack, installation steps, usage examples, contributing guidelines, and license.
Use proper markdown formatting with code blocks.`;

export function readmeCommand(program) {
    program
        .command("readme")
        .description("📝 Generate a professional README.md for your project")
        .option("-o, --output <file>", "Output file path", "README.md")
        .action(async (opts) => {
            header("📝", "README Generator");

            // Gather project info
            const answers = await inquirer.prompt([
                {
                    type: "input",
                    name: "name",
                    message: "Project name:",
                    default: path.basename(process.cwd()),
                },
                {
                    type: "input",
                    name: "description",
                    message: "Short description:",
                    default: "An awesome project built with DevMind AI",
                },
                {
                    type: "input",
                    name: "tech",
                    message: "Tech stack (e.g. Node.js, React, PostgreSQL):",
                    default: "Node.js, Express, MongoDB",
                },
                {
                    type: "input",
                    name: "features",
                    message: "Key features (comma-separated):",
                    default: "Authentication, REST API, Database integration",
                },
                {
                    type: "input",
                    name: "author",
                    message: "Author name:",
                    default: "Your Name",
                },
                {
                    type: "list",
                    name: "license",
                    message: "License:",
                    choices: ["MIT", "Apache 2.0", "GPL-3.0", "ISC", "None"],
                    default: "MIT",
                },
            ]);

            const spinner = createSpinner("Crafting your README...").start();

            try {
                const prompt = `Generate a professional README.md for:
Project Name: ${answers.name}
Description: ${answers.description}
Tech Stack: ${answers.tech}
Features: ${answers.features}
Author: ${answers.author}
License: ${answers.license}

Make it comprehensive, professional, and impressive for GitHub.`;

                const result = await askAI(SYSTEM, prompt, {
                    mockType: "generic",
                    maxTokens: 2000,
                });

                spinner.success({ text: chalk.green("README generated!\n") });

                // If AI gave markdown back, or use templated version
                let readmeContent = result;
                if (!result.includes("#")) {
                    readmeContent = buildReadmeTemplate(answers);
                }

                const outputPath = path.resolve(opts.output);
                await fs.writeFile(outputPath, readmeContent, "utf-8");

                successBox(`README.md saved to: ${outputPath}`);

                // Show a preview
                console.log(chalk.dim("\n── Preview (first 20 lines) ──\n"));
                const lines = readmeContent.split("\n").slice(0, 20);
                lines.forEach((line) => {
                    if (line.startsWith("#")) console.log(chalk.bold.cyan(line));
                    else if (line.startsWith("-") || line.startsWith("*"))
                        console.log(chalk.white("  " + line));
                    else console.log(chalk.gray(line));
                });
                console.log(chalk.dim("\n  ... (open the file to see the full README)\n"));
            } catch (err) {
                spinner.error({ text: chalk.red("Failed to generate README") });
                console.error(chalk.red(err.message));
            }
        });
}

function buildReadmeTemplate(answers) {
    const featList = answers.features
        .split(",")
        .map((f) => `- ✅ ${f.trim()}`)
        .join("\n");
    const techList = answers.tech
        .split(",")
        .map((t) => `- ${t.trim()}`)
        .join("\n");
    const slug = answers.name.toLowerCase().replace(/\s+/g, "-");

    return `# 🚀 ${answers.name}

> ${answers.description}

[![License](https://img.shields.io/badge/license-${answers.license}-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## ✨ Features

${featList}

---

## 🛠️ Tech Stack

${techList}

---

## 📦 Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${answers.author.toLowerCase().replace(/\s+/, "")}/${slug}.git

# Navigate into the project
cd ${slug}

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start the application
npm run dev
\`\`\`

---

## 🚀 Usage

\`\`\`bash
# Development mode (with hot-reload)
npm run dev

# Production mode
npm start

# Run tests
npm test
\`\`\`

### API Endpoints (if applicable)

| Method | Route | Description |
|--------|-------|-------------|
| GET | \`/\` | Health check |
| GET | \`/api/v1/items\` | Get all items |
| POST | \`/api/v1/items\` | Create new item |
| PUT | \`/api/v1/items/:id\` | Update item |
| DELETE | \`/api/v1/items/:id\` | Delete item |

---

## 📁 Project Structure

\`\`\`
${slug}/
├── src/
│   ├── controllers/    # Route handlers
│   ├── models/         # Data models
│   ├── routes/         # Express routes
│   ├── middleware/     # Custom middleware
│   └── index.js        # App entry point
├── tests/              # Test files
├── .env.example        # Environment template
├── package.json
└── README.md
\`\`\`

---

## 🧪 Running Tests

\`\`\`bash
npm test
# or
npm run test:coverage
\`\`\`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit your changes: \`git commit -m 'feat: add amazing feature'\`
4. Push to the branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **${answers.license} License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**${answers.author}**

- GitHub: [@${answers.author.toLowerCase().replace(/\s+/, "")}](https://github.com/${answers.author.toLowerCase().replace(/\s+/, "")})

---

*Generated with ❤️ by [DevMind AI](https://github.com/yourusername/devmind-ai)*
`;
}
