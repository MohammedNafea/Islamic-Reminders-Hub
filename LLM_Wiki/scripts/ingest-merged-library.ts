import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const result = spawnSync(
  process.execPath,
  [path.join(__dirname, "knowledge-pipeline.cjs"), ...process.argv.slice(2)],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
