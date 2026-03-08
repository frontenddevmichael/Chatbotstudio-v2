import { Link } from 'react-router-dom';

const PRODUCT = ['Features', 'Pricing', 'Demo', 'Changelog'];
const COMPANY = ['About', 'Blog', 'Careers', 'Contact'];
const LEGAL = ['Privacy', 'Terms', 'Cookie Policy'];

const LandingFooter = () => (
  <footer className="relative bg-[#060609] pt-16 pb-8 px-6 border-t border-[#00d4ff]/20 overflow-hidden">
    {/* Background watermark */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <span className="font-display font-bold text-[10vw] text-white/[0.04] whitespace-nowrap">
        ChatBot Studio
      </span>
    </div>

    <div className="relative max-w-7xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div>
          <Link to="/" className="font-display text-xl font-bold text-white">
            ChatBot <span className="text-[#00d4ff]">Studio</span>
          </Link>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Build intelligent AI chatbots for your business. No code required.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Product</h4>
          <ul className="space-y-2">
            {PRODUCT.map(item => (
              <li key={item}><span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">{item}</span></li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2">
            {COMPANY.map(item => (
              <li key={item}><span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">{item}</span></li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2">
            {LEGAL.map(item => (
              <li key={item}><span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">{item}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#1e1e2e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-gray-600">© 2025 ChatBot Studio. All rights reserved.</span>
        <span className="text-xs text-gray-600">Powered by AI</span>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
