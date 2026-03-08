import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/ui/SEO';
import ScrollProgress from './ScrollProgress';
import CustomCursor from './CustomCursor';
import LandingNavbar from './LandingNavbar';
import HeroSection from './HeroSection';
import TrustBar from './TrustBar';
import ProblemSection from './ProblemSection';
import HowItWorks from './HowItWorks';
import FeatureShowcase from './FeatureShowcase';
import DeveloperDocs from './DeveloperDocs';
import SuperchargeDemo from './SuperchargeDemo';
import StatsBand from './StatsBand';
import Testimonials from './Testimonials';
import InstallApp from './InstallApp';
import PricingSection from './PricingSection';
import FinalCTA from './FinalCTA';
import LandingFooter from './LandingFooter';
import WaitlistModal from './WaitlistModal';

const Landing = () => {
  const { user, loading } = useAuth();
  const [exitModal, setExitModal] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('waitlist_joined')) return;
    let fired = false;
    const handler = (e: MouseEvent) => {
      if (e.clientY < 5 && !fired) {
        fired = true;
        setExitModal(true);
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden">
      <SEO
        title="ChatBot Studio — Build AI Chatbots Without Code"
        description="Create intelligent AI chatbots for your business in minutes. No coding required. Train it on your FAQs, deploy anywhere, and let it handle customer questions 24/7. Free to start."
      />
      <ScrollProgress />
      <CustomCursor />
      <LandingNavbar />
      <HeroSection />
      <TrustBar />
      <ProblemSection />
      <HowItWorks />
      <FeatureShowcase />
      <DeveloperDocs />
      <SuperchargeDemo />
      <StatsBand />
      <Testimonials />
      <InstallApp />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
      <WaitlistModal open={exitModal} onClose={() => setExitModal(false)} />
    </div>
  );
};

export default Landing;
