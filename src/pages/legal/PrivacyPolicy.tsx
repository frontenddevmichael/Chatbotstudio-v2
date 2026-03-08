import SEO from '@/components/ui/SEO';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEO title="Privacy Policy" description="ChatBot Studio Privacy Policy — how we collect, use, and protect your data." />
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
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly: your name, email address, and account credentials when you register.
            We also collect usage data such as chatbot configurations, conversation logs, and analytics metrics to improve our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>To provide, maintain, and improve ChatBot Studio services</li>
            <li>To process your account registration and manage your subscription</li>
            <li>To send service-related communications (security alerts, updates)</li>
            <li>To monitor and analyze usage patterns for product improvements</li>
            <li>To detect, prevent, and address technical issues or abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored securely using industry-standard encryption. We use row-level security policies to ensure
            users can only access their own data. Conversation data is stored for analytics purposes and can be deleted upon request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal data. We may share data with service providers who assist in operating our platform
            (e.g., cloud hosting, AI processing). These providers are bound by confidentiality agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management. We use analytics cookies to understand
            how users interact with our platform. You can manage cookie preferences through our cookie consent banner.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Access, correct, or delete your personal data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for data processing</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your account data for as long as your account is active. Conversation logs are retained for up to 12 months.
            You may request deletion of your data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related inquiries, please contact us at <span className="text-primary">privacy@chatbotstudio.com</span>.
          </p>
        </section>
      </div>
    </main>
  </div>
);

export default PrivacyPolicy;
