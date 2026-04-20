// Stripe Connect webhook — verifies signature, dedupes, marks invoice paid,
// records a payment row. Always returns 200 once signature passes so Stripe
// stops retrying for non-fatal handler errors.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_SIGNING_SECRET_CONNECT = Deno.env.get("STRIPE_SIGNING_SECRET_CONNECT")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 401 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      STRIPE_SIGNING_SECRET_CONNECT,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response("Invalid signature", { status: 401 });
  }

  // Dedupe
  const { data: alreadyProcessed } = await admin
    .from("stripe_processed_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (alreadyProcessed) {
    return ok({ received: true, event_id: event.id, processed: false, reason: "duplicate" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, event.account ?? null);
        break;
      }
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(intent);
        break;
      }
      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Handler error for ${event.type}:`, err);
    // Still record + return 200 so Stripe stops retrying
  }

  await admin.from("stripe_processed_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });

  return ok({ received: true, event_id: event.id, processed: true });
});

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  connectedAccountId: string | null,
) {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) {
    console.warn("checkout.session.completed without invoice_id in metadata");
    return;
  }
  const amountPaid = session.amount_total ?? 0;
  if (amountPaid <= 0) return;

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, total_cents, amount_paid_cents, organization_id, currency")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) {
    console.warn(`Invoice ${invoiceId} not found`);
    return;
  }

  const newAmountPaid = (invoice.amount_paid_cents ?? 0) + amountPaid;
  const fullyPaid = newAmountPaid >= (invoice.total_cents ?? 0);
  const balance = Math.max(0, (invoice.total_cents ?? 0) - newAmountPaid);

  await admin.from("invoices").update({
    status: fullyPaid ? "paid" : "partial",
    amount_paid_cents: newAmountPaid,
    balance_due_cents: balance,
    paid_at: fullyPaid ? new Date().toISOString() : null,
  }).eq("id", invoice.id);

  // Insert a payment row (idempotent guard on stripe_payment_intent_id)
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  if (paymentIntentId) {
    const { data: existing } = await admin
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();
    if (existing) return;
  }

  await admin.from("payments").insert({
    invoice_id: invoice.id,
    organization_id: invoice.organization_id,
    amount_cents: amountPaid,
    currency: invoice.currency,
    method: "card",
    status: "succeeded",
    stripe_payment_intent_id: paymentIntentId,
    processed_at: new Date().toISOString(),
  });

  console.log(
    `Invoice ${invoice.id} updated; +${amountPaid} (acct ${connectedAccountId ?? "?"})`,
  );
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const invoiceId = intent.metadata?.invoice_id;
  if (!invoiceId) return;

  // If a payments row already exists for this PI, nothing to do (checkout handler ran first)
  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", intent.id)
    .maybeSingle();
  if (existing) return;

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, total_cents, amount_paid_cents, organization_id, currency")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return;

  const newAmountPaid = (invoice.amount_paid_cents ?? 0) + intent.amount_received;
  const fullyPaid = newAmountPaid >= (invoice.total_cents ?? 0);
  const balance = Math.max(0, (invoice.total_cents ?? 0) - newAmountPaid);

  await admin.from("invoices").update({
    status: fullyPaid ? "paid" : "partial",
    amount_paid_cents: newAmountPaid,
    balance_due_cents: balance,
    paid_at: fullyPaid ? new Date().toISOString() : null,
  }).eq("id", invoice.id);

  await admin.from("payments").insert({
    invoice_id: invoice.id,
    organization_id: invoice.organization_id,
    amount_cents: intent.amount_received,
    currency: invoice.currency,
    method: "card",
    status: "succeeded",
    stripe_payment_intent_id: intent.id,
    processed_at: new Date().toISOString(),
  });
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
