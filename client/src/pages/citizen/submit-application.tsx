import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SubmitApplication() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicationType: "",
    description: "",
    additionalInfo: "",
  });

  const applicationTypes = [
    "License Application",
    "Certificate Request",
    "Permit Application",
    "Registration",
    "Complaint Filing",
    "Information Request",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        applicationType: formData.applicationType,
        description: formData.description,
        citizenId: user!.id,
        data: JSON.stringify({ additionalInfo: formData.additionalInfo }),
      };

      await apiRequest("POST", "/api/applications", data);

      await queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });

      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. You'll receive updates via notifications.",
      });

      setLocation("/citizen/dashboard");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Submit Application</h1>
            <p className="text-muted-foreground">Fill out the form below to submit your application</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="font-heading">Application Details</CardTitle>
              </div>
              <CardDescription>
                Provide accurate information for faster processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="applicationType">Application Type *</Label>
                  <Select
                    value={formData.applicationType}
                    onValueChange={(value) => setFormData({ ...formData, applicationType: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-application-type">
                      <SelectValue placeholder="Select application type" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicationTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your application request in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={5}
                    data-testid="textarea-description"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide clear details about what you're requesting
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional details that might be helpful..."
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    rows={4}
                    data-testid="textarea-additional"
                  />
                </div>

                <div className="bg-muted p-4 rounded-md space-y-2">
                  <h3 className="font-medium text-sm">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Your application will be assigned to an available official</li>
                    <li>You'll receive notifications at each stage</li>
                    <li>AI monitoring ensures timely processing</li>
                    <li>Auto-approval within 30 days if no action is taken</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Link href="/citizen/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                    data-testid="button-submit-application"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
