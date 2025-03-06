import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {user.role === "student" && (
              <NavigationMenuItem>
                <Link href="/student/assessment">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Assessments
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )}

            {user.role === "instructor" && (
              <NavigationMenuItem>
                <Link href="/instructor/dashboard">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )}

            {user.role === "admin" && (
              <NavigationMenuItem>
                <Link href="/admin/dashboard">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Admin Console
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user.name} ({user.role})
          </span>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
