/**
 * Halal Guard - Content Safety Filter
 * Ensures content complies with basic Islamic values by filtering inappropriate keywords.
 */

const HARAM_KEYWORDS = [
  "alcohol", "wine", "pork", "gambling", "casino",
  "خمر", "نبيذ", "خنزير", "قمار", "كازينو"
];

export interface ValidationResult {
  isSafe: boolean;
  violation?: string;
}

export function validateContent(text: string): ValidationResult {
  const lowerText = text.toLowerCase();
  
  for (const keyword of HARAM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        isSafe: false,
        violation: keyword
      };
    }
  }
  
  return { isSafe: true };
}

/**
 * Higher-order function to wrap sensitive operations
 */
export async function guardOperation<T>(op: () => Promise<T>, content: string): Promise<T> {
  const result = validateContent(content);
  if (!result.isSafe) {
    throw new Error(`Content Security Violation: Inappropriate content detected (${result.violation})`);
  }
  return op();
}
