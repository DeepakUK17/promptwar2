import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

const Opportunities = () => {
  const [profile, setProfile] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filteredOpps, setFilteredOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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

        const { data: oppsData } = await supabase
          .from("opportunities")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false });

        setOpportunities(oppsData || []);
        setFilteredOpps(oppsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOpps(opportunities);
    } else {
      const filtered = opportunities.filter((opp) =>
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.required_skills.some((skill: string) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredOpps(filtered);
    }
  }, [searchTerm, opportunities]);

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
        <h1 className="text-3xl font-bold mb-6">Browse Opportunities</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by title, location, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredOpps.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {searchTerm ? "No opportunities match your search" : "No opportunities available at the moment"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOpps.map((opp) => (
              <Card key={opp.id}>
                <CardHeader>
                  <CardTitle>{opp.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{opp.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Required Skills:</span>
                      {opp.required_skills?.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Location:</span> {opp.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Duration:</span> {opp.duration}
                    </p>
                  </div>

                  <Link to={`/opportunities/${opp.id}`}>
                    <Button>View Details & Apply</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities;
