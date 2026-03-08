import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const PRODUCT = [
  { label: 'Features', href: '#features' },
  { label: 'Developers', href: '#developers' },
  { label: 'Install App', href: '#install' },
  { label: 'Pricing', href: '#pricing' },
];
const COMPANY = ['About', 'Blog', 'Careers', 'Contact'];
const LEGAL = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Cookie Policy', to: '/cookies' },
];

const LandingFooter = () => (
  <footer className="relative bg-background pt-16 pb-8 px-6 border-t border-border" role="contentinfo">
    <div className="max-w-6xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 text-foreground/85 hover:opacity-80 transition-opacity">
            <img src={logo} alt="ChatBot Studio" className="h-6 w-6" />
            <span className="text-[15px] font-semibold">ChatBot Studio</span>
          </Link>
          <p className="text-[13px] text-muted-foreground/60 mt-3 leading-relaxed">
            Build intelligent AI chatbots for your business. No code required.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-4">Product</h4>
          <ul className="space-y-2.5">
            {PRODUCT.map(item => (
              <li key={item.label}>
                <a href={item.href} className="text-[13px] text-muted-foreground/70 hover:text-foreground/70 transition-colors cursor-pointer">{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-4">Company</h4>
          <ul className="space-y-2.5">
            {COMPANY.map(item => (
              <li key={item}>
                <span className="text-[13px] text-muted-foreground/70 hover:text-foreground/70 transition-colors cursor-pointer">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 mb-4">Legal</h4>
          <ul className="space-y-2.5">
            {LEGAL.map(item => (
              <li key={item.label}>
                <Link to={item.to} className="text-[13px] text-muted-foreground/70 hover:text-foreground/70 transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[11px] text-muted-foreground/40">&copy; {new Date().getFullYear()} ChatBot Studio. All rights reserved.</span>
        <span className="text-[11px] text-muted-foreground/40">Installable as a PWA</span>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
