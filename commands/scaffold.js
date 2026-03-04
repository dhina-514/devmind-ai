import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
import { createSpinner } from "nanospinner";
import inquirer from "inquirer";
import { askAI } from "../utils/ai.js";
import { header, successBox } from "../utils/ui.js";

const SYSTEM = `You are DevMind AI, a senior software architect. 
When asked to scaffold a project, respond ONLY with a JSON object describing the folder and file structure.
The JSON format must be: { "structure": [ { "type": "dir"|"file", "path": "relative/path", "content": "file content if type is file" } ] }
Always include: package.json or requirements.txt or equivalent, README.md, .gitignore, source files, and a main entry point.
Keep file content minimal but functional (stubs with comments).`;

const GITIGNORE_CONTENT = `node_modules/
.env
.DS_Store
dist/
build/
coverage/
*.log
`;

const DEFAULT_GITIGNORE = GITIGNORE_CONTENT;

export function scaffoldCommand(program) {
    program
        .command("scaffold <template>")
        .description("📁 Generate a project folder structure for any stack")
        .option("-o, --output <dir>", "Output directory", ".")
        .option("-y, --yes", "Skip confirmation prompt")
        .action(async (template, opts) => {
            header("📁", `Scaffolding Project: ${chalk.yellow(template)}`);

            // Ask for project name if not confirmed
            let projectName = template.toLowerCase().replace(/\s+/g, "-");

            if (!opts.yes) {
                const answers = await inquirer.prompt([
                    {
                        type: "input",
                        name: "name",
                        message: "Project name:",
                        default: projectName,
                    },
                    {
                        type: "list",
                        name: "confirm",
                        message: `Create project "${projectName}" in ${path.resolve(opts.output)}?`,
                        choices: ["Yes", "No"],
                    },
                ]);
                if (answers.confirm === "No") {
                    console.log(chalk.yellow("Cancelled."));
                    return;
                }
                projectName = answers.name;
            }

            const spinner = createSpinner("Designing project structure...").start();

            try {
                const prompt = `Design a complete project scaffold for: "${template}".
Project name: ${projectName}
Include all standard files for this type of project.
Make it production-ready with proper structure.`;

                let rawResult = await askAI(SYSTEM, prompt, {
                    mockType: "scaffold",
                    maxTokens: 2000,
                });

                spinner.success({ text: chalk.green("Structure designed!\n") });

                const outputDir = path.resolve(opts.output, projectName);

                // Try to parse JSON response from AI
                let files = getDefaultStructure(projectName, template);
                try {
                    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.structure) files = parsed.structure;
                    }
                } catch { }

                // Create files
                const createSpinner2 = createSpinner(
                    `Creating files in ${chalk.cyan(outputDir)}...`
                ).start();
                await createStructure(outputDir, files, projectName, template);
                createSpinner2.success({
                    text: chalk.green(`Project created at ${outputDir}\n`),
                });

                // Show tree
                printTree(outputDir, projectName);

                successBox(`Project "${projectName}" scaffolded successfully!`);
                console.log(
                    chalk.dim(
                        `\n📌 Next: ${chalk.cyan("cd " + projectName + " && npm install")}`
                    )
                );
            } catch (err) {
                spinner.error({ text: chalk.red("Scaffold failed") });
                console.error(chalk.red(err.message));
            }
        });
}

function getDefaultStructure(name, template) {
    const t = template.toLowerCase();
    const isNode = t.includes("node") || t.includes("api") || t.includes("express");
    const isPython = t.includes("python") || t.includes("flask") || t.includes("django");
    const isReact = t.includes("react") || t.includes("frontend");

    if (isPython) {
        return [
            { type: "dir", path: "src" },
            { type: "dir", path: "tests" },
            { type: "file", path: "src/__init__.py", content: "" },
            { type: "file", path: "src/main.py", content: `# ${name} - Main entry point\n\ndef main():\n    print("Hello from ${name}!")\n\nif __name__ == "__main__":\n    main()\n` },
            { type: "file", path: "src/config.py", content: `# Configuration\nimport os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\nDEBUG = os.getenv("DEBUG", "false").lower() == "true"\n` },
            { type: "file", path: "tests/test_main.py", content: `import unittest\nfrom src.main import main\n\nclass TestMain(unittest.TestCase):\n    def test_runs(self):\n        self.assertIsNone(main())\n` },
            { type: "file", path: "requirements.txt", content: "python-dotenv==1.0.0\n" },
            { type: "file", path: ".env.example", content: "DEBUG=false\n" },
            { type: "file", path: ".gitignore", content: "__pycache__/\n*.pyc\n.env\nvenv/\n.DS_Store\n" },
            { type: "file", path: "README.md", content: getReadme(name, template) },
        ];
    }

    if (isReact) {
        return [
            { type: "dir", path: "src" },
            { type: "dir", path: "src/components" },
            { type: "dir", path: "src/pages" },
            { type: "dir", path: "src/hooks" },
            { type: "dir", path: "public" },
            { type: "file", path: "src/main.jsx", content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n` },
            { type: "file", path: "src/App.jsx", content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>${name}</h1>\n    </div>\n  );\n}\n\nexport default App;\n` },
            { type: "file", path: "src/index.css", content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: Inter, sans-serif; }\n` },
            { type: "file", path: "public/index.html", content: `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><title>${name}</title></head>\n<body><div id="root"></div></body>\n</html>\n` },
            { type: "file", path: "package.json", content: JSON.stringify({ name, version: "0.1.0", private: true, scripts: { dev: "vite", build: "vite build", preview: "vite preview" }, dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" }, devDependencies: { vite: "^5.0.0", "@vitejs/plugin-react": "^4.0.0" } }, null, 2) },
            { type: "file", path: ".gitignore", content: DEFAULT_GITIGNORE },
            { type: "file", path: "README.md", content: getReadme(name, template) },
        ];
    }

    // Default: Node.js
    return [
        { type: "dir", path: "src" },
        { type: "dir", path: "src/controllers" },
        { type: "dir", path: "src/models" },
        { type: "dir", path: "src/routes" },
        { type: "dir", path: "src/middleware" },
        { type: "dir", path: "src/utils" },
        { type: "dir", path: "tests" },
        { type: "file", path: "src/index.js", content: `import express from 'express';\nimport dotenv from 'dotenv';\n\ndotenv.config();\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => res.json({ message: 'Welcome to ${name}!' }));\n\napp.listen(PORT, () => console.log(\`🚀 ${name} running on port \${PORT}\`));\n` },
        { type: "file", path: "src/utils/logger.js", content: `export const log = (msg) => console.log(\`[\${new Date().toISOString()}] \${msg}\`);\nexport const error = (msg) => console.error(\`[\${new Date().toISOString()}] ERROR: \${msg}\`);\n` },
        { type: "file", path: "src/middleware/errorHandler.js", content: `export function errorHandler(err, req, res, next) {\n  console.error(err.stack);\n  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });\n}\n` },
        { type: "file", path: "package.json", content: JSON.stringify({ name, version: "1.0.0", type: "module", scripts: { start: "node src/index.js", dev: "nodemon src/index.js", test: "jest" }, dependencies: { express: "^4.18.2", dotenv: "^16.3.1" }, devDependencies: { nodemon: "^3.0.1", jest: "^29.7.0" } }, null, 2) },
        { type: "file", path: ".env.example", content: "PORT=3000\nNODE_ENV=development\nDB_URL=\nJWT_SECRET=your_secret_here\n" },
        { type: "file", path: ".gitignore", content: DEFAULT_GITIGNORE },
        { type: "file", path: "README.md", content: getReadme(name, template) },
    ];
}

async function createStructure(baseDir, files, name, template) {
    await fs.ensureDir(baseDir);
    for (const item of files) {
        const fullPath = path.join(baseDir, item.path);
        if (item.type === "dir") {
            await fs.ensureDir(fullPath);
        } else {
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, item.content || "");
        }
    }
}

function printTree(baseDir, name) {
    console.log(chalk.bold.white(`\n  📂 ${name}/`));
    try {
        const entries = getAllEntries(baseDir, 0);
        entries.forEach(({ depth, name: n, isDir }) => {
            const indent = "  " + "  ".repeat(depth);
            const prefix = depth === 0 ? "├── " : "│   ".repeat(depth - 1) + "├── ";
            const icon = isDir ? "📁 " : "📄 ";
            const color = isDir ? chalk.cyan : chalk.white;
            console.log(indent + color(icon + n));
        });
    } catch { }
    console.log();
}

function getAllEntries(dir, depth, max = 3) {
    if (depth >= max) return [];
    const entries = [];
    try {
        const items = fs.readdirSync(dir);
        for (const item of items.slice(0, 15)) {
            const full = path.join(dir, item);
            const isDir = fs.statSync(full).isDirectory();
            entries.push({ depth, name: item, isDir });
            if (isDir && depth < max - 1) {
                entries.push(...getAllEntries(full, depth + 1, max));
            }
        }
    } catch { }
    return entries;
}

function getReadme(name, template) {
    return `# ${name}

> Generated by DevMind AI — AI-Powered Project Assistant

## 📋 Description

${name} is a ${template} project.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18 (or Python 3.9+)
- npm or pip

### Installation

\`\`\`bash
# Clone the repo
git clone https://github.com/yourname/${name}.git
cd ${name}

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
\`\`\`

## 📁 Project Structure

\`\`\`
${name}/
├── src/           # Source code
├── tests/         # Test files
├── .env.example   # Environment template
└── README.md      # This file
\`\`\`

## 🤝 Contributing

Pull requests are welcome!

## 📄 License

MIT
`;
}
