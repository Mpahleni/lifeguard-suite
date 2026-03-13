import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface PaymentsTableProps {
  payments: any[];
  onEdit: (payment: any) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  failed: "bg-muted text-muted-foreground border-border",
};

export const PaymentsTable = ({ payments, onEdit, onDelete }: PaymentsTableProps) => (
  <div className="rounded-lg border border-border bg-card shadow-sm">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Policy</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
              No payments found
            </TableCell>
          </TableRow>
        ) : (
          payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.reference || "—"}</TableCell>
              <TableCell>{p.policies?.policy_number || "—"}</TableCell>
              <TableCell>{p.policies?.clients?.full_name || "—"}</TableCell>
              <TableCell>
                <Badge className={statusColors[p.status] || statusColors.failed}>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">R {Number(p.amount).toLocaleString()}</TableCell>
              <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(p.due_date).toLocaleDateString()}</TableCell>
              <TableCell>{p.payment_method || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)}>
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
