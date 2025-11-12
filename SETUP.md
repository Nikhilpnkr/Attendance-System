# Attendance Management System Setup

This project uses Supabase for authentication and database management. Follow these steps to set up the project:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/login
3. Create a new project with a name of your choice
4. Choose a database password and region
5. Wait for the project to be created

## 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the **Project URL** and **anon public** key
3. Create a `.env.local` file in the root of your project
4. Add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Set Up the Database

1. In your Supabase dashboard, go to the SQL Editor
2. Run the following SQL to create the attendance table:

```sql
-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index for better performance
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);

-- Enable RLS (Row Level Security)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own attendance
CREATE POLICY "Users can view their own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own attendance
CREATE POLICY "Users can insert their own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own attendance
CREATE POLICY "Users can update their own attendance" ON attendance
  FOR UPDATE USING (auth.uid() = user_id);
```

## 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Under "Site URL", add: `http://localhost:3000`
3. Under "Redirect URLs", add: `http://localhost:3000/**`
4. Enable the "Email" auth provider if not already enabled

## 5. Run the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Features

- **User Authentication**: Sign up and sign in with email/password
- **Check In/Out**: Mark attendance with timestamp
- **Dashboard**: View current time, today's status, and work hours
- **Attendance History**: See recent attendance records
- **Real-time Updates**: Live clock and status updates

## Usage

1. **First Time**: Sign up for a new account
2. **Daily Check-in**: Click "Check In" when you start work
3. **Daily Check-out**: Click "Check Out" when you finish work
4. **View History**: Check your recent attendance records at the bottom

## Security

- Row Level Security (RLS) ensures users can only access their own attendance data
- Authentication is handled by Supabase Auth
- All database operations are protected by security policies

## Troubleshooting

- **Authentication issues**: Check your environment variables are correct
- **Database errors**: Ensure the SQL migration was run successfully
- **Permission denied**: Make sure RLS policies are correctly configured