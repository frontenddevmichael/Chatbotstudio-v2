import { Link } from 'react-router-dom';

const PRODUCT = ['Features', 'Pricing', 'Demo', 'Changelog'];
const COMPANY = ['About', 'Blog', 'Careers', 'Contact'];
const LEGAL = ['Privacy', 'Terms', 'Cookie Policy'];

const LandingFooter = () => (
  <footer className="relative bg-black pt-16 pb-8 px-6 border-t border-white/[0.06]">
    <div className="max-w-6xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div>
          <Link to="/" className="text-[15px] font-semibold text-white/85">
            ChatBot Studio
          </Link>
          <p className="text-[13px] text-white/30 mt-3 leading-relaxed">
            Build intelligent AI chatbots for your business. No code required.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25 mb-4">Product</h4>
          <ul className="space-y-2.5">
            {PRODUCT.map(item => (
              <li key={item}>
                <span className="text-[13px] text-white/35 hover:text-white/70 transition-colors cursor-pointer">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25 mb-4">Company</h4>
          <ul className="space-y-2.5">
            {COMPANY.map(item => (
              <li key={item}>
                <span className="text-[13px] text-white/35 hover:text-white/70 transition-colors cursor-pointer">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25 mb-4">Legal</h4>
          <ul className="space-y-2.5">
            {LEGAL.map(item => (
              <li key={item}>
                <span className="text-[13px] text-white/35 hover:text-white/70 transition-colors cursor-pointer">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[11px] text-white/20">&copy; {new Date().getFullYear()} ChatBot Studio. All rights reserved.</span>
        <span className="text-[11px] text-white/20">Installable as a PWA</span>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
