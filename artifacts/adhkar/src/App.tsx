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
import PrayerTimesPage from "@/pages/PrayerTimesPage";
import Fasting from "@/pages/Fasting";
import Tasbih from "@/pages/Tasbih";
import Settings from "@/pages/Settings";

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
        <Route path="/times" component={PrayerTimesPage} />
        <Route path="/fasting" component={Fasting} />
        <Route path="/tasbih" component={Tasbih} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="adhkar_settings">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
