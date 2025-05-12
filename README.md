# WhatsApp Service API

A REST API service that enables managing multiple WhatsApp connections using the Baileys library.

## Features

- Multi-device WhatsApp connections
- Send and receive messages via HTTP API
- Real-time connection status monitoring
- Webhook support for events
- SQLite database for device management
- QR code generation and management
- Auto-reconnect capability
- Typing indicator simulation

## Prerequisites

- Node.js 16.x or higher
- NPM or Yarn
- SQLite3
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

### Managing Devices

#### Create a new device connection
```bash
curl -X POST http://localhost:3000/api/connection
```

Response:
```json
{
    "success": true,
    "deviceId": "uuid-generated",
    "message": "Connection started for device uuid-generated"
}
```

#### Get QR Code
```bash
curl http://localhost:3000/api/qr/device-id
```

#### Check Device Status
```bash
curl http://localhost:3000/api/status/device-id
```

### Sending Messages

Send a POST request to `/api/send-message`:

```bash
curl -X POST http://localhost:3000/api/send-message \
-H "Content-Type: application/json" \
-d '{
    "number": "5511999999999",
    "message": "Hello World!",
    "deviceId": "your-device-id"
}'
```

### Webhook Integration

#### Register a webhook
```bash
curl -X POST http://localhost:3000/api/webhooks \
-H "Content-Type: application/json" \
-d '{
    "deviceId": "your-device-id",
    "event": "message.received",
    "url": "https://your-webhook-url.com/webhook"
}'
```

#### Available Events
- `message.received`: When a message is received
- `message.sent`: When a message is sent
- `connection.update`: When connection status changes
- `qr.update`: When new QR code is generated
- `device.ready`: When device becomes ready
- `device.offline`: When device goes offline

## Project Structure

```
whatsapp-service/
├── config/
│   ├── database.js
│   └── logger.js
├── models/
│   ├── Device.js
│   └── Webhook.js
├── services/
│   ├── whatsapp.js
│   ├── sessions.js
│   └── webhook.js
├── routes/
│   └── routes.js
├── database.sqlite
├── index.js
├── package.json
└── README.md
```

## Environment Variables

| Variable | Default | Description     |
|----------|---------|-----------------|
| PORT     | 3000    | HTTP port      |
| NODE_ENV | development | Environment |

## Database Schema

### Devices Table
| Column      | Type    | Description        |
|-------------|---------|-------------------|
| id          | STRING  | Device UUID       |
| isConnected | BOOLEAN | Connection status |
| qrCode      | TEXT    | Latest QR code   |
| lastSeen    | DATE    | Last activity    |

### Webhooks Table
| Column       | Type    | Description         |
|-------------|---------|---------------------|
| id          | INTEGER | Auto-increment ID   |
| deviceId    | STRING  | Associated device   |
| event       | STRING  | Event to listen for |
| url         | STRING  | Webhook URL         |
| isActive    | BOOLEAN | Webhook status      |
| lastCall    | DATE    | Last delivery time  |

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
- [Sequelize](https://sequelize.org/) - Database ORM