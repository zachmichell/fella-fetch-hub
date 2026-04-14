import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  "Supervised play groups organized by size and temperament",
  "Indoor and outdoor play areas",
  "Fresh water and rest periods throughout the day",
  "Daily report cards with updates (launching soon)",
  "Webcam access for pet parents",
  "Full-day and half-day options",
];

const Daycare = () => (
  <Layout>
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">PLAY</span>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mt-2 mb-6">Daycare</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Give your dog a day full of fun, socialization, and enrichment. Our supervised daycare 
          provides safe play groups tailored to your dog's size and personality, ensuring every 
          pup has a tail-wagging good time.
        </p>

        <h2 className="font-serif text-2xl font-semibold mb-4">What's Included</h2>
        <ul className="space-y-3 mb-10">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Button size="lg" asChild>
          <Link to="/book">BOOK DAYCARE →</Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default Daycare;
