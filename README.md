# Sale Checker

A Cloudflare Worker that monitors websites for sales. It takes screenshots, uses AI to analyze them for sales/discounts, and sends email notifications when sales are found.

## Features

- Takes full-page screenshots using Cloudflare's Browser Rendering
- Analyzes images using Cloudflare AI (llava-1.5-7b-hf model)
- Sends email notifications with screenshots using Resend
- Runs on a daily schedule using Cloudflare's Cron Triggers

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Resend Account](https://resend.com/) for email notifications
- Cloudflare Account with Workers enabled

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd sale-checker
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables example:
```bash
cp .env.example .dev.vars
```

4. Update `.dev.vars` with your configuration:
```
RESEND_API_KEY=your_resend_api_key
MY_EMAIL_ADDRESS=your@email.com
```

### Development

1. Run locally:
```bash
wrangler dev
```

2. Test the endpoint:
```bash
curl "http://localhost:8787?url=https://www.example.com" --output screenshot.jpg
```

### Deployment

1. Deploy to Cloudflare Workers:
```bash
wrangler deploy
```

2. Set up production secrets:
```bash
wrangler secret put RESEND_API_KEY
wrangler secret put MY_EMAIL_ADDRESS
```

### Configuration

The worker is configured to run daily at 15:00 UTC. You can modify the schedule in `wrangler.json`:

```json
{
  "triggers": {
    "crons": ["0 15 * * *"]
  }
}
```

## API

### Endpoints

- `GET /?url=[url]`: Takes a screenshot of the specified URL
- `POST /check-sales?url=[url]`: Checks for sales at the specified URL

### Response Format

Success response:
```json
{
  "success": true,
  "timestamp": "2024-01-24T15:00:00.000Z",
  "hasSale": true,
  "analysisResult": "Found 20% off sale on all items",
  "emailSent": true
}
```

Error response:
```json
{
  "success": false,
  "timestamp": "2024-01-24T15:00:00.000Z",
  "error": "Error message here"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your chosen license]