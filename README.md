# Attendance Management System

A comprehensive attendance management system built with Next.js 15, TypeScript, and Supabase for authentication and database management.

## 🚀 Features

- **User Authentication**: Secure sign up and sign in with email/password using Supabase Auth
- **Attendance Tracking**: Easy check-in/check-out functionality with timestamps
- **Real-time Dashboard**: Live clock and attendance status updates
- **Attendance History**: View recent attendance records with work hours calculation
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS and shadcn/ui
- **Row Level Security**: Secure data access with Supabase RLS policies

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- A Supabase account and project

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd attendance-management-system
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy your Project URL and anon public key
3. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Configure Database

In your Supabase dashboard, go to the SQL Editor and run:

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

-- Create policies
CREATE POLICY "Users can view their own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON attendance
  FOR UPDATE USING (auth.uid() = user_id);
```

### 4. Configure Authentication

1. In Supabase, go to Authentication → Settings
2. Set Site URL: `http://localhost:3000`
3. Add Redirect URLs: `http://localhost:3000/**`
4. Ensure Email auth provider is enabled

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

1. **First Time**: Sign up for a new account with your email and password
2. **Daily Check-in**: Click "Check In" when you start your workday
3. **Daily Check-out**: Click "Check Out" when you finish work
4. **View History**: Check your recent attendance records at the bottom of the dashboard

## 🔒 Security Features

- **Row Level Security**: Users can only access their own attendance data
- **Secure Authentication**: Password-based authentication with Supabase Auth
- **Session Management**: Automatic session handling and logout
- **Input Validation**: Form validation on both client and server side

## 📊 Dashboard Features

- **Current Time**: Live clock display
- **Today's Status**: Shows current attendance state (Not Checked In, Checked In, or Checked Out)
- **Work Hours**: Calculates total hours worked for the day
- **Recent Records**: Displays last 7 days of attendance history
- **Quick Actions**: Easy check-in/check-out buttons

## 🎨 UI Components

The application uses shadcn/ui components for a consistent and professional look:
- Cards for data display
- Badges for status indicators
- Forms with validation
- Alerts for user feedback
- Responsive grid layouts

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── app/
│   ├── login/           # Login/signup page
│   ├── setup/           # Setup instructions page
│   ├── layout.tsx       # Root layout with AuthProvider
│   └── page.tsx         # Main dashboard
├── components/ui/       # shadcn/ui components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
└── lib/
    └── supabase/       # Supabase client configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

**Issue**: "Supabase is not configured" error
**Solution**: Ensure you have created a `.env.local` file with the correct Supabase URL and anon key.

**Issue**: Authentication not working
**Solution**: Check that your Supabase project has email authentication enabled and redirect URLs are properly configured.

**Issue**: Database errors
**Solution**: Make sure you have run the SQL migration to create the attendance table and RLS policies.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.