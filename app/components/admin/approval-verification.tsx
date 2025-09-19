import React from 'react';

interface Record {
  id: string;
  name: string;
  status: string;
  // Add other relevant fields
}

interface ApprovalVerificationProps {
  records: Record[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ApprovalVerification: React.FC<ApprovalVerificationProps> = ({ records, onApprove, onReject }) => {
  const reviewRecords = records.filter(record => record.status === 'in review');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Approval and Verification</h2>
      {reviewRecords.length === 0 ? (
        <p>No records in review.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviewRecords.map(record => (
              <tr key={record.id}>
                <td className="border px-4 py-2">{record.id}</td>
                <td className="border px-4 py-2">{record.name}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    onClick={() => onApprove(record.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => onReject(record.id)}
                  >
                    Reject
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
