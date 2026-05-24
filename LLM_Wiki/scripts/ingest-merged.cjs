#!/usr/bin/env node
require("child_process").spawnSync(
  process.execPath,
  [require("path").join(__dirname, "knowledge-pipeline.cjs"), ...process.argv.slice(2)],
  { stdio: "inherit" }
);
