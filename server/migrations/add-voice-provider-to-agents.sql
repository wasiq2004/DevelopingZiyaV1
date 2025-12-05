-- Add voice provider tracking columns to agents table
ALTER TABLE agents 
ADD COLUMN voice_provider VARCHAR(32) DEFAULT 'elevenlabs' AFTER voice_id,
ADD COLUMN voice_provider_voice_id VARCHAR(128) NULL AFTER voice_provider,
ADD INDEX idx_voice_provider (voice_provider);

-- Backfill existing agents with elevenlabs provider
UPDATE agents 
SET voice_provider = 'elevenlabs', 
    voice_provider_voice_id = voice_id 
WHERE voice_provider IS NULL;
