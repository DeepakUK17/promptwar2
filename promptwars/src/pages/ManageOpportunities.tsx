import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus } from "lucide-react";

const ManageOpportunities = () => {
  const [profile, setProfile] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        if (profileData.role !== "ngo") {
          navigate("/dashboard");
          return;
        }
        setProfile(profileData);

        const { data: oppsData } = await supabase
          .from("opportunities")
          .select("*")
          .eq("ngo_id", profileData.id)
          .order("created_at", { ascending: false });

        setOpportunities(oppsData || []);
      } catch (error) {
        console.error("Error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    try {
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOpportunities(opportunities.filter((o) => o.id !== id));
      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";

    try {
      const { error } = await supabase
        .from("opportunities")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setOpportunities(
        opportunities.map((o) =>
          o.id === id ? { ...o, status: newStatus } : o
        )
      );
      toast({
        title: "Success",
        description: `Opportunity ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated profile={profile} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Opportunities</h1>
          <Link to="/opportunities/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center mb-4">
                No opportunities created yet
              </p>
              <div className="text-center">
                <Link to="/opportunities/create">
                  <Button>Create Your First Opportunity</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {opportunities.map((opp) => (
              <Card key={opp.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{opp.title}</CardTitle>
                      <Badge
                        variant={opp.status === "open" ? "default" : "secondary"}
                        className="mt-2"
                      >
                        {opp.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(opp.id, opp.status)}
                      >
                        {opp.status === "open" ? "Close" : "Open"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(opp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{opp.description}</p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Required Skills:</span>
                      {opp.required_skills?.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Location:</span> {opp.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Duration:</span> {opp.duration}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOpportunities;
