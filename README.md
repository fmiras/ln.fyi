# ln.fyi

ln.fyi is a real-time Lightning Network analytics platform that provides comprehensive statistics and insights about the Bitcoin Lightning Network. It offers detailed information about nodes, channels, network capacity, and other key metrics.

## Features

- ⚡️ Real-time Lightning Network statistics
- 📊 Node rankings by capacity and channels
- 🗺️ Node location tracking and visualization
- 📈 Historical network growth data
- 💰 Channel capacity analytics
- 🔍 Detailed node information and features

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application

## Environment Setup

Copy the `.env.example` file to `.env.local` and fill in your environment variables:

```bash
cp .env.example .env.local
```

## License

[MIT License](LICENSE)

## Credits

This project makes use of the following excellent resources:

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and customizable components built with Radix UI and Tailwind CSS
- [mempool.space API](https://mempool.space/docs/api) - Bitcoin mempool and Lightning Network data provider
