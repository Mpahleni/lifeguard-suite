import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: any;
}

export const AgentDialog = ({ open, onOpenChange, agent }: AgentDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      agent_code: "",
      commission_rate: 10,
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (agent) {
      reset({
        agent_code: agent.agent_code,
        commission_rate: agent.commission_rate,
        is_active: agent.is_active,
      });
    } else {
      reset({ commission_rate: 10, is_active: true });
    }
  }, [agent, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (agent) {
        const { error } = await supabase
          .from("agents")
          .update(data)
          .eq("id", agent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agents").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success(agent ? "Agent updated" : "Agent created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save agent");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{agent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Agent Code</Label>
            <Input {...register("agent_code", { required: true })} />
          </div>

          <div>
            <Label>Commission Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              {...register("commission_rate", { required: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active Status</Label>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
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
