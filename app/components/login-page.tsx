"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, EyeOff, HelpCircle, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { addNotification } from "../utils/storage"

interface LoginPageProps {
  onLogin: (username: string, password: string) => void
  error?: string
}

export default function LoginPage({ onLogin, error }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotUsername, setForgotUsername] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("")
  const [forgotPasswordError, setForgotPasswordError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setLocalError("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setShowLoadingOverlay(true)
    setLocalError("")

    // Simulate login validation delay
    setTimeout(() => {
      setIsLoading(false)
      setShowLoadingOverlay(false)
      onLogin(username, password)
    }, 1000)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!forgotUsername.trim()) {
      setForgotPasswordError("Please enter your username")
      return
    }

    setForgotPasswordLoading(true)
    setForgotPasswordError("")
    setForgotPasswordMessage("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername }),
      })

      const data = await response.json()

      if (data.success) {
        setForgotPasswordMessage(data.message)

        // Add notification for admin if user exists
        if (data.userInfo) {
          addNotification({
            username: "admin",
            message: `Password reset request from user "${data.userInfo.username}" (${data.userInfo.email}). Please reset their password from the admin panel.`,
            date: new Date().toLocaleString(),
            read: false,
            type: "general",
            year: new Date().getFullYear().toString(),
          })
        }

        // Clear form and close dialog after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotUsername("")
          setForgotPasswordMessage("")
        }, 3000)
      } else {
        setForgotPasswordError(data.error || "Failed to process request")
      }
    } catch (error) {
      setForgotPasswordError("Error processing request. Please try again.")
      console.error("Forgot password error:", error)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const resetForgotPasswordForm = () => {
    setForgotUsername("")
    setForgotPasswordError("")
    setForgotPasswordMessage("")
  }

  const displayError = error || localError

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="text-center mb-8 group">
              <Image
                src="/pie-logo.png"
                alt="Pakistan Institute of Education"
                width={120}
                height={120}
                className={`object-contain mx-auto mb-6 transition-transform duration-500 ease-out group-hover:scale-[1.06] group-hover:rotate-3 will-change-transform ${
                  (isLoading || showLoadingOverlay) ? 'animate-auth-wobble' : ''
                }`}
                priority
              />
              <h1 className="text-2xl font-bold text-blue-600 mb-2">National Open Data Portal</h1>
              <p className="text-green-600 font-medium">Data Upload Portal</p>
              <p className="text-gray-600 text-sm mt-4">
                Sign in with your API credentials to upload data to the national database
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.getModifierState) setCapsLockOn(e.getModifierState('CapsLock'))
                    }}
                    onKeyUp={(e) => {
                      if (e.getModifierState) setCapsLockOn(e.getModifierState('CapsLock'))
                    }}
                    onBlur={() => setCapsLockOn(false)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    aria-describedby={capsLockOn ? 'caps-lock-warning' : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {capsLockOn && (
                  <div
                    id="caps-lock-warning"
                    role="alert"
                    className="mt-1 text-xs text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Caps Lock is ON
                  </div>
                )}
                {/* Password strength meter removed from login page */}
              </div>

              {displayError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{displayError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing In...
                  </>
                ) : (
                  "Sign In to Portal"
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      className="text-blue-600 hover:text-blue-700 text-sm p-0 h-auto"
                      onClick={resetForgotPasswordForm}
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Forgot your password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Password Reset Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Enter your username below. The administrator will be notified to reset your password.
                      </p>

                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <Label htmlFor="forgot-username">Username</Label>
                          <Input
                            id="forgot-username"
                            type="text"
                            placeholder="Enter your username"
                            value={forgotUsername}
                            onChange={(e) => setForgotUsername(e.target.value)}
                            disabled={forgotPasswordLoading}
                            className="mt-1"
                          />
                        </div>

                        {forgotPasswordError && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-800">{forgotPasswordError}</AlertDescription>
                          </Alert>
                        )}

                        {forgotPasswordMessage && (
                          <Alert className="border-green-200 bg-green-50">
                            <AlertDescription className="text-green-800">{forgotPasswordMessage}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForgotPassword(false)}
                            disabled={forgotPasswordLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={!forgotUsername.trim() || forgotPasswordLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {forgotPasswordLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Sending...
                              </>
                            ) : (
                              "Request Password Reset"
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </form>

            {/* Note */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> Use the same username and password that you use for API basic
                authentication. Only active users can log in.
              </p>
            </div>

            {/* Powered By Section */}
            <div className="mt-4 text-center border-t pt-4">
              <p className="text-xs text-gray-500">
                Powered by <span className="font-medium text-gray-700">Data Analytics Department</span>
              </p>
              <p className="text-xs text-gray-500">
                From{" "}
                <a
                  href="https://sapphire.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                >
                  Sapphire Consulting Service
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium text-gray-700">Authenticating...</p>
            <p className="text-sm text-gray-500">Please wait while we verify your credentials</p>
          </div>
        </div>
      )}
    </div>
  )
}
