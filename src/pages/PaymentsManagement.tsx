import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const PaymentsManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", statusFilter, searchQuery, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          policies (
            policy_number,
            clients (full_name, id_number)
          )
        `)
        .order("payment_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (dateFrom) {
        query = query.gte("payment_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("payment_date", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (searchQuery) {
        return data.filter((p: any) =>
          p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.policies?.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.policies?.clients?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment deleted");
    },
    onError: () => toast.error("Failed to delete payment"),
  });

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this payment record?")) deleteMutation.mutate(id);
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground">Track policy payments and due dates</p>
          </div>
          <Button onClick={() => { setSelectedPayment(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, policy, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
            placeholder="To"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <PaymentsTable
            payments={payments || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <PaymentDialog
          open={dialogOpen}
          onOpenChange={() => { setDialogOpen(false); setSelectedPayment(null); }}
          payment={selectedPayment}
        />
      </div>
    </DashboardLayout>
  );
};

export default PaymentsManagement;
