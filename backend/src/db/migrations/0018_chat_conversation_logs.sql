-- KVKK: full chat conversation logs (site assistant + recipe chat)

CREATE TABLE IF NOT EXISTS chat_conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel varchar(32) NOT NULL,
  session_id varchar(64),
  user_message text NOT NULL,
  bot_reply text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome varchar(32) NOT NULL,
  error_code varchar(50),
  path varchar(20),
  context jsonb,
  ip_address varchar(45),
  user_agent text,
  referer varchar(2000),
  accept_language varchar(200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_channel_created
  ON chat_conversation_logs (channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_logs_session_created
  ON chat_conversation_logs (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_logs_outcome_created
  ON chat_conversation_logs (outcome, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_logs_ip_created
  ON chat_conversation_logs (ip_address, created_at DESC);
