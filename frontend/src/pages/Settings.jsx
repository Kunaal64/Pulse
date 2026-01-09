import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Lock,
  Building,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    organization: user?.organization || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      await updateProfile(profileData);
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (result.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error("Password change error:", err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-5">
        {/* Profile Section */}
        <section className="bg-white rounded-lg shadow-soft border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="p-5 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center">
                  <span className="text-zinc-600 font-medium text-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-1 bg-white border border-zinc-200 rounded-full shadow-soft hover:bg-zinc-50"
                >
                  <Camera className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
              <div>
                <p className="font-medium text-zinc-900 text-sm">{user?.name}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
                <span
                  className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    user?.role === "admin"
                      ? "bg-purple-50 text-purple-700"
                      : user?.role === "editor"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Organization
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={profileData.organization}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        organization: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    placeholder="Your organization (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" icon={Save} loading={profileLoading} size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </section>

        {/* Password Section */}
        <section className="bg-white rounded-lg shadow-soft border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" icon={Lock} loading={passwordLoading} size="sm">
                Update Password
              </Button>
            </div>
          </form>
        </section>

        {/* Preferences Section */}
        <section className="bg-white rounded-lg shadow-soft border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Preferences
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Email Notifications
                  </p>
                  <p className="text-xs text-zinc-500">
                    Receive email updates about your videos
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-lg shadow-soft border border-red-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50">
            <h2 className="text-sm font-medium text-red-800">Danger Zone</h2>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900">Delete Account</p>
                <p className="text-xs text-zinc-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    toast.error("Account deletion is disabled in this demo");
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
