# 🚀 Supabase Database Setup Instructions

## Overview
This guide will help you set up all the required database tables for your Fitto fitness tracking app in Supabase.

---

## 📋 Prerequisites

- Supabase account access
- Project URL: `https://wkpsimlalongfpjwovtx.supabase.co`
- Access to Supabase SQL Editor

---

## 🛠️ Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://wkpsimlalongfpjwovtx.supabase.co
2. Log in to your Supabase dashboard
3. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run the Setup Script

1. Open the file `supabase-setup.sql` (in the root of your project)
2. **Copy the entire contents** of the file
3. In the Supabase SQL Editor:
   - Click **"+ New query"**
   - Paste the SQL script
   - Click **"Run"** (or press Ctrl/Cmd + Enter)

The script will create:
- ✅ 30+ tables for all app features
- ✅ Indexes for optimal performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamp updates
- ✅ Foreign key relationships

### Step 3: Enable Realtime (Important!)

For real-time data synchronization, you need to enable Realtime for your tables:

1. In Supabase Dashboard, go to **"Database"** → **"Replication"**
2. Find and enable Realtime for these critical tables:
   - `profiles`
   - `user_goals`
   - `daily_logs`
   - `daily_summaries`
   - `exercise_logs`
   - `food_items`
   - `body_measurements`

3. Click **"Save"** to apply changes

### Step 4: Verify Setup

Run this test query in the SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all 30+ tables listed.

---

## 🎉 What Happens Next?

### ✅ Errors Will Disappear

The 406 and 404 errors you're seeing will be gone:
- ❌ Before: `406 (Not Acceptable)` - tables didn't exist
- ✅ After: Full database access with real data

### ✅ App Will Connect to Real Database

Your app will automatically:
1. Connect to Supabase instead of demo mode
2. Store data in the actual database
3. Enable real-time synchronization
4. Support multi-device access

### ✅ Features Now Available

All these features will now work with persistent data:
- 📊 User profiles and goals
- 🍽️ Meal and nutrition tracking
- 💪 Exercise logging
- 📈 Body measurements and progress photos
- 🎯 Habits and mood tracking
- 💊 Supplement tracking
- 📝 Custom recipes
- 🤖 AI coaching features

---

## 🔒 Security Features

The script automatically sets up:

### Row Level Security (RLS)
- Users can only access **their own data**
- No user can see another user's information
- Automatic enforcement at the database level

### Authentication
- Integrated with Supabase Auth
- Uses `auth.uid()` to identify current user
- Secure by default

---

## 🧪 Test Your Setup

After running the script, test your app:

1. **Refresh your app** in the browser
2. **Complete the onboarding** (profile setup)
3. **Check the console** - you should see:
   - ✅ `Supabase kullanıcısı: [your-user-id]`
   - ✅ `Hoş geldin, [username]!`
   - ❌ No more 406/404 errors!

4. **Try adding data**:
   - Log a meal
   - Add an exercise
   - Update your weight

5. **Open another browser** and log in with the same account
   - Your data should sync automatically!

---

## 📊 Database Schema Overview

Your database now includes:

### Core Tables
- `profiles` - User profiles
- `user_goals` - Fitness goals and targets
- `subscriptions` - Premium features
- `trial_status` - Free trial management

### Nutrition Tracking
- `food_items` - Food database
- `daily_logs` - Meal logging
- `daily_summaries` - Daily nutrition totals
- `favorite_foods` - Saved favorites

### Exercise & Progress
- `exercise_logs` - Workout tracking
- `body_measurements` - Weight, body fat, etc.
- `progress_photos` - Progress pictures

### Lifestyle Tracking
- `habits` - Custom habit tracking
- `habit_logs` - Habit completion
- `mood_entries` - Mood & energy tracking
- `supplements` - Supplement schedules
- `supplement_logs` - Intake tracking

### Recipes & AI
- `recipes` - Custom recipes
- `ai_messages` - AI coach conversation history

### Admin System
- `admin_users` - Admin accounts
- `admin_sessions` - Admin authentication
- `admin_audit_logs` - Action logging

---

## 🐛 Troubleshooting

### Issue: "permission denied for table..."
**Solution**: Make sure you're logged in as the project owner in Supabase.

### Issue: "relation already exists"
**Solution**: Some tables may already exist. You can either:
1. Drop existing tables first (⚠️ this deletes data!)
2. Or modify the script to skip existing tables

### Issue: Still seeing 406/404 errors
**Solution**: 
1. Hard refresh your app (Ctrl/Cmd + Shift + R)
2. Clear browser cache
3. Check that tables were created successfully
4. Verify RLS policies are enabled

### Issue: Can't see data from other devices
**Solution**: 
1. Ensure Realtime is enabled for the tables
2. Check that you're logged in with the same account
3. Verify network connection

---

## 🎯 Next Steps

Once your database is set up:

1. **Test all features thoroughly**
2. **Set up authentication** (if not already done)
3. **Configure email templates** in Supabase Auth
4. **Add custom domain** (optional)
5. **Set up backups** in Supabase dashboard

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the Supabase logs in Dashboard → Logs
2. Inspect browser console for error messages
3. Verify your Supabase project URL and API keys

---

**Ready to go! 🚀 Run the SQL script and watch your app come to life with a real database!**
