import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { capturePageView } from "@/lib/posthog";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SkipToContent from "@/components/SkipToContent";
import CookieConsent from "@/components/CookieConsent";
import FloatingInstallButton from "@/components/pwa/FloatingInstallButton";
import React, { Suspense, useEffect } from "react";
import { MotionConfig } from "framer-motion";


const Landing = React.lazy(() => import("./pages/landing/Landing"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Signup = React.lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/auth/ResetPassword"));
const AuthCallback = React.lazy(() => import("./pages/auth/AuthCallback"));
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const AdminUsersPage = React.lazy(() => import("./pages/dashboard/AdminUsersPage"));
const ChatbotBuilder = React.lazy(() => import("./pages/builder/ChatbotBuilder"));
const ChatbotDetail = React.lazy(() => import("./pages/chatbot/ChatbotDetail"));
const FAQManager = React.lazy(() => import("./pages/chatbot/FAQManager"));
const Analytics = React.lazy(() => import("./pages/chatbot/Analytics"));
const LighthousePage = React.lazy(() => import("./pages/dashboard/LighthousePage"));
const DeployPage = React.lazy(() => import("./pages/deploy/DeployPage"));
const BillingPage = React.lazy(() => import("./pages/billing/BillingPage"));
const SettingsPage = React.lazy(() => import("./pages/settings/SettingsPage"));
const WidgetPage = React.lazy(() => import("./pages/widget/WidgetPage"));
const ApiKeysPage = React.lazy(() => import("./pages/dashboard/ApiKeysPage"));
const IntegrationsPage = React.lazy(() => import("./pages/dashboard/IntegrationsPage"));
const ModelSettingsPage = React.lazy(() => import("./pages/dashboard/ModelSettingsPage"));
const ABTestingPage = React.lazy(() => import("./pages/dashboard/ABTestingPage"));
const OrchestrationPage = React.lazy(() => import("./pages/dashboard/OrchestrationPage"));
const IntelligenceStudioPage = React.lazy(() => import("./pages/dashboard/IntelligenceStudioPage"));
const FollowUpEmailsPage = React.lazy(() => import("./pages/dashboard/FollowUpEmailsPage"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const UserManager = React.lazy(() => import("./pages/admin/UserManager"));
const ChatbotManager = React.lazy(() => import("./pages/admin/ChatbotManager"));
const AdminConversations = React.lazy(() => import("./pages/admin/AdminConversations"));
const AdManager = React.lazy(() => import("./pages/admin/AdManager"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
const WaitlistManager = React.lazy(() => import("./pages/admin/WaitlistManager"));
const AgencyPage = React.lazy(() => import("./pages/dashboard/AgencyPage"));
const AdminAgenciesPage = React.lazy(() => import("./pages/dashboard/AdminAgenciesPage"));

const PrivacyPolicy = React.lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/legal/TermsOfService"));
const CookiePolicy = React.lazy(() => import("./pages/legal/CookiePolicy"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ServerError = React.lazy(() => import("./pages/ServerError"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PostHogPageView = () => {
  const location = useLocation();
  useEffect(() => { capturePageView(); }, [location.pathname]);
  return null;
};

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
              <PostHogPageView />
              <MotionConfig reducedMotion="user">
                <Suspense fallback={null}>
                  <Routes>
                    <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
                    <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                    <Route path="/signup" element={<ErrorBoundary><Signup /></ErrorBoundary>} />
                    <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
                    <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
                    <Route path="/auth/callback" element={<ErrorBoundary><AuthCallback /></ErrorBoundary>} />
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    <Route path="/dashboard/admin/users" element={<ErrorBoundary><AdminUsersPage /></ErrorBoundary>} />
                    <Route path="/builder/new" element={<ErrorBoundary><ChatbotBuilder /></ErrorBoundary>} />
                    <Route path="/builder/:id/edit" element={<ErrorBoundary><ChatbotBuilder /></ErrorBoundary>} />
                    <Route path="/chatbot/:id" element={<ErrorBoundary><ChatbotDetail /></ErrorBoundary>} />
                    <Route path="/chatbot/:id/faqs" element={<ErrorBoundary><FAQManager /></ErrorBoundary>} />
                    <Route path="/chatbot/:id/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
                    <Route path="/dashboard/lighthouse/:chatbotId" element={<ErrorBoundary><LighthousePage /></ErrorBoundary>} />
                    <Route path="/dashboard/integrations/:chatbotId" element={<ErrorBoundary><IntegrationsPage /></ErrorBoundary>} />
                    <Route path="/chatbot/:id/deploy" element={<ErrorBoundary><DeployPage /></ErrorBoundary>} />
                    <Route path="/billing" element={<ErrorBoundary><BillingPage /></ErrorBoundary>} />
                    <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                    <Route path="/dashboard/api-keys" element={<ErrorBoundary><ApiKeysPage /></ErrorBoundary>} />
                    <Route path="/dashboard/model-settings/:chatbotId" element={<ErrorBoundary><ModelSettingsPage /></ErrorBoundary>} />
                    <Route path="/dashboard/ab-testing/:chatbotId" element={<ErrorBoundary><ABTestingPage /></ErrorBoundary>} />
                    <Route path="/dashboard/orchestration/:chatbotId" element={<ErrorBoundary><OrchestrationPage /></ErrorBoundary>} />
                    <Route path="/dashboard/intelligence-studio/:chatbotId" element={<ErrorBoundary><IntelligenceStudioPage /></ErrorBoundary>} />
                    <Route path="/dashboard/follow-up-emails/:chatbotId" element={<ErrorBoundary><FollowUpEmailsPage /></ErrorBoundary>} />
                    <Route path="/dashboard/agency" element={<ErrorBoundary><AgencyPage /></ErrorBoundary>} />
                    <Route path="/dashboard/admin/agencies" element={<ErrorBoundary><AdminAgenciesPage /></ErrorBoundary>} />
                    <Route path="/widget/:embedToken" element={<ErrorBoundary><WidgetPage /></ErrorBoundary>} />
                    
                    <Route path="/admin" element={<ErrorBoundary><ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/admin/users" element={<ErrorBoundary><ProtectedRoute adminOnly><UserManager /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/admin/chatbots" element={<ErrorBoundary><ProtectedRoute adminOnly><ChatbotManager /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/admin/conversations" element={<ErrorBoundary><ProtectedRoute adminOnly><AdminConversations /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/admin/ads" element={<ErrorBoundary><ProtectedRoute adminOnly><AdManager /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/admin/settings" element={<ErrorBoundary><ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/admin/waitlist" element={<ErrorBoundary><ProtectedRoute adminOnly><WaitlistManager /></ProtectedRoute></ErrorBoundary>} />
                    <Route path="/privacy" element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
                    <Route path="/terms" element={<ErrorBoundary><TermsOfService /></ErrorBoundary>} />
                    <Route path="/cookies" element={<ErrorBoundary><CookiePolicy /></ErrorBoundary>} />
                    <Route path="/500" element={<ServerError />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </MotionConfig>
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
