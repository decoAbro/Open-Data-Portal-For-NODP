
import React, { useEffect, useState } from 'react';

interface UploadRecord {
  id: number;
  username: string;
  tableName: string;
  filename: string;
  fileSizeBytes: number;
  recordCount: number;
  uploadDate: string;
  censusYear: string;
  status: string;
  errorMessage?: string;
  json_data?: string | null;
  pdf_file?: string | null;
}

const ApprovalVerification: React.FC = () => {
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/upload-history-admin');
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      setRecords(data.uploadHistory || []);
    } catch (e: any) {
      setError(e.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch('/api/upload-history-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status');
      }
      await fetchRecords();
    } catch (e: any) {
      setError(e.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const reviewRecords = records.filter(record => record.status === 'in review');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Approval and Verification</h2>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : reviewRecords.length === 0 ? (
        <p>No records in review.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Username</th>
              <th className="border px-4 py-2">Table</th>
              <th className="border px-4 py-2">Filename</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviewRecords.map(record => (
              <tr key={record.id}>
                <td className="border px-4 py-2">{record.id}</td>
                <td className="border px-4 py-2">{record.username}</td>
                <td className="border px-4 py-2">{record.tableName}</td>
                <td className="border px-4 py-2">{record.filename}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                    disabled={updatingId === record.id}
                    onClick={() => updateStatus(record.id, 'approved')}
                  >
                    {updatingId === record.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                    disabled={updatingId === record.id}
                    onClick={() => updateStatus(record.id, 'rejected')}
                  >
                    {updatingId === record.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApprovalVerification;
