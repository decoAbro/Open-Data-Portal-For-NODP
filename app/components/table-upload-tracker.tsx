"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, FileJson, AlertCircle, BarChart3, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getTablesList,
  getTableUploadsByUsername,
  addTableUploadRecord,
  getCurrentYear,
  getUploadWindowStatus,
  updateUserByUsername,
} from "../utils/storage"
import { downloadElementAsPDF } from "@/utils/download-pdf"

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

export default function TableUploadTracker({
  username,
  password,
  hasUploadPermission,
  hasUploaded,
  uploadDeadline,
}: TableUploadTrackerProps) {
  const [uploadedTables, setUploadedTables] = useState<string[]>([])
  const [dataNotAvailableTables, setDataNotAvailableTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationContent, setNotificationContent] = useState<{
    title: string;
    message: React.ReactNode;
    type: 'success' | 'error' | 'info';
  } | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedJsonData, setParsedJsonData] = useState<any>(null)
  const [institutionSummary, setInstitutionSummary] = useState<InstitutionSummary | null>(null)
  const [TeachersProfileSummary, setTeachersProfileSummary] = useState<TeachersProfileSummary | null>(null)
  const [EnrolAgeWiseSummary, setEnrolAgeWiseSummary] = useState<EnrolAgeWiseSummary | null>(null)
  const [FacilitiesSummary, setFacilitiesSummary] = useState<FacilitiesSummary | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const pdfMetaRef = useRef<HTMLDivElement>(null)

  const tables = getTablesList()
  const [currentYear, setCurrentYear] = useState("")

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initial setup
  useEffect(() => {
    if (!isClient) return

    const setInitialYear = async () => {
      // First try to get the year from the server
      const status = await getUploadWindowStatus();
      if (status.year) {
        setCurrentYear(status.year);
      } else {
        // Fall back to local storage if server doesn't have a year set
        setCurrentYear(getCurrentYear());
      }
    };

    setInitialYear();
  }, [isClient])

  useEffect(() => {
    if (!isClient || !currentYear) return

    const loadData = async () => {
      // Load uploaded tables for this user
      const userUploads = getTableUploadsByUsername(username)
      const uploadedTableNames = userUploads
        .filter((upload) => upload.year === currentYear)
        .map((upload) => upload.tableName)
      setUploadedTables(uploadedTableNames)

      // Load data not available tables for this user
      const dataNotAvailableRecords = JSON.parse(localStorage.getItem("pie-portal-data-not-available") || "[]")
      const userDataNotAvailable = dataNotAvailableRecords
        .filter((record: any) => record.username === username && record.year === currentYear)
        .map((record: any) => record.tableName)
      setDataNotAvailableTables(userDataNotAvailable)

      // Check upload window status from server
      const windowStatus = await getUploadWindowStatus();
      if (windowStatus.year && windowStatus.year !== currentYear) {
        // Year has changed, update local state
        setCurrentYear(windowStatus.year);
      }
      
      // Update permissions based on window status
      if (!windowStatus.isOpen) {
        updateUserByUsername(username, { uploadPermission: false, uploadDeadline: undefined });
      } else {
        updateUserByUsername(username, { 
          uploadPermission: true, 
          uploadDeadline: windowStatus.deadline || undefined 
        });
      }
    }

    loadData();

    // Set up polling to check upload window status
    const intervalId = setInterval(loadData, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isClient, username, currentYear])

  // Calculate progress (uploaded + data not available = completed)
  const completedTables = uploadedTables.length + dataNotAvailableTables.length
  const progress = tables.length > 0 ? (completedTables / tables.length) * 100 : 0

  // Analyze Institution data for preview
  const analyzeInstitutionData = (data: any[]): InstitutionSummary => {
    // Level ID mappings
    const levelMappings: { [key: string]: string } = {
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
    }

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
    }

    // Location ID mappings
    const locationMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Rural",
      "2": "Urban",
    }

    // Functional Status ID mappings
    const StatusMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Functional",
      "2": "Non-Functional",
      "3": "Closed",
      "4": "Merged",
      "5": "Shifted",
      "6": "Denationalized",
      "7": "Consolidated",
    }

    // Sector ID mappings
    const SectorMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Public",
      "2": "Other Public",
      "3": "Private",
    }

    // School Committee ID mappings
    const committeeMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes (PTA/PTC/SMC etc.)",
      "2": "No",
    }

    // Medium ID mappings
    const mediumMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Urdu",
      "2": "English",
      "3": "Arabic",
      "4": "Sindhi",
      "5": "Pushto",
      "6": "Punjabi",
      "7": "Balochi",
      "8": "Others",
      "9": "Urdu and English",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }

    // Kind ID mappings
    const kindMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "EMIS",
      "2": "Private",
      "3": "Colleges",
      "4": "Technical and Vocation Education (TVET)",
      "5": "Higher Education",
      "6": "Deeni Madaris",
      "7": "Education Foundation",
      "8": "Non-Formal Education",
      "9": "Special Education",
      "10": "Teacher Training",
      "11": "Other Public",
      "12": "Distance Learning",
    }

    // Management ID mappings
    const managementMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "School Education Department, Government of Punjab ",
      "2": "School Education Department, Government of Balochistan",
      "3": "Elementary & Secondary Education Department, Government of AJ&K",
      "4": "School Education Department, Government of Gilgit Baltistan",
      "5": "School Education and Literacy Department, Government of Sindh",
      "6": "Elementary and Secondary Education Department, Government of KPK",
      "7": "Federal Directorate of Education, Islamabad",
      "8": "AJ&K Private Schools Regulatory Authority, Government of AJ&K ",
      "9": "Sindh Directorate of Private Institutions, Government of Sindh",
      "10": "KPK Private Schools Regulatory Authority, Government of KP",
      "11": "Private Educational Institutions Regulatory Authority (PEIRA), Islamabad",
      "12": "Higher Education Department, KPK, Peshawar",
      "13": "Higher Education Regulatory Authority, Peshawar",
      "14": "Colleges, Higher & Technical Education Department Balochistan, Quetta",
      "15": "Higher Education Department Punjab, Lahore",
      "16": "Colleges Education Department Sindh, Karachi",
      "17": "Directorate of Colleges GB, Gilgit",
      "18": "Higher Education Department, Muzaffarabad",
      "19": "National Vocational and Technical Training Commission",
      "20": "Higher Education Commission, Islamabad",
      "21": "Wafaq-ul-Madaris Al-Arabiya Pakistan, Multan",
      "22": "Wafaq-ul-Madaris Al-Shiya, Pakistan",
      "23": "Tanzeem Al-Madaris Ahl-e-Sunnat, Jamia Anwar ul Uloom, Lahore",
      "24": "Wafaq-ul-Madaris, Jamia Salfia, Shaikhupra, Faislabad",
      "25": "Rabta Tul Madaris Al Islamia Pakistan, Multan Road, Lahore",
      "26": "Ittehad-ul-Madaris Al Arbia, Pakistan Mardan",
      "27": "Nizam Ul Madaris Pakistan, Lahore",
      "28": "Majma Ul Madaris Taleem Al Kitab wal Hikmata, Lahore",
      "29": "Wafaq Ul Madaris Al Islamia Al Rizvia, Pakistan, Lahore",
      "30": "Ittehad Al Madaris Al Islamia, Pakistan, Karachi",
      "31": "Jamia Dar Ul Aloom Karachi",
      "32": "Al Jamia Al Ashrafia, Lahore, Pakistan",
      "33": "Jamia Saddiquia Karachi, Karachi",
      "34": "Jamia Taleemat Islamia, Faisalabad",
      "35": "Dar Ul Uloom Muhammadia Ghousia, Sargodha",
      "36": "Tahreeke Minhaj Ul Quran (College of Sharia) Lahore",
      "37": "Jamia Al Rasheed, Karachi",
      "38": "Dar Ul Uloom Jamia Naeemia, Lahore",
      "39": "Jamia Al Madina (Faizan -e- Madina) Global Islamic Centre, International Madni Markaz, Karachi",
      "40": "Jamia Al Darasat Al Islamia, Karachi",
      "41": "Jamia Al Uloom Al Islamia (Bannoria) Karachi",
      "42": "Ittehad Ul Madaris Al Arbia Pakistan Lahore",
      "43": "Majma Al Uloom Al Islamia, Karachi",
      "44": "Board of Islamic Education, Bahawalpur",
      "45": "Kinz Ul Madaris Global Madni Markaz, Faizan E Madina, Karachi",
      "46": "Dar Ul Uloom Haqania, Akora Khattak, Nowshera, KP",
      "47": "Directorate General of Religious Education (DGRE)",
      "48": "National Education Foundation, Islamabad",
      "49": "Punjab Education Foundation",
      "50": "Sindh Education Foundation, Karachi",
      "51": "Balochistan Education Foundation, Quetta",
      "52": "KP Elementary and Secondary Education Foundation, Peshawar",
      "53": "Punjab Literacy and NFBE Department, Lahore",
      "54": "Directorate of Basic Education Community Schools, Islamabad",
      "55": "National Commission for Human Development",
      "56": "Directorate General of Special Education, Islamabad",
      "57": "Special Education Department, Punjab, Lahore",
      "58": "Department for Empowerment of Persons with Disabilities, Government of Sindh, Karachi",
      "59": "Social Welfare Department, Government of KPK",
      "60": "Social Welfare and Special Education, Government of Gilgit Baltistan",
      "61": "Social Welfare and Special Education, Government of AJ&K",
      "62": "Social Welfare, Special Education and Human Rights Department, Quetta, Balochistan",
      "63": "Quaid-e-Azam Academy for Educational Development (QAED) Punjab, Lahore",
      "64": "Sindh Teacher Education Development Authority (STEDA), Karachi",
      "65": "Directorate of Professional Development (DPD) KP, Peshawar",
      "66": "Provincial Institution for Teacher Education (PITE) Balochistan, Quetta",
      "67": "Teacher Training Institution AJ&K, Muzaffarabad",
      "68": "Federal Govt. Educational Institutions (C/G) Directorate, Rawalpindi Cantt.",
      "69": "Divisional Public School & Inter Colleges, Rawalpindi",
      "70": "Divisional Public School & Inter Colleges, Sargodha",
      "71": "Quaid-e-Azam, Divisional Public School & College, Gujranwala",
      "72": "Divisional Public School & Inter Colleges, Faisalabad",
      "73": "Divisional Public School & Inter Colleges, Lahore",
      "74": "Divisional Public School & Inter Colleges, Sahiwal",
      "75": "Divisional Public School & Inter Colleges, DG Khan",
      "76": "Divisional Public School & Inter Colleges, Multan",
      "77": "Divisional Public School & Inter Colleges, Bahawalpur",
      "78": "Overseas Pakistanis Foundation, Islamabad",
      "79": "Pakistan Railways, Lahore",
      "80": "Pakistan Steel, Karachi",
      "81": "Pakistan Water & Power Development Authority (WAPDA)",
      "82": "Pakistan Atomic Energy Commission, Islamabad",
      "83": "Pakistan Ordnance Factories POF, Wah Cantt",
      "84": "Danish Schools and Centres of Excellence",
      "85": "Bahria Foundation, Karachi",
      "86": "Pakistan Airforce (PAF)",
      "87": "National Police Foundation, Islamabad",
      "88": "Telecom Foundation, Islamabad",
      "89": "Pakistan Bait-ul-Mall, Islamabad",
      "90": "Pakistan Rangers, Karachi ",
      "91": "Pakistan Navy, Karachi",
      "92": "Fauji Foundation Schools System",
      "93": "Army Public School & Colleges System Secretariat (APSACS), Rawalpindi",
      "94": "Mines Mineral Development Department, Govt. Sindh, Karachi",
      "95": "Minerals Development Department, Government of Khyber Pakhtunkhwa, Civil Secretariat, Peshawar",
      "96": "Mines & Minerals Development Department, Government of Balochistan, Quetta",
      "97": "Mines & Minerals Department, Government of Punjab, Lahore",
      "98": "Directorate of Mines & Minerals, Government of Gilgit-Baltistan, Gilgit",
      "99": "Merged Areas Education Foundation, KP",
      "100": "Alternate Learning Pathways-Project Implementation Unit (ALP-PIU), KP",
      "101": "Private Education Providers Registration Information System (PEPRIS), School Education Department, Punjab",
      "102": "Directorate of Literacy & Non-Formal Education, Sindh",
      "103": "Literacy & Non-Formal Basic Education Department, Punjab",
      "104": "Directorate of Literacy & Non-Formal Education, Balochistan",
      "111": "Divisional Public School & Inter College",
      "112": "Cadet College Choa Saiden shah Chakwal",
      "113": "Cadet College Fateh Jhang",
      "114": "Cadet College Kallar Kahar",
      "115": "Cadet College Kohat",
      "116": "Cadet College Petaro",
      "117": "Cadet College Larkana",
      "118": "Baqai Cadet College Karachi",
      "119": "Govt. Cadet College Pano Akil",
      "120": "Kernal Sher Khan Cadet College KSKCC Swabi",
      "121": "Cadet College Sargodha",
      "122": "Cadet College Ghotki Sindh",
      "123": "Shaheed Benazir Bhutto Girls Cadet College Larkana",
      "124": "Rangers Cadet College Chakri Rawalpindi",
      "125": "Cadet College Karampur Kashmore",
      "126": "Cadet College Mirpur",
      "127": "Cadet College Muzaffarabad (AJ&K)",
      "128": "Cadet College Hassanabdal",
      "129": "Cadet College Okara",
      "130": "Wapda Cadet College Tarbela",
      "131": "Cadet College Skardu",
      "132": "Pakistan Scouts cadet College Batrasi Mansehra",
      "133": "Cadet College Spinkai",
      "134": "Cadet College Mastung",
      "135": "Muhammadian Cadet College Mohmand Gat",
      "136": "Cadet College Faisalabad",
      "137": "Cadet College Esakhel, Mianwali",
      "138": "Cadet College Hub",
      "139": "Cadet College Rawalpindi",
      "140": "Cadet College Khushab",
      "141": "Cadet College Khairpur",
      "142": "Cadet College Razmak North Waziristan",
      "143": "Cadet College Swat",
      "144": "Girls Cadet College Quetta",
      "145": "Sheikha Fatima Bint Mubarak Girls Cadet College Turbat",
      "146": "Cadet College Awaran",
      "147": "Pakistan Steel Cadet College Steel Town, Bin Qasim Karachi",
      "148": "Cadet College Palandri",
      "149": "The Sies Cadet College Kakul Abbottabad",
      "150": "Cadet College Pishin",
      "151": "School Education Department, Government of Balochistan",
      "152": "School Education Department, Government of Gilgit Baltistan",
      "153": "Others",
      "154": "Allama Iqbal Open University (AIOU)",
      "155": "Independent Madaris",
      "156": "Kinz-UL-Madaris Jhang Rd, Faisalabad",
      "157": "Sir Syed Educational Institutions",
      "158": "Punjab Workers Welfare Fund",
      "159": "Punjab Education Initiatives Management Authority (PEIMA)",
      "160": "Wafaq-ul-Madaris-al-Salafia",
      "161": "Education Support Project Secondary Education Department Government of Balochistan",
    }

    const summary: InstitutionSummary = {
      totalInstitutions: data.length,
      byLevel: {},
      byGender: {},
      byLocation: {},
      ByFunctionalStatus: {},
      bySector: {},
      bySchoolCommittee: {},
      byMedium: {},
      byShift: {},
      byKind: {},
      byManagement: {}
    }

    data.forEach((institution) => {
      // Count by Level_Id with proper mapping
      const levelId = String(institution.level_Id || institution.Level_Id || "Unknown")
      const levelLabel = levelMappings[levelId] || `Unknown Level Id (${levelId})`
      summary.byLevel[levelLabel] = (summary.byLevel[levelLabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(institution.gender_Id || institution.Gender_Id || "Unknown")
      const genderLabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.byGender[genderLabel] = (summary.byGender[genderLabel] || 0) + 1

      // Count by Location_Id with proper mapping
      const locationId = String(institution.location_Id || institution.Location_Id || "Unknown")
      const locationLabel = locationMappings[locationId] || `Unknown Location Id (${locationId})`
      summary.byLocation[locationLabel] = (summary.byLocation[locationLabel] || 0) + 1

      // Count by Status_Id with proper mapping
      const FunctionalStatus_Id = String(institution.FunctionalStatus_Id || institution.FunctionalStatus_Id || "Unknown")
      const statusLabel = StatusMappings[FunctionalStatus_Id] || `Unknown Functional Status Id (${FunctionalStatus_Id})`
      summary.ByFunctionalStatus[statusLabel] = (summary.ByFunctionalStatus[statusLabel] || 0) + 1

      // Count by Sector_Id with proper mapping
      const sectorId = String(institution.sector_Id || institution.Sector_Id || "Unknown")
      const sectorLabel = SectorMappings[sectorId] || `Unknown Sector Id (${sectorId})`
      summary.bySector[sectorLabel] = (summary.bySector[sectorLabel] || 0) + 1

      // Count by SchoolCommittee_Id with proper mapping
      const committeeId = String(institution.schoolCommittee_Id || institution.SchoolCommittee_Id || "Unknown")
      const committeeLabel = committeeMappings[committeeId] || `Unknown School Committee Id (${committeeId})`
      summary.bySchoolCommittee[committeeLabel] = (summary.bySchoolCommittee[committeeLabel] || 0) + 1

      // Count by Medium_Id with proper mapping
      const mediumId = String(institution.medium_Id || institution.Medium_Id || "Unknown")
      const mediumLabel = mediumMappings[mediumId] || `Unknown Medium Id (${mediumId})`
      summary.byMedium[mediumLabel] = (summary.byMedium[mediumLabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(institution.shift_Id || institution.Shift_Id || "Unknown")
      const shiftLabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byShift[shiftLabel] = (summary.byShift[shiftLabel] || 0) + 1

      // Count by Kind_Id with proper mapping
      const kindId = String(institution.kind_Id || institution.Kind_Id || "Unknown")
      const kindLabel = kindMappings[kindId] || `Unknown Kind Id (${kindId})`
      summary.byKind[kindLabel] = (summary.byKind[kindLabel] || 0) + 1

      // Count by Management_Id with proper mapping
      const managementId = String(institution.management_Id || institution.Management_Id || "Unknown")
      const managementLabel = managementMappings[managementId] || `Unknown Management Id (${managementId})`
      summary.byManagement[managementLabel] = (summary.byManagement[managementLabel] || 0) + 1
    })

    return summary
  }

  // Analyze Teachers_Profile data for preview
  const analyzeTeachersProfileData = (data: any[]): TeachersProfileSummary => {
    
    // TeacherGender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Male",
      "2": "Female",
      "3": "Transgender",
    }

    // TeacherBasicPayScale ID mappings
    const basicpayscaleMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "BPS 1",
      "2": "BPS 2",
      "3": "BPS 3",
      "4": "BPS 4",
      "5": "BPS 5",
      "6": "BPS 6",
      "7": "BPS 7",
      "8": "BPS 8",
      "9": "BPS 9",
      "10": "BPS 10",
      "11": "BPS 11",
      "12": "BPS 12",
      "13": "BPS 13",
      "14": "BPS 14",
      "15": "BPS 15",
      "16": "BPS 16",
      "17": "BPS 17",
      "18": "BPS 18",
      "19": "BPS 19",
      "20": "BPS 20",
      "21": "BPS 21",
      "22": "BPS 22",
      "23": "Others",
    }

    // TeacherAcademicQualification ID mappings
    const academicqualificationMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Middle",
      "2": "Matric",
      "3": "F.A / F.Sc.",
      "4": "B.A / B.Sc.",
      "5": "M.A / M.Sc.",
      "6": "M.Phil.",
      "7": "Ph.D.",
      "8": "BCS/MCS/BIT/MIT",
      "9": "MBBS/ BDS",
      "10": "MBA",
      "11": "FCPS/FRCP/MRCP/MCPS",
      "12": "M.D",
      "13": "B. Com",
      "14": "M.Com",
      "15": "Others",
    }

    // TeacherProfessionalQualification ID mappings
    const professionalqualificationMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "P.T.C",
      "2": "C.T",
      "3": "B.Ed.",
      "4": "M.ED",
      "5": "Un-Trained",
      "6": "B.S.Ed.",
      "7": "MS Ed.",
      "8": "M. Phil Education",
      "9": "DM/DIE/JDPE/SDPE/MPE",
      "10": "Arabic",
      "11": "ECE",
      "12": "ADE",
      "13": "PTAC",
      "14": "Physical Diploma",
      "15": "Others",
    }

    // TeacherDesignation ID mappings
    const designationMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Principal",
      "2": "Vice Principal",
      "3": "Senior Subject Specialist (English)",
      "4": "Senior Subject Specialist (Urdu)",
      "5": "Senior Subject Specialist (Islamiyat)",
      "6": "Senior Subject Specialist (Pak Study)",
      "7": "Senior Subject Specialist (Civics)",
      "8": "Senior Subject Specialist (History)",
      "9": "Senior Subject Specialist (Economics)",
      "10": "Senior Subject Specialist (Statistics)",
      "11": "Senior Subject Specialist (Pashto)",
      "12": "Senior Subject Specialist (Home Economics)",
      "13": "Senior Subject Specialist (Maths)",
      "14": "Senior Subject Specialist (Physics)",
      "15": "Senior Subject Specialist (Chemistry)",
      "16": "Senior Subject Specialist (Biology)",
      "17": "Senior Subject Specialist (General)",
      "18": "Subject Specialist (English)",
      "19": "Subject Specialist (Urdu)",
      "20": "Subject Specialist (Islamiyat)",
      "21": "Subject Specialist (Pak Study)",
      "22": "Subject Specialist (Civics)",
      "23": "Subject Specialist (History)",
      "24": "Subject Specialist (Economics)",
      "25": "Subject Specialist (Statistics)",
      "26": "Subject Specialist (Pashto)",
      "27": "Subject Specialist (Home Economics)",
      "28": "Subject Specialist (Maths)",
      "29": "Subject Specialist (Physics)",
      "30": "Subject Specialist (Chemistry)",
      "31": "Subject Specialist (Biology)",
      "32": "Subject Specialist (General)",
      "33": "Subject Specialist (Arabic)",
      "34": "Subject Specialist (Auditing)",
      "35": "Subject Specialist (Business Administration)",
      "36": "Subject Specialist (Business Communication)",
      "37": "Subject Specialist (Education)",
      "38": "Subject Specialist (General History)",
      "39": "Subject Specialist (Geography)",
      "40": "Subject Specialist (Geology)",
      "41": "Subject Specialist (Finance)",
      "42": "Subject Specialist (Health and Physical Education)",
      "43": "Subject Specialist (Islamic History)",
      "44": "Subject Specialist (International Relations)",
      "45": "Subject Specialist (Library Science)",
      "46": "Subject Specialist (Mass Communication)",
      "47": "Subject Specialist (Philosophy)",
      "48": "Subject Specialist (Psychology)",
      "49": "Subject Specialist (Public Administration)",
      "50": "Subject Specialist (Sindhi)",
      "51": "Subject Specialist (Sociology)",
      "52": "Subject Specialist (Social Work)",
      "53": "Subject Specialist (Statistics)",
      "54": "Subject Specialist (Special Education)",
      "55": "Subject Specialist (Urdu)",
      "56": "Subject Specialist (Bio Chemistry)",
      "57": "Subject Specialist (Botany)",
      "58": "Subject Specialist (Genetics)",
      "59": "Subject Specialist (Micro Biology)",
      "60": "Subject Specialist (Zoology)",
      "61": "Subject Specialist (Computer Science)",
      "62": "Subject Specialist (Information Technology)",
      "63": "Librarian",
      "64": "Instructor Physical Education",
      "65": "Senior Instructor Physical Education",
      "66": "Chief Instructor Physical Education",
      "67": "Head Master/Mistress",
      "68": "Secondary School Teacher (General)",
      "69": "Secondary School Teacher (Biology)",
      "70": "Secondary School Teacher (Chemistry)",
      "71": "Secondary School Teacher (Math)",
      "72": "Secondary School Teacher (Physics)",
      "73": "Secondary School Teacher (Information Technology)",
      "74": "Secondary School Teacher (Arts)",
      "75": "Secondary School Teacher (Computer Science)",
      "76": "Senior Certificate Teacher",
      "77": "Certificate Teacher",
      "78": "Senior Physical Education Teacher",
      "79": "Physical Education Teacher",
      "80": "Senior Drawing Master",
      "81": "Drawing Master",
      "82": "Senior Arabic Teacher",
      "83": "Arabic Teacher",
      "84": "Senior Theology Teacher",
      "85": "Theology Teacher",
      "86": "Senior Qari / Qaria",
      "87": "Qari / Qaria",
      "88": "Certified Teacher (Information Technology)",
      "89": "Primary School Head Teacher", 
      "90": "Senior Primary School Teacher",
      "91": "Primary School Teacher",
      "92": "Elementary Teacher",
      "93": "Imam",
      "94": "Hostel Superintendent",
      "95": "Assistant",
      "96": "Senior Clerk",
      "97": "Junior Clerk",
      "98": "Store Keeper",
      "99": "Assistant Store Keeper",
      "100": "Senior Lab Assistant",
      "101": "Lab Assistant",
      "102": "Lab Attendant",
      "103": "Driver",
      "104": "Naib Qasid",
      "105": "Cook",
      "106": "Baheshti",
      "107": "Work Inspector",
      "108": "Assistant Work Inspector",
      "109": "Work Shop Attendant",
      "110": "Bearer",
      "111": "Mali",
      "112": "Mai/Caller",
      "113": "Chowkidar",
      "114": "Sweeper",
      "115": "ESE (Arts)",
      "116": "ESE (Science)",
      "117": "Elementary School Teacher (Arabic)",
      "118": "Elementary School Teacher (Drawing)",
      "119": "Elementary School Teacher (English)",
      "120": "Elementary School Teacher (General Arts)",
      "121": "Elementary School Teacher (Science)",
      "122": "Elementary School Teacher (Urdu)",
      "123": "SESE (Physical Education)",
      "124": "SESE (Science)",
      "125": "SESE (Maths)",
      "126": "Senior Head Master",
      "127": "SSE (Science)",
      "128": "SSE (Chemistry)",
      "129": "SSE (Biology)",
      "130": "Junior School Teacher",
      "131": "High School Teacher",
      "132": "Physical Training Instructor",
      "133": "WIT",
      "134": "DT",
      "135": "ECT",
      "136": "Non-Gov’t",
      "137": "Band Master",
      "138": "Subject Specialist",
      "139": "Information Technology Teacher",
      "140": "Junior English Teacher (General)",
      "141": "Junior English Teacher (Technical)",
      "142": "Elementary School Teacher",
      "143": "Lab Incharge (Information Technology)",
      "144": "Library Assistant",
      "145": "Superintendent",
      "146": "Junior Elementary School Teacher",
      "147": "Junior Vernacular Teacher",
      "148": "Office Assistant",
      "149": "Water Carrier",
      "150": "Computer Operator",
      "151": "Lab Superintendent",
      "152": "Lab Supervisor",
      "153": "Governess",
      "154": "Lab Assistant (Information Technology)",
      "155": "Senior Librarian",
      "156": "Subject Specialist",
      "157": "Junior English Teacher",
      "158": "Lab Incharge (Computer)",
      "159": "Others",
    }

    // TeacherNatureOfService ID mappings
    const natureofserviceMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Sanctioned Permanent",
      "2": "Filled Permanent",
      "3": "Sanctioned Contractual",
      "4": "Filled Contractual",
      "5": "Vacant",
    }

    // Teacher Difficulty Type ID mappings
    const difficultytypeMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Seeing, even when wearing glasses",
      "2": "Hearing, even if using a hearing aid",
      "3": "Walking or climbing steps",
      "4": "Remembering or concentrating",
      "5": "Hands & Arms",
      "6": "Speech",
    }

    // Teacher Difficulty Category ID mappings
    const difficultycategoryMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "No Difficulty",
      "2": "Some difficulty",
      "3": "Lot of difficulty",
      "4": "Cannot do at all",
    }

    const summary: TeachersProfileSummary = {
      totalTeachers: data.length,
      byGender: {},
      byBasicPayScale: {},
      byAcademicQualification: {},
      byProfessionalQualification: {},
      byDesignation: {},
      byNatureOfService: {},
      byDifficultyType: {},
      byDifficultyCategory: {}
    }

    data.forEach((Teachers_Profile) => {
      // Count by Gender_Id with proper mapping
      const genderId = String(Teachers_Profile.gender_Id || Teachers_Profile.Gender_Id || "Unknown")
      const genderLabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.byGender[genderLabel] = (summary.byGender[genderLabel] || 0) + 1

      // Count by BasicPayScale_Id with proper mapping
      const BasicPayScaleId = String(Teachers_Profile.BasicPayScale_Id || Teachers_Profile.BasicPayScale_Id || "Unknown")
      const BasicPayScaleLabel = basicpayscaleMappings[BasicPayScaleId] || `Unknown Basic Pay Scale Id (${BasicPayScaleId})`
      summary.byBasicPayScale[BasicPayScaleLabel] = (summary.byBasicPayScale[BasicPayScaleLabel] || 0) + 1

      // Count by AcademicQualification_Id with proper mapping
      const AcademicQualificationId = String(Teachers_Profile.AcademicQualification_Id || Teachers_Profile.AcademicQualification_Id || "Unknown")
      const academicqualificationLabel = academicqualificationMappings[AcademicQualificationId] || `Unknown Academic Qualification Id (${AcademicQualificationId})`
      summary.byAcademicQualification[academicqualificationLabel] = (summary.byAcademicQualification[academicqualificationLabel] || 0) + 1

      // Count by ProfessionalQualification_Id with proper mapping
      const ProfessionalQualificationId = String(Teachers_Profile.ProfessionalQualification_Id || Teachers_Profile.ProfessionalQualification_Id || "Unknown")
      const professionalqualificationLabel = professionalqualificationMappings[ProfessionalQualificationId] || `Unknown Professional Qualification Id (${ProfessionalQualificationId})`
      summary.byProfessionalQualification[professionalqualificationLabel] = (summary.byProfessionalQualification[professionalqualificationLabel] || 0) + 1

      // Count by Designation_Id with proper mapping
      const DesignationId = String(Teachers_Profile.Designation_Id || Teachers_Profile.Designation_Id || "Unknown")
      const designationLabel = designationMappings[DesignationId] || `Unknown Designation Id (${DesignationId})`
      summary.byDesignation[designationLabel] = (summary.byDesignation[designationLabel] || 0) + 1

      // Count by NatureOfService_Id with proper mapping
      const natureofserviceId = String(Teachers_Profile.NatureOfService_Id || Teachers_Profile.NatureOfService_Id || "Unknown")
      const natureofserviceLabel = natureofserviceMappings[natureofserviceId] || `Unknown Nature of Service Id (${natureofserviceId})`
      summary.byNatureOfService[natureofserviceLabel] = (summary.byNatureOfService[natureofserviceLabel] || 0) + 1

      // Count by DifficultyType_Id with proper mapping
      const difficultytypeId = String(Teachers_Profile.DifficultyType_Id || Teachers_Profile.DifficultyType_Id || "Unknown")
      const difficultytypeLabel = difficultytypeMappings[difficultytypeId] || `Unknown Difficulty Type Id (${difficultytypeId})`
      summary.byDifficultyType[difficultytypeLabel] = (summary.byDifficultyType[difficultytypeLabel] || 0) + 1

      // Count by DifficultyCategory_Id with proper mapping
      const difficultycategoryId = String(Teachers_Profile.DifficultyCategory_Id || Teachers_Profile.DifficultyCategory_Id || "Unknown")
      const kindLabel = difficultycategoryMappings[difficultycategoryId] || `Unknown Difficulty Category Id (${difficultycategoryId})`
      summary.byDifficultyCategory[kindLabel] = (summary.byDifficultyCategory[kindLabel] || 0) + 1
    })

    return summary
  }

  // Analyze EnrolAgeWise data for preview
  const analyzeEnrolAgeWisedata = (data: any[]): EnrolAgeWiseSummary => {
    // Class ID mappings
    const classMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "101": "Unadmitted",
      "102": "Kinder Garden (KG)/Montessori",
      "103": "Nursery Class",
      "104": "Prep/ Kachi",
      "105": "ECE",
      "201": "Class 1",
      "202": "Class 2",
      "203": "Class 3",
      "204": "Class 4",
      "205": "Class 5",
      "301": "Class 6",
      "302": "Class 7",
      "303": "Class 8",
      "401": "Class 9 Science Group",
      "402": "Class 9 Arts Group",
      "403": "Class 9 Technical Stream",
      "404": "Class 10 Science Group",
      "405": "Class 10 Arts Group",
      "406": "Class 10 Technical Stream",
      "407": "Class 9 Computer Science",
      "408": "Class 10 Computer Science",
      "409": "Class 9 ",
      "410": "Class 10 ",
      "411": "O Level 1",
      "412": "O Level 2",
      "501": "Class 11 Science Group",
      "502": "Class 11 Arts Group",
      "503": "Class 12 Science Group",
      "504": "Class 12 Arts Group",
      "505": "Class 11 Computer Science ",
      "506": "Class 11 General Science",
      "507": "Class 11 Commerce Group",
      "508": "Class 12 Computer Science",
      "509": "Class 12 General Science",
      "510": "Class 12 Commerce Group",
      "511": "Class 11",
      "512": "Class 12",
      "513": "A Level 1",
      "514": "A Level 2",
      "515": "Class 11 Premedical",
      "516": "Class 12 Premedical",
      "517": "Class 11 Pre_Engineering",
      "518": "Class 12 Pre_Engineering",
      "601": "Class 13 Science Group",
      "602": "Class 13 Arts Group",
      "603": "Class 14 Science Group",
      "604": "Class 14 Arts Group",
      "605": "B.A. Hon.1",
      "606": "B.A. Hon.2",
      "607": "B.A. Hon.3",
      "608": "B.Sc. Hon.1",
      "609": "B.Sc. Hon.2",
      "610": "B.Sc. Hon.3",
      "611": "Class 13",
      "612": "Class 14",
      "613": "B.A. Hon.4",
      "614": "Class 13 Commerce",
      "615": "Class 14 Commerce",
      "616": "Class 13 Computer Science",
      "617": "Class 14 Computer Science",
      "618": "Class 13 General Science",
      "619": "Class 14 General Science",
      "620": "B.Sc. Hon. 4",
      "621": "B. Ed",
      "622": "Die 1St Term",
      "623": "Die 2Nd Term",
      "624": "B. Ed. (Part 1)",
      "625": "B. Ed. (Part 2)",
      "626": "Bs. Ed",
      "627": "Bed (Hons)",
      "628": "ADE",
      "701": "M.A. 1",
      "702": "M.Sc. 1",
      "703": "M.A. 2",
      "704": "M.Sc. 2",
      "705": "Mcs 1",
      "706": "Mcs 2",
      "707": "Class 15 English",
      "708": "Class 15 Geography",
      "709": "Class 15 Mathematics",
      "710": "Class 15 Mass Communication",
      "711": "Class 15 Applied Psychology",
      "712": "Class 15 Islamiyat",
      "713": "Class 15 Urdu",
      "714": "Class 15 Economics",
      "715": "Class 15 Home Economics",
      "716": "Class 16 English",
      "717": "Class 16 Geography",
      "718": "Class 16 Mathematics",
      "719": "Class 16 Mass Communication",
      "720": "Class 16 Applied Psychology",
      "721": "Class 16 Islamiyat",
      "722": "Class 16 Urdu",
      "723": "Class 16 Economics",
      "724": "Class 16 Home Economics",
      "725": "M. Ed",
      "726": "Class 15",
      "727": "Class 16",
      "728": "BS (YEAR 1)",
      "729": "BS (YEAR 2)",
      "730": "BS (YEAR 3)",
      "731": "BS (YEAR 4)",
      "801": "M.Phil.",
      "901": "Ph.D.",
      "902": "Playgroup",
      "1001": "Ihc Courses",
      "1005": "سال اول",
      "1006": "سال دوم",
      "1007": "سال سوم",
      "1008": "سال چہارم",
      "1009": "سال پنجم",
      "1010": "حفظِ قرآن",
      "1011": "تجوید و قراءت",
    }

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys",
      "2": "Girls",
      "3": "Transgender",
    }

    // Age ID mappings
    const ageMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Less than 3",
      "2": "3",
      "3": "4",
      "4": "5",
      "5": "6",
      "6": "7",
      "7": "8",
	    "8": "9",
      "9": "10",
	    "10": "11",
      "11": "12",
      "12": "13",
      "13": "14",
      "14": "15",
      "15": "16",
      "16": "17",
      "17": "18",
      "18": "19",
      "19": "20",
      "20": "21",
      "21": "22",
      "22": "23",
      "23": "24",
      "24": "25-29",
      "25": "30-34",
      "26": "35-39",
      "27": "40-44",
      "28": "45-49",
      "29": "50-54",
      "30": "55-59",
      "31": "60-64",
      "32": "65-69",
      "33": "70-74",
      "34": "75-79",
      "35": "80+",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }

    const summary: EnrolAgeWiseSummary = {
      TotalNumberofRows: data.length,
      byclass: {},
      bygender: {},
      byage: {},
      byshift: {},
    }

    data.forEach((EnrolAgeWise) => {
      // Count by Class_Id with proper mapping
      const classId = String(EnrolAgeWise.Class_Id || EnrolAgeWise.Class_Id || "Unknown")
      const classLabel = classMappings[classId] || `Unknown Level Id (${classId})`
      summary.byclass[classLabel] = (summary.byclass[classLabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(EnrolAgeWise.gender_Id || EnrolAgeWise.Gender_Id || "Unknown")
      const genderLabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderLabel] = (summary.bygender[genderLabel] || 0) + 1

      // Count by Age_Id with proper mapping
      const ageId = String(EnrolAgeWise.Age_Id || EnrolAgeWise.Age_Id || "Unknown")
      const ageLabel = ageMappings[ageId] || `Unknown Location Id (${ageId})`
      summary.byage[ageLabel] = (summary.byage[ageLabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(EnrolAgeWise.Shift_Id || EnrolAgeWise.Shift_Id || "Unknown")
      const shiftLabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftLabel] = (summary.byshift[shiftLabel] || 0) + 1
    })

    return summary
  }

  // Analyze Facilities data for preview
  const analyzeFacilitiesdata = (data: any[]): FacilitiesSummary => {

    // Basic Facilities ID mappings
    const facilitiesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Available",
      "2": "Not Available",
      "3": "Not Applicable",
      "4": "Not Functional",
      "5": "Inadequate",
    }
    
    const summary: FacilitiesSummary = {
      TotalNumberofRows: data.length,
      bywater: {},
      byelectricity: {},
      byboundarywall: {},
      bytoiletstudent: {},
      bytoiletstaff: {},
      bytelephone: {},
      bygas: {},
      byinternet: {},
      bylibrary: {},
      byhall: {},
      byplayground: {},
      bycanteen: {},
      byhostel: {},
      bystore: {},
      byhomeEconlab: {},
      byzoologylab: {},
      bybiologylab: {},
      bycomputerlab: {},
      bychemistrylab: {},
      bycombinedlab: {},
      byphysicslab: {},
      bybotanylab: {},
      byEMcomputers: {},
      byEmprinter: {},
    }


    data.forEach((Facilities) => {

      // Count by BPF_Water with proper mapping
      const waterId = String(Facilities.BPF_Water || Facilities.BPF_Water || "Unknown")
      const waterlabel = facilitiesMapping[waterId] || `Unknown Facilities Id (${waterId})`
      summary.bywater[waterlabel] = (summary.bywater[waterlabel] || 0) + 1

      // Count by BPF_Electricity with proper mapping
      const electricityId = String(Facilities.BPF_Electricity || Facilities.BPF_Electricity || "Unknown")
      const electricitylabel = facilitiesMapping[electricityId] || `Unknown Facilities Id (${electricityId})`
      summary.byelectricity[electricitylabel] = (summary.byelectricity[electricitylabel] || 0) + 1

      // Count by BPF_BoundaryWall with proper mapping
      const boundarywallId = String(Facilities.BPF_BoundaryWall || Facilities.BPF_BoundaryWall || "Unknown")
      const boundarywalllabel = facilitiesMapping[boundarywallId] || `Unknown Facilities Id (${boundarywallId})`
      summary.byboundarywall[boundarywalllabel] = (summary.byboundarywall[boundarywalllabel] || 0) + 1

      // Count by BPF_ToiletStudent with proper mapping
      const toiletstudentId = String(Facilities.BPF_ToiletStudent || Facilities.BPF_ToiletStudent || "Unknown")
      const toiletstudentlabel = facilitiesMapping[toiletstudentId] || `Unknown Facilities Id (${toiletstudentId})`
      summary.bytoiletstudent[toiletstudentlabel] = (summary.bytoiletstudent[toiletstudentlabel] || 0) + 1

      // Count by BPF_ToiletStaff with proper mapping
      const toiletstaffId = String(Facilities.BPF_ToiletStaff || Facilities.BPF_ToiletStaff || "Unknown")
      const toiletstaffLabel = facilitiesMapping[toiletstaffId] || `Unknown Facilities Id (${toiletstaffId})`
      summary.bytoiletstaff[toiletstaffLabel] = (summary.bytoiletstaff[toiletstaffLabel] || 0) + 1

      // Count by BPF_Telephone with proper mapping
      const telephoneId = String(Facilities.BPF_Telephone || Facilities.BPF_Telephone || "Unknown")
      const telephonelabel = facilitiesMapping[telephoneId] || `Unknown Facilities Id (${telephoneId})`
      summary.bytelephone[telephonelabel] = (summary.bytelephone[telephonelabel] || 0) + 1

      // Count by BPF_Gas with proper mapping
      const gasId = String(Facilities.BPF_Gas || Facilities.BPF_Gas || "Unknown")
      const gasLabel = facilitiesMapping[gasId] || `Unknown Facilities Id (${gasId})`
      summary.bygas[gasLabel] = (summary.bygas[gasLabel] || 0) + 1

      // Count by BF_Internet with proper mapping
      const internetId = String(Facilities.BF_Internet || Facilities.BF_Internet || "Unknown")
      const internetLabel = facilitiesMapping[internetId] || `Unknown Facilities Id (${internetId})`
      summary.byinternet[internetLabel] = (summary.byinternet[internetLabel] || 0) + 1

      // Count by BF_Library with proper mapping
      const libraryId = String(Facilities.BF_Library || Facilities.BF_Library || "Unknown")
      const libraryLabel = facilitiesMapping[libraryId] || `Unknown Facilities Id (${libraryId})`
      summary.bylibrary[libraryLabel] = (summary.bylibrary[libraryLabel] || 0) + 1

      // Count by BF_Hall with proper mapping
      const hallId = String(Facilities.BF_Hall || Facilities.BF_Hall || "Unknown")
      const hallLabel = facilitiesMapping[hallId] || `Unknown Facilities Id (${hallId})`
      summary.byhall[hallLabel] = (summary.byhall[hallLabel] || 0) + 1

      // Count by BF_Playground with proper mapping
      const playgroundId = String(Facilities.BF_Playground || Facilities.BF_Playground || "Unknown")
      const playgroundLabel = facilitiesMapping[playgroundId] || `Unknown Facilities Id (${playgroundId})`
      summary.byplayground[playgroundLabel] = (summary.byplayground[playgroundLabel] || 0) + 1

      // Count by BF_Canteen with proper mapping
      const canteenId = String(Facilities.BF_Canteen || Facilities.BF_Canteen || "Unknown")
      const canteenLabel = facilitiesMapping[canteenId] || `Unknown Facilities Id (${canteenId})`
      summary.bycanteen[canteenLabel] = (summary.bycanteen[canteenLabel] || 0) + 1

      // Count by BF_Hostel with proper mapping
      const hostelId = String(Facilities.BF_Hostel || Facilities.BF_Hostel || "Unknown")
      const hostelLabel = facilitiesMapping[hostelId] || `Unknown Facilities Id (${hostelId})`
      summary.bywater[hostelLabel] = (summary.bywater[hostelLabel] || 0) + 1

      // Count by BF_Store with proper mapping
      const storeId = String(Facilities.BF_Store || Facilities.BF_Store || "Unknown")
      const storelabel = facilitiesMapping[storeId] || `Unknown Facilities Id (${storeId})`
      summary.bystore[storelabel] = (summary.bystore[storelabel] || 0) + 1

      // Count by BF_HomeEcon_Lab with proper mapping
      const HomeeconlabId = String(Facilities.BF_HomeEcon_Lab || Facilities.BF_HomeEcon_Lab || "Unknown")
      const Homeeconlablable = facilitiesMapping[HomeeconlabId] || `Unknown Facilities Id (${HomeeconlabId})`
      summary.byhomeEconlab[Homeeconlablable] = (summary.byhomeEconlab[Homeeconlablable] || 0) + 1

      // Count by BF_Zoology_Lab with proper mapping
      const zoologylabId = String(Facilities.BF_Zoology_Lab || Facilities.BF_Zoology_Lab || "Unknown")
      const zoologylablabel = facilitiesMapping[zoologylabId] || `Unknown Facilities Id (${zoologylabId})`
      summary.byzoologylab[zoologylablabel] = (summary.byzoologylab[zoologylablabel] || 0) + 1

      // Count by BF_Biology_Lab with proper mapping
      const biologylabId = String(Facilities.BF_Biology_Lab || Facilities.BF_Biology_Lab || "Unknown")
      const biologylablabel = facilitiesMapping[biologylabId] || `Unknown Facilities Id (${biologylabId})`
      summary.bybiologylab[biologylablabel] = (summary.bybiologylab[biologylablabel] || 0) + 1

      // Count by BF_Computer_Lab with proper mapping
      const computerlabId = String(Facilities.BF_Computer_Lab || Facilities.BF_Computer_Lab || "Unknown")
      const computerlablabel = facilitiesMapping[computerlabId] || `Unknown Facilities Id (${computerlabId})`
      summary.bycomputerlab[computerlablabel] = (summary.bycomputerlab[computerlablabel] || 0) + 1

      // Count by BF_Chemistry_Lab with proper mapping
      const chemistrylabId = String(Facilities.BF_Chemistry_Lab || Facilities.BF_Chemistry_Lab || "Unknown")
      const chemistrylablabel = facilitiesMapping[chemistrylabId] || `Unknown Facilities Id (${chemistrylabId})`
      summary.bychemistrylab[chemistrylablabel] = (summary.bychemistrylab[chemistrylablabel] || 0) + 1

      // Count by BF_Combined_Lab with proper mapping
      const combinedlabId = String(Facilities.BF_Combined_Lab || Facilities.BF_Combined_Lab || "Unknown")
      const combinedlablabel = facilitiesMapping[combinedlabId] || `Unknown Facilities Id (${combinedlabId})`
      summary.bywater[combinedlablabel] = (summary.bywater[combinedlablabel] || 0) + 1

      // Count by BF_Physics_Lab with proper mapping
      const physicslabId = String(Facilities.BF_Physics_Lab || Facilities.BF_Physics_Lab || "Unknown")
      const physicslablabel = facilitiesMapping[physicslabId] || `Unknown Facilities Id (${physicslabId})`
      summary.byphysicslab[physicslablabel] = (summary.byphysicslab[physicslablabel] || 0) + 1

      // Count by BF_Botany_Lab with proper mapping
      const botanylabId = String(Facilities.BF_Botany_Lab || Facilities.BF_Botany_Lab || "Unknown")
      const botanylablabel = facilitiesMapping[botanylabId] || `Unknown Facilities Id (${botanylabId})`
      summary.bybotanylab[botanylablabel] = (summary.bybotanylab[botanylablabel] || 0) + 1

      // Count by EM_Computers with proper mapping
      const computersId = String(Facilities.EM_Computers || Facilities.EM_Computers || "Unknown")
      const computerslabel = facilitiesMapping[computersId] || `Unknown Facilities Id (${computersId})`
      summary.byEMcomputers[computerslabel] = (summary.byEMcomputers[computerslabel] || 0) + 1

      // Count by EM_Printers with proper mapping
      const printersId = String(Facilities.EM_Printers || Facilities.EM_Printers || "Unknown")
      const printerslabel = facilitiesMapping[printersId] || `Unknown Facilities Id (${printersId})`
      summary.byEmprinter[printerslabel] = (summary.byEmprinter[printerslabel] || 0) + 1
    })

    return summary
  }

  // Handle file selection and validation
  const handleFileSelection = async (tableName: string, file: File) => {
    setUploadError("")

    try {
      // Check upload permissions first
      if (!hasUploadPermission) {
        throw new Error(
          "You don't have permission to upload data. Please wait for the administrator to open an upload window.",
        )
      }

      if (hasUploaded) {
        throw new Error("You have already uploaded data for this window.")
      }

      // Check if deadline has passed
      if (uploadDeadline) {
        const deadline = new Date(uploadDeadline)
        const now = new Date()
        if (now > deadline) {
          throw new Error("Upload deadline has passed. The upload window is now closed.")
        }
      }

      // Validate file type
      if (!file.name.endsWith(".json")) {
        throw new Error("Please select a JSON file")
      }

      // Validate file size (10MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File size must be less than 100MB")
      }

      // Read and parse JSON
      const fileContent = await file.text()
      let jsonData

      try {
        jsonData = JSON.parse(fileContent)
      } catch (error) {
        throw new Error("Invalid JSON file format")
      }

      // Validate that JSON contains the expected table
      if (!jsonData[tableName]) {
        throw new Error(`JSON file must contain data for table "${tableName}"`)
      }

      // Validate that data is an array
      if (!Array.isArray(jsonData[tableName])) {
        throw new Error(`Data for table "${tableName}" must be an array`)
      }

      const recordCount = jsonData[tableName].length

      if (recordCount === 0) {
        throw new Error(`Table "${tableName}" cannot be empty`)
      }

      // Store file and parsed data for preview
      setSelectedFile(file)
      setParsedJsonData(jsonData)

      // If it's Institution table, analyze the data
      if (tableName === "Institutions") {
        const summary = analyzeInstitutionData(jsonData[tableName])
        setInstitutionSummary(summary)
      }

      // If it's Teachers_Profile table, analyze the data
      if (tableName === "Teachers_Profile") {
        const summary = analyzeTeachersProfileData(jsonData[tableName])
        setTeachersProfileSummary(summary)
      }

      // If it's EnrolAgeWise table, analyze the data
      if (tableName === "EnrolAgeWise") {
        const summary = analyzeEnrolAgeWisedata(jsonData[tableName])
        setEnrolAgeWiseSummary(summary)
      }

      // If it's Facilities table, analyze the data
      if (tableName === "Facilities") {
        const summary = analyzeFacilitiesdata(jsonData[tableName])
        setFacilitiesSummary(summary)
      }

      // Close upload dialog and show preview dialog
      setShowUploadDialog(false)
      setShowPreviewDialog(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed")
    }
  }

  // Handle confirmed upload
  const handleConfirmedUpload = async () => {
    if (!selectedFile || !parsedJsonData || !selectedTable) return

    setUploading(true)
    setUploadError("")

    try {
      // Simulate API call to upload data
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonData: parsedJsonData,
          username,
          password,
          tableName: selectedTable,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Upload failed")
      }

      // Get the API response message
      const responseText = await response.text();
      
      // Store the complete response without any filtering
      const formattedMessage = responseText;
      
      // Record successful upload
      addTableUploadRecord({
        username,
        tableName: selectedTable,
        filename: selectedFile.name,
        uploadDate: new Date().toISOString(),
        fileSize: `${Math.round(selectedFile.size / 1024)} KB`,
        year: currentYear,
        status: "success",
        recordCount: parsedJsonData[selectedTable].length,
        message: formattedMessage
      })

      // Update local state
      setUploadedTables((prev) => [...prev, selectedTable])
      
      // Show toast notification with a slight delay to ensure state is updated
      // Store the complete API response, just split into lines for readability
      const cleanedApiResponse = responseText
        .split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0)
        .join('.\n');

      // Show notification with formatted response
      setNotificationContent({
        title: "Upload Successful",
        message: (
          <div className="mt-2 space-y-3">
            <div className="pb-2">
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-md border border-gray-200">
                {responseText}
              </p>
            </div>
          </div>
        ),
        type: 'success'
      });
      setShowNotification(true);
      


      // Close dialogs and reset state
      setShowPreviewDialog(false)
      setSelectedTable(null)
      setSelectedFile(null)
      setParsedJsonData(null)
      setInstitutionSummary(null)
      setTeachersProfileSummary(null)
      setEnrolAgeWiseSummary(null)
      setFacilitiesSummary(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      
      // Show error toast for critical errors
      setNotificationContent({
        title: "Upload Error",
        message: (
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        ),
        type: 'error'
      });
      setShowNotification(true);
    } finally {
      setUploading(false)
    }
  }

  // Handle upload rejection
  const handleUploadRejection = () => {
    setShowPreviewDialog(false)
    setShowUploadDialog(true)
    setSelectedFile(null)
    setParsedJsonData(null)
    setInstitutionSummary(null)
    setTeachersProfileSummary(null)
    setEnrolAgeWiseSummary(null)
    setFacilitiesSummary(null)
    setUploadError("")
  }

  // Handle data not available notification
  const handleDataNotAvailable = (tableName: string) => {
    // Record that this user doesn't have data for this table
    const dataNotAvailableRecord = {
      id: Date.now(),
      username,
      tableName,
      year: currentYear,
      timestamp: new Date().toISOString(),
      status: "data_not_available",
    }

    // Store in data not available records
    const existingRecords = JSON.parse(localStorage.getItem("pie-portal-data-not-available") || "[]")

    // Remove any existing record for this user/table/year combination
    const filteredRecords = existingRecords.filter(
      (record: any) => !(record.username === username && record.tableName === tableName && record.year === currentYear),
    )

    // Add the new record
    filteredRecords.push(dataNotAvailableRecord)
    localStorage.setItem("pie-portal-data-not-available", JSON.stringify(filteredRecords))

    // Send notification to admin
    const notification = {
      id: Date.now() + 1, // Different ID from the record
      username,
      tableName,
      message: `User ${username} reports that data is not available for table: ${tableName} (Census Year: ${currentYear})`,
      timestamp: new Date().toISOString(),
      type: "data_not_available",
      read: false,
      year: currentYear // Add the year to the notification
    }

    const existingNotifications = JSON.parse(localStorage.getItem("pie-portal-notifications") || "[]")
    existingNotifications.push(notification)
    localStorage.setItem("pie-portal-notifications", JSON.stringify(existingNotifications))

    // Update local state
    setDataNotAvailableTables((prev) => [...prev, tableName])

    // Show success message to user
    setNotificationContent({
      title: "Notification Sent",
      message: (
        <p className="text-sm">
          Admin has been notified that data is not available for <strong>{tableName}</strong>.
        </p>
      ),
      type: 'info'
    });
    setShowNotification(true);
  }

  // Download sample file
  const downloadSample = (tableName: string) => {
    // Create sample data structure
    const sampleData = {
      [tableName]: [
        {
          id: 1,
          census_year: Number.parseInt(currentYear),
          // Add more sample fields based on table type
          ...(tableName === "Institutions" && {
            Inst_Id: "INST001",
            institution_name: "Sample School",
            level_Id: 1,
            gender_Id: 1,
            location_Id: 1,
            district: "Sample District",
            tehsil: "Sample Tehsil",
          }),
          ...(tableName === "Teachers_Profile" && {
            teacher_name: "Sample Teacher",
            qualification: "Masters",
            experience_years: 5,
          }),
          // Add more table-specific sample fields as needed
        },
      ],
    }

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${tableName.toLowerCase().replace(/\s+/g, "-")}-sample.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-700">Table Upload Progress - Year {currentYear}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Overall Progress: {completedTables} of {tables.length} tables completed
                <span className="text-xs text-gray-500 ml-2">
                  ({uploadedTables.length} uploaded, {dataNotAvailableTables.length} data not available)
                </span>
              </div>
              <div className="text-sm font-medium">{Math.round(progress)}%</div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {progress === 100 && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Congratulations! You have completed all {tables.length} tables ({uploadedTables.length} uploaded,{" "}
                {dataNotAvailableTables.length} marked as data not available).
              </AlertDescription>
            </Alert>
          )}

          {!hasUploadPermission && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Upload window is currently closed. Please wait for the administrator to open an upload window before you
                can upload data.
              </AlertDescription>
            </Alert>
          )}

          {hasUploaded && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have already uploaded data for this window. If you need to make changes, please contact the
                administrator.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tables.map((tableName, index) => {
                  const isUploaded = uploadedTables.includes(tableName)
                  const isDataNotAvailable = dataNotAvailableTables.includes(tableName)

                  return (
                    <tr
                      key={tableName}
                      className={isUploaded ? "bg-green-50" : isDataNotAvailable ? "bg-orange-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tableName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isUploaded ? (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        ) : isDataNotAvailable ? (
                          <Badge className="bg-orange-100 text-orange-800 border-0">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Data Not Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Dialog
                            open={showUploadDialog && selectedTable === tableName}
                            onOpenChange={(open) => {
                              if (!open) {
                                setShowUploadDialog(false)
                                setSelectedTable(null)
                                setUploadError("")
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="text-xs h-8"
                                disabled={isUploaded || isDataNotAvailable || !hasUploadPermission || hasUploaded}
                                onClick={() => {
                                  setSelectedTable(tableName)
                                  setShowUploadDialog(true)
                                  setUploadError("")
                                }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {isUploaded ? "Uploaded" : "Upload"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload {tableName} Data</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {uploadError && (
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{uploadError}</AlertDescription>
                                  </Alert>
                                )}

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                  <FileJson className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600 mb-2">Select your JSON file for {tableName}</p>
                                  <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    id={`file-upload-list-${tableName}`}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileSelection(tableName, e.target.files[0])
                                      }
                                    }}
                                    disabled={uploading}
                                  />
                                  <label htmlFor={`file-upload-list-${tableName}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mx-auto bg-transparent"
                                      disabled={uploading}
                                      asChild
                                    >
                                      <span>{uploading ? "Processing..." : "Select File"}</span>
                                    </Button>
                                  </label>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                  <p className="font-medium mb-1">Requirements:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>File must be in JSON format</li>
                                    <li>Maximum file size: 100MB</li>
                                    <li>Must contain data for "{tableName}" table</li>
                                    <li>Data must include census_year: {currentYear}</li>
                                    <li>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-blue-600"
                                        onClick={() => downloadSample(tableName)}
                                      >
                                        Download sample file
                                      </Button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                            disabled={isUploaded || isDataNotAvailable || !hasUploadPermission}
                            onClick={() => handleDataNotAvailable(tableName)}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Data Not Available
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Data Preview - {selectedTable}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {selectedFile && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">File Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Filename:</span>
                    <span className="ml-2 text-blue-800">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">File Size:</span>
                    <span className="ml-2 text-blue-800">{Math.round(selectedFile.size / 1024)} KB</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Table:</span>
                    <span className="ml-2 text-blue-800">{selectedTable}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Total Records:</span>
                    <span className="ml-2 text-blue-800">
                      {parsedJsonData && selectedTable ? parsedJsonData[selectedTable].length : 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Institution-specific summary */}
            {selectedTable === "Institutions" && institutionSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Institutions Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{institutionSummary.totalInstitutions}</strong> institutions will be uploaded. The
                        data includes {Object.keys(institutionSummary.byLevel).length} different education levels,
                        {Object.keys(institutionSummary.byGender).length} gender categories,
                        {Object.keys(institutionSummary.byLocation).length} different location types,
                        {Object.keys(institutionSummary.ByFunctionalStatus).length} functional status types,
                        {Object.keys(institutionSummary.bySector).length} different sectors,
                        {Object.keys(institutionSummary.bySchoolCommittee).length} school committee statuses,
                        {Object.keys(institutionSummary.byMedium).length} different mediums of instruction,
                        {Object.keys(institutionSummary.byShift).length} shift types,
                        {Object.keys(institutionSummary.byKind).length} kinds of institutions,
                        and {Object.keys(institutionSummary.byManagement).length} management types.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Level */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Level ID</div>
                        {Object.entries(institutionSummary.byLevel)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([levelId, count]) => (
                            <div key={levelId} className="flex justify-between text-sm">
                              <span style={levelId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{levelId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Gender */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Gender</div>
                        {Object.entries(institutionSummary.byGender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                            <div key={genderId} className="flex justify-between text-sm">
                              <span style={genderId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{genderId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Location */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Location ID</div>
                        {Object.entries(institutionSummary.byLocation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([locationId, count]) => (
                            <div key={locationId} className="flex justify-between text-sm">
                              <span style={locationId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{locationId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Functional Status */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Functional Status</div>
                        {Object.entries(institutionSummary.ByFunctionalStatus)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ByFunctionalStatus, count]) => (
                            <div key={ByFunctionalStatus} className="flex justify-between text-sm">
                              <span style={ByFunctionalStatus.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{ByFunctionalStatus}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Sector */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Sector</div>
                        {Object.entries(institutionSummary.bySector)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([sector, count]) => (
                            <div key={sector} className="flex justify-between text-sm">
                              <span style={sector.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{sector}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By School Committee */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By School Committee</div>
                        {Object.entries(institutionSummary.bySchoolCommittee)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([committee, count]) => (
                            <div key={committee} className="flex justify-between text-sm">
                              <span style={committee.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{committee}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Medium */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Medium</div>
                        {Object.entries(institutionSummary.byMedium)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([medium, count]) => (
                            <div key={medium} className="flex justify-between text-sm">
                              <span style={medium.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{medium}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Shift */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Shift</div>
                        {Object.entries(institutionSummary.byShift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                            <div key={shift} className="flex justify-between text-sm">
                              <span style={shift.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{shift}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Kind */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Kind</div>
                        {Object.entries(institutionSummary.byKind)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([kind, count]) => (
                            <div key={kind} className="flex justify-between text-sm">
                              <span style={kind.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{kind}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Management */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Management</div>
                        {Object.entries(institutionSummary.byManagement)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([management, count]) => (
                            <div key={management} className="flex justify-between text-sm">
                              <span style={management.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{management}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* By Level */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Level ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byLevel)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([levelId, count]) => (
                          <div key={levelId} className="flex justify-between text-sm">
                            <span className={`${levelId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{levelId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byGender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                          <div key={genderId} className="flex justify-between text-sm">
                            <span className={`${genderId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{genderId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Location */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Location ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byLocation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([locationId, count]) => (
                          <div key={locationId} className="flex justify-between text-sm">
                            <span className={`${locationId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{locationId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Functional Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.ByFunctionalStatus)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ByFunctionalStatus, count]) => (
                          <div key={ByFunctionalStatus} className="flex justify-between text-sm">
                            <span className={`${ByFunctionalStatus.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ByFunctionalStatus}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Sector */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Sector</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.bySector)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([sector, count]) => (
                          <div key={sector} className="flex justify-between text-sm">
                            <span className={`${sector.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{sector}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By School Committee */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By School Committee</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.bySchoolCommittee)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([committee, count]) => (
                          <div key={committee} className="flex justify-between text-sm">
                            <span className={`${committee.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{committee}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Medium */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Medium</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byMedium)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([medium, count]) => (
                          <div key={medium} className="flex justify-between text-sm">
                            <span className={`${medium.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{medium}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Shift */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Shift</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byShift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                          <div key={shift} className="flex justify-between text-sm">
                            <span className={`${shift.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{shift}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Kind */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Kind</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byKind)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([kind, count]) => (
                          <div key={kind} className="flex justify-between text-sm">
                            <span className={`${kind.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{kind}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Management */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Management</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byManagement)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([management, count]) => (
                          <div key={management} className="flex justify-between text-sm">
                            <span className={`${management.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{management}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-green-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between" ref={summaryRef}>
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                    <p className="text-sm text-green-800">
                      Total of <strong>{institutionSummary.totalInstitutions}</strong> institutions will be uploaded. The
                      data includes {Object.keys(institutionSummary.byLevel).length} different education levels,
                      {Object.keys(institutionSummary.byGender).length} gender categories,
                      {Object.keys(institutionSummary.byLocation).length} different location types,
                      {Object.keys(institutionSummary.ByFunctionalStatus).length} functional status types,
                      {Object.keys(institutionSummary.bySector).length} different sectors,
                      {Object.keys(institutionSummary.bySchoolCommittee).length} school committee statuses,
                      {Object.keys(institutionSummary.byMedium).length} different mediums of instruction,
                      {Object.keys(institutionSummary.byShift).length} shift types,
                      {Object.keys(institutionSummary.byKind).length} kinds of institutions,
                      and {Object.keys(institutionSummary.byManagement).length} management types.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Institutions-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Teachers-specific summary */}
            {selectedTable === "Teachers_Profile" && TeachersProfileSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Teachers Profile Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{TeachersProfileSummary.totalTeachers}</strong> Teachers will be uploaded. The
                        data includes {Object.keys(TeachersProfileSummary.byGender).length} Gender categories,
                        {Object.keys(TeachersProfileSummary.byBasicPayScale).length} Basic Pay Scales categories,
                        {Object.keys(TeachersProfileSummary.byAcademicQualification).length} Different Academic Qualifications,
                        {Object.keys(TeachersProfileSummary.byProfessionalQualification).length} Different Professional Qualifications,
                        {Object.keys(TeachersProfileSummary.byDesignation).length} Designation Categories,
                        {Object.keys(TeachersProfileSummary.byNatureOfService).length} Nature of Service types,
                        {Object.keys(TeachersProfileSummary.byDifficultyType).length} different difficulty types
                        and {Object.keys(TeachersProfileSummary.byDifficultyCategory).length} different difficulty categories.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Gender */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Gender Id</div>
                        {Object.entries(TeachersProfileSummary.byGender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                            <div key={genderId} className="flex justify-between text-sm">
                              <span style={genderId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{genderId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Basic Pay Scale Id */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Basic Pay Scale Id</div>
                        {Object.entries(TeachersProfileSummary.byBasicPayScale)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([BasicPayScaleId, count]) => (
                            <div key={BasicPayScaleId} className="flex justify-between text-sm">
                              <span style={BasicPayScaleId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{BasicPayScaleId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Academic Qualification */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Academic Qualification Id</div>
                        {Object.entries(TeachersProfileSummary.byAcademicQualification)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([AcademicQualificationId, count]) => (
                            <div key={AcademicQualificationId} className="flex justify-between text-sm">
                              <span style={AcademicQualificationId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{AcademicQualificationId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Professional Qualification */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Professional Qualification</div>
                        {Object.entries(TeachersProfileSummary.byProfessionalQualification)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ProfessionalQualificationId, count]) => (
                            <div key={ProfessionalQualificationId} className="flex justify-between text-sm">
                              <span style={ProfessionalQualificationId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{ProfessionalQualificationId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Designation */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Designation</div>
                        {Object.entries(TeachersProfileSummary.byDesignation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([DesignationId, count]) => (
                            <div key={DesignationId} className="flex justify-between text-sm">
                              <span style={DesignationId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{DesignationId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Nature of Service */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Nature of Service</div>
                        {Object.entries(TeachersProfileSummary.byNatureOfService)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([natureofserviceId, count]) => (
                            <div key={natureofserviceId} className="flex justify-between text-sm">
                              <span style={natureofserviceId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{natureofserviceId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Difficulty Type */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Difficulty Type</div>
                        {Object.entries(TeachersProfileSummary.byDifficultyType)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([difficultytypeId, count]) => (
                            <div key={difficultytypeId} className="flex justify-between text-sm">
                              <span style={difficultytypeId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{difficultytypeId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Difficulty Category */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Difficulty Category</div>
                        {Object.entries(TeachersProfileSummary.byDifficultyCategory)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([difficultycategoryId, count]) => (
                            <div key={difficultycategoryId} className="flex justify-between text-sm">
                              <span style={difficultycategoryId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{difficultycategoryId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* By Gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender Id</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byGender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                          <div key={genderId} className="flex justify-between text-sm">
                            <span className={`${genderId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{genderId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Basic Pay Scale */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Basic Pay Scale Id</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byBasicPayScale)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([BasicPayScaleId, count]) => (
                          <div key={BasicPayScaleId} className="flex justify-between text-sm">
                            <span className={`${BasicPayScaleId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{BasicPayScaleId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Academic Qualification */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Academic Qualification ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byAcademicQualification)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([AcademicQualificationId, count]) => (
                          <div key={AcademicQualificationId} className="flex justify-between text-sm">
                            <span className={`${AcademicQualificationId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{AcademicQualificationId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Professional Qualification */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Professional Qualification</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byProfessionalQualification)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ProfessionalQualificationId, count]) => (
                          <div key={ProfessionalQualificationId} className="flex justify-between text-sm">
                            <span className={`${ProfessionalQualificationId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ProfessionalQualificationId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Designation */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Designation</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byDesignation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([designationId, count]) => (
                          <div key={designationId} className="flex justify-between text-sm">
                            <span className={`${designationId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{designationId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Nature of Service */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Nature of Service</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byNatureOfService)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([natureofserviceId, count]) => (
                          <div key={natureofserviceId} className="flex justify-between text-sm">
                            <span className={`${natureofserviceId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{natureofserviceId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Difficulty type */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Difficulty type</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byDifficultyType)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([difficultytypeId, count]) => (
                          <div key={difficultytypeId} className="flex justify-between text-sm">
                            <span className={`${difficultytypeId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{difficultytypeId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By difficulty Category */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Difficulty Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(TeachersProfileSummary.byDifficultyCategory)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([difficultycategoryId, count]) => (
                          <div key={difficultycategoryId} className="flex justify-between text-sm">
                            <span className={`${difficultycategoryId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{difficultycategoryId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-green-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between" ref={summaryRef}>
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                    <p className="text-sm text-green-800">
                      Total of <strong>{TeachersProfileSummary.totalTeachers}</strong> Teachers will be uploaded. The
                      data includes {Object.keys(TeachersProfileSummary.byGender).length} different Gender Types,
                      {Object.keys(TeachersProfileSummary.byBasicPayScale).length} Basic Pay Scale categories,
                      {Object.keys(TeachersProfileSummary.byAcademicQualification).length} different Academic Qualification,
                      {Object.keys(TeachersProfileSummary.byProfessionalQualification).length} Professional Qualification categories,
                      {Object.keys(TeachersProfileSummary.byDesignation).length} Designation Categories,
                      {Object.keys(TeachersProfileSummary.byNatureOfService).length} Nature of Service types,
                      {Object.keys(TeachersProfileSummary.byDifficultyType).length} difficulty types,
                      and {Object.keys(TeachersProfileSummary.byDifficultyCategory).length} Difficulty categories.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Teachers-Profile-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* EnrolAgeWise-specific summary */}
            {selectedTable === "EnrolAgeWise" && EnrolAgeWiseSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Enrol Age wise Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{EnrolAgeWiseSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(EnrolAgeWiseSummary.byclass).length} Class levels,
                        {Object.keys(EnrolAgeWiseSummary.bygender).length} gender categories,
                        {Object.keys(EnrolAgeWiseSummary.byage).length} different Age types,
                        and {Object.keys(EnrolAgeWiseSummary.byshift).length} Shift types.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Class */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Class Id</div>
                        {Object.entries(EnrolAgeWiseSummary.byclass)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([classId, count]) => (
                            <div key={classId} className="flex justify-between text-sm">
                              <span style={classId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{classId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Gender */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Gender</div>
                        {Object.entries(EnrolAgeWiseSummary.bygender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                            <div key={genderId} className="flex justify-between text-sm">
                              <span style={genderId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{genderId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Age */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Age Id</div>
                        {Object.entries(EnrolAgeWiseSummary.byage)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ageId, count]) => (
                            <div key={ageId} className="flex justify-between text-sm">
                              <span style={ageId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{ageId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Shift */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Shift</div>
                        {Object.entries(EnrolAgeWiseSummary.byshift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                            <div key={shift} className="flex justify-between text-sm">
                              <span style={shift.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{shift}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* By Class */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Class Id</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolAgeWiseSummary.byclass)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([classId, count]) => (
                          <div key={classId} className="flex justify-between text-sm">
                            <span className={`${classId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{classId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolAgeWiseSummary.bygender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                          <div key={genderId} className="flex justify-between text-sm">
                            <span className={`${genderId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{genderId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Age */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Age Id</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolAgeWiseSummary.byage)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ageId, count]) => (
                          <div key={ageId} className="flex justify-between text-sm">
                            <span className={`${ageId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ageId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Shift */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Shift</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolAgeWiseSummary.byshift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                          <div key={shift} className="flex justify-between text-sm">
                            <span className={`${shift.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{shift}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-green-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between" ref={summaryRef}>
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                    <p className="text-sm text-green-800">
                      Total of <strong>{EnrolAgeWiseSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                      data includes {Object.keys(EnrolAgeWiseSummary.byclass).length} different Class levels,
                      {Object.keys(EnrolAgeWiseSummary.bygender).length} gender categories,
                      {Object.keys(EnrolAgeWiseSummary.byage).length} different Age Groups,
                      and {Object.keys(EnrolAgeWiseSummary.byshift).length} Shift Types.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `EnrolAgeWise-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Facilities-specific summary */}
            {selectedTable === "Facilities" && FacilitiesSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Facilities Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{FacilitiesSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(FacilitiesSummary.bywater).length} water facility status,
                        {Object.keys(FacilitiesSummary.byelectricity).length} electricity facility status,
                        {Object.keys(FacilitiesSummary.byboundarywall).length} boundary wall status,
                        {Object.keys(FacilitiesSummary.bytoiletstudent).length} student toilet facility status,
                        {Object.keys(FacilitiesSummary.bytoiletstaff).length} staff toilet facility status,
                        {Object.keys(FacilitiesSummary.bytelephone).length} telephone facility status,
                        {Object.keys(FacilitiesSummary.bygas).length} gas facility status,
                        {Object.keys(FacilitiesSummary.byinternet).length} internet facility status,
                        {Object.keys(FacilitiesSummary.bylibrary).length} library facility status, 
                        {Object.keys(FacilitiesSummary.byhall).length} Hall facility status,
                        {Object.keys(FacilitiesSummary.byplayground).length} playground facility status,
                        {Object.keys(FacilitiesSummary.bycanteen).length} canteen facility status,
                        {Object.keys(FacilitiesSummary.byhostel).length} hostel facility status,
                        {Object.keys(FacilitiesSummary.bystore).length} store facility status,
                        {Object.keys(FacilitiesSummary.byhomeEconlab).length} home economics lab facility status,
                        {Object.keys(FacilitiesSummary.byzoologylab).length} zoology lab facility status,
                        {Object.keys(FacilitiesSummary.bybiologylab).length} biology lab facility status,
                        {Object.keys(FacilitiesSummary.bycomputerlab).length} computer lab facility status,
                        {Object.keys(FacilitiesSummary.bychemistrylab).length} chemistry lab facility status,
                        {Object.keys(FacilitiesSummary.bycombinedlab).length} combined lab facility status,
                        {Object.keys(FacilitiesSummary.byphysicslab).length} physics lab facility status,
                        {Object.keys(FacilitiesSummary.bybotanylab).length} botany lab facility status,
                        {Object.keys(FacilitiesSummary.byEMcomputers).length} computers for educational management,
                        and {Object.keys(FacilitiesSummary.byEmprinter).length} printer for educational management.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Water */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Water Facility</div>
                        {Object.entries(FacilitiesSummary.bywater)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([waterId, count]) => (
                            <div key={waterId} className="flex justify-between text-sm">
                              <span style={waterId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{waterId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Electricity */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Electricity Facility</div>
                        {Object.entries(FacilitiesSummary.byelectricity)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([electricityId, count]) => (
                            <div key={electricityId} className="flex justify-between text-sm">
                              <span style={electricityId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{electricityId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Boundary Wall */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Location ID</div>
                        {Object.entries(institutionSummary.byLocation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([locationId, count]) => (
                            <div key={locationId} className="flex justify-between text-sm">
                              <span style={locationId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{locationId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Functional Status */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Functional Status</div>
                        {Object.entries(institutionSummary.ByFunctionalStatus)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ByFunctionalStatus, count]) => (
                            <div key={ByFunctionalStatus} className="flex justify-between text-sm">
                              <span style={ByFunctionalStatus.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{ByFunctionalStatus}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Sector */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Sector</div>
                        {Object.entries(institutionSummary.bySector)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([sector, count]) => (
                            <div key={sector} className="flex justify-between text-sm">
                              <span style={sector.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{sector}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By School Committee */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By School Committee</div>
                        {Object.entries(institutionSummary.bySchoolCommittee)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([committee, count]) => (
                            <div key={committee} className="flex justify-between text-sm">
                              <span style={committee.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{committee}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Medium */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Medium</div>
                        {Object.entries(institutionSummary.byMedium)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([medium, count]) => (
                            <div key={medium} className="flex justify-between text-sm">
                              <span style={medium.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{medium}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Shift */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Shift</div>
                        {Object.entries(institutionSummary.byShift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                            <div key={shift} className="flex justify-between text-sm">
                              <span style={shift.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{shift}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Kind */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Kind</div>
                        {Object.entries(institutionSummary.byKind)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([kind, count]) => (
                            <div key={kind} className="flex justify-between text-sm">
                              <span style={kind.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{kind}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Management */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Management</div>
                        {Object.entries(institutionSummary.byManagement)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([management, count]) => (
                            <div key={management} className="flex justify-between text-sm">
                              <span style={management.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{management}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* By Level */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Level ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byLevel)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([levelId, count]) => (
                          <div key={levelId} className="flex justify-between text-sm">
                            <span className={`${levelId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{levelId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byGender)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([genderId, count]) => (
                          <div key={genderId} className="flex justify-between text-sm">
                            <span className={`${genderId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{genderId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Location */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Location ID</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byLocation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([locationId, count]) => (
                          <div key={locationId} className="flex justify-between text-sm">
                            <span className={`${locationId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{locationId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Functional Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.ByFunctionalStatus)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ByFunctionalStatus, count]) => (
                          <div key={ByFunctionalStatus} className="flex justify-between text-sm">
                            <span className={`${ByFunctionalStatus.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ByFunctionalStatus}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Sector */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Sector</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.bySector)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([sector, count]) => (
                          <div key={sector} className="flex justify-between text-sm">
                            <span className={`${sector.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{sector}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By School Committee */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By School Committee</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.bySchoolCommittee)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([committee, count]) => (
                          <div key={committee} className="flex justify-between text-sm">
                            <span className={`${committee.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{committee}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Medium */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Medium</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byMedium)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([medium, count]) => (
                          <div key={medium} className="flex justify-between text-sm">
                            <span className={`${medium.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{medium}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Shift */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Shift</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byShift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shift, count]) => (
                          <div key={shift} className="flex justify-between text-sm">
                            <span className={`${shift.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{shift}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Kind */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Kind</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byKind)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([kind, count]) => (
                          <div key={kind} className="flex justify-between text-sm">
                            <span className={`${kind.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{kind}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Management */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Management</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(institutionSummary.byManagement)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([management, count]) => (
                          <div key={management} className="flex justify-between text-sm">
                            <span className={`${management.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{management}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-green-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between" ref={summaryRef}>
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                    <p className="text-sm text-green-800">
                      Total of <strong>{institutionSummary.totalInstitutions}</strong> institutions will be uploaded. The
                      data includes {Object.keys(institutionSummary.byLevel).length} different education levels,
                      {Object.keys(institutionSummary.byGender).length} gender categories,
                      {Object.keys(institutionSummary.byLocation).length} different location types,
                      {Object.keys(institutionSummary.ByFunctionalStatus).length} functional status types,
                      {Object.keys(institutionSummary.bySector).length} different sectors,
                      {Object.keys(institutionSummary.bySchoolCommittee).length} school committee statuses,
                      {Object.keys(institutionSummary.byMedium).length} different mediums of instruction,
                      {Object.keys(institutionSummary.byShift).length} shift types,
                      {Object.keys(institutionSummary.byKind).length} kinds of institutions,
                      and {Object.keys(institutionSummary.byManagement).length} management types.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Institutions-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Generic summary for other tables */}
            {selectedTable !== "Institutions" && "Teachers_Profile" && "EnrolAgeWise" && parsedJsonData && selectedTable && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Data Summary</h3>
                <p className="text-sm text-gray-700">
                  Ready to upload <strong>{parsedJsonData[selectedTable].length}</strong> records for {selectedTable}{" "}
                  table.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleUploadRejection} disabled={uploading}>
                Cancel & Select Different File
              </Button>
              <Button onClick={handleConfirmedUpload} disabled={uploading} className="bg-green-600 hover:bg-green-700">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm & Upload Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <AlertDialog open={showNotification} onOpenChange={setShowNotification}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={
              notificationContent?.type === 'success' ? 'text-green-600' :
              notificationContent?.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }>
              {notificationContent?.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {notificationContent?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNotification(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
