import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SkipToContent from "@/components/SkipToContent";
import CookieConsent from "@/components/CookieConsent";
import FloatingInstallButton from "@/components/pwa/FloatingInstallButton";
import React, { Suspense } from "react";
import PageLoader from "@/components/ui/PageLoader";

const Landing = React.lazy(() => import("./pages/landing/Landing"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Signup = React.lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/auth/ResetPassword"));
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const ChatbotBuilder = React.lazy(() => import("./pages/builder/ChatbotBuilder"));
const ChatbotDetail = React.lazy(() => import("./pages/chatbot/ChatbotDetail"));
const FAQManager = React.lazy(() => import("./pages/chatbot/FAQManager"));
const Analytics = React.lazy(() => import("./pages/chatbot/Analytics"));
const DeployPage = React.lazy(() => import("./pages/deploy/DeployPage"));
const BillingPage = React.lazy(() => import("./pages/billing/BillingPage"));
const SettingsPage = React.lazy(() => import("./pages/settings/SettingsPage"));
const WidgetPage = React.lazy(() => import("./pages/widget/WidgetPage"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const UserManager = React.lazy(() => import("./pages/admin/UserManager"));
const ChatbotManager = React.lazy(() => import("./pages/admin/ChatbotManager"));
const AdminConversations = React.lazy(() => import("./pages/admin/AdminConversations"));
const AdManager = React.lazy(() => import("./pages/admin/AdManager"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
const WaitlistManager = React.lazy(() => import("./pages/admin/WaitlistManager"));

const PrivacyPolicy = React.lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/legal/TermsOfService"));
const CookiePolicy = React.lazy(() => import("./pages/legal/CookiePolicy"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <SkipToContent />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="/builder/new" element={<ErrorBoundary><ChatbotBuilder /></ErrorBoundary>} />
                  <Route path="/builder/:id/edit" element={<ErrorBoundary><ChatbotBuilder /></ErrorBoundary>} />
                  <Route path="/chatbot/:id" element={<ErrorBoundary><ChatbotDetail /></ErrorBoundary>} />
                  <Route path="/chatbot/:id/faqs" element={<ErrorBoundary><FAQManager /></ErrorBoundary>} />
                  <Route path="/chatbot/:id/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
                  <Route path="/chatbot/:id/deploy" element={<ErrorBoundary><DeployPage /></ErrorBoundary>} />
                  <Route path="/billing" element={<ErrorBoundary><BillingPage /></ErrorBoundary>} />
                  <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                  <Route path="/widget/:embedToken" element={<ErrorBoundary><WidgetPage /></ErrorBoundary>} />
                  
                  <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                  <Route path="/admin/users" element={<ErrorBoundary><UserManager /></ErrorBoundary>} />
                  <Route path="/admin/chatbots" element={<ErrorBoundary><ChatbotManager /></ErrorBoundary>} />
                  <Route path="/admin/conversations" element={<ErrorBoundary><AdminConversations /></ErrorBoundary>} />
                  <Route path="/admin/ads" element={<ErrorBoundary><AdManager /></ErrorBoundary>} />
                  <Route path="/admin/settings" element={<ErrorBoundary><AdminSettings /></ErrorBoundary>} />
                  <Route path="/admin/waitlist" element={<ErrorBoundary><WaitlistManager /></ErrorBoundary>} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsent />
              <FloatingInstallButton />
            </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
