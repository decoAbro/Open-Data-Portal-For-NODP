// Types for our storage
export interface UserData {
  id: number
  username: string
  lastLogin: string
  status: "active" | "inactive"
  uploadPermission: boolean
  hasUploaded: boolean
  uploadDeadline?: string // For upload deadline
}

export interface Notification {
  id: number
  username: string
  message: string
  date: string
  read: boolean
  type?: "upload_window" | "general" | "table_reminder"
  deadline?: string
  tableName?: string
  year: string  // Make year required instead of optional
}

export interface UploadRecord {
  id: number
  username: string
  filename: string
  uploadDate: string
  fileSize: string
  year: string
  status: "success" | "failed" | "pending"
  message?: string
}

export interface TableUploadRecord {
  id: number
  username: string
  tableName: string
  filename: string
  uploadDate: string
  fileSize: string
  year: string
  status: "success" | "failed"
  recordCount: number
  message?: string
}

export interface DataNotAvailableRecord {
  id: number
  username: string
  tableName: string
  reportDate: string
  year: string
}

// Storage keys
const USERS_STORAGE_KEY = "pie-portal-users"
const USERS_FETCHED_AT_KEY = "pie-portal-users-fetched-at"
const NOTIFICATIONS_STORAGE_KEY = "pie-portal-notifications"
const UPLOAD_HISTORY_KEY = "pie-portal-upload-history"
const TABLE_UPLOADS_KEY = "pie-portal-table-uploads"
const DATA_NOT_AVAILABLE_KEY = "pie-portal-data-not-available"
const CURRENT_YEAR_KEY = "pie-portal-current-year"
const TABLES_LIST_KEY = "pie-portal-tables-list"
const ADMIN_PASSWORD_KEY = "pie-portal-admin-password"

// Initial users data
const initialUsers: UserData[] = [
  {
    id: 1,
    username: "piera",
    lastLogin: "2024-06-11 10:23 AM",
    status: "active",
    uploadPermission: false,
    hasUploaded: false,
  },
  {
    id: 2,
    username: "punjab",
    lastLogin: "2024-06-10 03:45 PM",
    status: "active",
    uploadPermission: false,
    hasUploaded: false,
  },
  {
    id: 3,
    username: "sindh",
    lastLogin: "2024-06-09 11:30 AM",
    status: "active",
    uploadPermission: false,
    hasUploaded: false,
  },
  {
    id: 4,
    username: "kpk",
    lastLogin: "2024-06-08 09:15 AM",
    status: "active",
    uploadPermission: false,
    hasUploaded: false,
  },
  {
    id: 5,
    username: "balochistan",
    lastLogin: "2024-06-07 02:20 PM",
    status: "active",
    uploadPermission: false,
    hasUploaded: false,
  },
]

// Initial tables list
const initialTables = [
  "Institutions",
  "Teachers_Profile",
  "EnrolAgeWise",
  "Facilities",
  "ICT_Facilities",
  "Institution_Attack",
  "Institution_Security",
  "Non_Teachers_Profile",
  "Institutions_OtherFacilities",
  "Enrolment_ECEExperience",
  "Enrolment_Refugee",
  "Enrolment_Religion",
  "Enrolment_Difficulty",
  "Corporal_Punishment",
  "Rooms",
  "Building",
  "Repeaters",
  "TeachingNonTeaching_Category",
  "TeachingNonTeaching_Designation",
  "Teachers_ProfessionalQualification",
  "Teachers_AcademicQualification",
  "ECE_Facilities",
  "Sanctioned_Teaching_Non_Teaching",
  "Student_Profile",
]

// Check if we're on the client side
const isClient = typeof window !== "undefined"

// Initialize storage if it doesn't exist
export function initializeStorage() {
  if (!isClient) return

  // Initialize users
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers))
  }

  // Attempt to refresh users from API in the background (non-blocking)
  ;(async () => {
    try {
      await refreshUsersFromAPI()
    } catch (e) {
      console.warn("User sync from API failed during initializeStorage", e)
    }
  })()

  // Initialize notifications
  if (!localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]))
  }

  // Initialize upload history
  if (!localStorage.getItem(UPLOAD_HISTORY_KEY)) {
    localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify([]))
  }

  // Initialize table uploads
  if (!localStorage.getItem(TABLE_UPLOADS_KEY)) {
    localStorage.setItem(TABLE_UPLOADS_KEY, JSON.stringify([]))
  }

  // Initialize data not available records
  if (!localStorage.getItem(DATA_NOT_AVAILABLE_KEY)) {
    localStorage.setItem(DATA_NOT_AVAILABLE_KEY, JSON.stringify([]))
  }

  // Initialize current year if not set
  if (!localStorage.getItem(CURRENT_YEAR_KEY)) {
    localStorage.setItem(CURRENT_YEAR_KEY, new Date().getFullYear().toString())
  }

  // Initialize tables list
  if (!localStorage.getItem(TABLES_LIST_KEY)) {
    localStorage.setItem(TABLES_LIST_KEY, JSON.stringify(initialTables))
  }

  // Initialize admin password if not set
  if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
    localStorage.setItem(ADMIN_PASSWORD_KEY, "Sapphire123")
  }
}

// User functions
export function getUsers(): UserData[] {
  if (!isClient) return initialUsers
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY)
    return users ? JSON.parse(users) : initialUsers
  } catch (error) {
    console.error("Error getting users:", error)
    return initialUsers
  }
}

// Internal helper to persist users and emit an event
function storeUsers(users: UserData[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  localStorage.setItem(USERS_FETCHED_AT_KEY, Date.now().toString())
  // Notify interested components/hooks
  window.dispatchEvent(new CustomEvent("usersUpdated"))
}

// Fetch users from the backend API and merge into local storage
// force = true bypasses staleness checks
export async function refreshUsersFromAPI(force = false): Promise<UserData[] | null> {
  if (!isClient) return null
  try {
    // Basic staleness control: 5 minutes
    const fetchedAtRaw = localStorage.getItem(USERS_FETCHED_AT_KEY)
    const fetchedAt = fetchedAtRaw ? parseInt(fetchedAtRaw, 10) : 0
    const isStale = Date.now() - fetchedAt > 5 * 60 * 1000
    if (!force && !isStale) {
      return getUsers()
    }

    const res = await fetch('/api/users', { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.status}`)
    }
    const data = await res.json()
    if (!data?.users || !Array.isArray(data.users)) {
      throw new Error('Malformed users payload')
    }

    // Transform API users to local UserData shape
    const transformed: UserData[] = data.users.map((u: any, idx: number) => {
      const lastLoginISO = u.last_login || u.lastLogin || null
      let lastLoginDisplay = ""
      try {
        lastLoginDisplay = lastLoginISO ? new Date(lastLoginISO).toLocaleString() : ""
      } catch {
        lastLoginDisplay = lastLoginISO || ""
      }
      return {
        id: typeof u.id === 'number' ? u.id : idx + 1,
        username: u.username || '',
        lastLogin: lastLoginDisplay,
        status: (u.status === 'inactive' ? 'inactive' : 'active'),
        uploadPermission: false,
        hasUploaded: false,
      }
    })

    // Preserve existing client-only flags (uploadPermission, hasUploaded) if usernames match
    const existing = getUsers()
    const merged = transformed.map(apiUser => {
      const match = existing.find(e => e.username === apiUser.username)
      return match ? { ...apiUser, uploadPermission: match.uploadPermission, hasUploaded: match.hasUploaded, uploadDeadline: match.uploadDeadline } : apiUser
    })

    storeUsers(merged)
    return merged
  } catch (error) {
    console.error('Error refreshing users from API:', error)
    return null
  }
}

export function updateUser(updatedUser: UserData) {
  if (!isClient) return
  try {
    const users = getUsers()
    const updatedUsers = users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
  } catch (error) {
    console.error("Error updating user:", error)
  }
}

export function getUserByUsername(username: string): UserData | undefined {
  const users = getUsers()
  return users.find((user) => user.username === username)
}

export function updateUserByUsername(username: string, updates: Partial<UserData>) {
  if (!isClient) return
  try {
    const users = getUsers()
    const updatedUsers = users.map((user) => {
      if (user.username === username) {
        return { ...user, ...updates }
      }
      return user
    })
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
  } catch (error) {
    console.error("Error updating user by username:", error)
  }
}

// Notification functions
export function getNotifications(): Notification[] {
  if (!isClient) return []
  try {
    const notifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    return notifications ? JSON.parse(notifications) : []
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

export function addNotification(notification: Omit<Notification, "id">) {
  if (!isClient) return
  try {
    const notifications = getNotifications()
    const newNotification = {
      ...notification,
      id: Date.now(),
    }
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([newNotification, ...notifications]))
  } catch (error) {
    console.error("Error adding notification:", error)
  }
}

export function getNotificationsForUser(username: string): Notification[] {
  const notifications = getNotifications()
  return notifications.filter((notification) => notification.username === username || notification.username === "all")
}

export function markNotificationAsRead(id: number) {
  if (!isClient) return
  try {
    const notifications = getNotifications()
    const updatedNotifications = notifications.map((notification) => {
      if (notification.id === id) {
        return { ...notification, read: true }
      }
      return notification
    })
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications))
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

export function clearNotificationsForUser(username: string) {
  if (!isClient) return
  try {
    const notifications = getNotifications()
    const updatedNotifications = notifications.filter(
      (notification) => notification.username !== username && notification.username !== "all",
    )
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications))
  } catch (error) {
    console.error("Error clearing notifications for user:", error)
  }
}

export function clearAllNotifications() {
  if (!isClient) return
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]))
  } catch (error) {
    console.error("Error clearing all notifications:", error)
  }
}

// Upload history functions
export function getUploadHistory(): UploadRecord[] {
  if (!isClient) return []
  try {
    const history = localStorage.getItem(UPLOAD_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error("Error getting upload history:", error)
    return []
  }
}

export function addUploadRecord(record: Omit<UploadRecord, "id">) {
  if (!isClient) return
  try {
    const history = getUploadHistory()
    const newRecord = {
      ...record,
      id: Date.now(),
    }
    localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify([newRecord, ...history]))

    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent("uploadHistoryUpdated"))
  } catch (error) {
    console.error("Error adding upload record:", error)
  }
}

// Table uploads functions
export function getTableUploads(): TableUploadRecord[] {
  if (!isClient) return []
  try {
    const uploads = localStorage.getItem(TABLE_UPLOADS_KEY)
    return uploads ? JSON.parse(uploads) : []
  } catch (error) {
    console.error("Error getting table uploads:", error)
    return []
  }
}

export function getTableUploadsByUsername(username: string): TableUploadRecord[] {
  const uploads = getTableUploads()
  return uploads.filter((upload) => upload.username === username)
}

export function addTableUploadRecord(record: Omit<TableUploadRecord, "id">) {
  if (!isClient) return
  try {
    const uploads = getTableUploads()

    // Remove previous upload for the same table, username and year if exists
    const filteredUploads = uploads.filter(
      (upload) =>
        !(upload.username === record.username && upload.tableName === record.tableName && upload.year === record.year),
    )

    const newRecord = {
      ...record,
      id: Date.now(),
    }

    localStorage.setItem(TABLE_UPLOADS_KEY, JSON.stringify([newRecord, ...filteredUploads]))
  } catch (error) {
    console.error("Error adding table upload record:", error)
  }
}

// Data Not Available functions
export function getDataNotAvailableRecords(): DataNotAvailableRecord[] {
  if (!isClient) return []
  try {
    const records = localStorage.getItem(DATA_NOT_AVAILABLE_KEY)
    return records ? JSON.parse(records) : []
  } catch (error) {
    console.error("Error getting data not available records:", error)
    return []
  }
}

export function addDataNotAvailableRecord(record: Omit<DataNotAvailableRecord, "id">) {
  if (!isClient) return
  try {
    const records = getDataNotAvailableRecords()

    // Remove previous record for the same table, username and year if exists
    const filteredRecords = records.filter(
      (r) => !(r.username === record.username && r.tableName === record.tableName && r.year === record.year),
    )

    const newRecord = {
      ...record,
      id: Date.now(),
    }

    localStorage.setItem(DATA_NOT_AVAILABLE_KEY, JSON.stringify([newRecord, ...filteredRecords]))
  } catch (error) {
    console.error("Error adding data not available record:", error)
  }
}

export function getDataNotAvailableByUsername(username: string): DataNotAvailableRecord[] {
  const records = getDataNotAvailableRecords()
  return records.filter((record) => record.username === username)
}

// Tables list functions
export function getTablesList(): string[] {
  if (!isClient) return initialTables
  try {
    const tables = localStorage.getItem(TABLES_LIST_KEY)
    return tables ? JSON.parse(tables) : initialTables
  } catch (error) {
    console.error("Error getting tables list:", error)
    return initialTables
  }
}

export function addTable(tableName: string) {
  if (!isClient) return
  try {
    const tables = getTablesList()
    if (!tables.includes(tableName)) {
      localStorage.setItem(TABLES_LIST_KEY, JSON.stringify([...tables, tableName]))
    }
  } catch (error) {
    console.error("Error adding table:", error)
  }
}

export function removeTable(tableName: string) {
  if (!isClient) return
  try {
    const tables = getTablesList()
    const updatedTables = tables.filter((table) => table !== tableName)
    localStorage.setItem(TABLES_LIST_KEY, JSON.stringify(updatedTables))
  } catch (error) {
    console.error("Error removing table:", error)
  }
}

// Current year functions
export function getCurrentYear(): string {
  if (!isClient) return new Date().getFullYear().toString()
  try {
    const year = localStorage.getItem(CURRENT_YEAR_KEY)
    return year || new Date().getFullYear().toString()
  } catch (error) {
    console.error("Error getting current year:", error)
    return new Date().getFullYear().toString()
  }
}

export function setCurrentYear(year: string) {
  if (!isClient) return
  try {
    localStorage.setItem(CURRENT_YEAR_KEY, year)
  } catch (error) {
    console.error("Error setting current year:", error)
  }
}

// Admin functions for managing upload windows
export async function openUploadWindow(deadline: string, message: string, year: string) {
  if (!isClient) return

  try {
    // Update upload window state in the database
    const response = await fetch("/api/upload-window", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isOpen: true,
        deadline,
        message,
        year,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update upload window state');
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    // Update all users with upload permission and deadline
    const users = getUsers();
    const updatedUsers = users.map((user) => ({
      ...user,
      uploadPermission: true,
      uploadDeadline: deadline,
      hasUploaded: false, // Reset upload status for new window
    }));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    // Set the current year for validation
    setCurrentYear(year);

    // Send notification to all users
    users.forEach((user) => {
      addNotification({
        username: user.username,
        message: `${message} Upload deadline: ${deadlineDate.toLocaleString()} for year ${year} data.`,
        date: now.toLocaleString(),
        read: false,
        type: "upload_window",
        deadline,
        year,
      });
    });

    return true;
  } catch (error) {
    console.error('Error opening upload window:', error);
    return false;
  }
}

export async function closeUploadWindow() {
  if (!isClient) return

  try {
    // Get current state before closing
    const currentState = await getUploadWindowStatus();
    const year = currentState.year || getCurrentYear();
    
    // Update upload window state in the database
    const response = await fetch("/api/upload-window", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isOpen: false,
        year, // Keep the same year when closing
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update upload window state');
    }

    // Set current year in local storage to maintain consistency
    setCurrentYear(year);

    const users = getUsers();
    const updatedUsers = users.map((user) => ({
      ...user,
      uploadPermission: false,
      uploadDeadline: undefined,
    }));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    // Send notification about window closure to all users, including the year
    users.forEach((user) => {
      addNotification({
        username: user.username,
        message: `The upload window for census year ${year} has been closed. No further uploads are allowed at this time.`,
        date: new Date().toLocaleString(),
        read: false,
        type: "general",
        year, // Include year in notification
      });
    });

    return true;
  } catch (error) {
    console.error('Error closing upload window:', error);
    return false;
  }
}

// Check if upload deadline has passed and sync with server state
export async function checkUploadDeadlines() {
  if (!isClient) return;

  try {
    // Get current upload window state from server
    const response = await fetch("/api/upload-window");
    if (!response.ok) {
      throw new Error('Failed to get upload window state');
    }

    const serverState = await response.json();
    
    const users = getUsers();
    const now = new Date();
    let hasExpiredUsers = false;

    // If the server still thinks the window is open but the deadline has passed, formally close it.
    if (serverState.isOpen && serverState.deadline && new Date(serverState.deadline) < now) {
      // Attempt to close the window on the server and update local state.
      await closeUploadWindow();
      return; // closeUploadWindow already adjusts users & notifications.
    }

    const updatedUsers = users.map((user) => {
      // If server shows window is closed or deadline has passed
      if (!serverState.isOpen || (serverState.deadline && new Date(serverState.deadline) < now)) {
        hasExpiredUsers = true;
        return {
          ...user,
          uploadPermission: false,
          uploadDeadline: undefined,
        };
      }
      return user;
    });

    if (hasExpiredUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    }
  } catch (error) {
    console.error('Error checking upload deadlines:', error);
  }
}

export function markUserHasUploaded(username: string) {
  updateUserByUsername(username, { hasUploaded: true, uploadPermission: false });
}

// Get upload window status from server
export async function getUploadWindowStatus() {
  try {
    const response = await fetch("/api/upload-window");
    if (!response.ok) {
      throw new Error('Failed to get upload window state');
    }

    const serverState = await response.json();
    return {
      isOpen: serverState.isOpen,
      deadline: serverState.deadline,
      year: serverState.year
    };
  } catch (error) {
    console.error('Error getting upload window status:', error);
    return { isOpen: false, deadline: null, year: null };
  }
}

// Admin password management
export function getAdminPassword(): string {
  if (!isClient) return "Sapphire123" // Default password
  try {
    const password = localStorage.getItem(ADMIN_PASSWORD_KEY)
    return password || "Sapphire123" // Default password if not set
  } catch (error) {
    console.error("Error getting admin password:", error)
    return "Sapphire123"
  }
}

export function setAdminPassword(newPassword: string) {
  if (!isClient) return
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword)
  } catch (error) {
    console.error("Error setting admin password:", error)
  }
}

export function validateAdminCredentials(username: string, password: string): boolean {
  if (username !== "admin") return false
  const currentPassword = getAdminPassword()
  return password === currentPassword
}

// Admin functions for table upload management
export function sendTableReminder(username: string, tableName: string) {
  if (!isClient) return

  const user = getUserByUsername(username)
  if (!user) return

  // Get current year for reminder
  const currentYear = getCurrentYear();

  addNotification({
    username: username,
    message: `REMINDER: Please upload data for the "${tableName}" table. This data is required for census year ${currentYear}.`,
    date: new Date().toLocaleString(),
    read: false,
    type: "table_reminder",
    tableName: tableName,
    year: currentYear,
  })
}

export function getTableUploadSummary() {
  if (!isClient) return {}

  const uploads = getTableUploads()
  const dataNotAvailable = getDataNotAvailableRecords()
  const users = getUsers().filter((user) => user.status === "active")
  const tables = getTablesList()
  const year = getCurrentYear()

  const summary: Record<string, Record<string, "uploaded" | "not_available" | "pending">> = {}

  // Initialize summary object
  users.forEach((user) => {
    summary[user.username] = {}
    tables.forEach((table) => {
      summary[user.username][table] = "pending"
    })
  })

  // Fill in uploaded tables
  uploads.forEach((upload) => {
    if (upload.year === year && summary[upload.username]) {
      summary[upload.username][upload.tableName] = "uploaded"
    }
  })

  // Fill in data not available tables
  dataNotAvailable.forEach((record) => {
    if (record.year === year && summary[record.username]) {
      summary[record.username][record.tableName] = "not_available"
    }
  })

  return summary
}

export function getTableUploadStats() {
  if (!isClient) return { totalTables: 0, totalUsers: 0, totalUploads: 0, totalDataNotAvailable: 0, completionRate: 0 }

  const summary = getTableUploadSummary()
  const tables = getTablesList()
  const users = Object.keys(summary)

  let totalUploads = 0
  let totalDataNotAvailable = 0
  const possibleUploads = users.length * tables.length

  users.forEach((username) => {
    tables.forEach((table) => {
      if (summary[username][table] === "uploaded") {
        totalUploads++
      } else if (summary[username][table] === "not_available") {
        totalDataNotAvailable++
      }
    })
  })

  const totalCompleted = totalUploads + totalDataNotAvailable

  return {
    totalTables: tables.length,
    totalUsers: users.length,
    totalUploads,
    totalDataNotAvailable,
    completionRate: possibleUploads > 0 ? Math.round((totalCompleted / possibleUploads) * 100) : 0,
  }
}

// Master Reset function - DANGER ZONE
export function masterReset() {
  if (!isClient) return

  try {
    console.log("🚨 MASTER RESET: Clearing all application data...")

    // Clear all localStorage data except admin password (keep it for security)
    const currentAdminPassword = getAdminPassword()

    // Clear all application data
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY)
    localStorage.removeItem(UPLOAD_HISTORY_KEY)
    localStorage.removeItem(TABLE_UPLOADS_KEY)
    localStorage.removeItem(DATA_NOT_AVAILABLE_KEY)

    // Reset users to initial state (remove upload permissions and reset status)
    const resetUsers = initialUsers.map((user) => ({
      ...user,
      uploadPermission: false,
      hasUploaded: false,
      uploadDeadline: undefined,
    }))
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(resetUsers))

    // Reset other settings to defaults
    localStorage.setItem(CURRENT_YEAR_KEY, new Date().getFullYear().toString())
    localStorage.setItem(TABLES_LIST_KEY, JSON.stringify(initialTables))

    // Restore admin password
    localStorage.setItem(ADMIN_PASSWORD_KEY, currentAdminPassword)

    console.log("✅ MASTER RESET: Complete! Application data has been reset to initial state.")
    console.log("📊 Database users are preserved and unaffected.")

    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent("masterReset"))
  } catch (error) {
    console.error("❌ MASTER RESET: Error during reset:", error)
  }
}

// Reset function for development/testing (deprecated - use masterReset instead)
export function resetToInitialState() {
  console.warn("⚠️ resetToInitialState is deprecated. Use masterReset() instead.")
  masterReset()
}
