import sql from 'mssql';
import { dbConfig } from '../../lib/db-config';

export async function getCurrentCensusYear() {
  let pool = null;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT TOP 1 census_year 
      FROM census_years 
      WHERE is_current = 1 
      ORDER BY created_date DESC
    `);
    
    return result.recordset[0]?.census_year;
  } catch (error) {
    console.error('Error getting current census year:', error);
    return null;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
