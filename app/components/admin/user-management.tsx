"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"

interface User {
  id: number
  username: string
  email: string
  status: "active" | "inactive"
  created_at: string
  last_login?: string | null
  updated_at?: string
  role?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [fetchAbortController, setFetchAbortController] = useState<AbortController | null>(null)
  type SortKey = keyof Pick<User, "id" | "username" | "email" | "role" | "status" | "created_at" | "last_login">
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    status: "active" as "active" | "inactive",
    role: "user",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching users from /api/users...")

      // Abort prior in-flight request
      if (fetchAbortController) fetchAbortController.abort()
      const controller = new AbortController()
      setFetchAbortController(controller)
      const response = await fetch("/api/users", { signal: controller.signal })
      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (data.success) {
        setUsers(data.users || [])
        setSuccess(`Loaded ${data.count || 0} users successfully`)
        setLastFetchedAt(new Date())
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("userDataChanged"))
      } else {
        setError(`Failed to fetch users: ${data.error}`)
        console.error("API Error:", data)
      }
    } catch (error) {
      if ((error as any)?.name === "AbortError") return
      const errorMessage = `Error fetching users: ${error instanceof Error ? error.message : "Unknown error"}`
      setError(errorMessage)
      console.error("Fetch Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError("All fields are required")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("User created successfully")
  setFormData({ username: "", email: "", password: "", status: "active", role: "user" })
        setShowAddUser(false)
        fetchUsers()
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("userDataChanged"))
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (error) {
      setError("Error creating user")
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    setIsSubmitting(true)
    setError("")

    try {
      const updateData = {
        id: editingUser.id,
        username: formData.username,
        email: formData.email,
        status: formData.status,
        role: formData.role,
        ...(formData.password && { password: formData.password }),
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("User updated successfully")
        setShowEditUser(false)
        setEditingUser(null)
        fetchUsers()
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("userDataChanged"))
      } else {
        setError(data.error || "Failed to update user")
      }
    } catch (error) {
      setError("Error updating user")
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("User deleted successfully")
        fetchUsers()
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("userDataChanged"))
      } else {
        setError(data.error || "Failed to delete user")
      }
    } catch (error) {
      setError("Error deleting user")
      console.error("Error:", error)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      status: user.status,
      role: user.role || "user",
    })
    setShowEditUser(true)
  }

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "", status: "active", role: "user" })
    setError("")
    setSuccess("")
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never"
    try {
      const d = new Date(dateString)
      if (Number.isNaN(d.getTime())) return dateString
      const now = Date.now()
      const diff = now - d.getTime()
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
      const mins = Math.round(diff / 60000)
      if (mins < 60) return mins <= 1 ? "Just now" : rtf.format(-mins, "minute")
      const hours = Math.round(mins / 60)
      if (hours < 24) return rtf.format(-hours, "hour")
      const days = Math.round(hours / 24)
      if (days < 7) return rtf.format(-days, "day")
      return d.toLocaleString()
    } catch (error) {
      console.error("Date formatting error:", error)
      return dateString
    }
  }

  const clearMessagesSoon = () => setTimeout(() => (setError(""), setSuccess("")), 3000)

  // Quick status toggle (optimistic)
  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active"
    // Optimistic update
    const prevUsers = users
    setUsers((u) => u.map((x) => (x.id === user.id ? { ...x, status: newStatus } : x)))
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, status: newStatus }),
      })
      const data = await response.json()
      if (!data.success) {
        setUsers(prevUsers) // rollback
        setError(data.error || "Failed to update status")
        clearMessagesSoon()
      } else {
        setSuccess("Status updated")
        clearMessagesSoon()
        window.dispatchEvent(new CustomEvent("userDataChanged"))
      }
    } catch (err) {
      setUsers(prevUsers)
      setError("Network error updating status")
      clearMessagesSoon()
    }
  }

  // Derived filtered + sorted + paginated data
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(search.toLowerCase()) ||
      String(u.id).includes(search)
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedUsers = (() => {
    if (!sortConfig) return filteredUsers
    const { key, direction } = sortConfig
    return [...filteredUsers].sort((a, b) => {
      const av = (a[key] ?? "") as any
      const bv = (b[key] ?? "") as any
      if (av === bv) return 0
      if (av > bv) return direction === "asc" ? 1 : -1
      return direction === "asc" ? -1 : 1
    })
  })()

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedUsers = sortedUsers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  const changeSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      return null // remove sorting on third click
    })
  }

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      fetchUsers()
    }, 60000)
    return () => clearInterval(id)
  }, [autoRefresh])

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, pageSize])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">User Management</h2>
          <p className="text-gray-600">Manage system users and their access permissions.</p>
          {lastFetchedAt && (
            <p className="text-xs text-gray-400 mt-1">Last fetched: {lastFetchedAt.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Users
          </Button>
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="add-username">Username</Label>
                  <Input
                    id="add-username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-password">Password</Label>
                  <Input
                    id="add-password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="add-role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="add-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Tools */}
      <Card className="border-blue-100">
        <CardContent className="pt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="user-search" className="text-xs uppercase tracking-wide text-gray-500">
              Search
            </Label>
            <Input
              id="user-search"
              placeholder="Search by id, username, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status-filter" className="text-xs uppercase tracking-wide text-gray-500">
              Status Filter
            </Label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger id="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="page-size" className="text-xs uppercase tracking-wide text-gray-500">
              Page Size
            </Label>
            <Select value={String(pageSize)} onValueChange={(v: string) => setPageSize(Number(v))}>
              <SelectTrigger id="page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end space-x-2">
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 w-full justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={(v: any) => setAutoRefresh(Boolean(v))}
                />
                <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                  Auto Refresh (1m)
                </Label>
              </div>
              {autoRefresh ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>
                System Users ({users.length}) | Showing {paginatedUsers.length} of {filteredUsers.length}
                {sortConfig && (
                  <span className="ml-2 text-xs text-gray-500">
                    Sorted by {sortConfig.key} ({sortConfig.direction})
                  </span>
                )}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Page {safeCurrentPage} / {totalPages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-8 gap-4 items-center">
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                  </div>
                ))}
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found. {error ? "Check the error above." : "Add your first user to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {([
                      ["id", "ID"],
                      ["username", "Username"],
                      ["email", "Email"],
                      ["role", "Role"],
                      ["status", "Status"],
                      ["created_at", "Created"],
                      ["last_login", "Last Login"],
                    ] as [SortKey, string][]).map(([key, label]) => {
                      const active = sortConfig?.key === key
                      const dir = sortConfig?.direction
                      return (
                        <TableHead
                          key={key}
                          className="cursor-pointer select-none"
                          onClick={() => changeSort(key)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") changeSort(key)
                          }}
                          aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {active ? (
                              dir === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-300" />
                            )}
                          </span>
                        </TableHead>
                      )
                    })}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            (user.role || "user").toLowerCase().includes("admin")
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          }
                        >
                          {user.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_login)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(user)}
                            className={
                              user.status === "active"
                                ? "border-amber-300 text-amber-600 hover:bg-amber-50"
                                : "border-green-300 text-green-600 hover:bg-green-50"
                            }
                            title={
                              user.status === "active" ? "Deactivate user" : "Activate user"
                            }
                          >
                            {user.status === "active" ? (
                              <ToggleLeft className="h-3 w-3" />
                            ) : (
                              <ToggleRight className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                        No users match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {/* Pagination Controls */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              Showing {(safeCurrentPage - 1) * pageSize + 1}–
              {Math.min(safeCurrentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} filtered users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
              >
                « First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                ‹ Prev
              </Button>
              <div className="text-sm font-mono">
                {safeCurrentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
              >
                Last »
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
