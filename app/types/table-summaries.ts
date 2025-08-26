// Base interface for all table summaries
export interface BaseSummary {
  totalRecords: number;
}

// Existing Institution Summary
export interface InstitutionSummary extends BaseSummary {
  byLevel: { [key: string]: number };
  byGender: { [key: string]: number };
  byLocation: { [key: string]: number };
}

// Template for other table summaries - will be updated as we add more tables
export type TableSummary = InstitutionSummary | BaseSummary;

// Function to determine if a summary is for a specific table
export function isInstitutionSummary(summary: TableSummary): summary is InstitutionSummary {
  return 'byLevel' in summary && 'byGender' in summary && 'byLocation' in summary;
}
