"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Download, Play, Save, FileText } from "lucide-react"
import DatabaseConnectionForm from "./database-connection-form"
import QueryEditor from "./query-editor"
import ResultsTable from "./results-table"
import type { ConnectionConfig } from "../types"

export default function JsonConverterContent() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [queryResults, setQueryResults] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tableName, setTableName] = useState<string>("")
  const [query, setQuery] = useState<string>("")
  const [isQueryLoading, setIsQueryLoading] = useState(false)

  const handleConnect = async (config: ConnectionConfig) => {
    setIsLoading(true)
    setConnectionError(null)

    try {
      const response = await fetch("/api/json-converter/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        setConnectionConfig(config)
        setConnectionError(null)
      } else {
        setIsConnected(false)
        setConnectionError(data.error || "Failed to connect to database")
      }
    } catch (error) {
      setIsConnected(false)
      setConnectionError("Connection error: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setConnectionConfig(null)
    setQueryResults(null)
    setTableName("")
  }

  const executeQuery = async (sql: string) => {
    if (!connectionConfig) return

    setIsQueryLoading(true)
    setQueryResults(null)
    setConnectionError(null)

    try {
      // Try to extract table name from query
      const tableNameMatch = sql.match(/from\s+([^\s,;()]+)/i)
      const extractedTableName = tableNameMatch ? tableNameMatch[1].replace(/[`"'[\]]/g, "") : "results"
      setTableName(extractedTableName)

      const response = await fetch("/api/json-converter/execute-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: connectionConfig,
          query: sql,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setQueryResults(data.results)
      } else {
        setConnectionError(data.error || "Failed to execute query")
      }
    } catch (error) {
      setConnectionError("Query error: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsQueryLoading(false)
    }
  }

  const downloadJson = () => {
    if (!queryResults || queryResults.length === 0) return

    // Format the JSON according to the specified structure
    const jsonData = {
      [tableName]: queryResults,
    }

    // Create a blob and download link
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${tableName}_export.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const saveQuery = () => {
    // Save the current query to localStorage
    if (query) {
      const savedQueries = JSON.parse(localStorage.getItem("saved-queries") || "[]")
      savedQueries.push({
        id: Date.now(),
        query,
        date: new Date().toISOString(),
      })
      localStorage.setItem("saved-queries", JSON.stringify(savedQueries))
      alert("Query saved successfully!")
    }
  }

  const downloadProtocolDocument = () => {
    // Create a link to download the protocol document
    const link = document.createElement("a")
    link.href = "/documents/data-upload-protocol.pdf"
    link.download = "Data-Upload-Protocol-Document.pdf"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Connection */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-700 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <DatabaseConnectionForm
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={isConnected}
              isLoading={isLoading}
              connectionConfig={connectionConfig}
            />

            {connectionError && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{connectionError}</AlertDescription>
              </Alert>
            )}

            {isConnected && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Connected to {connectionConfig?.database} on {connectionConfig?.server}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Query and Results */}
      <div className="lg:col-span-2">
        {/* Data Upload Protocol Document Section */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardHeader className="bg-green-100 border-b border-green-200">
            <CardTitle className="text-green-700 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Data Upload Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm text-green-800">
                Download the official data upload protocol document that contains detailed guidelines, data formats,
                validation rules, and best practices for uploading data to the National Open Data Portal.
              </p>
              <p className="text-xs text-green-600">
                This document includes table schemas, field definitions, data validation requirements, and step-by-step
                upload procedures.
              </p>
              <Button
                onClick={downloadProtocolDocument}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Data Upload Protocol Document
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-700 flex items-center justify-between">
              <div className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                SQL Query Editor
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={saveQuery} disabled={!query || isLoading || !isConnected}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Query
                </Button>
                <Button
                  size="sm"
                  onClick={() => query && executeQuery(query)}
                  disabled={!isConnected || isQueryLoading || !query}
                >
                  {isQueryLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <QueryEditor
              value={query}
              onChange={setQuery}
              onExecute={executeQuery}
              isDisabled={!isConnected || isQueryLoading}
              isQueryLoading={isQueryLoading}
            />
          </CardContent>
        </Card>

        {queryResults && (
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="text-green-700 flex items-center justify-between">
                <div>Results ({queryResults.length} rows)</div>
                <Button
                  onClick={downloadJson}
                  disabled={queryResults.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ResultsTable results={queryResults} />
            </CardContent>
          </Card>
        )}
      </div>
      {/* Query Loading Overlay */}
      {isQueryLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium text-gray-700">Executing Query...</p>
            <p className="text-sm text-gray-500">Please wait while we process your SQL query</p>
          </div>
        </div>
      )}
    </div>
  )
}
