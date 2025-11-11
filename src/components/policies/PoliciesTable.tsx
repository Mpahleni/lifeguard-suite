import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface Policy {
  id: string;
  policy_number: string;
  status: string;
  premium_amount: number;
  cover_amount: number;
  start_date: string;
  clients: { full_name: string; id_number: string };
  agents: { agent_code: string } | null;
}

interface PoliciesTableProps {
  policies: Policy[];
  onEdit: (policy: Policy) => void;
  onDelete: (id: string) => void;
}

export const PoliciesTable = ({ policies, onEdit, onDelete }: PoliciesTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "lapsed":
        return "bg-warning/10 text-warning border-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Policy Number</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Premium</TableHead>
            <TableHead className="text-right">Cover Amount</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No policies found
              </TableCell>
            </TableRow>
          ) : (
            policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell className="font-medium">{policy.policy_number}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{policy.clients.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {policy.clients.id_number}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{policy.agents?.agent_code || "N/A"}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(policy.status)}>
                    {policy.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  R {Number(policy.premium_amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  R {Number(policy.cover_amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(policy.start_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(policy)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
