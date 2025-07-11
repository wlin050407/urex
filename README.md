# ISS TLE Data Fetcher

This project provides a minimal and robust solution for fetching the latest Two-Line Element (TLE) data for the International Space Station (ISS) from Space-Track.org. It includes a simple Node.js proxy server to bypass CORS restrictions and enables secure, automated access to TLE data for research, visualization, or further satellite analysis.

## Features

- Fetches the latest ISS TLE data directly from Space-Track.org
- Node.js proxy server to handle authentication and CORS
- Secure credential management (do not commit credentials to version control)
- Easily extensible for other satellites or data sources

## Prerequisites

- Node.js (v16 or higher recommended)
- npm
- A valid Space-Track.org account (free registration required)

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

### 3. Configure Credentials

Create a `.env` file in the project root (do not commit this file) and add your Space-Track credentials:

```
VITE_SPACETRACK_USERNAME=your_email@example.com
VITE_SPACETRACK_PASSWORD=your_password
```

### 4. Start the Proxy Server

```bash
node server.cjs
```

The proxy will run at `http://localhost:3005/api/iss-tle`.

### 5. Example Usage (cURL)

Fetch the latest ISS TLE data:

```bash
curl http://localhost:3005/api/iss-tle
```

You can integrate this endpoint into your own applications or scripts.

## Security Notice

- **Never commit your Space-Track credentials to any public repository.**
- The `.env` file is included in `.gitignore` by default.
- For production or multi-user environments, consider additional security and rate-limiting.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

- [Space-Track.org](https://www.space-track.org/) for providing authoritative satellite data
- [Node.js](https://nodejs.org/) for the server runtime
- [node-fetch](https://www.npmjs.com/package/node-fetch) for HTTP requests

## Disclaimer

This project is not affiliated with or endorsed by Space-Track.org. Use is subject to Space-Track's terms of service and data usage policies. 