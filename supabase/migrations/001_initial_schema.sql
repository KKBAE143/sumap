/*
# SUMAP Initial Database Schema
Creates the foundational tables for the Smart Unified Mobility & Access Platform

## Query Description:
This migration sets up the core database structure for SUMAP, including user management,
pass system, transactions, validation events, operators, and offline tokens. All tables
include proper RLS policies and security measures.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- users: Extended user profiles linked to auth.users
- passes: Digital mobility passes with QR payloads
- transactions: Payment tracking with Stripe integration
- validation_events: Real-time validation logging
- operators: Transport operator management
- offline_tokens: Pre-synced tokens for offline validation

## Security Implications:
- RLS Status: Enabled on all public tables
- Policy Changes: Yes - comprehensive RLS policies
- Auth Requirements: All tables require authentication

## Performance Impact:
- Indexes: Added on foreign keys and frequently queried columns
- Triggers: Automatic profile creation trigger
- Estimated Impact: Minimal for initial setup
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('USER', 'OPERATOR', 'ADMIN');
CREATE TYPE pass_status AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');
CREATE TYPE pass_type AS ENUM ('SINGLE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE validation_result AS ENUM ('SUCCESS', 'EXPIRED', 'INVALID', 'SUSPENDED', 'INSUFFICIENT_BALANCE');
CREATE TYPE validation_method AS ENUM ('ONLINE', 'OFFLINE');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operators table
CREATE TABLE public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_info JSONB,
    integration_status TEXT DEFAULT 'PENDING',
    api_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passes table
CREATE TABLE public.passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES public.operators(id),
    pass_type pass_type NOT NULL,
    status pass_status DEFAULT 'ACTIVE',
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    qr_payload TEXT, -- Encrypted QR data
    color_seed TEXT, -- For deterministic color generation
    balance DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pass_id UUID REFERENCES public.passes(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status transaction_status DEFAULT 'PENDING',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation events table
CREATE TABLE public.validation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pass_id UUID NOT NULL REFERENCES public.passes(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    validation_result validation_result NOT NULL,
    validation_method validation_method NOT NULL,
    response_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline tokens table
CREATE TABLE public.offline_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    pass_id UUID REFERENCES public.passes(id) ON DELETE CASCADE,
    token_signature TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_passes_user_id ON public.passes(user_id);
CREATE INDEX idx_passes_status ON public.passes(status);
CREATE INDEX idx_passes_valid_dates ON public.passes(valid_from, valid_until);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_stripe_id ON public.transactions(stripe_payment_intent_id);
CREATE INDEX idx_validation_events_pass_id ON public.validation_events(pass_id);
CREATE INDEX idx_validation_events_timestamp ON public.validation_events(timestamp);
CREATE INDEX idx_offline_tokens_device_id ON public.offline_tokens(device_id);
CREATE INDEX idx_offline_tokens_expires_at ON public.offline_tokens(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON public.operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_passes_updated_at BEFORE UPDATE ON public.passes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for passes
CREATE POLICY "Users can view own passes" ON public.passes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own passes" ON public.passes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own passes" ON public.passes
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for validation events
CREATE POLICY "Users can view own validation events" ON public.validation_events
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.passes WHERE id = validation_events.pass_id
        )
    );
CREATE POLICY "System can insert validation events" ON public.validation_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for operators (admin only for now)
CREATE POLICY "Admins can manage operators" ON public.operators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- RLS Policies for offline tokens (operators only)
CREATE POLICY "Operators can manage offline tokens" ON public.offline_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('OPERATOR', 'ADMIN')
        )
    );
