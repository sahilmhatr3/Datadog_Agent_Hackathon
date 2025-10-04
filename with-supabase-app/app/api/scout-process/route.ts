import { NextResponse } from 'next/server';
import { LinkupClient } from 'linkup-sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

// Initialize Linkup client
let linkupClient: LinkupClient | null = null;
try {
  if (process.env.LINKUP_API_KEY) {
    linkupClient = new LinkupClient({
      apiKey: process.env.LINKUP_API_KEY,
    });
  }
} catch (error) {
  console.error('Failed to initialize Linkup client:', error);
}

// Helper function to extract structured parameters from the query
function extractSearchParameters(query: string) {
  const params: any = {
    category: null,
    event_type: null,
    amenities: [],
    dietary_restrictions: [],
    price_range: null,
    location_context: null,
    destination: null,
    origin: null,
    time_preference: null,
    specific_time: null,
    day_preference: null,
    party_size: null,
    vibe: null,
    accessibility_needs: []
  };

  const queryLower = query.toLowerCase();

  // Extract venue category/type
  const venueTypeMapping: Record<string, string> = {
    'cafe': 'cafe',
    'coffee': 'cafe',
    'restaurant': 'restaurant',
    'dining': 'restaurant',
    'bar': 'bar',
    'pub': 'bar',
    'club': 'club',
    'museum': 'museum',
    'gallery': 'museum',
    'park': 'outdoors',
    'hiking': 'outdoors',
    'tour': 'tour',
    'shopping': 'shopping',
    'mall': 'shopping',
    'spa': 'spa',
    'wellness': 'spa',
    'hotel': 'accommodation',
    'motel': 'accommodation',
    'gas station': 'service',
    'rest stop': 'service',
    'bathroom': 'service'
  };

  for (const [keyword, venueType] of Object.entries(venueTypeMapping)) {
    if (queryLower.includes(keyword)) {
      params.category = venueType;
      break;
    }
  }

  // Extract dietary restrictions
  const dietaryKeywords: Record<string, string[]> = {
    'vegan': ['vegan', 'plant-based'],
    'vegetarian': ['vegetarian', 'veggie'],
    'gluten-free': ['gluten-free', 'gluten free', 'celiac'],
    'keto': ['keto', 'ketogenic'],
    'halal': ['halal'],
    'kosher': ['kosher'],
    'dairy-free': ['dairy-free', 'dairy free', 'lactose-free']
  };

  for (const [restriction, keywords] of Object.entries(dietaryKeywords)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      params.dietary_restrictions.push(restriction);
    }
  }

  // Extract price range
  if (queryLower.includes('cheap') || queryLower.includes('budget') || queryLower.includes('low cost')) {
    params.price_range = '$';
  } else if (queryLower.includes('moderate') || queryLower.includes('mid-range')) {
    params.price_range = '$$';
  } else if (queryLower.includes('expensive') || queryLower.includes('upscale') || queryLower.includes('fine dining')) {
    params.price_range = '$$$';
  } else if (queryLower.includes('luxury') || queryLower.includes('premium')) {
    params.price_range = '$$$$';
  }

  // Extract vibe
  const vibePatterns: Record<string, string[]> = {
    'romantic': ['romantic', 'date', 'intimate', 'cozy'],
    'casual': ['casual', 'relaxed', 'informal', 'laid-back'],
    'business': ['business', 'professional', 'formal'],
    'family': ['family', 'kid friendly', 'children'],
    'nightlife': ['nightlife', 'party', 'club', 'dancing'],
    'chill': ['chill', 'quiet', 'peaceful'],
    'adventurous': ['adventurous', 'exciting', 'unique'],
    'foodie': ['foodie', 'culinary', 'gourmet']
  };

  for (const [vibe, patterns] of Object.entries(vibePatterns)) {
    if (patterns.some(pattern => queryLower.includes(pattern))) {
      params.vibe = vibe;
      break;
    }
  }

  // Extract location from query
  const locationMatch = query.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (locationMatch) {
    params.destination = locationMatch[1];
  }

  return params;
}

export async function POST(req: Request) {
  console.log('Scout process API called');
  try {
    const body = await req.json();
    console.log('Request body:', body);
    const { query, sessionId } = body;

    if (!query) {
      console.error('No query provided');
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check if Linkup client is initialized
    if (!linkupClient) {
      console.error('Linkup client not initialized - API key may be missing');
      // Use mock recommendations instead
      const mockRecommendations = getMockRecommendations(extractSearchParameters(query));
      return NextResponse.json({ 
        query,
        searchParams: extractSearchParameters(query),
        recommendations: mockRecommendations,
        linkupResponse: null
      }, { status: 200 });
    }

    // Extract structured parameters from the query
    const searchParams = extractSearchParameters(query);

    // Build a more specific query for Linkup based on extracted parameters
    let enhancedQuery = query;
    if (searchParams.destination) {
      enhancedQuery = `${searchParams.category || 'places'} in ${searchParams.destination}`;
    }
    if (searchParams.dietary_restrictions.length > 0) {
      enhancedQuery += ` with ${searchParams.dietary_restrictions.join(' and ')} options`;
    }
    if (searchParams.price_range) {
      enhancedQuery += ` price range ${searchParams.price_range}`;
    }
    if (searchParams.vibe) {
      enhancedQuery += ` ${searchParams.vibe} atmosphere`;
    }

    let linkupResult;
    let recommendations = [];

    try {
      // Search using Linkup
      linkupResult = await linkupClient.search({
        query: enhancedQuery,
        depth: 'deep',
        outputType: 'sourcedAnswer',
      });

      // Parse recommendations from Linkup response
      recommendations = parseRecommendationsFromLinkup(linkupResult, searchParams);
    } catch (linkupError) {
      console.error('Linkup API error:', linkupError);
      // Use mock recommendations as fallback
      recommendations = getMockRecommendations(searchParams);
    }

    // Get current user (if authenticated)
    const cookieStore = await cookies();
    
    // Check if Supabase env vars are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are not set');
      // Continue without saving to database
      return NextResponse.json({
        query,
        searchParams,
        recommendations,
        linkupResponse: linkupResult,
        warning: 'Supabase not configured - results not saved'
      });
    }
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // If user is authenticated and sessionId is provided, save the search run
    if (user && sessionId) {
      // Create a search run
      const { data: searchRun, error: searchRunError } = await supabase
        .from('search_runs')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          inputs: {
            query,
            extracted_params: searchParams,
            enhanced_query: enhancedQuery
          },
          results_count: recommendations.length
        })
        .select('id')
        .single();

      if (searchRun && !searchRunError) {
        // Save recommendations
        const recommendationRows = recommendations.map((rec, index) => ({
          search_run_id: searchRun.id,
          session_id: sessionId,
          user_id: user.id,
          place_id: rec.id,
          match_score: rec.score,
          reasons: rec.reasons
        }));

        await supabase.from('recommendations').insert(recommendationRows);
      }
    }

    return NextResponse.json({
      query,
      searchParams,
      recommendations,
      linkupResponse: linkupResult
    });
  } catch (error) {
    console.error('Scout process error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to process Scout request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to parse recommendations from Linkup response
function parseRecommendationsFromLinkup(linkupResult: any, searchParams: any): any[] {
  const recommendations = [];
  
  // Extract places from Linkup's sourcedAnswer
  if (linkupResult.answer) {
    // Parse the answer text for venue mentions
    const lines = linkupResult.answer.split('\n');
    let currentRec: any = null;
    let recIndex = 0;

    for (const line of lines) {
      // Look for restaurant entries with dash prefix
      const restaurantMatch = line.match(/^-\s+([^:]+)(?::(.+))?/);
      if (restaurantMatch) {
        if (currentRec && currentRec.name) {
          recommendations.push(currentRec);
        }
        currentRec = {
          id: `linkup-${Date.now()}-${recIndex++}`,
          name: restaurantMatch[1].trim(),
          category: searchParams.category || 'restaurant',
          description: restaurantMatch[2] ? restaurantMatch[2].trim() : '',
          score: 80,
          reasons: {
            extracted_params: searchParams,
            source: 'linkup'
          },
          address: '',
          price: searchParams.price_range || '$$',
          tags: [],
          amenities: []
        };
      }
      
      // Also check for numbered items
      if (line.match(/^\d+\./)) {
        if (currentRec && currentRec.name) {
          recommendations.push(currentRec);
        }
        const nameMatch = line.match(/^\d+\.\s+([^:]+)(?::(.+))?/);
        if (nameMatch) {
          currentRec = {
            id: `linkup-${Date.now()}-${recIndex++}`,
            name: nameMatch[1].trim(),
            category: searchParams.category || 'restaurant',
            description: nameMatch[2] ? nameMatch[2].trim() : '',
            score: 80,
            reasons: {
              extracted_params: searchParams,
              source: 'linkup'
            },
            address: '',
            price: searchParams.price_range || '$$',
            tags: [],
            amenities: []
          };
        }
      }

      // Extract address
      const addressMatch = line.match(/(?:located at|address:|at)\s+(.+?)(?:\.|,|$)/i);
      if (addressMatch && currentRec) {
        currentRec.address = addressMatch[1].trim();
      }

      // Extract price info
      const priceMatch = line.match(/\$+|price[:\s]+(\$+)/i);
      if (priceMatch && currentRec) {
        currentRec.price = priceMatch[0] || priceMatch[1];
      }

      // Build description
      if (currentRec && line.trim() && !line.match(/^\d+\.|^[-•*]/)) {
        currentRec.description += line.trim() + ' ';
      }

      // Extract tags from description
      if (currentRec && searchParams.dietary_restrictions.length > 0) {
        for (const diet of searchParams.dietary_restrictions) {
          if (line.toLowerCase().includes(diet)) {
            currentRec.tags.push(diet);
          }
        }
      }

      // Calculate score based on how well it matches search params
      if (currentRec) {
        let score = 70; // Base score
        if (currentRec.tags.length > 0) score += 10;
        if (currentRec.price === searchParams.price_range) score += 10;
        if (line.toLowerCase().includes(searchParams.vibe)) score += 10;
        currentRec.score = Math.min(score, 100);
      }
    }

    // Don't forget the last recommendation
    if (currentRec) {
      recommendations.push(currentRec);
    }
  }

  // Also check sources for additional structured data
  if (linkupResult.sources && Array.isArray(linkupResult.sources)) {
    for (const source of linkupResult.sources) {
      if (source.title && !recommendations.find(r => r.name === source.title)) {
        recommendations.push({
          id: `linkup-source-${Date.now()}-${recommendations.length}`,
          name: source.title,
          category: searchParams.category || 'restaurant',
          description: source.snippet || '',
          score: 60,
          reasons: {
            extracted_params: searchParams,
            source: 'linkup',
            url: source.url
          },
          address: '',
          price: searchParams.price_range || '$$',
          tags: [],
          amenities: [],
          url: source.url
        });
      }
    }
  }

  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, 10); // Return top 10
}

// Mock recommendations for when Linkup is unavailable
function getMockRecommendations(searchParams: any): any[] {
  console.log('getMockRecommendations called with params:', searchParams);
  const mockData = [
    {
      id: `mock-${Date.now()}-1`,
      name: "Le Bernardin",
      category: 'restaurant',
      description: "Exquisite French seafood restaurant with elegant ambiance. Three Michelin stars, perfect for special occasions and romantic dinners.",
      score: 95,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '155 West 51st St, New York, NY 10019',
      price: '$$$$',
      tags: ['romantic', 'fine-dining', 'french', 'seafood', 'michelin-starred'],
      amenities: ['reservations-required', 'dress-code', 'valet-parking'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-2`,
      name: "One if by Land, Two if by Sea",
      category: 'restaurant',
      description: "Historic carriage house turned intimate restaurant. Known as one of NYC's most romantic spots with candlelit tables and live piano.",
      score: 92,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '17 Barrow St, New York, NY 10014',
      price: '$$$$',
      tags: ['romantic', 'intimate', 'historic', 'american', 'date-night'],
      amenities: ['live-music', 'fireplace', 'private-dining'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-3`,
      name: "Gramercy Tavern",
      category: 'restaurant',
      description: "Warm, sophisticated dining room serving seasonal American cuisine. Rustic elegance perfect for romantic celebrations.",
      score: 90,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '42 E 20th St, New York, NY 10003',
      price: '$$$',
      tags: ['romantic', 'american', 'seasonal', 'upscale', 'cozy'],
      amenities: ['bar-seating', 'private-rooms', 'sommelier'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-4`,
      name: "Joe's Pizza",
      category: 'restaurant',
      description: "Classic New York pizza joint serving authentic thin-crust slices. Known for their no-frills approach and consistently great pizza since 1975.",
      score: 85,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '7 Carmine St, New York, NY 10014',
      price: '$',
      tags: ['budget', 'casual', 'quick-bite'],
      amenities: ['takeout', 'delivery'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-5`,
      name: "Mamoun's Falafel",
      category: 'restaurant',
      description: "Legendary Middle Eastern spot serving falafel, shawarma, and other Mediterranean favorites. Affordable prices and generous portions.",
      score: 82,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '119 MacDougal St, New York, NY 10012',
      price: '$',
      tags: ['budget', 'vegetarian', 'vegan-options', 'romantic', 'intimate'],
      amenities: ['outdoor-seating', 'late-night'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-6`,
      name: "Xi'an Famous Foods",
      category: 'restaurant',
      description: "Hand-pulled noodles and authentic Chinese street food from Xi'an region. Famous for their spicy cumin lamb noodles and burgers.",
      score: 80,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '81 St Marks Pl, New York, NY 10003',
      price: '$',
      tags: ['budget', 'authentic', 'spicy'],
      amenities: ['quick-service', 'casual'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-7`,
      name: "The Halal Guys",
      category: 'restaurant',
      description: "Famous food cart turned restaurant serving Middle Eastern platters with chicken, lamb, and their legendary white sauce.",
      score: 78,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '307 E 14th St, New York, NY 10003',
      price: '$',
      tags: ['budget', 'halal', 'quick-bite'],
      amenities: ['late-night', 'takeout'],
      url: 'https://example.com'
    },
    {
      id: `mock-${Date.now()}-8`,
      name: "Vanessa's Dumpling House",
      category: 'restaurant',
      description: "No-frills Chinese eatery specializing in dumplings, sesame pancakes, and noodle soups at unbeatable prices.",
      score: 77,
      reasons: {
        extracted_params: searchParams,
        source: 'mock'
      },
      address: '118 Eldridge St, New York, NY 10002',
      price: '$',
      tags: ['budget', 'dumplings', 'authentic'],
      amenities: ['cash-only', 'quick-service'],
      url: 'https://example.com'
    }
  ];

  // Filter based on search parameters
  let filtered = [...mockData];
  
  console.log('Filtering with vibe:', searchParams.vibe);
  console.log('Available restaurants:', filtered.map(r => ({ name: r.name, tags: r.tags })));

  // Filter by price range
  if (searchParams.price_range) {
    filtered = filtered.filter(item => item.price === searchParams.price_range);
  }

  // Filter by dietary restrictions
  if (searchParams.dietary_restrictions.length > 0) {
    filtered = filtered.filter(item => 
      searchParams.dietary_restrictions.some((diet: string) => 
        item.tags.includes(diet) || item.tags.includes(`${diet}-options`)
      )
    );
  }

  // If vibe is specified, prioritize restaurants with that vibe
  if (searchParams.vibe) {
    const vibeMatches = filtered.filter(item => item.tags.includes(searchParams.vibe));
    const nonVibeMatches = filtered.filter(item => !item.tags.includes(searchParams.vibe));
    
    // If we have vibe matches, use those first
    if (vibeMatches.length > 0) {
      filtered = [...vibeMatches, ...nonVibeMatches];
    }
  }

  // Adjust scores based on matches
  filtered.forEach(item => {
    if (searchParams.vibe && item.tags.includes(searchParams.vibe)) {
      item.score += 15; // Increased weight for vibe match
    }
    if (searchParams.category && item.category === searchParams.category) {
      item.score += 3;
    }
  });

  // Sort by score
  filtered.sort((a, b) => b.score - a.score);

  console.log('Filtered results:', filtered.slice(0, 5).map(r => ({ name: r.name, score: r.score })));
  return filtered.slice(0, 5);
}
