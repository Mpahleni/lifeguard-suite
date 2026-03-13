import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClaimsTable } from "@/components/claims/ClaimsTable";
import { ClaimDialog } from "@/components/claims/ClaimDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const ClaimsManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: claims, isLoading } = useQuery({
    queryKey: ["claims", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("claims")
        .select(`
          *,
          policies (
            policy_number,
            clients (full_name, id_number)
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (searchQuery) {
        return data.filter((c: any) =>
          c.claim_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.policies?.policy_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.policies?.clients?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("claims").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Claim deleted");
    },
    onError: () => toast.error("Failed to delete claim"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, approved_amount, payout_date }: any) => {
      const update: any = { status };
      if (approved_amount !== undefined) update.approved_amount = approved_amount;
      if (payout_date) update.payout_date = payout_date;
      const { error } = await supabase.from("claims").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Claim status updated");
    },
    onError: () => toast.error("Failed to update claim status"),
  });

  const handleEdit = (claim: any) => {
    setSelectedClaim(claim);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this claim?")) deleteMutation.mutate(id);
  };

  const handleStatusChange = (id: string, status: string, approved_amount?: number) => {
    const update: any = { id, status };
    if (status === "approved" && approved_amount !== undefined) {
      update.approved_amount = approved_amount;
    }
    if (status === "paid") {
      update.payout_date = new Date().toISOString().split("T")[0];
    }
    statusMutation.mutate(update);
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
            <h1 className="text-3xl font-bold text-foreground">Claims Processing</h1>
            <p className="text-muted-foreground">Manage insurance claims and payouts</p>
          </div>
          <Button onClick={() => { setSelectedClaim(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by claim number, policy, or client..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ClaimsTable
            claims={claims || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}

        <ClaimDialog
          open={dialogOpen}
          onOpenChange={() => { setDialogOpen(false); setSelectedClaim(null); }}
          claim={selectedClaim}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClaimsManagement;
