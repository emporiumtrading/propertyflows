import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Home, Wrench, UserCircle, ChevronDown } from "lucide-react";

const roles = [
  { value: 'admin', label: 'Admin', icon: UserCircle },
  { value: 'property_manager', label: 'Property Manager', icon: Building2 },
  { value: 'landlord', label: 'Property Owner', icon: Home },
  { value: 'tenant', label: 'Tenant', icon: User },
  { value: 'vendor', label: 'Vendor', icon: Wrench },
];

export function HeaderRoleSwitcher({ currentRole }: { currentRole?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest('POST', '/api/dev/switch-role', { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Role Switched",
        description: `You are now viewing as ${roles.find(r => r.value === selectedRole)?.label}`,
      });
      
      const roleRedirects: Record<string, string> = {
        'tenant': '/tenant-portal',
        'landlord': '/owner-portal',
        'vendor': '/vendor-portal',
        'admin': '/dashboard',
        'property_manager': '/dashboard',
      };
      
      setTimeout(() => {
        window.location.href = roleRedirects[selectedRole || 'admin'] || '/dashboard';
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch role",
        variant: "destructive",
      });
    },
  });

  const handleRoleSwitch = (role: string) => {
    setSelectedRole(role);
    switchRoleMutation.mutate(role);
  };

  if (import.meta.env.PROD) {
    return null;
  }

  const currentRoleInfo = roles.find(r => r.value === currentRole);
  const CurrentIcon = currentRoleInfo?.icon || UserCircle;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          data-testid="button-role-switcher-dropdown"
        >
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-1.5 py-0">
            DEV
          </Badge>
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden md:inline">{currentRoleInfo?.label || 'Select Role'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Role (Development)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = currentRole === role.value;
          const isLoading = switchRoleMutation.isPending && selectedRole === role.value;
          
          return (
            <DropdownMenuItem
              key={role.value}
              onClick={() => handleRoleSwitch(role.value)}
              disabled={isActive || switchRoleMutation.isPending}
              className="cursor-pointer"
              data-testid={`menu-item-switch-${role.value}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="flex-1">{role.label}</span>
              {isActive && (
                <Badge variant="default" className="ml-2 text-xs">Current</Badge>
              )}
              {isLoading && (
                <span className="ml-2 text-xs text-muted-foreground">Switching...</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
