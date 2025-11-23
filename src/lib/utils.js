import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function slugifyFunding(name = '', source = '') {
  const base = `${name} ${source}`.toLowerCase()
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'program'
}

/**
 * Normalize phone number to consistent format
 * Supports South African format: +27 or 0 prefix
 * @param {string} phone - Phone number in various formats
 * @returns {string} Normalized phone number (e.g., +27123456789)
 */
export function normalizePhone(phone) {
  if (!phone) return ''
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle South African numbers
  // If starts with 0, replace with +27
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1)
  }
  // If starts with 27 but no +, add +
  else if (cleaned.startsWith('27') && !cleaned.startsWith('+27')) {
    cleaned = '+' + cleaned
  }
  // If doesn't start with +, assume it's missing country code
  else if (!cleaned.startsWith('+')) {
    // If it's 9 digits (local SA number), add +27
    if (cleaned.length === 9) {
      cleaned = '+27' + cleaned
    } else {
      // Otherwise, add + prefix
      cleaned = '+' + cleaned
    }
  }
  
  return cleaned
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone number is valid
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false
  
  const normalized = normalizePhone(phone)
  
  // Check if normalized phone has +27 prefix (South African)
  if (normalized.startsWith('+27')) {
    // Should be +27 followed by 9 digits (total 12 characters)
    return /^\+27\d{9}$/.test(normalized)
  }
  
  // For other international formats, basic validation
  // Should start with + and have at least 10 digits total
  return /^\+\d{10,15}$/.test(normalized)
}

/**
 * Format phone number for display
 * @param {string} phone - Normalized phone number
 * @returns {string} Formatted phone number (e.g., +27 12 345 6789)
 */
export function formatPhone(phone) {
  if (!phone) return ''
  
  const normalized = normalizePhone(phone)
  
  // Format South African numbers: +27 12 345 6789
  if (normalized.startsWith('+27')) {
    const digits = normalized.substring(3)
    if (digits.length === 9) {
      return `+27 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`
    }
  }
  
  // For other formats, return as is or basic formatting
  return normalized
}

/**
 * Check if a string is an email address
 * @param {string} str - String to check
 * @returns {boolean} True if string is an email
 */
export function isEmail(str) {
  if (!str || typeof str !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim())
}

/**
 * Check if a string is a phone number
 * @param {string} str - String to check
 * @returns {boolean} True if string is a phone number
 */
export function isPhone(str) {
  if (!str || typeof str !== 'string') return false
  return validatePhone(str)
}


