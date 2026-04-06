-- PLASE Survey — Supabase Schema
-- Run this in the Supabase SQL Editor before deploying.

CREATE TABLE IF NOT EXISTS responses (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT now(),

  -- Demographics
  language              TEXT NOT NULL,
  age                   INTEGER NOT NULL,
  sex                   TEXT NOT NULL,
  nationality           TEXT NOT NULL,
  location              TEXT NOT NULL,

  -- Survey answers (D1–D5 free text, D6 scale + text)
  d1                    TEXT NOT NULL,
  d2                    TEXT NOT NULL,
  d3                    TEXT NOT NULL,
  d4                    TEXT NOT NULL,
  d5                    TEXT NOT NULL,
  d6_scale              INTEGER NOT NULL CHECK (d6_scale BETWEEN 1 AND 5),
  d6_text               TEXT,

  -- PLASE analysis (raw + parsed vector)
  plase_raw             TEXT,
  plase_V               REAL,
  plase_A               REAL,
  plase_R               REAL,
  plase_T               REAL,
  plase_phi_elab        REAL,
  plase_phi_comport     REAL,
  plase_delta           REAL,
  plase_window          TEXT,
  plase_nc              REAL,
  plase_emb             REAL,
  plase_stadio          TEXT,
  plase_analyzed_at     TIMESTAMPTZ,

  -- Therapist review
  therapist_confirmed          BOOLEAN DEFAULT false,
  therapist_confirmed_at       TIMESTAMPTZ,
  therapist_notes              TEXT,
  therapist_adjusted_V         REAL,
  therapist_adjusted_A         REAL,
  therapist_adjusted_phi       REAL,
  therapist_adjusted_delta     REAL,
  therapist_adjusted_window    TEXT,
  therapist_adjusted_stadio    TEXT
);

-- Index for quick ordering
CREATE INDEX IF NOT EXISTS responses_created_at_idx ON responses (created_at DESC);

-- Row Level Security: allow anonymous inserts (survey submissions)
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (survey is public)
CREATE POLICY "Allow public insert"
  ON responses FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role can read/update (admin API uses service role key)
-- No SELECT policy for anon = anon cannot read data
