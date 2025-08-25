"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, CheckCircle, XCircle, Loader2 } from "lucide-react"
import type { ConnectionConfig } from "../types"

interface DatabaseConnectionFormProps {
  onConnect: (connection: ConnectionConfig) => void
  onDisconnect: () => void
  isConnected: boolean
  connectionConfig: ConnectionConfig | null
  isLoading?: boolean
}

export default function DatabaseConnectionForm({
  onConnect,
  onDisconnect,
  isConnected,
  connectionConfig,
  isLoading = false,
}: DatabaseConnectionFormProps) {
  const [formData, setFormData] = useState<ConnectionConfig>({
    type: "sqlserver",
    server: "localhost",
    port: "1433",
    database: "",
    username: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoading) {
      onConnect(formData)
    }
  }

  const handleDisconnect = () => {
    if (!isLoading) {
      onDisconnect()
    }
  }

  const handleTypeChange = (value: string) => {
    setFormData({
      ...formData,
      type: value,
      port: value === "postgresql" ? "5432" : "1433",
    })
  }

  return (
    <div className="space-y-6">
      {isConnected && connectionConfig && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Connected to:</strong> {connectionConfig.type}://{connectionConfig.server}:{connectionConfig.port}/
            {connectionConfig.database}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Database Type</Label>
                <Select value={formData.type} onValueChange={handleTypeChange} disabled={isConnected || isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server">Server</Label>
                <Input
                  id="server"
                  value={formData.server}
                  onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                  placeholder="localhost or server IP"
                  disabled={isConnected || isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder={formData.type === "postgresql" ? "5432" : "1433"}
                  disabled={isConnected || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Input
                  id="database"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  placeholder="database_name"
                  required
                  disabled={isConnected || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                  required
                  disabled={isConnected || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="password"
                  disabled={isConnected || isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              {isConnected ? (
                <Button type="button" variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              ) : (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
