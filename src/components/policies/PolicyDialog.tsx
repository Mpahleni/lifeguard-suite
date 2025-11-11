import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface PolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: any;
}

export const PolicyDialog = ({ open, onOpenChange, policy }: PolicyDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, id_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: agents } = useQuery({
    queryKey: ["agents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, agent_code");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (policy) {
      reset({
        policy_number: policy.policy_number,
        client_id: policy.client_id,
        agent_id: policy.agent_id,
        status: policy.status,
        premium_amount: policy.premium_amount,
        cover_amount: policy.cover_amount,
        start_date: policy.start_date,
        next_payment_date: policy.next_payment_date,
      });
    } else {
      reset({});
    }
  }, [policy, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (policy) {
        const { error } = await supabase
          .from("policies")
          .update(data)
          .eq("id", policy.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("policies").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success(policy ? "Policy updated" : "Policy created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save policy");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? "Edit Policy" : "Add New Policy"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Policy Number</Label>
              <Input {...register("policy_number", { required: true })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                onValueChange={(value) => setValue("status", value)}
                defaultValue={policy?.status || "pending"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lapsed">Lapsed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <Select
                onValueChange={(value) => setValue("client_id", value)}
                defaultValue={policy?.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name} ({client.id_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agent</Label>
              <Select
                onValueChange={(value) => setValue("agent_id", value)}
                defaultValue={policy?.agent_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.agent_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Premium Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...register("premium_amount", { required: true })}
              />
            </div>
            <div>
              <Label>Cover Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...register("cover_amount", { required: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" {...register("start_date", { required: true })} />
            </div>
            <div>
              <Label>Next Payment Date</Label>
              <Input type="date" {...register("next_payment_date")} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
