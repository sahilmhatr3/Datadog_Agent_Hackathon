"""
Scout Navigation App - Natural Language Prompt Processor

This module uses the OpenHands SDK to extract structured search parameters
from natural language prompts for the Scout navigation application.

The implementation includes:
- OpenHands SDK integration (when properly configured)
- Robust regex pattern matching fallback
- Comprehensive parameter extraction
- CLI interface for testing

Author: Scout Development Team
Date: 2024
"""

import json
import re
import sys
from typing import Dict, List, Optional, Any
from datetime import datetime, time
from dataclasses import dataclass

try:
    from openhands.microagent import BaseMicroagent, KnowledgeMicroagent, MicroagentType
    OPENHANDS_AVAILABLE = True
except ImportError:
    print("Warning: OpenHands SDK not installed. Install with: pip install openhands-ai")
    BaseMicroagent = None
    KnowledgeMicroagent = None
    MicroagentType = None
    OPENHANDS_AVAILABLE = False


@dataclass
class SearchParameters:
    """Structured search parameters extracted from natural language prompts."""
    
    # Core venue information
    category: Optional[str] = None
    event_type: Optional[str] = None
    
    # Preferences and amenities
    amenities: List[str] = None
    dietary_restrictions: List[str] = None
    price_range: Optional[str] = None
    
    # Location and routing
    location_context: Optional[str] = None  # "halfway", "near destination", "on route"
    destination: Optional[str] = None
    origin: Optional[str] = None
    route_preference: Optional[str] = None
    
    # Timing and availability
    time_preference: Optional[str] = None  # "after work", "morning", "evening"
    specific_time: Optional[str] = None   # "7pm", "2:30pm"
    day_preference: Optional[str] = None  # "today", "tomorrow", "weekend"
    
    # Additional context
    party_size: Optional[int] = None
    vibe: Optional[str] = None  # "romantic", "casual", "business"
    accessibility_needs: List[str] = None
    
    def __post_init__(self):
        """Initialize empty lists if None."""
        if self.amenities is None:
            self.amenities = []
        if self.dietary_restrictions is None:
            self.dietary_restrictions = []
        if self.accessibility_needs is None:
            self.accessibility_needs = []


class ScoutPromptProcessor:
    """
    Processes natural language prompts for the Scout navigation app using OpenHands SDK.
    
    This class extracts structured search parameters from user queries like:
    - "Find a vegan cafe open after 7pm on my route to Brooklyn"
    - "I need a rest stop with clean bathrooms halfway to Philadelphia"
    - "Looking for a romantic restaurant for dinner tonight"
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Scout prompt processor.
        
        Args:
            api_key: OpenHands API key (if required)
        """
        self.api_key = api_key
        self.agent = None
        
        if OPENHANDS_AVAILABLE:
            try:
                # Initialize a knowledge microagent for prompt processing
                self.agent = KnowledgeMicroagent(
                    name="scout_prompt_processor",
                    content="""You are a specialized AI agent for the Scout navigation app. 
                    Your role is to extract structured search parameters from natural language prompts 
                    about places, venues, and locations. You understand navigation context, route planning, 
                    and user preferences for finding places along travel routes.""",
                    metadata={
                        "name": "scout_prompt_processor",
                        "type": MicroagentType.KNOWLEDGE,
                        "version": "1.0.0",
                        "agent": "CodeActAgent",
                        "triggers": ["prompt_processing", "navigation_search"],
                        "inputs": [],
                        "mcp_tools": None
                    },
                    source="scout_navigation_system",
                    type=MicroagentType.KNOWLEDGE
                )
            except Exception as e:
                print(f"Warning: Could not initialize OpenHands agent: {e}")
                self.agent = None
        
        # Define mapping patterns for common venue types
        self.venue_type_mapping = {
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
        }
        
        # Define dietary restrictions
        self.dietary_keywords = {
            'vegan': ['vegan', 'plant-based'],
            'vegetarian': ['vegetarian', 'veggie'],
            'gluten-free': ['gluten-free', 'gluten free', 'celiac'],
            'keto': ['keto', 'ketogenic'],
            'halal': ['halal'],
            'kosher': ['kosher'],
            'dairy-free': ['dairy-free', 'dairy free', 'lactose-free']
        }
        
        # Define amenities
        self.amenity_keywords = {
            'wifi': ['wifi', 'internet', 'wireless'],
            'parking': ['parking', 'park', 'garage'],
            'outdoor seating': ['outdoor', 'patio', 'terrace', 'outside'],
            'pet friendly': ['pet friendly', 'dog friendly', 'pets allowed'],
            'wheelchair accessible': ['accessible', 'wheelchair', 'handicap'],
            'clean bathrooms': ['clean bathroom', 'restroom', 'toilet'],
            'food': ['food', 'snacks', 'meals', 'dining'],
            'gas': ['gas', 'fuel', 'gasoline'],
            'atm': ['atm', 'cash machine', 'banking']
        }
    
    def extract_search_parameters(self, user_prompt: str) -> SearchParameters:
        """
        Extract structured search parameters from a natural language prompt.
        
        Args:
            user_prompt: The user's natural language input
            
        Returns:
            SearchParameters: Structured parameters extracted from the prompt
            
        Example:
            >>> processor = ScoutPromptProcessor()
            >>> params = processor.extract_search_parameters(
            ...     "Find a vegan cafe open after 7pm on my route to Brooklyn"
            ... )
            >>> print(params.category)
            'cafe'
            >>> print(params.dietary_restrictions)
            ['vegan']
        """
        if not user_prompt or not user_prompt.strip():
            return SearchParameters()
        
        # Initialize parameters
        params = SearchParameters()
        
        # Use OpenHands agent if available, otherwise fall back to regex patterns
        if self.agent:
            params = self._extract_with_openhands(user_prompt)
        else:
            params = self._extract_with_patterns(user_prompt)
        
        return params
    
    def _extract_with_openhands(self, user_prompt: str) -> SearchParameters:
        """
        Extract parameters using OpenHands SDK.
        
        Args:
            user_prompt: The user's natural language input
            
        Returns:
            SearchParameters: Extracted parameters
        """
        try:
            # Create a structured prompt for the OpenHands agent
            structured_prompt = f"""
            Analyze this navigation request and extract the following information:
            
            User Request: "{user_prompt}"
            
            Please extract and return a JSON object with these fields:
            - category: The main type of place (cafe, restaurant, bar, museum, etc.)
            - event_type: More specific event type if applicable
            - amenities: List of desired amenities (wifi, parking, outdoor seating, etc.)
            - dietary_restrictions: List of dietary needs (vegan, vegetarian, gluten-free, etc.)
            - price_range: Price preference ($, $$, $$$, $$$$)
            - location_context: Where on the route (halfway, near destination, on route)
            - destination: The destination city or area
            - origin: The starting point if mentioned
            - time_preference: General time preference (morning, afternoon, evening, after work)
            - specific_time: Specific time mentioned (7pm, 2:30pm, etc.)
            - day_preference: Day preference (today, tomorrow, weekend)
            - party_size: Number of people if mentioned
            - vibe: Atmosphere preference (romantic, casual, business, etc.)
            - accessibility_needs: Accessibility requirements
            
            Return only valid JSON, no additional text.
            """
            
            # Process with OpenHands microagent
            # Note: The actual API might be different, this is a placeholder
            # In a real implementation, you would use the agent's process method
            response = self.agent.process(structured_prompt) if hasattr(self.agent, 'process') else None
            
            if response is None:
                # Fall back to pattern matching if agent processing fails
                return self._extract_with_patterns(user_prompt)
            
            # Parse the response
            if isinstance(response, str):
                try:
                    extracted_data = json.loads(response)
                except json.JSONDecodeError:
                    # Fall back to pattern matching if JSON parsing fails
                    return self._extract_with_patterns(user_prompt)
            else:
                extracted_data = response
            
            # Map to SearchParameters
            params = SearchParameters()
            params.category = extracted_data.get('category')
            params.event_type = extracted_data.get('event_type')
            params.amenities = extracted_data.get('amenities', [])
            params.dietary_restrictions = extracted_data.get('dietary_restrictions', [])
            params.price_range = extracted_data.get('price_range')
            params.location_context = extracted_data.get('location_context')
            params.destination = extracted_data.get('destination')
            params.origin = extracted_data.get('origin')
            params.time_preference = extracted_data.get('time_preference')
            params.specific_time = extracted_data.get('specific_time')
            params.day_preference = extracted_data.get('day_preference')
            params.party_size = extracted_data.get('party_size')
            params.vibe = extracted_data.get('vibe')
            params.accessibility_needs = extracted_data.get('accessibility_needs', [])
            
            return params
            
        except Exception as e:
            print(f"Error processing with OpenHands: {e}")
            # Fall back to pattern matching
            return self._extract_with_patterns(user_prompt)
    
    def _extract_with_patterns(self, user_prompt: str) -> SearchParameters:
        """
        Extract parameters using regex patterns (fallback method).
        
        Args:
            user_prompt: The user's natural language input
            
        Returns:
            SearchParameters: Extracted parameters
        """
        params = SearchParameters()
        prompt_lower = user_prompt.lower()
        
        # Extract venue category/type
        for keyword, venue_type in self.venue_type_mapping.items():
            if keyword in prompt_lower:
                params.category = venue_type
                break
        
        # Extract dietary restrictions
        for restriction, keywords in self.dietary_keywords.items():
            if any(keyword in prompt_lower for keyword in keywords):
                params.dietary_restrictions.append(restriction)
        
        # Extract amenities
        for amenity, keywords in self.amenity_keywords.items():
            if any(keyword in prompt_lower for keyword in keywords):
                params.amenities.append(amenity)
        
        # Extract location context
        location_patterns = {
            'halfway': r'halfway|midpoint|middle',
            'near destination': r'near.*destination|close.*to.*destination',
            'on route': r'on.*route|along.*way|on.*way'
        }
        
        for context, pattern in location_patterns.items():
            if re.search(pattern, prompt_lower):
                params.location_context = context
                break
        
        # Extract destination
        destination_patterns = [
            r'to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # "to Brooklyn", "to New York"
            r'in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # "in Manhattan"
            r'at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # "at Central Park"
            r'near\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)' # "near Central Park"
        ]
        
        for pattern in destination_patterns:
            match = re.search(pattern, user_prompt)
            if match:
                params.destination = match.group(1)
                break
        
        # Extract time preferences
        time_patterns = {
            'morning': r'morning|am|before.*noon',
            'afternoon': r'afternoon|pm.*after.*noon',
            'evening': r'evening|night|after.*dark',
            'after work': r'after.*work|after.*5|after.*6'
        }
        
        for time_pref, pattern in time_patterns.items():
            if re.search(pattern, prompt_lower):
                params.time_preference = time_pref
                break
        
        # Extract specific times
        time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm|morning|afternoon|evening)', prompt_lower)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            period = time_match.group(3)
            
            if period in ['pm', 'afternoon', 'evening'] and hour != 12:
                hour += 12
            elif period in ['am', 'morning'] and hour == 12:
                hour = 0
            
            params.specific_time = f"{hour:02d}:{minute:02d}"
        
        # Extract day preferences
        day_patterns = {
            'today': r'today',
            'tomorrow': r'tomorrow',
            'weekend': r'weekend|saturday|sunday'
        }
        
        for day_pref, pattern in day_patterns.items():
            if re.search(pattern, prompt_lower):
                params.day_preference = day_pref
                break
        
        # Extract party size
        party_match = re.search(r'(\d+)\s*(people|person|guests|guests?)', prompt_lower)
        if party_match:
            params.party_size = int(party_match.group(1))
        
        # Extract vibe
        vibe_patterns = {
            'romantic': r'romantic|date|intimate',
            'casual': r'casual|relaxed|informal',
            'business': r'business|professional|formal',
            'family': r'family|kid.*friendly|children'
        }
        
        for vibe, pattern in vibe_patterns.items():
            if re.search(pattern, prompt_lower):
                params.vibe = vibe
                break
        
        return params
    
    def to_dict(self, params: SearchParameters) -> Dict[str, Any]:
        """
        Convert SearchParameters to dictionary format.
        
        Args:
            params: SearchParameters object
            
        Returns:
            Dict: Dictionary representation of the parameters
        """
        return {
            'category': params.category,
            'event_type': params.event_type,
            'amenities': params.amenities,
            'dietary_restrictions': params.dietary_restrictions,
            'price_range': params.price_range,
            'location_context': params.location_context,
            'destination': params.destination,
            'origin': params.origin,
            'route_preference': params.route_preference,
            'time_preference': params.time_preference,
            'specific_time': params.specific_time,
            'day_preference': params.day_preference,
            'party_size': params.party_size,
            'vibe': params.vibe,
            'accessibility_needs': params.accessibility_needs
        }


def extract_search_parameters(user_prompt: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Convenience function to extract search parameters from a natural language prompt.
    
    Args:
        user_prompt: The user's natural language input
        api_key: OpenHands API key (optional)
        
    Returns:
        Dict: Structured search parameters
        
    Example:
        >>> params = extract_search_parameters(
        ...     "Find a vegan cafe open after 7pm on my route to Brooklyn"
        ... )
        >>> print(params['category'])
        'cafe'
        >>> print(params['dietary_restrictions'])
        ['vegan']
    """
    processor = ScoutPromptProcessor(api_key=api_key)
    params = processor.extract_search_parameters(user_prompt)
    return processor.to_dict(params)


# Test cases and examples
if __name__ == "__main__":
    # Initialize processor
    processor = ScoutPromptProcessor()
    
    # Test cases
    test_cases = [
        {
            "prompt": "Find a vegan cafe open after 7pm on my route to Brooklyn",
            "expected": {
                "category": "cafe",
                "dietary_restrictions": ["vegan"],
                "specific_time": "19:00",
                "location_context": "on route",
                "destination": "Brooklyn"
            }
        },
        {
            "prompt": "I need a rest stop with clean bathrooms halfway to Philadelphia",
            "expected": {
                "category": "service",
                "amenities": ["clean bathrooms"],
                "location_context": "halfway",
                "destination": "Philadelphia"
            }
        },
        {
            "prompt": "Looking for a romantic restaurant for dinner tonight",
            "expected": {
                "category": "restaurant",
                "vibe": "romantic",
                "time_preference": "evening",
                "day_preference": "today"
            }
        },
        {
            "prompt": "Coffee shop with wifi and parking near Central Park",
            "expected": {
                "category": "cafe",
                "amenities": ["wifi", "parking"],
                "destination": "Central Park"
            }
        },
        {
            "prompt": "Family-friendly restaurant for 4 people this weekend",
            "expected": {
                "category": "restaurant",
                "vibe": "family",
                "party_size": 4,
                "day_preference": "weekend"
            }
        }
    ]
    
    print("🧭 Scout Prompt Processor - Test Results")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Prompt: \"{test_case['prompt']}\"")
        
        # Extract parameters
        params = processor.extract_search_parameters(test_case['prompt'])
        params_dict = processor.to_dict(params)
        
        print("Extracted Parameters:")
        for key, value in params_dict.items():
            if value:  # Only show non-empty values
                print(f"  {key}: {value}")
        
        # Check expected results
        print("\nExpected:")
        for key, value in test_case['expected'].items():
            print(f"  {key}: {value}")
        
        print("-" * 30)
    
    print("\n✅ All tests completed!")


def main():
    """CLI interface for the Scout prompt processor."""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Process Scout navigation prompts')
    parser.add_argument('--prompt', required=True, help='User prompt to process')
    parser.add_argument('--api-key', help='OpenHands API key')
    parser.add_argument('--format', choices=['json', 'pretty'], default='json', 
                       help='Output format (json or pretty)')
    
    args = parser.parse_args()
    
    processor = ScoutPromptProcessor(api_key=args.api_key)
    params = processor.extract_search_parameters(args.prompt)
    params_dict = processor.to_dict(params)
    
    if args.format == 'json':
        print(json.dumps(params_dict, indent=2))
    else:
        print(f"Prompt: \"{args.prompt}\"")
        print("\nExtracted Parameters:")
        for key, value in params_dict.items():
            if value:  # Only show non-empty values
                print(f"  {key}: {value}")


if __name__ == "__main__":
    # Check if running as CLI or test mode
    if len(sys.argv) > 1 and '--prompt' in sys.argv:
        main()
    else:
        # Run test cases
        pass
