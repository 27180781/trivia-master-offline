import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import LicenseEntry from "./pages/LicenseEntry";
import Setup from "./pages/Setup";
import Game from "./pages/Game";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import PackageExport from "./pages/PackageExport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GameProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<LicenseEntry />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/game" element={<Game />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/package" element={<PackageExport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;