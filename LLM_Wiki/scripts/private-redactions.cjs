const GENERIC_AUTHOR = "لجنة التحقيق والتدقيق العلمي";
const GENERIC_SOURCE = "مصدر علمي محقق";

function cps(values) {
  return String.fromCodePoint(...values);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termPattern(value) {
  return new RegExp(escapeRegExp(value), "giu");
}

const privateTerms = [
  cps([0x0639, 0x0628, 0x062f, 0x0020, 0x0627, 0x0644, 0x0639, 0x0632, 0x064a, 0x0632, 0x0020, 0x0627, 0x0644, 0x0637, 0x0631, 0x064a, 0x0641, 0x064a]),
  cps([0x0639, 0x0628, 0x062f, 0x0627, 0x0644, 0x0639, 0x0632, 0x064a, 0x0632, 0x0020, 0x0627, 0x0644, 0x0637, 0x0631, 0x064a, 0x0641, 0x064a]),
  cps([0x0639, 0x0628, 0x062f, 0x0020, 0x0627, 0x0644, 0x0639, 0x0632, 0x064a, 0x0632, 0x0020, 0x0628, 0x0646, 0x0020, 0x0645, 0x0631, 0x0632, 0x0648, 0x0642, 0x0020, 0x0627, 0x0644, 0x0637, 0x0631, 0x064a, 0x0641, 0x064a]),
  cps([0x0639, 0x0628, 0x062f, 0x0627, 0x0644, 0x0639, 0x0632, 0x064a, 0x0632, 0x0020, 0x0628, 0x0646, 0x0020, 0x0645, 0x0631, 0x0632, 0x0648, 0x0642, 0x0020, 0x0627, 0x0644, 0x0637, 0x0631, 0x064a, 0x0641, 0x064a]),
  cps([0x0627, 0x0644, 0x0637, 0x0631, 0x064a, 0x0641, 0x064a]),
  cps([0x0644, 0x0644, 0x0637, 0x0631, 0x064a, 0x0641, 0x064a]),
  cps([0x0041, 0x006c, 0x0054, 0x0061, 0x0072, 0x0069, 0x0066, 0x0069]),
  cps([0x0041, 0x006c, 0x002d, 0x0054, 0x0061, 0x0072, 0x0069, 0x0066, 0x0069]),
  cps([0x0061, 0x006c, 0x0074, 0x0061, 0x0072, 0x0065, 0x0066, 0x0065]),
  cps([0x0061, 0x0074, 0x0074, 0x0061, 0x0072, 0x0065, 0x0066, 0x0065]),
];

const publicSourceTerms = [
  /books[-_\s]?library\.online[^\s"'\\/]*/giu,
  /kutub[-_\s]?pdf\.net/giu,
  /www\.[a-z0-9.-]+/giu,
  /https?:\/\/[^\s)]+/giu,
];

function buildFilenameTerms(filename) {
  const base = filename.replace(/\.[^.]+$/u, "");
  const normalized = base
    .replace(/[_-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const compact = normalized.replace(/\s+/gu, "_");
  return [...new Set([base, normalized, compact].filter((value) => value.length > 4))];
}

function redactText(input, options = {}) {
  let output = String(input ?? "");
  const replacement = options.replacement || GENERIC_SOURCE;
  const terms = [...privateTerms, ...(options.extraTerms || [])];

  for (const term of terms) {
    output = output.replace(termPattern(term), replacement);
  }
  for (const pattern of publicSourceTerms) {
    output = output.replace(pattern, "مصدر رقمي");
  }

  // Redact specific scholar name patterns
  output = output.replace(/(الشيخ\s+)?عبد\s*العزيز\s+(بن\s+مرزوق\s+)?الطريفي/gu, GENERIC_AUTHOR);
  output = output.replace(/للشيخ\s+عبد\s*العزيز/gu, "للجنة التحقيق والتدقيق العلمي");
  output = output.replace(/الشيخ\s+عبد\s*العزيز/gu, GENERIC_AUTHOR);
  output = output.replace(/الطريفي/gu, "المحقق العلمي");

  // Redact specific book titles
  output = output.replace(/صفة\s+حجة\s+النبي/gu, "صفة الحج المحققة");
  output = output.replace(/صفة\s+صلاة\s+النبي/gu, "صفة الصلاة المحققة");
  output = output.replace(/صفة\s+وضوء\s+النبي/gu, "صفة الوضوء المحققة");
  output = output.replace(/الغناء\s+في\s+الميزان/gu, "دراسة أحكام الغناء");
  output = output.replace(/الخرسانية/gu, "الرسالة العقائدية");
  output = output.replace(/نواقض\s+الإسلام/gu, "مسائل التوحيد");
  output = output.replace(/الاختلاط:\s*تحرير\s*وتقرير\s*وتعقيب/gu, "مسألة الاختلاط في الميزان");
  output = output.replace(/عشرة\s+النساء\s+من\s+المغني/gu, "أحكام عشرة النساء");
  output = output.replace(/مختصر\s+صحيح\s+أذكار\s+الصباح\s+والمساء/gu, "أذكار اليوم والليلة المحققة");
  output = output.replace(/الأذان\s+والإقامة/gu, "أحكام الأذان والإقامة");
  output = output.replace(/علل\s+أحاديث\s+الأحكام:\s*الطهارة/gu, "دراسة علل أحاديث الطهارة");
  output = output.replace(/الإعلام\s+بشرح\s+نواقض\s+الإسلام/gu, "الإعلام بمسائل التوحيد");
  output = output.replace(/محاضرة\s+حكم\s+الغناء/gu, "محاضرة في أحكام الغناء والقرآن");

  output = output
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, "")
    .replace(/\s+\n/gu, "\n")
    .replace(/\n{4,}/gu, "\n\n\n")
    .trim();

  return output;
}

function redactObject(value, options = {}) {
  if (typeof value === "string") return redactText(value, options);
  if (Array.isArray(value)) return value.map((item) => redactObject(item, options));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactObject(item, options)])
    );
  }
  return value;
}

function containsPrivateTerms(input) {
  const text = String(input ?? "");
  return privateTerms.some((term) => termPattern(term).test(text));
}

function sanitizeId(input) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80) || "source";
}

module.exports = {
  GENERIC_AUTHOR,
  GENERIC_SOURCE,
  buildFilenameTerms,
  containsPrivateTerms,
  redactObject,
  redactText,
  sanitizeId,
};
