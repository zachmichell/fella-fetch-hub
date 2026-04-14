import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const suites = [
  { name: "Standard Suite", desc: "Comfortable private room with bedding, two walks per day, and feeding service." },
  { name: "Deluxe Suite", desc: "Larger room with elevated bed, three walks per day, extra playtime, and a bedtime treat." },
  { name: "Premium Suite", desc: "Spacious suite with premium bedding, four walks, dedicated one-on-one play sessions, and a webcam for pet parents." },
];

const Boarding = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">STAY</span>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2 mb-6">Boarding</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Your dog deserves a home away from home. Our overnight boarding suites are designed for 
          comfort and security, with round-the-clock supervision and personalized care routines.
        </p>

        <h2 className="font-serif text-2xl font-semibold mb-6">Suite Options</h2>
        <div className="grid gap-4 mb-10">
          {suites.map((s) => (
            <div key={s.name} className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-serif text-lg font-semibold mb-2">{s.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <Button size="lg" asChild>
          <Link to="/book">BOOK BOARDING →</Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Boarding;
