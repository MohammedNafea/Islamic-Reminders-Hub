#!/usr/bin/env node
/**
 * خادم MCP لإدارة مستودع الذاكرة العصبية والذكية (LLM Wiki MCP Server)
 * 
 * يتيح هذا الخادم لوكيل الذكاء الاصطناعي (LLM Agent) التفاعل المباشر والدقيق مع قاعدة المعرفة،
 * بما في ذلك البحث في الفهرس، قراءة وكتابة الصفحات، وتفعيل نصوص الاستيعاب والفحص.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_ROOT = path.resolve(__dirname, "..");

// تهيئة خادم MCP
const server = new McpServer({
  name: "llm-wiki-mcp-server",
  version: "1.0.0"
});

// 1. أداة البحث في الويكي (wiki_search)
server.registerTool(
  "wiki_search",
  {
    title: "البحث في الويكي والفهرس",
    description: `يبحث في الفهرس الشامل (index.md) وصفحات الويكي عن الكلمات المفتاحية أو المفاهيم باللغة العربية.
يعيد قائمة بالصفحات المطابقة وملخصاتها السريعة.`,
    inputSchema: {
      query: z.string().min(2, "يجب إدخال حرفين على الأقل للبحث").describe("الكلمة المفتاحية أو المفهوم المراد البحث عنه")
    }
  },
  async ({ query }) => {
    try {
      const indexPath = path.join(WIKI_ROOT, "index.md");
      const indexContent = await fs.readFile(indexPath, "utf-8");
      
      const lines = indexContent.split("\n");
      const matches: string[] = [];
      
      for (const line of lines) {
        if (line.includes(query)) {
          matches.push(line);
        }
      }
      
      if (matches.length === 0) {
        return {
          content: [{ type: "text", text: `لم يتم العثور على نتائج مطابقة للبحث عن: "${query}" في الفهرس.` }]
        };
      }
      
      const resultText = [
        `# نتائج البحث عن: "${query}"`,
        "",
        `تم العثور على ${matches.length} نتيجة في الفهرس:`,
        "",
        ...matches
      ].join("\n");
      
      return {
        content: [{ type: "text", text: resultText }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `خطأ أثناء البحث: ${error instanceof Error ? error.message : String(error)}` }]
      };
    }
  }
);

// 2. أداة قراءة صفحة الويكي (wiki_read_page)
server.registerTool(
  "wiki_read_page",
  {
    title: "قراءة صفحة في الويكي",
    description: `يقرأ المحتوى الكامل لصفحة ماركدون محددة داخل مجلد الويكي (wiki/) بما في ذلك ترويسة YAML.`,
    inputSchema: {
      pagePath: z.string().describe("مسار الصفحة النسبي، مثال: wiki/concepts/أذكار الصباح والمساء.md أو wiki/000-Overview.md")
    }
  },
  async ({ pagePath }) => {
    try {
      const cleanPath = pagePath.replace(/^(\.\.[\/\\])+/, "");
      const fullPath = path.resolve(WIKI_ROOT, cleanPath);
      
      if (!fullPath.startsWith(WIKI_ROOT)) {
        throw new Error("مسار غير صالح: محاولة الوصول خارج حدود مستودع الويكي.");
      }
      
      const content = await fs.readFile(fullPath, "utf-8");
      return {
        content: [{ type: "text", text: content }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `خطأ أثناء قراءة الصفحة: ${error instanceof Error ? error.message : String(error)}` }]
      };
    }
  }
);

// 3. أداة كتابة أو تحديث صفحة الويكي (wiki_write_page)
server.registerTool(
  "wiki_write_page",
  {
    title: "كتابة أو تحديث صفحة في الويكي",
    description: `ينشئ صفحة ماركدون جديدة أو يحدّث صفحة موجودة في الويكي، مع إضافة ترويسة YAML وتحديث الفهرس والسجل تلقائيًا.`,
    inputSchema: {
      pagePath: z.string().describe("مسار الصفحة النسبي، مثال: wiki/concepts/مفهوم_جديد.md"),
      title: z.string().describe("عنوان الصفحة باللغة العربية"),
      content: z.string().describe("محتوى الماركدون الكامل للصفحة (بدون ترويسة YAML، سيتم توليدها تلقائيًا)"),
      tags: z.array(z.string()).describe("قائمة التصنيفات، مثال: ['تصنيف/فقه', 'تصنيف/أذكار']"),
      entities: z.array(z.string()).describe("قائمة الكيانات المرتبطة، مثال: ['[[لجنة التحقيق والتدقيق العلمي]]']").optional(),
      summary: z.string().describe("ملخص من سطر واحد يوضع في الفهرس (index.md)")
    }
  },
  async ({ pagePath, title, content, tags, entities = [], summary }) => {
    try {
      const cleanPath = pagePath.replace(/^(\.\.[\/\\])+/, "");
      const fullPath = path.resolve(WIKI_ROOT, cleanPath);
      
      if (!fullPath.startsWith(WIKI_ROOT)) {
        throw new Error("مسار غير صالح: محاولة الوصول خارج حدود مستودع الويكي.");
      }
      
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      const today = new Date().toISOString().split("T")[0];
      const yamlFrontmatter = [
        "---",
        `id: "${path.basename(cleanPath, ".md")}"`,
        `title: "${title}"`,
        `tags: ${JSON.stringify(tags)}`,
        `entities: ${JSON.stringify(entities)}`,
        `created: ${today}`,
        `updated: ${today}`,
        "---",
        ""
      ].join("\n");
      
      const fullContent = yamlFrontmatter + content;
      await fs.writeFile(fullPath, fullContent, "utf-8");
      
      const indexPath = path.join(WIKI_ROOT, "index.md");
      const indexEntry = `* [[${path.basename(cleanPath, ".md")}]] — ${summary}`;
      await fs.appendFile(indexPath, `\n${indexEntry}\n`, "utf-8");
      
      const logPath = path.join(WIKI_ROOT, "log.md");
      const logEntry = `## [${today}] write | ${title} | تم إنشاء/تحديث الصفحة وتحديث الفهرس`;
      await fs.appendFile(logPath, `\n${logEntry}\n`, "utf-8");
      
      return {
        content: [{ type: "text", text: `تم حفظ الصفحة بنجاح في: ${cleanPath} وتحديث الفهرس والسجل.` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `خطأ أثناء كتابة الصفحة: ${error instanceof Error ? error.message : String(error)}` }]
      };
    }
  }
);

async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LLM Wiki MCP Server is running via stdio");
}

async function runHTTP() {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3001");
  app.listen(port, () => {
    console.error(`LLM Wiki MCP Server is running on http://localhost:${port}/mcp`);
  });
}

const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
