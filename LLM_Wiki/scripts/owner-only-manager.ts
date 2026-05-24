#!/usr/bin/env node
/**
 * نظام تحكم الوصول (Owner-Only Access Manager)
 * 
 * يتحكم في من يمكنه إضافة ملفات للويكي والموقع
 * المالك فقط هو من يستطيع إعطاء الملفات للوكيل لفحصها
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_ROOT = path.resolve(__dirname, "..");

export interface OwnerConfig {
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  allowedDirectories: string[];
  approvedFiles: string[];
  lastUpdated: string;
}

const DEFAULT_CONFIG: OwnerConfig = {
  ownerId: "owner_001",
  ownerName: "المالك",
  allowedDirectories: [
    process.env.MERGED_DIR || "Downloads/مدمج",
    "D:\\Islamic-Reminders-Hub\\LLM_Wiki\\raw\\books"
  ],
  approvedFiles: [],
  lastUpdated: new Date().toISOString()
};

/**
 * تحميل إعدادات المالك
 */
export async function loadOwnerConfig(): Promise<OwnerConfig> {
  const configPath = path.join(WIKI_ROOT, "owner-config.json");
  
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    // إذا لم يكن هناك ملف إعدادات، أنشئ واحداً جديداً
    await saveOwnerConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

/**
 * حفظ إعدادات المالك
 */
export async function saveOwnerConfig(config: OwnerConfig): Promise<void> {
  const configPath = path.join(WIKI_ROOT, "owner-config.json");
  config.lastUpdated = new Date().toISOString();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * التحقق من أن المسار مسموح
 */
export function isPathAllowed(filePath: string, config: OwnerConfig): boolean {
  const normalizedPath = path.normalize(filePath);
  
  for (const dir of config.allowedDirectories) {
    const normalizedDir = path.normalize(dir);
    if (normalizedPath.startsWith(normalizedDir)) {
      return true;
    }
  }
  
  return false;
}

/**
 * التحقق من أن الملف موافق عليه
 */
export function isFileApproved(filePath: string, config: OwnerConfig): boolean {
  const normalizedPath = path.normalize(filePath);
  return config.approvedFiles.some(f => path.normalize(f) === normalizedPath);
}

/**
 * إضافة ملف للموافقة
 */
export async function approveFile(filePath: string): Promise<void> {
  const config = await loadOwnerConfig();
  
  if (!config.approvedFiles.includes(filePath)) {
    config.approvedFiles.push(filePath);
    await saveOwnerConfig(config);
    console.log(`[Owner Manager] File approved: ${filePath}`);
  }
}

/**
 * رفض ملف
 */
export async function rejectFile(filePath: string): Promise<void> {
  const config = await loadOwnerConfig();
  
  config.approvedFiles = config.approvedFiles.filter(f => f !== filePath);
  await saveOwnerConfig(config);
  console.log(`[Owner Manager] File rejected: ${filePath}`);
}

/**
 * التحقق من الملكية
 */
export async function verifyOwnership(requesterId: string): Promise<boolean> {
  const config = await loadOwnerConfig();
  return config.ownerId === requesterId;
}

/**
 * توليد token للوصول
 */
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * إضافة مجلد مسموح
 */
export async function addAllowedDirectory(dirPath: string): Promise<void> {
  const config = await loadOwnerConfig();
  
  if (!config.allowedDirectories.includes(dirPath)) {
    config.allowedDirectories.push(dirPath);
    await saveOwnerConfig(config);
    console.log(`[Owner Manager] Directory added: ${dirPath}`);
  }
}

/**
 * إنشاء طلب فحص ملف جديد
 */
export async function createInspectionRequest(
  filePath: string,
  requesterId: string
): Promise<{ requestId: string; status: "pending" | "approved" | "rejected" }> {
  const config = await loadOwnerConfig();
  
  if (!isPathAllowed(filePath, config)) {
    throw new Error(`Path not allowed: ${filePath}`);
  }
  
  const requestId = crypto.randomBytes(16).toString("hex");
  
  console.log(`\n[Owner Manager] New inspection request:`);
  console.log(`  Request ID: ${requestId}`);
  console.log(`  File: ${filePath}`);
  console.log(`  Requester: ${requesterId}`);
  console.log(`  Status: pending`);
  console.log(`\n  → awaiting owner approval...`);
  
  return {
    requestId,
    status: "pending"
  };
}

/**
 * عرض حالة النظام
 */
export async function showStatus(): Promise<void> {
  const config = await loadOwnerConfig();
  
  console.log("\n=== Owner Access Manager Status ===");
  console.log(`Owner: ${config.ownerName} (${config.ownerId})`);
  console.log(`Approved Files: ${config.approvedFiles.length}`);
  console.log(`Allowed Directories: ${config.allowedDirectories.length}`);
  
  for (const dir of config.allowedDirectories) {
    console.log(`  - ${dir}`);
  }
  
  console.log(`Last Updated: ${config.lastUpdated}`);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2];
  
  switch (action) {
    case "status":
      await showStatus();
      break;
      
    case "approve":
      const fileToApprove = process.argv[3];
      if (fileToApprove) {
        await approveFile(fileToApprove);
      } else {
        console.log("Usage: owner-only-manager.ts approve <filePath>");
      }
      break;
      
    case "reject":
      const fileToReject = process.argv[3];
      if (fileToReject) {
        await rejectFile(fileToReject);
      } else {
        console.log("Usage: owner-only-manager.ts reject <filePath>");
      }
      break;
      
    case "add-dir":
      const dirToAdd = process.argv[3];
      if (dirToAdd) {
        await addAllowedDirectory(dirToAdd);
      } else {
        console.log("Usage: owner-only-manager.ts add-dir <directoryPath>");
      }
      break;
      
    case "request":
      const requestFile = process.argv[3];
      const requester = process.argv[4] || "unknown";
      if (requestFile) {
        await createInspectionRequest(requestFile, requester);
      } else {
        console.log("Usage: owner-only-manager.ts request <filePath> [requesterId]");
      }
      break;
      
    default:
      console.log(`
=== Owner Access Manager ===
Usage:
  owner-only-manager.ts status              - Show system status
  owner-only-manager.ts approve <file>      - Approve a file
  owner-only-manager.ts reject <file>        - Reject a file
  owner-only-manager.ts add-dir <dir>        - Add allowed directory
  owner-only-manager.ts request <file> [id]  - Request file inspection
`);
  }
}