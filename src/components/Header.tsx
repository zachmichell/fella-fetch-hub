import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "STAY", to: "/services/boarding" },
  { label: "GROOM", to: "/services/grooming" },
  { label: "TRAIN", to: "/services/training" },
  { label: "PLAY", to: "/services/daycare" },
  { label: "SHOP", to: "/shop" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Fella & Fetch
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/portal">MY PORTAL</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/book">BOOK NOW</Link>
          </Button>
          <Link
            to="/staff"
            className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Staff
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 pb-6 pt-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium tracking-widest text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal" onClick={() => setMobileOpen(false)}>MY PORTAL</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/book" onClick={() => setMobileOpen(false)}>BOOK NOW</Link>
            </Button>
            <Link
              to="/staff"
              onClick={() => setMobileOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground text-center pt-2"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
