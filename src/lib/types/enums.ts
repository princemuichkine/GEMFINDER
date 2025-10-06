// Enum types and mappings for database consistency

export const BUDGET_RANGE_ENUM = {
  UNDER_10K: 'under_10k',
  TEN_TO_FIFTY_K: '10k_50k',
  FIFTY_TO_HUNDRED_K: '50k_100k',
  HUNDRED_TO_FIVE_HUNDRED_K: '100k_500k',
  OVER_FIVE_HUNDRED_K: '500k_plus'
} as const

export const TIMELINE_ENUM = {
  ONE_TO_THREE_MONTHS: '1-3_months',
  THREE_TO_SIX_MONTHS: '3-6_months',
  SIX_TO_TWELVE_MONTHS: '6-12_months',
  ONE_TO_TWO_YEARS: '1-2_years',
  OVER_TWO_YEARS: '2_plus_years'
} as const

export const COMPETITION_LEVEL_ENUM = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
} as const

export const TRAINING_DATA_TYPE_ENUM = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  TREND: 'trend',
  PATTERN: 'pattern'
} as const

// Mapping functions for converting user input to enum values
export function convertBudgetRange(budgetStr?: string): string | null {
  if (!budgetStr) return null
  const mapping: Record<string, string> = {
    'Under $10,000': BUDGET_RANGE_ENUM.UNDER_10K,
    '$10,000 - $50,000': BUDGET_RANGE_ENUM.TEN_TO_FIFTY_K,
    '$50,000 - $100,000': BUDGET_RANGE_ENUM.FIFTY_TO_HUNDRED_K,
    '$100,000 - $500,000': BUDGET_RANGE_ENUM.HUNDRED_TO_FIVE_HUNDRED_K,
    '$500,000+': BUDGET_RANGE_ENUM.OVER_FIVE_HUNDRED_K
  }
  return mapping[budgetStr] || null
}

export function convertTimeline(timelineStr?: string): string | null {
  if (!timelineStr) return null
  const mapping: Record<string, string> = {
    '1-3 months': TIMELINE_ENUM.ONE_TO_THREE_MONTHS,
    '3-6 months': TIMELINE_ENUM.THREE_TO_SIX_MONTHS,
    '6-12 months': TIMELINE_ENUM.SIX_TO_TWELVE_MONTHS,
    '1-2 years': TIMELINE_ENUM.ONE_TO_TWO_YEARS,
    '2+ years': TIMELINE_ENUM.OVER_TWO_YEARS
  }
  return mapping[timelineStr] || null
}

export function convertCompetitionLevel(level?: string): string | null {
  if (!level) return null
  const mapping: Record<string, string> = {
    'Low': COMPETITION_LEVEL_ENUM.LOW,
    'Moderate': COMPETITION_LEVEL_ENUM.MODERATE,
    'High': COMPETITION_LEVEL_ENUM.HIGH,
    'Very High': COMPETITION_LEVEL_ENUM.VERY_HIGH
  }
  return mapping[level] || null
}

// Type exports for TypeScript
export type BudgetRangeType = typeof BUDGET_RANGE_ENUM[keyof typeof BUDGET_RANGE_ENUM]
export type TimelineType = typeof TIMELINE_ENUM[keyof typeof TIMELINE_ENUM]
export type CompetitionLevelType = typeof COMPETITION_LEVEL_ENUM[keyof typeof COMPETITION_LEVEL_ENUM]
export type TrainingDataType = typeof TRAINING_DATA_TYPE_ENUM[keyof typeof TRAINING_DATA_TYPE_ENUM]
