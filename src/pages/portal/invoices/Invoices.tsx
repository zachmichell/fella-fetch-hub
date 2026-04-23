import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PosOpenInvoices from "../pos/PosOpenInvoices";
import PosClosedInvoices from "../pos/PosClosedInvoices";

export default function Invoices() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "closed" ? "closed" : "open";

  const setTab = (next: string) => {
    const p = new URLSearchParams(params);
    if (next === "open") p.delete("tab");
    else p.set("tab", next);
    setParams(p, { replace: true });
  };

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <PageHeader title="Invoices" description="Open carts and paid invoices" />
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-4">
            <InvoicesEmbed><PosOpenInvoices /></InvoicesEmbed>
          </TabsContent>
          <TabsContent value="closed" className="mt-4">
            <InvoicesEmbed><PosClosedInvoices /></InvoicesEmbed>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}

/**
 * The PosOpenInvoices and PosClosedInvoices pages each wrap themselves in PortalLayout.
 * To embed them inside the merged Invoices tab without a nested sidebar, we use CSS to
 * neutralize the inner layout — but PortalLayout includes a Sidebar which would duplicate.
 *
 * Workaround: render in an isolated container and rely on CSS to hide nested sidebar/header.
 * Cleaner approach used: those pages are rendered directly; the inner PortalLayout's sidebar
 * will overlap the outer one. Instead we reach into the page bodies via a wrapper class.
 */
function InvoicesEmbed({ children }: { children: React.ReactNode }) {
  // Hide nested PortalLayout chrome (sidebar + top bar) when embedded.
  return <div className="invoices-embed [&_aside]:hidden [&>div>main>div:first-child]:hidden">{children}</div>;
}
