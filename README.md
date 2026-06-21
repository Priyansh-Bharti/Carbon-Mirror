# Carbon Mirror

![Carbon Mirror Banner](public/assets/carbon_mirror_icon.png)

**Carbon Mirror** is a web application designed to help users calculate, track, and reduce their carbon footprint through gamification, personalized AI coaching, and community engagement.

## Features

- **Interactive Carbon Quiz**: Baseline your emissions based on travel, energy, food, and consumption habits.
- **Dynamic Dashboard**: Visualize your footprint, compare against the global average, and track your gamified "Planet Score."
- **Action Lab**: Commit to real-world actions (e.g., public transit, plant-based meals) and see their direct impact.
- **AI Carbon Coach**: Powered by Google Gemini, get personalized advice on reducing your specific emission sources.
- **Community Forest**: A shared visualization of collective impact. Every action taken grows the forest.
- **Action Cards**: Generate shareable cards to challenge friends and spread awareness.

## Architecture & Tech Stack

Carbon Mirror is built entirely on a serverless Google Cloud stack for maximum scalability and zero maintenance:

- **Frontend**: Vanilla HTML5, CSS3 (Custom Tokens), ES6 Modules
- **Authentication**: Firebase Authentication (Anonymous + Email/Password)
- **Database**: Cloud Firestore (Realtime tracking and secure rules)
- **Backend APIs**: Firebase Cloud Functions (Node.js)
- **AI Engine**: Google Gemini Pro 1.5 via Vertex AI / AI Studio
- **Maps**: Google Maps API (Distance matrix and geocoding)
- **Hosting & CI/CD**: Firebase Hosting deployed via GitHub Actions

For a detailed technical breakdown, please see [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [RESEARCH.md](docs/RESEARCH.md) for system design and carbon metric baselines.

## Quick Start (Local Development)

### Prerequisites
- Node.js v20+
- Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/carbon-mirror.git
   cd carbon-mirror
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure Environment Variables:**
   - Copy the template file: `cp .env.example .env`
   - Fill in your API keys in the `.env` file. Do **not** commit this file.

4. **Run Locally:**
   Use the Firebase Local Emulator Suite to run the app entirely locally:
   ```bash
   firebase emulators:start
   ```
   Access the app at `http://localhost:5000`.

## Testing

Carbon Mirror uses Jest for unit testing mathematical logic and utility functions, and Playwright for End-to-End accessibility and user-journey validation.
```bash
npm run test:all
```

## Security

Please refer to [SECURITY.md](SECURITY.md) for our vulnerability reporting policy and security hardening details.

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our pull request process, coding standards, and branch naming conventions.

## Citations

Emission calculation factors and baseline data are sourced from:
- [IPCC Emission Factor Database](https://www.ipcc-nggip.iges.or.jp/EFDB/main.php)
- [EPA Greenhouse Gas Equivalencies Calculator](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator)
- [Our World in Data - CO2 Emissions](https://ourworldindata.org/co2-and-other-greenhouse-gas-emissions)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
