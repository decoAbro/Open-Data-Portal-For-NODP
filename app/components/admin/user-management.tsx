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
import { Users, Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  status: "active" | "inactive"
  created_at: string
  last_login?: string | null
  updated_at?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    status: "active" as "active" | "inactive",
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

      const response = await fetch("/api/users")
      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (data.success) {
        setUsers(data.users || [])
        setSuccess(`Loaded ${data.count || 0} users successfully`)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("userDataChanged"))
      } else {
        setError(`Failed to fetch users: ${data.error}`)
        console.error("API Error:", data)
      }
    } catch (error) {
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
        setFormData({ username: "", email: "", password: "", status: "active" })
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
    })
    setShowEditUser(true)
  }

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "", status: "active" })
    setError("")
    setSuccess("")
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never"
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      console.error("Date formatting error:", error)
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">User Management</h2>
          <p className="text-gray-600">Manage system users and their access permissions.</p>
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
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              System Users ({users.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
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
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
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
