const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        ignores: ["node_modules", "dist", "build", "server"], // Ignore old server dir if present
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2021
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-console": "off",
            "no-useless-escape": "off" // Relax this rule for now
        }
    },
    {
        files: ["public/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.jquery // If used? Unsure.
            }
        }
    }
];
