import { Bell, Search, User, Settings, LogOut, ChevronDown, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User as UserType } from "@shared/schema";
import { Link } from "wouter";
import { HeaderRoleSwitcher } from "@/components/HeaderRoleSwitcher";
import { getAllTutorialsForRole } from "@/lib/tutorials";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  user?: UserType | null;
  onStartTutorial?: (tutorialKey: string) => void;
}

export default function Header({ title, subtitle, action, user: userProp, onStartTutorial }: HeaderProps) {
  const { user: authUser } = useAuth();
  const user = userProp || authUser;
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'property_manager': return 'Property Manager';
      case 'landlord': return 'Property Owner';
      case 'tenant': return 'Tenant';
      case 'vendor': return 'Vendor';
      default: return role;
    }
  };

  const getSettingsPath = () => {
    switch (user?.role) {
      case 'tenant': return '/tenant-portal/settings';
      case 'landlord': return '/owner-portal/settings';
      case 'vendor': return '/vendor-portal/settings';
      default: return '/settings';
    }
  };

  const availableTutorials = getAllTutorialsForRole(user?.role);

  const handleStartTutorial = (tutorialKey: string) => {
    localStorage.removeItem(`tutorial_${tutorialKey}`);
    setTutorialDialogOpen(false);
    if (onStartTutorial) {
      onStartTutorial(tutorialKey);
    }
    window.location.reload();
  };

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="ml-12 md:ml-0">
          <h2 className="text-lg md:text-2xl font-bold truncate">{title}</h2>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 w-64"
              data-testid="input-search"
            />
          </div>
          
          <div className="hidden md:block">
            <HeaderRoleSwitcher currentRole={user?.role} />
          </div>
          
          <Dialog open={tutorialDialogOpen} onOpenChange={setTutorialDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex" 
                data-testid="button-tutorials"
                title="Start Tutorial"
              >
                <GraduationCap className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select a Tutorial</DialogTitle>
                <DialogDescription>
                  Choose which page walkthrough you'd like to view. Each tutorial provides step-by-step guidance for that page's features.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 mt-4">
                {availableTutorials.map((tutorial) => (
                  <Button
                    key={tutorial.key}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handleStartTutorial(tutorial.key)}
                    data-testid={`tutorial-${tutorial.key}`}
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-primary shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{tutorial.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {tutorial.steps.length} steps
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" size="icon" className="hidden md:flex" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
          
          {action}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 h-auto py-2 px-2 md:px-3"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none" data-testid="dropdown-user-name">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="dropdown-user-email">
                      {user.email}
                    </p>
                    <Badge variant="outline" className="w-fit mt-1" data-testid="dropdown-user-role">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild data-testid="dropdown-settings">
                  <Link href={getSettingsPath()}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="dropdown-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
