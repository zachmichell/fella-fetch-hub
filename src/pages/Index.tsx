import { Link } from "react-router-dom";
import { Home, Scissors, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const services = [
  { icon: Home, label: "STAY", desc: "Overnight boarding", to: "/services/boarding" },
  { icon: Scissors, label: "GROOM", desc: "Professional grooming", to: "/services/grooming" },
  { icon: PawPrint, label: "TRAIN", desc: "Expert training", to: "/services/training" },
  { icon: PawPrint, label: "PLAY", desc: "Supervised daycare", to: "/services/daycare" },
];

const values = [
  { title: "Safety First", desc: "Supervised play areas and trained staff ensure your dog's wellbeing at every moment." },
  { title: "Individual Attention", desc: "Every dog receives personalized care tailored to their temperament and needs." },
  { title: "Premium Facilities", desc: "Clean, climate-controlled spaces designed for comfort and enrichment." },
  { title: "Transparent Communication", desc: "Regular updates and report cards so you always know how your pup is doing." },
];

const Index = () => (
  <Layout>
    {/* Hero */}
    <section className="relative py-24 md:py-36 text-center px-4">
      <div className="container max-w-3xl">
        <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6">
          Where Every Tail Wags With Joy
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Premium canine care in Regina, SK. Daycare, boarding, grooming, and training.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/book">BOOK A SERVICE →</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="#services">EXPLORE SERVICES</Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Service Icons */}
    <section className="py-16 border-t border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {services.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="flex flex-col items-center gap-3 p-6 rounded-lg hover:bg-accent/50 transition-colors text-center group"
            >
              <s.icon className="h-10 w-10 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              <span className="text-sm font-semibold tracking-widest">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* Our Services */}
    <section id="services" className="py-20 bg-card">
      <div className="container max-w-5xl">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12">Our Services</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: "Boarding", sub: "STAY", desc: "Comfortable overnight suites with round-the-clock supervision. Choose from standard, deluxe, and premium suite options.", to: "/services/boarding" },
            { title: "Grooming", sub: "GROOM", desc: "Full-service grooming from baths and trims to breed-specific styling. Your dog leaves looking and feeling their best.", to: "/services/grooming" },
            { title: "Training", sub: "TRAIN", desc: "Positive-reinforcement programs from puppy basics to advanced obedience, led by certified trainers.", to: "/services/training" },
            { title: "Daycare", sub: "PLAY", desc: "Supervised socialization in safe, enriching play groups. Perfect for dogs who need companionship during the day.", to: "/services/daycare" },
          ].map((s) => (
            <Link
              key={s.title}
              to={s.to}
              className="block p-8 rounded-lg border border-border bg-background hover:shadow-md transition-shadow"
            >
              <span className="text-xs font-semibold tracking-widest text-muted-foreground">{s.sub}</span>
              <h3 className="font-serif text-2xl font-semibold mt-1 mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20">
      <div className="container max-w-5xl">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12">Why Fella & Fetch</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v) => (
            <div key={v.title} className="text-center">
              <h3 className="font-serif text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Index;
