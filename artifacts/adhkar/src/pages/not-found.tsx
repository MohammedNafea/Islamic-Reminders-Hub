import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-md border-primary/10 shadow-xl rounded-[2rem] overflow-hidden">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-destructive/10 p-4 rounded-2xl">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("common.not_found_title")}
            </h1>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {t("common.not_found_desc")}
          </p>

          <div className="pt-4">
            <Link href="/">
              <Button className="rounded-2xl px-8 gap-2 font-bold h-12 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                {t("common.back_home")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
