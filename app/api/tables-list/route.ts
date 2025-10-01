import { NextResponse } from "next/server"
import sql from "mssql"

// SQL Server database configuration
const dbConfig = {
  server: "172.16.17.32",
  database: "Stage",
  user: "NODP",
  password: "Prod123",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

export async function GET() {
  try {
    const pool = new sql.ConnectionPool(dbConfig)
    await pool.connect()
    const request = pool.request()
    const result = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME IN ('uploads', 'Building', 'Rooms', 'Institutions', 'ECE_Facilities', 'EnrolAgewise', 'Enrolment_Difficulty', 'Enrolment_ECEExperience',
      'Enrolment_Refugee', 'Enrolment_Religion', 'Facilities', 'ICT_Facilities', 'Institutions_Otherfacilities', 'Institution_Attack', 'Institution_Security',
      'Non_Teachers_Profile', 'Repeaters', 'Sanctioned_Teaching_Non_Teaching', 'Student_Profile', 'Teachers_AcademicQualification', 'Teachers_ProfessionalQualification', 
      'Teachers_Profile', 'TeachingNonTeaching_Category', 'TeachingNonTeaching_Designation', 'Corporal_Punishment')
    `)
    const tables = result.recordset.map((row: any) => row.TABLE_NAME)
    await pool.close()
    return NextResponse.json({ success: true, tables })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
