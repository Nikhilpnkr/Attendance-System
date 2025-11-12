# Advanced Attendance Management System Setup

This comprehensive attendance system includes advanced features for detailed tracking, analytics, and reporting.

## 🚀 Advanced Features

### Core Attendance Features
- ✅ **Multi-Status Tracking**: Present, Absent, Late, Early Leave, Half Day, Remote, etc.
- ✅ **Break Time Tracking**: Start/end break with automatic duration calculation
- ✅ **Location Tracking**: Record where employees check in/out
- ✅ **Work Modes**: Office, Remote, Hybrid, Field work
- ✅ **Device Tracking**: Monitor devices used for attendance

### Employee Management
- ✅ **Profile Management**: Employee details, department, position, work schedule
- ✅ **Work Schedules**: Flexible scheduling with shift management
- ✅ **Department Structure**: Hierarchical department management
- ✅ **Timezone Support**: Multi-timezone attendance tracking

### Leave Management
- ✅ **Leave Requests**: Multiple leave types (vacation, sick, personal, etc.)
- ✅ **Approval Workflow**: Manager approval system
- ✅ **Leave Balance**: Automatic leave calculation
- ✅ **Leave History**: Complete leave tracking

### Advanced Analytics
- ✅ **Attendance Summaries**: Daily, weekly, monthly, quarterly, yearly reports
- ✅ **Performance Metrics**: Attendance rate, punctuality percentage
- ✅ **Overtime Tracking**: Automatic overtime calculation with approval
- ✅ **Trend Analysis**: Historical attendance patterns

### Compliance & Security
- ✅ **Audit Logging**: Complete audit trail for all changes
- ✅ **Row Level Security**: Users only see their own data
- ✅ **Attendance Policies**: Configurable company policies
- ✅ **Holiday Management**: Company and national holidays

## 🛠️ Database Schema

### Core Tables

#### 1. **profiles**
Extends auth.users with employee information
- Employee ID, department, position
- Work schedule, timezone, hire date
- Active status management

#### 2. **attendance**
Main attendance tracking table
- Check-in/out timestamps
- Break time tracking
- Multiple status types
- Location and work mode
- Approval workflow

#### 3. **work_schedules**
Employee work schedules
- Day-specific schedules
- Shift timing management
- Break duration rules
- Effective date ranges

#### 4. **leave_requests**
Leave management system
- Multiple leave types
- Date range management
- Approval workflow
- Status tracking

#### 5. **overtime_records**
Overtime tracking
- Regular vs overtime hours
- Different overtime rates
- Approval requirements
- Holiday/weekend overtime

#### 6. **attendance_adjustments**
Corrections and adjustments
- Manual adjustments
- Approval tracking
- Change history
- Reason logging

#### 7. **departments**
Company structure
- Hierarchical departments
- Manager assignment
- Department policies

#### 8. **holidays**
Holiday management
- National holidays
- Company-specific holidays
- Paid/unpaid holidays
- Department-specific holidays

#### 9. **attendance_summaries**
Pre-calculated analytics
- Period-based summaries
- Performance metrics
- Attendance percentages
- Work hour totals

#### 10. **attendance_devices**
Device tracking
- Device registration
- Location tracking
- Trusted devices
- Usage history

#### 11. **attendance_notifications**
Notification system
- Reminder notifications
- Alert notifications
- Email integration
- Read status tracking

#### 12. **attendance_policies**
Company policies
- Grace periods
- Late arrival limits
- Overtime rules
- Approval requirements

#### 13. **attendance_audit_log**
Compliance tracking
- Complete audit trail
- Change tracking
- User action logging
- Compliance reporting

## 📊 Key Metrics & Features

### Attendance Metrics
- **Attendance Rate**: Percentage of days present
- **Punctuality Rate**: On-time arrival percentage
- **Work Hours**: Total hours worked including overtime
- **Break Time**: Automatic break duration calculation
- **Absenteeism**: Absence patterns and trends

### Leave Management
- **Leave Types**: Vacation, Sick, Personal, Maternity, Paternity, Bereavement, Unpaid
- **Leave Balance**: Automatic calculation based on company policy
- **Approval Workflow**: Multi-level approval system
- **Leave History**: Complete leave record with reasons

### Overtime Management
- **Automatic Detection**: Overtime calculation based on work schedule
- **Rate Calculation**: Different rates for regular, weekend, holiday overtime
- **Approval System**: Manager approval for overtime hours
- **Compliance**: Labor law compliance tracking

### Location & Device Tracking
- **Geolocation**: GPS-based location verification
- **Device Management**: Trusted device registration
- **IP Tracking**: Network location logging
- **Security**: Fraud detection and prevention

## 🔧 Setup Instructions

### 1. Run the Comprehensive Schema

In your Supabase SQL Editor, run the complete schema from `002_comprehensive_attendance_schema.sql`.

### 2. Configure Authentication

1. Go to Authentication → Settings
2. Set Site URL: `http://localhost:3000`
3. Add Redirect URLs: `http://localhost:3000/**`
4. Enable Email auth provider

### 3. Set Up Departments

```sql
-- Example departments
INSERT INTO departments (name, description)
VALUES 
  ('Engineering', 'Software development and IT'),
  ('HR', 'Human Resources'),
  ('Sales', 'Sales and business development'),
  ('Finance', 'Finance and accounting');
```

### 4. Configure Company Policies

```sql
-- Update default policy or create new ones
UPDATE attendance_policies 
SET 
  grace_period_minutes = 15,
  max_late_allowed_per_month = 5,
  min_work_hours_per_day = 8.00,
  overtime_approval_required = true
WHERE name = 'Default Policy';
```

### 5. Add Company Holidays

```sql
-- Add company-specific holidays
INSERT INTO holidays (name, date, type, is_paid)
VALUES 
  ('Company Anniversary', '2024-06-15', 'company', true),
  ('Team Building Day', '2024-09-20', 'company', true);
```

## 📱 Enhanced Features

### Real-time Dashboard
- Live clock with timezone support
- Today's attendance status with color coding
- Work hours calculation including breaks
- Monthly performance metrics
- Pending leave requests
- Recent attendance history

### Advanced Check-in/Out
- Location-based verification
- Device recognition
- Break time management
- Multiple work modes
- Status tracking (present, late, remote, etc.)

### Comprehensive Reporting
- Daily/weekly/monthly summaries
- Attendance trends and patterns
- Overtime analysis
- Leave utilization
- Performance metrics

### Leave Management System
- Multiple leave types
- Approval workflow
- Balance tracking
- History and analytics
- Integration with attendance

### Overtime Tracking
- Automatic calculation
- Different rate types
- Approval workflow
- Compliance checking
- Reporting and analytics

## 🔒 Security Features

### Row Level Security (RLS)
- Users only see their own data
- Managers can see team data
- Admin can see all data
- Granular permission control

### Audit Trail
- Complete change logging
- User action tracking
- Data modification history
- Compliance reporting

### Data Protection
- Encrypted data transmission
- Secure authentication
- Session management
- Access control

## 📈 Analytics & Reporting

### Performance Metrics
- Attendance percentage
- Punctuality rate
- Work hour analysis
- Overtime trends
- Leave patterns

### Trend Analysis
- Monthly comparisons
- Year-over-year analysis
- Department comparisons
- Individual performance tracking

### Compliance Reports
- Labor law compliance
- Policy adherence
- Audit reports
- Risk assessment

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Required Permissions
- Database access
- Authentication management
- Storage (for file uploads)
- Edge functions (for notifications)

### Performance Optimization
- Database indexes included
- Optimized queries
- Caching strategies
- CDN integration

## 📞 Support & Maintenance

### Regular Tasks
- Update holiday lists
- Review attendance policies
- Monitor system performance
- Backup data regularly

### Troubleshooting
- Check RLS policies if data access issues
- Verify audit logs for debugging
- Monitor notification delivery
- Review performance metrics

This advanced attendance system provides enterprise-level functionality with comprehensive tracking, analytics, and reporting capabilities. The schema is designed to scale and support complex attendance requirements while maintaining security and compliance.