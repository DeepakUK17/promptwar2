import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Plus, Briefcase, Users, FileText } from "lucide-react";

interface NgoDashboardProps {
  profile: any;
}

const NgoDashboard = ({ profile }: NgoDashboardProps) => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: oppsData } = await supabase
        .from("opportunities")
        .select("*")
        .eq("ngo_id", profile.id)
        .order("created_at", { ascending: false });

      const { data: appsData } = await supabase
        .from("applications")
        .select("*, opportunities!inner(*), profiles!applications_volunteer_id_fkey(*)")
        .eq("opportunities.ngo_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setOpportunities(oppsData || []);
      setApplications(appsData || []);
    };

    fetchData();
  }, [profile.id]);

  const stats = {
    totalOpportunities: opportunities.length,
    activeOpportunities: opportunities.filter((o) => o.status === "open").length,
    totalApplications: applications.length,
    pendingApplications: applications.filter((a) => a.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {profile.organization_name || profile.full_name}
          </h1>
          <p className="text-muted-foreground">Manage your volunteering opportunities</p>
        </div>
        <Link to="/opportunities/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Opportunity
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold">{stats.totalOpportunities}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.activeOpportunities}</p>
              </div>
              <Briefcase className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
              </div>
              <FileText className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Info */}
      {profile.organization_description && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{profile.organization_description}</p>
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline mt-2 inline-block"
              >
                Visit Website
              </a>
            )}
          </CardContent>
        </Card>
      )}

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
                <div key={app.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{app.profiles?.full_name || "Unknown"}</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Applied for: {app.opportunities?.title}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">{app.cover_letter}</p>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Opportunities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Opportunities</CardTitle>
          <Link to="/opportunities/manage">
            <Button variant="outline" size="sm">
              Manage All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div>
              <p className="text-muted-foreground mb-4">No opportunities created yet</p>
              <Link to="/opportunities/create">
                <Button>Create Your First Opportunity</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.slice(0, 3).map((opp) => (
                <div key={opp.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{opp.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{opp.description}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>{opp.location}</span>
                        <span>•</span>
                        <span>{opp.duration}</span>
                      </div>
                    </div>
                    <Badge variant={opp.status === "open" ? "default" : "secondary"}>
                      {opp.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NgoDashboard;
