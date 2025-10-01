import { NextResponse } from 'next/server';
import sql from 'mssql';

// Allow long running (Vercel / Next.js) if deployed
export const maxDuration = 300; // seconds
export const dynamic = 'force-dynamic';

// Source (staging) DB config
const sourceConfig: sql.config = {
  user: process.env.SOURCE_DB_USER || 'NODP',
  password: process.env.SOURCE_DB_PASSWORD || 'Prod123',
  server: process.env.SOURCE_DB_SERVER || '172.16.17.32',
  database: process.env.SOURCE_DB_NAME || 'Stage',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

// Destination (production) DB config (currently "Empty_Database")
const destConfig: sql.config = {
  user: process.env.DEST_DB_USER || 'NODP',
  password: process.env.DEST_DB_PASSWORD || 'Prod123',
  server: process.env.DEST_DB_SERVER || '172.16.17.32',
  database: process.env.DEST_DB_NAME || 'Superset_DB_Constraints_Destination',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

// Queries to move (tableName -> select statement)
// NOTE: Matches the Python example provided by user. Expand as needed.
const TABLE_QUERIES: Record<string, string> = {
  Institutions: `SELECT Inst_Id, Census_Year, Province_Id, Name, Address, Village, UC_Name, UC_No, Circle_Name, City, District_Id, Tehsil_Id, PA_No, NA_No, Phone_No, Fax_No, Email, Website, Location_Id, Level_Id, FunctionalStatus_Id, Established_Date, Management_Id, Kind_Id, Shift_Id, Gender_Id, Medium_Id, SchoolCommittee_Id, Sector_Id, Latitude, Longitude, Altitude FROM Institutions where Province_Id = 5`,
  Building: `SELECT Inst_Id, Census_Year, Province_Id, Total_Area, Covered_Area, BuildingAvailability_Id, BuildingOwnership_Id, BuildingCondition_Id, ConstructionType_Id FROM Building where Province_Id = 5`,
  Corporal_Punishment: `SELECT Inst_Id, Census_Year, Province_Id, Corporal_Punishment, Number_of_complaints, Reported_to_Authorities FROM Corporal_Punishment where Province_Id = 5`,
  ECE_Facilities: `SELECT Inst_Id, Census_Year, Province_Id, ECErooms_Available, ECETrainedTeacher_Available, Total_ECETrainedTeacher, ECEMaterial_Available, ECEfurniture_Available from ECE_Facilities where Province_Id = 5`,
  EnrolAgeWise: `SELECT Inst_Id, Census_Year, Province_Id, Class_Id, Gender_Id, Age_Id, Shift_Id, Enrolment FROM EnrolAgeWise where Province_Id = 5`,
  Enrolment_Difficulty: `SELECT Inst_Id, Census_Year, Province_Id, DifficultyType_Id, DifficultyCategory_Id, Shift_Id, Total_Enrolment FROM Enrolment_Difficulty where Province_Id = 5`,
  Enrolment_ECEExperience: `SELECT Inst_Id, Census_Year, Province_Id, Class_Id, Gender_Id, Shift_Id, Enrolment_ECE_Experience FROM Enrolment_ECEExperience where Province_Id = 5`,
  Enrolment_Refugee: `SELECT Inst_Id, Census_Year, Province_Id, Class_Id, Gender_Id, Shift_Id, Enrolment FROM Enrolment_Refugee where Province_Id = 5`,
  Enrolment_Religion: `SELECT Inst_Id, Census_Year, Province_Id, Class_Id, Gender_Id, Religion_Id, Shift_Id, Enrolment FROM Enrolment_Religion where Province_Id = 5`,
  Facilities: `SELECT Inst_Id, Census_Year, Province_Id, BPF_Water, BPF_Electricity, BPF_BoundaryWall, BPF_ToiletStudent, BPF_ToiletStaff, BPF_Telephone, BPF_Gas, BF_Internet, BF_Library, BF_Hall, BF_Playground, BF_Canteen, BF_Hostel, BF_Store, BF_HomeEcon_Lab, BF_Zoology_Lab, BF_Biology_Lab, BF_Computer_Lab, BF_Chemistry_Lab, BF_Combined_Lab, BF_Physics_Lab, BF_Botany_Lab, EM_Computers, EM_Printers FROM Facilities where Province_Id = 5`,
  ICT_Facilities: `SELECT Inst_Id, Census_Year, Province_Id, ICTFacilities_Available, ICTPedagogyMaterial_Available, ICTmaterial_Foronline_Use_Available, Internet_Available_Forpedagogical, Computers_Available_Forpedagogical, Tablet_Available_Forpedagogical, SmartBoard_Available_Forpedagogical, Others from ICT_Facilities where Province_Id = 5`,
  Institutions_Otherfacilities: `SELECT Inst_Id, Census_Year, Province_Id, Ramp_Available, TLM_Specialchildren_Available, DayCareRoom_Available FROM Institutions_Otherfacilities where Province_Id = 5`,
  Institution_Attack: `SELECT Inst_Id, Census_Year, Province_Id, Institution_Attack, Total_Attacks, FIR_Registered FROM Institution_Attack where Province_Id = 5`,
  Institution_Security: `SELECT Inst_Id, Census_Year, Province_Id, Security_Available, SecurityGuard_Available, BarbedWire_Available, GlassSpikes_Available, EntranceBlocks_Available, CCTVCamera_Available, Barrier_Available FROM Institution_Security where Province_Id = 5`,
  Non_Teachers_Profile: `SELECT Inst_Id, Census_Year, Province_Id, Staff_Id, Staff_Name, Gender_Id, Date_Joining, Designation_Id, BasicPayScale_Id, NatureOfService_Id, DifficultyType_Id, DifficultyCategory_Id FROM Non_Teachers_Profile where Province_Id = 5`,
  Repeaters: `SELECT Inst_Id, Census_Year, Province_Id, Class_Id, Gender_Id, Shift_Id, Number_of_Repeaters FROM Repeaters where Province_Id = 5`,
  Rooms: `SELECT Inst_Id, Census_Year, Province_Id, Pakka_Classrooms, Katcha_Classrooms, Mixed_Classrooms, Total_Classrooms, Total_ECERooms, Total_StaffRooms, Total_HeadTeacherRooms, Total_OtherRooms, Total_Rooms FROM Rooms where Province_Id = 5`,
  Sanctioned_Teaching_Non_Teaching: `SELECT Inst_Id, Census_Year, Province_Id, Staff_Id, NatureOfService_Id, Gender_Id, Shift_Id, Number_of_Staff FROM Sanctioned_Teaching_Non_Teaching where Province_Id = 5`,
  Student_Profile: `SELECT Inst_Id, Census_Year, Province_Id, Student_Id, Gender_Id, Date_of_Birth, Class_Id, Studied_ECE_Kachi_Last_Year, Status, DifficultyType_Id, DifficultyCategory_Id, Religion_Id, Nationality_Id, Minority, Stipend_Scholarship_Holder, Shift_Id FROM Student_Profile where Province_Id = 5`,
  Teachers_AcademicQualification: `SELECT Inst_Id, Census_Year, Province_Id, AcademicQualification_Id, Gender_Id, Shift_Id, Teachers_Strength FROM Teachers_AcademicQualification where Province_Id = 5`,
  Teachers_ProfessionalQualification: `SELECT Inst_Id, Census_Year, Province_Id, Gender_Id, Shift_Id, ProfessionalQualification_Id, Teachers_Strength FROM Teachers_ProfessionalQualification where Province_Id = 5`,
  Teachers_Profile: `SELECT Inst_Id, Census_Year, Province_Id, Teacher_Id, Teacher_Name, Gender_Id, Date_Birth, Date_Joining, BasicPayScale_Id, AcademicQualification_Id, ProfessionalQualification_Id, Acquire_PedagogicalTraining, Acquire_TrainingforSpecialChildren, Acquire_ECETraining, Designation_Id, Date_of_Current_Posting, NatureOfService_Id, Current_Year_Training_Duration, DifficultyType_Id, DifficultyCategory_Id, Date_of_Retirement FROM Teachers_Profile where Province_Id = 5`,
  TeachingNonTeaching_Category: `SELECT Inst_Id, Census_Year, Province_Id, Staff_Id, NatureOfService_Id, Gender_Id, Shift_Id, Teachers_Strength FROM TeachingNonTeaching_Category where Province_Id = 5`,
  TeachingNonTeaching_Designation: `SELECT Inst_Id, Census_Year, Province_Id, Gender_Id, Staff_Id, Designation_Id, Teachers_Strength FROM TeachingNonTeaching_Designation where Province_Id = 5`
};

interface TableResultSummary {
  table: string;
  extracted: number;
  loaded: number;
  failed: number;
  durationMs: number;
  error?: string;
}

async function logEvent(pool: sql.ConnectionPool, tableName: string, eventType: string, eventMessage: string) {
  try {
    // Truncate message to avoid oversize (similar to Python slice [:4000])
    const msg = eventMessage.length > 3900 ? eventMessage.slice(0, 3900) : eventMessage;
    await pool.request()
      .input('TableName', sql.NVarChar(128), tableName)
      .input('EventType', sql.NVarChar(50), eventType)
      .input('EventMessage', sql.NVarChar(sql.MAX), msg)
      .query('INSERT INTO Pipeline_Log (TableName, EventType, EventMessage) VALUES (@TableName, @EventType, @EventMessage)');
  } catch (e) {
    console.error('Failed to log pipeline event', tableName, e);
  }
}

export async function POST(request: Request) {
  const started = Date.now();
  let sourcePool: sql.ConnectionPool | null = null;
  let destPool: sql.ConnectionPool | null = null;
  const summaries: TableResultSummary[] = [];

  try {
    // Optional body for future extensibility (e.g., specific tables, truncate flag)
    let body: any = {};
    try { body = await request.json(); } catch { /* ignore empty body */ }
    const tablesRequested: string[] | undefined = body?.tables;
    const truncateBeforeLoad: boolean = body?.truncate === true; // default false to match Python behaviour

    sourcePool = await new sql.ConnectionPool(sourceConfig).connect();
    destPool = await new sql.ConnectionPool(destConfig).connect();

    await logEvent(sourcePool, 'PIPELINE', 'INFO', 'Production push started');

    const tableEntries = Object.entries(TABLE_QUERIES).filter(([name]) => !tablesRequested || tablesRequested.includes(name));
    if (tableEntries.length === 0) {
      return NextResponse.json({ success: false, error: 'No tables selected or configured.' }, { status: 400 });
    }

    for (const [tableName, query] of tableEntries) {
      const t0 = Date.now();
      let extracted = 0; let loaded = 0; let failed = 0; let error: string | undefined;
      try {
        await logEvent(sourcePool, tableName, 'INFO', 'Starting table processing');
        const extractResult = await sourcePool.request().query(query);
        const rows = extractResult.recordset || [];
        extracted = rows.length;
        await logEvent(sourcePool, tableName, 'INFO', `Extracted ${extracted} rows`);

        if (extracted === 0) {
          summaries.push({ table: tableName, extracted, loaded, failed, durationMs: Date.now() - t0 });
          continue;
        }

        if (truncateBeforeLoad) {
          try {
            await destPool.request().query(`TRUNCATE TABLE ${tableName}`);
            await logEvent(sourcePool, tableName, 'INFO', 'Destination table truncated');
          } catch (e) {
            await logEvent(sourcePool, tableName, 'ERROR', 'Failed to truncate destination table: ' + (e instanceof Error ? e.message : String(e)));
          }
        }

        // Build dynamic insert statement
        const columns = Object.keys(rows[0]);
        const colList = columns.map(c => `[${c}]`).join(', ');
        const paramList = columns.map((_, idx) => `@p${idx}`).join(', ');
        const insertSQL = `INSERT INTO ${tableName} (${colList}) VALUES (${paramList})`;

        for (const row of rows) {
          const req = destPool.request();
            columns.forEach((col, idx) => {
              const value = (row as any)[col];
              // Let mssql infer type; can be refined per schema if needed
              req.input(`p${idx}`, value);
            });
          try {
            await req.query(insertSQL);
            loaded++;
          } catch (e) {
            failed++;
            await logEvent(sourcePool, tableName, 'ERROR', `Row insert failed: ${(e instanceof Error ? e.message : String(e))}`);
          }
        }

        await logEvent(sourcePool, tableName, 'INFO', `Loaded ${loaded} rows. Failed: ${failed}`);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        await logEvent(sourcePool, tableName, 'ERROR', 'Table processing failed: ' + error);
      } finally {
        summaries.push({ table: tableName, extracted, loaded, failed, durationMs: Date.now() - t0, error });
      }
    }

    await logEvent(sourcePool, 'PIPELINE', 'INFO', 'Production push completed');

    const totalDuration = Date.now() - started;
    return NextResponse.json({ success: true, totalDurationMs: totalDuration, tables: summaries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (sourcePool) await logEvent(sourcePool, 'PIPELINE', 'ERROR', 'Pipeline fatal error: ' + msg);
    return NextResponse.json({ success: false, error: msg, tables: summaries }, { status: 500 });
  } finally {
    if (sourcePool) await sourcePool.close();
    if (destPool) await destPool.close();
  }
}
