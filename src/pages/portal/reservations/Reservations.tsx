import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReservationsList from "./ReservationsList";
import StandingReservations from "./StandingReservations";

/**
 * Combined Reservations page with All / Standing tabs.
 * Each child renders its own PortalLayout — we strip the outer one here by rendering them directly.
 * To avoid double layout, we render the children inside Tabs WITHOUT an outer PortalLayout
 * because each child page already wraps itself in PortalLayout.
 */
export default function Reservations() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "standing" ? "standing" : "all";

  const setTab = (next: string) => {
    const p = new URLSearchParams(params);
    if (next === "all") p.delete("tab");
    else p.set("tab", next);
    setParams(p, { replace: true });
  };

  // Children render their own PortalLayout, so we just switch which one mounts.
  if (tab === "standing") {
    return (
      <ReservationsTabbed activeTab="standing" onTabChange={setTab}>
        <StandingReservations />
      </ReservationsTabbed>
    );
  }
  return (
    <ReservationsTabbed activeTab="all" onTabChange={setTab}>
      <ReservationsList />
    </ReservationsTabbed>
  );
}

/**
 * The child pages already include PortalLayout. We can't easily inject tabs above their
 * PageHeader without rewriting both. Instead: render a thin tab-bar overlay using a
 * fixed position above the main content area.
 *
 * Simpler approach: render the tabs INSIDE the child pages via a portal-style sibling.
 * For now, render tabs as a slim bar that floats at the top of the page.
 */
function ReservationsTabbed({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Tab switcher bar — sits above the page content via a fixed position banner */}
      <ReservationsTabBar activeTab={activeTab} onTabChange={onTabChange} />
      {children}
    </>
  );
}

function ReservationsTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-[112px] z-30 flex justify-center">
      <div className="pointer-events-auto">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="bg-surface shadow-card">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="standing">Standing</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
