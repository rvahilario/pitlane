import { readFile } from "node:fs/promises";

const allowedGitmojis = new Map([
    ["feat", "✨"],
    ["fix", "🐛"],
    ["test", "✅"],
    ["docs", "📝"],
    ["refactor", "♻️"],
    ["chore", "🔧"],
    ["ci", "👷"],
    ["perf", "⚡️"],
]);

const commitMessagePath = process.argv[2];

if (!commitMessagePath) {
    console.error("usage: node scripts/validate-commit-message.mjs <commit-msg-file>");
    process.exit(1);
}

const commitMessage = (await readFile(commitMessagePath, "utf8")).trim();
const firstLine = commitMessage.split(/\r?\n/, 1)[0] ?? "";

if (firstLine.startsWith("Merge ")) {
    process.exit(0);
}

const [emoji, ...rest] = firstLine.split(/\s+/);
const body = rest.join(" ");
const formatMatch = body.match(/^([a-z]+)\(([^)]+)\):\s+(.+)$/);

if (!emoji || !formatMatch) {
    console.error(
        `Invalid commit message format.\nExpected: <gitmoji> <type>(scope): <summary>\nGot: ${firstLine}`
    );
    process.exit(1);
}

const [, type, scope, summary] = formatMatch;
const expectedEmoji = allowedGitmojis.get(type);

if (!expectedEmoji) {
    console.error(
        `Invalid commit type "${type}". Allowed types: ${Array.from(allowedGitmojis.keys()).join(", ")}`
    );
    process.exit(1);
}

if (emoji !== expectedEmoji) {
    console.error(
        `Invalid gitmoji for type "${type}". Expected "${expectedEmoji}" but got "${emoji}".`
    );
    process.exit(1);
}

if (!scope.trim()) {
    console.error("Commit scope must not be empty.");
    process.exit(1);
}

if (!summary.trim()) {
    console.error("Commit summary must not be empty.");
    process.exit(1);
}
