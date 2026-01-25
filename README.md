# EcoGames - Constraint-Led Grappling Training Game Library

A full-stack web application for creating and managing constraint-led training games for NoGi/BJJ, inspired by ecological dynamics training principles.

## Features

### Core Functionality
- **Games Library**: Create, edit, and organize training games with topic categories (Offensive, Defensive, Control, Transition)
- **Sessions**: Group games into training sessions for organized practice
- **Favorites & Recent**: Quick access to starred and recently used games
- **Statistics**: Visual overview of your library with topic distribution and usage patterns
- **AI Game Designer**: Generate constraint-led training games using ecological dynamics principles

### Multi-User Features
- User authentication (email/password)
- Personal game and session libraries
- Share games and sessions via public links
- Copy/fork shared content to your library

### Real-Time Features
- Synchronized timer across multiple participants
- Live session collaboration with Socket.io

### User Experience
- Dark/light mode toggle
- Responsive mobile-first design
- Keyboard shortcuts (N=New, A=AI, S=Search, T=Timer)
- Toast notifications
- Import/export games as JSON

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time features

### Frontend
- **React 18** with React Router
- **Tailwind CSS** for styling
- **Context API** for state management
- **Vite** for development and building

## Project Structure

```
ecogames/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Game.js            # Game model
│   │   └── Session.js         # Session model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── games.js           # Games CRUD routes
│   │   ├── sessions.js        # Sessions CRUD routes
│   │   └── share.js           # Sharing functionality routes
│   ├── server.js              # Express server with Socket.io
│   ├── package.json
│   └── .env.example           # Environment variables template
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── BulkActionBar.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── GameCard.jsx
│   │   │   ├── GameModal.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SessionItem.jsx
│   │   │   ├── Timer.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   ├── AppContext.jsx  # App state management
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── pages/
│   │   │   ├── AIDesigner.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── Games.jsx
│   │   │   ├── Import.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Recent.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Sessions.jsx
│   │   │   ├── SessionView.jsx
│   │   │   └── Stats.jsx
│   │   ├── utils/
│   │   │   ├── api.js         # Axios API client
│   │   │   └── socket.js      # Socket.io client
│   │   ├── App.jsx            # Main app with routing
│   │   ├── index.css          # Tailwind styles
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ecogames
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

5. Start the server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

### Running Both Together

From the root directory, you can run both services:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update user preferences

### Games
- `GET /api/games` - Get all games (with filters, pagination)
- `GET /api/games/recent` - Get recently used games
- `GET /api/games/stats` - Get game statistics
- `POST /api/games` - Create new game
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game
- `POST /api/games/bulk` - Bulk operations
- `POST /api/games/import` - Import games
- `GET /api/games/export/all` - Export all games

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `PUT /api/sessions/:id/games` - Update session games

### Sharing
- `POST /api/share/game/:id` - Generate share link for game
- `GET /api/share/game/:shareId` - Get shared game
- `POST /api/share/game/:shareId/copy` - Copy shared game
- `POST /api/share/session/:id` - Generate share link for session
- `GET /api/share/session/:shareId` - Get shared session
- `POST /api/share/session/:shareId/copy` - Copy shared session

## Game Topics

Games are categorized by topic with color-coded badges:

- 🔴 **Offensive / Submissions** - Attack-focused games
- 🔵 **Defensive / Escapes** - Defense and survival games
- 🟣 **Control / Passing** - Positional control games
- 🟢 **Transition / Scrambles** - Dynamic movement games

## Keyboard Shortcuts

- `N` - Create new game (on Games page)
- `A` - Go to AI Designer
- `S` - Focus search input
- `T` - Toggle timer
- `?` - Show shortcuts help

## Ecological Dynamics Approach

The AI Game Designer generates constraint-led training games that:

1. **Create Constraints** - Specific rules that guide skill development
2. **Encourage Problem-Solving** - Players discover solutions through exploration
3. **Build Perception-Action Coupling** - Connect what you perceive with how you act
4. **Progress Systematically** - From simple to complex scenarios

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own training needs!

---

Built with 💪 for the grappling community
