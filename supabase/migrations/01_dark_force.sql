-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE idea_status AS ENUM ('draft', 'generated', 'iterating', 'completed', 'archived');
CREATE TYPE industry_type AS ENUM (
  'technology', 'healthcare', 'finance', 'education', 'retail',
  'manufacturing', 'energy', 'transportation', 'entertainment',
  'agriculture', 'real_estate', 'food_beverage', 'media',
  'consulting', 'other'
);
CREATE TYPE blue_ocean_potential AS ENUM ('low', 'moderate', 'good', 'excellent');

-- Create ideas table
CREATE TABLE ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry industry_type NOT NULL,
  target_market TEXT,
  budget_range TEXT,
  timeline TEXT,
  preferences JSONB DEFAULT '[]'::jsonb,

  -- AI-generated content
  value_proposition TEXT,
  business_model TEXT,
  market_opportunity TEXT,
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  financial_projections JSONB,
  risks JSONB DEFAULT '[]'::jsonb,
  go_to_market_strategy TEXT,

  -- Analysis data
  market_size BIGINT,
  growth_rate DECIMAL(5,2),
  competition_level TEXT,
  blue_ocean_score INTEGER CHECK (blue_ocean_score >= 0 AND blue_ocean_score <= 100),
  blue_ocean_potential blue_ocean_potential,

  -- Metadata
  status idea_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE,
  last_iterated_at TIMESTAMP WITH TIME ZONE
);

-- Create idea_iterations table for tracking changes
CREATE TABLE idea_iterations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  feedback TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create market_research_cache table
CREATE TABLE market_research_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  industry TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'market_size', 'growth_rate', 'trends', etc.
  data JSONB NOT NULL,
  source TEXT,
  confidence DECIMAL(3,2),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  UNIQUE(industry, data_type, source)
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_industries industry_type[],
  preferred_budget_ranges TEXT[],
  preferred_timelines TEXT[],
  innovation_focus JSONB DEFAULT '{
    "blue_ocean": true,
    "disruptive": false,
    "scalable": true,
    "b2b": false,
    "b2c": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create startup_training_data table for fine-tuning
CREATE TABLE startup_training_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data_type TEXT NOT NULL, -- 'success', 'failure', 'trend', 'pattern'
  content JSONB NOT NULL,
  industry industry_type,
  tags TEXT[],
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_industry ON ideas(industry);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_idea_iterations_idea_id ON idea_iterations(idea_id);
CREATE INDEX idx_market_research_industry ON market_research_cache(industry);
CREATE INDEX idx_market_research_expires ON market_research_cache(expires_at);
CREATE INDEX idx_startup_data_type ON startup_training_data(data_type);
CREATE INDEX idx_startup_data_industry ON startup_training_data(industry);

-- Create RLS (Row Level Security) policies
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_research_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_training_data ENABLE ROW LEVEL SECURITY;

-- Ideas policies
CREATE POLICY "Users can view their own ideas" ON ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas" ON ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas" ON ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas" ON ideas
  FOR DELETE USING (auth.uid() = user_id);

-- Idea iterations policies
CREATE POLICY "Users can view iterations of their ideas" ON idea_iterations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_iterations.idea_id
      AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert iterations for their ideas" ON idea_iterations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_iterations.idea_id
      AND ideas.user_id = auth.uid()
    )
  );

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Market research cache policies (public read, admin write)
CREATE POLICY "Anyone can view market research cache" ON market_research_cache
  FOR SELECT USING (true);

-- Startup training data policies (admin only)
CREATE POLICY "Only authenticated users can view training data" ON startup_training_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment idea version
CREATE OR REPLACE FUNCTION increment_idea_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_idea_version_trigger
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION increment_idea_version();
