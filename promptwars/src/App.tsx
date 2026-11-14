import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SkillsManager from "./pages/SkillsManager";
import CareerExplorer from "./pages/CareerExplorer";
import CareerReadiness from "./pages/CareerReadiness";
import LearningRoadmap from "./pages/LearningRoadmap";
import AssessmentPortal from "./pages/AssessmentPortal";
import AssessmentExam from "./pages/AssessmentExam";
import AssessmentResults from "./pages/AssessmentResults";
import AIMentor from "./pages/AIMentor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skills" element={<SkillsManager />} />
          <Route path="/careers" element={<CareerExplorer />} />
          <Route path="/careers/:id/readiness" element={<CareerReadiness />} />
          <Route path="/roadmap" element={<LearningRoadmap />} />
          <Route path="/assessments" element={<AssessmentPortal />} />
          <Route path="/assessments/:id/exam" element={<AssessmentExam />} />
          <Route path="/assessments/:id/results" element={<AssessmentResults />} />
          <Route path="/mentor" element={<AIMentor />} />
          {/* CATCH-ALL ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
