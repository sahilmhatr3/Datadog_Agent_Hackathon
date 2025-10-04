# Scout Navigation Platform

An agentic navigation platform that uses natural language processing to help users discover places along their travel routes. Built for the Datadog Agent Hackathon, Scout combines OpenHands SDK, Supabase, and Next.js to create an intelligent route-aware recommendation system.

## Overview

Scout transforms natural language prompts into structured search parameters, enabling users to find venues, restaurants, and services along their travel routes. The platform learns from user behavior to provide increasingly personalized recommendations.

### Key Features

- **Natural Language Processing**: Convert free-form text prompts into structured search parameters
- **Route-Aware Search**: Find places along specific travel routes with proximity filtering
- **Real-Time Venue Discovery**: Integration with Linkup API for live venue and event data
- **Adaptive Learning**: System learns from user choices to improve future recommendations
- **Interactive Map Interface**: Visual representation of routes and discovered venues
- **User Session Management**: Track and analyze user preferences over time

## Architecture

### Core Components

1. **Prompt Processing Engine**: OpenHands SDK-powered natural language understanding
2. **Venue Search API**: Linkup integration for real-time venue discovery
3. **Route Planning**: Google Maps/Mapbox integration for route calculation
4. **Learning System**: User behavior tracking and recommendation optimization
5. **Frontend Interface**: Next.js React application with interactive maps

### Technology Stack

- **Frontend**: Next.js 15.5.4, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI/NLP**: OpenHands SDK, Custom regex patterns
- **Maps**: Google Maps API / Mapbox
- **Search**: Linkup API
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Project Structure

```
Datadog_Agent_Hackathon/
├── README.md                           # This file
├── requirements.txt                    # Python dependencies
├── scout_prompt_processor.py          # Core NLP processing engine
├── INTEGRATION_GUIDE.md               # Integration documentation
├── venv/                              # Python virtual environment
└── with-supabase-app/                 # Next.js application
    ├── app/                           # Next.js app router
    ├── components/                    # React components
    │   └── scout/                     # Scout-specific components
    ├── lib/                           # Utility libraries
    ├── supabase/                      # Database schema and migrations
    ├── package.json                   # Node.js dependencies
    └── README.md                      # Next.js app documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.12+
- Supabase account
- Google Maps API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Datadog_Agent_Hackathon
   ```

2. **Set up Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Set up Next.js application**
   ```bash
   cd with-supabase-app
   pnpm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Start the development server**
   ```bash
   pnpm run dev
   ```

The application will be available at `http://localhost:3000`.

## Usage

### Natural Language Processing

The Scout prompt processor can extract structured parameters from natural language queries:

```python
from scout_prompt_processor import ScoutPromptProcessor

processor = ScoutPromptProcessor()
params = processor.extract_search_parameters(
    "Find a vegan cafe open after 7pm on my route to Brooklyn"
)

print(params.category)  # 'cafe'
print(params.dietary_restrictions)  # ['vegan']
print(params.specific_time)  # '19:00'
```

### Supported Query Types

- **Route-based searches**: "Find restaurants halfway to Boston"
- **Amenity requests**: "Coffee shop with wifi and parking"
- **Time-specific queries**: "Open after 8pm" or "This weekend"
- **Dietary restrictions**: "Vegan options" or "Gluten-free"
- **Party size**: "For 4 people" or "Family-friendly"
- **Atmosphere preferences**: "Romantic" or "Casual"

### API Integration

The system is designed to integrate with:

- **Linkup API**: For venue and event discovery
- **Google Maps API**: For route planning and proximity filtering
- **Supabase**: For user data and session management

## Development

### Running Tests

```bash
# Test the prompt processor
python3 scout_prompt_processor.py --prompt "Find a vegan cafe" --format json

# Run Next.js tests
cd with-supabase-app
pnpm test
```

### Database Schema

The application uses Supabase with the following key tables:

- `profiles`: User profile information
- `sessions`: User search sessions
- `session_requirements`: Extracted search parameters
- `places`: Discovered venues and locations
- `search_runs`: Search execution logs
- `recommendations`: User-specific recommendations

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## API Reference

### ScoutPromptProcessor

The core NLP processing class that handles natural language understanding.

#### Methods

- `extract_search_parameters(prompt: str)`: Extract structured parameters from natural language
- `to_dict(params: SearchParameters)`: Convert parameters to dictionary format

#### SearchParameters

Data class containing extracted search parameters:

- `category`: Type of venue (cafe, restaurant, service, etc.)
- `amenities`: List of desired amenities
- `dietary_restrictions`: Dietary requirements
- `location_context`: Route position (halfway, on route, near destination)
- `destination`: Target destination
- `specific_time`: Exact time requirements
- `party_size`: Number of people
- `vibe`: Atmosphere preferences

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Backend (Supabase)

1. Create a new Supabase project
2. Run database migrations
3. Configure authentication settings
4. Set up API keys and secrets

## Monitoring and Observability

The application is designed to integrate with Datadog for:

- **Application Performance Monitoring**: Track API response times and errors
- **User Behavior Analytics**: Monitor search patterns and success rates
- **Infrastructure Monitoring**: Server health and resource usage
- **Custom Metrics**: Search accuracy and recommendation effectiveness

## License

This project is developed for the Datadog Agent Hackathon. Please refer to the hackathon guidelines for usage and distribution terms.

## Support

For questions or issues:

1. Check the integration guide in `INTEGRATION_GUIDE.md`
2. Review the Scout technical architecture in `scout_instructions.txt`
3. Open an issue in the repository
4. Contact the development team

## Roadmap

- [ ] Complete Linkup API integration
- [ ] Implement Google Maps route planning
- [ ] Add user behavior learning system
- [ ] Deploy to production environment
- [ ] Integrate Datadog monitoring
- [ ] Add mobile application support