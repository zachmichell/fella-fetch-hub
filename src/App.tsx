import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";
import OwnerPortalLayout from "@/components/portal-owner/OwnerPortalLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Onboarding from "./pages/onboarding/Onboarding";
import Dashboard from "./pages/portal/Dashboard";
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
import Playgroups from "./pages/portal/playgroups/Playgroups";
import KennelRuns from "./pages/portal/kennel-runs/KennelRuns";
import CareLogs from "./pages/portal/care-logs/CareLogs";
import IncidentsList from "./pages/portal/incidents/IncidentsList";
import IncidentForm from "./pages/portal/incidents/IncidentForm";
import IncidentDetail from "./pages/portal/incidents/IncidentDetail";
import StaffMessages from "./pages/portal/messages/Messages";
import OwnerMessages from "./pages/portal-owner/Messages";
import OwnerReportCards from "./pages/portal-owner/ReportCards";
import OwnerReportCardDetail from "./pages/portal-owner/ReportCardDetail";
import OwnerDashboard from "./pages/portal-owner/Dashboard";
import OwnerAccount from "./pages/portal-owner/Account";
import OwnerComingSoon from "./pages/portal-owner/ComingSoon";
import OwnerPets from "./pages/portal-owner/Pets";
import OwnerPetDetail from "./pages/portal-owner/PetDetail";
import OwnerBookings from "./pages/portal-owner/Bookings";
import OwnerInvoices from "./pages/portal-owner/Invoices";
import OwnerInvoiceDetail from "./pages/portal-owner/InvoiceDetail";
import OwnerWaivers from "./pages/portal-owner/Waivers";
import OwnerWaiverDetail from "./pages/portal-owner/WaiverDetail";

const queryClient = new QueryClient();

const staff = (el: React.ReactNode) => (
  <ProtectedRoute>
    <RoleRoute allow="staff">{el}</RoleRoute>
  </ProtectedRoute>
);

const customer = (el: React.ReactNode) => (
  <ProtectedRoute>
    <RoleRoute allow="customer">
      <OwnerPortalLayout>{el}</OwnerPortalLayout>
    </RoleRoute>
  </ProtectedRoute>
);

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

            {/* Staff portal */}
            <Route path="/dashboard" element={staff(<Dashboard />)} />
            <Route path="/schedule" element={staff(<Schedule />)} />
            <Route path="/pets" element={staff(<PetsList />)} />
            <Route path="/pets/new" element={staff(<PetForm />)} />
            <Route path="/pets/:id" element={staff(<PetDetail />)} />
            <Route path="/pets/:id/edit" element={staff(<PetForm />)} />
            <Route path="/owners" element={staff(<OwnersList />)} />
            <Route path="/owners/new" element={staff(<OwnerForm />)} />
            <Route path="/owners/:id" element={staff(<OwnerDetail />)} />
            <Route path="/owners/:id/edit" element={staff(<OwnerForm />)} />
            <Route path="/services" element={staff(<ServicesList />)} />
            <Route path="/services/new" element={staff(<ServiceForm />)} />
            <Route path="/services/:id" element={staff(<ServiceDetail />)} />
            <Route path="/services/:id/edit" element={staff(<ServiceForm />)} />
            <Route path="/reservations" element={staff(<ReservationsList />)} />
            <Route path="/reservations/new" element={staff(<ReservationForm />)} />
            <Route path="/reservations/:id" element={staff(<ReservationDetail />)} />
            <Route path="/reservations/:id/edit" element={staff(<ReservationEdit />)} />
            <Route path="/invoices" element={staff(<InvoicesList />)} />
            <Route path="/invoices/:id" element={staff(<InvoiceDetail />)} />
            <Route path="/care-logs" element={staff(<CareLogs />)} />
            <Route path="/messages" element={staff(<StaffMessages />)} />
            <Route path="/incidents" element={staff(<IncidentsList />)} />
            <Route path="/incidents/new" element={staff(<IncidentForm />)} />
            <Route path="/incidents/:id" element={staff(<IncidentDetail />)} />
            <Route path="/incidents/:id/edit" element={staff(<IncidentForm />)} />
            <Route path="/playgroups" element={staff(<Playgroups />)} />
            <Route path="/kennel-runs" element={staff(<KennelRuns />)} />
            <Route path="/settings" element={staff(<Settings />)} />

            {/* Owner portal */}
            <Route path="/portal/dashboard" element={customer(<OwnerDashboard />)} />
            <Route path="/portal/account" element={customer(<OwnerAccount />)} />
            <Route path="/portal/pets" element={customer(<OwnerPets />)} />
            <Route path="/portal/pets/:id" element={customer(<OwnerPetDetail />)} />
            <Route path="/portal/bookings" element={customer(<OwnerBookings />)} />
            <Route path="/portal/invoices" element={customer(<OwnerInvoices />)} />
            <Route path="/portal/invoices/:id" element={customer(<OwnerInvoiceDetail />)} />
            <Route path="/portal/waivers" element={customer(<OwnerWaivers />)} />
            <Route path="/portal/waivers/:id" element={customer(<OwnerWaiverDetail />)} />
            <Route path="/portal/report-cards" element={customer(<OwnerReportCards />)} />
            <Route path="/portal/report-cards/:id" element={customer(<OwnerReportCardDetail />)} />
            <Route path="/portal/messages" element={customer(<OwnerMessages />)} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
