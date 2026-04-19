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
import OwnersList from "./pages/portal/owners/OwnersList";
import OwnerForm from "./pages/portal/owners/OwnerForm";
import OwnerDetail from "./pages/portal/owners/OwnerDetail";
import PetsList from "./pages/portal/pets/PetsList";
import PetForm from "./pages/portal/pets/PetForm";
import PetDetail from "./pages/portal/pets/PetDetail";
import ServicesList from "./pages/portal/services/ServicesList";
import ServiceForm from "./pages/portal/services/ServiceForm";
import ServiceDetail from "./pages/portal/services/ServiceDetail";
import ReservationsList from "./pages/portal/reservations/ReservationsList";
import ReservationForm from "./pages/portal/reservations/ReservationForm";
import ReservationDetail from "./pages/portal/reservations/ReservationDetail";
import ReservationEdit from "./pages/portal/reservations/ReservationEdit";
import Schedule from "./pages/portal/schedule/Schedule";
import InvoicesList from "./pages/portal/invoices/InvoicesList";
import InvoiceDetail from "./pages/portal/invoices/InvoiceDetail";
import Settings from "./pages/portal/settings/Settings";

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
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/pets" element={<ProtectedRoute><PetsList /></ProtectedRoute>} />
            <Route path="/pets/new" element={<ProtectedRoute><PetForm /></ProtectedRoute>} />
            <Route path="/pets/:id" element={<ProtectedRoute><PetDetail /></ProtectedRoute>} />
            <Route path="/pets/:id/edit" element={<ProtectedRoute><PetForm /></ProtectedRoute>} />
            <Route path="/owners" element={<ProtectedRoute><OwnersList /></ProtectedRoute>} />
            <Route path="/owners/new" element={<ProtectedRoute><OwnerForm /></ProtectedRoute>} />
            <Route path="/owners/:id" element={<ProtectedRoute><OwnerDetail /></ProtectedRoute>} />
            <Route path="/owners/:id/edit" element={<ProtectedRoute><OwnerForm /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><ServicesList /></ProtectedRoute>} />
            <Route path="/services/new" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
            <Route path="/services/:id" element={<ProtectedRoute><ServiceDetail /></ProtectedRoute>} />
            <Route path="/services/:id/edit" element={<ProtectedRoute><ServiceForm /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ReservationsList /></ProtectedRoute>} />
            <Route path="/reservations/new" element={<ProtectedRoute><ReservationForm /></ProtectedRoute>} />
            <Route path="/reservations/:id" element={<ProtectedRoute><ReservationDetail /></ProtectedRoute>} />
            <Route path="/reservations/:id/edit" element={<ProtectedRoute><ReservationEdit /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/playgroups" element={<ProtectedRoute><ComingSoon title="Playgroups" description="Group assignments for daycare." /></ProtectedRoute>} />
            <Route path="/kennel-runs" element={<ProtectedRoute><ComingSoon title="Kennel Runs" description="Boarding suite assignments and capacity." /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
