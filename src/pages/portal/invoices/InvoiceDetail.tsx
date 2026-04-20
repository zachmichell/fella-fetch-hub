import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, CheckCircle2, Ban, Link2 } from "lucide-react";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import InvoiceStatusBadge from "@/components/portal/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatCentsShort, formatDateTime } from "@/lib/money";
import { effectiveInvoiceStatus } from "@/lib/invoice";
import { useCreateCheckoutSession, useOrgConnectFlag } from "@/hooks/useStripeConnect";

export default function InvoiceDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `id, invoice_number, status, issued_at, due_at, paid_at, currency, notes,
           subtotal_cents, tax_cents, total_cents, reservation_id, organization_id,
           owners:owner_id(id, first_name, last_name, email, phone),
           reservations:reservation_id(
             id, start_at, end_at,
             services(name),
             locations(name, street_address, city, state_province, postal_code),
             reservation_pets(pets(id, name))
           ),
           invoice_lines(id, description, quantity, unit_price_cents, line_total_cents)`,
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: org } = useQuery({
    queryKey: ["invoice-org", inv?.organization_id],
    enabled: !!inv?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("name, timezone")
        .eq("id", inv!.organization_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (inv && !notesDirty) setNotes(inv.notes ?? "");
  }, [inv, notesDirty]);

  const statusMut = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await supabase.from("invoices").update(patch as any).eq("id", id!);
      if (error) throw error;
      // Activity log
      if (inv) {
        await supabase.from("activity_log").insert({
          organization_id: inv.organization_id,
          entity_type: "invoice",
          entity_id: inv.id,
          action: `status_${patch.status}`,
          metadata: patch as any,
        });
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(`Invoice ${vars.status}`);
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices-list"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const saveNotes = async () => {
    const { error } = await supabase.from("invoices").update({ notes }).eq("id", id!);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    setNotesDirty(false);
    qc.invalidateQueries({ queryKey: ["invoice", id] });
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="p-8 text-sm text-text-secondary">Loading…</div>
      </PortalLayout>
    );
  }
  if (!inv) {
    return (
      <PortalLayout>
        <div className="p-8 text-sm text-text-secondary">Invoice not found.</div>
      </PortalLayout>
    );
  }

  const eff = effectiveInvoiceStatus(inv.status, inv.due_at);
  const tz = org?.timezone || undefined;
  const lines = (inv as any).invoice_lines ?? [];
  const reservation: any = (inv as any).reservations;
  const owner: any = (inv as any).owners;
  const location: any = reservation?.locations;
  const pets: any[] = (reservation?.reservation_pets ?? []).map((rp: any) => rp.pets).filter(Boolean);

  const connect = useOrgConnectFlag();
  const checkout = useCreateCheckoutSession();
  const canSendPaymentLink =
    (inv.status === "sent" || eff === "overdue" || inv.status === "partial") &&
    !!connect.data?.charges_enabled;

  const sendPaymentLink = async () => {
    try {
      const res = await checkout.mutateAsync(inv.id);
      try {
        await navigator.clipboard.writeText(res.checkout_url);
        toast.success("Payment link copied to clipboard");
      } catch {
        toast.success("Payment link created", { description: res.checkout_url });
      }
      qc.invalidateQueries({ queryKey: ["invoice", id] });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create payment link");
    }
  };

  const renderActions = () => {
    const canSend = inv.status === "draft";
    const canMarkPaid = inv.status === "sent" || eff === "overdue" || inv.status === "partial";
    const canVoid = inv.status === "draft" || inv.status === "sent" || eff === "overdue";
    return (
      <>
        {canSend && (
          <Button onClick={() => statusMut.mutate({ status: "sent" })}>
            <Send className="h-4 w-4" /> Send
          </Button>
        )}
        {canSendPaymentLink && (
          <Button
            variant="outline"
            onClick={sendPaymentLink}
            disabled={checkout.isPending}
          >
            <Link2 className="h-4 w-4" />
            {checkout.isPending ? "Generating…" : "Send payment link"}
          </Button>
        )}
        {canMarkPaid && (
          <Button
            onClick={() =>
              statusMut.mutate({
                status: "paid",
                paid_at: new Date().toISOString(),
                amount_paid_cents: inv.total_cents,
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Paid
          </Button>
        )}
        {canVoid && (
          <Button variant="outline" onClick={() => statusMut.mutate({ status: "void" })}>
            <Ban className="h-4 w-4" /> Void
          </Button>
        )}
      </>
    );
  };

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <PageHeader
          title={`Invoice ${inv.invoice_number ?? inv.id.slice(0, 8)}`}
          description={
            <div className="mt-2 flex items-center gap-2">
              <InvoiceStatusBadge status={eff} size="lg" />
              {inv.status === "paid" && inv.paid_at && (
                <span className="text-sm text-text-secondary">Paid on {formatDateTime(inv.paid_at, tz)}</span>
              )}
              {inv.status === "void" && <span className="text-sm text-text-secondary">Voided</span>}
            </div>
          }
          actions={renderActions()}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: main invoice body */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="label-eyebrow mb-2">From</div>
                  <div className="text-sm font-medium text-foreground">{org?.name ?? "—"}</div>
                  {location && (
                    <div className="mt-1 text-sm text-text-secondary">
                      {location.street_address && <div>{location.street_address}</div>}
                      <div>
                        {[location.city, location.state_province, location.postal_code].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="label-eyebrow mb-2">To</div>
                  {owner ? (
                    <>
                      <div className="text-sm font-medium text-foreground">
                        {owner.first_name} {owner.last_name}
                      </div>
                      {owner.email && <div className="text-sm text-text-secondary">{owner.email}</div>}
                      {owner.phone && <div className="text-sm text-text-secondary">{owner.phone}</div>}
                    </>
                  ) : (
                    <div className="text-sm text-text-tertiary">—</div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-left">
                    <th className="px-[18px] py-[12px] label-eyebrow">Description</th>
                    <th className="px-[18px] py-[12px] label-eyebrow text-right">Qty</th>
                    <th className="px-[18px] py-[12px] label-eyebrow text-right">Unit Price</th>
                    <th className="px-[18px] py-[12px] label-eyebrow text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l: any) => (
                    <tr key={l.id} className="border-t border-border-subtle">
                      <td className="px-[18px] py-[12px] text-foreground">{l.description}</td>
                      <td className="px-[18px] py-[12px] text-right text-text-secondary">{l.quantity}</td>
                      <td className="px-[18px] py-[12px] text-right text-text-secondary">
                        {formatCentsShort(l.unit_price_cents)}
                      </td>
                      <td className="px-[18px] py-[12px] text-right text-foreground">
                        {formatCentsShort(l.line_total_cents)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border-subtle bg-card-alt/40">
                    <td colSpan={3} className="px-[18px] py-[10px] text-right text-text-secondary">
                      Subtotal
                    </td>
                    <td className="px-[18px] py-[10px] text-right text-foreground">
                      {formatCentsShort(inv.subtotal_cents)}
                    </td>
                  </tr>
                  <tr className="bg-card-alt/40">
                    <td colSpan={3} className="px-[18px] py-[10px] text-right text-text-secondary">
                      Tax
                    </td>
                    <td className="px-[18px] py-[10px] text-right text-foreground">
                      {formatCentsShort(inv.tax_cents ?? 0)}
                    </td>
                  </tr>
                  <tr className="border-t border-border bg-card-alt/60">
                    <td colSpan={3} className="px-[18px] py-[14px] text-right font-display text-base font-semibold">
                      Total
                    </td>
                    <td className="px-[18px] py-[14px] text-right font-display text-base font-semibold text-foreground">
                      {formatCentsShort(inv.total_cents)} {inv.currency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
              <div className="label-eyebrow mb-2">Notes</div>
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesDirty(true);
                }}
                placeholder="Add a note for this invoice…"
              />
              {notesDirty && (
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotes(inv.notes ?? "");
                      setNotesDirty(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveNotes}>
                    Save notes
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: meta */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-text-tertiary">Invoice date</dt>
                  <dd className="text-foreground">{formatDateTime(inv.issued_at, tz)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-tertiary">Due date</dt>
                  <dd className="text-foreground">{formatDateTime(inv.due_at, tz)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-tertiary">Payment terms</dt>
                  <dd className="text-foreground">Net 14</dd>
                </div>
                {reservation && (
                  <div>
                    <dt className="text-xs text-text-tertiary">Reservation</dt>
                    <dd>
                      <Link
                        to={`/reservations/${reservation.id}`}
                        className="text-foreground hover:text-primary"
                      >
                        {reservation.services?.name ?? "View reservation"} · {formatDateTime(reservation.start_at, tz)}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {pets.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
                <div className="label-eyebrow mb-3">Pets</div>
                <ul className="space-y-2 text-sm">
                  {pets.map((p) => (
                    <li key={p.id}>
                      <Link to={`/pets/${p.id}`} className="text-foreground hover:text-primary">
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
