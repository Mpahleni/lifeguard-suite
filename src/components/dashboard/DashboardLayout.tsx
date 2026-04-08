import { ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  UserCircle,
  LogOut,
  Shield,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User;
}

const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
    { icon: FileText, label: "Policies", path: "/dashboard/policies" },
    { icon: Users, label: "Clients", path: "/dashboard/clients" },
    { icon: UserCircle, label: "Agents", path: "/dashboard/agents" },
    { icon: CreditCard, label: "Payments", path: "/dashboard/payments" },
    { icon: Shield, label: "Claims", path: "/dashboard/claims" },
    { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sidebar-primary rounded-lg">
              <Shield className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">
                Insurance CRM
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Management Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-3 p-3 bg-sidebar-accent rounded-lg">
            <p className="text-xs text-sidebar-foreground/60 mb-1">
              Signed in as
            </p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.email}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;