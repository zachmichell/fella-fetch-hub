import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ConnectAccount = {
  id: string;
  organization_id: string;
  stripe_account_id: string;
  status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
} | null;

export type ConnectStatusResponse = {
  account: ConnectAccount;
  stripe?: { email: string | null; business_name: string | null; dashboard_url: string };
};

export function useStripeConnectStatus() {
  const { membership } = useAuth();
  return useQuery({
    queryKey: ["stripe-connect-status", membership?.organization_id],
    enabled: !!membership?.organization_id,
    queryFn: async (): Promise<ConnectStatusResponse> => {
      const { data, error } = await supabase.functions.invoke("stripe-connect-status", {
        body: {},
      });
      if (error) throw error;
      return data as ConnectStatusResponse;
    },
  });
}

/** Lightweight read used outside Settings (e.g. invoice "Send payment link" gating). */
export function useOrgConnectFlag() {
  const { membership } = useAuth();
  return useQuery({
    queryKey: ["stripe-connect-flag", membership?.organization_id],
    enabled: !!membership?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stripe_connect_accounts")
        .select("charges_enabled, status")
        .eq("organization_id", membership!.organization_id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStartStripeOnboarding() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "create-stripe-onboarding-link",
        { body: { base_url: window.location.origin } },
      );
      if (error) throw error;
      return data as { url: string; account_id: string };
    },
  });
}

export function useDisconnectStripe() {
  const qc = useQueryClient();
  const { membership } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!membership?.organization_id) throw new Error("No organization");
      const { error } = await supabase
        .from("stripe_connect_accounts")
        .update({ deleted_at: new Date().toISOString(), status: "disconnected" })
        .eq("organization_id", membership.organization_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stripe-connect-status"] });
      qc.invalidateQueries({ queryKey: ["stripe-connect-flag"] });
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "create-stripe-checkout-session",
        { body: { invoice_id: invoiceId, base_url: window.location.origin } },
      );
      if (error) throw error;
      return data as { checkout_session_id: string; checkout_url: string };
    },
  });
}
