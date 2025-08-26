import { InstitutionSummary, BaseSummary, TableSummary } from "../types/table-summaries";

// Mapping types
interface IdMapping {
  [key: string]: string;
}

// Existing Institution mappings
const institutionMappings: { [key: string]: IdMapping } = {
  levelMappings: {
    "0": "Not Reported",
    "1": "Pre-Primary",
    "2": "Mosque",
    "3": "Primary",
    "4": "Middle/Elementary",
    "5": "High/Secondary",
    "6": "Higher Secondary",
    "7": "Inter. College",
    "8": "Degree College",
    "9": "General University",
    "10": "Industrial School",
    "11": "Village Workshop",
    "12": "Postgraduate Colleges",
    "13": "Other Colleges",
  },
  genderMappings: {
    "0": "Not Reported",
    "1": "Boys Institution",
    "2": "Girls Institution",
    "3": "Mix Institution",
  },
  locationMappings: {
    "0": "Not Reported",
    "1": "Rural",
    "2": "Urban",
  },
};

// Analysis functions for each table type
export function analyzeInstitutionData(data: any[]): InstitutionSummary {
  const summary: InstitutionSummary = {
    totalRecords: data.length,
    byLevel: {},
    byGender: {},
    byLocation: {},
  };

  data.forEach((institution) => {
    // Count by Level_Id with proper mapping
    const levelId = String(institution.level_Id || institution.Level_Id || "Unknown");
    const levelLabel = institutionMappings.levelMappings[levelId] || `Unknown Level Id (${levelId})`;
    summary.byLevel[levelLabel] = (summary.byLevel[levelLabel] || 0) + 1;

    // Count by Gender_Id with proper mapping
    const genderId = String(institution.gender_Id || institution.Gender_Id || "Unknown");
    const genderLabel = institutionMappings.genderMappings[genderId] || `Unknown Gender Id (${genderId})`;
    summary.byGender[genderLabel] = (summary.byGender[genderLabel] || 0) + 1;

    // Count by Location_Id with proper mapping
    const locationId = String(institution.location_Id || institution.Location_Id || "Unknown");
    const locationLabel = institutionMappings.locationMappings[locationId] || `Unknown Location Id (${locationId})`;
    summary.byLocation[locationLabel] = (summary.byLocation[locationLabel] || 0) + 1;
  });

  return summary;
}

// Generic analyzer for tables without specific analysis needs
function analyzeGenericData(data: any[]): BaseSummary {
  return {
    totalRecords: data.length,
  };
}

// Main analysis function that handles all table types
export function analyzeTableData(tableName: string, data: any[]): TableSummary {
  switch (tableName) {
    case "Institutions":
      return analyzeInstitutionData(data);
    // Add cases for other tables as we implement them
    default:
      return analyzeGenericData(data);
  }
}
