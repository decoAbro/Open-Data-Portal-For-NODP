interface TableUploadTrackerProps {
  username: string
  password: string
  hasUploadPermission: boolean
  hasUploaded: boolean
  uploadDeadline: string | null
}

interface InstitutionSummary {
  totalInstitutions: number
  byLevel: { [key: string]: number }
  byGender: { [key: string]: number }
  byLocation: { [key: string]: number }
  ByFunctionalStatus: { [key: string]: number }
  bySector: { [key: string]: number }
  bySchoolCommittee: { [key: string]: number }
  byMedium: { [key: string]: number }
  byShift: { [key: string]: number }
  byKind: { [key: string]: number }
  byManagement: { [key: string]: number }
}

interface TeachersProfileSummary {
  totalTeachers: number
  byGender: { [key: string]: number }
  byBasicPayScale: { [key: string]: number }
  byAcademicQualification: { [key: string]: number }
  byProfessionalQualification: { [key: string]: number }
  byDesignation: { [key: string]: number }
  byNatureOfService: { [key: string]: number }
  byDifficultyType: { [key: string]: number }
  byDifficultyCategory: { [key: string]: number }
}

interface EnrolAgeWiseSummary {
  TotalNumberofRows: number
  byclass: { [key: string]: number }
  bygender: { [key: string]: number }
  byage: { [key: string]: number }
  byshift: { [key: string]: number }
}

interface FacilitiesSummary {
  TotalNumberofRows: number
  bywater: { [key: string]: number }
  byelectricity: { [key: string]: number }
  byboundarywall: { [key: string]: number }
  bytoiletstudent: { [key: string]: number }
  bytoiletstaff: { [key: string]: number }
  bytelephone: { [key: string]: number }
  bygas: { [key: string]: number }
  byinternet: { [key: string]: number }
  bylibrary: { [key: string]: number }
  byhall: { [key: string]: number }
  byplayground: { [key: string]: number }
  bycanteen: { [key: string]: number }
  byhostel: { [key: string]: number }
  bystore: { [key: string]: number }
  byhomeEconlab: { [key: string]: number }
  byzoologylab: { [key: string]: number }
  bybiologylab: { [key: string]: number }
  bycomputerlab: { [key: string]: number }
  bychemistrylab: { [key: string]: number }
  bycombinedlab: { [key: string]: number }
  byphysicslab: { [key: string]: number }
  bybotanylab: { [key: string]: number }
  byEMcomputers: { [key: string]: number }
  byEmprinter: { [key: string]: number }
}