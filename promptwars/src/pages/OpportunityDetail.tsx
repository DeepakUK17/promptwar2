import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const OpportunityDetail = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const profileData = await getProfile(user.id);
        setProfile(profileData);

        const { data: oppData } = await supabase
          .from("opportunities")
          .select("*")
          .eq("id", id)
          .single();

        setOpportunity(oppData);

        const { data: appData } = await supabase
          .from("applications")
          .select("id")
          .eq("opportunity_id", id)
          .eq("volunteer_id", user.id)
          .maybeSingle();

        setHasApplied(!!appData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      toast({
        title: "Cover letter required",
        description: "Please write a cover letter to apply",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase.from("applications").insert({
        opportunity_id: id,
        volunteer_id: profile.id,
        cover_letter: coverLetter,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Application submitted successfully!" });
      setHasApplied(true);
      setCoverLetter("");
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated profile={profile} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Opportunity not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated profile={profile} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{opportunity.title}</CardTitle>
            <Badge className="w-fit mt-2" variant={opportunity.status === "open" ? "default" : "secondary"}>
              {opportunity.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{opportunity.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {opportunity.required_skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <p className="text-muted-foreground">{opportunity.location}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Duration</h3>
                <p className="text-muted-foreground">{opportunity.duration}</p>
              </div>
            </div>

            {profile?.role === "volunteer" && opportunity.status === "open" && (
              <div className="border-t pt-6">
                {hasApplied ? (
                  <div className="text-center py-4">
                    <p className="text-lg font-semibold text-primary">You have already applied for this opportunity</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate("/applications")}>
                      View My Applications
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Apply for this Opportunity</h3>
                    <Textarea
                      placeholder="Write your cover letter here..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                    />
                    <Button onClick={handleApply} disabled={applying}>
                      {applying ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpportunityDetail;
