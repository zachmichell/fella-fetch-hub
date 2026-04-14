import Layout from "@/components/Layout";

const FAQ = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Our FAQ is coming soon. In the meantime, please contact us at{" "}
          <a href="mailto:hello@fellaandfetch.ca" className="underline hover:text-foreground transition-colors">
            hello@fellaandfetch.ca
          </a>{" "}
          with any questions.
        </p>
      </div>
    </section>
  </Layout>
);

export default FAQ;
