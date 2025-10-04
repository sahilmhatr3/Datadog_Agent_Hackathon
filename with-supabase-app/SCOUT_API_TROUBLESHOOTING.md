# Scout API Troubleshooting Guide

## Fixed Issues

### 1. **500 Error Handling**
The API was throwing 500 errors when the Linkup API key was missing or the API call failed. I've added:
- Better error handling throughout the API endpoint
- Graceful fallback to mock data when Linkup is unavailable
- Proper initialization checks for the Linkup client

### 2. **Mock Data Fallback**
When Linkup API is unavailable, the system now:
- Returns mock restaurant recommendations
- Filters mock data based on extracted search parameters (budget, dietary restrictions, etc.)
- Provides a seamless experience even without the Linkup API

## Setup Requirements

### 1. **Environment Variables**
Create a `.env.local` file in the `with-supabase-app` directory with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Linkup API Configuration
LINKUP_API_KEY=your_linkup_api_key
```

### 2. **Getting a Linkup API Key**
1. Sign up at [Linkup API](https://www.linkup.so/)
2. Get your API key from the dashboard
3. Add it to your `.env.local` file

## Testing the Integration

### With Mock Data (No Linkup API Key)
1. Start the dev server: `npm run dev`
2. Navigate to the Scout chat interface
3. Try queries like:
   - "low budget" - Returns budget-friendly restaurants
   - "vegan restaurants" - Returns restaurants with vegan options
   - "romantic dinner" - Returns restaurants matching the vibe

### With Linkup API
1. Add your Linkup API key to `.env.local`
2. Restart the dev server
3. The system will use real Linkup search results
4. Recommendations will be based on actual search data

## How It Works

### Query Processing Flow
1. User enters a natural language query
2. System extracts structured parameters:
   - Venue type (restaurant, cafe, bar, etc.)
   - Price range ($, $$, $$$, $$$$)
   - Dietary restrictions (vegan, vegetarian, gluten-free, etc.)
   - Vibe/atmosphere (romantic, casual, family-friendly, etc.)
   - Location information

3. Enhanced query is sent to Linkup (if available)
4. Results are parsed and scored based on match quality
5. Recommendations are displayed as interactive cards

### Example Queries That Work Well
- "low budget restaurants"
- "vegan cafe with outdoor seating"
- "romantic dinner spot"
- "family-friendly restaurant in Brooklyn"
- "cheap eats near me"

## Debugging Tips

### Check Console Logs
The API logs helpful information:
- "Linkup client not initialized - API key may be missing"
- "Linkup API error: [error details]"
- Extracted search parameters

### Verify Environment Variables
Run this in your terminal:
```bash
echo $LINKUP_API_KEY
```

If it's empty, make sure:
1. The `.env.local` file exists
2. The variable is properly set
3. You've restarted the dev server after adding it

### Test the API Directly
You can test the API endpoint directly:
```bash
curl -X POST http://localhost:3000/api/scout-process \
  -H "Content-Type: application/json" \
  -d '{"query": "low budget restaurants"}'
```

This should return recommendations even without Linkup API key (using mock data).
