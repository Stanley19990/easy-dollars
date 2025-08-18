-- Easy Dollars Database Schema
-- Run this script when you connect a database integration

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  ed_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  machines_owned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Machine types table
CREATE TABLE IF NOT EXISTS machine_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  daily_earning_rate DECIMAL(5,4) NOT NULL, -- percentage
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User machines table
CREATE TABLE IF NOT EXISTS user_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  machine_type_id UUID NOT NULL REFERENCES machine_types(id),
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  ads_watched_today INTEGER DEFAULT 0,
  last_ad_watched TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  machine_id UUID REFERENCES user_machines(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL, -- 'USD' or 'ED'
  earning_type VARCHAR(50) NOT NULL, -- 'ad_watch', 'referral', 'bonus'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'rejected'
  payment_method VARCHAR(50),
  payment_details JSONB,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  bonus_amount DECIMAL(10,2) DEFAULT 5.00,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad sessions table
CREATE TABLE IF NOT EXISTS ad_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  machine_id UUID NOT NULL REFERENCES user_machines(id),
  ad_unit_id VARCHAR(100),
  reward_amount DECIMAL(10,2),
  session_duration INTEGER, -- in seconds
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default machine types
INSERT INTO machine_types (name, price, daily_earning_rate, description, image_url) VALUES
('Basic Miner', 10.00, 0.05, 'Entry-level machine perfect for beginners', '/images/basic-miner.png'),
('Power Miner', 25.00, 0.08, 'Enhanced mining capabilities with better returns', '/images/power-miner.png'),
('Turbo Miner', 50.00, 0.12, 'High-performance machine for serious earners', '/images/turbo-miner.png'),
('Quantum Miner', 100.00, 0.18, 'Top-tier machine with maximum earning potential', '/images/quantum-miner.png'),
('Mega Miner', 200.00, 0.25, 'Ultimate mining machine for power users', '/images/mega-miner.png');
