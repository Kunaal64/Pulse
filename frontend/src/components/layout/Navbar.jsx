import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Wifi,
  WifiOff,
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white border-b border-zinc-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-base">P</span>
              </div>
              <span className="text-lg font-semibold text-zinc-900">
                Pulse
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Connection status - subtle indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md">
              {isConnected ? (
                <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Connected" />
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected" />
              )}
            </div>

            {/* Notifications */}
            <button className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                  <span className="text-zinc-700 font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-medium border border-zinc-200 py-1 z-50">
                  <div className="px-3 py-2.5 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-zinc-500">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-zinc-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
