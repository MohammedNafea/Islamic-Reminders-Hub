/**
 * Google Translate dynamic client-side utility
 */

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Maps i18n locale codes to Google Translate supported codes
function mapLanguageCode(code: string): string {
  const clean = code.split("-")[0].toLowerCase();
  if (clean === "zh") return "zh-CN";
  if (clean === "ckb") return "ku"; // Kurdish Sorani -> Kurdish
  return clean;
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const mappedLang = mapLanguageCode(targetLang);
  if (mappedLang === "ar") return trimmed; // No need to translate to Arabic since original is Arabic

  const hash = hashCode(trimmed);
  const cacheKey = `gtr_${mappedLang}_${hash}`;

  // Check localStorage Cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.warn("localStorage is not available for translation cache:", e);
  }

  // Fetch from Google Translate free client API
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${mappedLang}&dt=t&q=${encodeURIComponent(trimmed)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Translate API returned status ${response.status}`);
    }
    const data = await response.json();

    if (data && Array.isArray(data[0])) {
      const translated = data[0]
        .map((item: any) => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ""))
        .join("");

      if (translated) {
        // Cache the result
        try {
          localStorage.setItem(cacheKey, translated);
        } catch (e) {
          // localStorage full or disabled
        }
        return translated;
      }
    }
    return trimmed; // Fallback to original text
  } catch (error) {
    console.error("Failed to translate text:", error);
    return trimmed; // Fallback to original text on network error
  }
}
