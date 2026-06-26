import { Outlet, useLocation, useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Shield } from "lucide-react";

const tabs = [
  { value: "/settings", label: "General", icon: Settings },
  { value: "/settings/users", label: "Users", icon: Users },
  { value: "/settings/roles", label: "Roles", icon: Shield },
] as const;

export default function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab =
    tabs.find((t) => t.value === location.pathname)?.value ?? "/settings";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings, users, and roles.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => navigate(value as string)}
      >
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
