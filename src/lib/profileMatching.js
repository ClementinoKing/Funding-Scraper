/**
 * Profile-based funding qualification matching
 * Determines if a funding program matches a user's profile
 */

/**
 * Calculate age from South African ID number
 * SA ID format: YYMMDDGSSSCAZ
 * YYMMDD = date of birth (YY is year, MM is month, DD is day)
 * @param {string} idNumber - South African ID number
 * @returns {number|null} Age in years or null if invalid
 */
function calculateAgeFromIdNumber(idNumber) {
  if (!idNumber || idNumber.length < 6) {
    return null
  }
  
  try {
    // Extract YYMMDD from ID number (first 6 digits)
    const year = parseInt(idNumber.substring(0, 2), 10)
    const month = parseInt(idNumber.substring(2, 4), 10) - 1 // Month is 0-indexed
    const day = parseInt(idNumber.substring(4, 6), 10)
    
    // Determine century (00-20 = 2000s, 21-99 = 1900s)
    const fullYear = year <= 20 ? 2000 + year : 1900 + year
    
    const birthDate = new Date(fullYear, month, day)
    const today = new Date()
    
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age >= 0 ? age : null
  } catch {
    return null
  }
}

/**
 * Check if user age matches program age requirement
 * @param {number} userAge - User's age in years
 * @param {string} programAge - Program age requirement (e.g., "18-35", "under 30", "over 50")
 * @returns {Object} - { matches: boolean, reason: string }
 */
function checkAgeMatch(userAge, programAge) {
  if (!programAge || !userAge) {
    return { matches: false, reason: '' }
  }
  
  const ageText = programAge.toLowerCase()
  
  // Check for "all" or "any" age
  if (ageText.includes('all') || ageText.includes('any') || ageText.includes('no restriction')) {
    return { matches: true, reason: 'No age restriction' }
  }
  
  // Check for range format: "18-35", "18 to 35", "between 18 and 35"
  const rangeMatch = ageText.match(/(\d+)\s*[-–—toand]+\s*(\d+)/)
  if (rangeMatch) {
    const minAge = parseInt(rangeMatch[1], 10)
    const maxAge = parseInt(rangeMatch[2], 10)
    if (userAge >= minAge && userAge <= maxAge) {
      return { matches: true, reason: `Age ${minAge}-${maxAge}` }
    }
    return { matches: false, reason: `Requires age ${minAge}-${maxAge}` }
  }
  
  // Check for "under X" or "below X"
  const underMatch = ageText.match(/(?:under|below|less than|younger than)\s*(\d+)/)
  if (underMatch) {
    const maxAge = parseInt(underMatch[1], 10)
    if (userAge < maxAge) {
      return { matches: true, reason: `Under ${maxAge}` }
    }
    return { matches: false, reason: `Requires under ${maxAge}` }
  }
  
  // Check for "over X" or "above X"
  const overMatch = ageText.match(/(?:over|above|more than|older than)\s*(\d+)/)
  if (overMatch) {
    const minAge = parseInt(overMatch[1], 10)
    if (userAge > minAge) {
      return { matches: true, reason: `Over ${minAge}` }
    }
    return { matches: false, reason: `Requires over ${minAge}` }
  }
  
  // Check for exact age mentions
  const exactMatch = ageText.match(/\b(\d+)\s*(?:years?|yrs?)\b/)
  if (exactMatch) {
    const targetAge = parseInt(exactMatch[1], 10)
    // Allow some flexibility (±2 years)
    if (Math.abs(userAge - targetAge) <= 2) {
      return { matches: true, reason: `Around ${targetAge} years` }
    }
  }
  
  // If we can't parse it, assume it doesn't match strictly but don't penalize heavily
  return { matches: false, reason: 'Age requirement unclear' }
}

/**
 * Check if a funding program qualifies for a user based on their profile
 * @param {Object} program - The funding program to check
 * @param {Object} userProfile - The user's profile from user_profiles table
 * @returns {Object} - { qualifies: boolean, reasons: string[], score: number }
 */
export function checkProgramQualification(program, userProfile) {
  if (!userProfile || !program) {
    return { 
      qualifies: false, 
      reasons: ['Missing profile or program data'], 
      score: 0,
      maxScore: 115,
      breakdown: []
    }
  }

  const reasons = []
  const breakdown = []
  let score = 0
  const maxScore = 115 // Updated to include age (5), gender (5), and ethnicity (5) matching

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
        breakdown.push({ criterion: 'Sector Matching', points: 30, maxPoints: 30, matched: true })
      } else {
        reasons.push(`✗ No sector match (you: ${userSectors.join(', ')}, program: ${programSectors.join(', ')})`)
        breakdown.push({ criterion: 'Sector Matching', points: 0, maxPoints: 30, matched: false })
      }
    } else {
      // Program doesn't specify sectors - give partial credit
      score += 15
      reasons.push('? Program sectors not specified')
      breakdown.push({ criterion: 'Sector Matching', points: 15, maxPoints: 30, matched: true, partial: true })
    }
  } else {
    breakdown.push({ criterion: 'Sector Matching', points: 0, maxPoints: 30, matched: false, skipped: true })
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
      breakdown.push({ criterion: 'Funding Type Matching', points: 25, maxPoints: 25, matched: true })
    } else {
      reasons.push(`✗ No funding type match (you want: ${userProfile.funding_types.join(', ')})`)
      breakdown.push({ criterion: 'Funding Type Matching', points: 0, maxPoints: 25, matched: false })
    }
  } else {
    breakdown.push({ criterion: 'Funding Type Matching', points: 0, maxPoints: 25, matched: false, skipped: true })
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
      breakdown.push({ criterion: 'Business Type Matching', points: 15, maxPoints: 15, matched: true })
    } else {
      // Check if eligibility mentions "all business types" or similar
      if (eligibility.includes('all') || eligibility.includes('any') || eligibility.includes('eligible')) {
        score += 10
        reasons.push('? Business type not specified in eligibility')
        breakdown.push({ criterion: 'Business Type Matching', points: 10, maxPoints: 15, matched: true, partial: true })
      } else {
        breakdown.push({ criterion: 'Business Type Matching', points: 0, maxPoints: 15, matched: false })
      }
    }
  } else {
    breakdown.push({ criterion: 'Business Type Matching', points: 0, maxPoints: 15, matched: false, skipped: true })
  }

  // 4. Industry Matching (15 points)
  if (userProfile.industry && program.eligibility) {
    const eligibility = program.eligibility.toLowerCase()
    const industry = userProfile.industry.toLowerCase()
    
    if (eligibility.includes(industry) || industry.includes(eligibility.split(' ')[0])) {
      score += 15
      reasons.push(`✓ Matches industry: ${userProfile.industry}`)
      breakdown.push({ criterion: 'Industry Matching', points: 15, maxPoints: 15, matched: true })
    } else {
      breakdown.push({ criterion: 'Industry Matching', points: 0, maxPoints: 15, matched: false })
    }
  } else {
    breakdown.push({ criterion: 'Industry Matching', points: 0, maxPoints: 15, matched: false, skipped: true })
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
      breakdown.push({ criterion: 'Funding Amount Matching', points: 10, maxPoints: 10, matched: true })
    } else {
      breakdown.push({ criterion: 'Funding Amount Matching', points: 0, maxPoints: 10, matched: false })
    }
  } else {
    breakdown.push({ criterion: 'Funding Amount Matching', points: 0, maxPoints: 10, matched: false, skipped: true })
  }

  // 6. BEE Level Matching (5 points) - if program mentions BEE
  if (userProfile.bee_level && program.eligibility) {
    const eligibility = program.eligibility.toLowerCase()
    if (eligibility.includes('bee') || eligibility.includes('black economic empowerment')) {
      if (userProfile.bee_level !== 'not-certified') {
        score += 5
        reasons.push(`✓ BEE level may be relevant`)
        breakdown.push({ criterion: 'BEE Level Matching', points: 5, maxPoints: 5, matched: true })
      } else {
        breakdown.push({ criterion: 'BEE Level Matching', points: 0, maxPoints: 5, matched: false })
      }
    } else {
      breakdown.push({ criterion: 'BEE Level Matching', points: 0, maxPoints: 5, matched: false, skipped: true })
    }
  } else {
    breakdown.push({ criterion: 'BEE Level Matching', points: 0, maxPoints: 5, matched: false, skipped: true })
  }

  // 7. Age Matching (5 points)
  if (program.age && userProfile.id_number) {
    const userAge = calculateAgeFromIdNumber(userProfile.id_number)
    if (userAge !== null) {
      const programAge = program.age.toLowerCase()
      const ageMatch = checkAgeMatch(userAge, programAge)
      if (ageMatch.matches) {
        score += 5
        reasons.push(`✓ Age requirement met: ${ageMatch.reason}`)
        breakdown.push({ criterion: 'Age Matching', points: 5, maxPoints: 5, matched: true })
      } else {
        reasons.push(`✗ Age requirement not met (you: ${userAge}, program: ${programAge})`)
        breakdown.push({ criterion: 'Age Matching', points: 0, maxPoints: 5, matched: false })
      }
    } else {
      breakdown.push({ criterion: 'Age Matching', points: 0, maxPoints: 5, matched: false, skipped: true })
    }
  } else {
    breakdown.push({ criterion: 'Age Matching', points: 0, maxPoints: 5, matched: false, skipped: true })
  }

  // 8. Gender Matching (5 points)
  if (program.gender && userProfile.gender) {
    const programGender = program.gender.toLowerCase().trim()
    const userGender = userProfile.gender.toLowerCase().trim()
    
    // Check for exact match or common variations
    if (programGender === userGender || 
        (programGender.includes('all') || programGender.includes('any') || programGender.includes('no restriction'))) {
      score += 5
      reasons.push(`✓ Gender requirement met`)
      breakdown.push({ criterion: 'Gender Matching', points: 5, maxPoints: 5, matched: true })
    } else {
      reasons.push(`✗ Gender requirement not met (you: ${userGender}, program: ${programGender})`)
      breakdown.push({ criterion: 'Gender Matching', points: 0, maxPoints: 5, matched: false })
    }
  } else {
    breakdown.push({ criterion: 'Gender Matching', points: 0, maxPoints: 5, matched: false, skipped: true })
  }

  // 9. Ethnicity Matching (5 points)
  if (program.ethnicity && userProfile.race) {
    const programEthnicity = program.ethnicity.toLowerCase().trim()
    const userRace = userProfile.race.toLowerCase().trim()
    
    // Check for exact match or if program accepts all ethnicities
    if (programEthnicity === userRace || 
        programEthnicity.includes('all') || 
        programEthnicity.includes('any') || 
        programEthnicity.includes('no restriction') ||
        programEthnicity.includes('black') && (userRace.includes('black') || userRace.includes('african'))) {
      score += 5
      reasons.push(`✓ Ethnicity requirement met`)
      breakdown.push({ criterion: 'Ethnicity Matching', points: 5, maxPoints: 5, matched: true })
    } else {
      reasons.push(`✗ Ethnicity requirement not met (you: ${userRace}, program: ${programEthnicity})`)
      breakdown.push({ criterion: 'Ethnicity Matching', points: 0, maxPoints: 5, matched: false })
    }
  } else {
    breakdown.push({ criterion: 'Ethnicity Matching', points: 0, maxPoints: 5, matched: false, skipped: true })
  }

  // Determine if program qualifies (threshold: 40 points)
  const qualifies = score >= 40

  return {
    qualifies,
    reasons,
    score,
    maxScore,
    breakdown
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


