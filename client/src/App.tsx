import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { NavBar } from "./components/layout/nav-bar";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import StudentAssessment from "@/pages/student/assessment";
import InstructorDashboard from "@/pages/instructor/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute 
        path="/student/assessment" 
        component={StudentAssessment}
        roles={["student"]}
      />
      <ProtectedRoute 
        path="/instructor/dashboard" 
        component={InstructorDashboard}
        roles={["instructor"]}
      />
      <ProtectedRoute 
        path="/admin/dashboard" 
        component={AdminDashboard}
        roles={["admin"]}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavBar />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;