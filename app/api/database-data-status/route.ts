import { type NextRequest, NextResponse } from "next/server"
import sql from "mssql"

// Database configuration
const dbConfig = {
  user: "NODP",
  password: "Prod123",
  server: "172.16.17.32",
  database: "Stage",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}

export async function GET() {
  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(dbConfig)

    // Get data counts from all main tables
    const queries = [
      { name: "1. Institution Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Institutions" },
      { name: "2. Building Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Building" },
      { name: "3. Corporal Punishment Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Corporal_Punishment" },
      { name: "4. ECE Facilities Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.ECE_Facilities" },
      { name: "5. EnrolAgeWise Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.EnrolAgeWise" },
      { name: "6. Enrolment Difficulty Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Enrolment_Difficulty" },
      { name: "7. Enrolment ECE Experience Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Enrolment_ECEExperience" },
      { name: "8. Enrolment Refugee Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Enrolment_Refugee" },
      { name: "9. Enrolment Religion Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Enrolment_Religion" },
      { name: "10. Facilities Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Facilities" },
      { name: "11. ICT Facilities Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.ICT_Facilities" },
      { name: "12. Institutions Other Facilities Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Institutions_Otherfacilities" },
      { name: "13. Institution Attacks Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Institution_Attack" },
      { name: "14. Institution Security Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Institution_Security" },
      { name: "15. Non Teachers Profile Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Non_Teachers_Profile" },
      { name: "16. Repeaters Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Repeaters" },
      { name: "17. Rooms Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Rooms" },
      { name: "18. Sanctioned Teaching Non Teaching Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Sanctioned_Teaching_Non_Teaching" },
      { name: "19. Student Profile Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Student_Profile" },
      { name: "20. Teachers Academic Qualification Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Teachers_AcademicQualification" },
      { name: "21. Teachers Professional Qualification Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Teachers_ProfessionalQualification" },
      { name: "22. Teachers Profile Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.Teachers_Profile" },
      { name: "23. Teaching Non Teaching Category Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.TeachingNonTeaching_Category" },
      { name: "24. Teaching Non Teaching Designation Table", query: "SELECT COUNT(*) as count FROM Stage.dbo.TeachingNonTeaching_Designation" },
    ]

    const tableData = []

    for (const { name, query } of queries) {
      try {
        const result = await pool.request().query(query)
        tableData.push({
          tableName: name,
          recordCount: result.recordset[0]?.count || 0,
          status: "active",
        })
      } catch (error) {
        tableData.push({
          tableName: name,
          recordCount: 0,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Get additional details for upload_records table
    try {
      const uploadDetailsQuery = `
        SELECT 
          COUNT(DISTINCT username) as unique_users,
          COUNT(DISTINCT table_name) as unique_tables,
          SUM(file_size_bytes) as total_size_bytes,
          MIN(upload_date) as earliest_upload,
          MAX(upload_date) as latest_upload
        FROM Stage.dbo.upload_records
      `
      const uploadDetails = await pool.request().query(uploadDetailsQuery)
      const details = uploadDetails.recordset[0]

      // Update upload_records entry with additional details
      const uploadRecordsIndex = tableData.findIndex((t) => t.tableName === "upload_records")
      if (uploadRecordsIndex !== -1) {
        tableData[uploadRecordsIndex] = {
          ...tableData[uploadRecordsIndex],
          uniqueUsers: details?.unique_users || 0,
          uniqueTables: details?.unique_tables || 0,
          totalSizeBytes: details?.total_size_bytes || 0,
          earliestUpload: details?.earliest_upload,
          latestUpload: details?.latest_upload,
        }
      }
    } catch (error) {
      console.error("Error getting upload details:", error)
    }

    return NextResponse.json({ tableData })
  } catch (error) {
    console.error("Error fetching database data status:", error)
    return NextResponse.json({ error: "Failed to fetch database data status" }, { status: 500 })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const Province_Id = searchParams.get("Province_Id")
  const uploadedBy = searchParams.get("Uploaded_By")
  const tableName = searchParams.get("tableName")

  if (!Province_Id && !uploadedBy) {
    return NextResponse.json({ error: "Either provinceId or uploadedBy parameter is required" }, { status: 400 })
  }

  if (!tableName) {
    return NextResponse.json({ error: "tableName parameter is required" }, { status: 400 })
  }

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(dbConfig)

    let deleteQuery = ""
    let deletedCount = 0

    // Handle deletion based on the table and criteria
    if (tableName === "Building") {
      if (Province_Id) {
        deleteQuery = "DELETE FROM Stage.dbo.Building WHERE Province_Id LIKE @criteria"
        const result = await pool.request().input("criteria", sql.NVarChar, `%${Province_Id}%`).query(deleteQuery)
        deletedCount = result.rowsAffected[0] || 0
      } else if (uploadedBy) {
        deleteQuery = "DELETE FROM Stage.dbo.upload_records WHERE username = @criteria"
        const result = await pool.request().input("criteria", sql.NVarChar, uploadedBy).query(deleteQuery)
        deletedCount = result.rowsAffected[0] || 0
      }
    } else if (tableName === "users") {
      if (Province_Id) {
        deleteQuery = "DELETE FROM dbo.users WHERE username LIKE @criteria"
        const result = await pool.request().input("criteria", sql.NVarChar, `%${Province_Id}%`).query(deleteQuery)
        deletedCount = result.rowsAffected[0] || 0
      } else if (uploadedBy) {
        deleteQuery = "DELETE FROM dbo.users WHERE username = @criteria"
        const result = await pool.request().input("criteria", sql.NVarChar, uploadedBy).query(deleteQuery)
        deletedCount = result.rowsAffected[0] || 0
      }
    } else {
      return NextResponse.json({ error: "Deletion not supported for this table" }, { status: 400 })
    }

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} records from ${tableName}`,
      deletedCount,
    })
  } catch (error) {
    console.error("Error deleting data:", error)
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 })
  } finally {
    if (pool) {
      await pool.close()
    }
  }
}
