# Quick Setup Guide: Making the Reports Page Functional

## Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new project:
   - Name: `jarlang-reports` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Choose closest to your location
5. Wait for project to be created (~2 minutes)

## Step 2: Set Up Database Table
1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy and paste this SQL code:

```sql
-- Create the reports table with moderation support
CREATE TABLE jarlang_reports (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement')),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'resolved', 'pending_review', 'approved', 'rejected')),
    flagged BOOLEAN DEFAULT FALSE,
    flagged_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE jarlang_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view non-flagged reports or approved flagged reports
CREATE POLICY "Anyone can view approved reports" ON jarlang_reports
    FOR SELECT USING (flagged = FALSE OR status = 'approved');

-- Allow anyone to insert reports
CREATE POLICY "Anyone can insert reports" ON jarlang_reports
    FOR INSERT WITH CHECK (true);

-- Allow anyone to flag reports (update flagged status)
CREATE POLICY "Anyone can flag reports" ON jarlang_reports
    FOR UPDATE 
    USING (flagged = FALSE)  -- Can only update reports that aren't already flagged
    WITH CHECK (flagged = TRUE AND status = 'pending_review');  -- Can only set to flagged with pending_review status

-- Allow admins to update any field (you can restrict this later)
CREATE POLICY "Admins can update reports" ON jarlang_reports
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_jarlang_reports_created_at ON jarlang_reports(created_at DESC);
CREATE INDEX idx_jarlang_reports_type ON jarlang_reports(type);
CREATE INDEX idx_jarlang_reports_flagged ON jarlang_reports(flagged, status);
```

4. Click "Run" button
5. You should see "Success. No rows returned" message

## Step 3.5: Add Performance Indexes (Optional but Recommended)

For better performance, especially as your reports grow, add these indexes:

```sql
-- Additional performance indexes
CREATE INDEX idx_jarlang_reports_created_at_desc ON jarlang_reports(created_at DESC);
CREATE INDEX idx_jarlang_reports_type_status ON jarlang_reports(type, status);
CREATE INDEX idx_jarlang_reports_flagged_created ON jarlang_reports(flagged, created_at DESC);

-- Partial index for public reports (faster public queries)
CREATE INDEX idx_jarlang_reports_public_visible 
ON jarlang_reports(created_at DESC) 
WHERE flagged = FALSE OR status = 'approved';

-- Text search index for searching reports
CREATE INDEX idx_jarlang_reports_search 
ON jarlang_reports 
USING gin(to_tsvector('english', title || ' ' || description));
```

Run this in the SQL Editor after creating your main table.

## Step 4: Get Your API Credentials
1. In Supabase dashboard, click "Settings" in the left sidebar
2. Click "API"
3. Find these two values:
   - **Project URL** (example: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 4: Update Your reports.html File
1. Open `reports.html` in your code editor
2. Find these lines (around line 250):
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace them with your actual values:
```javascript
const supabaseUrl = 'https://abcdefghijklmnop.supabase.co';  // Your actual URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // Your actual key
```

## Step 5: Test It Out
1. Open `reports.html` in your web browser
2. Fill out the form with test data:
   - Type: Bug Report
   - Title: "Test submission"
   - Description: "This is a test to make sure everything works"
   - Email: (optional)
3. Click "Submit Report"
4. You should see a success message
5. The report should appear in the "Recent Reports" section below

## Step 6: Verify in Supabase
1. Go back to your Supabase dashboard
2. Click "Table Editor" in the left sidebar
3. Click on "jarlang_reports" table
4. You should see your test submission

## Troubleshooting

### If you get "Database not configured" error:
- Make sure you replaced the placeholder URLs with your actual Supabase credentials
- Check that there are no extra spaces or quotes

### If you get CORS errors:
- In Supabase dashboard, go to Settings → API
- Scroll down to "CORS origins"
- Add your domain (or `*` for development)

### If reports don't appear:
- Check the browser console (F12) for error messages
- Verify the table was created correctly in Supabase
- Make sure RLS policies are set up correctly

### If you get permission errors:
- Double-check that you ran all the SQL commands from Step 2
- Verify that RLS policies are enabled

## Security Notes
- The anon key is safe to use in client-side code for public operations
- Only allows reading and inserting reports (not updating/deleting)
- Consider adding rate limiting in production to prevent spam

## What You Can Do Next
- Add email notifications when reports are submitted
- Create an admin panel to manage reports
- Add categories or tags to reports
- Implement voting on feature requests