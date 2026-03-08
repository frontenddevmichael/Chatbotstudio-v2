import SEO from '@/components/ui/SEO';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const CookiePolicy = () => (
  <div className="min-h-screen bg-background">
    <SEO title="Cookie Policy" description="ChatBot Studio Cookie Policy — how we use cookies and similar technologies." />
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
      <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-foreground">What Are Cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help us remember
            your preferences, keep you signed in, and understand how you use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Essential Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            These cookies are required for the platform to function. They handle authentication, session management,
            and security. You cannot opt out of essential cookies.
          </p>
          <div className="mt-3 rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-foreground font-medium">Cookie</th>
                  <th className="text-left px-4 py-2 text-foreground font-medium">Purpose</th>
                  <th className="text-left px-4 py-2 text-foreground font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">sb-*-auth-token</td>
                  <td className="px-4 py-2">Authentication session</td>
                  <td className="px-4 py-2">1 year</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">cookie_consent</td>
                  <td className="px-4 py-2">Cookie preference</td>
                  <td className="px-4 py-2">1 year</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">theme</td>
                  <td className="px-4 py-2">UI theme preference</td>
                  <td className="px-4 py-2">Persistent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Functional Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            These enhance your experience by remembering your preferences, onboarding progress,
            and chatbot widget session state. They are not used for tracking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Managing Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can manage your cookie preferences through the consent banner that appears on your first visit.
            You can also clear cookies through your browser settings at any time, though this may affect functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about our cookie use? Contact us at <span className="text-primary">privacy@chatbotstudio.com</span>.
          </p>
        </section>
      </div>
    </main>
  </div>
);

export default CookiePolicy;
