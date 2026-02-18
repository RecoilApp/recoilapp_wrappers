# recoil.js

The **official** Node.js API wrapper for the [RecoilApp](https://recoilapp.com) Bot API — inspired by [discord.js](https://discord.js.org).

Build powerful bots for RecoilApp with a clean, fully typed, object-oriented interface.

---

## Features

- ⚡ **Full TypeScript** — strict typings, enums, interfaces for every entity
- 🏗️ **discord.js-style architecture** — Client → Managers → Structures
- 📦 **Collection caching** — in-memory entity caching with a powerful `Collection` class
- 🔒 **Permission bitfields** — 37 permission flags with preset helper methods
- 🎯 **Intent system** — 16 intents to control what data the bot receives
- 🔄 **Rate limiting** — automatic per-route and global rate limit handling
- 📝 **JSDoc documented** — full documentation on every class, method, and property
- 🛡️ **Error hierarchy** — typed API errors, permission errors, auth errors, rate limit errors

---

## Installation

```bash
npm install recoil.js
```

**Requirements:** Node.js ≥ 18.0.0 (uses native `fetch`)

---

## Quick Start

```typescript
import { RecoilClient, Intents } from 'recoil.js';

const client = new RecoilClient({
  intents: Intents.Flags.Servers | Intents.Flags.ServerMessages | Intents.Flags.MessageContent,
});

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user!.username}`);
  console.log(`📡 Serving ${client.servers.size} servers`);
});

client.on('debug', (info) => {
  console.log(`[DEBUG] ${info}`);
});

client.login(process.env.BOT_TOKEN!);
```

---

## Usage Examples

### Listing Servers

```typescript
const servers = await client.servers.list();
for (const [id, server] of servers) {
  console.log(`${server.name} — ${server.memberCount} members`);
}
```

### Fetching & Sending Messages

```typescript
// Fetch a channel
const channel = await client.servers.cache.first()!.channels.fetch('channel-id');

// Send a message
const message = await channel.send({ content: 'Hello from recoil.js!' });

// Reply to a message
await message.reply({ content: 'This is a threaded reply.' });

// Edit a message
await message.edit('Updated content!');

// Delete a message
await message.delete();
```

### Managing Members

```typescript
const server = await client.servers.fetch('server-id');
const members = await server.members.list({ limit: 50 });

for (const [id, member] of members) {
  console.log(`${member.displayTag} — joined ${member.joinedAt}`);
}

// Kick a member
await server.members.kick('user-id', 'Violated rules');

// Ban a member
await server.bans.create('user-id', {
  reason: 'Spamming',
  delete_message_days: 7,
});
```

### Working with Roles

```typescript
// Create a role
const role = await server.roles.create({
  name: 'VIP',
  color: '#00BFBF',
  is_hoisted: true,
});

// Assign role to member
await server.members.addRole('user-id', role.id);

// Check permissions
if (role.permissions.has('ManageMessages')) {
  console.log('This role can manage messages');
}
```

### Using Permissions

```typescript
import { Permissions } from 'recoil.js';

// Create a permission set
const perms = new Permissions(
  Permissions.Flags.ViewChannels |
  Permissions.Flags.SendMessages |
  Permissions.Flags.ManageMessages
);

// Check specific permissions
perms.has('SendMessages');     // true
perms.has('BanMembers');       // false
perms.isAdministrator;         // false

// Use presets
const modPerms = new Permissions(Permissions.Presets.Moderator);
modPerms.toArray(); // ['ViewChannels', 'SendMessages', 'BanMembers', ...]
```

### Channels, Pins & Threads

```typescript
// Create a channel
const channel = await server.channels.create({
  name: 'bot-commands',
  type: 'text',
  topic: 'Run bot commands here',
});

// Pin a message
await channel.pins.add('message-id');

// Create a thread
const thread = await channel.threads.create({
  name: 'Bug Discussion',
  parent_message_id: 'msg-id',
  auto_archive_minutes: 1440,
});
```

### Reactions

```typescript
// React to a message
await message.react('👍');

// Remove reaction
await message.unreact('👍');

// List all reactions
const reactions = await message.reactions.list();
for (const reaction of reactions) {
  console.log(`${reaction.emoji}: ${reaction.count} reactions`);
}
```

### Invites & Bans

```typescript
// Create an invite
const invite = await server.invites.create({
  max_uses: 10,
  max_age_seconds: 86400, // 24 hours
});
console.log(`Invite URL: ${invite.url}`);

// List bans
const bans = await server.bans.list();
for (const [id, ban] of bans) {
  console.log(`${ban.username} — ${ban.reason ?? 'No reason'}`);
}
```

### Custom Emojis & Webhooks

```typescript
// List emojis
const emojis = await server.emojis.list();
const pepe = emojis.find(e => e.name === 'pepe');

// List webhooks
const webhooks = await server.webhooks.list();
for (const [id, wh] of webhooks) {
  console.log(`${wh.name} → #${wh.channelName}`);
}
```

### Bulk Operations

```typescript
// Bulk delete messages (max 100)
const messages = await channel.messages.list({ limit: 50 });
const deleted = await channel.messages.bulkDelete(messages.toKeyArray());
console.log(`Deleted ${deleted} messages`);
```

### Gateway & API Info

```typescript
const gateway = await client.fetchGateway();
console.log(`Gateway URL: ${gateway.url}`);

const info = await client.fetchApiInfo();
console.log(`API Version: ${info.version}`);
```

---

## Architecture

```
RecoilClient
├── rest: RESTManager          ← HTTP client with rate limiting
├── user: ClientUser           ← The authenticated bot user
├── servers: ServerManager     ← Manage & cache servers
│   └── Server
│       ├── channels: ChannelManager
│       │   └── Channel
│       │       ├── messages: MessageManager
│       │       │   └── Message
│       │       │       └── reactions: ReactionManager
│       │       ├── threads: ThreadManager
│       │       │   └── Thread
│       │       └── pins: PinManager
│       ├── members: MemberManager
│       │   └── Member
│       ├── roles: RoleManager
│       │   └── Role
│       ├── bans: BanManager
│       │   └── Ban
│       ├── invites: InviteManager
│       │   └── Invite
│       ├── emojis: EmojiManager
│       │   └── Emoji
│       └── webhooks: WebhookManager
│           └── Webhook
└── intents: IntentsBitField
```

---

## API Coverage

| Category | Endpoints | Status |
|----------|-----------|--------|
| Bot User | `/@me` GET/PATCH | ✅ |
| Servers | List, Fetch, Leave | ✅ |
| Channels | CRUD | ✅ |
| Messages | CRUD + Bulk Delete | ✅ |
| Members | List, Fetch, Edit, Kick | ✅ |
| Roles | CRUD + Assign/Remove | ✅ |
| Reactions | Add, Remove, List | ✅ |
| Pins | List, Pin, Unpin | ✅ |
| Bans | List, Create, Remove | ✅ |
| Invites | List, Create, Delete | ✅ |
| Threads | List, Create | ✅ |
| Custom Emojis | List | ✅ |
| Webhooks | List | ✅ |
| Gateway | Info | ✅ |
| API Info | Version/Limits | ✅ |

---

## Error Handling

```typescript
import { RecoilAPIError, PermissionError, RateLimitError } from 'recoil.js';

try {
  await channel.send({ content: 'Hello!' });
} catch (error) {
  if (error instanceof PermissionError) {
    console.log(`Missing permissions: ${error.missing.join(', ')}`);
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited! Retry after ${error.retryAfter}ms`);
  } else if (error instanceof RecoilAPIError) {
    console.log(`API Error ${error.status}: ${error.message}`);
  }
}
```

---

## Collection

The `Collection` class extends `Map` with powerful utility methods:

```typescript
const servers = await client.servers.list();

servers.first();           // First server
servers.last();            // Last server
servers.random();          // Random server
servers.find(s => s.name === 'My Server');
servers.filter(s => s.memberCount > 100);
servers.map(s => s.name);
servers.sort((a, b) => b.memberCount - a.memberCount);
servers.partition(s => s.isPublic);  // [public, private]
servers.toArray();         // Server[]
```

---

## Permissions & Intents

### Permission Flags (37 total)

| Flag | Bit | Category |
|------|-----|----------|
| ViewChannels | 0 | General |
| ManageChannels | 1 | General |
| ManageServer | 2 | General |
| ManageRoles | 3 | General |
| ManageEmojis | 4 | General |
| ViewAuditLog | 5 | General |
| CreateInvites | 6 | General |
| ChangeNickname | 7 | General |
| ManageNicknames | 8 | General |
| KickMembers | 9 | Moderation |
| BanMembers | 10 | Moderation |
| ModerateMembers | 11 | Moderation |
| SendMessages | 12 | Text |
| ManageMessages | 17 | Text |
| ... | ... | ... |
| Administrator | 36 | Advanced |

### Intent Flags (16 total)

| Intent | Bit | Privileged? |
|--------|-----|------------|
| Servers | 0 | No |
| ServerMembers | 1 | ⚠️ Yes |
| ServerPresences | 8 | ⚠️ Yes |
| ServerMessages | 9 | No |
| MessageContent | 15 | ⚠️ Yes |
| ... | ... | ... |

---

## Configuration

```typescript
const client = new RecoilClient({
  // Required: which events to receive
  intents: Intents.Flags.Servers | Intents.Flags.ServerMessages,

  // Optional: custom API base URL
  apiBaseUrl: 'https://recoilapp.com/api/v1',

  // Optional: whether to auto-fetch servers on login
  fetchServersOnReady: true,

  // Optional: REST client overrides
  rest: {
    timeout: 15000,       // Request timeout (ms)
    maxRetries: 3,        // Retry attempts on 5xx
    retryDelay: 1000,     // Base delay for exponential backoff
  },
});
```

---

## TypeScript Support

recoil.js is written in TypeScript and ships with full type declarations:

- All classes, methods, and properties have JSDoc documentation
- All API response shapes have typed interfaces
- Enum values for channel types, permissions, intents, etc.
- Generic `Collection<K, V>` class

```typescript
import type {
  Snowflake,
  APIMessage,
  APIServer,
  APIChannel,
  ClientOptions,
} from 'recoil.js';
```

---

## License

MIT © RecoilApp Team
