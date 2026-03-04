#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import gradient from "gradient-string";
import figlet from "figlet";
import boxen from "boxen";
import { ideaCommand } from "../commands/idea.js";
import { scaffoldCommand } from "../commands/scaffold.js";
import { readmeCommand } from "../commands/readme.js";
import { stackCommand } from "../commands/stack.js";
import { fixCommand } from "../commands/fix.js";
import { roadmapCommand } from "../commands/roadmap.js";
import { buildCommand } from "../commands/build.js";
import { scanCommand } from "../commands/scan.js";
import { chatCommand } from "../commands/chat.js";
import { configCommand } from "../commands/config.js";

// ─── Banner ───────────────────────────────────────────────────────────────────
function showBanner() {
  const banner = figlet.textSync("DevMind AI", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
  });

  console.log(gradient.cristal(banner));

  console.log(
    boxen(
      chalk.white("🧠 ") +
        chalk.bold.white("AI-Powered Project Assistant") +
        chalk.gray(" v1.0.0") +
        "\n" +
        chalk.gray("  Generate ideas • Scaffold projects • Fix errors • Build full apps"),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        borderStyle: "round",
        borderColor: "cyan",
        margin: { top: 0, bottom: 1 },
      }
    )
  );
}

// ─── Program ──────────────────────────────────────────────────────────────────
program
  .name("devmind")
  .description("🧠 AI-powered CLI assistant for developers")
  .version("1.0.0", "-v, --version", "Show current version")
  .addHelpText(
    "after",
    `
${chalk.bold.cyan("  Quick Examples:")}
  ${chalk.green("$")} devmind idea "cybersecurity"
  ${chalk.green("$")} devmind scaffold "node api"
  ${chalk.green("$")} devmind stack "AI chatbot"
  ${chalk.green("$")} devmind fix "TypeError: cannot read property of undefined"
  ${chalk.green("$")} devmind roadmap "face recognition attendance system"
  ${chalk.green("$")} devmind build "password manager"
  ${chalk.green("$")} devmind readme
  ${chalk.green("$")} devmind scan ./project
  ${chalk.green("$")} devmind chat
  ${chalk.green("$")} devmind config --set-key YOUR_OPENAI_KEY

${chalk.bold.yellow("  Tip:")} Run ${chalk.cyan("devmind config --set-key YOUR_KEY")} first to unlock AI features!
`
  );

// ─── Register Commands ────────────────────────────────────────────────────────
ideaCommand(program);
scaffoldCommand(program);
readmeCommand(program);
stackCommand(program);
fixCommand(program);
roadmapCommand(program);
buildCommand(program);
scanCommand(program);
chatCommand(program);
configCommand(program);

// ─── Default: show banner + help ──────────────────────────────────────────────
if (process.argv.length === 2) {
  showBanner();
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
