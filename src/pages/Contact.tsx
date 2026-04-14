import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg text-muted-foreground mb-12">
            We'd love to hear from you. Reach out with questions, booking inquiries, or just to say hello.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-serif text-2xl font-semibold mb-4">Get in Touch</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground block">Email</span>
                  <a href="mailto:hello@fellaandfetch.ca" className="hover:text-foreground transition-colors">
                    hello@fellaandfetch.ca
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-foreground block">Phone</span>
                  <a href="tel:+13065003100" className="hover:text-foreground transition-colors">
                    (306) 500-3100
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-foreground block">Location</span>
                  Regina, Saskatchewan
                </p>
              </div>
            </div>

            <div>
              {submitted ? (
                <div className="p-8 rounded-lg border border-border bg-card text-center">
                  <h3 className="font-serif text-xl font-semibold mb-2">Thank You!</h3>
                  <p className="text-sm text-muted-foreground">
                    We've received your message and will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium block mb-1">Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium block mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="text-sm font-medium block mb-1">Message</label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">Send Message</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
