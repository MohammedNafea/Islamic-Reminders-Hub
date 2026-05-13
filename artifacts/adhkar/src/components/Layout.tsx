import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import {
  Home, Sun, Moon, Star, Clock, Settings,
  BookOpen, Heart, Calendar, AlignJustify, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { isRTL } from "@/i18n";
import { getSettings } from "@/lib/store";

// Bottom nav — 5 items
const bottomNav = [
  { href: "/", Icon: Home, labelKey: "nav.home" },
  { href: "/adhkar", Icon: BookOpen, labelKey: "nav.adhkar" },
  { href: "/times", Icon: Clock, labelKey: "nav.times" },
  { href: "/tasbih", Icon: Timer, labelKey: "nav.tasbih" },
  { href: "/settings", Icon: Settings, labelKey: "nav.settings" },
];

// Sidebar sections
const sidebarSections = [
  {
    titleKey: null,
    items: [
      { href: "/", Icon: Home, labelKey: "nav.home" },
    ],
  },
  {
    titleKey: "nav.adhkar",
    items: [
      { href: "/morning", Icon: Sun, labelKey: "nav.morning" },
      { href: "/evening", Icon: Moon, labelKey: "nav.evening" },
      { href: "/sleep", Icon: Star, labelKey: "nav.sleep" },
      { href: "/prayer", Icon: Clock, labelKey: "nav.prayer" },
      { href: "/ruqyah", Icon: Heart, labelKey: "nav.ruqyah" },
    ],
  },
  {
    titleKey: "nav.times",
    items: [
      { href: "/times", Icon: Clock, labelKey: "nav.times" },
      { href: "/fasting", Icon: Calendar, labelKey: "nav.fasting" },
      { href: "/tasbih", Icon: Timer, labelKey: "nav.tasbih" },
    ],
  },
  {
    titleKey: null,
    items: [
      { href: "/settings", Icon: Settings, labelKey: "nav.settings" },
    ],
  },
];

function SidebarLink({ href, Icon, labelKey, isActive }: {
  href: string; Icon: React.ComponentType<any>; labelKey: string; isActive: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm",
      isActive
        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
        : "hover:bg-muted/60 text-foreground/80 hover:text-foreground"
    )}>
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
      <span>{t(labelKey)}</span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const rtl = isRTL(i18n.language);
  const settings = getSettings();

  useEffect(() => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    const sizeClass = { sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-xl" }[settings.fontSize] || "text-base";
    document.documentElement.classList.add(sizeClass);
  }, [i18n.language, rtl, settings.fontSize]);

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex flex-col md:flex-row pb-16 md:pb-0 font-sans")}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-e border-border bg-card shadow-sm fixed top-0 bottom-0 z-20">
        <div className="p-5 border-b border-border">
          <h1 className="text-xl font-heading font-bold text-primary">{t("app.name")}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{t("app.tagline")}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {sidebarSections.map((section, si) => (
            <div key={si} className="space-y-0.5">
              {section.titleKey && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1">
                  {t(section.titleKey)}
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
        rtl ? "md:me-64" : "md:ms-64"
      )}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-50 flex items-stretch justify-around">
        {bottomNav.map(({ href, Icon, labelKey }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 px-2 flex-1 min-h-[56px] transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", active && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium leading-tight text-center", active && "text-primary")}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
