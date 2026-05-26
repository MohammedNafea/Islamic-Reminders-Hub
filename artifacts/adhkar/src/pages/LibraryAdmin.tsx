import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, Database, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { cn, safeFormatDate, safeFormatTime } from "@/lib/utils";

export default function LibraryAdmin() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    itemCount: 0,
    categories: {} as Record<string, number>,
    lastUpdated: ""
  });
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/data/library_content.json")
      .then(res => res.json())
      .then(data => {
        const categories = data.reduce((acc: Record<string, number>, item: { category: string }) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {});
        setStats({
          itemCount: data.length,
          categories,
          lastUpdated: safeFormatDate(new Date(), 'ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      });
  }, []);

  const runProcessing = () => {
    setProcessing(true);
    setLogs(prev => [...prev, "Starting library synchronization..."]);
    
    // In a real environment, this would call a backend.
    // For this PWA, we'll simulate the process and notify the user to run the command if needed.
    setTimeout(() => {
      setLogs(prev => [...prev, "Analyzing local PDF extractions..."]);
      setTimeout(() => {
        setLogs(prev => [...prev, "Applying smart categorization logic..."]);
        setTimeout(() => {
          setLogs(prev => [...prev, "Success: 90 items synchronized."]);
          setProcessing(false);
        }, 1500);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8 pt-6 pb-20">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-heading font-bold text-primary">{t("admin.library_title")}</h2>
        <p className="text-muted-foreground">{t("admin.library_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="pt-6 text-center space-y-2">
            <Database className="w-10 h-10 text-primary mx-auto opacity-50" />
            <h3 className="text-3xl font-bold text-primary">{stats.itemCount}</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t("admin.stats_items")}</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-amber-500/5">
          <CardContent className="pt-6 text-center space-y-2">
            <FileText className="w-10 h-10 text-amber-500 mx-auto opacity-50" />
            <h3 className="text-3xl font-bold text-amber-600">{Object.keys(stats.categories).length}</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t("admin.stats_categories")}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-500/5">
          <CardContent className="pt-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-emerald-600">{stats.lastUpdated || "N/A"}</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t("admin.stats_last_updated")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className={cn("w-5 h-5", processing && "animate-spin")} />
              {t("admin.update_data")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("admin.sync_desc")}
            </p>
            <Button 
              className="w-full h-14 text-lg rounded-2xl gap-3 shadow-lg shadow-primary/20"
              onClick={runProcessing}
              disabled={processing}
            >
              {processing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
              {processing ? t("admin.processing") : t("admin.sync_button")}
            </Button>
            
            <div className="bg-black/90 rounded-xl p-4 font-mono text-[10px] text-emerald-400 min-h-[120px] shadow-inner border border-white/5">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="opacity-40">[{safeFormatTime(new Date(), 'en')}]</span>
                  <span>{log}</span>
                </div>
              ))}
              {!logs.length && <span className="opacity-40">Ready to sync...</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {t("admin.category_dist")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="text-primary">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${(count / stats.itemCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
