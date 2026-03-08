import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import React, { Suspense } from "react";
import PageSkeleton, { AuthSkeleton, BuilderSkeleton, LandingSkeleton, WidgetSkeleton } from "@/components/ui/PageSkeleton";

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
const AdManager = React.lazy(() => import("./pages/admin/AdManager"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
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
            <BrowserRouter>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<Suspense fallback={<LandingSkeleton />}><Landing /></Suspense>} />
                  <Route path="/login" element={<Suspense fallback={<AuthSkeleton />}><Login /></Suspense>} />
                  <Route path="/signup" element={<Suspense fallback={<AuthSkeleton />}><Signup /></Suspense>} />
                  <Route path="/forgot-password" element={<Suspense fallback={<AuthSkeleton />}><ForgotPassword /></Suspense>} />
                  <Route path="/reset-password" element={<Suspense fallback={<AuthSkeleton />}><ResetPassword /></Suspense>} />
                  <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="/builder/new" element={<ErrorBoundary><Suspense fallback={<BuilderSkeleton />}><ChatbotBuilder /></Suspense></ErrorBoundary>} />
                  <Route path="/builder/:id/edit" element={<ErrorBoundary><Suspense fallback={<BuilderSkeleton />}><ChatbotBuilder /></Suspense></ErrorBoundary>} />
                  <Route path="/chatbot/:id" element={<ErrorBoundary><ChatbotDetail /></ErrorBoundary>} />
                  <Route path="/chatbot/:id/faqs" element={<ErrorBoundary><FAQManager /></ErrorBoundary>} />
                  <Route path="/chatbot/:id/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
                  <Route path="/chatbot/:id/deploy" element={<ErrorBoundary><DeployPage /></ErrorBoundary>} />
                  <Route path="/billing" element={<ErrorBoundary><BillingPage /></ErrorBoundary>} />
                  <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                  <Route path="/widget/:embedToken" element={<ErrorBoundary><Suspense fallback={<WidgetSkeleton />}><WidgetPage /></Suspense></ErrorBoundary>} />
                  <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                  <Route path="/admin/users" element={<ErrorBoundary><UserManager /></ErrorBoundary>} />
                  <Route path="/admin/chatbots" element={<ErrorBoundary><ChatbotManager /></ErrorBoundary>} />
                  <Route path="/admin/ads" element={<ErrorBoundary><AdManager /></ErrorBoundary>} />
                  <Route path="/admin/settings" element={<ErrorBoundary><AdminSettings /></ErrorBoundary>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
