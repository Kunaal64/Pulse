import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Upload,
  Video,
  Users,
  Settings,
  Shield,
  BarChart3,
} from "lucide-react";

const Sidebar = () => {
  const { user, canPerform } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Upload Video",
      path: "/upload",
      icon: Upload,
      show: canPerform("upload"),
    },
    {
      name: "My Videos",
      path: "/videos",
      icon: Video,
      show: true,
    },
    {
      name: "User Management",
      path: "/users",
      icon: Users,
      show: canPerform("manage_users"),
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      show: true,
    },
  ];

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-zinc-200 overflow-y-auto">
      <div className="p-3">
        {/* Navigation */}
        <nav className="space-y-0.5">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
        </nav>

        {/* User info - minimal */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
              <span className="text-zinc-700 font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
