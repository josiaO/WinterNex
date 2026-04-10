import { NextRequest, NextResponse } from 'next/server'
import { TLD_PRICING, PREMIUM_DOMAINS } from '@/lib/domain-data'

// Simulated domain search - in production, this calls ResellerClub API
const takenDomains = new Set([
  'google.com', 'facebook.com', 'amazon.com', 'twitter.com', 'github.com',
  'microsoft.com', 'apple.com', 'netflix.com', 'youtube.com', 'linkedin.com',
  'safaricom.co.tz', 'nmb.co.tz', 'crdb.co.tz', 'tcba.co.tz',
  'safaritech.co.tz', 'kilimokahawa.co.tz', 'mwanzadigital.tz', 'darbiashara.com', 'afyabora.co.tz',
])

// Generate deterministic availability based on domain name
function isDomainAvailable(domain: string): boolean {
  const normalized = domain.toLowerCase().trim()
  if (takenDomains.has(normalized)) return false
  // Simple hash-based simulation for realistic feel
  const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return hash % 3 !== 0 // ~33% chance of being taken
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '')
    if (!cleanQuery) {
      return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 })
    }

    // Search across popular TLDs first, then others
    const searchTLDs = Object.keys(TLD_PRICING)
    const results = []

    for (const tld of searchTLDs) {
      const fullDomain = `${cleanQuery}${tld}`
      const available = isDomainAvailable(fullDomain)
      const pricing = TLD_PRICING[tld]
      const isPremium = PREMIUM_DOMAINS.some(p => p.domain === fullDomain)

      results.push({
        domain: fullDomain,
        name: cleanQuery,
        tld,
        available,
        price: pricing.register,
        renewPrice: pricing.renew,
        currency: 'TZS',
        premium: isPremium,
        premiumPrice: isPremium ? PREMIUM_DOMAINS.find(p => p.domain === fullDomain)?.price : null,
      })
    }

    // Also add suggestion-based results
    const suggestions = generateSuggestions(cleanQuery)
    for (const suggestion of suggestions) {
      const tld = '.' + suggestion.split('.').slice(1).join('.')
      if (TLD_PRICING[tld]) {
        const available = isDomainAvailable(suggestion)
        const pricing = TLD_PRICING[tld]
        if (!results.find(r => r.domain === suggestion)) {
          results.push({
            domain: suggestion,
            name: suggestion.split('.')[0],
            tld,
            available,
            price: pricing.register,
            renewPrice: pricing.renew,
            currency: 'TZS',
            premium: false,
          })
        }
      }
    }

    return NextResponse.json({ query: cleanQuery, results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

function generateSuggestions(query: string): string[] {
  const prefixes = ['get', 'my', 'go', 'try', 'the']
  const suffixes = ['app', 'hub', 'now', 'pro', 'plus', 'online', 'digital']
  const suggestions: string[] = []
  
  // Add prefix suggestions
  for (const prefix of prefixes.slice(0, 2)) {
    suggestions.push(`${prefix}${query}.co.tz`)
    suggestions.push(`${prefix}${query}.tz`)
  }
  
  // Add suffix suggestions
  for (const suffix of suffixes.slice(0, 2)) {
    suggestions.push(`${query}${suffix}.com`)
    suggestions.push(`${query}${suffix}.co.tz`)
  }

  return suggestions
}
