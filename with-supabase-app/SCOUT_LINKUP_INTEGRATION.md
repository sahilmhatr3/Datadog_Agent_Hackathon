# Scout Chat Interface with Linkup Integration

## Overview

The Scout chat interface now integrates with Linkup to provide real-time place recommendations based on natural language queries. The system processes user input, extracts structured parameters, queries Linkup for recommendations, and displays them in an interactive chat format.

## How It Works

### 1. User Query Processing

When a user types a query like "low budget" or "find me a vegan cafe in Brooklyn", the system:

1. **Extracts Structured Parameters** from the query:
   - Venue type (restaurant, cafe, bar, etc.)
   - Dietary restrictions (vegan, vegetarian, gluten-free, etc.)
   - Price range ($, $$, $$$, $$$$)
   - Vibe/atmosphere (romantic, casual, family-friendly, etc.)
   - Location information
   - Other preferences

2. **Enhances the Query** for better Linkup results by combining extracted parameters into a more specific search query

### 2. Linkup API Integration

The `/api/scout-process` endpoint:
- Sends the enhanced query to Linkup's search API
- Uses `depth: 'deep'` for comprehensive results
- Parses Linkup's response to extract venue recommendations
- Calculates match scores based on how well each venue matches the user's preferences

### 3. Recommendation Display

The chat interface displays recommendations as:
- **Text Summary**: Quick overview in the chat message
- **Interactive Cards**: Detailed information for each recommendation including:
  - Venue name and category
  - Price range and match score
  - Description
  - Address (when available)
  - Tags (dietary options, features)
  - External link (when available)

### 4. Data Persistence

For authenticated users with active sessions:
- Search runs are saved to track query history
- Recommendations are stored for future reference
- This enables features like:
  - Viewing search history
  - Building itineraries from past recommendations
  - Collaborative planning with saved preferences

## Example Interactions

### Example 1: Budget-Conscious Search
```
User: "low budget"
Assistant: Based on your preferences, here are my recommendations:

1. **Joe's Pizza** - restaurant
   Classic New York pizza joint with affordable slices...
   Price: $ | Score: 85/100

2. **Mamoun's Falafel** - restaurant  
   Budget-friendly Middle Eastern spot...
   Price: $ | Score: 82/100
```

### Example 2: Specific Dietary Needs
```
User: "vegan restaurants in Brooklyn with outdoor seating"
Assistant: I found some great options based on: "vegan restaurants in Brooklyn with outdoor seating".

Here are my top recommendations:
[Interactive cards with vegan restaurants featuring outdoor seating]
```

## API Endpoints

### POST /api/scout-process
Processes natural language queries and returns recommendations.

**Request Body:**
```json
{
  "query": "user's natural language query",
  "sessionId": "optional session ID for saving results"
}
```

**Response:**
```json
{
  "query": "original query",
  "searchParams": {
    "category": "restaurant",
    "dietary_restrictions": ["vegan"],
    "price_range": "$",
    // ... other extracted parameters
  },
  "recommendations": [
    {
      "id": "unique-id",
      "name": "Venue Name",
      "category": "restaurant",
      "description": "Description...",
      "score": 85,
      "price": "$$",
      "address": "123 Main St",
      "tags": ["vegan", "organic"],
      "url": "https://..."
    }
  ]
}
```

## Configuration

Ensure the following environment variable is set:
```
LINKUP_API_KEY=your-linkup-api-key
```

## Future Enhancements

1. **Location-Based Filtering**: Use actual GPS coordinates to filter results by distance
2. **Multi-Stop Route Planning**: Build complete itineraries with multiple venues
3. **Real-Time Availability**: Check opening hours and current wait times
4. **User Preferences Learning**: Personalize recommendations based on saved preferences
5. **Review Integration**: Show ratings and reviews from multiple sources
