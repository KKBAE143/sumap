-- SUMAP Seed Data
-- Creates sample data for development and testing

-- Insert sample operator
INSERT INTO public.operators (id, name, contact_info, integration_status, api_key) VALUES
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Mumbai Metro',
    '{"email": "tech@mumbai-metro.in", "phone": "+91-22-1234-5678", "website": "https://mumbai-metro.in"}',
    'ACTIVE',
    'op_test_mumbai_metro_api_key_123'
);

-- Insert admin user (you'll need to sign up with this email first)
-- This will be linked automatically via the trigger
-- Email: admin@sumap.in
-- You need to sign up with this email in your app first

-- Note: Sample passes and transactions will be created via the application
-- after user signup and authentication
