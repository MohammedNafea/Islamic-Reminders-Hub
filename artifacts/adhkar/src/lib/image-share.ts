import { toast } from "@/hooks/use-toast";
import * as allAdhkar from "@/data/adhkar";
import { translateText } from "./google-translate";

const SITE_URL = "https://adhkar.thedarkgalaxy.com";

/**
 * Helper to determine if a language is RTL
 */
const isRtlLang = (lang: string): boolean => {
  const rtlLangs = ["ar", "fa", "ur", "he", "ckb", "ps", "yi"];
  return rtlLangs.includes(lang.split("-")[0].toLowerCase());
};

/**
 * Resolves main category and subcategory based on dhikrId or fallback titles
 */
export function resolveDhikrGroupInfo(
  dhikrId: string | undefined,
  title: string,
  language: string
): { category: string; subcategory: string } {
  if (!dhikrId) {
    return {
      category: language === "ar" ? "القرآن الكريم" : "The Holy Quran",
      subcategory: title,
    };
  }

  // Find which array contains the ID
  let arrayName = "";
  for (const [key, value] of Object.entries(allAdhkar)) {
    if (Array.isArray(value)) {
      if (value.some((item: { id: string }) => item.id === dhikrId)) {
        arrayName = key;
        break;
      }
    }
  }

  const mappings: Record<string, { catAr: string; catEn: string; subAr: string; subEn: string }> = {
    adhkarMorningEvening: {
      catAr: "أذكار الصباح والمساء",
      catEn: "Morning & Evening Remembrances",
      subAr: "التحصين اليومي",
      subEn: "Daily Protection",
    },
    adhkarMorningOnly: {
      catAr: "أذكار الصباح والمساء",
      catEn: "Morning & Evening Remembrances",
      subAr: "أذكار الصباح",
      subEn: "Morning Remembrances",
    },
    adhkarEveningOnly: {
      catAr: "أذكار الصباح والمساء",
      catEn: "Morning & Evening Remembrances",
      subAr: "أذكار المساء",
      subEn: "Evening Remembrances",
    },
    adhkarMorningVariant: {
      catAr: "أذكار الصباح والمساء",
      catEn: "Morning & Evening Remembrances",
      subAr: "أذكار الصباح",
      subEn: "Morning Remembrances",
    },
    adhkarSleep: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "أذكار النوم والاستيقاظ",
      subEn: "Sleep & Waking",
    },
    adhkarHouse: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "دخول وخروج البيت",
      subEn: "Entering & Leaving Home",
    },
    adhkarMasjid: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "المسجد",
      subEn: "Mosque",
    },
    adhkarClothes: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "اللباس",
      subEn: "Clothing",
    },
    adhkarRestroom: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الخلاء",
      subEn: "Restroom",
    },
    adhkarWudu: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الوضوء",
      subEn: "Wudu",
    },
    adhkarAthan: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الأذان",
      subEn: "Athan",
    },
    adhkarFood: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الأكل والشرب",
      subEn: "Food & Drink",
    },
    adhkarTravel: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "السفر والتنقل",
      subEn: "Travel & Commute",
    },
    adhkarPrayerActions: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "أفعال الصلاة",
      subEn: "Prayer Actions",
    },
    adhkarDailyLifeEvents: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "أحداث الحياة اليومية",
      subEn: "Daily Life Events",
    },
    adhkarNature: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الظواهر الطبيعية",
      subEn: "Nature & Weather",
    },
    adhkarOccasions: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "المناسبات",
      subEn: "Occasions",
    },
    adhkarImmunization: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "التحصين والوقاية",
      subEn: "Protection & Immunization",
    },
    adhkarGreatDays: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الأيام والليالي العظيمة",
      subEn: "Virtuous Days & Nights",
    },
    adhkarDistressAndIllness: {
      catAr: "أذكار اليوم والليلة",
      catEn: "Daily Supplications",
      subAr: "الكرب والمرض والاستجابة",
      subEn: "Distress, Illness & Answered Prayers",
    },
    adhkarArafahHajj: {
      catAr: "يوم عرفة والحج",
      catEn: "Day of Arafah & Hajj",
      subAr: "أدعية الحج وعرفة",
      subEn: "Hajj & Arafah Supplications",
    },
    adhkarRuqyah: {
      catAr: "الرقية الشرعية",
      catEn: "Ruqyah",
      subAr: "التحصين والعلاج",
      subEn: "Protection & Cure",
    },
    adhkarPrayer: {
      catAr: "أذكار الصلاة",
      catEn: "Prayer Supplications",
      subAr: "أذكار بعد الصلاة",
      subEn: "Supplications After Prayer",
    },
  };

  const info = mappings[arrayName] || {
    catAr: "الأذكار والأدعية",
    catEn: "Supplications & Remembrances",
    subAr: title,
    subEn: title,
  };

  return {
    category: language === "ar" ? info.catAr : info.catEn,
    subcategory: language === "ar" ? info.subAr : info.subEn,
  };
}

/**
 * Loads a QR image from API
 */
const loadQrImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Wraps text to fit within maxWidth using canvas context for measuring.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? currentLine + " " + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    if (paragraphs.indexOf(paragraph) < paragraphs.length - 1) {
      lines.push("");
    }
  }
  return lines;
}

/**
 * Generates a beautiful card image containing Quranic verses or Adhkar text
 * and triggers a client-side browser download or sharing.
 */
export const exportToImage = async (
  title: string,
  text: string,
  source: string = "",
  language: string = "ar",
  note?: string,
  dhikrId?: string
) => {
  try {
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create 2D canvas context");

    const isRtl = isRtlLang(language);
    ctx.direction = isRtl ? "rtl" : "ltr";

    const canvasWidth = 1200;
    const padding = 80;
    const maxWidth = canvasWidth - padding * 2;

    // Resolve Category and Subcategory
    const info = resolveDhikrGroupInfo(dhikrId, title, language);
    let resolvedCategory = info.category;
    let resolvedSubcategory = info.subcategory;

    // Translate UI elements dynamically if language is non-Arabic and non-English
    if (language !== "ar" && language !== "en") {
      resolvedCategory = await translateText(resolvedCategory, language);
      resolvedSubcategory = await translateText(resolvedSubcategory, language);
    }

    // Dynamic translations for note & source if language is not Arabic
    let resolvedNote = note;
    let resolvedSource = source;
    if (language !== "ar") {
      if (note) resolvedNote = await translateText(note, language);
      if (source) resolvedSource = await translateText(source, language);
    }

    // Load QR Code dynamically
    const pageUrl = SITE_URL + window.location.pathname + window.location.search;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pageUrl)}`;
    let qrImg: HTMLImageElement | null = null;
    let hasQr = false;
    try {
      qrImg = await loadQrImage(qrUrl);
      hasQr = true;
    } catch (e) {
      console.warn("Failed to load QR image for sharing card:", e);
    }

    // Motivational & Charity text
    const rawMotivation = "لا تنسَ مشاركته مع غيرك لتعم الفائدة. 🕌✨";
    const rawSadaqa = "صدقة جارية";
    const motivationText = language === "ar" ? rawMotivation : await translateText(rawMotivation, language);
    const sadaqaText = language === "ar" ? rawSadaqa : await translateText(rawSadaqa, language);

    // Fonts — larger sizes for high resolution canvas
    const arabicFont = "400 42px 'Amiri', 'Traditional Arabic', 'Tajawal', serif";
    const translationFont = "400 28px 'Tajawal', sans-serif";
    const noteFont = "italic 24px 'Tajawal', sans-serif";
    const sourceFont = "italic 26px 'Tajawal', sans-serif";

    // Measure text lines
    ctx.font = arabicFont;
    const arabicLines = wrapText(ctx, text, maxWidth);

    let translationLines: string[] = [];
    if (language !== "ar") {
      ctx.font = translationFont;
      const translatedMainText = await translateText(text, language);
      translationLines = wrapText(ctx, translatedMainText, maxWidth);
    }

    let noteLines: string[] = [];
    if (resolvedNote) {
      ctx.font = noteFont;
      noteLines = wrapText(ctx, resolvedNote, maxWidth - 30);
    }

    let sourceLines: string[] = [];
    if (resolvedSource) {
      ctx.font = sourceFont;
      sourceLines = wrapText(ctx, resolvedSource, maxWidth - 30);
    }

    // Layout math
    const lineHeight = 76;
    const transLineHeight = 48;
    const noteLineHeight = 40;
    const sourceLineHeight = 40;
    const footerSectionH = 165;

    // Calculate exact canvas height by simulating cursor increments
    let calculatedY = padding;
    calculatedY += 147; // Title section (Category + Subcategory + Line + Spacing)

    if (noteLines.length > 0) {
      calculatedY += noteLines.length * noteLineHeight + 18;
    }

    calculatedY += arabicLines.length * lineHeight;

    if (translationLines.length > 0) {
      calculatedY += 15 + translationLines.length * transLineHeight;
    }

    if (sourceLines.length > 0) {
      calculatedY += 56 + sourceLines.length * sourceLineHeight;
    }

    const footerY = calculatedY + 20;
    const canvasHeight = footerY + footerSectionH + padding;

    const dpr = 2; // high definition scale factor
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    const ctx2 = canvas.getContext("2d")!;
    ctx2.scale(dpr, dpr);
    ctx2.textBaseline = "middle";
    ctx2.direction = isRtl ? "rtl" : "ltr";

    // Background gradient (Luxurious dark emerald green)
    const gradient = ctx2.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#0b5345");
    gradient.addColorStop(0.5, "#064e3b");
    gradient.addColorStop(1, "#022c22");
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, canvasWidth, canvasHeight);

    // Outer border
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx2.lineWidth = 6;
    ctx2.strokeRect(24, 24, canvasWidth - 48, canvasHeight - 48);

    // Inner border
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.15)";
    ctx2.lineWidth = 2;
    ctx2.strokeRect(34, 34, canvasWidth - 68, canvasHeight - 68);

    // Draw Main Category
    let cursorY = padding + 28;
    ctx2.fillStyle = "rgba(245, 158, 11, 0.7)";
    ctx2.font = "bold 22px 'Tajawal', sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(resolvedCategory.toUpperCase(), canvasWidth / 2, cursorY);

    // Draw Subcategory (Prominent)
    cursorY += 40;
    ctx2.fillStyle = "#f59e0b";
    ctx2.font = "bold 38px 'Tajawal', sans-serif";
    ctx2.fillText(resolvedSubcategory, canvasWidth / 2, cursorY);

    // Decorative line under title
    cursorY += 34;
    ctx2.beginPath();
    ctx2.moveTo(canvasWidth / 2 - 180, cursorY);
    ctx2.lineTo(canvasWidth / 2 + 180, cursorY);
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx2.lineWidth = 2;
    ctx2.stroke();

    // Diamond symbol
    ctx2.fillStyle = "#f59e0b";
    ctx2.beginPath();
    ctx2.moveTo(canvasWidth / 2, cursorY - 7);
    ctx2.lineTo(canvasWidth / 2 + 7, cursorY);
    ctx2.lineTo(canvasWidth / 2, cursorY + 7);
    ctx2.lineTo(canvasWidth / 2 - 7, cursorY);
    ctx2.closePath();
    ctx2.fill();

    cursorY += 45;

    // Note/timing section (متى وأين تقال)
    if (noteLines.length > 0) {
      const noteBgH = noteLines.length * noteLineHeight + 16;
      const noteBgY = cursorY - 8;
      ctx2.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx2.strokeStyle = "rgba(245, 158, 11, 0.2)";
      ctx2.lineWidth = 1;
      const rx = 12;
      const bx = padding - 10;
      const bw = canvasWidth - 2 * (padding - 10);
      ctx2.beginPath();
      ctx2.moveTo(bx + rx, noteBgY);
      ctx2.lineTo(bx + bw - rx, noteBgY);
      ctx2.arcTo(bx + bw, noteBgY, bx + bw, noteBgY + rx, rx);
      ctx2.lineTo(bx + bw, noteBgY + noteBgH - rx);
      ctx2.arcTo(bx + bw, noteBgY + noteBgH, bx + bw - rx, noteBgY + noteBgH, rx);
      ctx2.lineTo(bx + rx, noteBgY + noteBgH);
      ctx2.arcTo(bx, noteBgY + noteBgH, bx, noteBgY + noteBgH - rx, rx);
      ctx2.lineTo(bx, noteBgY + rx);
      ctx2.arcTo(bx, noteBgY, bx + rx, noteBgY, rx);
      ctx2.closePath();
      ctx2.fill();
      ctx2.stroke();

      ctx2.fillStyle = "rgba(245, 198, 100, 0.9)";
      ctx2.font = noteFont;
      ctx2.textAlign = "center";
      for (const noteLine of noteLines) {
        if (noteLine) {
          ctx2.fillText(noteLine, canvasWidth / 2, cursorY + noteLineHeight / 2);
        }
        cursorY += noteLineHeight;
      }
      cursorY += 18;
    }

    // Main Arabic text
    ctx2.fillStyle = "#ffffff";
    ctx2.font = arabicFont;
    ctx2.textAlign = "center";

    for (const line of arabicLines) {
      if (line !== "") {
        ctx2.fillText(line, canvasWidth / 2, cursorY + lineHeight / 2);
      }
      cursorY += lineHeight;
    }

    // Translation text (if non-Arabic)
    if (translationLines.length > 0) {
      cursorY += 15;
      ctx2.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx2.font = translationFont;
      ctx2.textAlign = "center";
      for (const line of translationLines) {
        if (line !== "") {
          ctx2.fillText(line, canvasWidth / 2, cursorY + transLineHeight / 2);
        }
        cursorY += transLineHeight;
      }
    }

    // Source / Reference
    if (sourceLines.length > 0) {
      cursorY += 26;

      ctx2.beginPath();
      ctx2.moveTo(canvasWidth / 2 - 250, cursorY);
      ctx2.lineTo(canvasWidth / 2 + 250, cursorY);
      ctx2.strokeStyle = "rgba(245, 158, 11, 0.25)";
      ctx2.lineWidth = 2;
      ctx2.stroke();

      cursorY += 30;
      ctx2.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx2.font = sourceFont;
      ctx2.textAlign = "center";
      for (const srcLine of sourceLines) {
        if (srcLine) {
          ctx2.fillText(srcLine, canvasWidth / 2, cursorY + sourceLineHeight / 2);
        }
        cursorY += sourceLineHeight;
      }
    }

    // Draw Footer Section
    // Using pre-calculated footerY from layout stage

    // Divider line
    ctx2.beginPath();
    ctx2.moveTo(padding, footerY);
    ctx2.lineTo(canvasWidth - padding, footerY);
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.25)";
    ctx2.lineWidth = 1;
    ctx2.stroke();

    const qrSize = 110;
    const qrBoxSize = qrSize + 16;
    const qrY = footerY + 25;

    let textX: number;
    let qrX: number;
    let textAlign: CanvasTextAlign;

    if (isRtl) {
      qrX = padding + 10;
      textX = canvasWidth - padding - 10;
      textAlign = "right";
    } else {
      qrX = canvasWidth - padding - qrSize - 10;
      textX = padding + 10;
      textAlign = "left";
    }

    if (hasQr && qrImg) {
      // Draw white quiet zone around QR code
      ctx2.fillStyle = "#ffffff";
      ctx2.fillRect(qrX - 8, qrY - 8, qrBoxSize, qrBoxSize);
      ctx2.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    // Draw brand, url and motivation text next to QR code
    ctx2.textAlign = textAlign;
    
    // Motivation line
    ctx2.fillStyle = "#ffffff";
    ctx2.font = "bold 22px 'Tajawal', sans-serif";
    ctx2.fillText(motivationText, hasQr ? (isRtl ? textX : textX) : canvasWidth / 2, footerY + 50);

    // Sadaqa and URL line
    ctx2.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx2.font = "18px 'Tajawal', sans-serif";
    ctx2.fillText(
      `🌙 ${sadaqaText}  •  ${SITE_URL.replace("https://", "")}`,
      hasQr ? (isRtl ? textX : textX) : canvasWidth / 2,
      footerY + 90
    );

    if (!hasQr) {
      ctx2.textAlign = "center";
    }

    // Convert canvas to blob for sharing
    const dataUrl = canvas.toDataURL("image/png");
    const cleanTitle = title.replace(/[^\w\s\u0600-\u06FF]/g, "").replace(/\s+/g, "_");
    const fileName = `${cleanTitle || "dhikr"}.png`;

    // Try Web Share API for mobile/native sharing
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: "image/png" });

        // Build caption text
        const captionText = [
          `🕌 *${resolvedCategory}*`,
          `✨ *${resolvedSubcategory}*`,
          "",
          text,
          "",
          resolvedSource ? `📚 ${resolvedSource}` : "",
          "",
          `🎁 ${sadaqaText}`,
          `💬 ${motivationText}`,
          `🔗 ${pageUrl}`,
        ]
          .filter((line, i, arr) => (line === "" && arr[i - 1] === "" ? false : true))
          .join("\n")
          .trim();

        const shareData: ShareData = {
          title: resolvedSubcategory,
          text: captionText,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast({
            description: language === "ar" ? "تمت المشاركة بنجاح" : "Shared successfully",
          });
          return;
        }
      } catch (shareError) {
        if ((shareError as Error).name !== "AbortError") {
          console.warn("Share with image failed, falling back to download:", shareError);
        } else {
          return; // user cancelled
        }
      }
    }

    // Fallback: download the image
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    toast({
      description: language === "ar" ? "تم تحميل الصورة بنجاح" : "Image downloaded successfully",
    });
  } catch (error) {
    console.error("Failed to export image:", error);
    toast({
      variant: "destructive",
      description: language === "ar" ? "فشل تصدير الصورة" : "Failed to export image",
    });
  }
};

/**
 * Share dhikr text (without image) via Web Share API or clipboard copy.
 */
export const shareText = async (
  title: string,
  text: string,
  source: string = "",
  language: string = "ar",
  dhikrId?: string
) => {
  const info = resolveDhikrGroupInfo(dhikrId, title, language);
  let resolvedCategory = info.category;
  let resolvedSubcategory = info.subcategory;

  let mainText = text;
  let srcText = source;
  let motivation = "لا تنسَ مشاركته مع غيرك لتعم الفائدة. 🕌✨";
  let sadaqa = "صدقة جارية";

  if (language !== "ar") {
    resolvedCategory = await translateText(resolvedCategory, language);
    resolvedSubcategory = await translateText(resolvedSubcategory, language);
    mainText = await translateText(text, language);
    srcText = source ? await translateText(source, language) : "";
    motivation = await translateText(motivation, language);
    sadaqa = await translateText(sadaqa, language);
  }

  const currentUrl = SITE_URL + window.location.pathname + window.location.search;

  const shareBody = [
    `🕌 *${resolvedCategory}*`,
    `✨ *${resolvedSubcategory}*`,
    "",
    mainText,
    "",
    srcText ? `📚 ${srcText}` : "",
    "",
    `🎁 ${sadaqa}`,
    `💬 ${motivation}`,
    `🔗 ${currentUrl}`,
  ]
    .filter((line, i, arr) => (line === "" && arr[i - 1] === "" ? false : true))
    .join("\n")
    .trim();

  if (navigator.share) {
    try {
      await navigator.share({
        title: resolvedSubcategory,
        text: shareBody,
        url: currentUrl,
      });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.warn("Native share failed, copying to clipboard:", err);
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(shareBody);
    toast({
      description: language === "ar" ? "تم نسخ الذكر إلى الحافظة" : "Dhikr copied to clipboard",
    });
  } catch {
    toast({
      variant: "destructive",
      description: language === "ar" ? "فشل النسخ" : "Copy failed",
    });
  }
};

/**
 * Copy formatted and translated dhikr text to clipboard
 */
export const copyDhikrText = async (
  title: string,
  text: string,
  source: string = "",
  language: string = "ar",
  dhikrId?: string
) => {
  try {
    const info = resolveDhikrGroupInfo(dhikrId, title, language);
    let resolvedCategory = info.category;
    let resolvedSubcategory = info.subcategory;

    let mainText = text;
    let srcText = source;
    let motivation = "لا تنسَ مشاركته مع غيرك لتعم الفائدة. 🕌✨";
    let sadaqa = "صدقة جارية";

    if (language !== "ar") {
      resolvedCategory = await translateText(resolvedCategory, language);
      resolvedSubcategory = await translateText(resolvedSubcategory, language);
      mainText = await translateText(text, language);
      srcText = source ? await translateText(source, language) : "";
      motivation = await translateText(motivation, language);
      sadaqa = await translateText(sadaqa, language);
    }

    const currentUrl = SITE_URL + window.location.pathname + window.location.search;

    const shareBody = [
      `🕌 ${resolvedCategory}`,
      `✨ ${resolvedSubcategory}`,
      "",
      mainText,
      "",
      srcText ? `📚 ${srcText}` : "",
      "",
      `🎁 ${sadaqa}`,
      `💬 ${motivation}`,
      `🔗 ${currentUrl}`,
    ]
      .filter((line, i, arr) => (line === "" && arr[i - 1] === "" ? false : true))
      .join("\n")
      .trim();

    await navigator.clipboard.writeText(shareBody);
    toast({
      description: language === "ar" ? "تم النسخ بنجاح" : "Copied successfully",
    });
  } catch (error) {
    console.error("Copy failed:", error);
    toast({
      variant: "destructive",
      description: language === "ar" ? "فشل النسخ" : "Copy failed",
    });
  }
};
