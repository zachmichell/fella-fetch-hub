import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Onboarding from "./pages/onboarding/Onboarding";
import Dashboard from "./pages/portal/Dashboard";
import ComingSoon from "./pages/portal/ComingSoon";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireOrg={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><ComingSoon title="Schedule" description="Daily and weekly facility schedule." /></ProtectedRoute>} />
            <Route path="/pets" element={<ProtectedRoute><ComingSoon title="Pets" description="Manage pet profiles, vaccinations, and intake." /></ProtectedRoute>} />
            <Route path="/owners" element={<ProtectedRoute><ComingSoon title="Owners" description="Manage owner accounts and contacts." /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ComingSoon title="Reservations" description="Bookings across daycare and boarding." /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><ComingSoon title="Invoices" description="Billing, payments, and payouts." /></ProtectedRoute>} />
            <Route path="/playgroups" element={<ProtectedRoute><ComingSoon title="Playgroups" description="Group assignments for daycare." /></ProtectedRoute>} />
            <Route path="/kennel-runs" element={<ProtectedRoute><ComingSoon title="Kennel Runs" description="Boarding suite assignments and capacity." /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ComingSoon title="Settings" description="Organization, locations, taxes, and team." /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
