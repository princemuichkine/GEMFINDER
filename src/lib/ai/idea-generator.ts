import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { cohere } from '@ai-sdk/cohere'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'

// Define the schemas for structured outputs
const marketAnalysisSchema = z.object({
  marketSize: z.number().optional(),
  growthRate: z.number().optional(),
  competitionLevel: z.string(),
  trends: z.array(z.object({
    trend: z.string(),
    impact: z.string(),
    timeline: z.string()
  })).optional(),
  opportunities: z.array(z.string()),
  threats: z.array(z.string())
})

const blueOceanAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  potential: z.enum(['low', 'moderate', 'good', 'excellent']),
  reconstructionOpportunities: z.array(z.object({
    type: z.string(),
    description: z.string(),
    impact: z.string()
  })),
  valueInnovation: z.object({
    eliminate: z.array(z.string()),
    reduce: z.array(z.string()),
    raise: z.array(z.string()),
    create: z.array(z.string())
  })
})

const ideaSchema = z.object({
  title: z.string(),
  valueProposition: z.string(),
  businessModel: z.string(),
  marketOpportunity: z.string(),
  competitiveAdvantages: z.array(z.string()),
  financialProjections: z.object({
    year1Revenue: z.string(),
    year1Customers: z.string(),
    breakEven: z.string(),
    marketShare: z.string()
  }).optional(),
  risks: z.array(z.string()),
  goToMarketStrategy: z.string(),
  blueOceanScore: z.number().min(0).max(100),
  blueOceanPotential: z.enum(['low', 'moderate', 'good', 'excellent']),
  marketAnalysis: marketAnalysisSchema.optional()
})

export async function generateIdea(input: {
  industry: string
  description: string
  targetMarket?: string
  budgetRange?: string
  timeline?: string
  preferences?: string[]
}) {
  try {
    // Phase 1: Market Analysis
    const marketAnalysis = await analyzeMarket(input)

    // Phase 2: Blue Ocean Strategy Analysis
    const blueOceanAnalysis = await analyzeBlueOceanStrategy(input, marketAnalysis)

    // Phase 3: Generate comprehensive idea
    const idea = await generateComprehensiveIdea(input, marketAnalysis, blueOceanAnalysis)

    return {
      ...idea,
      marketAnalysis,
      blueOceanAnalysis
    }

  } catch (error) {
    console.error('Error generating idea:', error)
    throw new Error('Failed to generate idea')
  }
}

async function analyzeMarket(input: any) {
  const prompt = `Analyze the market for a startup idea with these parameters:

Industry: ${input.industry}
Description: ${input.description}
Target Market: ${input.targetMarket || 'General'}
Budget Range: ${input.budgetRange || 'Not specified'}
Timeline: ${input.timeline || 'Not specified'}

Provide a comprehensive market analysis including:
- Market size estimate (in billions USD)
- Growth rate percentage
- Competition level (low/medium/high/very_high)
- Key trends and their impact
- Market opportunities
- Potential threats

Focus on ${input.industry} industry and consider the described business concept.`

  try {
    const result = await generateObject({
      model: openai('gpt-4-turbo-preview'),
      schema: marketAnalysisSchema,
      prompt,
      temperature: 0.3
    })

    return result.object
  } catch (error) {
    console.error('Market analysis error:', error)
    // Fallback to basic analysis
    return {
      marketSize: getIndustryMarketSize(input.industry),
      growthRate: getIndustryGrowthRate(input.industry),
      competitionLevel: 'medium',
      opportunities: ['Market gap identification', 'Growing demand', 'Technological advancement'],
      threats: ['Competition', 'Regulatory changes', 'Economic factors']
    }
  }
}

async function analyzeBlueOceanStrategy(input: any, marketAnalysis: any) {
  const prompt = `Apply Blue Ocean Strategy framework to create uncontested market space:

Business Concept: ${input.description}
Industry: ${input.industry}
Market Analysis: ${JSON.stringify(marketAnalysis)}

Identify:
1. Current industry boundaries and assumptions
2. Reconstruction opportunities across the six paths
3. Value innovation canvas (eliminate, reduce, raise, create)
4. Blue ocean potential score (0-100)
5. Strategic positioning recommendations

Focus on creating new demand rather than competing in existing markets.`

  try {
    const result = await generateObject({
      model: anthropic('claude-3-sonnet-20240229'),
      schema: blueOceanAnalysisSchema,
      prompt,
      temperature: 0.4
    })

    return result.object
  } catch (error) {
    console.error('Blue ocean analysis error:', error)
    // Fallback analysis
    return {
      score: 75,
      potential: 'good' as const,
      reconstructionOpportunities: [
        {
          type: 'Alternative Industries',
          description: 'Apply solutions from adjacent industries',
          impact: 'High'
        }
      ],
      valueInnovation: {
        eliminate: ['Traditional industry limitations'],
        reduce: ['High costs', 'Complex processes'],
        raise: ['Innovation focus', 'Customer experience'],
        create: ['New market segments', 'Breakthrough solutions']
      }
    }
  }
}

async function generateComprehensiveIdea(input: any, marketAnalysis: any, blueOceanAnalysis: any) {
  const preferences = input.preferences || []
  const preferenceText = preferences.length > 0
    ? `Focus on these preferences: ${preferences.join(', ')}`
    : ''

  const prompt = `Create a breakthrough startup idea with these specifications:

Industry: ${input.industry}
Description: ${input.description}
Target Market: ${input.targetMarket || 'General market'}
Budget Range: ${input.budgetRange || 'Flexible'}
Timeline: ${input.timeline || '1-2 years'}
${preferenceText}

Market Analysis: ${JSON.stringify(marketAnalysis)}
Blue Ocean Analysis: ${JSON.stringify(blueOceanAnalysis)}

Generate a complete business concept that:
1. Solves a significant problem in new ways
2. Creates uncontested market space
3. Has strong scalability potential
4. Includes detailed financial projections
5. Addresses key risks and mitigation strategies
6. Provides clear go-to-market strategy

Structure the response with all required fields for a comprehensive business plan.`

  try {
    const result = await generateObject({
      model: openai('gpt-4-turbo-preview'),
      schema: ideaSchema,
      prompt,
      temperature: 0.7
    })

    return result.object
  } catch (error) {
    console.error('Idea generation error:', error)
    throw new Error('Failed to generate comprehensive idea')
  }
}

// Helper functions for fallback data
function getIndustryMarketSize(industry: string): number {
  const sizes: Record<string, number> = {
    technology: 5000,
    healthcare: 8000,
    finance: 3000,
    education: 2000,
    retail: 25000,
    manufacturing: 15000,
    energy: 6000,
    transportation: 8000,
    entertainment: 2000,
    agriculture: 5000,
    real_estate: 3000,
    food_beverage: 8000,
    media: 1500,
    consulting: 1000,
    other: 1000
  }
  return sizes[industry] || 1000
}

function getIndustryGrowthRate(industry: string): number {
  const rates: Record<string, number> = {
    technology: 8.5,
    healthcare: 5.2,
    finance: 4.8,
    education: 6.1,
    retail: 3.2,
    manufacturing: 2.8,
    energy: 1.5,
    transportation: 4.9,
    entertainment: 7.2,
    agriculture: 2.1,
    real_estate: 3.5,
    food_beverage: 4.2,
    media: 5.8,
    consulting: 4.5,
    other: 4.0
  }
  return rates[industry] || 4.0
}

export async function iterateIdea(
  currentIdea: any,
  feedback: string,
  marketAnalysis?: any
) {
  const prompt = `Improve this startup idea based on user feedback:

Current Idea: ${JSON.stringify(currentIdea)}
User Feedback: ${feedback}
Market Analysis: ${JSON.stringify(marketAnalysis || {})}

Refine the business concept by:
1. Addressing the specific feedback provided
2. Maintaining or improving blue ocean characteristics
3. Enhancing market fit and scalability
4. Updating financial projections if needed
5. Strengthening competitive advantages

Return the improved idea with the same structure.`

  try {
    const result = await generateObject({
      model: anthropic('claude-3-sonnet-20240229'),
      schema: ideaSchema,
      prompt,
      temperature: 0.5
    })

    return result.object
  } catch (error) {
    console.error('Idea iteration error:', error)
    throw new Error('Failed to iterate idea')
  }
}
