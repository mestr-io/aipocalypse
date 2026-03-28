-- Add context links field to polls table
ALTER TABLE polls ADD COLUMN links TEXT NOT NULL DEFAULT '';
