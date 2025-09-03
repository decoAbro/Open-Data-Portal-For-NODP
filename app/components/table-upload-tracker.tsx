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

interface ictfacilitiesSummary {
  TotalNumberofRows: number
  byfacilitiesavailable: { [key: string]: number }
  bypedagogymaterialavailable: { [key: string]: number }
  bymaterialforonlineuseavailable: { [key: string]: number }
  byinternetavailableforpedagogical: { [key: string]: number }
  bycomputersavailableforpedagogical: { [key: string]: number }
  bytabletavailableforpedagogical: { [key: string]: number }
  bysmartboardavailableforpedagogical: { [key: string]: number }
  byothers: { [key: string]: number }
}

interface InstitutionattackSummary {
  TotalNumberofRows: number
  byinstitutionattacked: { [key: string]: number }
  byfirregistered: { [key: string]: number }
}

interface InstitutionSecuritySummary {
  TotalNumberofRows: number
  bysecurityavailable: { [key: string]: number }
  bysecurityguardavailable: { [key: string]: number }
  bybarbedwireavailable: { [key: string]: number }
  byglassspikesavailable: { [key: string]: number }
  byentranceblocksavailable: { [key: string]: number }
  bycctvcameraavailable: { [key: string]: number }
  bybarrieravailable: { [key: string]: number }
}

interface nonteachersProfileSummary {
  TotalnonTeachers: number
  bystaff: { [key: string]: number }
  bygender: { [key: string]: number }
  bydesignation: { [key: string]: number }
  bybasicpayscale: { [key: string]: number }
  bynatureofservice: { [key: string]: number }
  bydifficultytype: { [key: string]: number }
  bydifficultycategory: { [key: string]: number }
} 

interface InstitutionsOtherFacilitiesSummary {
  TotalNumberofRows: number
  byrampavailable: { [key: string]: number }
  byspecialchildrenavailable: { [key: string]: number }
  bydaycareroomavailable: { [key: string]: number }
} 

interface EnrolmentECEExperienceSummary {
  TotalNumberofRows: number
  byclass: { [key: string]: number }
  bygender: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface EnrolmentRefugeeSummary {
  TotalNumberofRows: number
  byclass: { [key: string]: number }
  bygender: { [key: string]: number }
  bynationality: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface EnrolmentReligionSummary {
  TotalNumberofRows: number
  byclass: { [key: string]: number }
  bygender: { [key: string]: number }
  byreligion: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface EnrolmentDifficultySummary {
  TotalNumberofRows: number
  byclass: { [key: string]: number }
  bygender: { [key: string]: number }
  bydifficultytype: { [key: string]: number }
  bydifficultycategory: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface CorporalPunishmentSummary {
  TotalNumberofRows: number
  bycorporalpunishment: { [key: string]: number }
  byreportedtoauthorities: { [key: string]: number }
} 

interface BuildingSummary {
  TotalNumberofRows: number
  bybuildingavailability: { [key: string]: number }
  bybuildingownership: { [key: string]: number }
  bybuildingcondition: { [key: string]: number }
  byconstructiontype: { [key: string]: number }
} 

interface RepeaterSummary {
  TotalNumberofRows: number
  byclass: { [key: string]: number }
  bygender: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface TeachingNonTeachingCategorySummary {
  TotalNumberofRows: number
  bystaff: { [key: string]: number }
  bynatureofservice: { [key: string]: number }
  bygender: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface TeachingNonTeachingDesignationSummary {
  TotalNumberofRows: number
  bygender: { [key: string]: number }
  bystaff: { [key: string]: number }
  bydesignation: { [key: string]: number }
} 

interface TeachersProfessionalQualificationSummary {
  TotalNumberofRows: number
  bygender: { [key: string]: number }
  byshift: { [key: string]: number }
  byprofessionalqualification: { [key: string]: number }
} 

interface TeachersAcademicQualificationSummary {
  TotalNumberofRows: number
  byacademicqualification: { [key: string]: number }
  bygender: { [key: string]: number }
  byshift: { [key: string]: number }
} 

interface ECEFacilitiesSummary {
  TotalNumberofRows: number
  byeceroomsavailable: { [key: string]: number }
  byecetrainedteacheravailable: { [key: string]: number }
  byecematerialavailable: { [key: string]: number }
  byecefurnitureavailable: { [key: string]: number }
} 

interface StudentProfileSummary {
  TotalNumberofRows: number
  bygender: { [key: string]: number }
  byclass: { [key: string]: number }
  bystudentstatus: { [key: string]: number }
  bydifficultyType: { [key: string]: number }
  bydifficultyCategory: { [key: string]: number }
  byreligion: { [key: string]: number }
  bynationality: { [key: string]: number }
  byshift: { [key: string]: number }
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
  const [ictfacilitiesSummary, setictfacilitiesSummary] = useState<ictfacilitiesSummary | null>(null)
  const [InstitutionattackSummary, setInstitutionattackSummary] = useState<InstitutionattackSummary | null>(null)
  const [InstitutionSecuritySummary, setInstitutionSecuritySummary] = useState<InstitutionSecuritySummary | null>(null)
  const [nonteachersProfileSummary, setnonteachersProfileSummary] = useState<nonteachersProfileSummary | null>(null)
  const [InstitutionsOtherFacilitiesSummary, setInstitutionsOtherFacilitiesSummary] = useState<InstitutionsOtherFacilitiesSummary | null>(null)
  const [EnrolmentECEExperienceSummary, setEnrolmentECEExperienceSummary] = useState<EnrolmentECEExperienceSummary | null>(null)
  const [EnrolmentRefugeeSummary, setEnrolmentRefugeeSummary] = useState<EnrolmentRefugeeSummary | null>(null)
  const [EnrolmentReligionSummary, setEnrolmentReligionSummary] = useState<EnrolmentReligionSummary | null>(null)
  const [EnrolmentDifficultySummary, setEnrolmentDifficultySummary] = useState<EnrolmentDifficultySummary | null>(null)
  const [CorporalPunishmentSummary, setCorporalPunishmentSummary] = useState<CorporalPunishmentSummary | null>(null)
  const [BuildingSummary, setBuildingSummary] = useState<BuildingSummary | null>(null)
  const [RepeaterSummary, setRepeaterSummary] = useState<RepeaterSummary | null>(null)
  const [TeachingNonTeachingCategorySummary, setTeachingNonTeachingCategorySummary] = useState<TeachingNonTeachingCategorySummary | null>(null)
  const [TeachingNonTeachingDesignationSummary, setTeachingNonTeachingDesignationSummary] = useState<TeachingNonTeachingDesignationSummary | null>(null)
  const [TeachersProfessionalQualificationSummary, setTeachersProfessionalQualificationSummary] = useState<TeachersProfessionalQualificationSummary | null>(null)
  const [TeachersAcademicQualificationSummary, setTeachersAcademicQualificationSummary] = useState<TeachersAcademicQualificationSummary | null>(null)
  const [ECEFacilitiesSummary, setECEFacilitiesSummary] = useState<ECEFacilitiesSummary | null>(null)
  const [StudentProfileSummary, setStudentProfileSummary] = useState<StudentProfileSummary | null>(null)
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

  // Analyze Other Facilities data for preview
  const analyzeictfacilitiesData = (data: any[]): ictfacilitiesSummary => {

    // Other Facilities ID mappings
    const otherfacilitesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes",
      "2": "No",
    }
    
    const summary: ictfacilitiesSummary = {
      TotalNumberofRows: data.length,
      byfacilitiesavailable: {},
      bypedagogymaterialavailable: {},
      bymaterialforonlineuseavailable: {},
      byinternetavailableforpedagogical: {},
      bycomputersavailableforpedagogical: {},
      bytabletavailableforpedagogical: {},
      bysmartboardavailableforpedagogical: {},
      byothers: {},
    }


    data.forEach((ICT_Facilities) => {

      // Count by ICTFacilites_Available with proper mapping
      const facilitiesavailableId = String(ICT_Facilities.ICTFacilites_Available || ICT_Facilities.ICTFacilites_Available || "Unknown")
      const facilitiesavailablelabel = otherfacilitesMapping[facilitiesavailableId] || `Unknown Other Facilities Id (${facilitiesavailableId})`
      summary.byfacilitiesavailable[facilitiesavailablelabel] = (summary.byfacilitiesavailable[facilitiesavailablelabel] || 0) + 1

      // Count by ICTPedagogyMaterial_Available with proper mapping
      const ictpedagogymaterialavailableId = String(ICT_Facilities.ICTPedagogyMaterial_Available || ICT_Facilities.ICTPedagogyMaterial_Available || "Unknown")
      const ictpedagogymaterialavailablelabel = otherfacilitesMapping[ictpedagogymaterialavailableId] || `Unknown Other Facilities Id (${ictpedagogymaterialavailableId})`
      summary.bypedagogymaterialavailable[ictpedagogymaterialavailablelabel] = (summary.bypedagogymaterialavailable[ictpedagogymaterialavailablelabel] || 0) + 1

      // Count by ICTmaterial_Foronline_Use_Available with proper mapping
      const materialforonlineuseavailableId = String(ICT_Facilities.ICTmaterial_Foronline_Use_Available || ICT_Facilities.ICTmaterial_Foronline_Use_Available || "Unknown")
      const materialforonlineuseavailablelabel = otherfacilitesMapping[materialforonlineuseavailableId] || `Unknown Other Facilities Id (${materialforonlineuseavailableId})`
      summary.bymaterialforonlineuseavailable[materialforonlineuseavailablelabel] = (summary.bymaterialforonlineuseavailable[materialforonlineuseavailablelabel] || 0) + 1

      // Count by Internet_Available_Forpedagogical with proper mapping
      const internetavailableforpedagogicalId = String(ICT_Facilities.Internet_Available_Forpedagogical || ICT_Facilities.Internet_Available_Forpedagogical || "Unknown")
      const internetavailableforpedagogicallabel = otherfacilitesMapping[internetavailableforpedagogicalId] || `Unknown Other Facilities Id (${internetavailableforpedagogicalId})`
      summary.byinternetavailableforpedagogical[internetavailableforpedagogicallabel] = (summary.byinternetavailableforpedagogical[internetavailableforpedagogicallabel] || 0) + 1

      // Count by Computers_Available_Forpedagogical with proper mapping
      const computersavailableforpedagogicalId = String(ICT_Facilities.Computers_Available_Forpedagogical || ICT_Facilities.Computers_Available_Forpedagogical || "Unknown")
      const computersavailableforpedagogicalLabel = otherfacilitesMapping[computersavailableforpedagogicalId] || `Unknown Other Facilities Id (${computersavailableforpedagogicalId})`
      summary.bycomputersavailableforpedagogical[computersavailableforpedagogicalLabel] = (summary.bycomputersavailableforpedagogical[computersavailableforpedagogicalLabel] || 0) + 1

      // Count by Tablet_Available_Forpedagogical with proper mapping
      const tabletavailableforpedagogicalId = String(ICT_Facilities.Tablet_Available_Forpedagogical || ICT_Facilities.Tablet_Available_Forpedagogical || "Unknown")
      const tabletavailableforpedagogicallabel = otherfacilitesMapping[tabletavailableforpedagogicalId] || `Unknown Other Facilities Id (${tabletavailableforpedagogicalId})`
      summary.bytabletavailableforpedagogical[tabletavailableforpedagogicallabel] = (summary.bytabletavailableforpedagogical[tabletavailableforpedagogicallabel] || 0) + 1

      // Count by SmartBoard_Available_Forpedagogical with proper mapping
      const smartboardavailableforpedagogicalId = String(ICT_Facilities.SmartBoard_Available_Forpedagogical || ICT_Facilities.SmartBoard_Available_Forpedagogical || "Unknown")
      const smartboardavailableforpedagogicalLabel = otherfacilitesMapping[smartboardavailableforpedagogicalId] || `Unknown Other Facilities Id (${smartboardavailableforpedagogicalId})`
      summary.bysmartboardavailableforpedagogical[smartboardavailableforpedagogicalLabel] = (summary.bysmartboardavailableforpedagogical[smartboardavailableforpedagogicalLabel] || 0) + 1

      // Count by Others with proper mapping
      const othersId = String(ICT_Facilities.Others || ICT_Facilities.Others || "Unknown")
      const otherslabel = otherfacilitesMapping[othersId] || `Unknown Other Facilities Id (${othersId})`
      summary.byothers[otherslabel] = (summary.byothers[otherslabel] || 0) + 1
    })

    return summary
  }

  // Analyze Institution Attack data for preview
  const analyzeinstitutionattackData = (data: any[]): InstitutionattackSummary => {

    // Other Facilities ID mappings
    const otherfacilitesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes",
      "2": "No",
    }
    
    const summary: InstitutionattackSummary = {
      TotalNumberofRows: data.length,
      byinstitutionattacked: {},
      byfirregistered: {},
    }


    data.forEach((Institution_Attack) => {

      // Count by Institution_Attacked with proper mapping
      const institutionattackedId = String(Institution_Attack.Institution_Attacked || Institution_Attack.Institution_Attacked || "Unknown")
      const institutionattackedlabel = otherfacilitesMapping[institutionattackedId] || `Unknown Id (${institutionattackedId})`
      summary.byinstitutionattacked[institutionattackedlabel] = (summary.byinstitutionattacked[institutionattackedlabel] || 0) + 1

      // Count by FIR_Registered with proper mapping
      const firregisteredId = String(Institution_Attack.FIR_Registered || Institution_Attack.FIR_Registered || "Unknown")
      const firregisteredlabel = otherfacilitesMapping[firregisteredId] || `Unknown Id (${firregisteredId})`
      summary.byfirregistered[firregisteredlabel] = (summary.byfirregistered[firregisteredlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Institution Security data for preview
  const analyzeinstitutionsecurityData = (data: any[]): InstitutionSecuritySummary => {

    // Other Facilities ID mappings
    const otherfacilitesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes",
      "2": "No",
    }
    
    const summary: InstitutionSecuritySummary = {
      TotalNumberofRows: data.length,
      bysecurityavailable: {},
      bysecurityguardavailable: {},
      bybarbedwireavailable: {},
      byglassspikesavailable: {},
      byentranceblocksavailable: {},
      bycctvcameraavailable: {},
      bybarrieravailable: {},
    }


    data.forEach((Institution_Security) => {

      // Count by Security_Available with proper mapping
      const securityavailableId = String(Institution_Security.Security_Available || Institution_Security.Security_Available || "Unknown")
      const securityavailablelabel = otherfacilitesMapping[securityavailableId] || `Unknown Id (${securityavailableId})`
      summary.bysecurityavailable[securityavailablelabel] = (summary.bysecurityavailable[securityavailablelabel] || 0) + 1

      // Count by SecurityGuard_Available with proper mapping
      const securityguardavailableId = String(Institution_Security.SecurityGuard_Available || Institution_Security.SecurityGuard_Available || "Unknown")
      const securityguardavailablelabel = otherfacilitesMapping[securityguardavailableId] || `Unknown Id (${securityguardavailableId})`
      summary.bysecurityguardavailable[securityguardavailablelabel] = (summary.bysecurityguardavailable[securityguardavailablelabel] || 0) + 1

      // Count by BarbedWire_Available with proper mapping
      const barbedwireavailableId = String(Institution_Security.BarbedWire_Available || Institution_Security.BarbedWire_Available || "Unknown")
      const barbedwireavailablelabel = otherfacilitesMapping[barbedwireavailableId] || `Unknown Id (${barbedwireavailableId})`
      summary.bybarbedwireavailable[barbedwireavailablelabel] = (summary.bybarbedwireavailable[barbedwireavailablelabel] || 0) + 1

      // Count by GlassSpikes_Available with proper mapping
      const glassspikesavailableId = String(Institution_Security.GlassSpikes_Available || Institution_Security.GlassSpikes_Available || "Unknown")
      const glassspikesavailablelabel = otherfacilitesMapping[glassspikesavailableId] || `Unknown Id (${glassspikesavailableId})`
      summary.byglassspikesavailable[glassspikesavailablelabel] = (summary.byglassspikesavailable[glassspikesavailablelabel] || 0) + 1

      // Count by EntranceBlocks_Available with proper mapping
      const entranceblocksavailableId = String(Institution_Security.EntranceBlocks_Available || Institution_Security.EntranceBlocks_Available || "Unknown")
      const entranceblocksavailablelabel = otherfacilitesMapping[entranceblocksavailableId] || `Unknown Id (${entranceblocksavailableId})`
      summary.byentranceblocksavailable[entranceblocksavailablelabel] = (summary.byentranceblocksavailable[entranceblocksavailablelabel] || 0) + 1

      // Count by CCTVCamera_Available with proper mapping
      const cctvcameraavailableId = String(Institution_Security.CCTVCamera_Available || Institution_Security.CCTVCamera_Available || "Unknown")
      const cctvcameraavailablelabel = otherfacilitesMapping[cctvcameraavailableId] || `Unknown Id (${cctvcameraavailableId})`
      summary.bycctvcameraavailable[cctvcameraavailablelabel] = (summary.bycctvcameraavailable[cctvcameraavailablelabel] || 0) + 1

      // Count by Barrier_Available with proper mapping
      const barrieravailableId = String(Institution_Security.Barrier_Available || Institution_Security.Barrier_Available || "Unknown")
      const barrieravailablelabel = otherfacilitesMapping[barrieravailableId] || `Unknown Id (${barrieravailableId})`
      summary.bybarrieravailable[barrieravailablelabel] = (summary.bybarrieravailable[barrieravailablelabel] || 0) + 1
    })

    return summary
  }

  // Analyze Non_Teachers_Profile data for preview
  const analyzenonteachersprofileData = (data: any[]): nonteachersProfileSummary => {

    // Staff ID mappings
    const StaffMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Teaching",
      "2":"Non-Teaching",
    }

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
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
    
    const summary: nonteachersProfileSummary = {
      TotalnonTeachers: data.length,
      bystaff: {},
      bygender: {},
      bydesignation: {},
      bybasicpayscale: {},
      bynatureofservice: {},
      bydifficultytype: {},
      bydifficultycategory: {},
    }


    data.forEach((Non_Teachers_Profile) => {

      // Count by Staff_Id with proper mapping
      const staffId = String(Non_Teachers_Profile.Staff_Id || Non_Teachers_Profile.Staff_Id || "Unknown")
      const stafflabel = StaffMappings[staffId] || `Unknown Staff Id (${staffId})`
      summary.bystaff[stafflabel] = (summary.bystaff[stafflabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Non_Teachers_Profile.Gender_Id || Non_Teachers_Profile.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Designation_Id with proper mapping
      const designationId = String(Non_Teachers_Profile.Designation_Id || Non_Teachers_Profile.Designation_Id || "Unknown")
      const designationlabel = designationMappings[designationId] || `Unknown Designation Id (${designationId})`
      summary.bydesignation[designationlabel] = (summary.bydesignation[designationlabel] || 0) + 1

      // Count by BasicPayScale_Id with proper mapping
      const basicpayscaleId = String(Non_Teachers_Profile.BasicPayScale_Id || Non_Teachers_Profile.BasicPayScale_Id || "Unknown")
      const basicpayscalelabel = basicpayscaleMappings[basicpayscaleId] || `Unknown Basic Pay Scale Id (${basicpayscaleId})`
      summary.bybasicpayscale[basicpayscalelabel] = (summary.bybasicpayscale[basicpayscalelabel] || 0) + 1

      // Count by NatureOfService_Id with proper mapping
      const natureofserviceId = String(Non_Teachers_Profile.NatureOfService_Id || Non_Teachers_Profile.NatureOfService_Id || "Unknown")
      const natureofservicelabel = natureofserviceMappings[natureofserviceId] || `Unknown Nature Of Service Id (${natureofserviceId})`
      summary.bynatureofservice[natureofservicelabel] = (summary.bynatureofservice[natureofservicelabel] || 0) + 1

      // Count by DifficultyType_Id with proper mapping
      const difficultytypeId = String(Non_Teachers_Profile.DifficultyType_Id || Non_Teachers_Profile.DifficultyType_Id || "Unknown")
      const difficultytypelabel = difficultytypeMappings[difficultytypeId] || `Unknown Difficulty Type Id (${difficultytypeId})`
      summary.bydifficultytype[difficultytypelabel] = (summary.bydifficultytype[difficultytypelabel] || 0) + 1

      // Count by DifficultyCategory_Id with proper mapping
      const difficultycategoryId = String(Non_Teachers_Profile.DifficultyCategory_Id || Non_Teachers_Profile.DifficultyCategory_Id || "Unknown")
      const difficultycategorylabel = difficultycategoryMappings[difficultycategoryId] || `Unknown Difficulty Category Id (${difficultycategoryId})`
      summary.bydifficultycategory[difficultycategorylabel] = (summary.bydifficultycategory[difficultycategorylabel] || 0) + 1
    })

    return summary
  }

  // Analyze Institution OtherFacilities data for preview
  const analyzeinstitutionOtherfacillitiesData = (data: any[]): InstitutionsOtherFacilitiesSummary => {

    // Other Facilities ID mappings
    const otherfacilitesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes",
      "2": "No",
    }
    
    const summary: InstitutionsOtherFacilitiesSummary = {
      TotalNumberofRows: data.length,
      byrampavailable: {},
      byspecialchildrenavailable: {},
      bydaycareroomavailable: {},
    }


    data.forEach((Institutions_OtherFacilities) => {

      // Count by Ramp_Available with proper mapping
      const institutionsotherfacilitiesId = String(Institutions_OtherFacilities.Ramp_Available || Institutions_OtherFacilities.Ramp_Available || "Unknown")
      const institutionsotherfacilitieslabel = otherfacilitesMapping[institutionsotherfacilitiesId] || `Unknown Id (${institutionsotherfacilitiesId})`
      summary.byrampavailable[institutionsotherfacilitieslabel] = (summary.byrampavailable[institutionsotherfacilitieslabel] || 0) + 1

      // Count by TLM_Specialchildren_Available with proper mapping
      const specialchildrenavailableId = String(Institutions_OtherFacilities.TLM_Specialchildren_Available || Institutions_OtherFacilities.TLM_Specialchildren_Available || "Unknown")
      const specialchildrenavailablelabel = otherfacilitesMapping[specialchildrenavailableId] || `Unknown Id (${specialchildrenavailableId})`
      summary.byspecialchildrenavailable[specialchildrenavailablelabel] = (summary.byspecialchildrenavailable[specialchildrenavailablelabel] || 0) + 1

      // Count by DayCareRoom_Available with proper mapping
      const daycareroomavailableId = String(Institutions_OtherFacilities.DayCareRoom_Available || Institutions_OtherFacilities.DayCareRoom_Available || "Unknown")
      const daycareroomavailablelabel = otherfacilitesMapping[daycareroomavailableId] || `Unknown Id (${daycareroomavailableId})`
      summary.bydaycareroomavailable[daycareroomavailablelabel] = (summary.bydaycareroomavailable[daycareroomavailablelabel] || 0) + 1
    })

    return summary
  }

  // Analyze Enrolment ECE Experience data for preview
  const analyzeenrolECEexperienceData = (data: any[]): EnrolmentECEExperienceSummary => {

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

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }
    
    const summary: EnrolmentECEExperienceSummary = {
      TotalNumberofRows: data.length,
      byclass: {},
      bygender: {},
      byshift: {},
    }


    data.forEach((Enrolment_ECEExperience) => {

      // Count by Class_Id with proper mapping
      const classId = String(Enrolment_ECEExperience.Class_Id || Enrolment_ECEExperience.Class_Id || "Unknown")
      const classlabel = classMappings[classId] || `Unknown Class Id (${classId})`
      summary.byclass[classlabel] = (summary.byclass[classlabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Enrolment_ECEExperience.Gender_Id || Enrolment_ECEExperience.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Enrolment_ECEExperience.Shift_Id || Enrolment_ECEExperience.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Enrolment_Refugee data for preview
  const analyzeenrolmentrefugeeData = (data: any[]): EnrolmentRefugeeSummary => {

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

    // Nationality ID mappings
    const nationalityMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Pakistani",
      "2":"Afghani",
      "3":"Bangali",
      "4":"Chinese",
      "5":"Irani",
      "6":"Others",
    }
    
    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }

    const summary: EnrolmentRefugeeSummary = {
      TotalNumberofRows: data.length,
      byclass: {},
      bygender: {},
      bynationality: {},
      byshift: {},
    }


    data.forEach((Enrolment_Refugee) => {

      // Count by Class_Id with proper mapping
      const classId = String(Enrolment_Refugee.Class_Id || Enrolment_Refugee.Class_Id || "Unknown")
      const classlabel = classMappings[classId] || `Unknown Class Id (${classId})`
      summary.byclass[classlabel] = (summary.byclass[classlabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Enrolment_Refugee.Gender_Id || Enrolment_Refugee.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Nationality_Id with proper mapping
      const nationalityId = String(Enrolment_Refugee.Nationality_Id || Enrolment_Refugee.Nationality_Id || "Unknown")
      const nationalitylabel = nationalityMappings[nationalityId] || `Unknown Nationality Id (${nationalityId})`
      summary.bynationality[nationalitylabel] = (summary.bynationality[nationalitylabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Enrolment_Refugee.Shift_Id || Enrolment_Refugee.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Enrolment Religion data for preview
  const analyzeenrolmentreligionData = (data: any[]): EnrolmentReligionSummary => {

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

    // Religion ID mappings
    const religionMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Muslim",
      "2":"Christians",
      "3":"Hindu",
      "4":"Qadiani / Ahmadi",
      "5":"Scheduled Cast",
      "6":"Sikh",
      "7":"Parsi",
      "8":"Others",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }
    
    const summary: EnrolmentReligionSummary = {
      TotalNumberofRows: data.length,
      byclass: {},  
      bygender: {},
      byreligion: {},
      byshift: {},
    }


    data.forEach((Enrolment_Religion) => {

      // Count by Class_Id with proper mapping
      const classId = String(Enrolment_Religion.Class_Id || Enrolment_Religion.Class_Id || "Unknown")
      const classlabel = classMappings[classId] || `Unknown Class Id (${classId})`
      summary.byclass[classlabel] = (summary.byclass[classlabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Enrolment_Religion.Gender_Id || Enrolment_Religion.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Religion_Id with proper mapping
      const religionId = String(Enrolment_Religion.Religion_Id || Enrolment_Religion.Religion_Id || "Unknown")
      const religionlabel = religionMappings[religionId] || `Unknown Religion Id (${religionId})`
      summary.byreligion[religionlabel] = (summary.byreligion[religionlabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Enrolment_Religion.Shift_Id || Enrolment_Religion.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Enrolment Difficulty data for preview
  const analyzeenrolmentdifficultyData = (data: any[]): EnrolmentDifficultySummary => {

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

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }

    const summary: EnrolmentDifficultySummary = {
      TotalNumberofRows: data.length,
      byclass: {},
      bygender: {},
      bydifficultytype: {},
      bydifficultycategory: {},
      byshift: {},
    }


    data.forEach((Enrolment_Difficulty) => {

      // Count by Class_Id with proper mapping
      const classId = String(Enrolment_Difficulty.Class_Id || Enrolment_Difficulty.Class_Id || "Unknown")
      const classlabel = classMappings[classId] || `Unknown Class Id (${classId})`
      summary.byclass[classlabel] = (summary.byclass[classlabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Enrolment_Difficulty.Gender_Id || Enrolment_Difficulty.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by DifficultyType_Id with proper mapping
      const difficultytypeId = String(Enrolment_Difficulty.DifficultyType_Id || Enrolment_Difficulty.DifficultyType_Id || "Unknown")
      const difficultytypelabel = difficultytypeMappings[difficultytypeId] || `Unknown Difficulty Type Id (${difficultytypeId})`
      summary.bydifficultytype[difficultytypelabel] = (summary.bydifficultytype[difficultytypelabel] || 0) + 1

      // Count by DifficultyCategory_Id with proper mapping
      const difficultycategoryId = String(Enrolment_Difficulty.DifficultyCategory_Id || Enrolment_Difficulty.DifficultyCategory_Id || "Unknown")
      const difficultycategorylabel = difficultycategoryMappings[difficultycategoryId] || `Unknown Difficulty Category Id (${difficultycategoryId})`
      summary.bydifficultycategory[difficultycategorylabel] = (summary.bydifficultycategory[difficultycategorylabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Enrolment_Difficulty.Shift_Id || Enrolment_Difficulty.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Corporal Punishment data for preview
  const analyzecorporalpunishmentData = (data: any[]): CorporalPunishmentSummary => {

    // Other Facilities ID mappings
    const otherfacilitesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes",
      "2": "No",
    }
    
    const summary: CorporalPunishmentSummary = {
      TotalNumberofRows: data.length,
      bycorporalpunishment: {},
      byreportedtoauthorities: {},
    }


    data.forEach((Corporal_Punishment) => {

      // Count by Corporal_Punishment with proper mapping
      const corporalpunishmentId = String(Corporal_Punishment.Corporal_Punishment || Corporal_Punishment.Corporal_Punishment || "Unknown")
      const corporalpunishmentlabel = otherfacilitesMapping[corporalpunishmentId] || `Unknown Id (${corporalpunishmentId})`
      summary.bycorporalpunishment[corporalpunishmentlabel] = (summary.bycorporalpunishment[corporalpunishmentlabel] || 0) + 1

      // Count by Reported_to_Authorities with proper mapping
      const reportedtoauthoritiesId = String(Corporal_Punishment.Reported_to_Authorities || Corporal_Punishment.Reported_to_Authorities || "Unknown")
      const reportedtoauthoritieslabel = otherfacilitesMapping[reportedtoauthoritiesId] || `Unknown Id (${reportedtoauthoritiesId})`
      summary.byreportedtoauthorities[reportedtoauthoritieslabel] = (summary.byreportedtoauthorities[reportedtoauthoritieslabel] || 0) + 1
    })

    return summary
  }

  // Analyze Building data for preview
  const analyzebuildingData = (data: any[]): BuildingSummary => {


    // Buiding Availability ID mappings
    const BuidingAvailabilityMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Available",
      "2":"Not Available",
      "3":"Not Functional",
      "4":"Not Applicable",
      "5":"Inadequate",
    }

    // Buiding Ownership ID mappings
    const BuidingOwnershipMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Govt. Building",
      "2":"Other Building",
      "3":"Rented",
      "4":"Donated",
      "5":"Rent Free",
      "6":"No Building",
    }

    // Buiding Condition ID mappings
    const BuidingConditionMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Satisfactory",
      "2":"Need Repair",
      "3":"Dangerous",
      "4":"No Building",
    }

    // Construction Type ID mappings
    const ConstructionTypeMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Kacha",
      "2":"Paka",
      "3":"Mix",
      "4":"No Buiding",
      "5":"Pre-Fabricated",
      "6":"Temporary Shelter",
    }
    
    const summary: BuildingSummary = {
      TotalNumberofRows: data.length,
      bybuildingavailability: {},
      bybuildingownership: {},
      bybuildingcondition: {},
      byconstructiontype: {},
    }


    data.forEach((Building) => {

      // Count by BuildingAvailability_Id with proper mapping
      const buildingavailabilityId = String(Building.BuildingAvailability_Id || Building.BuildingAvailability_Id || "Unknown")
      const buildingavailabilitylabel = BuidingAvailabilityMappings[buildingavailabilityId] || `Unknown Building Availability Id (${buildingavailabilityId})`
      summary.bybuildingavailability[buildingavailabilitylabel] = (summary.bybuildingavailability[buildingavailabilitylabel] || 0) + 1

      // Count by BuildingOwnership_Id with proper mapping
      const buildingownershipId = String(Building.BuildingOwnership_Id || Building.BuildingOwnership_Id || "Unknown")
      const buildingownershiplabel = BuidingOwnershipMappings[buildingownershipId] || `Unknown Building Ownership Id (${buildingownershipId})`
      summary.bybuildingownership[buildingownershiplabel] = (summary.bybuildingownership[buildingownershiplabel] || 0) + 1

      // Count by BuildingCondition_Id with proper mapping
      const buildingconditionId = String(Building.BuildingCondition_Id || Building.BuildingCondition_Id || "Unknown")
      const buildingconditionlabel = BuidingConditionMappings[buildingconditionId] || `Unknown Building Condition Id (${buildingconditionId})`
      summary.bybuildingcondition[buildingconditionlabel] = (summary.bybuildingcondition[buildingconditionlabel] || 0) + 1

      // Count by ConstructionType_Id with proper mapping
      const constructiontypeId = String(Building.ConstructionType_Id || Building.ConstructionType_Id || "Unknown")
      const constructiontypelabel = ConstructionTypeMappings[constructiontypeId] || `Unknown Construction Type Id (${constructiontypeId})`
      summary.byconstructiontype[constructiontypelabel] = (summary.byconstructiontype[constructiontypelabel] || 0) + 1
    })

    return summary
  }

  // Analyze Repeater data for preview
  const analyzerepeaterData = (data: any[]): RepeaterSummary => {

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

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }

    const summary: RepeaterSummary = {
      TotalNumberofRows: data.length,
      byclass: {},
      bygender: {},
      byshift: {},
    }


    data.forEach((Repeater) => {

      // Count by Class_Id with proper mapping
      const classId = String(Repeater.Class_Id || Repeater.Class_Id || "Unknown")
      const classlabel = classMappings[classId] || `Unknown Class Id (${classId})`
      summary.byclass[classlabel] = (summary.byclass[classlabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Repeater.Gender_Id || Repeater.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Repeater.Shift_Id || Repeater.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Teaching Non Teaching Category data for preview
  const analyzeteachingnonteachingcategoryData = (data: any[]): TeachingNonTeachingCategorySummary => {

    // Staff ID mappings
    const StaffMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Teaching",
      "2":"Non-Teaching",
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

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }
    
    const summary: TeachingNonTeachingCategorySummary = {
      TotalNumberofRows: data.length,
      bystaff: {},
      bynatureofservice: {},
      bygender: {},
      byshift: {},
    }


    data.forEach((TeachingNonTeaching_Category) => {

      // Count by Staff_Id with proper mapping
      const staffId = String(TeachingNonTeaching_Category.Staff_Id || TeachingNonTeaching_Category.Staff_Id || "Unknown")
      const stafflabel = StaffMappings[staffId] || `Unknown Staff Id (${staffId})`
      summary.bystaff[stafflabel] = (summary.bystaff[stafflabel] || 0) + 1

      // Count by NatureOfService_Id with proper mapping
      const natureofserviceId = String(TeachingNonTeaching_Category.NatureOfService_Id || TeachingNonTeaching_Category.NatureOfService_Id || "Unknown")
      const natureofservicelabel = natureofserviceMappings[natureofserviceId] || `Unknown Nature Of Service Id (${natureofserviceId})`
      summary.bynatureofservice[natureofservicelabel] = (summary.bynatureofservice[natureofservicelabel] || 0) + 1

      // Count by gender with proper mapping
      const genderId = String(TeachingNonTeaching_Category.Gender_Id || TeachingNonTeaching_Category.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(TeachingNonTeaching_Category.Shift_Id || TeachingNonTeaching_Category.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze TeachingNonTeaching_Designation data for preview
  const analyzeteachingnonteachingdesignationData = (data: any[]): TeachingNonTeachingDesignationSummary => {

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
    }

    // Staff ID mappings
    const StaffMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Teaching",
      "2":"Non-Teaching",
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
    
    const summary: TeachingNonTeachingDesignationSummary = {
      TotalNumberofRows: data.length,
      bygender: {},
      bystaff: {},
      bydesignation: {},
    }


    data.forEach((TeachingNonTeaching_Designation) => {

      // Count by Gender_Id with proper mapping
      const genderId = String(TeachingNonTeaching_Designation.Gender_Id || TeachingNonTeaching_Designation.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Staff_Id with proper mapping
      const staffId = String(TeachingNonTeaching_Designation.Staff_Id || TeachingNonTeaching_Designation.Staff_Id || "Unknown")
      const stafflabel = StaffMappings[staffId] || `Unknown Staff Id (${staffId})`
      summary.bystaff[stafflabel] = (summary.bystaff[stafflabel] || 0) + 1

      // Count by Designation_Id with proper mapping
      const designationId = String(TeachingNonTeaching_Designation.Designation_Id || TeachingNonTeaching_Designation.Designation_Id || "Unknown")
      const designationlabel = designationMappings[designationId] || `Unknown Designation Id (${designationId})`
      summary.bydesignation[designationlabel] = (summary.bydesignation[designationlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Teachers Professional Qualification data for preview
  const analyzeteachersprofessionalqualification = (data: any[]): TeachersProfessionalQualificationSummary => {

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
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
    
    const summary: TeachersProfessionalQualificationSummary = {
      TotalNumberofRows: data.length,
      bygender: {},
      byshift: {},
      byprofessionalqualification: {},
    }


    data.forEach((Teachers_ProfessionalQualification) => {

      // Count by Gender_Id with proper mapping
      const genderId = String(Teachers_ProfessionalQualification.Gender_Id || Teachers_ProfessionalQualification.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Teachers_ProfessionalQualification.Shift_Id || Teachers_ProfessionalQualification.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1

      // Count by ProfessionalQualification_Id with proper mapping
      const professionalqualificationId = String(Teachers_ProfessionalQualification.ProfessionalQualification_Id || Teachers_ProfessionalQualification.ProfessionalQualification_Id || "Unknown")
      const professionalqualificationlabel = professionalqualificationMappings[professionalqualificationId] || `Unknown Professional Qualification Id (${professionalqualificationId})`
      summary.byprofessionalqualification[professionalqualificationlabel] = (summary.byprofessionalqualification[professionalqualificationlabel] || 0) + 1
    })

    return summary
  }

  // Analyze Teachers Academic Qualification data for preview
  const analyzeteachersacademicqualificationData = (data: any[]): TeachersAcademicQualificationSummary => {

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

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys Institution",
      "2": "Girls Institution",
      "3": "Mix Institution",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }
    
    const summary: TeachersAcademicQualificationSummary = {
      TotalNumberofRows: data.length,
      byacademicqualification: {},
      bygender: {},
      byshift: {},
    }


    data.forEach((Teachers_AcademicQualification) => {

      // Count by AcademicQualification_Id with proper mapping
      const AcademicQualificationId = String(Teachers_AcademicQualification.AcademicQualification_Id || Teachers_AcademicQualification.AcademicQualification_Id || "Unknown")
      const AcademicQualificationalabel = academicqualificationMappings[AcademicQualificationId] || `Unknown Academic Qualification Id (${AcademicQualificationId})`
      summary.byacademicqualification[AcademicQualificationalabel] = (summary.byacademicqualification[AcademicQualificationalabel] || 0) + 1

      // Count by Gender_Id with proper mapping
      const genderId = String(Teachers_AcademicQualification.Gender_Id || Teachers_AcademicQualification.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Teachers_AcademicQualification.Shift_Id || Teachers_AcademicQualification.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
    })

    return summary
  }

  // Analyze ECE_Facilities data for preview
  const analyzeecefacilitiesData = (data: any[]): ECEFacilitiesSummary => {

    // Other Facilities ID mappings
    const otherfacilitesMapping: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Yes",
      "2": "No",
    }
    
    const summary: ECEFacilitiesSummary = {
      TotalNumberofRows: data.length,
      byeceroomsavailable: {},
      byecetrainedteacheravailable: {},
      byecematerialavailable: {},
      byecefurnitureavailable: {},
    }


    data.forEach((ECE_Facilities) => {

      // Count by ECErooms_Available with proper mapping
      const eceroomsavailableId = String(ECE_Facilities.ECErooms_Available || ECE_Facilities.ECErooms_Available || "Unknown")
      const eceroomsavailablelabel = otherfacilitesMapping[eceroomsavailableId] || `Unknown Id (${eceroomsavailableId})`
      summary.byeceroomsavailable[eceroomsavailablelabel] = (summary.byeceroomsavailable[eceroomsavailablelabel] || 0) + 1

      // Count by ECETrainedTeacher_Available with proper mapping
      const ecetrainedteacherId = String(ECE_Facilities.ECETrainedTeacher_Available || ECE_Facilities.ECETrainedTeacher_Available || "Unknown")
      const ecetrainedteacherlabel = otherfacilitesMapping[ecetrainedteacherId] || `Unknown Id (${ecetrainedteacherId})`
      summary.byecetrainedteacheravailable[ecetrainedteacherlabel] = (summary.byecetrainedteacheravailable[ecetrainedteacherlabel] || 0) + 1

      // Count by ECEMaterial_Available with proper mapping
      const ecematerialId = String(ECE_Facilities.ECEMaterial_Available || ECE_Facilities.ECEMaterial_Available || "Unknown")
      const ecemateriallabel = otherfacilitesMapping[ecematerialId] || `Unknown Id (${ecematerialId})`
      summary.byecematerialavailable[ecemateriallabel] = (summary.byecematerialavailable[ecemateriallabel] || 0) + 1

      // Count by ECEFurniture_Available with proper mapping
      const ecefurnitureId = String(ECE_Facilities.ECEFurniture_Available || ECE_Facilities.ECEFurniture_Available || "Unknown")
      const ecefurniturelabel = otherfacilitesMapping[ecefurnitureId] || `Unknown Id (${ecefurnitureId})`
      summary.byecefurnitureavailable[ecefurniturelabel] = (summary.byecefurnitureavailable[ecefurniturelabel] || 0) + 1
    })

    return summary
  }

  // Analyze Student Profile data for preview
  const analyzestudentprofileData = (data: any[]): StudentProfileSummary => {

    // Gender ID mappings
    const genderMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Boys",
      "2": "Girls",
      "3": "Transgender",
    }

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

    // Student Status ID mappings
    const StudentStatusMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Promoted",
      "2":"Repeater",
      "3":"Transferred",
      "4":"Drop-Out",
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

    // Religion ID mappings
    const religionMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Muslim",
      "2":"Christians",
      "3":"Hindu",
      "4":"Qadiani / Ahmadi",
      "5":"Scheduled Cast",
      "6":"Sikh",
      "7":"Parsi",
      "8":"Others",
    }

    // Nationality ID mappings
    const nationalityMappings: { [key: string]: string } = {
      "0":"Not Reported",
      "1":"Pakistani",
      "2":"Afghani",
      "3":"Bangali",
      "4":"Chinese",
      "5":"Irani",
      "6":"Others",
    }

    // Shift ID mappings
    const ShiftMappings: { [key: string]: string } = {
      "0": "Not Reported",
      "1": "Morning",
      "2": "Evening",
      "3": "Both",
    }
    
    const summary: StudentProfileSummary = {
      TotalNumberofRows: data.length,
      bygender: {},
      byclass: {},
      bystudentstatus: {},
      bydifficultyType: {},
      bydifficultyCategory: {},
      byreligion: {},
      bynationality: {},
      byshift: {},
    }


    data.forEach((Student_Profile) => {

      // Count by Gender_Id with proper mapping
      const genderId = String(Student_Profile.Gender_Id || Student_Profile.Gender_Id || "Unknown")
      const genderlabel = genderMappings[genderId] || `Unknown Gender Id (${genderId})`
      summary.bygender[genderlabel] = (summary.bygender[genderlabel] || 0) + 1

      // Count by Class_Id with proper mapping
      const classId = String(Student_Profile.Class_Id || Student_Profile.Class_Id || "Unknown")
      const classlabel = classMappings[classId] || `Unknown Class Id (${classId})`
      summary.byclass[classlabel] = (summary.byclass[classlabel] || 0) + 1

      // Count by StudentStatus_Id with proper mapping
      const studentstatusId = String(Student_Profile.StudentStatus_Id || Student_Profile.StudentStatus_Id || "Unknown")
      const studentstatuslabel = StudentStatusMappings[studentstatusId] || `Unknown Student Status Id (${studentstatusId})`
      summary.bystudentstatus[studentstatuslabel] = (summary.bystudentstatus[studentstatuslabel] || 0) + 1

      // Count by DifficultyType_Id with proper mapping
      const difficultytypeId = String(Student_Profile.DifficultyType_Id || Student_Profile.DifficultyType_Id || "Unknown")
      const difficultytypelabel = difficultytypeMappings[difficultytypeId] || `Unknown Difficulty Type Id (${difficultytypeId})`
      summary.bydifficultyType[difficultytypelabel] = (summary.bydifficultyType[difficultytypelabel] || 0) + 1

      // Count by DifficultyCategory_Id with proper mapping
      const difficultycategoryId = String(Student_Profile.DifficultyCategory_Id || Student_Profile.DifficultyCategory_Id || "Unknown")
      const difficultycategorylabel = difficultycategoryMappings[difficultycategoryId] || `Unknown Difficulty Category Id (${difficultycategoryId})`
      summary.bydifficultyCategory[difficultycategorylabel] = (summary.bydifficultyCategory[difficultycategorylabel] || 0) + 1

      // Count by Religion_Id with proper mapping
      const religionId = String(Student_Profile.Religion_Id || Student_Profile.Religion_Id || "Unknown")
      const religionlabel = religionMappings[religionId] || `Unknown Religion Id (${religionId})`
      summary.byreligion[religionlabel] = (summary.byreligion[religionlabel] || 0) + 1

      // Count by Nationality_Id with proper mapping
      const nationalityId = String(Student_Profile.Nationality_Id || Student_Profile.Nationality_Id || "Unknown")
      const nationalitylabel = nationalityMappings[nationalityId] || `Unknown Nationality Id (${nationalityId})`
      summary.bynationality[nationalitylabel] = (summary.bynationality[nationalitylabel] || 0) + 1

      // Count by Shift_Id with proper mapping
      const shiftId = String(Student_Profile.Shift_Id || Student_Profile.Shift_Id || "Unknown")
      const shiftlabel = ShiftMappings[shiftId] || `Unknown Shift Id (${shiftId})`
      summary.byshift[shiftlabel] = (summary.byshift[shiftlabel] || 0) + 1
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

      // If it's ICT_Facilities table, analyze the data
      if (tableName === "ICT_Facilities") {
        const summary = analyzeictfacilitiesData(jsonData[tableName])
        setictfacilitiesSummary(summary)
      }

      // If it's Institution_Attack table, analyze the data
      if (tableName === "Institution_Attack") {
        const summary = analyzeinstitutionattackData(jsonData[tableName])
        setInstitutionattackSummary(summary)
      }

      // If it's Institution_Security table, analyze the data
      if (tableName === "Institution_Security") {
        const summary = analyzeinstitutionsecurityData(jsonData[tableName])
        setInstitutionSecuritySummary(summary)
      }

      // If it's NonTeachers_Profile table, analyze the data
      if (tableName === "NonTeachers_Profile") {
        const summary = analyzenonteachersprofileData(jsonData[tableName])
        setnonteachersProfileSummary(summary)
      }

      // If it's Institutions_OtherFacilities table, analyze the data
      if (tableName === "Institutions_OtherFacilities") {
        const summary = analyzeinstitutionOtherfacillitiesData(jsonData[tableName])
        setInstitutionsOtherFacilitiesSummary(summary)
      }

      // If it's Enrolment_ECEExperience table, analyze the data
      if (tableName === "Enrolment_ECEExperience") {
        const summary = analyzeenrolECEexperienceData(jsonData[tableName])
        setEnrolmentECEExperienceSummary(summary)
      }

      // If it's Enrolment_Refugee table, analyze the data
      if (tableName === "Enrolment_Refugee") {
        const summary = analyzeenrolmentrefugeeData(jsonData[tableName])
        setEnrolmentRefugeeSummary(summary)
      }

      // If it's Enrolment_Religion table, analyze the data
      if (tableName === "Enrolment_Religion") {
        const summary = analyzeenrolmentreligionData(jsonData[tableName])
        setEnrolmentReligionSummary(summary)
      }

      // If it's Enrolment_Difficulty table, analyze the data
      if (tableName === "Enrolment_Difficulty") {
        const summary = analyzeenrolmentdifficultyData(jsonData[tableName])
        setEnrolmentDifficultySummary(summary)
      }

      // If it's Corporal_Punishment table, analyze the data
      if (tableName === "Corporal_Punishment") {
        const summary = analyzecorporalpunishmentData(jsonData[tableName])
        setCorporalPunishmentSummary(summary)
      }

      // If it's Building table, analyze the data
      if (tableName === "Building") {
        const summary = analyzebuildingData(jsonData[tableName])
        setBuildingSummary(summary)
      }

      // If it's Repeater table, analyze the data
      if (tableName === "Repeater") {
        const summary = analyzerepeaterData(jsonData[tableName])
        setRepeaterSummary(summary)
      }

      // If it's TeachingNonTeaching_Designation table, analyze the data
      if (tableName === "TeachingNonTeaching_Designation") {
        const summary = analyzeteachingnonteachingdesignationData(jsonData[tableName])
        setTeachingNonTeachingDesignationSummary(summary)
      }

      // If it's TeachingNonTeaching_Category table, analyze the data
      if (tableName === "TeachingNonTeaching_Category") {
        const summary = analyzeteachingnonteachingcategoryData(jsonData[tableName])
        setTeachingNonTeachingCategorySummary(summary)
      }

      // If it's Teachers_ProfessionalQualification table, analyze the data
      if (tableName === "Teachers_ProfessionalQualification") {
        const summary = analyzeteachersprofessionalqualification(jsonData[tableName])
        setTeachersProfessionalQualificationSummary(summary)
      }

      // If it's Teachers_AcademicQualification table, analyze the data
      if (tableName === "Teachers_AcademicQualification") {
        const summary = analyzeteachersacademicqualificationData(jsonData[tableName])
        setTeachersAcademicQualificationSummary(summary)
      }

      // If it's ECE_Facilities table, analyze the data
      if (tableName === "ECE_Facilities") {
        const summary = analyzeecefacilitiesData(jsonData[tableName])
        setECEFacilitiesSummary(summary)
      }

      // If it's Student_Profile table, analyze the data
      if (tableName === "Student_Profile") {
        const summary = analyzestudentprofileData(jsonData[tableName])
        setStudentProfileSummary(summary)
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
      setictfacilitiesSummary(null)
      setInstitutionattackSummary(null)
      setInstitutionSecuritySummary(null)
      setnonteachersProfileSummary(null)
      setInstitutionsOtherFacilitiesSummary(null)
      setEnrolmentECEExperienceSummary(null)
      setEnrolmentRefugeeSummary(null)
      setEnrolmentReligionSummary(null)
      setEnrolmentDifficultySummary(null)
      setCorporalPunishmentSummary(null)
      setBuildingSummary(null)
      setRepeaterSummary(null)
      setTeachingNonTeachingCategorySummary(null)
      setTeachingNonTeachingDesignationSummary(null)
      setTeachersProfessionalQualificationSummary(null)
      setTeachersAcademicQualificationSummary(null)
      setECEFacilitiesSummary(null)
      setStudentProfileSummary(null)

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
    setictfacilitiesSummary(null)
    setInstitutionattackSummary(null)
    setInstitutionSecuritySummary(null)
    setnonteachersProfileSummary(null)
    setInstitutionsOtherFacilitiesSummary(null)
    setEnrolmentECEExperienceSummary(null)
    setEnrolmentRefugeeSummary(null)
    setEnrolmentReligionSummary(null)
    setEnrolmentDifficultySummary(null)
    setCorporalPunishmentSummary(null)
    setBuildingSummary(null)
    setRepeaterSummary(null)
    setTeachingNonTeachingCategorySummary(null)
    setTeachingNonTeachingDesignationSummary(null)
    setTeachersProfessionalQualificationSummary(null)
    setTeachersAcademicQualificationSummary(null)
    setECEFacilitiesSummary(null)
    setStudentProfileSummary(null)
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
                        <div className="font-semibold mb-1">By Boundary Wall Facility</div>
                        {Object.entries(FacilitiesSummary.byboundarywall)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([boundarywallId, count]) => (
                            <div key={boundarywallId} className="flex justify-between text-sm">
                              <span style={boundarywallId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{boundarywallId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Toilet Student */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Toilet Student Facility</div>
                        {Object.entries(FacilitiesSummary.bytoiletstudent)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([toiletstudentId, count]) => (
                            <div key={toiletstudentId} className="flex justify-between text-sm">
                              <span style={toiletstudentId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{toiletstudentId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Toilet Staff */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Toilet Staff Facility</div>
                        {Object.entries(FacilitiesSummary.bytoiletstaff)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([toiletstaffId, count]) => (
                            <div key={toiletstaffId} className="flex justify-between text-sm">
                              <span style={toiletstaffId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{toiletstaffId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Telephone */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Telephone Facility</div>
                        {Object.entries(FacilitiesSummary.bytelephone)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([telephoneId, count]) => (
                            <div key={telephoneId} className="flex justify-between text-sm">
                              <span style={telephoneId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{telephoneId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Gas */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Gas Facility</div>
                        {Object.entries(FacilitiesSummary.bygas)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([gasId, count]) => (
                            <div key={gasId} className="flex justify-between text-sm">
                              <span style={gasId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{gasId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Internet */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Internet Facility</div>
                        {Object.entries(FacilitiesSummary.byinternet)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([internetId, count]) => (
                            <div key={internetId} className="flex justify-between text-sm">
                              <span style={internetId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{internetId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Library */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Library Facility</div>
                        {Object.entries(FacilitiesSummary.bylibrary)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([libraryId, count]) => (
                            <div key={libraryId} className="flex justify-between text-sm">
                              <span style={libraryId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{libraryId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Hall */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Hall Facility</div>
                        {Object.entries(FacilitiesSummary.byhall)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([hallId, count]) => (
                            <div key={hallId} className="flex justify-between text-sm">
                              <span style={hallId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{hallId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Playground */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Playground Facility</div>
                        {Object.entries(FacilitiesSummary.byplayground)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([playgroundId, count]) => (
                            <div key={playgroundId} className="flex justify-between text-sm">
                              <span style={playgroundId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{playgroundId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Canteen */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Canteen Facility</div>
                        {Object.entries(FacilitiesSummary.bycanteen)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([canteenId, count]) => (
                            <div key={canteenId} className="flex justify-between text-sm">
                              <span style={canteenId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{canteenId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Hostel */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Hostel Facility</div>
                        {Object.entries(FacilitiesSummary.byhostel)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([hostelId, count]) => (
                            <div key={hostelId} className="flex justify-between text-sm">
                              <span style={hostelId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{hostelId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Store */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Store Facility</div>
                        {Object.entries(FacilitiesSummary.bystore)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([storeId, count]) => (
                            <div key={storeId} className="flex justify-between text-sm">
                              <span style={storeId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{storeId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Home Economics Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Home Economics Lab Facility</div>
                        {Object.entries(FacilitiesSummary.byhomeEconlab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([HomeeconlabId, count]) => (
                            <div key={HomeeconlabId} className="flex justify-between text-sm">
                              <span style={HomeeconlabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{HomeeconlabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Zoology Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Zoology Lab Facility</div>
                        {Object.entries(FacilitiesSummary.byzoologylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([zoologylabId, count]) => (
                            <div key={zoologylabId} className="flex justify-between text-sm">
                              <span style={zoologylabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{zoologylabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Biology Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Biology Lab Facility</div>
                        {Object.entries(FacilitiesSummary.bybiologylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([biologylabId, count]) => (
                            <div key={biologylabId} className="flex justify-between text-sm">
                              <span style={biologylabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{biologylabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Computer Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Computer Lab Facility</div>
                        {Object.entries(FacilitiesSummary.bycomputerlab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([computerlabId, count]) => (
                            <div key={computerlabId} className="flex justify-between text-sm">
                              <span style={computerlabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{computerlabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Chemistry Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Chemistry Lab Facility</div>
                        {Object.entries(FacilitiesSummary.bychemistrylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([chemistrylabId, count]) => (
                            <div key={chemistrylabId} className="flex justify-between text-sm">
                              <span style={chemistrylabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{chemistrylabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Combined Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Combined Lab Facility</div>
                        {Object.entries(FacilitiesSummary.bycombinedlab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([combinedlabId, count]) => (
                            <div key={combinedlabId} className="flex justify-between text-sm">
                              <span style={combinedlabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{combinedlabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Physics Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Physics Lab Facility</div>
                        {Object.entries(FacilitiesSummary.byphysicslab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([physicslabId, count]) => (
                            <div key={physicslabId} className="flex justify-between text-sm">
                              <span style={physicslabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{physicslabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Botany Lab */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Botany Lab Facility</div>
                        {Object.entries(FacilitiesSummary.bybotanylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([botanylabId, count]) => (
                            <div key={botanylabId} className="flex justify-between text-sm">
                              <span style={botanylabId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{botanylabId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By EM Computers */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Computers Facility</div>
                        {Object.entries(FacilitiesSummary.byEMcomputers)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([computersId, count]) => (
                            <div key={computersId} className="flex justify-between text-sm">
                              <span style={computersId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{computersId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By EM Printers */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Printers Facility</div>
                        {Object.entries(FacilitiesSummary.byEmprinter)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([printersId, count]) => (
                            <div key={printersId} className="flex justify-between text-sm">
                              <span style={printersId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{printersId}:</span>
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
                  {/* By Water */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Water Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bywater)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([waterId, count]) => (
                          <div key={waterId} className="flex justify-between text-sm">
                            <span className={`${waterId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{waterId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Electricity */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Electricity Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byelectricity)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([electricityId, count]) => (
                          <div key={electricityId} className="flex justify-between text-sm">
                            <span className={`${electricityId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{electricityId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Boundary Wall */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Boundary Wall Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byboundarywall)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([boundarywallId, count]) => (
                          <div key={boundarywallId} className="flex justify-between text-sm">
                            <span className={`${boundarywallId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{boundarywallId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Toilet Student */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Toilet Student Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bytoiletstudent)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([toiletstudentId, count]) => (
                          <div key={toiletstudentId} className="flex justify-between text-sm">
                            <span className={`${toiletstudentId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{toiletstudentId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Toilet Staff */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Toilet Staff Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bytoiletstaff)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([toiletstaffId, count]) => (
                          <div key={toiletstaffId} className="flex justify-between text-sm">
                            <span className={`${toiletstaffId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{toiletstaffId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Telephone */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Telephone Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bytelephone)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([telephoneId, count]) => (
                          <div key={telephoneId} className="flex justify-between text-sm">
                            <span className={`${telephoneId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{telephoneId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Gas */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gas Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bygas)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([gasId, count]) => (
                          <div key={gasId} className="flex justify-between text-sm">
                            <span className={`${gasId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{gasId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Internet */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Internet Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byinternet)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([internetId, count]) => (
                          <div key={internetId} className="flex justify-between text-sm">
                            <span className={`${internetId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{internetId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Library */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Library Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bylibrary)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([libraryId, count]) => (
                          <div key={libraryId} className="flex justify-between text-sm">
                            <span className={`${libraryId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{libraryId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Hall */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Hall Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byhall)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([hallId, count]) => (
                          <div key={hallId} className="flex justify-between text-sm">
                            <span className={`${hallId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{hallId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Playground */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Playground Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byplayground)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([playgroundId, count]) => (
                          <div key={playgroundId} className="flex justify-between text-sm">
                            <span className={`${playgroundId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{playgroundId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Canteen */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Canteen Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bycanteen)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([canteenId, count]) => (
                          <div key={canteenId} className="flex justify-between text-sm">
                            <span className={`${canteenId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{canteenId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Hostel */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Hostel Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byhostel)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([hostelId, count]) => (
                          <div key={hostelId} className="flex justify-between text-sm">
                            <span className={`${hostelId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{hostelId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Store */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Store Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bystore)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([storeId, count]) => (
                          <div key={storeId} className="flex justify-between text-sm">
                            <span className={`${storeId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{storeId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Home Economics Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Home Economics Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byhomeEconlab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([HomeeconlabId, count]) => (
                          <div key={HomeeconlabId} className="flex justify-between text-sm">
                            <span className={`${HomeeconlabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{HomeeconlabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Zoology Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Zoology Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byzoologylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([zoologylabId, count]) => (
                          <div key={zoologylabId} className="flex justify-between text-sm">
                            <span className={`${zoologylabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{zoologylabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Biology Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Biology Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bybiologylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([biologylabId, count]) => (
                          <div key={biologylabId} className="flex justify-between text-sm">
                            <span className={`${biologylabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{biologylabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Computer Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Computer Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bycomputerlab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([computerlabId, count]) => (
                          <div key={computerlabId} className="flex justify-between text-sm">
                            <span className={`${computerlabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{computerlabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Chemistry Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Chemistry Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bychemistrylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([chemistrylabId, count]) => (
                          <div key={chemistrylabId} className="flex justify-between text-sm">
                            <span className={`${chemistrylabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{chemistrylabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Combined Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Combined Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bycombinedlab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([combinedlabId, count]) => (
                          <div key={combinedlabId} className="flex justify-between text-sm">
                            <span className={`${combinedlabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{combinedlabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Physics Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Physics Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byphysicslab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([physicslabId, count]) => (
                          <div key={physicslabId} className="flex justify-between text-sm">
                            <span className={`${physicslabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{physicslabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Botany Lab */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Botany Lab Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.bybotanylab)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([botanylabId, count]) => (
                          <div key={botanylabId} className="flex justify-between text-sm">
                            <span className={`${botanylabId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{botanylabId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By EM Computers */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By EM Computers Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byEMcomputers)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([computersId, count]) => (
                          <div key={computersId} className="flex justify-between text-sm">
                            <span className={`${computersId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{computersId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By EM Printers */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By EM Printers Facility</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(FacilitiesSummary.byEmprinter)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([printersId, count]) => (
                          <div key={printersId} className="flex justify-between text-sm">
                            <span className={`${printersId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{printersId}:</span>
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
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Facilities-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* ICT-Facilities-specific summary */}
            {selectedTable === "ICT_Facilities" && ictfacilitiesSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">ICT Facilities Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{ictfacilitiesSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(ictfacilitiesSummary.byfacilitiesavailable).length} ICT facility statuses,
                        {Object.keys(ictfacilitiesSummary.bypedagogymaterialavailable).length} pedagogy material availability statuses,
                        {Object.keys(ictfacilitiesSummary.bymaterialforonlineuseavailable).length} material for online use availability statuses,
                        {Object.keys(ictfacilitiesSummary.byinternetavailableforpedagogical).length} internet availability for pedagogical use statuses,
                        {Object.keys(ictfacilitiesSummary.bycomputersavailableforpedagogical).length} computer availability for pedagogical use statuses,
                        {Object.keys(ictfacilitiesSummary.bytabletavailableforpedagogical).length} tablet availability for pedagogical use statuses,
                        {Object.keys(ictfacilitiesSummary.bysmartboardavailableforpedagogical).length} smartboard availability for pedagogical use statuses,
                        and {Object.keys(ictfacilitiesSummary.byothers).length} other ICT facility statuses.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By ICTFacilites_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By ICTFacilites Available</div>
                        {Object.entries(ictfacilitiesSummary.byfacilitiesavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([facilitiesavailableId, count]) => (
                            <div key={facilitiesavailableId} className="flex justify-between text-sm">
                              <span style={facilitiesavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{facilitiesavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By ICTPedagogyMaterial_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By ICTPedagogyMaterial Available</div>
                        {Object.entries(ictfacilitiesSummary.bypedagogymaterialavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ictpedagogymaterialavailableId, count]) => (
                            <div key={ictpedagogymaterialavailableId} className="flex justify-between text-sm">
                              <span style={ictpedagogymaterialavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{ictpedagogymaterialavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By ICTmaterial_Foronline_Use_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Material For Online Use Available</div>
                        {Object.entries(ictfacilitiesSummary.bymaterialforonlineuseavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([materialforonlineuseavailableId, count]) => (
                            <div key={materialforonlineuseavailableId} className="flex justify-between text-sm">
                              <span style={materialforonlineuseavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{materialforonlineuseavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Internet_Available_Forpedagogical */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Internet Available For Pedagogical</div>
                        {Object.entries(ictfacilitiesSummary.byinternetavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([internetavailableforpedagogicalId, count]) => (
                            <div key={internetavailableforpedagogicalId} className="flex justify-between text-sm">
                              <span style={internetavailableforpedagogicalId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{internetavailableforpedagogicalId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Computers_Available_Forpedagogical */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Computers Available For Pedagogical</div>
                        {Object.entries(ictfacilitiesSummary.bycomputersavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([computersavailableforpedagogicalId, count]) => (
                            <div key={computersavailableforpedagogicalId} className="flex justify-between text-sm">
                              <span style={computersavailableforpedagogicalId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{computersavailableforpedagogicalId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Tablet_Available_Forpedagogical */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Tablet Available For Pedagogical</div>
                        {Object.entries(ictfacilitiesSummary.bytabletavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([tabletavailableforpedagogicalId, count]) => (
                            <div key={tabletavailableforpedagogicalId} className="flex justify-between text-sm">
                              <span style={tabletavailableforpedagogicalId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{tabletavailableforpedagogicalId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By SmartBoard_Available_Forpedagogical */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By SmartBoard Available For Pedagogical</div>
                        {Object.entries(ictfacilitiesSummary.bysmartboardavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([smartboardavailableforpedagogicalId, count]) => (
                            <div key={smartboardavailableforpedagogicalId} className="flex justify-between text-sm">
                              <span style={smartboardavailableforpedagogicalId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{smartboardavailableforpedagogicalId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Others */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Others</div>
                        {Object.entries(ictfacilitiesSummary.byothers)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([othersId, count]) => (
                            <div key={othersId} className="flex justify-between text-sm">
                              <span style={othersId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{othersId}:</span>
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
                  {/* By ICTFacilites_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Facilites Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.byfacilitiesavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([facilitiesavailableId, count]) => (
                          <div key={facilitiesavailableId} className="flex justify-between text-sm">
                            <span className={`${facilitiesavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{facilitiesavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By ICTPedagogyMaterial_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By PedagogyMaterial Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.bypedagogymaterialavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([ictpedagogymaterialavailableId, count]) => (
                          <div key={ictpedagogymaterialavailableId} className="flex justify-between text-sm">
                            <span className={`${ictpedagogymaterialavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{ictpedagogymaterialavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By ICTmaterial_Foronline_Use_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Material For Online Use Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.bymaterialforonlineuseavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([materialforonlineuseavailableId, count]) => (
                          <div key={materialforonlineuseavailableId} className="flex justify-between text-sm">
                            <span className={`${materialforonlineuseavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{materialforonlineuseavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Internet_Available_Forpedagogical */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Internet Available For Pedagogical</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.byinternetavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([internetavailableforpedagogicalId, count]) => (
                          <div key={internetavailableforpedagogicalId} className="flex justify-between text-sm">
                            <span className={`${internetavailableforpedagogicalId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{internetavailableforpedagogicalId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Computers_Available_Forpedagogical */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Computers Available For Pedagogical</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.bycomputersavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([computersavailableforpedagogicalId, count]) => (
                          <div key={computersavailableforpedagogicalId} className="flex justify-between text-sm">
                            <span className={`${computersavailableforpedagogicalId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{computersavailableforpedagogicalId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Tablet_Available_Forpedagogical */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Tablet Available For Pedagogical</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.bytabletavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([tabletavailableforpedagogicalId, count]) => (
                          <div key={tabletavailableforpedagogicalId} className="flex justify-between text-sm">
                            <span className={`${tabletavailableforpedagogicalId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{tabletavailableforpedagogicalId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By SmartBoard_Available_Forpedagogical */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By SmartBoard Available For Pedagogical</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.bysmartboardavailableforpedagogical)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([smartboardavailableforpedagogicalId, count]) => (
                          <div key={smartboardavailableforpedagogicalId} className="flex justify-between text-sm">
                            <span className={`${smartboardavailableforpedagogicalId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{smartboardavailableforpedagogicalId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Others */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Others</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(ictfacilitiesSummary.byothers)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([othersId, count]) => (
                          <div key={othersId} className="flex justify-between text-sm">
                            <span className={`${othersId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{othersId}:</span>
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
                      Total of <strong>{ictfacilitiesSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(ictfacilitiesSummary.byfacilitiesavailable).length} ICT facility statuses,
                        {Object.keys(ictfacilitiesSummary.bypedagogymaterialavailable).length} pedagogy material availability statuses,
                        {Object.keys(ictfacilitiesSummary.bymaterialforonlineuseavailable).length} material for online use availability statuses,
                        {Object.keys(ictfacilitiesSummary.byinternetavailableforpedagogical).length} internet availability for pedagogical use statuses,
                        {Object.keys(ictfacilitiesSummary.bycomputersavailableforpedagogical).length} computer availability for pedagogical use statuses,
                        {Object.keys(ictfacilitiesSummary.bytabletavailableforpedagogical).length} tablet availability for pedagogical use statuses,
                        {Object.keys(ictfacilitiesSummary.bysmartboardavailableforpedagogical).length} smartboard availability for pedagogical use statuses,
                        and {Object.keys(ictfacilitiesSummary.byothers).length} other ICT facility statuses.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `ICT_Facilities-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Institution-Attack-specific summary */}
            {selectedTable === "Institution_Attack" && InstitutionattackSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Institution Attack Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{InstitutionattackSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(InstitutionattackSummary.byinstitutionattacked).length} institution attack statuses,
                        and {Object.keys(InstitutionattackSummary.byfirregistered).length} FIR registered statuses.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Institution_Attacked */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Institution Attacked</div>
                        {Object.entries(InstitutionattackSummary.byinstitutionattacked)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([institutionattackedId, count]) => (
                            <div key={institutionattackedId} className="flex justify-between text-sm">
                              <span style={institutionattackedId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{institutionattackedId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By FIR_Registered */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By FIR Registered</div>
                        {Object.entries(InstitutionattackSummary.byfirregistered)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([firregisteredId, count]) => (
                            <div key={firregisteredId} className="flex justify-between text-sm">
                              <span style={firregisteredId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{firregisteredId}:</span>
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
                  {/* By Institution_Attacked */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Institution Attacked</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionattackSummary.byinstitutionattacked)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([institutionattackedId, count]) => (
                          <div key={institutionattackedId} className="flex justify-between text-sm">
                            <span className={`${institutionattackedId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{institutionattackedId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By FIR_Registered */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By FIR Registered</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionattackSummary.byfirregistered)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([firregisteredId, count]) => (
                          <div key={firregisteredId} className="flex justify-between text-sm">
                            <span className={`${firregisteredId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{firregisteredId}:</span>
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
                      Total of <strong>{InstitutionattackSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(InstitutionattackSummary.byinstitutionattacked).length} institution attack statuses,
                        and {Object.keys(InstitutionattackSummary.byfirregistered).length} FIR registered statuses.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Institution-Attack-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Institution-Security-specific summary */}
            {selectedTable === "Institution_Security" && InstitutionSecuritySummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Institution Security Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{InstitutionSecuritySummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(InstitutionSecuritySummary.bysecurityavailable).length} security available statuses,
                        {Object.keys(InstitutionSecuritySummary.bysecurityguardavailable).length} security guard available statuses,
                        {Object.keys(InstitutionSecuritySummary.bybarbedwireavailable).length} barbed wire available statuses,
                        {Object.keys(InstitutionSecuritySummary.byglassspikesavailable).length} glass spikes available statuses,
                        {Object.keys(InstitutionSecuritySummary.byentranceblocksavailable).length} entrance blocks available statuses,
                        {Object.keys(InstitutionSecuritySummary.bycctvcameraavailable).length} CCTV camera available statuses,
                        and  {Object.keys(InstitutionSecuritySummary.bybarrieravailable).length} barrier available statuses.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Security_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Security Available</div>
                        {Object.entries(InstitutionSecuritySummary.bysecurityavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([securityavailableId, count]) => (
                            <div key={securityavailableId} className="flex justify-between text-sm">
                              <span style={securityavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{securityavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By SecurityGuard_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Security Guard Available</div>
                        {Object.entries(InstitutionSecuritySummary.bysecurityguardavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([securityguardavailableId, count]) => (
                            <div key={securityguardavailableId} className="flex justify-between text-sm">
                              <span style={securityguardavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{securityguardavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By BarbedWire_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Barbed Wire Available</div>
                        {Object.entries(InstitutionSecuritySummary.bybarbedwireavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([barbedwireavailableId, count]) => (
                            <div key={barbedwireavailableId} className="flex justify-between text-sm">
                              <span style={barbedwireavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{barbedwireavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By GlassSpikes_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Glass Spikes Available</div>
                        {Object.entries(InstitutionSecuritySummary.byglassspikesavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([glassspikesavailableId, count]) => (
                            <div key={glassspikesavailableId} className="flex justify-between text-sm">
                              <span style={glassspikesavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{glassspikesavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By EntranceBlocks_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Entrance Blocks Available</div>
                        {Object.entries(InstitutionSecuritySummary.byentranceblocksavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([entranceblocksavailableId, count]) => (
                            <div key={entranceblocksavailableId} className="flex justify-between text-sm">
                              <span style={entranceblocksavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{entranceblocksavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By CCTVCamera_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By CCTV Camera Available</div>
                        {Object.entries(InstitutionSecuritySummary.bycctvcameraavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([cctvcameraavailableId, count]) => (
                            <div key={cctvcameraavailableId} className="flex justify-between text-sm">
                              <span style={cctvcameraavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{cctvcameraavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>
                      {/* By Barrier_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Barrier Available</div>
                        {Object.entries(InstitutionSecuritySummary.bybarrieravailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([barrieravailableId, count]) => (
                            <div key={barrieravailableId} className="flex justify-between text-sm">
                              <span style={barrieravailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{barrieravailableId}:</span>
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
                  {/* By Security_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Security Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.bysecurityavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([securityavailableId, count]) => (
                          <div key={securityavailableId} className="flex justify-between text-sm">
                            <span className={`${securityavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{securityavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By SecurityGuard_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Security Guard Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.bysecurityguardavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([securityguardavailableId, count]) => (
                          <div key={securityguardavailableId} className="flex justify-between text-sm">
                            <span className={`${securityguardavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{securityguardavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By BarbedWire_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Barbed Wire Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.bybarbedwireavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([barbedwireavailableId, count]) => (
                          <div key={barbedwireavailableId} className="flex justify-between text-sm">
                            <span className={`${barbedwireavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{barbedwireavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By GlassSpikes_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Glass Spikes Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.byglassspikesavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([glassspikesavailableId, count]) => (
                          <div key={glassspikesavailableId} className="flex justify-between text-sm">
                            <span className={`${glassspikesavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{glassspikesavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By EntranceBlocks_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Entrance Blocks Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.byentranceblocksavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([entranceblocksavailableId, count]) => (
                          <div key={entranceblocksavailableId} className="flex justify-between text-sm">
                            <span className={`${entranceblocksavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{entranceblocksavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By CCTVCamera_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By CCTV Camera Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.bycctvcameraavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([cctvcameraavailableId, count]) => (
                          <div key={cctvcameraavailableId} className="flex justify-between text-sm">
                            <span className={`${cctvcameraavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{cctvcameraavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Barrier_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Barrier Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionSecuritySummary.bybarrieravailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([barrieravailableId, count]) => (
                          <div key={barrieravailableId} className="flex justify-between text-sm">
                            <span className={`${barrieravailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{barrieravailableId}:</span>
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
                      Total of <strong>{InstitutionSecuritySummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(InstitutionSecuritySummary.bysecurityavailable).length} security available statuses,
                        {Object.keys(InstitutionSecuritySummary.bysecurityguardavailable).length} security guard available statuses,
                        {Object.keys(InstitutionSecuritySummary.bybarbedwireavailable).length} barbed wire available statuses,
                        {Object.keys(InstitutionSecuritySummary.byglassspikesavailable).length} glass spikes available statuses,
                        {Object.keys(InstitutionSecuritySummary.byentranceblocksavailable).length} entrance blocks available statuses,
                        {Object.keys(InstitutionSecuritySummary.bycctvcameraavailable).length} CCTV camera available statuses,
                        and  {Object.keys(InstitutionSecuritySummary.bybarrieravailable).length} barrier available statuses.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Institution-Security-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Non-Teachers-Profile-specific summary */}
            {selectedTable === "Non_Teachers_Profile" && nonteachersProfileSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Non-Teachers Profile Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{nonteachersProfileSummary.TotalnonTeachers}</strong> rows will be uploaded. The
                        data includes {Object.keys(nonteachersProfileSummary.bystaff).length} staff categories,
                        {Object.keys(nonteachersProfileSummary.bygender).length} Gender categories,
                        {Object.keys(nonteachersProfileSummary.bydesignation).length} Designation categories,
                        {Object.keys(nonteachersProfileSummary.bybasicpayscale).length} Basic Pay Scale categories,
                        {Object.keys(nonteachersProfileSummary.bynatureofservice).length} Nature of Service categories,
                        {Object.keys(nonteachersProfileSummary.bydifficultytype).length} Difficulty Type categories,
                        and {Object.keys(nonteachersProfileSummary.bydifficultycategory).length} Difficulty Category categories.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Staff */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Staff</div>
                        {Object.entries(nonteachersProfileSummary.bystaff)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([staffId, count]) => (
                            <div key={staffId} className="flex justify-between text-sm">
                              <span style={staffId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{staffId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Gender */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Gender</div>
                        {Object.entries(nonteachersProfileSummary.bygender)
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

                      {/* By Designation */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Designation</div>
                        {Object.entries(nonteachersProfileSummary.bydesignation)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([designationId, count]) => (
                            <div key={designationId} className="flex justify-between text-sm">
                              <span style={designationId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{designationId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By BasicPayScale */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Basic Pay Scale</div>
                        {Object.entries(nonteachersProfileSummary.bybasicpayscale)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([basicpayscaleId, count]) => (
                            <div key={basicpayscaleId} className="flex justify-between text-sm">
                              <span style={basicpayscaleId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{basicpayscaleId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By NatureOfService */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Nature of Service</div>
                        {Object.entries(nonteachersProfileSummary.bynatureofservice)
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

                      {/* By DifficultyType */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Difficulty Type</div>
                        {Object.entries(nonteachersProfileSummary.bydifficultytype)
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

                      {/* By DifficultyCategory */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Difficulty Category</div>
                        {Object.entries(nonteachersProfileSummary.bydifficultycategory)
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
                  {/* By Staff */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Staff</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bystaff)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([staffId, count]) => (
                          <div key={staffId} className="flex justify-between text-sm">
                            <span className={`${staffId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{staffId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender Id</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bygender)
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

                  {/* By Designation */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Designation</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bydesignation)
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

                  {/* By BasicPayScale */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Basic Pay Scale</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bybasicpayscale)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([basicpayscaleId, count]) => (
                          <div key={basicpayscaleId} className="flex justify-between text-sm">
                            <span className={`${basicpayscaleId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{basicpayscaleId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By NatureOfService */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Nature of Service</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bynatureofservice)
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

                  {/* By DifficultyType */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Difficulty Type</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bydifficultytype)
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

                  {/* By DifficultyCategory */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Difficulty Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(nonteachersProfileSummary.bydifficultycategory)
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
                      Total of <strong>{nonteachersProfileSummary.TotalnonTeachers}</strong> rows will be uploaded. The
                        data includes {Object.keys(nonteachersProfileSummary.bystaff).length} staff categories,
                        {Object.keys(nonteachersProfileSummary.bygender).length} Gender Categories,
                        {Object.keys(nonteachersProfileSummary.bydesignation).length} Designation categories,
                        {Object.keys(nonteachersProfileSummary.bybasicpayscale).length} Basic Pay Scale categories,
                        {Object.keys(nonteachersProfileSummary.bynatureofservice).length} Nature of Service categories,
                        {Object.keys(nonteachersProfileSummary.bydifficultytype).length} Difficulty Type categories,
                        and {Object.keys(nonteachersProfileSummary.bydifficultycategory).length} Difficulty Category categories.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Non-Teachers-Profile-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Institution OtherFacilities-specific summary */}
            {selectedTable === "Institutions_OtherFacilities" && InstitutionsOtherFacilitiesSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Institutions Other Facilities Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{InstitutionsOtherFacilitiesSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(InstitutionsOtherFacilitiesSummary.byrampavailable).length} ramp available statuses,
                        {Object.keys(InstitutionsOtherFacilitiesSummary.byspecialchildrenavailable).length} special children available statuses,
                        and {Object.keys(InstitutionsOtherFacilitiesSummary.bydaycareroomavailable).length} day care room available statuses.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Ramp_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Ramp Available</div>
                        {Object.entries(InstitutionsOtherFacilitiesSummary.byrampavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([rampavailableId, count]) => (
                            <div key={rampavailableId} className="flex justify-between text-sm">
                              <span style={rampavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{rampavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By SpecialChildren_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Special Children Available</div>
                        {Object.entries(InstitutionsOtherFacilitiesSummary.byspecialchildrenavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([specialchildrenavailableId, count]) => (
                            <div key={specialchildrenavailableId} className="flex justify-between text-sm">
                              <span style={specialchildrenavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{specialchildrenavailableId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By DayCareRoom_Available */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Day Care Room Available</div>
                        {Object.entries(InstitutionsOtherFacilitiesSummary.bydaycareroomavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([daycareroomavailableId, count]) => (
                            <div key={daycareroomavailableId} className="flex justify-between text-sm">
                              <span style={daycareroomavailableId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{daycareroomavailableId}:</span>
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
                  {/* By Ramp_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Ramp Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionsOtherFacilitiesSummary.byrampavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([rampavailableId, count]) => (
                          <div key={rampavailableId} className="flex justify-between text-sm">
                            <span className={`${rampavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{rampavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By SpecialChildren_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Special Children Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionsOtherFacilitiesSummary.byspecialchildrenavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([specialchildrenavailableId, count]) => (
                          <div key={specialchildrenavailableId} className="flex justify-between text-sm">
                            <span className={`${specialchildrenavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{specialchildrenavailableId}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By DayCareRoom_Available */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Day Care Room Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(InstitutionsOtherFacilitiesSummary.bydaycareroomavailable)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([daycareroomavailableId, count]) => (
                          <div key={daycareroomavailableId} className="flex justify-between text-sm">
                            <span className={`${daycareroomavailableId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{daycareroomavailableId}:</span>
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
                      Total of <strong>{InstitutionsOtherFacilitiesSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(InstitutionsOtherFacilitiesSummary.byrampavailable).length} ramp available statuses,
                        {Object.keys(InstitutionsOtherFacilitiesSummary.byspecialchildrenavailable).length} special children available statuses,
                        and {Object.keys(InstitutionsOtherFacilitiesSummary.bydaycareroomavailable).length} day care room available statuses.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Institutions-Other-Facilities-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Enrolment ECEExperience-specific summary */}
            {selectedTable === "Enrolment_ECEExperience" && EnrolmentECEExperienceSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Enrolment ECE Experience Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{EnrolmentECEExperienceSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(EnrolmentECEExperienceSummary.byclass).length} class categories,
                        {Object.keys(EnrolmentECEExperienceSummary.bygender).length} Gender categories,
                        and {Object.keys(EnrolmentECEExperienceSummary.byshift).length} Shift categories.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* By Class */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Class</div>
                        {Object.entries(EnrolmentECEExperienceSummary.byclass)
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
                        {Object.entries(EnrolmentECEExperienceSummary.bygender)
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

                      {/* By Shift */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Shift</div>
                        {Object.entries(EnrolmentECEExperienceSummary.byshift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shiftId, count]) => (
                            <div key={shiftId} className="flex justify-between text-sm">
                              <span style={shiftId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{shiftId}:</span>
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
                      <CardTitle className="text-sm font-medium">By Class</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolmentECEExperienceSummary.byclass)
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

                  {/* By gender */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Gender</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolmentECEExperienceSummary.bygender)
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

                  {/* By Shift */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Shift</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolmentECEExperienceSummary.byshift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shiftId, count]) => (
                          <div key={shiftId} className="flex justify-between text-sm">
                            <span className={`${shiftId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{shiftId}:</span>
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
                      Total of <strong>{EnrolmentECEExperienceSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(EnrolmentECEExperienceSummary.byclass).length} class categories,
                        {Object.keys(EnrolmentECEExperienceSummary.bygender).length} Gender categories,
                        and {Object.keys(EnrolmentECEExperienceSummary.byshift).length} Shift categories.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Enrolment-ECE-Experience-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Enrolment Refugee-specific summary */}
            {selectedTable === "Enrolment_Refugee" && EnrolmentRefugeeSummary && (
              <div className="space-y-4">
                {/* PDF Meta and Summary for PDF export */}
                <div style={{ display: 'none' }}>
                  <div ref={pdfMetaRef}>
                    <div className="mb-4 p-4 border-b border-gray-300">
                      <h2 className="text-xl font-bold text-blue-900 mb-2">Enrolment Refugee Data Summary Report</h2>
                      <div className="text-sm text-gray-700">
                        <div><strong>Generated by:</strong> {username}</div>
                        <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Summary</h4>
                      <p className="text-sm text-green-800">
                        Total of <strong>{EnrolmentRefugeeSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(EnrolmentRefugeeSummary.byclass).length} class categories,
                        {Object.keys(EnrolmentRefugeeSummary.bygender).length} Gender categories,
                        {Object.keys(EnrolmentRefugeeSummary.bynationality).length} Nationality categories,
                        and {Object.keys(EnrolmentRefugeeSummary.byshift).length} Shift categories.
                      </p>
                    </div>
                    {/* Full breakdown for PDF */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      {/* By Class */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Class</div>
                        {Object.entries(EnrolmentRefugeeSummary.byclass)
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
                        {Object.entries(EnrolmentRefugeeSummary.bygender)
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

                      {/* By Nationality */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Nationality</div>
                        {Object.entries(EnrolmentRefugeeSummary.bynationality)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([nationalityId, count]) => (
                            <div key={nationalityId} className="flex justify-between text-sm">
                              <span style={nationalityId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{nationalityId}:</span>
                              <span>{count}</span>
                            </div>
                        ))}
                      </div>

                      {/* By Shift */}
                      <div className="border rounded p-2">
                        <div className="font-semibold mb-1">By Shift</div>
                        {Object.entries(EnrolmentRefugeeSummary.byshift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shiftId, count]) => (
                            <div key={shiftId} className="flex justify-between text-sm">
                              <span style={shiftId.includes('Unknown') ? { color: 'red', fontWeight: 'bold' } : {}}>{shiftId}:</span>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* By Class */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Class</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolmentRefugeeSummary.byclass)
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
                        {Object.entries(EnrolmentRefugeeSummary.bygender)
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

                  {/* By Nationality */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">By Nationality</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(EnrolmentRefugeeSummary.bynationality)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([nationalityId, count]) => (
                            <div key={nationalityId} className="flex justify-between text-sm">
                              <span className={`${nationalityId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{nationalityId}:</span>
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
                        {Object.entries(EnrolmentRefugeeSummary.byshift)
                          .sort(([a], [b]) => {
                            if (a.includes('Unknown')) return -1;
                            if (b.includes('Unknown')) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([shiftId, count]) => (
                          <div key={shiftId} className="flex justify-between text-sm">
                            <span className={`${shiftId.includes('Unknown') ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{shiftId}:</span>
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
                      Total of <strong>{EnrolmentRefugeeSummary.TotalNumberofRows}</strong> rows will be uploaded. The
                        data includes {Object.keys(EnrolmentRefugeeSummary.byclass).length} class categories,
                        {Object.keys(EnrolmentRefugeeSummary.bygender).length} Gender categories,
                        {Object.keys(EnrolmentRefugeeSummary.bynationality).length} Nationality categories,
                        and {Object.keys(EnrolmentRefugeeSummary.byshift).length} Shift categories.
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 md:ml-6 rounded-lg shadow font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 transition-colors duration-200 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => {
                      if (pdfMetaRef.current) {
                        downloadElementAsPDF(pdfMetaRef.current, `Enrolment-Refugee-Data-Summary.pdf`)
                      }
                    }}
                  >
                    Download Data Summary as PDF
                  </Button>
                </div>
              </div>
            )}

            {/* summary for tables */}
            {selectedTable !== "Institutions" && "Teachers_Profile" && "EnrolAgeWise" && "Facilities" && "ICT_Facilities" && "Institution_Attack" && "Institution_Security" && "Non_Teachers_Profile" && "Institutions_OtherFacilities" && "Enrolment_ECEExperience" && "Enrolment_Refugee" && "Enrolment_Religion" && "Enrolment_Difficulty" && "Corporal_Punishment" && "Rooms" && "Building" && "Repeaters" && "TeachingNonTeaching_Category" && "TeachingNonTeaching_Designation" && "Teachers_ProfessionalQualification" && "Teachers_AcademicQualification" && "ECE_Facilities" && "Sanctioned_Teaching_Non_Teaching" && "Student_Profile" && parsedJsonData && selectedTable && (
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