CREATE TABLE IF NOT EXISTS t_p39381331_messenger_under_oran.contacts (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES t_p39381331_messenger_under_oran.users(id),
    contact_user_id INTEGER NOT NULL REFERENCES t_p39381331_messenger_under_oran.users(id),
    nickname VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(owner_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON t_p39381331_messenger_under_oran.contacts(owner_id);
