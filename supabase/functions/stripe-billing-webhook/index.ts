// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-11-20.acacia",
});
const webhookSecret = Deno.env.get("STRIPE_SIGNING_SECRET_BILLING")!;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (e: any) {
    console.error("Signature verification failed", e.message);
    return new Response("Invalid signature", { status: 401 });
  }

  // Dedupe
  const { data: existing } = await admin
    .from("stripe_processed_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) return ok(event.id, false);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log("Unhandled billing event", event.type);
    }

    await admin.from("stripe_processed_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
    });

    return ok(event.id, true);
  } catch (e: any) {
    console.error("Billing webhook handler error", event.type, e);
    return ok(event.id, false);
  }
});

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const orgId = sub.metadata?.organization_id;
  if (!orgId) {
    // Try to resolve via existing customer
    const { data: existing } = await admin
      .from("subscriptions")
      .select("organization_id")
      .eq("stripe_customer_id", sub.customer as string)
      .maybeSingle();
    if (!existing) return;
  }
  const resolvedOrgId =
    orgId ??
    (
      await admin
        .from("subscriptions")
        .select("organization_id")
        .eq("stripe_customer_id", sub.customer as string)
        .maybeSingle()
    ).data?.organization_id;
  if (!resolvedOrgId) return;

  const status = mapStatus(sub.status);
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  await admin
    .from("subscriptions")
    .upsert(
      {
        organization_id: resolvedOrgId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    );

  // Sync org status
  if (status === "active" || status === "trialing") {
    await admin.from("organizations").update({ status: "active" }).eq("id", resolvedOrgId);
  } else if (status === "past_due") {
    await admin.from("organizations").update({ status: "past_due" }).eq("id", resolvedOrgId);
  }

  // Sync subscription_modules from Stripe items metadata
  const items = sub.items?.data ?? [];
  for (const item of items) {
    const md = (item.price.product as any)?.metadata ?? item.price.metadata ?? {};
    const mod = md.module;
    const locationId = md.location_id || null;
    if (!mod) continue;
    await admin
      .from("subscription_modules")
      .upsert(
        {
          organization_id: resolvedOrgId,
          location_id: locationId,
          module: mod,
          enabled: true,
          price_cents: item.price.unit_amount ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,location_id,module" },
      );
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const { data: row } = await admin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (!row?.organization_id) return;

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id);
  await admin.from("organizations").update({ status: "paused" }).eq("id", row.organization_id);
}

async function handleInvoicePaid(inv: Stripe.Invoice) {
  if (!inv.customer) return;
  await admin
    .from("subscriptions")
    .update({
      status: "active",
      last_payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", inv.customer as string);

  const { data: row } = await admin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", inv.customer as string)
    .maybeSingle();
  if (row?.organization_id) {
    await admin.from("organizations").update({ status: "active" }).eq("id", row.organization_id);
  }
}

async function handleInvoiceFailed(inv: Stripe.Invoice) {
  if (!inv.customer) return;
  await admin
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", inv.customer as string);

  const { data: row } = await admin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", inv.customer as string)
    .maybeSingle();
  if (row?.organization_id) {
    await admin.from("organizations").update({ status: "past_due" }).eq("id", row.organization_id);
  }
}

function mapStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "paused":
      return "paused";
    default:
      return "trialing";
  }
}

function ok(eventId: string, processed: boolean) {
  return new Response(
    JSON.stringify({ received: true, event_id: eventId, processed }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
