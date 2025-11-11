import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl shadow-lg">
              <Shield className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Funeral Insurance Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive CRM solution for funeral parlors to manage policies, clients, and claims efficiently
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <FileText className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Policy Management</h3>
            <p className="text-muted-foreground">
              Track all policies, premiums, and coverage details in one centralized system
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <Users className="h-10 w-10 text-success mb-4" />
            <h3 className="text-xl font-semibold mb-2">Client & Agent Portal</h3>
            <p className="text-muted-foreground">
              Manage client information and agent performance with ease
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <BarChart3 className="h-10 w-10 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-muted-foreground">
              Get insights into revenue, claims, and business performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
