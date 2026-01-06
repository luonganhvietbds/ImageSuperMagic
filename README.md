# AI Image Platform

A production-grade AI SaaS platform for image processing with 3 AI modules.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Features

- **Grid-to-JSON**: Extract identity data from portraits, generate 9-angle grids
- **Vision-to-JSON**: Convert any image to structured JSON with object detection
- **Realistic-to-JSON**: Transform text/images into realistic human generation specs

## 🔑 BYOK Model

This app uses a **Bring Your Own Key** model:
- You provide your own Gemini API key
- Key is stored locally in your browser (IndexedDB)
- No data is sent to external servers except Gemini API

Get your API key at [Google AI Studio](https://aistudio.google.com/apikey)

## 🏗️ Architecture

```
ai-image-platform/
├── apps/frontend/          # React + Vite frontend
├── shared/
│   ├── types/              # TypeScript definitions
│   └── db/                 # IndexedDB layer
└── prompt_brain/           # AI system prompts
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS (dark theme)
- **State**: Zustand
- **Storage**: IndexedDB (Dexie.js)
- **AI**: Google Gemini 2.0 Flash
- **Deployment**: Vercel

## 📦 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_REPO)

Or deploy manually:

```bash
npm install -g vercel
vercel
```

## 📄 License

MIT
