# FART - Filament Automation & Remote Tracking

A Vue 3 + Nuxt 3 dashboard for managing and monitoring Prusa 3D printers.
this change is to see if it tracks github repos

## Features

- **Multi-printer management** - Monitor and control multiple Prusa printers from one dashboard
- **Real-time status** - Live temperature, progress, and status updates
- **Print controls** - Start, pause, resume, and cancel prints remotely
- **File management** - Browse and select files on printer storage
- **User management** - Simple name-based login with auto-generated UUIDs
- **Admin dashboard** - Manage users, printers, view print history, and track costs
- **Cost tracking** - Configurable filament and electricity cost estimation
- **Maintenance logs** - Track printer maintenance history
- **Print notifications** - Browser notifications when prints complete
- **CSV export** - Export print logs for record keeping

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Or [Node.js](https://nodejs.org/) 20+ for local development

### Running with Docker (Recommended)

**For local development/testing (includes mock printer):**

```bash
docker compose -f docker-compose.local.yml up --build
```

This starts:
- Dashboard at `http://localhost:3000`
- Mock printer at `http://localhost:8888`

**For production:**

```bash
docker compose up --build -d
```

### Running without Docker

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm run preview
```

## Default Login

**Regular users:** Just enter your name - a UUID will be auto-generated

**Admin access:**
- Name: `stembassadors`
- Code: `1264`

The admin code can be changed from the admin dashboard.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `DATA_DIR` | `./data` | Directory for persistent data |
| `NODE_ENV` | `development` | Environment mode |

### Adding Real Printers

1. Log in as admin
2. Go to Admin Dashboard (shield icon)
3. Scroll to "Printer Management"
4. Click "Add Printer" and enter:
   - **Name**: Display name for the printer
   - **Model**: Printer model (e.g., "Prusa MK4")
   - **IP Address**: Printer's IP on your network
   - **API Key**: From printer's network settings

### Cost Configuration

1. Log in as admin
2. Click the "$" (Costs) button in the admin header
3. Set your filament cost per kg and electricity cost per hour

## Project Structure

```
fart-vue/
├── pages/              # Vue pages (routes)
│   ├── index.vue       # Home - printer grid
│   ├── login.vue       # Login page
│   ├── admin.vue       # Admin dashboard
│   └── printer/[id].vue # Individual printer dashboard
├── components/         # Reusable Vue components
│   ├── dashboard/      # Dashboard-specific components
│   ├── widgets/        # Printer widgets (temp, progress, etc.)
│   └── ui/             # Generic UI components
├── composables/        # Vue composables
│   └── useAuth.ts      # Authentication logic
├── stores/             # Pinia stores
│   └── printers.ts     # Printer state management
├── server/             # Nuxt server (API routes)
│   ├── api/            # API endpoints
│   │   ├── auth/       # Login, logout, session
│   │   ├── admin/      # Admin-only endpoints
│   │   ├── printer/    # Printer data and control
│   │   └── prints/     # Print history and notifications
│   └── utils/          # Server utilities
│       ├── dataStore.ts    # Persistent data storage
│       ├── printerStore.ts # Printer management
│       └── printerClient.ts # Prusa API client
├── types/              # TypeScript types
├── assets/css/         # Tailwind CSS
├── mock-printer/       # Mock printer for testing
├── docker-compose.yml  # Production Docker config
└── docker-compose.local.yml # Local dev Docker config
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with name (+ admin code for admin)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Printers
- `GET /api/printer` - List all printers
- `GET /api/printer/:id` - Get printer status and job info
- `POST /api/printer/:id` - Send command (run, pause, resume, cancel)
- `GET /api/printer/:id/test` - Test printer connection
- `POST /api/printer/:id/upload` - Upload gcode file

### Prints
- `GET /api/prints/history` - Get user's print history
- `POST /api/prints/start` - Log a print start
- `GET /api/prints/notifications` - Get completed print notifications

### Admin (requires admin session)
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/users` - Create/delete users
- `POST /api/admin/printers` - Add/edit/delete printers
- `POST /api/admin/code` - Change admin code
- `POST /api/admin/costs` - Update cost configuration
- `POST /api/admin/maintenance` - Manage maintenance logs
- `GET /api/admin/export` - Export print logs as CSV

## Tech Stack

- **Frontend**: Vue 3, Nuxt 3, TypeScript, Tailwind CSS
- **State**: Pinia
- **Icons**: Lucide Vue
- **Backend**: Nuxt Server Routes (Nitro)
- **Data**: JSON file storage (no database required)

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

### Mock Printer

The mock printer simulates a Prusa printer for testing. It:
- Responds to all standard Prusa API endpoints
- Simulates temperature changes
- Progresses prints at ~0.5% per second
- Accepts file uploads

To run just the mock printer:
```bash
cd mock-printer
npm install -g tsx
tsx server.ts
```

## Deployment

### Docker (Recommended)

```bash
# Build and run
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Manual

```bash
npm run build
node .output/server/index.mjs
```

### With PM2

```bash
npm run build
pm2 start .output/server/index.mjs --name fart
```

## Data Persistence

All data is stored in `DATA_DIR/fart-data.json`:
- Users and sessions
- Print logs
- Printer configurations
- Cost settings
- Maintenance logs

To reset all data, delete this file and restart.

## Troubleshooting

### Printer shows offline
- Check the printer is on and connected to the network
- Verify the IP address is correct
- Ensure the API key matches the printer's settings
- Check if the printer's API is enabled in settings

### Can't start prints
- Only admins can control active prints
- Regular users can only view when a print is running
- Check printer storage isn't full

### Progress not updating
- Progress updates when viewing the home page or admin dashboard
- The system polls printers for live status on page load

## License

MIT
