import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    // Mock login - store role in localStorage
    localStorage.setItem("userRole", role || "");
    localStorage.setItem("userEmail", email);
    
    toast({
      title: "Login Successful",
      description: `Welcome back!`,
    });

    if (role === "admin") {
      navigate("/admin");
    } else if (role === "student") {
      navigate("/student");
    } else {
      navigate("/faculty");
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-info to-accent p-4">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3">
              Academic Portal
            </h1>
            <p className="text-primary-foreground/90 text-lg">
              Faculty-Student Marks Management System
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-primary"
              onClick={() => setRole("student")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Student Login</CardTitle>
                <CardDescription className="text-base">
                  Access your marks and academic performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ View detailed marks breakdown</p>
                  <p>✓ Track performance across subjects</p>
                  <p>✓ Monitor attendance and grades</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-accent"
              onClick={() => setRole("faculty")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">Faculty Login</CardTitle>
                <CardDescription className="text-base">
                  Manage and upload student marks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Upload marks for your subjects</p>
                  <p>✓ Automated calculations</p>
                  <p>✓ Manage multiple classes</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-info"
              onClick={() => setRole("admin")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-info rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Admin Login</CardTitle>
                <CardDescription className="text-base">
                  Manage departments and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Manage departments</p>
                  <p>✓ Add faculty and students</p>
                  <p>✓ Configure subjects and semesters</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    if (role === "student") return <GraduationCap className="w-8 h-8 text-primary-foreground" />;
    if (role === "faculty") return <Users className="w-8 h-8 text-primary-foreground" />;
    return <Shield className="w-8 h-8 text-primary-foreground" />;
  };

  const getRoleTitle = () => {
    if (role === "student") return "Student";
    if (role === "faculty") return "Faculty";
    return "Admin";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-info to-accent p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            {getRoleIcon()}
          </div>
          <CardTitle className="text-2xl text-center">
            {getRoleTitle()} Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={`${role}@example.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-3 pt-2">
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                Login
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setRole(null)}
              >
                Back to Role Selection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
