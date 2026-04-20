import { supabase } from "@/integrations/supabase/client";
import {
  reservationConfirmationEmail,
  invoiceCreatedEmail,
  reportCardEmail,
  waiverReminderEmail,
} from "./email-templates";

export type EmailType = "reservation" | "invoice" | "report_card" | "waiver" | "auth";

interface SendEmailParams {
  to: string;
  subject: string;
  html_body: string;
  from_name?: string;
  organization_id?: string;
  email_type?: EmailType;
}

export async function sendEmail(params: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke("send-email", { body: params });
  if (error) {
    console.error("sendEmail error:", error);
    return { success: false, error: error.message };
  }
  return data as { success: boolean; message_id?: string; error?: string };
}

interface OrgInfo {
  id: string;
  name: string;
}

async function loadEmailContext(organizationId: string) {
  const [{ data: settings }, { data: org }] = await Promise.all([
    supabase
      .from("email_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("organizations").select("id, name").eq("id", organizationId).maybeSingle(),
  ]);
  return { settings, org: org as OrgInfo | null };
}

// 1. Reservation confirmation
export async function sendReservationConfirmation(args: {
  organization_id: string;
  to: string;
  pet_names: string[];
  service_name: string;
  start_at: string;
  location_name: string;
  reservation_id: string;
  owner_first_name?: string;
}) {
  const { settings, org } = await loadEmailContext(args.organization_id);
  if (!org) return { success: false, error: "Org not found" };
  if (settings && settings.reservation_confirmation_enabled === false) {
    return { success: false, error: "Disabled by settings", skipped: true };
  }
  const { subject, html } = reservationConfirmationEmail({
    pet_names: args.pet_names,
    service_name: args.service_name,
    start_at: args.start_at,
    location_name: args.location_name,
    reservation_id: args.reservation_id,
    org_name: org.name,
    owner_first_name: args.owner_first_name,
  });
  return sendEmail({
    to: args.to,
    subject,
    html_body: html,
    from_name: settings?.sender_name || org.name,
    organization_id: org.id,
    email_type: "reservation",
  });
}

// 2. Invoice created
export async function sendInvoiceCreated(args: {
  organization_id: string;
  to: string;
  invoice_number: string;
  amount_display: string;
  due_date: string;
  invoice_id: string;
  pay_now_url?: string;
}) {
  const { settings, org } = await loadEmailContext(args.organization_id);
  if (!org) return { success: false, error: "Org not found" };
  if (settings && settings.invoice_created_enabled === false) {
    return { success: false, error: "Disabled by settings", skipped: true };
  }
  const { subject, html } = invoiceCreatedEmail({
    invoice_number: args.invoice_number,
    amount_display: args.amount_display,
    due_date: args.due_date,
    invoice_id: args.invoice_id,
    org_name: org.name,
    pay_now_url: args.pay_now_url,
  });
  return sendEmail({
    to: args.to,
    subject,
    html_body: html,
    from_name: settings?.sender_name || org.name,
    organization_id: org.id,
    email_type: "invoice",
  });
}

// 3. Report card published
export async function sendReportCardPublished(args: {
  organization_id: string;
  to: string;
  pet_name: string;
  rating?: string | null;
  rating_emoji?: string | null;
  mood_summary?: string | null;
  visit_notes?: string | null;
  photo_url?: string | null;
  reservation_id: string;
}) {
  const { settings, org } = await loadEmailContext(args.organization_id);
  if (!org) return { success: false, error: "Org not found" };
  if (settings && settings.report_card_published_enabled === false) {
    return { success: false, error: "Disabled by settings", skipped: true };
  }
  const { subject, html } = reportCardEmail({
    pet_name: args.pet_name,
    rating: args.rating,
    rating_emoji: args.rating_emoji,
    mood_summary: args.mood_summary,
    visit_notes: args.visit_notes,
    photo_url: args.photo_url,
    reservation_id: args.reservation_id,
    org_name: org.name,
  });
  return sendEmail({
    to: args.to,
    subject,
    html_body: html,
    from_name: settings?.sender_name || org.name,
    organization_id: org.id,
    email_type: "report_card",
  });
}

// 4. Waiver reminder
export async function sendWaiverReminder(args: {
  organization_id: string;
  to: string;
  waiver_titles: string[];
  owner_first_name?: string;
}) {
  const { settings, org } = await loadEmailContext(args.organization_id);
  if (!org) return { success: false, error: "Org not found" };
  if (settings && settings.waiver_reminder_enabled === false) {
    return { success: false, error: "Disabled by settings", skipped: true };
  }
  const { subject, html } = waiverReminderEmail({
    waiver_titles: args.waiver_titles,
    org_name: org.name,
    owner_first_name: args.owner_first_name,
  });
  return sendEmail({
    to: args.to,
    subject,
    html_body: html,
    from_name: settings?.sender_name || org.name,
    organization_id: org.id,
    email_type: "waiver",
  });
}
