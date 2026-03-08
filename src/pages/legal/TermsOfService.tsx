import SEO from '@/components/ui/SEO';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <SEO title="Terms of Service" description="ChatBot Studio Terms of Service — rules and guidelines for using our platform." />
    <header className="border-b border-border px-6 py-4">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="ChatBot Studio" className="h-6 w-6" />
          <span className="text-sm font-semibold text-foreground">ChatBot Studio</span>
        </Link>
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using ChatBot Studio, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, you may not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Account Registration</h2>
          <p className="text-muted-foreground leading-relaxed">
            You must provide accurate and complete information when creating an account.
            You are responsible for maintaining the security of your account credentials.
            You must be at least 18 years old to use this service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">You agree not to use ChatBot Studio to:</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Violate any applicable laws or regulations</li>
            <li>Generate or distribute harmful, misleading, or illegal content</li>
            <li>Impersonate any person or entity</li>
            <li>Interfere with the platform's operation or security</li>
            <li>Scrape, reverse engineer, or misuse the AI models</li>
            <li>Exceed rate limits or abuse platform resources</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Service Plans & Billing</h2>
          <p className="text-muted-foreground leading-relaxed">
            Free accounts have usage limits as specified in the platform. Premium features require a paid subscription.
            We reserve the right to modify pricing with 30 days' notice. Refunds are provided in accordance with applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of your chatbot configurations and FAQ content. ChatBot Studio retains ownership of the platform,
            technology, and design. You grant us a license to process your content as needed to provide the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            ChatBot Studio is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental,
            or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid
            in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may suspend or terminate your account for violations of these terms. You may delete your account at any time.
            Upon termination, your data will be retained for 30 days before permanent deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms periodically. Continued use of the platform after changes constitutes acceptance.
            We will notify users of material changes via email or in-app notification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these terms? Contact us at <span className="text-primary">legal@chatbotstudio.com</span>.
          </p>
        </section>
      </div>
    </main>
  </div>
);

export default TermsOfService;
