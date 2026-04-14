import Layout from "@/components/Layout";

const Policies = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Policies</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Our policies document is coming soon. Please check back later or contact us at{" "}
          <a href="mailto:hello@fellaandfetch.ca" className="underline hover:text-foreground transition-colors">
            hello@fellaandfetch.ca
          </a>.
        </p>
      </div>
    </section>
  </Layout>
);

export default Policies;
