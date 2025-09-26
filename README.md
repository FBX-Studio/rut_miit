# Slot-Aware Adaptive VRPTW System

A comprehensive Vehicle Routing Problem with Time Windows (VRPTW) optimization system featuring real-time adaptive optimization, route monitoring, and a modern React-based dashboard.

## Features

### Core Optimization
- **OR-Tools Integration**: Advanced VRPTW solving using Google OR-Tools
- **Adaptive Optimization**: Real-time route reoptimization based on traffic, delays, and new orders
- **Multiple Optimization Strategies**: Local, global, emergency, and manual reoptimization modes
- **Time Window Management**: Flexible time slot handling with customer preferences

### Real-Time Monitoring
- **Live Route Tracking**: Real-time vehicle position and route progress monitoring
- **Event-Driven Architecture**: Automatic reoptimization triggers for delays, traffic, and breakdowns
- **WebSocket Integration**: Live updates for routes, events, and system status
- **Performance Analytics**: Comprehensive metrics and KPI tracking

### External Integrations
- **Yandex Maps API**: Real-time traffic data, geocoding, and route optimization
- **ETA Prediction**: Machine learning-based arrival time estimation
- **Traffic-Aware Routing**: Dynamic route adjustment based on current traffic conditions

### Modern Web Interface
- **React Dashboard**: Interactive route visualization and monitoring
- **Real-Time Updates**: Live data synchronization via WebSocket
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Interactive Maps**: Leaflet-based route visualization with traffic layers

## Architecture

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # REST API endpoints and WebSocket handlers
│   │   ├── models/         # Data models and ETA prediction
│   │   ├── optimization/   # VRPTW solver and adaptive optimizer
│   │   └── services/       # External service integrations
│   ├── main.py            # Application entry point
│   └── requirements.txt   # Python dependencies
│
├── frontend/               # Next.js React frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts for state management
│   │   └── lib/          # Utilities and API client
│   ├── package.json      # Node.js dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
│
└── README.md             # This file
```

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Yandex Maps API key (optional, for enhanced features)

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the backend**:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   # Create .env.local with:
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

### Key Endpoints

#### Route Optimization
- `POST /api/v1/routes/optimize` - Optimize routes for given orders and vehicles
- `GET /api/v1/routes` - List all routes with filtering options
- `PUT /api/v1/routes/{route_id}/reoptimize` - Trigger route reoptimization

#### Real-Time Updates
- `WebSocket /ws/routes` - Real-time route updates
- `WebSocket /ws/events` - System events and alerts
- `WebSocket /ws/eta` - ETA predictions and updates

#### Monitoring
- `GET /api/v1/monitoring/status` - System monitoring status
- `GET /api/v1/events` - System events and alerts
- `GET /api/v1/analytics/performance` - Performance metrics

## Configuration

### Environment Variables

#### Backend (.env)
```env
# API Configuration
YANDEX_MAPS_API_KEY=your_api_key_here
HOST=0.0.0.0
PORT=8000

# Optimization Settings
MAX_VEHICLES=50
MAX_ORDERS=1000
DELAY_THRESHOLD_MINUTES=15
TRAFFIC_THRESHOLD_MULTIPLIER=1.5

# WebSocket Settings
WS_HEARTBEAT_INTERVAL=30
WS_MAX_CONNECTIONS=100
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Usage Examples

### Basic Route Optimization

```python
import requests

# Optimize routes
response = requests.post('http://localhost:8000/api/v1/routes/optimize', json={
    "orders": [
        {
            "id": 1,
            "customer_id": 1,
            "pickup_location": {"lat": 55.7558, "lng": 37.6176},
            "delivery_location": {"lat": 55.7522, "lng": 37.6156},
            "time_window": {"start": "09:00", "end": "17:00"},
            "service_time_minutes": 15,
            "priority": "normal"
        }
    ],
    "vehicles": [
        {
            "id": 1,
            "capacity": 100,
            "start_location": {"lat": 55.7558, "lng": 37.6176},
            "end_location": {"lat": 55.7558, "lng": 37.6176},
            "available_from": "08:00",
            "available_until": "18:00"
        }
    ]
})

routes = response.json()
```

### WebSocket Integration

```javascript
// Connect to real-time updates
const ws = new WebSocket('ws://localhost:8000/ws/routes');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Route update:', data);
};
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
black .
flake8 .
mypy .

# Frontend linting
cd frontend
npm run lint
npm run type-check
```

## Deployment

### Docker Deployment (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

1. **Backend**: Deploy using Gunicorn or similar WSGI server
2. **Frontend**: Build and deploy static files
   ```bash
   npm run build
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the code examples in this README