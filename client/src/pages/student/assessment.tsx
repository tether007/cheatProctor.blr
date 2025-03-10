import { useQuery } from "@tanstack/react-query";
import { Assessment, Session } from "@shared/schema";
import { useMonitor } from "@/hooks/use-monitor";
import { ConsentForm } from "@/components/assessment/consent-form";
import { RiskScore } from "@/components/layout/risk-score";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function StudentAssessment() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments/active"],
  });

  // Only monitor if there's an active session
  if (activeSession?.id) {
    useMonitor(activeSession.id);
  }

  const startAssessment = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowConsent(true);
  };

  const handleConsent = async (accepted: boolean) => {
    setShowConsent(false);
    if (!accepted || !selectedAssessment || !user) {
      toast({
        title: "Assessment Cancelled",
        description: "You must accept the privacy notice to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sessionData = {
        assessmentId: selectedAssessment.id,
        userId: user.id,
        startTime: new Date().toISOString(),
        consentGiven: true,
      };

      console.log("Creating session with data:", sessionData);

      const res = await apiRequest("POST", "/api/sessions", sessionData);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create session');
      }

      const session = await res.json();
      setActiveSession(session);
      toast({
        title: "Assessment Started",
        description: "Behavioral monitoring is now active.",
      });
    } catch (error: any) {
      console.error("Failed to start session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start assessment session",
        variant: "destructive",
      });
    }
  };

  const endAssessment = async () => {
    if (!activeSession) return;

    try {
      await apiRequest("PATCH", `/api/sessions/${activeSession.id}`, {
        endTime: new Date().toISOString(),
      });
      setActiveSession(null);
      toast({
        title: "Assessment Completed",
        description: "Your session has been recorded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end assessment session",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Assessment Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RiskScore score={activeSession.riskScore || 0} />
            <div className="border rounded p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                Behavioral monitoring is active. Please:
              </p>
              <ul className="text-sm list-disc pl-4 space-y-1">
                <li>Stay within the assessment window</li>
                <li>Avoid switching between applications</li>
                <li>Maintain a stable internet connection</li>
              </ul>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={endAssessment}
            >
              End Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments && assessments.length > 0 ? (
            <div className="grid gap-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{assessment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Duration: {assessment.duration} minutes
                        </p>
                      </div>
                      <Button onClick={() => startAssessment(assessment)}>
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No active assessments available
            </p>
          )}
        </CardContent>
      </Card>

      <ConsentForm
        open={showConsent}
        onAccept={() => handleConsent(true)}
        onDecline={() => handleConsent(false)}
      />
    </div>
  );
}