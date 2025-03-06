import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ClipboardList, Settings, Users } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  const roleSpecificContent = {
    student: {
      title: "Student Dashboard",
      description: "Take assessments with confidence",
      action: {
        text: "View Assessments",
        href: "/student/assessment",
        icon: ClipboardList,
      },
    },
    instructor: {
      title: "Instructor Dashboard",
      description: "Manage and monitor assessments",
      action: {
        text: "Manage Assessments",
        href: "/instructor/dashboard",
        icon: Users,
      },
    },
    admin: {
      title: "Administrator Console",
      description: "System-wide monitoring and configuration",
      action: {
        text: "Open Admin Console",
        href: "/admin/dashboard",
        icon: Settings,
      },
    },
  };

  const content = roleSpecificContent[user?.role as keyof typeof roleSpecificContent];

  return (
    <div className="container mx-auto p-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome, {user?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{content.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {content.description}
                </p>
                <Button
                  className="w-full"
                  onClick={() => setLocation(content.action.href)}
                >
                  <content.action.icon className="mr-2 h-4 w-4" />
                  {content.action.text}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Privacy First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your privacy is our priority. All behavioral data is collected
                  anonymously and only during active assessments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  For technical support or questions about the proctoring system,
                  contact your institution's administrator.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
