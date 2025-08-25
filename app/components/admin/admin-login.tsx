"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ShieldAlert } from "lucide-react"
import Image from "next/image"

interface AdminLoginProps {
  onLogin: (username: string, password: string) => void
  error?: string
}

export default function AdminLogin({ onLogin, error }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setLocalError("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setLocalError("")

    setTimeout(() => {
      setIsLoading(false)
      onLogin(username, password)
    }, 1000)
  }

  const displayError = error || localError

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <Image
                src="/pie-logo.png"
                alt="Pakistan Institute of Education"
                width={120}
                height={120}
                className="object-contain mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold text-blue-600 mb-2">National Open Data Portal</h1>
              <p className="text-green-600 font-medium">Administrator Panel</p>
              <div className="flex items-center justify-center mt-4 bg-amber-50 p-2 rounded-md">
                <ShieldAlert className="h-4 w-4 text-amber-600 mr-2" />
                <p className="text-amber-700 text-sm">Restricted access for authorized personnel only</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Admin Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Admin Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              </div>

              {displayError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{displayError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Authenticating...
                  </>
                ) : (
                  "Access Admin Panel"
                )}
              </Button>
            </form>

            {/* Note */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> This panel is for system administrators only. Regular users
                should use the standard login page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
