-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE commitment_mode AS ENUM ('free_flow', 'gentle_rhythm', 'committed_path');
CREATE TYPE habit_category AS ENUM ('health', 'productivity', 'personal', 'relationships', 'finance', 'learning', 'creative', 'other');
CREATE TYPE check_in_type AS ENUM ('text', 'voice', 'photo', 'measurement');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    commitment_mode commitment_mode DEFAULT 'free_flow',
    preferred_check_in_days INTEGER[] DEFAULT '{}', -- For gentle_rhythm mode
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Habits table
CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category habit_category DEFAULT 'other',
    commitment_mode commitment_mode NOT NULL,
    target_frequency TEXT, -- e.g., "daily", "3x per week", "weekly"
    preferred_days INTEGER[], -- 0=Sunday, 6=Saturday
    reminder_time TIME,
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habits
CREATE POLICY "Users can view their own habits" ON public.habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" ON public.habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON public.habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON public.habits
    FOR DELETE USING (auth.uid() = user_id);

-- Check-ins table
CREATE TABLE public.check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    check_in_type check_in_type NOT NULL,
    content TEXT, -- For text check-ins
    voice_url TEXT, -- For voice notes
    photo_url TEXT, -- For photo check-ins
    measurement_value DECIMAL, -- For quantitative tracking
    measurement_unit TEXT, -- e.g., "minutes", "miles", "pages"
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for check_ins
CREATE POLICY "Users can view their own check-ins" ON public.check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins" ON public.check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins" ON public.check_ins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins" ON public.check_ins
    FOR DELETE USING (auth.uid() = user_id);

-- Milestones table
CREATE TABLE public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completed_date DATE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for milestones
CREATE POLICY "Users can view their own milestones" ON public.milestones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own milestones" ON public.milestones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON public.milestones
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones" ON public.milestones
    FOR DELETE USING (auth.uid() = user_id);

-- Anonymous community support (optional feature)
CREATE TABLE public.anonymous_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    habit_category habit_category,
    content TEXT NOT NULL,
    is_milestone BOOLEAN DEFAULT false,
    support_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.anonymous_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous_posts
CREATE POLICY "Anyone can view anonymous posts" ON public.anonymous_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create anonymous posts" ON public.anonymous_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anonymous posts" ON public.anonymous_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anonymous posts" ON public.anonymous_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Support reactions for anonymous posts
CREATE TABLE public.anonymous_supports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.anonymous_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.anonymous_supports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous_supports
CREATE POLICY "Users can view supports" ON public.anonymous_supports
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add support" ON public.anonymous_supports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their support" ON public.anonymous_supports
    FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    tier subscription_tier DEFAULT 'free',
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only allow updates through secure backend functions
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    
    INSERT INTO public.subscriptions (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habits_category ON public.habits(category);
CREATE INDEX idx_check_ins_habit_id ON public.check_ins(habit_id);
CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_created_at ON public.check_ins(created_at);
CREATE INDEX idx_milestones_habit_id ON public.milestones(habit_id);
CREATE INDEX idx_anonymous_posts_category ON public.anonymous_posts(habit_category);
CREATE INDEX idx_anonymous_posts_created_at ON public.anonymous_posts(created_at);