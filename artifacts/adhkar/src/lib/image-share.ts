import { toast } from "@/hooks/use-toast";

/**
 * Generates a beautiful card image containing Quranic verses or Adhkar text
 * and triggers a client-side browser download.
 */
export const exportToImage = (title: string, text: string, source: string = "", language: string = "ar") => {
  try {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create 2D canvas context");

    const canvasWidth = 800;
    const padding = 60;
    const maxWidth = canvasWidth - padding * 2;

    // Font family definition
    const arabicFont = "400 32px 'Amiri', 'Traditional Arabic', 'Tajawal', sans-serif";
    const titleFont = "bold 24px 'Tajawal', sans-serif";
    const sourceFont = "italic 18px 'Tajawal', sans-serif";
    const watermarkFont = "12px 'Tajawal', sans-serif";

    // Set font to measure wrapping
    ctx.font = arabicFont;

    // Text wrapping logic
    // Replace newline characters with spaces first, or keep them to honor line breaks
    // Honor explicit line breaks if present, otherwise auto-wrap
    const paragraphs = text.split("\n");
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
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
      // Add empty line between paragraphs (if there are multiple paragraphs)
      if (paragraphs.indexOf(paragraph) < paragraphs.length - 1) {
        lines.push("");
      }
    }

    // Height calculations
    const lineHeight = 55;
    const titleHeight = 80;
    const textHeight = lines.length * lineHeight;
    const sourceHeight = source ? 100 : 0;
    const canvasHeight = titleHeight + textHeight + sourceHeight + padding * 3;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw on resized canvas
    const ctx2 = canvas.getContext("2d")!;
    ctx2.textBaseline = "middle";

    // 1. Draw Background: Elegant Premium Deep Emerald Gradient
    const gradient = ctx2.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#0b5345"); // Deep rich teal/emerald
    gradient.addColorStop(0.5, "#064e3b"); // Deep emerald green
    gradient.addColorStop(1, "#022c22"); // Dark forest green
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw Elegant Gold Double Borders
    // Outer border
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.4)"; // Soft gold/amber border
    ctx2.lineWidth = 4;
    ctx2.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

    // Inner border
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.15)";
    ctx2.lineWidth = 1;
    ctx2.strokeRect(26, 26, canvasWidth - 52, canvasHeight - 52);

    // 3. Draw Title (Centered)
    ctx2.fillStyle = "#f59e0b"; // Gold/Amber color
    ctx2.font = titleFont;
    ctx2.textAlign = "center";
    ctx2.fillText(title, canvasWidth / 2, padding + 20);

    // Decorative line under title
    ctx2.beginPath();
    ctx2.moveTo(canvasWidth / 2 - 100, padding + 35);
    ctx2.lineTo(canvasWidth / 2 + 100, padding + 35);
    ctx2.strokeStyle = "rgba(245, 158, 11, 0.5)";
    ctx2.lineWidth = 2;
    ctx2.stroke();
    
    // Draw diamond in middle of line
    ctx2.fillStyle = "#f59e0b";
    ctx2.beginPath();
    ctx2.moveTo(canvasWidth / 2, padding + 30);
    ctx2.lineTo(canvasWidth / 2 + 5, padding + 35);
    ctx2.lineTo(canvasWidth / 2, padding + 40);
    ctx2.lineTo(canvasWidth / 2 - 5, padding + 35);
    ctx2.closePath();
    ctx2.fill();

    // 4. Draw Main Arabic Text
    ctx2.fillStyle = "#ffffff";
    ctx2.font = arabicFont;
    ctx2.textAlign = "center";
    
    let y = padding + titleHeight + 30;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== "") {
        ctx2.fillText(lines[i], canvasWidth / 2, y);
      }
      y += lineHeight;
    }

    // 5. Draw Source / Reference
    if (source) {
      // Decorative line before source
      ctx2.beginPath();
      ctx2.moveTo(canvasWidth / 2 - 150, y + 10);
      ctx2.lineTo(canvasWidth / 2 + 150, y + 10);
      ctx2.strokeStyle = "rgba(245, 158, 11, 0.2)";
      ctx2.lineWidth = 1;
      ctx2.stroke();

      ctx2.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx2.font = sourceFont;
      ctx2.textAlign = "center";
      // Draw wrapped or simple source text
      ctx2.fillText(source, canvasWidth / 2, y + 45);
    }

    // 6. Draw Branding Watermark at Bottom
    ctx2.fillStyle = "rgba(245, 158, 11, 0.3)";
    ctx2.font = watermarkFont;
    ctx2.textAlign = "center";
    ctx2.fillText("Islamic Reminders Hub - واذكر", canvasWidth / 2, canvasHeight - 35);

    // 7. Trigger download
    const link = document.createElement("a");
    const cleanTitle = title.replace(/[^\w\s\u0600-\u06FF]/g, "").replace(/\s+/g, "_");
    link.download = `${cleanTitle || "dhikr"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast({
      description: language === "ar" ? "تم تصدير الصورة وتحميلها بنجاح" : "Image exported and downloaded successfully",
    });
  } catch (error) {
    console.error("Failed to export image:", error);
    toast({
      variant: "destructive",
      description: language === "ar" ? "فشل تصدير الصورة" : "Failed to export image",
    });
  }
};
