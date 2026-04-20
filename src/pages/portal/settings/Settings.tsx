import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrganizationTab from "./OrganizationTab";
import LocationsTab from "./LocationsTab";
import TeamTab from "./TeamTab";
import SubscriptionTab from "./SubscriptionTab";
import PaymentsTab from "./PaymentsTab";
import BillingTab from "./BillingTab";
import EmailTab from "./EmailTab";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

const TAB_CONFIG: Array<{ key: string; label: string; permission: Permission }> = [
  { key: "organization", label: "Organization", permission: "settings.organization" },
  { key: "locations", label: "Locations", permission: "settings.locations" },
  { key: "team", label: "Team", permission: "settings.team" },
  { key: "payments", label: "Payments", permission: "settings.payments" },
  { key: "billing", label: "Billing", permission: "settings.billing" },
  { key: "email", label: "Email", permission: "settings.email" },
  { key: "subscription", label: "Subscription", permission: "settings.subscription" },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const { can } = usePermissions();

  const visible = TAB_CONFIG.filter((t) => can(t.permission));
  const visibleKeys = visible.map((t) => t.key);
  const raw = params.get("tab");
  const active = raw && visibleKeys.includes(raw) ? raw : visibleKeys[0] ?? "";

  useEffect(() => {
    if (raw && !visibleKeys.includes(raw) && visibleKeys.length > 0) {
      const next = new URLSearchParams(params);
      next.set("tab", visibleKeys[0]);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, visibleKeys.join(",")]);

  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  if (visible.length === 0) {
    return (
      <PortalLayout>
        <PageHeader title="Settings" description="Manage your organization" />
        <p className="text-sm text-muted-foreground">No settings available for your role.</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <PageHeader title="Settings" description="Manage your organization" />
      <Tabs value={active} onValueChange={setTab}>
        <TabsList>
          {visible.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {can("settings.organization") && (
          <TabsContent value="organization" className="mt-6">
            <OrganizationTab />
          </TabsContent>
        )}
        {can("settings.locations") && (
          <TabsContent value="locations" className="mt-6">
            <LocationsTab />
          </TabsContent>
        )}
        {can("settings.team") && (
          <TabsContent value="team" className="mt-6">
            <TeamTab />
          </TabsContent>
        )}
        {can("settings.payments") && (
          <TabsContent value="payments" className="mt-6">
            <PaymentsTab />
          </TabsContent>
        )}
        {can("settings.billing") && (
          <TabsContent value="billing" className="mt-6">
            <BillingTab />
          </TabsContent>
        )}
        {can("settings.email") && (
          <TabsContent value="email" className="mt-6">
            <EmailTab />
          </TabsContent>
        )}
        {can("settings.subscription") && (
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionTab />
          </TabsContent>
        )}
      </Tabs>
    </PortalLayout>
  );
}
