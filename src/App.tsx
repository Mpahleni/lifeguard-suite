import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PoliciesManagement from "./pages/PoliciesManagement";
import ClientsManagement from "./pages/ClientsManagement";
import AgentsManagement from "./pages/AgentsManagement";
import PaymentsManagement from "./pages/PaymentsManagement";
import ClaimsManagement from "./pages/ClaimsManagement";
import NotificationsManagement from "./pages/NotificationsManagement";
import ReportsDashboard from "./pages/ReportsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/policies" element={<PoliciesManagement />} />
          <Route path="/dashboard/clients" element={<ClientsManagement />} />
          <Route path="/dashboard/agents" element={<AgentsManagement />} />
          <Route path="/dashboard/payments" element={<PaymentsManagement />} />
          <Route path="/dashboard/claims" element={<ClaimsManagement />} />
          <Route path="/dashboard/notifications" element={<NotificationsManagement />} />
          <Route path="/dashboard/reports" element={<ReportsDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
