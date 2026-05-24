import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";

export default function NotFound() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-md border-primary/10 shadow-xl rounded-[2rem] overflow-hidden">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-destructive/10 p-4 rounded-2xl">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              <TranslatedText
                text="الصفحة غير موجودة"
                staticTranslation={getTranslation(t, "common.not_found_title", i18n.language) || undefined}
                keepArabic={false}
                inline
              />
            </h1>
          </div>

          <div className="text-muted-foreground leading-relaxed">
            <TranslatedText
              text="عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
              staticTranslation={getTranslation(t, "common.not_found_desc", i18n.language) || undefined}
              keepArabic={false}
            />
          </div>

          <div className="pt-4">
            <Link href="/">
              <Button className="rounded-2xl px-8 gap-2 font-bold h-12 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                <TranslatedText
                  text="العودة للرئيسية"
                  staticTranslation={getTranslation(t, "common.back_home", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

