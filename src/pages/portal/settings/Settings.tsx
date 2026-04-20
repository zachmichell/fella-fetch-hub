import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrganizationTab from "./OrganizationTab";
import LocationsTab from "./LocationsTab";
import TeamTab from "./TeamTab";
import SubscriptionTab from "./SubscriptionTab";
import PaymentsTab from "./PaymentsTab";

const TABS = ["organization", "locations", "team", "payments", "subscription"] as const;
type TabKey = (typeof TABS)[number];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab") as TabKey | null;
  const active: TabKey = raw && TABS.includes(raw) ? raw : "organization";

  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <PortalLayout>
      <PageHeader title="Settings" description="Manage your organization" />
      <Tabs value={active} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        <TabsContent value="organization" className="mt-6">
          <OrganizationTab />
        </TabsContent>
        <TabsContent value="locations" className="mt-6">
          <LocationsTab />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <TeamTab />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="subscription" className="mt-6">
          <SubscriptionTab />
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
}
