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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: any;
}

export const PaymentDialog = ({ open, onOpenChange, payment }: PaymentDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm();

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
    if (payment) {
      reset({
        policy_id: payment.policy_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        due_date: payment.due_date,
        status: payment.status,
        payment_method: payment.payment_method,
        reference: payment.reference,
      });
    } else {
      reset({ status: "pending", payment_date: new Date().toISOString().split("T")[0] });
    }
  }, [payment, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (payment) {
        const { error } = await supabase.from("payments").update(data).eq("id", payment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payments").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(payment ? "Payment updated" : "Payment recorded");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to save payment"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Record Payment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Policy</Label>
            <Select
              onValueChange={(v) => setValue("policy_id", v)}
              defaultValue={payment?.policy_id}
            >
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
              <Label>Amount (R)</Label>
              <Input type="number" step="0.01" {...register("amount", { required: true })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                onValueChange={(v) => setValue("status", v)}
                defaultValue={payment?.status || "pending"}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Date</Label>
              <Input type="date" {...register("payment_date", { required: true })} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" {...register("due_date", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Method</Label>
              <Select onValueChange={(v) => setValue("payment_method", v)} defaultValue={payment?.payment_method}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="debit_order">Debit Order</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference</Label>
              <Input {...register("reference")} />
            </div>
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
