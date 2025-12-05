-- Voices Table for Multi-Provider Voice Management
CREATE TABLE IF NOT EXISTS voices (
  id VARCHAR(36) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL DEFAULT 'elevenlabs',
  provider_voice_id VARCHAR(128) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL DEFAULT 'en-US',
  gender VARCHAR(20) NULL,
  sample_rate INT NULL,
  locale VARCHAR(20) NULL,
  is_preview_available BOOLEAN DEFAULT TRUE,
  meta JSON NULL COMMENT 'Provider-specific metadata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY ux_voices_provider_providerVoiceId (provider, provider_voice_id),
  INDEX idx_provider (provider),
  INDEX idx_language_code (language_code),
  INDEX idx_display_name (display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
