import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Bell, CreditCard, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SendResult {
  phone: string;
  success: boolean;
  sid?: string;
  error?: string;
}

const NotificationsManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [fromNumber, setFromNumber] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<{
    type: string;
    totalRecipients: number;
    sent: number;
    failed: number;
    results: SendResult[];
  } | null>(null);

  const sendReminders = async (type: "payment_due" | "policy_renewal") => {
    if (!fromNumber.trim()) {
      toast.error("Please enter your Twilio phone number");
      return;
    }

    setSending(type);
    setLastResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-sms-reminder", {
        body: { type, fromNumber: fromNumber.trim() },
      });

      if (error) throw error;

      setLastResults(data);
      if (data.sent > 0) {
        toast.success(`Sent ${data.sent} SMS reminder(s)`);
      } else if (data.totalRecipients === 0) {
        toast.info("No recipients found for this reminder type");
      } else {
        toast.error(`Failed to send ${data.failed} reminder(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send reminders");
    } finally {
      setSending(null);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Send automated SMS reminders to clients</p>
        </div>

        {/* Twilio Number Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Twilio Configuration</CardTitle>
            <CardDescription>Enter your Twilio phone number to send SMS from (E.164 format, e.g. +27123456789)</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="+27123456789"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {/* Reminder Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Payment Due Reminders</CardTitle>
                  <CardDescription>SMS clients with pending/overdue payments due within 7 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => sendReminders("payment_due")}
                disabled={sending !== null}
              >
                {sending === "payment_due" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Payment Reminders
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Policy Renewal Reminders</CardTitle>
                  <CardDescription>SMS clients with upcoming policy renewals within 30 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => sendReminders("policy_renewal")}
                disabled={sending !== null}
              >
                {sending === "policy_renewal" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Renewal Reminders
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {lastResults && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Last Send Results
              </CardTitle>
              <CardDescription>
                {lastResults.totalRecipients} recipient(s) found — {lastResults.sent} sent, {lastResults.failed} failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResults.results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recipients matched the criteria.</p>
              ) : (
                <div className="space-y-2">
                  {lastResults.results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm font-mono">{r.phone}</span>
                      {r.success ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> {r.error}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsManagement;
