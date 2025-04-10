# Bangalore Civic Compass

A civic information tool that helps Bangalore residents discover detailed information about any address in the city, including:

- BBMP Ward details
- Revenue classifications and offices
- Police jurisdictions
- BESCOM electricity information
- BWSSB water supply information
- BDA layout boundaries

> This project is part of [Zen Citizen](https://zencitizen.in), an initiative to empower Indian citizens with clear, practical information about government procedures and services.

## Overview

Bangalore Civic Compass is an interactive map-based web application that allows users to search for any address in Bangalore and get comprehensive civic information about that location. Users can click on the map or search for an address to see which administrative zones, wards, and jurisdictions the location falls under.

## Features

- Address search functionality
- Interactive map interface
- Detailed information panels showing:
  - BBMP ward information
  - Revenue classification details
  - Police and traffic police jurisdictions
  - BESCOM electricity division information
  - BWSSB water supply information
  - BDA layout details
- Mobile-responsive design

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/bangalore-civic-compass.git
   cd bangalore-civic-compass
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   REACT_APP_USE_GOOGLE_SEARCH=false
   ```
   Note: If you want to use Google Maps API for search, set to `true` and add your Google Maps API key.

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Contributing

Contributions to improve Bangalore Civic Compass are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Keep the UI responsive and mobile-friendly
- Maintain accessibility standards
- Test thoroughly on different devices and browsers
- Follow the existing code style and patterns

## Data sources 

- OpenCity
- Karnataka-GIS
- OpenStreetMap

