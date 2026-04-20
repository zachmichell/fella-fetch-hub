import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ConversationRow = {
  id: string;
  organization_id: string;
  owner_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_staff: number;
  unread_owner: number;
  owner: {
    id: string;
    first_name: string;
    last_name: string;
    pet_owners: { pets: { id: string; name: string } | null }[] | null;
  } | null;
};

/** Staff: list all conversations for the current organization */
export function useStaffConversations() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;

  const query = useQuery({
    queryKey: ["staff-conversations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `id, organization_id, owner_id, last_message_at, last_message_preview, unread_staff, unread_owner,
           owner:owners!conversations_owner_id_fkey ( id, first_name, last_name,
             pet_owners ( pets ( id, name ) ) )`,
        )
        .eq("organization_id", orgId!)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as ConversationRow[];
    },
  });

  // Realtime: refetch on any conversation change in this org
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`conversations-org-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `organization_id=eq.${orgId}` },
        () => {
          query.refetch();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return query;
}

/** Total unread for staff across all org conversations */
export function useStaffUnreadCount() {
  const { data } = useStaffConversations();
  return (data ?? []).reduce((sum, c) => sum + (c.unread_staff ?? 0), 0);
}

/** Owner: get (or wait for) their single conversation for current org. Lazy-create on first send. */
export function useOwnerConversation(ownerId?: string) {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;

  const query = useQuery({
    queryKey: ["owner-conversation", ownerId, orgId],
    enabled: !!ownerId && !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("owner_id", ownerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!orgId || !ownerId) return;
    const channel = supabase
      .channel(`conversation-owner-${ownerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `owner_id=eq.${ownerId}` },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, ownerId]);

  return query;
}
