import { Outlet, useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyPermissions } from "@/hooks/use-role-queries";
import { Settings, Users, Shield } from "lucide-react";

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: myPerms } = useMyPermissions();

  const hasPerm = (action: string, subject: string) => myPerms?.some((p) => p.action === action && p.subject === subject) ?? false;

  const tabs = [
    hasPerm('manage', 'organization') && { value: "/settings", label: "General", icon: Settings },
    hasPerm('read', 'user') && { value: "/settings/users", label: "Users", icon: Users },
    hasPerm('read', 'role') && { value: "/settings/roles", label: "Roles", icon: Shield },
  ].filter(Boolean) as { value: string; label: string; icon: typeof Settings }[];

  const activeTab = tabs.find((t) => t.value === location.pathname)?.value ?? tabs[0]?.value;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings, users, and roles.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => navigate(value as string)}>
        <TabsList variant="line">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <tab.icon className="size-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
