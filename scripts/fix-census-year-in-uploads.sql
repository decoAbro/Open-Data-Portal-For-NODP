-- Update existing records to match the upload window year
UPDATE ur
SET ur.census_year = uw.year
FROM upload_records ur
CROSS APPLY (
    SELECT TOP 1 year
    FROM UploadWindow
    WHERE lastUpdated <= ur.upload_date
    ORDER BY lastUpdated DESC
) uw
WHERE ur.census_year = '3000';
