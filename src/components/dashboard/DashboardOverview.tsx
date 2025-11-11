import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, UserCircle, CreditCard, TrendingUp } from "lucide-react";

const DashboardOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [
        { count: policiesCount },
        { count: clientsCount },
        { count: agentsCount },
        { count: claimsCount },
        { data: activePolicies },
      ] = await Promise.all([
        supabase.from("policies").select("*", { count: "exact", head: true }),
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("agents").select("*", { count: "exact", head: true }),
        supabase.from("claims").select("*", { count: "exact", head: true }),
        supabase.from("policies").select("premium_amount").eq("status", "active"),
      ]);

      const monthlyRevenue = activePolicies?.reduce(
        (sum, policy) => sum + Number(policy.premium_amount || 0),
        0
      );

      return {
        policies: policiesCount || 0,
        clients: clientsCount || 0,
        agents: agentsCount || 0,
        claims: claimsCount || 0,
        revenue: monthlyRevenue || 0,
      };
    },
  });

  const statCards = [
    {
      title: "Total Policies",
      value: stats?.policies || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Clients",
      value: stats?.clients || 0,
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Agents",
      value: stats?.agents || 0,
      icon: UserCircle,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Claims",
      value: stats?.claims || 0,
      icon: CreditCard,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Monthly Revenue",
      value: `R ${stats?.revenue.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your funeral insurance management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Add new policy
            </p>
            <p className="text-sm text-muted-foreground">
              • Register new client
            </p>
            <p className="text-sm text-muted-foreground">
              • Process claim
            </p>
            <p className="text-sm text-muted-foreground">
              • Generate reports
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will appear here as you use the system
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;