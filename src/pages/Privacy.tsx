import Layout from "@/components/Layout";

const Privacy = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-sm text-muted-foreground max-w-none space-y-4">
          <p>
            Fella & Fetch Canine Care ("we," "our," "us") is committed to protecting your privacy. 
            This policy outlines how we collect, use, and safeguard your personal information.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Information We Collect</h2>
          <p>
            We collect information you provide when creating an account, booking services, or 
            contacting us — including your name, email address, phone number, and pet details.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">How We Use Your Information</h2>
          <p>
            Your data is used solely to provide and improve our booking and care services, 
            communicate with you about appointments, and ensure the safety of pets in our care.
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Data Sharing</h2>
          <p>
            We do not sell or share your personal information with third parties, except as 
            required by law or to provide our services (e.g., payment processing).
          </p>
          <h2 className="font-serif text-xl font-semibold text-foreground">Contact</h2>
          <p>
            For privacy-related requests, contact us at{" "}
            <a href="mailto:hello@fellaandfetch.ca" className="underline hover:text-foreground">
              hello@fellaandfetch.ca
            </a>.
          </p>
        </div>
      </div>
    </section>
  </Layout>
);

export default Privacy;
