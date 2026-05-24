import { useState, useRef } from "react";
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";

export function PdfImporter() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("ar");
  const [jurisdiction, setJurisdiction] = useState("عام");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("processing");
    
    // محاكاة عملية رفع ومعالجة PDF
    setTimeout(() => {
      setStatus("success");
      // في التطبيق الحقيقي، سيتم هنا رفع الملف للواجهة الخلفية أو معالجته عبر مكتبة مثل pdf.js
    }, 2000);
  };

  return (
    <div className="p-6 bg-card rounded-2xl border shadow-sm">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        {t("wiki.pdf_importer", "استيراد ومعاينة PDF")}
      </h3>

      <div className="space-y-4">
        {/* منطقة رفع الملف */}
        <div 
          className="border-2 border-dashed border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
          />
          {file ? (
            <div className="text-center">
              <FileText className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="font-medium text-foreground">{t("wiki.click_to_upload", "اضغط لاختيار ملف PDF")}</p>
              <p className="text-xs text-muted-foreground">{t("wiki.pdf_only", "ملفات PDF فقط (الحد الأقصى 50MB)")}</p>
            </div>
          )}
        </div>

        {/* إعدادات الاستيراد */}
        {file && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("wiki.target_language", "اللغة المستهدفة")}
              </label>
              <select 
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="ar">العربية (Arabic)</option>
                <option value="en">English (الإنجليزية)</option>
                <option value="fr">Français (الفرنسية)</option>
                <option value="tr">Türkçe (التركية)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("wiki.jurisdiction", "المذهب الفقهي")}
              </label>
              <select 
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              >
                <option value="عام">عام (بدون مذهب محدد)</option>
                <option value="حنفي">حنفي</option>
                <option value="مالكي">مالكي</option>
                <option value="شافعي">شافعي</option>
                <option value="حنظلي/حنبلي">حنبلي</option>
                <option value="ظاهري">ظاهري</option>
              </select>
            </div>
          </div>
        )}

        {/* حالة المعالجة */}
        {status === "processing" && (
          <div className="flex items-center justify-center gap-2 text-sm text-primary py-2 animate-pulse">
            <Upload className="w-4 h-4 animate-bounce" />
            {t("wiki.processing_pdf", "جاري استخراج النصوص والصور وتطبيق المعالج الذكي...")}
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
            <Check className="w-5 h-5" />
            {t("wiki.import_success", "تم الاستخراج والدمج في الموسوعة بنجاح! يمكن البحث عنه الآن.")}
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            {t("wiki.import_error", "حدث خطأ أثناء الاستخراج، يرجى التأكد من الملف.")}
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            onClick={() => { setFile(null); setStatus("idle"); }}
            disabled={!file || status === "processing"}
          >
            <X className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
            {t("common.cancel", "إلغاء")}
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || status === "processing" || status === "success"}
            className="bg-primary text-primary-foreground"
          >
            <Check className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
            {t("wiki.start_import", "بدء الاستيراد للويكي")}
          </Button>
        </div>
      </div>
    </div>
  );
}
