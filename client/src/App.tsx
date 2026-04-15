import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import HostGame from "./pages/HostGame.tsx";
import HostLive from "./pages/HostLive.tsx";
import JoinGame from "./pages/JoinGame.tsx";
import Lobby from "./pages/Lobby.tsx";
import PlayGame from "./pages/PlayGame.tsx";
import HomeButton from "./components/HomeButton.tsx";
import RulesHelpButton from "./components/RulesHelpButton.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <HomeButton />
        <RulesHelpButton />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/host" element={<HostGame />} />
          <Route path="/host/game/:code" element={<HostLive />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/join/:code" element={<JoinGame />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/play/:code" element={<PlayGame />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
