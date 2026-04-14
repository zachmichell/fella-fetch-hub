import Layout from "@/components/Layout";

const Terms = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-sm text-muted-foreground max-w-none space-y-4">
          <p>
            By using the Fella & Fetch Canine Care website and booking platform, you agree to 
            the following terms and conditions.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Services</h2>
          <p>
            Our platform enables you to book daycare, boarding, grooming, and training services 
            for your dog(s). All bookings are subject to availability and confirmation by our team.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account credentials. 
            You must provide accurate information when creating your account and booking services.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Cancellations</h2>
          <p>
            We request at least 24 hours' notice for cancellations. Late cancellations or 
            no-shows may be subject to a fee. Specific cancellation policies apply to each service.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Liability</h2>
          <p>
            While we take every precaution to ensure the safety of pets in our care, Fella & Fetch 
            Canine Care is not liable for incidents arising from pre-existing health conditions 
            or undisclosed behavioral issues.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Contact</h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a href="mailto:hello@fellaandfetch.ca" className="underline hover:text-foreground">
              hello@fellaandfetch.ca
            </a>.
          </p>
        </div>
      </div>
    </section>
  </Layout>
);

export default Terms;
