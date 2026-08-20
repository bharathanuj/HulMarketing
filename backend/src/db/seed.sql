-- Demo seed data. Rexona is used only as ONE example brand — the schema and
-- agents are brand-agnostic and work the same way for any brand/category.

INSERT INTO brands (brand_id, name, category, market) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Rexona', 'Deodorant / Personal Care', 'India'),
  ('22222222-2222-2222-2222-222222222222', 'Lifebuoy', 'Soap / Hygiene', 'India'),
  ('33333333-3333-3333-3333-333333333333', 'Dove', 'Personal Care / Beauty', 'Global');

INSERT INTO brand_knowledge (brand_id, doc_type, market, language, content, source_ref) VALUES
  ('11111111-1111-1111-1111-111111111111', 'positioning', 'India', 'en',
   'Rexona stands for confidence under pressure — performance that holds up when situations get intense.', 'brand_pack_v1'),
  ('11111111-1111-1111-1111-111111111111', 'tone', 'India', 'en',
   'Bold, energetic, a little cheeky. Never mocks the subject of the moment.', 'brand_pack_v1'),
  ('11111111-1111-1111-1111-111111111111', 'forbidden_claims', 'India', 'en',
   'Never claim medical/clinical protection. Never disparage a specific athlete, team or real person.', 'legal_playbook_v1');

-- Rest of the HUL portfolio (public knowledge) — brand-agnostic, so every
-- brand works the same way through the pipeline; each gets a light default
-- positioning row until a real brand pack is uploaded via the Documents tab.
INSERT INTO brands (name, category, market) VALUES
  ('Lux', 'Personal Care / Beauty Soap', 'India'),
  ('Pears', 'Personal Care / Soap', 'India'),
  ('Pond''s', 'Personal Care / Skincare', 'India'),
  ('Vaseline', 'Personal Care / Skincare', 'Global'),
  ('Glow & Lovely', 'Personal Care / Skincare', 'India'),
  ('Axe', 'Personal Care / Deodorant', 'Global'),
  ('Sunsilk', 'Personal Care / Haircare', 'India'),
  ('Clinic Plus', 'Personal Care / Haircare', 'India'),
  ('TRESemme', 'Personal Care / Haircare', 'Global'),
  ('Indulekha', 'Personal Care / Haircare', 'India'),
  ('Love Beauty and Planet', 'Personal Care / Haircare', 'Global'),
  ('Lakme', 'Personal Care / Cosmetics', 'India'),
  ('Pepsodent', 'Oral Care', 'India'),
  ('Closeup', 'Oral Care', 'India'),
  ('Surf Excel', 'Home Care / Laundry', 'India'),
  ('Rin', 'Home Care / Laundry', 'India'),
  ('Wheel', 'Home Care / Laundry', 'India'),
  ('Vim', 'Home Care / Dishwash', 'India'),
  ('Comfort', 'Home Care / Fabric Care', 'India'),
  ('Domex', 'Home Care / Cleaning', 'India'),
  ('Cif', 'Home Care / Cleaning', 'Global'),
  ('Kissan', 'Foods / Ketchup & Spreads', 'India'),
  ('Knorr', 'Foods / Soups & Meals', 'India'),
  ('Kwality Wall''s', 'Foods / Ice Cream', 'India'),
  ('Brooke Bond', 'Refreshment / Tea', 'India'),
  ('Lipton', 'Refreshment / Tea', 'Global'),
  ('Bru', 'Refreshment / Coffee', 'India'),
  ('Horlicks', 'Foods / Health Food Drinks', 'India'),
  ('Boost', 'Foods / Health Food Drinks', 'India'),
  ('Pureit', 'Water Purifiers', 'India');

INSERT INTO brand_knowledge (brand_id, doc_type, market, language, content, source_ref)
SELECT brand_id, 'positioning', market, 'en',
       name || ' is part of the HUL portfolio (' || category || '). Upload a brand pack via the Documents tab for detailed positioning, tone and claims guidance.',
       'auto_seed_v1'
FROM brands
WHERE name NOT IN ('Rexona', 'Lifebuoy', 'Dove');

-- Default active LLM for each pipeline role, matching backend/.env.example.
-- Change the active model any time from the AI Models tab — no restart needed.
INSERT INTO ai_models (name, provider, model_ref, role, category, is_active, notes) VALUES
  ('GPT-OSS 120B (Reasoning)', 'ollama-cloud', 'gpt-oss:120b', 'reasoning', 'llm', true, 'Default reasoning model'),
  ('GPT-OSS 120B (Copy)', 'ollama-cloud', 'gpt-oss:120b', 'copy', 'llm', true, 'Default copy model'),
  ('Qwen3-VL (Vision)', 'ollama-cloud', 'qwen3-vl', 'vision', 'llm', true, 'Default vision model');
