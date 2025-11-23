/**
 * Profile-based funding qualification matching
 * Determines if a funding program matches a user's profile
 */

/**
 * Check if a funding program qualifies for a user based on their profile
 * @param {Object} program - The funding program to check
 * @param {Object} userProfile - The user's profile from user_profiles table
 * @returns {Object} - { qualifies: boolean, reasons: string[], score: number }
 */
export function checkProgramQualification(program, userProfile) {
  if (!userProfile || !program) {
    return { qualifies: false, reasons: ['Missing profile or program data'], score: 0 }
  }

  const reasons = []
  let score = 0
  const maxScore = 100

  // 1. Sector Matching (30 points)
  if (userProfile.sectors && userProfile.sectors.length > 0) {
    const programSectors = (program.sectors || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    
    const userSectors = userProfile.sectors.map(s => s.toLowerCase())
    
    if (programSectors.length > 0) {
      const matchingSectors = programSectors.filter(ps => 
        userSectors.some(us => ps.includes(us) || us.includes(ps))
      )
      
      if (matchingSectors.length > 0) {
        score += 30
        reasons.push(`✓ Matches your sectors: ${matchingSectors.join(', ')}`)
      } else {
        reasons.push(`✗ No sector match (you: ${userSectors.join(', ')}, program: ${programSectors.join(', ')})`)
      }
    } else {
      // Program doesn't specify sectors - give partial credit
      score += 15
      reasons.push('? Program sectors not specified')
    }
  }

  // 2. Funding Type Matching (25 points)
  if (userProfile.funding_types && userProfile.funding_types.length > 0) {
    const programSummary = (program.summary || '').toLowerCase()
    const programEligibility = (program.eligibility || '').toLowerCase()
    const programText = `${programSummary} ${programEligibility}`.toLowerCase()
    
    const fundingTypeKeywords = {
      'Grants': ['grant', 'funding', 'support', 'assistance'],
      'Loans': ['loan', 'financing', 'credit', 'borrow'],
      'Equity Investment': ['equity', 'investment', 'share', 'stake'],
      'Vouchers': ['voucher', 'voucher scheme', 'voucher program'],
      'Subsidies': ['subsidy', 'subsidized', 'subsidies'],
      'Mentorship Programs': ['mentorship', 'mentor', 'mentoring', 'guidance']
    }
    
    let fundingMatch = false
    for (const userFundingType of userProfile.funding_types) {
      const keywords = fundingTypeKeywords[userFundingType] || []
      if (keywords.some(keyword => programText.includes(keyword))) {
        fundingMatch = true
        reasons.push(`✓ Matches funding type: ${userFundingType}`)
        break
      }
    }
    
    if (fundingMatch) {
      score += 25
    } else {
      reasons.push(`✗ No funding type match (you want: ${userProfile.funding_types.join(', ')})`)
    }
  }

  // 3. Business Type Matching (15 points)
  if (userProfile.business_type && program.eligibility) {
    const eligibility = program.eligibility.toLowerCase()
    const businessType = userProfile.business_type.toLowerCase()
    
    const businessTypeKeywords = {
      'sole-proprietor': ['sole proprietor', 'sole trader', 'individual', 'personal'],
      'partnership': ['partnership', 'partners'],
      'pty-ltd': ['pty', 'ltd', 'limited', 'company', 'corporation'],
      'cc': ['close corporation', 'cc'],
      'npc': ['non-profit', 'npc', 'nonprofit', 'ngo'],
      'cooperative': ['cooperative', 'co-op', 'cooperative society']
    }
    
    const keywords = businessTypeKeywords[businessType] || []
    if (keywords.some(keyword => eligibility.includes(keyword))) {
      score += 15
      reasons.push(`✓ Matches business type: ${userProfile.business_type}`)
    } else {
      // Check if eligibility mentions "all business types" or similar
      if (eligibility.includes('all') || eligibility.includes('any') || eligibility.includes('eligible')) {
        score += 10
        reasons.push('? Business type not specified in eligibility')
      }
    }
  }

  // 4. Industry Matching (15 points)
  if (userProfile.industry && program.eligibility) {
    const eligibility = program.eligibility.toLowerCase()
    const industry = userProfile.industry.toLowerCase()
    
    if (eligibility.includes(industry) || industry.includes(eligibility.split(' ')[0])) {
      score += 15
      reasons.push(`✓ Matches industry: ${userProfile.industry}`)
    }
  }

  // 5. Funding Amount Range Matching (10 points)
  if (userProfile.funding_amount_needed && program.fundingAmount) {
    const userAmount = userProfile.funding_amount_needed
    const programAmount = program.fundingAmount.toLowerCase()
    
    // Simple range matching
    const amountRanges = {
      'under-100k': ['under', 'up to', 'less than', '100,000', '100k'],
      '100k-500k': ['100', '500', '100k', '500k'],
      '500k-1m': ['500', '1 million', '500k', '1m'],
      '1m-5m': ['1 million', '5 million', '1m', '5m'],
      '5m-10m': ['5 million', '10 million', '5m', '10m'],
      '10m-50m': ['10 million', '50 million', '10m', '50m'],
      'over-50m': ['over', 'more than', '50 million', '50m']
    }
    
    const userKeywords = amountRanges[userAmount] || []
    if (userKeywords.some(keyword => programAmount.includes(keyword))) {
      score += 10
      reasons.push(`✓ Funding amount matches your needs`)
    }
  }

  // 6. BEE Level Matching (5 points) - if program mentions BEE
  if (userProfile.bee_level && program.eligibility) {
    const eligibility = program.eligibility.toLowerCase()
    if (eligibility.includes('bee') || eligibility.includes('black economic empowerment')) {
      if (userProfile.bee_level !== 'not-certified') {
        score += 5
        reasons.push(`✓ BEE level may be relevant`)
      }
    }
  }

  // Determine if program qualifies (threshold: 40 points)
  const qualifies = score >= 40

  return {
    qualifies,
    reasons,
    score,
    maxScore
  }
}

/**
 * Filter programs based on user profile
 * @param {Array} programs - Array of funding programs
 * @param {Object} userProfile - User profile from user_profiles table
 * @returns {Array} - Filtered and scored programs
 */
export function filterQualifiedPrograms(programs, userProfile) {
  if (!userProfile || !programs || programs.length === 0) {
    return []
  }

  return programs
    .map(program => {
      const qualification = checkProgramQualification(program, userProfile)
      return {
        ...program,
        qualification,
        matchScore: qualification.score
      }
    })
    .filter(program => program.qualification.qualifies)
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
}

/**
 * Get all programs with qualification scores (not filtered)
 * @param {Array} programs - Array of funding programs
 * @param {Object} userProfile - User profile from user_profiles table
 * @returns {Array} - Programs with qualification scores
 */
export function scoreAllPrograms(programs, userProfile) {
  if (!userProfile || !programs || programs.length === 0) {
    return programs.map(p => ({ ...p, qualification: { qualifies: false, score: 0 }, matchScore: 0 }))
  }

  return programs.map(program => {
    const qualification = checkProgramQualification(program, userProfile)
    return {
      ...program,
      qualification,
      matchScore: qualification.score
    }
  })
}


