import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCareerRoles, useSetTargetCareer } from "@/hooks/useCareers";
import { 
  Compass, 
  CheckCircle2, 
  ArrowRight, 
  Briefcase, 
  Sparkles, 
  Layers, 
  Clock,
  Target
} from "lucide-react";

const CareerExplorer = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  const { data: careers = [], isLoading } = useCareerRoles();
  const setTargetCareerMutation = useSetTargetCareer();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);
      const p = await getProfile(currentUser.id);
      setProfile(p);
    };
    checkAuth();
  }, [navigate]);

  const handleSelectCareer = async (careerId: string) => {
    if (!user) return;
    await setTargetCareerMutation.mutateAsync({
      userId: user.id,
      careerId,
      reason: "career_selection",
    });
    // Refresh profile state
    const p = await getProfile(user.id);
    setProfile(p);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <Compass className="w-4 h-4" />
            <span>Market-Calibrated Career Roles</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Career Matching & Exploration</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Select a target career role to calculate your deterministic readiness score, analyze skill gaps, and activate the multi-agent recommendation engine.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading career roles catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map((career) => {
              const isSelected = profile?.target_career_id === career.id;
              const relevantAreas = Array.isArray(career.relevant_areas) 
                ? career.relevant_areas 
                : [];

              return (
                <Card 
                  key={career.id} 
                  className={`flex flex-col justify-between transition-all hover:shadow-md ${
                    isSelected 
                      ? "border-primary shadow-sm bg-primary/[0.02] ring-1 ring-primary/40" 
                      : "border-border/80"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs gap-1 bg-primary font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Target Goal
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mt-3">{career.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-3 mt-1 leading-relaxed">
                      {career.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs">
                    {career.recommended_experience && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{career.recommended_experience}</span>
                      </div>
                    )}

                    {relevantAreas.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          Key Domains
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {relevantAreas.map((area: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[11px] font-normal px-2 py-0.5">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                    <Link to={`/careers/${career.id}/readiness`} className="w-1/2">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                        <Target className="w-3.5 h-3.5" />
                        Analysis
                      </Button>
                    </Link>

                    {isSelected ? (
                      <Link to="/roadmap" className="w-1/2">
                        <Button size="sm" className="w-full text-xs gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Roadmap
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="w-1/2 text-xs gap-1"
                        disabled={setTargetCareerMutation.isPending}
                        onClick={() => handleSelectCareer(career.id)}
                      >
                        Set as Goal
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerExplorer;
