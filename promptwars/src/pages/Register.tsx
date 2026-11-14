import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUp } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Sparkles, GraduationCap, Building2, ArrowRight } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    degree: "B.Tech in Computer Science",
    institution: "Institute of Technology",
    skills: "Python, SQL, HTML, CSS",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills
        ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: "learner",
        degree: formData.degree,
        institution: formData.institution,
        skills: skillsArray,
      });

      toast({
        title: "Account created successfully!",
        description: "Welcome to PromptWars! Let's initialize your career intelligence profile.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={false} />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-xl mx-auto shadow-lg border-border">
          <CardHeader className="text-center pb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Your Learner Profile</CardTitle>
            <CardDescription>
              Join PromptWars to unlock AI-orchestrated career guidance and adaptive learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@university.edu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree" className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    Degree / Major
                  </Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution" className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    University / Institution
                  </Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="e.g. Tech University"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Current Skills (comma separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Python, SQL, HTML, CSS"
                />
                <p className="text-xs text-muted-foreground">
                  You can calibrate exact proficiencies (0-100%) in the Skills Manager after registering.
                </p>
              </div>

              <Button type="submit" className="w-full gap-2 mt-4" disabled={loading}>
                {loading ? "Initializing Profile..." : "Start Learning"}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-2">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
