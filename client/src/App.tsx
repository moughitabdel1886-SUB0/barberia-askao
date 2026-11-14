import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/i18n";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const Privacy = lazy(() => import("./pages/Privacy"));

function ScrollManager() {
  const [location] = useLocation();

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollManager />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacidad" component={Privacy} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#fffdf8",
                color: "#1b1a17",
                border: "1px solid #e7dcc7",
                borderRadius: "14px",
                fontFamily: "Manrope, sans-serif",
              },
            }}
          />
          <Suspense fallback={<div className="min-h-screen bg-paper" aria-busy="true" />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}
