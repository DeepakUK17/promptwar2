import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  LogOut, 
  User, 
  LayoutDashboard, 
  Compass, 
  Wrench, 
  Milestone, 
  FileCheck2, 
  Bot,
  Layers
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  isAuthenticated?: boolean;
  profile?: any;
}

const Navigation = ({ isAuthenticated = true, profile }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Skills", path: "/skills", icon: Wrench },
    { name: "Career Matching", path: "/careers", icon: Compass },
    { name: "Roadmap", path: "/roadmap", icon: Milestone },
    { name: "Assessments", path: "/assessments", icon: FileCheck2 },
    { name: "AI Mentor", path: "/mentor", icon: Bot },
  ];

  return (
    <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span>PromptWars</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal hidden sm:inline-block">AI Learning</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
                return (
                  <Link key={link.path} to={link.path}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      size="sm"
                      className="gap-2 text-xs font-medium"
                    >
                      <Icon className="h-4 w-4" />
                      {link.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/profile">
                <Button 
                  variant={location.pathname === "/profile" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="gap-2 text-xs"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{profile?.full_name || "Profile"}</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                title="Sign Out"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
