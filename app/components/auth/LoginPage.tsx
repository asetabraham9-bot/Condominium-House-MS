import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { login } from "../../lib/auth";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = login(email, password);
    
    if (user) {
      toast.success("Login successful!");
      
      // Redirect based on role
      if (user.role === "applicant") {
        navigate("/applicant");
      } else if (user.role === "campus_admin") {
        navigate("/campus-admin");
      } else if (user.role === "chms_admin") {
        navigate("/chms-admin");
      }
    } else {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">OCHMS Login</CardTitle>
          <CardDescription>
            Online Condominium House Management System
            <br />
            Wolaita Sodo University
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@wsu.edu"
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
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs bg-gray-50 p-3 rounded">
              <p><strong>Applicant:</strong> applicant@wsu.edu / password</p>
              <p><strong>Campus Admin:</strong> campus@wsu.edu / password</p>
              <p><strong>CHMS Admin:</strong> admin@wsu.edu / password</p>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
