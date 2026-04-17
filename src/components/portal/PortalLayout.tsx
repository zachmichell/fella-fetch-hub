import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { membership } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    if (!membership) return;
    supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .maybeSingle()
      .then(({ data }) => setOrgName(data?.name ?? null));
  }, [membership]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar orgName={orgName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
