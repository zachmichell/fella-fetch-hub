import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import LocationSwitcher from "./LocationSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import PausedOverlay from "./billing/PausedOverlay";
import PastDueBanner from "./billing/PastDueBanner";
import TrialBanner from "./billing/TrialBanner";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { membership } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);
  const { data: sub } = useSubscriptionStatus();
  const location = useLocation();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!membership) return;
    supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .maybeSingle()
      .then(({ data }) => setOrgName(data?.name ?? null));
  }, [membership]);

  // Allow billing tab + auth routes when paused
  const isOnBillingTab =
    location.pathname.startsWith("/settings") && params.get("tab") === "billing";
  const isOnAuth = location.pathname.startsWith("/auth");
  const showPausedOverlay = sub?.isPaused && !isOnBillingTab && !isOnAuth;
  const showTrialBanner = sub?.isTrial && sub.trialDaysRemaining <= 7;

  return (
    <LocationProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar orgName={orgName} />
        <main className="flex-1 overflow-y-auto">
          {sub?.isPastDue && <PastDueBanner />}
          {showTrialBanner && <TrialBanner daysRemaining={sub.trialDaysRemaining} />}
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-surface px-8 py-2.5">
            <div className="text-xs text-text-tertiary truncate">
              {orgName ?? ""}
            </div>
            <LocationSwitcher />
          </div>
          {children}
        </main>
        {showPausedOverlay && <PausedOverlay />}
      </div>
    </LocationProvider>
  );
}
