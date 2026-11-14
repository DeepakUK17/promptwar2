import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSkills, useLearnerSkills, useSaveLearnerSkill, useDeleteLearnerSkill } from "@/hooks/useSkills";
import { 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Trash2, 
  FileCheck2, 
  Sparkles,
  ArrowRight
} from "lucide-react";

const SkillsManager = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState<string>("");
  const [addLevel, setAddLevel] = useState<number>(50);
  const [dialogOpen, setDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { data: skillsCatalog = [], isLoading: catalogLoading } = useSkills();
  const { data: learnerSkills = [], isLoading: learnerSkillsLoading } = useLearnerSkills(user?.id);
  const saveSkillMutation = useSaveLearnerSkill();
  const deleteSkillMutation = useDeleteLearnerSkill();

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

  const handleSliderChange = (skillId: string, newLevel: number) => {
    if (!user) return;
    saveSkillMutation.mutate({
      userId: user.id,
      skillId,
      selfReportedLevel: newLevel,
    });
  };

  const handleAddSkillFromCatalog = () => {
    if (!user || !selectedSkillToAdd) return;
    saveSkillMutation.mutate({
      userId: user.id,
      skillId: selectedSkillToAdd,
      selfReportedLevel: addLevel,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedSkillToAdd("");
        setAddLevel(50);
      }
    });
  };

  const getProficiencyLabel = (val: number) => {
    if (val >= 80) return { label: "Advanced / Expert", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    if (val >= 50) return { label: "Intermediate", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
    return { label: "Beginner", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  };

  // Filter skills currently added
  const filteredLearnerSkills = learnerSkills.filter((ls) => {
    const name = ls.skill?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Catalog skills not yet added by user
  const addedSkillIds = new Set(learnerSkills.map((ls) => ls.skill_id));
  const availableToSelect = skillsCatalog.filter((s) => 
    !addedSkillIds.has(s.id) && s.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="w-8 h-8 text-primary" />
              Skills Management & Validation
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Calibrate your self-reported proficiency and validate capabilities through skill-based assessments.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Skill to Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add a Skill</DialogTitle>
                <DialogDescription>
                  Choose from our verified technology catalog and estimate your current baseline level.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Search Catalog</Label>
                  <Input
                    placeholder="Search e.g. React, Python, Docker..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {availableToSelect.length > 0 ? (
                    availableToSelect.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSkillToAdd(s.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-colors ${
                          selectedSkillToAdd === s.id
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{s.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {s.category}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No available skills match your search.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <Label>Self-Reported Proficiency</Label>
                    <span className="font-semibold text-primary">{addLevel}%</span>
                  </div>
                  <Slider
                    value={[addLevel]}
                    onValueChange={(val) => setAddLevel(val[0])}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Beginner (0-40%)</span>
                    <span>Intermediate (50-70%)</span>
                    <span>Expert (80-100%)</span>
                  </div>
                </div>

                <Button
                  onClick={handleAddSkillFromCatalog}
                  disabled={!selectedSkillToAdd || saveSkillMutation.isPending}
                  className="w-full mt-2"
                >
                  {saveSkillMutation.isPending ? "Adding..." : "Confirm & Add Skill"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 mb-6 bg-card border rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Skills list */}
        {learnerSkillsLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading your skills...</div>
        ) : filteredLearnerSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLearnerSkills.map((ls) => {
              const skillName = ls.skill?.name || "Skill";
              const selfLevel = ls.self_reported_level ?? 0;
              const assessed = ls.assessed_level;
              const isVerified = ls.verified && assessed !== null;
              const badgeInfo = getProficiencyLabel(assessed ?? selfLevel);

              return (
                <Card key={ls.id} className="relative overflow-hidden border-border/80 hover:border-primary/40 transition-all">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{skillName}</CardTitle>
                        {isVerified ? (
                          <Badge variant="outline" className="text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified ({assessed}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                            Self-Reported
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs capitalize mt-0.5">
                        {ls.skill?.category || "technical"}
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8 -mr-2 -mt-2"
                      onClick={() => user && deleteSkillMutation.mutate({ userId: user.id, skillId: ls.skill_id })}
                      title="Remove Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Level slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Proficiency Level</span>
                        <span className="font-semibold">{selfLevel}%</span>
                      </div>
                      <Slider
                        value={[selfLevel]}
                        onValueChange={(val) => handleSliderChange(ls.skill_id, val[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs border-t">
                      <Badge variant="outline" className={badgeInfo.color}>
                        {badgeInfo.label}
                      </Badge>

                      <Link to="/assessments">
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary gap-1 text-xs">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          {isVerified ? "Retake Test" : "Validate Skill"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12 px-4 border-dashed">
            <CardContent className="space-y-3">
              <Sliders className="w-10 h-10 text-muted-foreground mx-auto" />
              <CardTitle className="text-lg">No skills logged yet</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Add skills from our catalog to calculate your real-time career readiness and trigger agent recommendations.
              </CardDescription>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Skill
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SkillsManager;
