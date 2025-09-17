import React from 'react';

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Third-party Libraries
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";

// Layout
import MainLayout from "./layouts/MainLayout";

// Pages - Main
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Pages - Dashboards
import ActorDashboard from "./pages/ActorDashboard";
import ProducerDashboard from "./pages/ProducerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Pages - Casting
import CastingList from "./pages/CastingList";
import CastingDetails from "./pages/casting/CastingDetails";
import CreateCastingCall from "./pages/casting/CreateCastingCall";
import EditCastingCall from "./pages/casting/EditCastingCall";

// Pages - Profiles & Submissions
import ActorProfile from "./pages/ActorProfile";
import AuditionSubmit from "./pages/AuditionSubmit";

// Pages - Messaging
import Messages from "./pages/Messages";

// Pages - Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RegisterActor from "./pages/auth/RegisterActor";
import RegisterProducer from "./pages/auth/RegisterProducer";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import LoginRequired from "./pages/LoginRequired";

// Pages - Marketing
import KnowMore from "./pages/KnowMore";
import Features from "./pages/Features";

const queryClient = new QueryClient();

const App = () => (
  React.createElement(HelmetProvider, null
    , React.createElement(ThemeProvider, { attribute: "class", defaultTheme: "system", enableSystem: true }
      , React.createElement(QueryClientProvider, { client: queryClient }
        , React.createElement(TooltipProvider, null
          , React.createElement(Toaster, null )
          , React.createElement(Sonner, null )
          , React.createElement(BrowserRouter, null
            , React.createElement(Routes, null
              , React.createElement(Route, {
                path: "/",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(Index, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/dashboard/actor",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(ActorDashboard, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/dashboard/producer",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(ProducerDashboard, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/dashboard/admin",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(AdminDashboard, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/casting",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(CastingList, null )
                  )
                })

              , React.createElement(Route, {
                path: "/casting/:id",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(CastingDetails, null )
                  )
                })

              , React.createElement(Route, {
                path: "/casting/new",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(CreateCastingCall, null )
                  )
                })

              , React.createElement(Route, {
                path: "/casting/:id/edit",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(EditCastingCall, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/actor/profile/:id",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(ActorProfile, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/audition/submit/:castingCallId",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(AuditionSubmit, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/messages",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(Messages, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/auth/login",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(Login, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/auth/register",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(Register, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/auth/register/actor",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(RegisterActor, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/auth/register/producer",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(RegisterProducer, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/forgot-password",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(ForgotPassword, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/reset-password/:token",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(ResetPassword, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/know-more",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(KnowMore, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/features",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(Features, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "/login-required",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(LoginRequired, null )
                  )
                })

              , React.createElement(Route, {
                path: "/reset-password/:token",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(ResetPassword, null )
                  )
                })
              
              , React.createElement(Route, {
                path: "*",
                element: 
                  React.createElement(MainLayout, null
                    , React.createElement(NotFound, null )
                  )
                })
            )
          )
        )
      )
    )
  )
);

export default App;
