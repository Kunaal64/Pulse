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
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* User info card */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-primary-700 font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3 text-primary-600" />
                <span className="text-xs text-primary-700 capitalize font-medium">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
        </nav>

        {/* Stats summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Quick Stats</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Organization</span>
              <span className="font-medium text-gray-900">
                {user?.organization}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Member since</span>
              <span className="font-medium text-gray-900">
                {new Date(user?.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
