#!/usr/bin/env node
require("child_process").spawnSync(process.execPath, [require("path").join(process.cwd(), "LLM_Wiki", "scripts", "knowledge-pipeline.cjs"), ...process.argv.slice(2)], { stdio: "inherit" });
