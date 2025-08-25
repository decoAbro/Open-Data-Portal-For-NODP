"use client"
import { useState } from "react"
import JsonConverterContent from "./components/json-converter-content"
import type { ConnectionConfig } from "./types"

export default function JsonConverterPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [queryResults, setQueryResults] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tableName, setTableName] = useState<string>("")
  const [query, setQuery] = useState<string>("")

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

    setIsLoading(true)
    setQueryResults(null)

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
      setIsLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">JSON Converter</h1>
          <p className="text-gray-600">Connect to your database, run queries, and download results in JSON format.</p>
        </div>

        <JsonConverterContent
          isConnected={isConnected}
          isLoading={isLoading}
          connectionConfig={connectionConfig}
          connectionError={connectionError}
          queryResults={queryResults}
          tableName={tableName}
          query={query}
          handleConnect={handleConnect}
          handleDisconnect={handleDisconnect}
          executeQuery={executeQuery}
          downloadJson={downloadJson}
          saveQuery={saveQuery}
          setQuery={setQuery}
        />
      </div>
    </div>
  )
}
