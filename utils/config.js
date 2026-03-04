import fs from "fs-extra";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".devmind");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const defaults = {
    apiKey: null,
    model: "gpt-4o-mini",
    theme: "cyan",
};

export function getConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return { ...defaults, ...fs.readJsonSync(CONFIG_FILE) };
        }
    } catch { }
    return { ...defaults };
}

export function saveConfig(updates) {
    fs.ensureDirSync(CONFIG_DIR);
    const current = getConfig();
    const next = { ...current, ...updates };
    fs.writeJsonSync(CONFIG_FILE, next, { spaces: 2 });
    return next;
}
