/**
 * Compress PWA icons using sharp.
 * Converts oversized PNG icons to optimized versions with proper sizes.
 * Usage: node scripts/compress-pwa-icons.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(import.meta.dirname, "..", "artifacts", "adhkar", "public");

const icons = [
  { name: "favicon.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

async function compressIcons() {
  // Use the original icon-512.png as source (they're all the same file)
  const sourcePath = join(PUBLIC_DIR, "icon-512.png");
  
  for (const icon of icons) {
    const outputPath = join(PUBLIC_DIR, icon.name);
    try {
      await sharp(sourcePath)
        .resize(icon.size, icon.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality: 80, compressionLevel: 9, effort: 10 })
        .toFile(outputPath + ".tmp");
      
      // Read sizes
      const origSize = readFileSync(sourcePath).length;
      const newSize = readFileSync(outputPath + ".tmp").length;
      const reduction = Math.round((1 - newSize / origSize) * 100);
      
      // Replace original with compressed
      const tmpData = readFileSync(outputPath + ".tmp");
      writeFileSync(outputPath, tmpData);
      // Clean up tmp
      const { unlinkSync } = await import("fs");
      unlinkSync(outputPath + ".tmp");
      
      console.log(`${icon.name}: ${Math.round(origSize/1024)}KB → ${Math.round(newSize/1024)}KB (${reduction}% reduction, ${icon.size}x${icon.size})`);
    } catch (err) {
      console.error(`Failed to compress ${icon.name}:`, err.message);
    }
  }
}

compressIcons();
