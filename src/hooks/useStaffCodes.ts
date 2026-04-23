import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type StaffCode = {
  id: string;
  organization_id: string;
  profile_id: string | null;
  display_name: string;
  pin_code: string;
  role: "owner" | "admin" | "manager" | "staff" | "groomer";
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useStaffCodes() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  return useQuery({
    enabled: !!orgId,
    queryKey: ["staff-codes", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_codes")
        .select("*")
        .eq("organization_id", orgId!)
        .order("display_name");
      if (error) throw error;
      return (data ?? []) as StaffCode[];
    },
  });
}

export function useCreateStaffCode() {
  const qc = useQueryClient();
  const { membership } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      display_name: string;
      pin_code: string;
      role: StaffCode["role"];
    }) => {
      if (!membership?.organization_id) throw new Error("No organization");
      const { data, error } = await supabase
        .from("staff_codes")
        .insert({
          organization_id: membership.organization_id,
          display_name: input.display_name,
          pin_code: input.pin_code,
          role: input.role,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-codes"] }),
  });
}

export function useUpdateStaffCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      display_name?: string;
      pin_code?: string;
      role?: StaffCode["role"];
      is_active?: boolean;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("staff_codes")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-codes"] }),
  });
}

export function useDeleteStaffCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-codes"] }),
  });
}

export function useTouchStaffCodeUsed() {
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("staff_codes")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", id);
    },
  });
}
