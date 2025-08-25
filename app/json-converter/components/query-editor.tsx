"use client"

interface QueryEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute: (query: string) => void
  isDisabled: boolean
  isQueryLoading?: boolean
}

export default function QueryEditor({
  value,
  onChange,
  onExecute,
  isDisabled,
  isQueryLoading = false,
}: QueryEditorProps) {
  return (
    <div className="flex flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled || isQueryLoading}
        className={`w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          isDisabled || isQueryLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
        placeholder="Enter your SQL query here..."
      />
      <button
        onClick={() => onExecute(value)}
        disabled={isDisabled || isQueryLoading}
        className={`mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
          isDisabled || isQueryLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Execute Query
      </button>
    </div>
  )
}
