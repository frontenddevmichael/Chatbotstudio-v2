import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'backdrop-blur-xl bg-[#080810]/80 border-b border-[#1e1e2e]' : 'bg-transparent'
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          ChatBot <span className="text-[#00d4ff]">Studio</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('features')} className="text-sm text-gray-400 hover:text-white transition-colors relative group">
            Features
            <span className="absolute bottom-0 left-0 w-full h-px bg-[#00d4ff] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>
          <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-400 hover:text-white transition-colors relative group">
            Pricing
            <span className="absolute bottom-0 left-0 w-full h-px bg-[#00d4ff] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </button>
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link>
          <Link to="/signup">
            <Button className="bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 font-semibold text-sm h-9 px-5">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#080810]/95 backdrop-blur-xl border-b border-[#1e1e2e] overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              <button onClick={() => scrollTo('features')} className="text-left text-gray-300">Features</button>
              <button onClick={() => scrollTo('pricing')} className="text-left text-gray-300">Pricing</button>
              <Link to="/login" className="text-gray-300" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                <Button className="w-full bg-[#00d4ff] text-[#080810] hover:bg-[#00d4ff]/90 font-semibold">Get Started Free</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default LandingNavbar;
