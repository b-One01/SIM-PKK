-- Alter NIK column to VARCHAR(100) to support longer alphanumeric usernames (e.g. long Kecamatan names)
ALTER TABLE user_profiles ALTER COLUMN nik TYPE VARCHAR(100);
