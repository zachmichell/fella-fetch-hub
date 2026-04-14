import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const programs = [
  { name: "Puppy Foundations", desc: "For puppies 8–16 weeks. Socialization, basic commands, and house-training essentials." },
  { name: "Basic Obedience", desc: "Core commands — sit, stay, come, heel, and leash manners. For dogs of all ages." },
  { name: "Advanced Obedience", desc: "Off-leash reliability, distraction training, and refined commands for well-started dogs." },
  { name: "Behavioral Consultation", desc: "One-on-one sessions addressing specific behavioral concerns like reactivity, anxiety, or aggression." },
];

const Training = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">TRAIN</span>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2 mb-6">Training</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Positive-reinforcement training programs led by certified trainers. Whether you have 
          a new puppy or an adult dog needing polish, we'll help build a strong bond and reliable behavior.
        </p>

        <h2 className="font-serif text-2xl font-semibold mb-6">Programs</h2>
        <div className="grid gap-4 mb-10">
          {programs.map((p) => (
            <div key={p.name} className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-serif text-lg font-semibold mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <Button size="lg" asChild>
          <Link to="/book">BOOK TRAINING →</Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Training;
