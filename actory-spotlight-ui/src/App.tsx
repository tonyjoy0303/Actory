import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import MainLayout from "./layouts/MainLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ActorDashboard from "./pages/ActorDashboard";
import ProducerDashboard from "./pages/ProducerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CastingList from "./pages/CastingList";
import ActorProfile from "./pages/ActorProfile";
import AuditionSubmit from "./pages/AuditionSubmit";
import Messages from "./pages/Messages";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Index />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/actor"
                element={
                  <MainLayout>
                    <ActorDashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/producer"
                element={
                  <MainLayout>
                    <ProducerDashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/casting"
                element={
                  <MainLayout>
                    <CastingList />
                  </MainLayout>
                }
              />
              <Route
                path="/actor/profile/:id"
                element={
                  <MainLayout>
                    <ActorProfile />
                  </MainLayout>
                }
              />
              <Route
                path="/audition/submit/:castingCallId"
                element={
                  <MainLayout>
                    <AuditionSubmit />
                  </MainLayout>
                }
              />
              <Route
                path="/messages"
                element={
                  <MainLayout>
                    <Messages />
                  </MainLayout>
                }
              />
              <Route
                path="/auth/login"
                element={
                  <MainLayout>
                    <Login />
                  </MainLayout>
                }
              />
              <Route
                path="/auth/register"
                element={
                  <MainLayout>
                    <Register />
                  </MainLayout>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
