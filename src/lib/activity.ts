import { supabase } from "@/integrations/supabase/client";

export type ActivityEntity =
  | "reservation"
  | "invoice"
  | "payment"
  | "pet"
  | "owner"
  | "settings"
  | "import"
  | "merge"
  | "service"
  | "checkin"
  | "checkout";

export type ActivityAction =
  | "created"
  | "updated"
  | "cancelled"
  | "deleted"
  | "checked_in"
  | "checked_out"
  | "paid"
  | "refunded"
  | "imported"
  | "merged";

export async function logActivity(params: {
  organization_id: string;
  action: ActivityAction | string;
  entity_type: ActivityEntity | string;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("activity_log").insert({
    organization_id: params.organization_id,
    actor_id: user?.id ?? null,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    metadata: (params.metadata ?? null) as any,
  });
}
