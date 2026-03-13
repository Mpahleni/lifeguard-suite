import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim?: any;
}

export const ClaimDialog = ({ open, onOpenChange, claim }: ClaimDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: policies } = useQuery({
    queryKey: ["policies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("id, policy_number, clients(full_name)");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (claim) {
      reset({
        policy_id: claim.policy_id,
        claim_number: claim.claim_number,
        claim_amount: claim.claim_amount,
        claim_date: claim.claim_date,
        status: claim.status,
        description: claim.description,
        approved_amount: claim.approved_amount,
        payout_date: claim.payout_date,
      });
    } else {
      reset({
        status: "pending",
        claim_date: new Date().toISOString().split("T")[0],
        claim_number: `CLM-${Date.now().toString().slice(-6)}`,
      });
    }
  }, [claim, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (claim) {
        const { error } = await supabase.from("claims").update(data).eq("id", claim.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("claims").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success(claim ? "Claim updated" : "Claim created");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to save claim"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{claim ? "Edit Claim" : "New Claim"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Policy</Label>
            <Select onValueChange={(v) => setValue("policy_id", v)} defaultValue={claim?.policy_id}>
              <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
              <SelectContent>
                {policies?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.policy_number} — {p.clients?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Claim Number</Label>
              <Input {...register("claim_number", { required: true })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select onValueChange={(v) => setValue("status", v)} defaultValue={claim?.status || "pending"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Claim Amount (R)</Label>
              <Input type="number" step="0.01" {...register("claim_amount", { required: true })} />
            </div>
            <div>
              <Label>Claim Date</Label>
              <Input type="date" {...register("claim_date", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Approved Amount (R)</Label>
              <Input type="number" step="0.01" {...register("approved_amount")} />
            </div>
            <div>
              <Label>Payout Date</Label>
              <Input type="date" {...register("payout_date")} />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register("description")} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
