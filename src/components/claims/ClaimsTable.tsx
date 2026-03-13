import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle, XCircle, DollarSign } from "lucide-react";

interface ClaimsTableProps {
  claims: any[];
  onEdit: (claim: any) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string, approved_amount?: number) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-primary/10 text-primary border-primary/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  paid: "bg-success/10 text-success border-success/20",
};

export const ClaimsTable = ({ claims, onEdit, onDelete, onStatusChange }: ClaimsTableProps) => (
  <div className="rounded-lg border border-border bg-card shadow-sm">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Claim #</TableHead>
          <TableHead>Policy</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Claim Amount</TableHead>
          <TableHead className="text-right">Approved</TableHead>
          <TableHead>Claim Date</TableHead>
          <TableHead>Payout Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
              No claims found
            </TableCell>
          </TableRow>
        ) : (
          claims.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.claim_number}</TableCell>
              <TableCell>{c.policies?.policy_number || "—"}</TableCell>
              <TableCell>{c.policies?.clients?.full_name || "—"}</TableCell>
              <TableCell>
                <Badge className={statusColors[c.status] || ""}>
                  {c.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">R {Number(c.claim_amount).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                {c.approved_amount ? `R ${Number(c.approved_amount).toLocaleString()}` : "—"}
              </TableCell>
              <TableCell>{new Date(c.claim_date).toLocaleDateString()}</TableCell>
              <TableCell>{c.payout_date ? new Date(c.payout_date).toLocaleDateString() : "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {c.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Approve"
                        onClick={() => onStatusChange(c.id, "approved", c.claim_amount)}
                      >
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Reject"
                        onClick={() => onStatusChange(c.id, "rejected")}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  {c.status === "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Mark as Paid"
                      onClick={() => onStatusChange(c.id, "paid")}
                    >
                      <DollarSign className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)}>
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
