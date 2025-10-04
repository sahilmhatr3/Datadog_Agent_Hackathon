# Scout Prompt Processor - Integration Guide

## Overview

The Scout Prompt Processor uses the OpenHands SDK to extract structured search parameters from natural language prompts for the Scout navigation application. This guide shows how to integrate it into your Next.js/Supabase application.

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up OpenHands API key (optional):**
   ```bash
   export OPENHANDS_API_KEY="your-api-key-here"
   ```

## Basic Usage

### Simple Function Call

```python
from scout_prompt_processor import extract_search_parameters

# Extract parameters from user prompt
user_prompt = "Find a vegan cafe open after 7pm on my route to Brooklyn"
params = extract_search_parameters(user_prompt)

print(params)
# Output:
# {
#     'category': 'cafe',
#     'dietary_restrictions': ['vegan'],
#     'specific_time': '19:00',
#     'location_context': 'on route',
#     'destination': 'Brooklyn',
#     'amenities': [],
#     'price_range': None,
#     'origin': None,
#     'route_preference': None,
#     'time_preference': 'evening',
#     'day_preference': None,
#     'party_size': None,
#     'vibe': None,
#     'accessibility_needs': []
# }
```

### Advanced Usage with Class

```python
from scout_prompt_processor import ScoutPromptProcessor, SearchParameters

# Initialize processor with API key
processor = ScoutPromptProcessor(api_key="your-openhands-api-key")

# Process multiple prompts
prompts = [
    "I need a rest stop with clean bathrooms halfway to Philadelphia",
    "Looking for a romantic restaurant for dinner tonight",
    "Coffee shop with wifi and parking near Central Park"
]

for prompt in prompts:
    params = processor.extract_search_parameters(prompt)
    print(f"Prompt: {prompt}")
    print(f"Category: {params.category}")
    print(f"Amenities: {params.amenities}")
    print("-" * 40)
```

## Integration with Next.js/Supabase

### 1. Create API Route Handler

Create `app/api/process-prompt/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call Python script to process prompt
    const pythonProcess = spawn('python3', [
      'scout_prompt_processor.py',
      '--prompt', prompt
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          const params = JSON.parse(result);
          resolve(NextResponse.json({ success: true, params }));
        } else {
          resolve(NextResponse.json(
            { error: 'Failed to process prompt', details: error },
            { status: 500 }
          ));
        }
      });
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Update Python Script for CLI Usage

Add to `scout_prompt_processor.py`:

```python
import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description='Process Scout navigation prompts')
    parser.add_argument('--prompt', required=True, help='User prompt to process')
    parser.add_argument('--api-key', help='OpenHands API key')
    
    args = parser.parse_args()
    
    processor = ScoutPromptProcessor(api_key=args.api_key)
    params = processor.extract_search_parameters(args.prompt)
    
    # Output as JSON for API consumption
    print(json.dumps(processor.to_dict(params)))

if __name__ == "__main__":
    main()
```

### 3. Frontend Integration

Update your Scout chat interface to use the API:

```typescript
// components/scout/chat-interface.tsx
const processUserPrompt = async (prompt: string) => {
  try {
    const response = await fetch('/api/process-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Use extracted parameters to create session requirements
      const sessionRequirements = {
        vibes: data.params.vibe ? [data.params.vibe] : [],
        event_types: data.params.category ? [data.params.category] : [],
        amenities: data.params.amenities,
        dietary_restrictions: data.params.dietary_restrictions,
        accessibility_needs: data.params.accessibility_needs,
        party_size: data.params.party_size,
        time_preference: data.params.time_preference,
        location_context: data.params.location_context,
        destination: data.params.destination
      };

      // Create session in Supabase
      await createScoutSession(sessionRequirements);
    }
  } catch (error) {
    console.error('Error processing prompt:', error);
  }
};
```

### 4. Supabase Integration

Create a function to store processed parameters:

```typescript
// lib/supabase/sessions.ts
import { getServerSupabase } from './client';

export async function createScoutSession(requirements: any) {
  const supabase = getServerSupabase();
  
  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert([{
      owner_id: (await supabase.auth.getUser()).data.user?.id,
      title: `Scout Session - ${requirements.destination || 'New Trip'}`,
      origin_city: requirements.origin,
      destination_city: requirements.destination,
      start_time: new Date().toISOString(),
    }])
    .select('id')
    .single();

  if (sessionError) throw sessionError;

  // Create session requirements
  const { error: reqError } = await supabase
    .from('session_requirements')
    .insert([{
      session_id: session.id,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      vibes: requirements.vibes,
      event_types: requirements.event_types,
      accessibility: {
        dietary_restrictions: requirements.dietary_restrictions,
        accessibility_needs: requirements.accessibility_needs
      },
      min_party_size: requirements.party_size,
      max_party_size: requirements.party_size,
      notes: `Processed from prompt: ${requirements.location_context}`
    }]);

  if (reqError) throw reqError;

  return session;
}
```

## Testing

### Run Test Cases

```bash
python scout_prompt_processor.py
```

### Unit Tests

Create `test_scout_processor.py`:

```python
import pytest
from scout_prompt_processor import ScoutPromptProcessor, extract_search_parameters

def test_vegan_cafe_prompt():
    prompt = "Find a vegan cafe open after 7pm on my route to Brooklyn"
    params = extract_search_parameters(prompt)
    
    assert params['category'] == 'cafe'
    assert 'vegan' in params['dietary_restrictions']
    assert params['specific_time'] == '19:00'
    assert params['destination'] == 'Brooklyn'

def test_rest_stop_prompt():
    prompt = "I need a rest stop with clean bathrooms halfway to Philadelphia"
    params = extract_search_parameters(prompt)
    
    assert params['category'] == 'service'
    assert 'clean bathrooms' in params['amenities']
    assert params['location_context'] == 'halfway'
    assert params['destination'] == 'Philadelphia'

if __name__ == "__main__":
    pytest.main([__file__])
```

## Error Handling

The processor includes robust error handling:

1. **OpenHands SDK unavailable**: Falls back to regex pattern matching
2. **Invalid JSON response**: Falls back to pattern matching
3. **Empty prompts**: Returns empty SearchParameters
4. **API errors**: Logs error and uses fallback method

## Performance Considerations

1. **Caching**: Cache processed parameters for similar prompts
2. **Async Processing**: Use async/await for non-blocking operations
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Fallback Strategy**: Always have regex patterns as backup

## Environment Variables

```bash
# .env.local
OPENHANDS_API_KEY=your-api-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Next Steps

1. **Integrate with Linkup API**: Use extracted parameters to query venues
2. **Add Route Planning**: Integrate with Google Maps/Mapbox for route-aware filtering
3. **Implement Learning**: Track user behavior to improve recommendations
4. **Add More Patterns**: Expand regex patterns for better coverage
5. **Performance Optimization**: Add caching and async processing
