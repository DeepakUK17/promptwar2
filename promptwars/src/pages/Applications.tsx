import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Applications = () => {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
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
        setProfile(profileData);

        let appsData;
        if (profileData.role === "ngo") {
          // NGO sees applications for their opportunities
          const { data } = await supabase
            .from("applications")
            .select("*, opportunities!inner(*), profiles!applications_volunteer_id_fkey(*)")
            .eq("opportunities.ngo_id", profileData.id)
            .order("created_at", { ascending: false });
          appsData = data;
        } else {
          // Volunteer sees their own applications
          const { data } = await supabase
            .from("applications")
            .select("*, opportunities(*)")
            .eq("volunteer_id", user.id)
            .order("created_at", { ascending: false });
          appsData = data;
        }

        setApplications(appsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;

      setApplications(
        applications.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: "Success",
        description: `Application ${newStatus}`,
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
        <h1 className="text-3xl font-bold mb-6">
          {profile?.role === "ngo" ? "Applications Received" : "My Applications"}
        </h1>
        
        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {profile?.role === "ngo"
                  ? "No applications received yet"
                  : "No applications yet. Start browsing opportunities!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {profile?.role === "ngo"
                          ? `${app.profiles?.full_name || "Unknown"} - ${app.opportunities.title}`
                          : app.opportunities.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Applied on {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === "accepted"
                          ? "default"
                          : app.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile?.role === "ngo" && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Volunteer Email:</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {app.profiles?.email}
                      </p>
                      <p className="text-sm font-medium mb-1">Cover Letter:</p>
                      <p className="text-muted-foreground mb-3">{app.cover_letter}</p>
                      {app.profiles?.skills && app.profiles.skills.length > 0 && (
                        <>
                          <p className="text-sm font-medium mb-1">Volunteer Skills:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {app.profiles.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {profile?.role === "volunteer" && (
                    <>
                      <p className="text-muted-foreground mb-3">{app.opportunities.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {app.opportunities.required_skills?.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Location: {app.opportunities.location}</p>
                        <p>Duration: {app.opportunities.duration}</p>
                      </div>
                    </>
                  )}

                  {profile?.role === "ngo" && app.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleUpdateStatus(app.id, "accepted")}
                        size="sm"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(app.id, "rejected")}
                        variant="destructive"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
