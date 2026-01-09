import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import toast from "react-hot-toast";
import {
  Users as UsersIcon,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Filter,
} from "lucide-react";

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
    organization: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.isActive = statusFilter === "active";

      const response = await userService.getAllUsers(params);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await userService.searchUsers(searchTerm);
      setUsers(response.data.users);
      setPagination({
        ...pagination,
        total: response.data.users.length,
        pages: 1,
      });
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      await userService.createUser(formData);
      toast.success("User created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      await userService.updateUser(selectedUser._id, updateData);
      toast.success("User updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await userService.deleteUser(userId);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await userService.updateUser(userId, { isActive: !isActive });
      toast.success(`User ${isActive ? "deactivated" : "activated"}`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      organization: user.organization || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      organization: "",
    });
    setSelectedUser(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700";
      case "editor":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  };

  // Only admins can access this page
  if (currentUser?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <Shield className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-zinc-900 mb-1">Access Denied</h2>
        <p className="text-zinc-500 text-sm">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage users and their permissions
          </p>
        </div>

        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-3 shadow-soft border border-zinc-200 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          {/* Role filter */}
          <select
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status filter */}
          <select
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button variant="secondary" onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-soft border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full spinner"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-zinc-900 mb-1">
              No users found
            </h3>
            <p className="text-zinc-500 text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">
                    User
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">
                    Role
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">
                    Organization
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">
                    Joined
                  </th>
                  <th className="text-right py-2.5 px-4 text-xs font-medium text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <span className="text-zinc-600 font-medium text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 text-sm">
                      {user.organization || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          user.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            handleToggleStatus(user._id, user.isActive)
                          }
                          className={`p-1.5 rounded transition-colors ${
                            user.isActive
                              ? "text-red-500 hover:bg-red-50"
                              : "text-green-500 hover:bg-green-50"
                          }`}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          {user.isActive ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                          disabled={user._id === currentUser?.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} users
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="p-1.5 rounded border border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded border border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Organization
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Button type="submit" className="flex-1">
              Create User
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit User"
      >
        <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Password{" "}
              <span className="text-zinc-400 font-normal">
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Organization
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
