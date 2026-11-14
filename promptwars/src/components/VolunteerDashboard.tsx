import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";

interface VolunteerDashboardProps {
  profile: any;
}

const VolunteerDashboard = ({ profile }: VolunteerDashboardProps) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: appsData } = await supabase
        .from("applications")
        .select("*, opportunities(*)")
        .eq("volunteer_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: oppsData } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(3);

      setApplications(appsData || []);
      setOpportunities(oppsData || []);
    };

    fetchData();
  }, [profile.id]);

  const stats = {
    applications: applications.length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    pending: applications.filter((a) => a.status === "pending").length,
    skills: profile.skills?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile.full_name}!</h1>
          <p className="text-muted-foreground">Find opportunities that match your skills</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">{stats.applications}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Skills</p>
                <p className="text-2xl font-bold">{stats.skills}</p>
              </div>
              <Plus className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-2">No skills added yet</p>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Add Skills
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Applications</CardTitle>
          <Link to="/applications">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="flex justify-between items-center pb-4 border-b last:border-0">
                  <div>
                    <h4 className="font-semibold">{app.opportunities.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Applied {new Date(app.created_at).toLocaleDateString()}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse Opportunities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Browse Opportunities</CardTitle>
          <Link to="/opportunities">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <p className="text-muted-foreground">No opportunities available</p>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div key={opp.id} className="pb-4 border-b last:border-0">
                  <h4 className="font-semibold mb-1">{opp.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{opp.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {opp.required_skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <Link to={`/opportunities/${opp.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerDashboard;
