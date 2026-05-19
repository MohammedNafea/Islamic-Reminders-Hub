import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Banknote, ShoppingBag, Calculator, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ZakatCalculator() {
  const { t } = useTranslation();
  const [prices, setPrices] = useState({ gold: 300, silver: 4 }); // Placeholder prices in SAR/AED
  const [assets, setAssets] = useState({
    cash: 0,
    gold: 0,
    silver: 0,
    trade: 0,
    debts: 0
  });

  // Calculate Nisab (based on 85g of gold)
  const nisabGold = 85 * prices.gold;
  const totalAssets = assets.cash + (assets.gold * prices.gold) + (assets.silver * prices.silver) + assets.trade - assets.debts;
  const isEligible = totalAssets >= nisabGold;
  const zakatAmount = isEligible ? totalAssets * 0.025 : 0;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8 pt-6 pb-20">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-primary">{t("zakat.title")}</h2>
        <p className="text-muted-foreground">{t("zakat.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                {t("zakat.assets_input")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    {t("zakat.cash")}
                  </Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 rounded-xl"
                    value={assets.cash || ""}
                    onChange={(e) => setAssets({...assets, cash: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    {t("zakat.trade")}
                  </Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 rounded-xl"
                    value={assets.trade || ""}
                    onChange={(e) => setAssets({...assets, trade: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    {t("zakat.gold_weight")}
                  </Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 rounded-xl"
                    value={assets.gold || ""}
                    onChange={(e) => setAssets({...assets, gold: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-slate-400" />
                    {t("zakat.silver_weight")}
                  </Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 rounded-xl"
                    value={assets.silver || ""}
                    onChange={(e) => setAssets({...assets, silver: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {t("zakat.debts")}
                  </Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 rounded-xl border-red-100 focus:ring-red-100"
                    value={assets.debts || ""}
                    onChange={(e) => setAssets({...assets, debts: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-muted/20">
            <CardContent className="p-4 flex items-start gap-4">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground mb-1">{t("zakat.nisab_info")}</p>
                {t("zakat.nisab_desc")}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={cn(
            "border-none shadow-xl overflow-hidden transition-all duration-500",
            isEligible ? "bg-primary text-primary-foreground" : "bg-card"
          )}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg opacity-80 uppercase tracking-widest">{t("zakat.result_title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-1">
                <p className="text-sm opacity-60">{t("zakat.total_wealth")}</p>
                <h3 className="text-3xl font-bold tabular-nums">
                  {totalAssets.toLocaleString()}
                </h3>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-1">
                <p className="text-sm opacity-60">{t("zakat.amount_due")}</p>
                <h3 className={cn(
                  "text-5xl font-black tabular-nums",
                  !isEligible && "text-muted-foreground"
                )}>
                  {zakatAmount.toLocaleString()}
                </h3>
              </div>

              <div className="pt-4">
                {isEligible ? (
                  <div className="bg-white/20 rounded-2xl py-3 px-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">{t("zakat.eligible")}</span>
                  </div>
                ) : (
                  <div className="bg-muted rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold">{t("zakat.not_eligible")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">{t("zakat.market_prices")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("zakat.gold_price")}</span>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    className="w-24 h-8 text-right font-bold" 
                    value={prices.gold} 
                    onChange={(e) => setPrices({...prices, gold: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("zakat.silver_price")}</span>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    className="w-24 h-8 text-right font-bold" 
                    value={prices.silver} 
                    onChange={(e) => setPrices({...prices, silver: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
