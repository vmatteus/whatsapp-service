# WhatsApp Service WhatsApp (WIP)

A REST API service that enables sending WhatsApp messages using the Baileys library.

## Features

- Send WhatsApp messages via HTTP API
- Real-time connection status monitoring
- Typing indicator simulation
- Multi-device support
- Auto-reconnect capability

## Prerequisites

- Node.js 16.x or higher
- NPM or Yarn
- A WhatsApp account
- macOS, Windows, or Linux

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whatsapp-service
cd whatsapp-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

## Usage

### Connect to WhatsApp

1. Run the application
2. Scan the QR code with WhatsApp mobile app
3. Wait for the connection confirmation

### Send a Message

Send a POST request to `/api/send-message`:

```bash
curl -X POST http://localhost:3000/api/send-message \
-H "Content-Type: application/json" \
-d '{
    "number": "5511999999999",
    "message": "Hello World!",
    "deviceId": "device1"
}'
```

#### Request Body

| Parameter | Type   | Description                               |
|-----------|--------|-------------------------------------------|
| number    | string | Phone number (Format: DDI + DDD + NUMBER) |
| message   | string | Message text                              |

#### Response

Success (200):
```json
{
    "success": true,
    "message": "Message sent to 5511999999999"
}
```

Error (400/500):
```json
{
    "error": "Error description",
    "details": "Additional error information"
}
```

## Project Structure

```
baileys-api/
├── config/
│   └── logger.js
├── services/
│   └── whatsapp.js
├── routes/
│   └── messages.js
├── index.js
├── package.json
└── README.md
```

## Environment Variables

| Variable | Default | Description     |
|----------|---------|-----------------|
| PORT     | 3000    | HTTP port      |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Express](https://expressjs.com/) - Web framework