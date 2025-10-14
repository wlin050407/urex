# Earth ECI Visualization with TLE Data

This project provides a 3D visualization of Earth in ECI (Earth-Centered Inertial) coordinates with satellite TLE data support. It fetches the latest Two-Line Element (TLE) data from Celestrak.org, a free and reliable source for satellite orbital data.

## Features

- 3D Earth visualization with day/night cycle
- Fetches the latest TLE data from Celestrak.org (no authentication required)
- Support for multiple satellite categories (ISS, GPS, Starlink, etc.)
- Real-time time control and Earth rotation simulation
- ECI coordinate system visualization

## Prerequisites

- Node.js (v16 or higher recommended)
- npm
- No authentication required (Celestrak.org is free and open)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will run at `http://localhost:3000`.

### 4. Example Usage

The project includes a comprehensive TLE data service that supports multiple satellite categories:

```typescript
import { getISSTLEData, getSatellitesByCategory, SatelliteCategory } from './src/services/celestrakService';

// Get ISS TLE data
const issData = await getISSTLEData();

// Get all GPS satellites
const gpsSatellites = await getSatellitesByCategory(SatelliteCategory.GPS);

// Get multiple categories
const categories = await getMultipleCategories([
  SatelliteCategory.STATIONS,
  SatelliteCategory.GPS,
  SatelliteCategory.STARLINK
]);
```

## Data Source

- **Celestrak.org** provides free and reliable satellite TLE data
- No authentication or API keys required
- Data is updated regularly and maintained by the space community
- Supports multiple satellite categories and constellations

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

- [Celestrak.org](https://celestrak.org/) for providing free and reliable satellite TLE data
- [Three.js](https://threejs.org/) for 3D graphics rendering
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for React integration
- [Zustand](https://github.com/pmndrs/zustand) for state management

## Disclaimer

This project is not affiliated with or endorsed by Celestrak.org. Use is subject to Celestrak's terms of service and data usage policies. 