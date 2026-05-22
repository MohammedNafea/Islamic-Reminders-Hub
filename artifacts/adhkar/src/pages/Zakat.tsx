import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Banknote, ShoppingBag, Calculator, Info, AlertCircle, CheckCircle2, BookOpen, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";
import { localDB } from "@/lib/db";
import { Button } from "@/components/ui/button";

const CURRENCIES = [
  { code: "SAR", symbolAr: "ر.س", symbolEn: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", flag: "🇸🇦" },
  { code: "AED", symbolAr: "د.إ", symbolEn: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", flag: "🇦🇪" },
  { code: "KWD", symbolAr: "د.ك", symbolEn: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", flag: "🇰🇼" },
  { code: "QAR", symbolAr: "ر.ق", symbolEn: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal", flag: "🇶🇦" },
  { code: "BHD", symbolAr: "د.ب", symbolEn: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", flag: "🇧🇭" },
  { code: "OMR", symbolAr: "ر.ع", symbolEn: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial", flag: "🇴🇲" },
  { code: "EGP", symbolAr: "ج.م", symbolEn: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound", flag: "🇪🇬" },
  { code: "JOD", symbolAr: "د.أ", symbolEn: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar", flag: "🇯🇴" },
  { code: "DZD", symbolAr: "د.ج", symbolEn: "DZD", nameAr: "دينار جزائري", nameEn: "Algerian Dinar", flag: "🇩🇿" },
  { code: "MAD", symbolAr: "د.م", symbolEn: "MAD", nameAr: "درهم مغربي", nameEn: "Moroccan Dirham", flag: "🇲🇦" },
  { code: "USD", symbolAr: "$", symbolEn: "USD", nameAr: "دولار أمريكي", nameEn: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbolAr: "€", symbolEn: "EUR", nameAr: "يورو", nameEn: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbolAr: "£", symbolEn: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound", flag: "🇬🇧" },
];

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  SAR: 3.75,
  AED: 3.6725,
  KWD: 0.307,
  QAR: 3.64,
  BHD: 0.376,
  OMR: 0.384,
  EGP: 47.0,
  JOD: 0.709,
  DZD: 134.5,
  MAD: 10.0,
  EUR: 0.92,
  GBP: 0.79,
};

export default function ZakatCalculator() {
  const { t, i18n } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem("zakat_selected_currency") || "SAR";
  });

  const [prices, setPrices] = useState(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = localDB.getGeneralProgress<any>("zakat_prices", null);
    if (cached) {
      const rates = cached.rates || DEFAULT_RATES;
      const goldUSD = cached.goldUSD || (cached.gold / 3.75);
      const silverUSD = cached.silverUSD || (cached.silver / 3.75);
      return {
        goldUSD,
        silverUSD,
        rates,
        updatedAt: cached.updatedAt || "",
      };
    }
    return {
      goldUSD: 75.55,
      silverUSD: 0.90,
      rates: DEFAULT_RATES,
      updatedAt: "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const [resGold, resSilver, resRates] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU").then(r => r.json()),
        fetch("https://api.gold-api.com/price/XAG").then(r => r.json()),
        fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()).catch(e => {
          console.warn("Failed to fetch rates, using existing rates:", e);
          return null;
        })
      ]);
      
      if (resGold?.price && resSilver?.price) {
        const goldUSD = resGold.price / 31.1034768;
        const silverUSD = resSilver.price / 31.1034768;
        
        let rates = prices.rates;
        if (resRates?.rates) {
          rates = { ...DEFAULT_RATES };
          CURRENCIES.forEach(c => {
            if (resRates.rates[c.code]) {
              rates[c.code] = resRates.rates[c.code];
            }
          });
        }

        const sarRate = rates["SAR"] || 3.75;
        const newPrices = {
          goldUSD,
          silverUSD,
          rates,
          gold: parseFloat((goldUSD * sarRate).toFixed(2)),
          silver: parseFloat((silverUSD * sarRate).toFixed(2)),
          updatedAt: new Date().toISOString()
        };
        setPrices(newPrices);
        localDB.saveGeneralProgress("zakat_prices", newPrices);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching zakat prices:", err);
      setError(t("zakat.api_error", { defaultValue: "خطأ في الاتصال بالشبكة، تم استخدام الأسعار المخزنة محلياً" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [assets, setAssets] = useState({
    cash: 0,
    gold: 0,
    silver: 0,
    trade: 0,
    debts: 0
  });

  const activeCurrency = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
  const rate = prices.rates[selectedCurrency] || DEFAULT_RATES[selectedCurrency] || 1;
  const goldPriceInCurrency = parseFloat((prices.goldUSD * rate).toFixed(2));
  const silverPriceInCurrency = parseFloat((prices.silverUSD * rate).toFixed(2));
  const currencySymbol = i18n.language === "ar" ? activeCurrency.symbolAr : activeCurrency.symbolEn;

  // Calculate Nisab (based on 85g of gold)
  const nisabGold = 85 * goldPriceInCurrency;
  const totalAssets = assets.cash + (assets.gold * goldPriceInCurrency) + (assets.silver * silverPriceInCurrency) + assets.trade - assets.debts;
  const isEligible = totalAssets >= nisabGold;
  const zakatAmount = isEligible ? totalAssets * 0.025 : 0;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8 pt-6 pb-20">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-primary">
          <TranslatedText
            text="حاسبة الزكاة"
            staticTranslation={getTranslation(t, "zakat.title", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h2>
        <p className="text-muted-foreground text-center">
          <TranslatedText
            text="احسب زكاتك بدقة وسهولة بناءً على أسعار الذهب والفضة اليومية"
            staticTranslation={getTranslation(t, "zakat.subtitle", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <TranslatedText
                  text="أدخل الأموال والمدخرات"
                  staticTranslation={getTranslation(t, "zakat.assets_input", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    <TranslatedText
                      text="النقود والمدخرات البنكية"
                      staticTranslation={getTranslation(t, "zakat.cash", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl")}
                      value={assets.cash || ""}
                      onChange={(e) => setAssets({...assets, cash: parseFloat(e.target.value) || 0})}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold border-muted-foreground/10",
                      i18n.language === "ar" 
                        ? "left-0 border-r" 
                        : "right-0 border-l"
                    )}>
                      {currencySymbol}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    <TranslatedText
                      text="عروض التجارة والسلع"
                      staticTranslation={getTranslation(t, "zakat.trade", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl")}
                      value={assets.trade || ""}
                      onChange={(e) => setAssets({...assets, trade: parseFloat(e.target.value) || 0})}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold border-muted-foreground/10",
                      i18n.language === "ar" 
                        ? "left-0 border-r" 
                        : "right-0 border-l"
                    )}>
                      {currencySymbol}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <TranslatedText
                      text="وزن الذهب (جرام - عيار 24)"
                      staticTranslation={getTranslation(t, "zakat.gold_weight", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl")}
                      value={assets.gold || ""}
                      onChange={(e) => setAssets({...assets, gold: parseFloat(e.target.value) || 0})}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold",
                      i18n.language === "ar" ? "left-0 border-r" : "right-0 border-l"
                    )}>
                      {i18n.language === "ar" ? "جرام" : "g"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-slate-400" />
                    <TranslatedText
                      text="وزن الفضة (جرام)"
                      staticTranslation={getTranslation(t, "zakat.silver_weight", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl")}
                      value={assets.silver || ""}
                      onChange={(e) => setAssets({...assets, silver: parseFloat(e.target.value) || 0})}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold",
                      i18n.language === "ar" ? "left-0 border-r" : "right-0 border-l"
                    )}>
                      {i18n.language === "ar" ? "جرام" : "g"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <TranslatedText
                      text="الديون والالتزامات (تخصم)"
                      staticTranslation={getTranslation(t, "zakat.debts", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl border-red-100 focus:ring-red-100")}
                      value={assets.debts || ""}
                      onChange={(e) => setAssets({...assets, debts: parseFloat(e.target.value) || 0})}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold border-muted-foreground/10",
                      i18n.language === "ar" 
                        ? "left-0 border-r" 
                        : "right-0 border-l"
                    )}>
                      {currencySymbol}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: أسعار السوق الحالية */}
          <Card className="border-none shadow-md overflow-hidden bg-card/85 backdrop-blur-sm relative">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between gap-4 p-6 border-b border-border/40">
              <CardTitle className="text-lg flex items-center gap-2 shrink-0">
                <Coins className="w-5 h-5 text-amber-500" />
                <TranslatedText
                  text="أسعار السوق الحالية"
                  staticTranslation={getTranslation(t, "zakat.market_prices", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Select
                  value={selectedCurrency}
                  onValueChange={(val) => {
                    setSelectedCurrency(val);
                    localStorage.setItem("zakat_selected_currency", val);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs font-bold border-primary/10 w-32 bg-white/50 dark:bg-card/50 shrink-0 rounded-xl">
                    <span className="flex items-center gap-2 justify-start">
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary select-none shrink-0 leading-none min-w-[20px] text-center">
                        {activeCurrency.flag}
                      </span>
                      <span className="font-bold">{activeCurrency.code}</span>
                    </span>
                    <span className="sr-only">
                      <SelectValue placeholder={selectedCurrency} />
                    </span>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CURRENCIES.map(curr => (
                      <SelectItem key={curr.code} value={curr.code} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary select-none shrink-0 leading-none min-w-[20px] text-center">
                            {curr.flag}
                          </span>
                          <span className="font-bold">{curr.code}</span>
                          <span className="text-muted-foreground opacity-80 text-[10px]">
                            ({i18n.language === "ar" ? curr.nameAr : curr.nameEn})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchPrices}
                  disabled={loading}
                  className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground shrink-0 border border-primary/10 bg-white/50 dark:bg-card/50"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-2">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/10">
                  <Label className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <TranslatedText
                      text="سعر الذهب (عيار 24)"
                      staticTranslation={getTranslation(t, "zakat.gold_price", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01"
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl font-bold bg-white/50 dark:bg-card/50")}
                      value={goldPriceInCurrency || ""} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const newGoldUSD = val / rate;
                        const sarRate = prices.rates["SAR"] || 3.75;
                        const updated = { 
                          ...prices, 
                          goldUSD: newGoldUSD,
                          gold: parseFloat((newGoldUSD * sarRate).toFixed(2)),
                          silver: parseFloat((prices.silverUSD * sarRate).toFixed(2))
                        };
                        setPrices(updated);
                        localDB.saveGeneralProgress("zakat_prices", updated);
                      }}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold border-muted-foreground/10",
                      i18n.language === "ar" 
                        ? "left-0 border-r" 
                        : "right-0 border-l"
                    )}>
                      {currencySymbol}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/10">
                  <Label className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-slate-400" />
                    <TranslatedText
                      text="سعر جرام الفضة"
                      staticTranslation={getTranslation(t, "zakat.silver_price", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01"
                      className={cn(i18n.language === "ar" ? "pl-12" : "pr-12", "h-12 rounded-xl font-bold bg-white/50 dark:bg-card/50")}
                      value={silverPriceInCurrency || ""} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const newSilverUSD = val / rate;
                        const sarRate = prices.rates["SAR"] || 3.75;
                        const updated = { 
                          ...prices, 
                          silverUSD: newSilverUSD,
                          gold: parseFloat((prices.goldUSD * sarRate).toFixed(2)),
                          silver: parseFloat((newSilverUSD * sarRate).toFixed(2))
                        };
                        setPrices(updated);
                        localDB.saveGeneralProgress("zakat_prices", updated);
                      }}
                    />
                    <div className={cn(
                      "absolute inset-y-0 flex items-center px-3 pointer-events-none text-muted-foreground text-xs font-semibold border-muted-foreground/10",
                      i18n.language === "ar" 
                        ? "left-0 border-r" 
                        : "right-0 border-l"
                    )}>
                      {currencySymbol}
                    </div>
                  </div>
                </div>
              </div>

              {prices.updatedAt && (
                <div className="text-[10px] text-muted-foreground/80 pt-2 border-t border-border/40 text-center">
                  <span>
                    {i18n.language === "ar" ? "آخر تحديث مباشر: " : "Last Live Update: "}
                    <span className="font-semibold tabular-nums">
                      {new Date(prices.updatedAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={cn(
            "border-none shadow-xl overflow-hidden transition-all duration-500",
            isEligible ? "bg-primary text-primary-foreground" : "bg-card"
          )}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg opacity-80 uppercase tracking-widest">
                <TranslatedText
                  text="خلاصة حساب الزكاة"
                  staticTranslation={getTranslation(t, "zakat.result_title", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-1">
                <p className="text-sm opacity-60">
                  <TranslatedText
                    text="إجمالي أموالك"
                    staticTranslation={getTranslation(t, "zakat.total_wealth", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </p>
                <h3 className="text-3xl font-bold tabular-nums">
                  {totalAssets.toLocaleString()} <span className="text-xl font-medium">{currencySymbol}</span>
                </h3>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-1">
                <p className="text-sm opacity-60">
                  <TranslatedText
                    text="مقدار الزكاة الواجبة"
                    staticTranslation={getTranslation(t, "zakat.amount_due", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </p>
                <h3 className={cn(
                  "text-5xl font-black tabular-nums",
                  !isEligible && "text-muted-foreground"
                )}>
                  {zakatAmount.toLocaleString()} <span className="text-2xl font-bold">{currencySymbol}</span>
                </h3>
              </div>

              <div className="pt-4">
                {isEligible ? (
                  <div className="bg-white/20 rounded-2xl py-3 px-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">
                      <TranslatedText
                        text="تجب عليك الزكاة"
                        staticTranslation={getTranslation(t, "zakat.eligible", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </span>
                  </div>
                ) : (
                  <div className="bg-muted rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold">
                      <TranslatedText
                        text="لم يبلغ النصاب"
                        staticTranslation={getTranslation(t, "zakat.not_eligible", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-muted/20">
            <CardContent className="p-4 flex items-start gap-4">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground mb-1">
                  <TranslatedText
                    text="معلومات عن النصاب:"
                    staticTranslation={getTranslation(t, "zakat.nisab_info", i18n.language) || undefined}
                    keepArabic={false}
                  />
                </p>
                <TranslatedText
                  text="يُحسب النصاب بناءً على قيمة 85 جرامًا من الذهب عيار 24. إذا بلغ مالك هذا المقدار وحال عليه الحول (عام هجري كامل)، تجب فيه الزكاة بنسبة 2.5%."
                  staticTranslation={getTranslation(t, "zakat.nisab_desc", i18n.language) || undefined}
                  keepArabic={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zakat Hadiths Section */}
      <div className="space-y-6 pt-6">
        <div className="border-t border-border pt-8">
          <h3 className="text-2xl font-heading font-bold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <TranslatedText
              text="أحاديث في فضل الزكاة ووجوبها"
              staticTranslation={getTranslation(t, "zakat.hadiths_title", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </h3>
          <div className="text-muted-foreground text-sm">
            <TranslatedText
              text="مجموعة من الأحاديث النبوية الصحيحة الواردة في وجوب الزكاة وعقوبة مانعها"
              staticTranslation={getTranslation(t, "zakat.hadiths_subtitle", i18n.language) || undefined}
              keepArabic={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zakatHadiths.map((hadith, index) => (
            <Card key={index} className="border-none shadow-md bg-card overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all flex flex-col justify-between">
              <CardContent className="p-6 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                    <TranslatedText
                      text={hadith.source}
                      staticTranslation={getTranslation(t, "adhkar.sources." + hadith.source, i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </span>
                </div>
                <TranslatedText
                  text={hadith.textAr}
                  staticTranslation={i18n.language === "en" ? hadith.textEn : undefined}
                  keepArabic={true}
                  arabicClassName="text-right text-lg text-foreground"
                  translationClassName="text-left border-t border-border/30 pt-3 text-muted-foreground text-sm"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

const zakatHadiths = [
  {
    source: "متفق عليه",
    textAr: "أن النبي ﷺ بعث معاذًا إلى اليمن، فقال: «ادعهم إلى شهادة أن لا إله إلا الله وأن محمدًا رسول الله، فإن هم أطاعوا لذلك، فأعلمهم أن الله افترض عليهم خمس صلوات في كل يوم وليلة، فإن هم أطاعوا لذلك، فأعلمهم أن الله افترض عليهم صدقة في أموالهم تُؤخذ من أغنيائهم وتُرد على فقرائهم».",
    textEn: "The Prophet ﷺ sent Mu'adh to Yemen and said: 'Invite them to testify that none has the right to be worshipped but Allah and that Muhammad is the Messenger of Allah. If they obey that, tell them that Allah has enjoined upon them five prayers every day and night. If they obey that, tell them that Allah has enjoined upon them Zakat (charity) on their wealth, to be taken from the rich among them and given to the poor among them.'"
  },
  {
    source: "رواه مسلم",
    textAr: "قال رسول الله ﷺ: «ما من صاحب ذهب ولا فضة لا يؤدي منها حقها إلا إذا كان يوم القيامة صفحت له صفائح من نار فأحمي عليها في نار جهنم فيكوى بها جنبه وجبينه وظهره، كلما بردت أعيدت له في يوم كان مقداره خمسين ألف سنة حتى يقضى بين العباد».",
    textEn: "The Messenger of Allah ﷺ said: 'No owner of gold or silver who does not pay what is due on them, but on the Day of Resurrection sheets of fire will be prepared for him, heated in the Fire of Hell, and his sides, forehead and back will be branded with them. Whenever they cool down, they will be returned to him on a Day the length of which is fifty thousand years, until judgment is passed among people.'"
  },
  {
    source: "رواه البخاري",
    textAr: "قال رسول الله ﷺ: «من آتاه الله مالاً فلم يؤد زكاته مُثِّل له ماله يوم القيامة شجاعاً أقرع له زبيبتان يطوقه يوم القيامة، ثم يأخذ بلهزمتيه - يعني بشدقيه - ثم يقول أنا مالك أنا كنزك».",
    textEn: "The Messenger of Allah ﷺ said: 'Whoever is given wealth by Allah and does not pay its Zakat, on the Day of Resurrection his wealth will be made to appear to him as a baldheaded poisonous male snake with two black spots over its eyes, which will encircle his neck on the Day of Resurrection, then it will hold his jaws and say: I am your wealth, I am your treasure.'"
  },
  {
    source: "رواه أبو داود والترمذي",
    textAr: "أن امرأة أتت رسول الله ﷺ ومعها ابنة لها، وفي يد ابنتها مسكتان غليظتان من ذهب، فقال لها: «أتؤدين زكاة هذا؟» قالت: لا. قال: «أيسرك أن يسورك الله بهما يوم القيامة سوارين من نار؟» فخلعتهما فألقتهما إلى النبي ﷺ وقالت: هما لله ولرسوله.",
    textEn: "A woman came to the Messenger of Allah ﷺ with a daughter of hers, on whose hand were two thick gold bangles. He said to her: 'Do you pay Zakat on this?' She said: 'No.' He said: 'Would it please you if Allah branded you with two bangles of fire on the Day of Resurrection?' So she took them off, threw them to the Prophet ﷺ and said: 'They are for Allah and His Messenger.'"
  }
];
