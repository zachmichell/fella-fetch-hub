import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Daycare from "./pages/services/Daycare";
import Boarding from "./pages/services/Boarding";
import Grooming from "./pages/services/Grooming";
import Training from "./pages/services/Training";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Policies from "./pages/Policies";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Shop from "./pages/Shop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services/daycare" element={<Daycare />} />
          <Route path="/services/boarding" element={<Boarding />} />
          <Route path="/services/grooming" element={<Grooming />} />
          <Route path="/services/training" element={<Training />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
