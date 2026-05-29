import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";

import Home from "@/pages/Home";
import AdhkarHub from "@/pages/AdhkarHub";
import Morning from "@/pages/Morning";
import Evening from "@/pages/Evening";
import Sleep from "@/pages/Sleep";
import Prayer from "@/pages/Prayer";
import Ruqyah from "@/pages/Ruqyah";
import HouseAdhkar from "@/pages/HouseAdhkar";
import MasjidAdhkar from "@/pages/MasjidAdhkar";
import PrayerTimesPage from "@/pages/PrayerTimesPage";
import Fasting from "@/pages/Fasting";
import Tasbih from "@/pages/Tasbih";
import Settings from "@/pages/Settings";
import Quran from "@/pages/Quran";
// TEMPORARILY HIDDEN
// import HadithPage from "@/pages/HadithRulings";
import MergedDhikr from "@/pages/MergedDhikr";
// import Favorites from "@/pages/Favorites";
// import SearchPage from "@/pages/Search";
// import LibraryAdmin from "@/pages/LibraryAdmin";
import Zakat from "@/pages/Zakat";
import Qibla from "@/pages/Qibla";
import TrackerDashboard from "@/pages/TrackerDashboard";
import Download from "@/pages/Download";
import Sunan from "@/pages/Sunan";
import DailySupplications from "@/pages/DailySupplications";
import ArafahHajj from "@/pages/ArafahHajj";
import { monitoring } from "@/lib/monitoring";

// Initialize monitoring for production telemetry
monitoring.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
});

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/adhkar" component={AdhkarHub} />
        <Route path="/morning" component={Morning} />
        <Route path="/evening" component={Evening} />
        <Route path="/sleep" component={Sleep} />
        <Route path="/prayer" component={Prayer} />
        <Route path="/ruqyah" component={Ruqyah} />
        <Route path="/house" component={HouseAdhkar} />
        <Route path="/masjid" component={MasjidAdhkar} />
        <Route path="/times" component={PrayerTimesPage} />
        <Route path="/fasting" component={Fasting} />
        <Route path="/tasbih" component={Tasbih} />
        <Route path="/tracker" component={TrackerDashboard} />
        <Route path="/quran" component={Quran} />
        {/* TEMPORARILY HIDDEN */}
        {/* <Route path="/hadith" component={HadithPage} /> */}
        <Route path="/morning-ruqyah" component={MergedDhikr} />
        <Route path="/evening-ruqyah" component={MergedDhikr} />
        <Route path="/settings" component={Settings} />
        {/* <Route path="/favorites" component={Favorites} /> */}
        {/* <Route path="/search" component={SearchPage} /> */}
        {/* <Route path="/admin/library" component={LibraryAdmin} /> */}
        <Route path="/zakat" component={Zakat} />
        <Route path="/qibla" component={Qibla} />
        <Route path="/download" component={Download} />
        <Route path="/sunan" component={Sunan} />
        <Route path="/daily-supplications" component={DailySupplications} />
        <Route path="/arafah-hajj" component={ArafahHajj} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

import PWAInstallPrompt from "@/components/PWAInstallPrompt";

function App() {
  useEffect(() => {
    // Request Notification permission on startup
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(console.error);
    }
    // Request Geolocation permission on startup to ensure prayer times work smoothly
    if (typeof window !== "undefined" && "navigator" in window && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log("Startup geolocation permission checked"),
        (err) => console.warn("Startup geolocation check:", err.message),
        { timeout: 5000 }
      );
    }
    // Periodically check for service worker updates (every 5 minutes)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const interval = setInterval(() => {
          registration.update().catch(console.error);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
      }).catch(console.error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="adhkar_theme">
        <TooltipProvider>
          <WouterRouter>
            <Router />
          </WouterRouter>
          <Toaster />
          <PWAInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
