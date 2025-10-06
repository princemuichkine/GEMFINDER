import { NextRequest, NextResponse } from 'next/server'
import { generateIdea } from '@/lib/ai/idea-generator'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { z } from 'zod'

const generateIdeaSchema = z.object({
  industry: z.enum(['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'energy', 'transportation', 'entertainment', 'agriculture', 'real_estate', 'food_beverage', 'media', 'consulting', 'other']),
  description: z.string().min(10).max(2000),
  targetMarket: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  preferences: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = generateIdeaSchema.parse(body)

    // Generate the idea using AI
    const ideaResult = await generateIdea(validatedData)

    // Save to database
    const { data: savedIdea, error: dbError } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title: ideaResult.title,
        description: validatedData.description,
        industry: validatedData.industry,
        target_market: validatedData.targetMarket,
        budget_range: validatedData.budgetRange,
        timeline: validatedData.timeline,
        preferences: validatedData.preferences || [],
        value_proposition: ideaResult.valueProposition,
        business_model: ideaResult.businessModel,
        market_opportunity: ideaResult.marketOpportunity,
        competitive_advantages: ideaResult.competitiveAdvantages,
        financial_projections: ideaResult.financialProjections,
        risks: ideaResult.risks,
        go_to_market_strategy: ideaResult.goToMarketStrategy,
        market_size: ideaResult.marketAnalysis?.marketSize,
        growth_rate: ideaResult.marketAnalysis?.growthRate,
        competition_level: ideaResult.marketAnalysis?.competitionLevel,
        blue_ocean_score: ideaResult.blueOceanScore,
        blue_ocean_potential: ideaResult.blueOceanPotential,
        status: 'generated',
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save idea' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      idea: savedIdea,
      marketAnalysis: ideaResult.marketAnalysis
    })

  } catch (error) {
    console.error('API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
