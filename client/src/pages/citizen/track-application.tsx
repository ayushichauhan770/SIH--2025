import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Application } from "@shared/schema";

export default function TrackApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [trackingId, setTrackingId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a tracking ID",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const application = await apiRequest<Application>(
        "GET",
        `/api/applications/track/${trackingId}`,
        undefined
      );

      if (application) {
        setLocation(`/citizen/application/${application.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Application Not Found",
        description: "No application found with this tracking ID",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/citizen/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold text-xl">Digital Governance</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Track Application</h1>
            <p className="text-muted-foreground">Enter your tracking ID to view application status</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle className="font-heading">Search by Tracking ID</CardTitle>
              </div>
              <CardDescription>
                Your tracking ID was provided when you submitted your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="trackingId">Tracking ID</Label>
                  <Input
                    id="trackingId"
                    type="text"
                    placeholder="Enter tracking ID (e.g., APP-2024-001234)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="font-mono"
                    required
                    data-testid="input-tracking-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    The tracking ID is case-sensitive
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full"
                  data-testid="button-search"
                >
                  {isSearching ? "Searching..." : "Search Application"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Check your email for the tracking ID sent after submission</p>
              <p>• Tracking IDs typically start with "APP-" followed by year and number</p>
              <p>• If you're logged in, you can view all your applications in your dashboard</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
