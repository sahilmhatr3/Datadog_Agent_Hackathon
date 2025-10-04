# Scout Navigation App 🚗🗺️

A modern, AI-powered itinerary builder and navigation assistant that helps users discover places along their routes. Built with Next.js, Supabase, and Python for the Datadog Agent Hackathon.

## 🌟 Features

### Core Functionality
- **Natural Language Search**: Convert conversational prompts into structured search parameters
- **Smart Route Planning**: Find venues and points of interest along your travel route
- **AI-Powered Recommendations**: Personalized suggestions based on user preferences
- **Multi-User Sessions**: Collaborate with friends and family on trip planning
- **Real-time Updates**: Live session sharing and itinerary updates

### Key Components
- **Scout Chat Interface**: Interactive AI assistant for gathering trip preferences
- **Interactive Map View**: Visual representation of routes and destinations
- **Session Management**: Save, share, and revisit past itineraries
- **Linkup Integration**: Access to comprehensive venue database
- **OpenHands SDK**: Advanced natural language processing for user intents

## 🏗️ Architecture

```
hackathon/
├── with-supabase-app/          # Next.js frontend application
│   ├── app/                    # App router pages and API routes
│   ├── components/             # React components
│   │   ├── scout/             # Scout-specific components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                    # Utilities and helpers
│   └── supabase/              # Database schema and migrations
├── api/                        # Python backend services
│   └── main.py                # FastAPI server (if applicable)
├── scout_prompt_processor.py   # NLP processing module
└── requirements.txt           # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.9+
- Supabase account
- OpenHands API key (optional)
- Linkup API key

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Datadog_Agent_Hackathon.git
   cd hackathon/with-supabase-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   LINKUP_API_KEY=your-linkup-api-key
   ```

4. **Run database migrations**
   ```bash
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Python Backend Setup

1. **Navigate to the project root**
   ```bash
   cd hackathon
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   export OPENHANDS_API_KEY="your-api-key-here"
   ```

5. **Run the prompt processor**
   ```bash
   python scout_prompt_processor.py
   ```

## 💻 Usage

### Creating a New Itinerary

1. **Start a conversation**: Click the search bar and describe your trip
   ```
   "Find a vegan cafe open after 7pm on my route to Brooklyn"
   ```

2. **Answer follow-up questions**: The AI assistant will gather more details about your preferences

3. **Review recommendations**: Browse suggested venues that match your criteria

4. **Build your itinerary**: Add selected places to your trip plan

5. **Share with friends**: Invite others to view or collaborate on your itinerary

### API Integration

The Scout Prompt Processor can be integrated into your application:

```python
from scout_prompt_processor import extract_search_parameters

# Extract parameters from user prompt
prompt = "I need a rest stop with clean bathrooms halfway to Philadelphia"
params = extract_search_parameters(prompt)

# Use params to query venues
# params will include: category, amenities, location_context, destination, etc.
```

## 🗄️ Database Schema

### Key Tables
- **profiles**: User profile information
- **sessions**: Planning contexts for trips
- **session_participants**: Multi-user collaboration
- **session_requirements**: Trip preferences and constraints
- **places**: Venue database
- **recommendations**: AI-generated suggestions
- **itineraries**: Saved trip plans
- **user_place_history**: User interactions with places

See `supabase/schema_reference.sql` for complete schema details.

## 🧪 Testing

### Frontend Tests
```bash
cd with-supabase-app
npm run test
```

### Python Tests
```bash
cd hackathon
pytest
```

### Test the Prompt Processor
```bash
python scout_prompt_processor.py --prompt "Find a coffee shop with wifi near Central Park"
```

## 📚 API Documentation

### Scout Process API
- **Endpoint**: `POST /api/scout-process`
- **Purpose**: Process natural language prompts and extract search parameters
- **Request**: `{ "prompt": "user's natural language query" }`
- **Response**: Structured search parameters

### Linkup API Integration
- **Endpoint**: `POST /api/linkup`
- **Purpose**: Query venues based on structured parameters
- **Features**: Location-based search, filtering by amenities, dietary restrictions

### Save Response API
- **Endpoint**: `POST /api/save-response`
- **Purpose**: Store Scout session data for debugging and analysis

## 🛠️ Development

### Code Style
- Frontend: ESLint + Prettier
- Python: Black + Flake8

### Type Safety
- TypeScript for frontend
- Pydantic models for Python

### Environment Management
- Next.js: `.env.local`
- Python: Environment variables or `.env` file

## 📈 Performance Optimization

- **Caching**: Implement Redis for frequent queries
- **Database Indexes**: Optimized for geo-queries and text search
- **Edge Functions**: Use Supabase Edge Functions for compute-intensive tasks
- **Streaming Responses**: Real-time AI responses in chat interface

## 🔒 Security

- Row-Level Security (RLS) enforced in Supabase
- API key management through environment variables
- User authentication via Supabase Auth
- Secure session management

## 🚢 Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Backend (Python)
- Deploy as serverless functions
- Or containerize with Docker

### Database
- Use Supabase hosted instance
- Or self-host with PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the Datadog Agent Hackathon
- Powered by OpenHands SDK for natural language processing
- Venue data provided by Linkup API
- UI components from Radix UI and shadcn/ui

## 📞 Support

For questions or support:
- Create an issue in the GitHub repository
- Contact the team at [your-email@example.com]

---

Built with ❤️ by [Your Team Name]