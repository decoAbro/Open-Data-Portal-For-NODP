"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Database, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface DatabaseStatus {
  success: boolean
  message?: string
  tableExists?: boolean
  userCount?: number
  server?: string
  database?: string
  error?: string
  details?: string
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)
  // Add a new state for alternative connection
  const [tryingAlt, setTryingAlt] = useState(false)

  // Update the checkConnection function with retry logic
  const checkConnection = async () => {
    setLoading(true)
    setStatus({
      success: false,
      message: "Testing connection...",
    })

    try {
      // Try up to 3 times with a delay between attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Connection attempt ${attempt} of 3...`)
          const response = await fetch("/api/test-connection")
          const data = await response.json()
          setStatus(data)
          break // Success, exit the retry loop
        } catch (error) {
          if (attempt === 3) throw error // Last attempt failed

          // Wait before next attempt (1 second, then 3 seconds)
          const delay = attempt === 1 ? 1000 : 3000
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    } catch (error) {
      setStatus({
        success: false,
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a function to try alternative connection
  const tryAlternativeConnection = async () => {
    setTryingAlt(true)
    try {
      const response = await fetch("/api/test-connection-alt")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        success: false,
        error: "Failed to test alternative connection",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTryingAlt(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader className="bg-blue-50 border-b">
        <CardTitle className="text-blue-700 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Connection Status
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={tryAlternativeConnection} disabled={tryingAlt || loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${tryingAlt ? "animate-spin" : ""}`} />
              Try Alternative Method
            </Button>
            <Button variant="outline" size="sm" onClick={checkConnection} disabled={loading || tryingAlt}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Test Connection
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {/* Update the CardContent section to show more detailed troubleshooting information */}
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span>Testing database connection...</span>
          </div>
        ) : status ? (
          <div className="space-y-4">
            {status.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Database Connected Successfully!</strong>
                  <br />
                  Server: {status.server}
                  <br />
                  Database: {status.database}
                  <br />
                  Users table: {status.tableExists ? "✅ Exists" : "❌ Not found"}
                  {status.tableExists && (
                    <>
                      <br />
                      User count: {status.userCount}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Database Connection Failed</strong>
                  <br />
                  Error: {status.error}
                  {status.details && (
                    <>
                      <br />
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Technical Details</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-red-50 p-2 rounded border border-red-200">
                          {status.details}
                        </pre>
                      </details>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!status.success && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Troubleshooting Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure SQL Server is running on 192.168.1.28</li>
                  <li>• Verify the database "Stage" exists</li>
                  <li>• Check if user "Stage" has proper permissions</li>
                  <li>• Ensure network connectivity to the database server</li>
                  <li>• Check if SQL Server is configured to allow remote connections</li>
                  <li>• Verify SQL Server is listening on the default port (1433)</li>
                  <li>• Check if any firewall is blocking the connection</li>
                  <li>• Try specifying a different port if the server uses a non-standard port</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">Click "Test Connection" to check database status</div>
        )}
      </CardContent>
    </Card>
  )
}
