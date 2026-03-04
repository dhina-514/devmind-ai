import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { createSpinner } from "nanospinner";
import { header } from "../utils/ui.js";

// Security patterns to check
const SECURITY_RULES = [
    {
        id: "S001",
        severity: "CRITICAL",
        name: "Hardcoded API Key",
        pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{10,}/i,
        message: "Hardcoded API key detected. Use environment variables instead.",
        fix: 'Use process.env.API_KEY and store in .env file',
    },
    {
        id: "S002",
        severity: "CRITICAL",
        name: "Hardcoded Password",
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`\s]{4,}/i,
        message: "Hardcoded password found. Move to environment variables.",
        fix: 'Use process.env.PASSWORD_SECRET',
    },
    {
        id: "S003",
        severity: "HIGH",
        name: "Hardcoded Secret / Token",
        pattern: /(?:secret|token|auth)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{8,}/i,
        message: "Hardcoded secret or token found.",
        fix: 'Move to .env and use process.env.YOUR_SECRET',
    },
    {
        id: "S004",
        severity: "HIGH",
        name: "eval() Usage",
        pattern: /\beval\s*\(/,
        message: "eval() is dangerous and can lead to code injection.",
        fix: 'Avoid eval(). Use JSON.parse() or safer alternatives.',
    },
    {
        id: "S005",
        severity: "MEDIUM",
        name: "console.log in Production Code",
        pattern: /console\.(log|debug|info)\s*\(/,
        message: "console.log found. Consider using a proper logger in production.",
        fix: 'Use a logging library like winston or pino',
    },
    {
        id: "S006",
        severity: "HIGH",
        name: "SQL Injection Risk",
        pattern: /query\s*\(\s*[`'"]\s*(SELECT|INSERT|UPDATE|DELETE).*\$\{/i,
        message: "Potential SQL injection via template literal in SQL query.",
        fix: 'Use parameterized queries or an ORM like Prisma/Sequelize',
    },
    {
        id: "S007",
        severity: "MEDIUM",
        name: "HTTP instead of HTTPS",
        pattern: /http:\/\/(?!localhost)[a-zA-Z]/,
        message: "HTTP URL found. Use HTTPS for all external communications.",
        fix: 'Replace http:// with https://',
    },
    {
        id: "S008",
        severity: "HIGH",
        name: "Weak Random Number",
        pattern: /Math\.random\s*\(\s*\)/,
        message: "Math.random() is not cryptographically secure.",
        fix: 'Use crypto.randomBytes() or crypto.randomUUID() instead',
    },
    {
        id: "S009",
        severity: "MEDIUM",
        name: "Disabled TLS Verification",
        pattern: /rejectUnauthorized\s*:\s*false/i,
        message: "TLS certificate verification disabled. This is a security risk.",
        fix: 'Remove rejectUnauthorized: false in production',
    },
    {
        id: "S010",
        severity: "LOW",
        name: "TODO / FIXME Comments",
        pattern: /\/\/\s*(TODO|FIXME|HACK|XXX|BUG):/i,
        message: "Unresolved TODO/FIXME comment found.",
        fix: 'Resolve or track as a proper issue in your issue tracker',
    },
];

const SEVERITY_COLOR = {
    CRITICAL: chalk.bold.red,
    HIGH: chalk.bold.yellow,
    MEDIUM: chalk.bold.magenta,
    LOW: chalk.dim,
};

const SEVERITY_EMOJI = {
    CRITICAL: "🚨",
    HIGH: "⚠️ ",
    MEDIUM: "💛",
    LOW: "ℹ️ ",
};

const EXTENSIONS = [".js", ".ts", ".jsx", ".tsx", ".py", ".php", ".java", ".go", ".rb", ".env", ".json"];

export function scanCommand(program) {
    program
        .command("scan [target]")
        .description("🔍 Security scan for hardcoded secrets, vulnerabilities, and bad practices")
        .option("--no-color", "Disable colored output")
        .action(async (target = ".", opts) => {
            const scanTarget = path.resolve(target);
            header("🔍", `Security Scanner: ${chalk.yellow(scanTarget)}`);

            if (!fs.existsSync(scanTarget)) {
                console.error(chalk.red(`Target not found: ${scanTarget}`));
                return;
            }

            const spinner = createSpinner("Scanning for vulnerabilities...").start();

            const findings = [];
            const files = getFiles(scanTarget);

            for (const file of files) {
                try {
                    const content = await fs.readFile(file, "utf-8");
                    const lines = content.split("\n");

                    lines.forEach((line, idx) => {
                        for (const rule of SECURITY_RULES) {
                            if (rule.pattern.test(line)) {
                                findings.push({
                                    file: path.relative(scanTarget, file),
                                    line: idx + 1,
                                    rule,
                                    snippet: line.trim().slice(0, 80),
                                });
                            }
                        }
                    });
                } catch { }
            }

            spinner.success({ text: chalk.green(`Scanned ${files.length} files\n`) });

            if (findings.length === 0) {
                console.log(chalk.green("  ✅ No security issues found! Your code looks clean.\n"));
                printScanSummary(files.length, 0, 0, 0, 0);
                return;
            }

            // Group by severity
            const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
            findings.forEach((f) => bySeverity[f.rule.severity].push(f));

            // Print findings
            for (const severity of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
                const group = bySeverity[severity];
                if (!group.length) continue;

                console.log(
                    SEVERITY_COLOR[severity](
                        `\n  ${SEVERITY_EMOJI[severity]}  ${severity} (${group.length} issue${group.length > 1 ? "s" : ""})`
                    )
                );
                console.log(chalk.dim("  " + "─".repeat(46)));

                group.forEach(({ file, line, rule, snippet }) => {
                    console.log(
                        chalk.white(`  [${rule.id}] `) +
                        chalk.bold(rule.name)
                    );
                    console.log(
                        chalk.dim(`         File: `) + chalk.cyan(`${file}:${line}`)
                    );
                    console.log(chalk.dim(`         Code: `) + chalk.red(`${snippet}`));
                    console.log(chalk.dim(`         Fix:  `) + chalk.green(rule.fix));
                    console.log();
                });
            }

            printScanSummary(
                files.length,
                bySeverity.CRITICAL.length,
                bySeverity.HIGH.length,
                bySeverity.MEDIUM.length,
                bySeverity.LOW.length
            );

            if (bySeverity.CRITICAL.length + bySeverity.HIGH.length > 0) {
                console.log(
                    chalk.bold.red(
                        `\n  ⚡ Fix CRITICAL and HIGH issues before committing to git!\n`
                    )
                );
            }
        });
}

function printScanSummary(files, critical, high, medium, low) {
    const total = critical + high + medium + low;
    console.log(chalk.bold.white("  📊 Scan Summary"));
    console.log(chalk.dim("  " + "─".repeat(30)));
    console.log(chalk.dim(`  Files scanned:  `) + chalk.white(files));
    console.log(chalk.dim(`  Total issues:   `) + chalk.white(total));
    console.log(chalk.dim(`  Critical:       `) + (critical > 0 ? chalk.bold.red(critical) : chalk.green("0")));
    console.log(chalk.dim(`  High:           `) + (high > 0 ? chalk.bold.yellow(high) : chalk.green("0")));
    console.log(chalk.dim(`  Medium:         `) + (medium > 0 ? chalk.magenta(medium) : chalk.green("0")));
    console.log(chalk.dim(`  Low:            `) + chalk.dim(low));
    console.log();
}

function getFiles(dir, acc = []) {
    // Fail-safe to avoid heap exhaustion if scanning the entire C: drive
    if (acc.length >= 5000) return acc;

    if (fs.statSync(dir).isFile()) {
        acc.push(dir);
        return acc;
    }

    const IGNORE = ["node_modules", ".git", "dist", "build", ".next", "__pycache__", "coverage", ".devmind"];
    const MAX_FILE_SIZE = 500 * 1024; // 500 KB limit for scanning

    let entries = [];
    try {
        entries = fs.readdirSync(dir);
    } catch {
        // Skip directories without permission
        return acc;
    }

    for (const entry of entries) {
        if (IGNORE.includes(entry)) continue;

        const full = path.join(dir, entry);
        try {
            const stat = fs.statSync(full);

            if (stat.isDirectory()) {
                // Ignore all hidden directories
                if (entry.startsWith(".")) continue;
                getFiles(full, acc);
            } else if (EXTENSIONS.includes(path.extname(entry)) || entry === ".env") {
                // Only scan files under 500KB to prevent memory crashes
                if (stat.size <= MAX_FILE_SIZE) {
                    acc.push(full);
                }
            }
        } catch {
            // Ignore unreadable files
        }
    }
    return acc;
}
