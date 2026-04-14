import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card mt-auto">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-serif text-lg font-semibold mb-3">Fella & Fetch Canine Care</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Premium canine care in Regina, Saskatchewan.<br />
            Daycare · Boarding · Grooming · Training
          </p>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold tracking-wider uppercase mb-3">Contact</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <a href="mailto:hello@fellaandfetch.ca" className="hover:text-foreground transition-colors">hello@fellaandfetch.ca</a><br />
            <a href="tel:+13065003100" className="hover:text-foreground transition-colors">(306) 500-3100</a><br />
            Regina, Saskatchewan
          </p>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold tracking-wider uppercase mb-3">Links</h4>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/policies" className="hover:text-foreground transition-colors">Policies</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
        © 2025 Fella & Fetch Canine Care. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
