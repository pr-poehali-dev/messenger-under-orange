CREATE TABLE IF NOT EXISTS t_p39381331_messenger_under_oran.users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) DEFAULT '',
    username VARCHAR(50) DEFAULT '',
    about TEXT DEFAULT 'Привет! Я использую Андер 🧡',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p39381331_messenger_under_oran.sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
    used BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_p39381331_messenger_under_oran.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p39381331_messenger_under_oran.users(id),
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON t_p39381331_messenger_under_oran.sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p39381331_messenger_under_oran.sessions(token);
