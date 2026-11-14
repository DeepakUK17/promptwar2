import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCareerRoles, useSetTargetCareer } from "@/hooks/useCareers";
import { 
  User, 
  GraduationCap, 
  Building2, 
  Compass, 
  Award, 
  FolderGit2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save 
} from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    full_name: "",
    email: "",
    degree: "",
    institution: "",
    bio: "",
    location: "",
    target_career_id: "",
    certifications: [] as { title: string; issuer: string; year: string }[],
    completed_projects: [] as { title: string; description: string; tech: string }[],
  });

  // State for new certification input
  const [newCert, setNewCert] = useState({ title: "", issuer: "", year: "" });
  // State for new project input
  const [newProj, setNewProj] = useState({ title: "", description: "", tech: "" });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: careerRoles = [] } = useCareerRoles();
  const setTargetCareerMutation = useSetTargetCareer();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const profileData = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            degree: profileData.degree || "",
            institution: profileData.institution || "",
            bio: profileData.bio || "",
            location: profileData.location || "",
            target_career_id: profileData.target_career_id || "",
            certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
            completed_projects: Array.isArray(profileData.completed_projects) ? profileData.completed_projects : [],
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          degree: formData.degree,
          institution: formData.institution,
          bio: formData.bio,
          location: formData.location,
          target_career_id: formData.target_career_id || null,
          certifications: formData.certifications,
          completed_projects: formData.completed_projects,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      // If career changed, update target career workflow
      if (formData.target_career_id && formData.target_career_id !== profile.target_career_id) {
        await setTargetCareerMutation.mutateAsync({
          userId: profile.id,
          careerId: formData.target_career_id,
          reason: "profile_career_selection",
        });
      }

      setProfile({ ...profile, ...formData });
      toast({
        title: "Profile saved successfully",
        description: "Your learner attributes have been updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error saving profile",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    if (newCert.title.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...newCert }],
      });
      setNewCert({ title: "", issuer: "", year: "" });
    }
  };

  const removeCertification = (index: number) => {
    const updated = [...formData.certifications];
    updated.splice(index, 1);
    setFormData({ ...formData, certifications: updated });
  };

  const addProject = () => {
    if (newProj.title.trim()) {
      setFormData({
        ...formData,
        completed_projects: [...formData.completed_projects, { ...newProj }],
      });
      setNewProj({ title: "", description: "", tech: "" });
    }
  };

  const removeProject = (index: number) => {
    const updated = [...formData.completed_projects];
    updated.splice(index, 1);
    setFormData({ ...formData, completed_projects: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation profile={profile} />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learner Profile</h1>
            <p className="text-muted-foreground text-sm">
              Manage your academic background, target career aspiration, and verified portfolio.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Profile"}
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={formData.email} disabled className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location / Timezone</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA / UTC-7"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Professional Summary / Bio</Label>
                <Textarea
                  id="bio"
                  rows={2}
                  placeholder="Aspiring software engineer passionate about distributed systems and AI applications."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Educational Background */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Background
              </CardTitle>
              <CardDescription>
                Provides educational context for pacing and complexity recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree">Current Degree / Specialization</Label>
                <Input
                  id="degree"
                  placeholder="e.g. B.Tech in Computer Science & Engineering"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">University / College</Label>
                <Input
                  id="institution"
                  placeholder="e.g. National Institute of Technology"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Target Career Goal */}
          <Card className="border-primary/30 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                Target Career Goal
              </CardTitle>
              <CardDescription>
                The orchestrator compares your verified skills against this job role to construct your roadmap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="target_career">Selected Target Role</Label>
                <Select
                  value={formData.target_career_id}
                  onValueChange={(val) => setFormData({ ...formData, target_career_id: val })}
                >
                  <SelectTrigger id="target_career">
                    <SelectValue placeholder="Choose a career role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {careerRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground pt-1">
                  Changing your career goal will archive your active roadmap and trigger the Career Intelligence Agent to build a new one.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/20">
                <Input
                  placeholder="Certificate Title (e.g. AWS Cloud Practitioner)"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                />
                <Input
                  placeholder="Issuing Body (e.g. Amazon Web Services)"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Year (e.g. 2025)"
                    value={newCert.year}
                    onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addCertification}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {formData.certifications.length > 0 ? (
                <div className="space-y-2">
                  {formData.certifications.map((cert: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded border text-sm">
                      <div>
                        <p className="font-semibold">{cert.title}</p>
                        <p className="text-xs text-muted-foreground">{cert.issuer} {cert.year ? `• ${cert.year}` : ""}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeCertification(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No certifications added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* 5. Completed Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-primary" />
                Completed Projects & Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Project Name (e.g. E-Commerce Microservices)"
                    value={newProj.title}
                    onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                  />
                  <Input
                    placeholder="Tech Stack (e.g. Node.js, React, Docker, Postgres)"
                    value={newProj.tech}
                    onChange={(e) => setNewProj({ ...newProj, tech: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Brief description or GitHub repository URL"
                    value={newProj.description}
                    onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addProject} className="gap-1 shrink-0">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>

              {formData.completed_projects.length > 0 ? (
                <div className="space-y-2">
                  {formData.completed_projects.map((proj: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between p-3 rounded border text-sm">
                      <div>
                        <p className="font-semibold">{proj.title}</p>
                        <p className="text-xs text-muted-foreground">{proj.description}</p>
                        {proj.tech && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {proj.tech.split(",").map((t: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                                {t.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeProject(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No completed projects documented yet.</p>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Profile;
