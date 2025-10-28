import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { registerUser, setUsernameCookie } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(username.trim());
      if (response.status === 201) {
        setUsernameCookie(username.trim());
        toast({
          title: "Success",
          description: "Login successful!",
        });
        navigate("/dashboard");
      } else if (response.status === 409) {
        toast({
          title: "Error",
          description: "Username already taken",
          variant: "destructive",
        });
      } else if (response.status === 400) {
        toast({
          title: "Error",
          description: "Invalid username",
          variant: "destructive",
        });
      } else if (response.status === 403) {
        toast({
          title: "Error",
          description: "Already logged in",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Login failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme Toggle - Fixed in top right */}
      <div className="fixed top-4 right-4 z-50 bg-card/90 backdrop-blur-sm rounded-lg p-2">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <Card style={{ width: '25%', resize: 'horizontal', overflow: 'auto' }} className="min-w-[400px] max-w-[800px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">S-Emulator</CardTitle>
          <CardDescription>Enter your username to login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
