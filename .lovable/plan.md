

# Automatic Daily Database Backup Feature

## What This Does
Adds an automatic daily backup system that runs every day in the background and saves a complete copy of your critical data (staff, attendance, advances, payroll, petroleum, MLT, reminders, settings) as a JSON file to secure cloud storage. You'll also be able to see backup history and download past backups from the Settings page.

## How It Works
1. A scheduled backend function runs once every day (e.g., at 2:00 AM)
2. It fetches all critical tables and saves the data as a JSON file in a private storage bucket
3. Old backups beyond 30 days are automatically cleaned up to save space
4. The Settings page gets a new "Auto Backups" section showing backup history with download buttons

## Technical Details

### 1. Create a `daily_backups` storage bucket
- A private storage bucket to store the JSON backup files
- RLS policies to allow the backend function (service role) to write and the app to read

### 2. Create a `backup_logs` database table
- Tracks each backup: timestamp, file path, size, status (success/failed), and error message if any
- Helps display backup history in the UI

### 3. Create an Edge Function: `daily-backup`
- Fetches all critical tables: `staff`, `attendance`, `advances`, `payroll`, `mlt_staff`, `mlt_attendance`, `mlt_advances`, `petroleum_sales`, `petroleum_payments`, `reminders`, `app_settings`, `credit_parties`, `credit_party_transactions`, `tyre_sales`, `dispatch_reports`, `bolder_reports`, `mlt_services`, `mlt_fuel_reports`, `salary_records`, `daily_photos`
- Creates a versioned JSON blob with timestamp
- Uploads to `daily_backups` bucket with filename like `backup-2026-02-28.json`
- Logs the result in `backup_logs` table
- Cleans up backups older than 30 days

### 4. Schedule the function with pg_cron
- Uses `pg_cron` + `pg_net` extensions to call the edge function daily at 2:00 AM IST

### 5. Update Settings UI
- Add an "Automatic Backups" card in `SettingsSection.tsx`
- Shows last backup date/time and status
- Lists recent backups (last 10) with download buttons
- A "Run Backup Now" button for manual trigger
- Toggle to enable/disable auto backups (stored in `app_settings`)

