import { toast } from "@/hooks/use-toast";

const SITE_URL = "https://adhkar.thedarkgalaxy.com";

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
 * and triggers a client-side browser download.
 * @param title - Category title (e.g., أذكار الصباح)
 * @param text - Main Arabic text
 * @param source - Source reference (hadith attribution)
 * @param language - UI language
 * @param note - Optional note/timing (متى وأين تقال)
 */
export const exportToImage = async (
  title: string,
  text: string,
  source: string = "",
  language: string = "ar",
  note?: string
) => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create 2D canvas context");

    const canvasWidth = 800;
    const padding = 55;
    const maxWidth = canvasWidth - padding * 2;

    // Fonts
    const arabicFont = "400 30px 'Amiri', 'Traditional Arabic', 'Tajawal', serif";
    const titleFont = "bold 22px 'Tajawal', sans-serif";
    const noteFont = "italic 16px 'Tajawal', sans-serif";
    const sourceFont = "italic 17px 'Tajawal', sans-serif";
    const watermarkFont = "13px 'Tajawal', sans-serif";

    // Measure text
    ctx.font = arabicFont;
    const lines = wrapText(ctx, text, maxWidth);

    // Measure note lines
    let noteLines: string[] = [];
    if (note) {
      ctx.font = noteFont;
      noteLines = wrapText(ctx, note, maxWidth - 20);
    }

    // Measure source lines
    let sourceLines: string[] = [];
    if (source) {
      ctx.font = sourceFont;
      sourceLines = wrapText(ctx, source, maxWidth - 20);
    }

    // Layout
    const lineHeight = 52;
    const noteLineHeight = 28;
    const sourceLineHeight = 28;

    const titleSectionH = 80;
    const noteSectionH = noteLines.length > 0 ? noteLines.length * noteLineHeight + 30 : 0;
    const textSectionH = lines.length * lineHeight + 20;
    const sourceSectionH = sourceLines.length > 0 ? sourceLines.length * sourceLineHeight + 50 : 0;
    const watermarkH = 50;

    const canvasHeight =
      padding +
      titleSectionH +
      (noteSectionH > 0 ? noteSectionH + 10 : 0) +
      textSectionH +
      (sourceSectionH > 0 ? sourceSectionH : 0) +
      watermarkH +
      padding;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx2 = canvas.getContext("2d")!;
    ctx2.textBaseline = "middle";

    // Background gradient
    const gradient = ctx2.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#0b5345");
    gradient.addColorStop(0.5, "#064e3b");
    gradient.addColorStop(1, "#022c22");
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, canvasWidth, canvasHeight);

    // Outer border
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx2.lineWidth = 4;
    ctx2.strokeRect(18, 18, canvasWidth - 36, canvasHeight - 36);

    // Inner border
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.15)";
    ctx2.lineWidth = 1;
    ctx2.strokeRect(24, 24, canvasWidth - 48, canvasHeight - 48);

    // Title
    let cursorY = padding + 20;
    ctx2.fillStyle = "#f59e0b";
    ctx2.font = titleFont;
    ctx2.textAlign = "center";
    ctx2.fillText(title, canvasWidth / 2, cursorY);

    // Decorative line under title
    cursorY += 20;
    ctx2.beginPath();
    ctx2.moveTo(canvasWidth / 2 - 100, cursorY);
    ctx2.lineTo(canvasWidth / 2 + 100, cursorY);
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.5)";
    ctx2.lineWidth = 1.5;
    ctx2.stroke();

    // Diamond
    ctx2.fillStyle = "#f59e0b";
    ctx2.beginPath();
    ctx2.moveTo(canvasWidth / 2, cursorY - 5);
    ctx2.lineTo(canvasWidth / 2 + 5, cursorY);
    ctx2.lineTo(canvasWidth / 2, cursorY + 5);
    ctx2.lineTo(canvasWidth / 2 - 5, cursorY);
    ctx2.closePath();
    ctx2.fill();

    cursorY += 30;

    // Note/timing section (متى وأين تقال)
    if (noteLines.length > 0) {
      // Note background pill
      const noteBgH = noteLines.length * noteLineHeight + 16;
      const noteBgY = cursorY - 8;
      ctx2.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx2.strokeStyle = "rgba(245, 158, 11, 0.2)";
      ctx2.lineWidth = 1;
      // Rounded rect
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

    for (const line of lines) {
      if (line !== "") {
        ctx2.fillText(line, canvasWidth / 2, cursorY + lineHeight / 2);
      }
      cursorY += lineHeight;
    }

    // Source / Reference
    if (sourceLines.length > 0) {
      cursorY += 18;

      // Separator line
      ctx2.beginPath();
      ctx2.moveTo(canvasWidth / 2 - 150, cursorY);
      ctx2.lineTo(canvasWidth / 2 + 150, cursorY);
      ctx2.strokeStyle = "rgba(245, 158, 11, 0.25)";
      ctx2.lineWidth = 1;
      ctx2.stroke();

      cursorY += 22;
      ctx2.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx2.font = sourceFont;
      ctx2.textAlign = "center";
      for (const srcLine of sourceLines) {
        if (srcLine) {
          ctx2.fillText(srcLine, canvasWidth / 2, cursorY + sourceLineHeight / 2);
        }
        cursorY += sourceLineHeight;
      }
    }

    // Watermark / branding
    cursorY = canvasHeight - watermarkH / 2 - 8;
    ctx2.fillStyle = "rgba(245, 158, 11, 0.35)";
    ctx2.font = watermarkFont;
    ctx2.textAlign = "center";
    ctx2.fillText(`Islamic Reminders Hub - واذكر  |  ${SITE_URL}`, canvasWidth / 2, cursorY);

    // Convert canvas to blob for sharing
    const dataUrl = canvas.toDataURL("image/png");
    const cleanTitle = title.replace(/[^\w\s\u0600-\u06FF]/g, "").replace(/\s+/g, "_");
    const fileName = `${cleanTitle || "dhikr"}.png`;

    // Try Web Share API for mobile/native sharing
    if (navigator.share && navigator.canShare) {
      try {
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: "image/png" });

        const shareData: ShareData = {
          title: title || "ذكر من واذكر",
          text: `${text.slice(0, 200)}\n\n${source ? source + "\n\n" : ""}${SITE_URL}`,
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
        // User cancelled or share failed, fall through to download
        if ((shareError as Error).name !== "AbortError") {
          console.warn("Share with image failed, falling back to download:", shareError);
        } else {
          // User cancelled - no toast needed
          return;
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
  language: string = "ar"
) => {
  const shareBody = [
    title ? `✨ ${title}` : "",
    "",
    text,
    "",
    source ? `📚 ${source}` : "",
    "",
    `🔗 ${SITE_URL}`,
  ]
    .filter((line, i, arr) => {
      // Remove consecutive empty lines
      if (line === "" && arr[i - 1] === "") return false;
      return true;
    })
    .join("\n")
    .trim();

  if (navigator.share) {
    try {
      await navigator.share({
        title: title || "ذكر من واذكر",
        text: shareBody,
        url: SITE_URL,
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
