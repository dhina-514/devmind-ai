import chalk from "chalk";
import boxen from "boxen";

/**
 * Print a section header
 */
export function header(emoji, title) {
    console.log(
        "\n" +
        chalk.bold.cyan(`${emoji}  ${title}`) +
        "\n" +
        chalk.dim("─".repeat(50))
    );
}

/**
 * Print a success boxen
 */
export function successBox(message) {
    console.log(
        boxen(chalk.green("✅  " + message), {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            borderStyle: "round",
            borderColor: "green",
        })
    );
}

/**
 * Print an error boxen
 */
export function errorBox(message) {
    console.log(
        boxen(chalk.red("❌  " + message), {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            borderStyle: "round",
            borderColor: "red",
        })
    );
}

/**
 * Print a tip
 */
export function tip(message) {
    console.log(chalk.dim(`\n💡  ${message}`));
}

/**
 * Print a divider
 */
export function divider() {
    console.log(chalk.dim("─".repeat(50)));
}
