import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const packages = [
  { name: "Bath & Brush", desc: "Shampoo, blow-dry, brushing, ear cleaning, and nail trim." },
  { name: "Full Groom", desc: "Everything in Bath & Brush plus a breed-specific haircut and styling." },
  { name: "Spa Package", desc: "Full Groom with teeth brushing, paw balm, cologne, and a bandana." },
  { name: "Puppy First Groom", desc: "A gentle introduction to grooming for puppies, with lots of treats and patience." },
];

const Grooming = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">GROOM</span>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2 mb-6">Grooming</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Professional grooming services that keep your dog looking and feeling their best. 
          Our experienced groomers handle every breed with care, using premium products and 
          gentle techniques.
        </p>

        <h2 className="font-serif text-2xl font-semibold mb-6">Packages</h2>
        <div className="grid gap-4 mb-10">
          {packages.map((p) => (
            <div key={p.name} className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-serif text-lg font-semibold mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <Button size="lg" asChild>
          <Link to="/book">BOOK GROOMING →</Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Grooming;
