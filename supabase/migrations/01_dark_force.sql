-- EXTENSIONS --

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS --

CREATE TYPE idea_status AS ENUM ('draft', 'generated', 'iterating', 'completed', 'archived');
CREATE TYPE industry_type AS ENUM (
  'technology', 'healthcare', 'finance', 'education', 'retail',
  'manufacturing', 'energy', 'transportation', 'entertainment',
  'agriculture', 'real_estate', 'food_beverage', 'media',
  'consulting', 'other'
);
CREATE TYPE blue_ocean_potential AS ENUM ('low', 'moderate', 'good', 'excellent');
CREATE TYPE timeline_type AS ENUM ('1-3_months', '3-6_months', '6-12_months', '1-2_years', '2_plus_years');
CREATE TYPE budget_range_type AS ENUM ('under_10k', '10k_50k', '50k_100k', '100k_500k', '500k_plus');
CREATE TYPE competition_level_type AS ENUM ('low', 'moderate', 'high', 'very_high');
CREATE TYPE training_data_type AS ENUM ('success', 'failure', 'trend', 'pattern');

-- TABLES --

-- IDEAS TABLE
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  industry industry_type NOT NULL,
  target_mkt TEXT,
  budget_rng budget_range_type,
  timeline timeline_type,
  prefs JSONB DEFAULT '[]'::jsonb,

  -- AI-generated content
  value_prop TEXT,
  biz_model TEXT,
  mkt_opp TEXT,
  comp_adv JSONB DEFAULT '[]'::jsonb,
  fin_proj JSONB,
  risks JSONB DEFAULT '[]'::jsonb,
  gtm_strat TEXT,

  -- Analysis data
  mkt_size BIGINT,
  growth_rt DECIMAL(5,2),
  comp_lvl competition_level_type,
  bo_score INTEGER CHECK (bo_score >= 0 AND bo_score <= 100),
  bo_potential blue_ocean_potential,

  -- Metadata
  status idea_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gen_at TIMESTAMP WITH TIME ZONE,
  last_iter_at TIMESTAMP WITH TIME ZONE
);

-- IDEA ITERATIONS TABLE
CREATE TABLE idea_iterations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  feedback TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MARKET RESEARCH CACHE TABLE
CREATE TABLE market_research_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'market_size', 'growth_rate', 'trends', etc.
  data JSONB NOT NULL,
  source TEXT,
  conf DECIMAL(3,2),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  UNIQUE(industry, data_type, source)
);

-- USER PREFERENCES TABLE
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pref_inds industry_type[],
  pref_budgets TEXT[],
  pref_timelines TEXT[],
  innov_focus JSONB DEFAULT '{
    "blue_ocean": true,
    "disruptive": false,
    "scalable": true,
    "b2b": false,
    "b2c": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(userid)
);

-- STARTUP TRAINING DATA TABLE
CREATE TABLE startup_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type training_data_type NOT NULL,
  content JSONB NOT NULL,
  industry industry_type,
  tags TEXT[],
  qual_score INTEGER CHECK (qual_score >= 1 AND qual_score <= 5),
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES --

CREATE INDEX idx_ideas_userid ON ideas(userid);
CREATE INDEX idx_ideas_industry ON ideas(industry);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_idea_iterations_idea_id ON idea_iterations(idea_id);
CREATE INDEX idx_mkt_research_ind ON market_research_cache(industry);
CREATE INDEX idx_mkt_research_exp ON market_research_cache(expires_at);
CREATE INDEX idx_startup_data_type ON startup_training_data(data_type);
CREATE INDEX idx_startup_data_ind ON startup_training_data(industry);

-- RLS POLICIES --

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_research_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_training_data ENABLE ROW LEVEL SECURITY;

-- IDEAS POLICIES
CREATE POLICY "Users can view their own ideas" ON ideas
  FOR SELECT USING (auth.uid() = userid);

CREATE POLICY "Users can insert their own ideas" ON ideas
  FOR INSERT WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own ideas" ON ideas
  FOR UPDATE USING (auth.uid() = userid);

CREATE POLICY "Users can delete their own ideas" ON ideas
  FOR DELETE USING (auth.uid() = userid);

-- IDEA ITERATIONS POLICIES
CREATE POLICY "Users can view iterations of their ideas" ON idea_iterations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_iterations.idea_id
      AND ideas.userid = auth.uid()
    )
  );

CREATE POLICY "Users can insert iterations for their ideas" ON idea_iterations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_iterations.idea_id
      AND ideas.userid = auth.uid()
    )
  );

-- USER PREFERENCES POLICIES
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = userid);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = userid);

-- MARKET RESEARCH CACHE POLICIES
CREATE POLICY "Anyone can view market research cache" ON market_research_cache
  FOR SELECT USING (true);

-- STARTUP TRAINING DATA POLICIES
CREATE POLICY "Only authenticated users can view training data" ON startup_training_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- FUNCTIONS --

-- FUNCTION TO UPDATE UPDATED AT COLUMN FOR AUTOMATIC UPDATES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER TO UPDATE UPDATED AT COLUMN FOR IDEAS
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER TO UPDATE UPDATED AT COLUMN FOR USER PREFERENCES
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUNCTION TO INCREMENT IDEA VERSION FOR AUTOMATIC UPDATES
CREATE OR REPLACE FUNCTION increment_idea_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER TO INCREMENT IDEA VERSION FOR AUTOMATIC UPDATES
CREATE TRIGGER increment_idea_version_trigger
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION increment_idea_version();
