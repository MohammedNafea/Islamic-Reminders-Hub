import { createRequire } from "module";

const require = createRequire(import.meta.url);
const redactions = require("./private-redactions.cjs") as {
  redactText: (input: string, options?: { replacement?: string; extraTerms?: string[] }) => string;
  redactObject: <T>(value: T, options?: { replacement?: string; extraTerms?: string[] }) => T;
  containsPrivateTerms: (input: string) => boolean;
};

export function anonymize(text: string): string {
  return redactions.redactText(text);
}

export function anonymizeObject<T>(obj: T): T {
  return redactions.redactObject(obj);
}

export function getAnonymizationReport(text: string): string[] {
  return redactions.containsPrivateTerms(text) ? ["private terms detected and redacted"] : [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = process.argv.slice(2).join(" ");
  if (!text) {
    console.log("Usage: tsx anonymizer.ts <text>");
    process.exit(1);
  }
  console.log(anonymize(text));
}
