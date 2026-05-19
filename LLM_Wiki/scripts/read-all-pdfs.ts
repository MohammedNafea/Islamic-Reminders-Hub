import { spawnSync } from "child_process";
import path from "path";
const result = spawnSync(process.execPath, [path.join(process.cwd(), "LLM_Wiki", "scripts", "knowledge-pipeline.cjs"), ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);
