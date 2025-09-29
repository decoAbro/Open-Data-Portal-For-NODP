"use client"
import { useState, useEffect } from "react"
import LoginPage from "./components/login-page"
import Dashboard from "./components/dashboard"
import AdminLogin from "./components/admin/admin-login"
import AdminDashboard from "./components/admin/admin-dashboard"
import { validateAdminCredentials } from "./utils/storage"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userCredentials, setUserCredentials] = useState<{ username: string; password: string; role?: string } | null>(null)
  const [adminPassword, setAdminPassword] = useState("Sapphire123")
  const [isLoading, setIsLoading] = useState(true)
  const [loginError, setLoginError] = useState("")
  const [showAuthLoadingOverlay, setShowAuthLoadingOverlay] = useState(false)

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCredentials = localStorage.getItem("pie-portal-credentials")
      if (savedCredentials) {
        try {
          const credentials = JSON.parse(savedCredentials)
          // Verify the saved credentials are still valid
          verifyStoredCredentials(credentials)
        } catch (error) {
          console.error("Error parsing saved credentials:", error)
          localStorage.removeItem("pie-portal-credentials")
        }
      }
    }
    setIsLoading(false)
  }, [])

  const verifyStoredCredentials = async (credentials: { username: string; password: string; role?: string }) => {
    try {
      if (credentials.role && /admin/i.test(credentials.role)) {
        // If stored role already indicates admin privileges, trust but verify login still valid
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: credentials.username, password: credentials.password }),
        })
        const data = await response.json()
        if (data.success) {
          setUserCredentials({ ...credentials, role: data.user.role })
          setIsAuthenticated(true)
          setIsAdmin(/admin/i.test(data.user.role || ''))
          // Refresh stored credentials with latest role
          localStorage.setItem("pie-portal-credentials", JSON.stringify({ username: credentials.username, password: credentials.password, role: data.user.role }))
          return
        } else {
          localStorage.removeItem("pie-portal-credentials")
          return
        }
      }
      if (credentials.username === "admin") {
        if (validateAdminCredentials(credentials.username, credentials.password)) {
          setUserCredentials(credentials)
          setIsAuthenticated(true)
          setIsAdmin(true)
        } else {
          localStorage.removeItem("pie-portal-credentials")
        }
      } else {
        // Verify regular user credentials with database
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        })

        const data = await response.json()
        if (response.ok && data.success) {
          const role = data.user?.role || 'user'
          setUserCredentials({ ...credentials, role })
          setIsAuthenticated(true)
          setIsAdmin(/admin/i.test(role))
          // Persist role
          localStorage.setItem("pie-portal-credentials", JSON.stringify({ username: credentials.username, password: credentials.password, role }))
        } else {
          localStorage.removeItem("pie-portal-credentials")
        }
      }
    } catch (error) {
      console.error("Error verifying stored credentials:", error)
      localStorage.removeItem("pie-portal-credentials")
    }
  }

  const handleLogin = async (username: string, password: string) => {
    setLoginError("")
    setShowAuthLoadingOverlay(true)
    const credentials = { username, password }

    // Check if it's admin login
    if (username === "admin") {
      if (validateAdminCredentials(username, password)) {
        setUserCredentials(credentials)
        setIsAuthenticated(true)
        setIsAdmin(true)

        if (typeof window !== "undefined") {
          localStorage.setItem("pie-portal-credentials", JSON.stringify(credentials))
        }
        setShowAuthLoadingOverlay(false)
      } else {
        setLoginError("Invalid admin credentials")
        setShowAuthLoadingOverlay(false)
        return
      }
    } else {
      // Regular user login - authenticate with database
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        })
        const data = await response.json()
        if (data.success) {
          const role = data.user?.role || 'user'
            setUserCredentials({ ...credentials, role })
            setIsAuthenticated(true)
            setIsAdmin(/admin/i.test(role))
            if (typeof window !== "undefined") {
              localStorage.setItem("pie-portal-credentials", JSON.stringify({ username, password, role }))
            }
            setShowAuthLoadingOverlay(false)
        } else {
          setLoginError(data.error || "Login failed")
          setShowAuthLoadingOverlay(false)
          return
        }
      } catch (error) {
        setLoginError("Connection error. Please try again.")
        console.error("Login error:", error)
        setShowAuthLoadingOverlay(false)
        return
      }
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setIsAdmin(false)
    setUserCredentials(null)
    setLoginError("")
    if (typeof window !== "undefined") {
      localStorage.removeItem("pie-portal-credentials")
    }
  }

  const handlePasswordChange = (newPassword: string) => {
    setAdminPassword(newPassword)
  }

  // Show loading state during hydration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show admin login if path includes /admin
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.includes("/admin")

  if (!isAuthenticated) {
    if (isAdminPath) {
      return <AdminLogin onLogin={handleLogin} error={loginError} />
    }
    return <LoginPage onLogin={handleLogin} error={loginError} />
  }

  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} username={userCredentials?.username || 'Administrator'} />
  }

  return (
    <>
      <Dashboard userCredentials={userCredentials!} onLogout={handleLogout} />
      {showAuthLoadingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium text-gray-700">Signing you in...</p>
            <p className="text-sm text-gray-500">Verifying your credentials with the server</p>
          </div>
        </div>
      )}
    </>
  )
}
