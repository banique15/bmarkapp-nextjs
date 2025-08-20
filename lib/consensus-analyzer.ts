interface Response {
  id: string
  model_id: string
  response_text: string
  response_time_ms: number
  model?: {
    name: string
    provider: string
  }
}

interface ConsensusGroup {
  groupName: string
  count: number
  percentage: number
  color: string
  models: string[]
  responses: Response[]
}

interface ConsensusAnalysis {
  groups: ConsensusGroup[]
  totalResponses: number
  consensusLevel: number
  diversity: number
  topResponse: string
}

export class ConsensusAnalyzer {
  private static readonly SIMILARITY_THRESHOLD = 0.8
  private static readonly COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ]

  /**
   * Analyze responses to find consensus groups
   */
  static analyzeConsensus(responses: Response[]): ConsensusAnalysis {
    if (responses.length === 0) {
      return {
        groups: [],
        totalResponses: 0,
        consensusLevel: 0,
        diversity: 0,
        topResponse: ''
      }
    }

    // Group similar responses
    const groups = this.groupSimilarResponses(responses)
    
    // Sort groups by count (descending)
    groups.sort((a, b) => b.count - a.count)
    
    // Assign colors
    groups.forEach((group, index) => {
      group.color = this.COLORS[index % this.COLORS.length]
    })

    // Calculate metrics
    const totalResponses = responses.length
    const consensusLevel = groups.length > 0 ? (groups[0].count / totalResponses) * 100 : 0
    const diversity = groups.length / totalResponses
    const topResponse = groups.length > 0 ? groups[0].groupName : ''

    return {
      groups,
      totalResponses,
      consensusLevel,
      diversity,
      topResponse
    }
  }

  /**
   * Group responses by similarity
   */
  private static groupSimilarResponses(responses: Response[]): ConsensusGroup[] {
    const groups: ConsensusGroup[] = []

    for (const response of responses) {
      const normalizedText = this.normalizeText(response.response_text)
      
      // Find existing group or create new one
      let group = groups.find(g => 
        this.calculateSimilarity(g.groupName, normalizedText) >= this.SIMILARITY_THRESHOLD
      )

      if (!group) {
        group = {
          groupName: normalizedText,
          count: 0,
          percentage: 0,
          color: '',
          models: [],
          responses: []
        }
        groups.push(group)
      }

      // Add response to group
      group.count++
      group.responses.push(response)
      
      if (response.model) {
        group.models.push(response.model.name)
      }
    }

    // Calculate percentages
    const total = responses.length
    groups.forEach(group => {
      group.percentage = (group.count / total) * 100
    })

    return groups
  }

  /**
   * Normalize text for comparison
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  /**
   * Calculate similarity between two texts using Levenshtein distance
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const normalized1 = this.normalizeText(text1)
    const normalized2 = this.normalizeText(text2)
    
    if (normalized1 === normalized2) return 1.0
    
    const distance = this.levenshteinDistance(normalized1, normalized2)
    const maxLength = Math.max(normalized1.length, normalized2.length)
    
    return maxLength === 0 ? 1.0 : 1 - (distance / maxLength)
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Generate insights about the consensus
   */
  static generateInsights(analysis: ConsensusAnalysis): string[] {
    const insights: string[] = []
    const { groups, totalResponses, consensusLevel, diversity } = analysis

    if (totalResponses === 0) {
      return ['No responses to analyze.']
    }

    // Consensus level insights
    if (consensusLevel >= 80) {
      insights.push(`Strong consensus: ${consensusLevel.toFixed(1)}% of models agreed on "${analysis.topResponse}".`)
    } else if (consensusLevel >= 60) {
      insights.push(`Moderate consensus: ${consensusLevel.toFixed(1)}% of models agreed on "${analysis.topResponse}".`)
    } else if (consensusLevel >= 40) {
      insights.push(`Weak consensus: Only ${consensusLevel.toFixed(1)}% of models agreed on "${analysis.topResponse}".`)
    } else {
      insights.push(`No clear consensus: Responses were highly diverse with the top response only getting ${consensusLevel.toFixed(1)}% agreement.`)
    }

    // Diversity insights
    if (diversity >= 0.8) {
      insights.push('Very high diversity: Most models gave different responses.')
    } else if (diversity >= 0.6) {
      insights.push('High diversity: Many different responses were given.')
    } else if (diversity >= 0.4) {
      insights.push('Moderate diversity: Some variation in responses.')
    } else {
      insights.push('Low diversity: Models tended to give similar responses.')
    }

    // Group insights
    if (groups.length >= 2) {
      const secondGroup = groups[1]
      const gap = groups[0].percentage - secondGroup.percentage
      
      if (gap < 10) {
        insights.push(`Close competition: "${groups[0].groupName}" (${groups[0].percentage.toFixed(1)}%) barely edged out "${secondGroup.groupName}" (${secondGroup.percentage.toFixed(1)}%).`)
      }
    }

    // Provider insights
    if (groups.length > 0) {
      const topGroup = groups[0]
      const providers = topGroup.responses.map(r => r.model?.provider).filter(Boolean)
      const uniqueProviders = [...new Set(providers)]
      
      if (uniqueProviders.length === 1) {
        insights.push(`Provider bias: All models agreeing on "${topGroup.groupName}" were from ${uniqueProviders[0]}.`)
      } else if (uniqueProviders.length >= 3) {
        insights.push(`Cross-provider agreement: Models from ${uniqueProviders.length} different providers agreed on "${topGroup.groupName}".`)
      }
    }

    return insights
  }

  /**
   * Export consensus data to CSV format
   */
  static exportToCsv(analysis: ConsensusAnalysis, promptText: string): string {
    const headers = ['Response', 'Count', 'Percentage', 'Models']
    const rows = analysis.groups.map(group => [
      `"${group.groupName.replace(/"/g, '""')}"`,
      group.count.toString(),
      group.percentage.toFixed(1),
      `"${group.models.join(', ').replace(/"/g, '""')}"`
    ])

    const csvContent = [
      `# LLM Consensus Analysis`,
      `# Prompt: "${promptText.replace(/"/g, '""')}"`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total Responses: ${analysis.totalResponses}`,
      `# Consensus Level: ${analysis.consensusLevel.toFixed(1)}%`,
      ``,
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Generate summary statistics
   */
  static getSummaryStats(analysis: ConsensusAnalysis): {
    totalModels: number
    uniqueResponses: number
    consensusLevel: number
    topResponse: string
    responseDistribution: { response: string; count: number; percentage: number }[]
  } {
    return {
      totalModels: analysis.totalResponses,
      uniqueResponses: analysis.groups.length,
      consensusLevel: analysis.consensusLevel,
      topResponse: analysis.topResponse,
      responseDistribution: analysis.groups.map(group => ({
        response: group.groupName,
        count: group.count,
        percentage: group.percentage
      }))
    }
  }
}

export type { Response, ConsensusGroup, ConsensusAnalysis }