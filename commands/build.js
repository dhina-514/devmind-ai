import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { askAI } from "../utils/ai.js";
import { header, successBox } from "../utils/ui.js";

const SYSTEM_IDEAS = `You are DevMind AI, an expert software architect and senior developer.
Given a project name, generate: a description, tech stack (as JSON), list of features, a sample main file with real starter code, and a .gitignore.
Respond ONLY with valid JSON:
{
  "description": "...",
  "tech": { "runtime": "Node.js", "framework": "Express", "database": "MongoDB", "extra": [] },
  "features": ["...", "..."],
  "mainFileContent": "// starter code here",
  "packageJsonDeps": { "express": "^4.18.2" },
  "packageJsonDevDeps": { "nodemon": "^3.0.1" }
}`;

export function buildCommand(program) {
    program
        .command("build <project>")
        .description("⚡ Build a full starter project with code, README, and structure")
        .option("-o, --output <dir>", "Output directory", ".")
        .option("-y, --yes", "Skip confirmation")
        .action(async (project, opts) => {
            header("⚡", `Full Project Builder: ${chalk.yellow(project)}`);

            console.log(
                chalk.dim(
                    "  This will generate: folder structure + starter code + README + package.json\n"
                )
            );

            if (!opts.yes) {
                const { confirm } = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "confirm",
                        message: `Build full project for "${project}"?`,
                        default: true,
                    },
                ]);
                if (!confirm) {
                    console.log(chalk.yellow("Cancelled."));
                    return;
                }
            }

            const projectName = project.toLowerCase().replace(/\s+/g, "-");
            const outputDir = path.resolve(opts.output, projectName);

            // Step 1: AI analysis
            const s1 = createSpinner("🧠 AI analyzing project requirements...").start();
            let projectData = getDefaultProjectData(project, projectName);

            try {
                const result = await askAI(SYSTEM_IDEAS, `Build project: "${project}"`, {
                    mockType: "generic",
                    maxTokens: 2000,
                });

                try {
                    const jsonMatch = result.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        projectData = { ...projectData, ...parsed };
                    }
                } catch { }

                s1.success({ text: chalk.green("Requirements analyzed!") });
            } catch {
                s1.success({ text: chalk.yellow("Using smart defaults...") });
            }

            // Step 2: Create structure
            const s2 = createSpinner("📁 Creating project structure...").start();
            await fs.ensureDir(outputDir);
            await createProjectFiles(outputDir, projectName, project, projectData);
            s2.success({ text: chalk.green("Structure created!") });

            // Step 3: Write README
            const s3 = createSpinner("📝 Writing README.md...").start();
            await fs.writeFile(
                path.join(outputDir, "README.md"),
                buildReadme(projectName, project, projectData)
            );
            s3.success({ text: chalk.green("README written!") });

            // Step 4: .gitignore and .env
            const s4 = createSpinner("⚙️  Writing config files...").start();
            await fs.writeFile(
                path.join(outputDir, ".gitignore"),
                `node_modules/\n.env\n.DS_Store\ndist/\nbuild/\n*.log\n`
            );
            await fs.writeFile(
                path.join(outputDir, ".env.example"),
                `PORT=3000\nNODE_ENV=development\n# Add your environment variables here\n`
            );
            s4.success({ text: chalk.green("Config files written!") });

            // Final summary
            console.log("\n");
            successBox(`🎉 Project "${projectName}" built successfully!`);

            console.log(
                chalk.bold.white("\n  📦 What was created:\n") +
                chalk.cyan(`     📁 ${projectName}/\n`) +
                chalk.white(`        ├── src/        (source code)\n`) +
                chalk.white(`        ├── tests/      (test files)\n`) +
                chalk.white(`        ├── README.md   (full documentation)\n`) +
                chalk.white(`        ├── package.json\n`) +
                chalk.white(`        ├── .env.example\n`) +
                chalk.white(`        └── .gitignore\n`)
            );

            console.log(chalk.bold.white("  🚀 Next Steps:\n"));
            [
                `cd ${projectName}`,
                `npm install`,
                `cp .env.example .env`,
                `npm run dev`,
            ].forEach((cmd, i) => {
                console.log(
                    chalk.dim(`     ${i + 1}. `) + chalk.cyan(cmd)
                );
            });

            console.log(
                "\n" +
                chalk.dim(
                    `  💡 Also run: ${chalk.cyan("devmind roadmap \"" + project + "\"")} for a development roadmap!`
                ) +
                "\n"
            );
        });
}

function getDefaultProjectData(project, name) {
    const p = project.toLowerCase();
    const isSec = p.includes("security") || p.includes("password") || p.includes("encrypt") || p.includes("cyber");
    const isPy = p.includes("python") || p.includes("ml") || p.includes("ai model") || p.includes("machine");

    return {
        description: `${project} — built with DevMind AI`,
        tech: {
            runtime: isPy ? "Python 3.11" : "Node.js 20",
            framework: isPy ? "FastAPI" : "Express.js",
            database: "MongoDB",
            extra: isSec ? ["bcrypt", "jsonwebtoken", "helmet"] : ["dotenv", "cors"],
        },
        features: [
            "User authentication & authorization",
            "RESTful API endpoints",
            "Database integration",
            "Input validation & error handling",
            isSec ? "AES-256 encryption" : "Rate limiting",
        ],
        mainFileContent: getStarterCode(name, project),
        packageJsonDeps: {
            express: "^4.18.2",
            dotenv: "^16.3.1",
            cors: "^2.8.5",
            ...(isSec ? { bcryptjs: "^2.4.3", jsonwebtoken: "^9.0.2", helmet: "^7.1.0" } : {}),
        },
        packageJsonDevDeps: {
            nodemon: "^3.0.1",
        },
    };
}

async function createProjectFiles(dir, name, project, data) {
    const dirs = ["src", "src/routes", "src/controllers", "src/models", "src/middleware", "src/utils", "tests"];
    for (const d of dirs) await fs.ensureDir(path.join(dir, d));

    // Main entry
    await fs.writeFile(
        path.join(dir, "src", "index.js"),
        data.mainFileContent || getStarterCode(name, project)
    );

    // package.json
    await fs.writeJson(
        path.join(dir, "package.json"),
        {
            name,
            version: "1.0.0",
            type: "module",
            description: data.description,
            scripts: {
                start: "node src/index.js",
                dev: "nodemon src/index.js",
                test: "jest",
            },
            dependencies: data.packageJsonDeps || {},
            devDependencies: data.packageJsonDevDeps || {},
        },
        { spaces: 2 }
    );

    // utils/logger.js
    await fs.writeFile(
        path.join(dir, "src/utils/logger.js"),
        `const chalk_reset = "\\x1b[0m";\nconst green = "\\x1b[32m";\nconst red = "\\x1b[31m";\nconst gray = "\\x1b[90m";\n\nexport const log = (msg) => console.log(\`\${green}[\${new Date().toISOString()}]\${chalk_reset} \${msg}\`);\nexport const error = (msg) => console.error(\`\${red}[\${new Date().toISOString()}] ERROR:\${chalk_reset} \${msg}\`);\nexport const info = (msg) => console.log(\`\${gray}[\${new Date().toISOString()}]\${chalk_reset} \${msg}\`);\n`
    );

    // middleware/errorHandler.js
    await fs.writeFile(
        path.join(dir, "src/middleware/errorHandler.js"),
        `export function errorHandler(err, req, res, next) {\n  const status = err.status || 500;\n  console.error(\`[ERROR] \${err.message}\`);\n  res.status(status).json({\n    success: false,\n    error: err.message || "Internal Server Error",\n  });\n}\n`
    );

    // test stub
    await fs.writeFile(
        path.join(dir, "tests/index.test.js"),
        `// ${name} - Test Suite\n// Run: npm test\n\ndescribe("${name}", () => {\n  it("should pass a basic test", () => {\n    expect(1 + 1).toBe(2);\n  });\n\n  it("should handle API responses", () => {\n    const response = { success: true, data: [] };\n    expect(response.success).toBe(true);\n  });\n});\n`
    );
}

function getStarterCode(name, project) {
    const p = project.toLowerCase();
    const isSec = p.includes("password") || p.includes("security") || p.includes("encrypt");

    return `/**
 * ${name} — Entry Point
 * Generated by DevMind AI 🧠
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

${isSec ? `import helmet from 'helmet';\napp.use(helmet()); // Security headers\n` : ""}

// ─── Routes ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    project: '${name}',
    message: 'API is running! 🚀',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      api: 'GET /api/v1'
    }
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Welcome to ${name} API'
  });
});

// ─── Error Handler ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

// ─── Start Server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(\`\\n🧠 ${name} running at http://localhost:\${PORT}\`);
  console.log(\`📖 API docs: http://localhost:\${PORT}/api/v1\\n\`);
});

export default app;
`;
}

function buildReadme(name, project, data) {
    const features = data.features?.map((f) => `- ✅ ${f}`).join("\n") || "";
    return `# 🚀 ${name}

> ${data.description}

*Generated by [DevMind AI](https://github.com/yourusername/devmind-ai) ⚡*

---

## ✨ Features

${features}

---

## 🛠️ Tech Stack

- **Runtime:** ${data.tech?.runtime || "Node.js"}
- **Framework:** ${data.tech?.framework || "Express.js"}  
- **Database:** ${data.tech?.database || "MongoDB"}
- **Extra:** ${(data.tech?.extra || []).join(", ")}

---

## 📦 Installation

\`\`\`bash
git clone https://github.com/yourname/${name}.git
cd ${name}
npm install
cp .env.example .env
npm run dev
\`\`\`

---

## 🚀 Usage

\`\`\`bash
npm run dev   # Development (hot-reload)
npm start     # Production
npm test      # Run tests
\`\`\`

**API Available at:** \`http://localhost:3000\`

---

## 📄 License

MIT — feel free to use this project!
`;
}
