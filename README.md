# JagaSwap

Real-time AI video transformation web application powered by Decart Lucy SDK.

## Features

- **Real-time Camera Feed**: Live camera stream using WebRTC
- **AI Transformation**: Real-time video transformation using Decart Lucy AI
- **Reference Image Upload**: Upload a reference image to use as the character replacement
- **Minimal UI**: Clean, dark-themed interface with neon blue glow effects
- **Mobile Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Next.js** - React framework
- **React** - UI library
- **Tailwind CSS** - Styling
- **Decart Lucy SDK** - Real-time AI video transformation

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Decart API key (get one at https://dashboard.decart.ai/)

### Installation

```bash
# Install dependencies
npm install

# Copy the environment file
cp .env.local.example .env.local

# Add your Decart API key to .env.local
# NEXT_PUBLIC_DECART_API_KEY=your_api_key_here

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_DECART_API_KEY=your_decart_api_key
```

## Usage

1. **Allow Camera Access**: The app will request camera permission on load
2. **Upload Reference Image**: Click "Upload Reference Image" to select a photo of the person you want to appear in the video
3. **Start Transformation**: Click the "Start" button to begin AI transformation
4. **Stop**: Click "Stop" to end the session

## Project Structure

```
jagaswap/
├── src/
│   ├── app/
│   │   ├── globals.css     # Global styles with Tailwind
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page component
├── .env.local.example      # Environment variables template
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## API

The app uses the Decart Lucy realtime SDK for AI transformation. For more details about the SDK, visit:
- [Decart SDK Documentation](https://docs.platform.decart.ai/sdks/javascript)
- [Decart Dashboard](https://dashboard.decart.ai/)

## License

MIT