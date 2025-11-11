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

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

export const ClientDialog = ({ open, onOpenChange, client }: ClientDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

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
    if (client) {
      reset({
        full_name: client.full_name,
        id_number: client.id_number,
        phone: client.phone,
        email: client.email,
        date_of_birth: client.date_of_birth,
        address: client.address,
        agent_id: client.agent_id,
        next_of_kin_name: client.next_of_kin_name,
        next_of_kin_phone: client.next_of_kin_phone,
      });
    } else {
      reset({});
    }
  }, [client, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (client) {
        const { error } = await supabase
          .from("clients")
          .update(data)
          .eq("id", client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(client ? "Client updated" : "Client created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save client");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input {...register("full_name", { required: true })} />
            </div>
            <div>
              <Label>ID Number</Label>
              <Input {...register("id_number", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input {...register("phone", { required: true })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" {...register("date_of_birth", { required: true })} />
            </div>
            <div>
              <Label>Agent</Label>
              <Select
                onValueChange={(value) => setValue("agent_id", value)}
                defaultValue={client?.agent_id}
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

          <div>
            <Label>Address</Label>
            <Input {...register("address")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Next of Kin Name</Label>
              <Input {...register("next_of_kin_name")} />
            </div>
            <div>
              <Label>Next of Kin Phone</Label>
              <Input {...register("next_of_kin_phone")} />
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
