# RecoilApp — Wrappers

Official API wrapper libraries for building bots on **RecoilApp**.

## recoil.js

The Node.js/TypeScript wrapper for the RecoilApp Bot API.

### Features

- **Typed Client** — Full TypeScript types for all API responses and events
- **REST API** — Methods for servers, channels, messages, members, roles, bans, reactions, pins, threads, emojis, webhooks, invites
- **Gateway** — Socket.IO-based real-time event stream with intent filtering and session resume
- **Interaction Collectors** — Await button clicks with filters, timeouts, and max collection limits
- **Embed Builder** — Fluent API for constructing rich embeds with containers, sections, and action rows
- **Button Builder** — Create interactive buttons with custom IDs or link URLs
- **Permissions** — Bitfield permission utilities for checking and manipulating RBAC flags
- **Events** — 34+ gateway events (MESSAGE_CREATE, MEMBER_JOIN, REACTION_ADD, VOICE_STATE_UPDATE, etc.)

### Installation

```bash
npm install @recoilapp/recoil.js
```

### Quick Start

```typescript
import { RecoilClient } from '@recoilapp/recoil.js';

const client = new RecoilClient();

client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    await client.sendMessage(message.channelId, { content: 'Pong! 🏓' });
  }
});

client.login('your-bot-token');
```

### Project Structure

```
recoil.js/
├── src/
│   ├── client/         # RecoilClient main class
│   ├── gateway/        # WebSocket gateway connection
│   ├── rest/           # REST API methods
│   ├── structures/     # Message, Server, Channel, Member, Role, ButtonInteraction, etc.
│   ├── builders/       # EmbedBuilder, ButtonBuilder, ActionRowBuilder
│   ├── types/          # TypeScript types and API interfaces
│   └── util/           # Events, Intents, Permissions helpers
├── package.json
└── tsconfig.json
```

### Current Version

**v1.0.4**

## License

Proprietary — All rights reserved.
