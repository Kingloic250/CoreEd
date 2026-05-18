ALTER TABLE students ADD COLUMN IF NOT EXISTS "studentNumber" VARCHAR(10) UNIQUE;

-- One-time backfill for existing rows (sequential is fine, no real data yet)
UPDATE students SET "studentNumber" = SUBSTRING("enrollmentDate" FROM 3 FOR 2) || LPAD(ROW_NUMBER() OVER (PARTITION BY SUBSTRING("enrollmentDate" FROM 1 FOR 4) ORDER BY id), 3, '0') WHERE "studentNumber" IS NULL;
