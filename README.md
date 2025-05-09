# Multiplayer Drawing Game

A real-time multiplayer drawing game built with React, TypeScript, and Vite.

## Features

- Real-time collaborative drawing
- Multiple drawing tools
- User authentication
- Game rooms

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation and Setup

1. Clone the repository
   ```bash
   git clone https://github.com/fromtaoyuanhsinchuuuu/CNL-Final-Project.git
   cd CNL-Final-Project
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. The browser should automatically open to the application. If not, navigate to `http://localhost:5173` (or the port shown in your terminal)

### Troubleshooting

If you encounter any issues with the application not displaying:

1. Clean the project and reinstall dependencies
   ```bash
   # Remove node_modules and dist folders
   rm -rf node_modules dist
   
   # Reinstall dependencies
   npm install
   
   # Start with force flag
   npm run dev -- --force
   ```

2. Check browser console (F12) for any error messages

3. If port 5173 is already in use, specify a different port:
   ```bash
   npm run dev -- --port 3000
   ```

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/contexts` - React context providers
  - `/pages` - Application pages
  - `/types` - TypeScript type definitions

## License

MIT
