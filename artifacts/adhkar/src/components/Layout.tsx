import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Home, Sun, Moon, MoonStar, Clock, Settings, Book, Heart, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { isRTL } from "@/i18n";
import { getSettings } from "@/lib/store";

const navItems = [
  { href: "/", icon: Home, labelKey: "nav.home" },
  { href: "/morning", icon: Sun, labelKey: "nav.morning" },
  { href: "/evening", icon: Moon, labelKey: "nav.evening" },
  { href: "/sleep", icon: MoonStar, labelKey: "nav.sleep" },
  { href: "/prayer", icon: Clock, labelKey: "nav.prayer" },
  { href: "/ruqyah", icon: Heart, labelKey: "nav.ruqyah" },
  { href: "/times", icon: Clock, labelKey: "nav.times" },
  { href: "/fasting", icon: Calendar, labelKey: "nav.fasting" },
  { href: "/tasbih", icon: Book, labelKey: "nav.tasbih" },
  { href: "/settings", icon: Settings, labelKey: "settings.title" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const rtl = isRTL(i18n.language);
  const settings = getSettings();

  useEffect(() => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
    
    // Apply font size
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    const sizeClass = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    }[settings.fontSize] || "text-base";
    document.documentElement.classList.add(sizeClass);
  }, [i18n.language, rtl, settings.fontSize]);

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex flex-col md:flex-row pb-16 md:pb-0 font-sans")}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r rtl:border-l rtl:border-r-0 border-border bg-card shadow-sm fixed top-0 bottom-0 z-20 transition-all">
        <div className="p-6">
          <h1 className="text-2xl font-heading font-bold text-primary">{t("app.name")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("app.tagline")}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "hover:bg-muted/50 text-foreground"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full relative transition-all duration-300",
        rtl ? "md:mr-64" : "md:ml-64"
      )}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-50 px-2 pb-safe pt-1 flex items-center justify-around overflow-x-auto gap-1">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-[4rem] transition-all",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "fill-primary/20 stroke-primary")} />
              <span className="text-[10px] font-medium text-center line-clamp-1">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}