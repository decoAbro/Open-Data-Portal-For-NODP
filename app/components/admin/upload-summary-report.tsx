import React from "react";

const UploadSummaryReport: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-blue-700">Upload Summary Report</h2>
      <p className="text-gray-700 mb-2">This section will display a summary of all uploads, including status, counts, and other relevant details.</p>
      {/* TODO: Add summary table or charts here */}
      <div className="border rounded-lg p-4 bg-gray-50 text-gray-600">
        Upload summary report content goes here.
      </div>
    </div>
  );
};

export default UploadSummaryReport;
