import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import {
  Home, Settings, Calendar, Timer, Coins, Menu,
  Sun, Moon, Bed, Clock, Shield, Heart, BookOpen, Home as HomeIcon, MapPin, Star, TrendingUp, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { isRTL } from "@/i18n";
import { getSettings } from "@/lib/store";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";

const bottomNav = [
  { href: "/", Icon: Home, labelKey: "nav.home" },
  { href: "/times", Icon: Calendar, labelKey: "nav.times" },
  { href: "/tasbih", Icon: Timer, labelKey: "nav.tasbih" },
  { href: "/settings", Icon: Settings, labelKey: "nav.settings" },
];

const sidebarSections = [
  {
    titleKey: null,
    items: [
      { href: "/", Icon: Home, labelKey: "nav.home" },
      { href: "/times", Icon: Calendar, labelKey: "nav.times" },
      { href: "/tracker", Icon: TrendingUp, labelKey: "nav.tracker" },
      { href: "/zakat", Icon: Coins, labelKey: "nav.zakat" },
      { href: "/tasbih", Icon: Timer, labelKey: "nav.tasbih" },
      { href: "/settings", Icon: Settings, labelKey: "nav.settings" },
      { href: "/download", Icon: Smartphone, labelKey: "nav.download" },
    ],
  },
  {
    titleKey: "nav.adhkar",
    items: [
      { href: "/morning", Icon: Sun, labelKey: "nav.morning" },
      { href: "/evening", Icon: Moon, labelKey: "nav.evening" },
      { href: "/sleep", Icon: Bed, labelKey: "nav.sleep" },
      { href: "/prayer", Icon: Clock, labelKey: "nav.prayer" },
      { href: "/ruqyah", Icon: Heart, labelKey: "nav.ruqyah" },
      { href: "/house", Icon: HomeIcon, labelKey: "nav.house" },
      { href: "/masjid", Icon: MapPin, labelKey: "nav.masjid" },
      { href: "/morning-ruqyah", Icon: Shield, labelKey: "nav.merged_morning" },
      { href: "/evening-ruqyah", Icon: Star, labelKey: "nav.merged_evening" },
    ],
  },
  {
    titleKey: "nav.quran",
    items: [
      { href: "/quran", Icon: BookOpen, labelKey: "nav.quran" },
    ],
  },
];

function SidebarLink({ href, Icon, labelKey, isActive, onClick }: {
  href: string; Icon: React.ComponentType<{ className?: string }>; labelKey: string; isActive: boolean; onClick?: () => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Link href={href} onClick={onClick} aria-label={t(labelKey)} className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm",
      isActive
        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
        : "hover:bg-muted/60 text-foreground/80 hover:text-foreground"
    )}>
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
      <span>
        <TranslatedText
          text={t(labelKey, { lng: "ar" })}
          staticTranslation={getTranslation(t, labelKey, i18n.language) || undefined}
          keepArabic={false}
          inline
        />
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const rtl = isRTL(i18n.language);
  const settings = getSettings();
  const [search, setSearch] = useState(window.location.search);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize global prayer notifications
  usePrayerNotifications();

  useEffect(() => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    const sizeClass = { sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-xl" }[settings.fontSize] || "text-base";
    document.documentElement.classList.add(sizeClass);
  }, [i18n.language, rtl, settings.fontSize]);

  useEffect(() => {
    const pushState = window.history.pushState;
    const replaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      pushState.apply(window.history, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    window.history.replaceState = function (...args) {
      replaceState.apply(window.history, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    const handleUrlChange = () => {
      setSearch(window.location.search);
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("locationchange", handleUrlChange);

    return () => {
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("locationchange", handleUrlChange);
    };
  }, []);

  const isActive = (href: string) => {
    const [path, searchParam] = href.split("?");
    if (path === "/") return location === "/" && !search;

    if (searchParam) {
      return location === path && search.includes(searchParam);
    }

    if (search.includes("tab=")) {
      return false;
    }

    return location === path || location.startsWith(path + "/");
  };

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex flex-col md:flex-row pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 font-sans")}>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors aria-expanded:bg-primary/10 aria-expanded:text-primary">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={rtl ? "right" : "left"} className="w-72 p-0 border-none bg-card shadow-2xl flex flex-col z-50 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
              <SheetHeader className="p-5 border-b border-border text-start">
                <SheetTitle className="text-xl font-heading font-bold text-primary">
                  <TranslatedText
                    text={t("app.name", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "app.name", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </SheetTitle>
                <p className="text-muted-foreground text-xs mt-0.5">
                  <TranslatedText
                    text={t("app.tagline", { lng: "ar" })}
                    staticTranslation={getTranslation(t, "app.tagline", i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </p>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
                {sidebarSections.map((section, si) => (
                  <div key={si} className="space-y-0.5">
                    {section.titleKey && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1">
                        <TranslatedText
                          text={t(section.titleKey, { lng: "ar" })}
                          staticTranslation={getTranslation(t, section.titleKey, i18n.language) || undefined}
                          keepArabic={false}
                          inline
                        />
                      </p>
                    )}
                    {section.items.map(item => (
                      <SidebarLink
                        key={item.href}
                        href={item.href}
                        Icon={item.Icon}
                        labelKey={item.labelKey}
                        isActive={isActive(item.href)}
                        onClick={() => setMobileMenuOpen(false)}
                      />
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="text-lg font-heading font-bold text-primary">
            <TranslatedText
              text={t("app.name", { lng: "ar" })}
              staticTranslation={getTranslation(t, "app.name", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col w-64 border-border bg-card shadow-sm fixed top-0 bottom-0 z-20",
        rtl ? "right-0 border-l" : "left-0 border-r"
      )}>
        <div className="p-5 border-b border-border">
          <div className="text-xl font-heading font-bold text-primary">
            <TranslatedText
              text={t("app.name", { lng: "ar" })}
              staticTranslation={getTranslation(t, "app.name", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            <TranslatedText
              text={t("app.tagline", { lng: "ar" })}
              staticTranslation={getTranslation(t, "app.tagline", i18n.language) || undefined}
              keepArabic={false}
              inline
            />
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {sidebarSections.map((section, si) => (
            <div key={si} className="space-y-0.5">
              {section.titleKey && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1">
                  <TranslatedText
                    text={t(section.titleKey, { lng: "ar" })}
                    staticTranslation={getTranslation(t, section.titleKey, i18n.language) || undefined}
                    keepArabic={false}
                    inline
                  />
                </p>
              )}
              {section.items.map(item => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  Icon={item.Icon}
                  labelKey={item.labelKey}
                  isActive={isActive(item.href)}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 w-full",
        rtl ? "md:mr-64" : "md:ml-64"
      )}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-50 flex items-stretch justify-around pb-[env(safe-area-inset-bottom,0px)] min-h-[calc(56px+env(safe-area-inset-bottom,0px))] no-tap-highlight">
        {bottomNav.map(({ href, Icon, labelKey }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={t(labelKey)}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 px-2 flex-1 min-h-[56px] transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", active && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium leading-tight text-center", active && "text-primary")}>
                <TranslatedText
                  text={t(labelKey, { lng: "ar" })}
                  staticTranslation={getTranslation(t, labelKey, i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
