import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
];

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Revenue data - payments grouped by month
  const { data: revenueData } = useQuery({
    queryKey: ["reports-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, payment_date, status")
        .eq("status", "paid")
        .order("payment_date", { ascending: true });
      if (error) throw error;

      const grouped: Record<string, number> = {};
      (data || []).forEach((p) => {
        const month = p.payment_date.substring(0, 7); // YYYY-MM
        grouped[month] = (grouped[month] || 0) + Number(p.amount);
      });

      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, total]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-ZA", { month: "short", year: "2-digit" }),
          revenue: total,
        }));
    },
  });

  // Policy status distribution
  const { data: policyData } = useQuery({
    queryKey: ["reports-policies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("policies").select("status");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((p) => {
        counts[p.status] = (counts[p.status] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  // Claims status distribution
  const { data: claimsData } = useQuery({
    queryKey: ["reports-claims"],
    queryFn: async () => {
      const { data, error } = await supabase.from("claims").select("status, claim_amount, approved_amount");
      if (error) throw error;
      const counts: Record<string, { count: number; total: number }> = {};
      (data || []).forEach((c) => {
        if (!counts[c.status]) counts[c.status] = { count: 0, total: 0 };
        counts[c.status].count++;
        counts[c.status].total += Number(c.claim_amount);
      });
      return Object.entries(counts).map(([name, { count, total }]) => ({ name, count, total }));
    },
  });

  // Agent performance - policies per agent
  const { data: agentData } = useQuery({
    queryKey: ["reports-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("agent_id, premium_amount, agents(agent_code, commission_rate)");
      if (error) throw error;

      const grouped: Record<string, { code: string; policies: number; premium: number; commission: number }> = {};
      (data || []).forEach((p: any) => {
        if (!p.agent_id || !p.agents) return;
        if (!grouped[p.agent_id]) {
          grouped[p.agent_id] = {
            code: p.agents.agent_code,
            policies: 0,
            premium: 0,
            commission: 0,
          };
        }
        grouped[p.agent_id].policies++;
        grouped[p.agent_id].premium += Number(p.premium_amount);
        grouped[p.agent_id].commission += Number(p.premium_amount) * (Number(p.agents.commission_rate) / 100);
      });

      return Object.values(grouped).sort((a, b) => b.premium - a.premium).slice(0, 10);
    },
  });

  // Client growth - clients created over time
  const { data: clientGrowthData } = useQuery({
    queryKey: ["reports-client-growth"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const grouped: Record<string, number> = {};
      (data || []).forEach((c) => {
        const month = c.created_at.substring(0, 7);
        grouped[month] = (grouped[month] || 0) + 1;
      });

      let cumulative = 0;
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => {
          cumulative += count;
          return {
            month: new Date(month + "-01").toLocaleDateString("en-ZA", { month: "short", year: "2-digit" }),
            newClients: count,
            totalClients: cumulative,
          };
        });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { navigate("/auth"); return null; }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business performance insights</p>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="agents">Agent Performance</TabsTrigger>
            <TabsTrigger value="clients">Client Growth</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData && revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                      <YAxis className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`R ${value.toLocaleString()}`, "Revenue"]} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No revenue data available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Policy Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {policyData && policyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={policyData} cx="50%" cy="50%" outerRadius={150} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {policyData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No policy data available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle>Claims by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {claimsData && claimsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={claimsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number, name: string) => [name === "total" ? `R ${value.toLocaleString()}` : value, name === "total" ? "Total Amount" : "Count"]} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="hsl(var(--primary))" name="Count" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="total" fill="hsl(var(--accent))" name="Total Amount" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No claims data available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Agent Commissions & Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {agentData && agentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={agentData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="code" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number, name: string) => [`R ${value.toLocaleString()}`, name]} />
                      <Legend />
                      <Bar dataKey="premium" fill="hsl(var(--primary))" name="Premium" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="commission" fill="hsl(142 76% 36%)" name="Commission" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No agent data available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Growth Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Client Growth Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {clientGrowthData && clientGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={clientGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="newClients" stroke="hsl(var(--primary))" name="New Clients" strokeWidth={2} />
                      <Line type="monotone" dataKey="totalClients" stroke="hsl(142 76% 36%)" name="Total Clients" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No client data available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboard;
