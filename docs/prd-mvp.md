# 📋 MVP PRD: react-native-adk-chat

## **Minimum Viable Product - Week 1-2**

---

## 🎯 One-Line Goal

> "Working React Native chat app connected to Google ADK in 2 weeks"

---

## ✅ MVP Scope (What We're Building)

### The Absolute Essentials

**A single GitHub repo containing:**

1. **Working Expo app** - Can be cloned and runs immediately
2. **ADK API client** - Makes HTTP calls to ADK `/run` endpoint
3. **Basic chat UI** - Messages display, input field, send button
4. **README** - How to configure and run it

**That's it. Nothing else.**

---

## 🚫 What We're NOT Building (Yet)

- ❌ No streaming
- ❌ No message persistence
- ❌ No themes/customization
- ❌ No CLI tool
- ❌ No NPM package
- ❌ No fancy animations
- ❌ No file uploads
- ❌ No multi-agent support
- ❌ No tests (just make it work first)

---

## 📦 Deliverable Structure

```
react-native-adk-chat/
├── app/
│   └── index.tsx              # Single chat screen
├── src/
│   ├── api/
│   │   ├── adkClient.ts      # HTTP client (~100 lines)
│   │   └── types.ts          # TypeScript types
│   └── components/
│       ├── MessageBubble.tsx  # Message display
│       └── ChatInput.tsx      # Input + send button
├── .env.example               # Config template
├── README.md                  # Setup instructions
├── package.json
└── app.json
```

**Total Lines of Code Target: ~500 lines**

---

## 🎨 UI Requirements

### Design Philosophy:
- **Clean & Neutral** - Professional, not playful
- **White-label Ready** - Easy to rebrand
- **Modern Minimal** - No unnecessary decoration
- **Agnostic** - Works for B2B, B2C, internal tools
- **Accessible** - High contrast, readable

### Design Spec:
```typescript
// User message: Subtle background, clear typography
// AI message: Distinct but neutral styling
// Input: Clean form field, minimal chrome
// Send button: Understated, clear affordance
```

### Visual Style:
- No bright colors (easy to override)
- Neutral grays and black/white base
- Clear visual hierarchy through spacing, not color
- Typography-focused (size, weight, spacing)
- Inspired by: Notion, Linear, Slack (neutral modes)

**No custom fonts. No animations. Stock React Native.**

---

## 🔌 ADK Client Requirements

### Functionality
```typescript
class ADKClient {
  constructor(config: { baseUrl: string; agentId: string })

  async sendMessage(message: string, userId: string): Promise<string>
  // Returns: AI response text
}
```

### Error Handling
- Network errors: Show "Connection failed" message
- API errors: Show "AI unavailable" message
- Timeout: 30 seconds, then show error

### That's It
No retries. No caching. No streaming. Just basic HTTP POST.

---

## 📱 App Flow

### Happy Path (30 seconds)
1. User clones repo
2. User runs `npm install && npx expo start`
3. User scans QR code
4. User types "Hello"
5. User taps Send
6. AI responds "Hi! How can I help?"
7. **SUCCESS** ✅

### Configuration
```bash
# .env file (copy from .env.example)
ADK_BASE_URL=https://your-adk-endpoint.com
ADK_AGENT_ID=your-agent-id
```

---

## ✅ Definition of Done

### Week 1 End
- [x] Repo created on GitHub
- [ ] Basic Expo app runs
- [ ] ADK client makes successful API call
- [ ] Chat UI displays messages
- [ ] Can send/receive one message

### Week 2 End (MVP Complete)
- [ ] Clean, functional chat UI
- [ ] Multiple messages work correctly
- [ ] Error states handled
- [ ] README with setup instructions
- [ ] .env.example with placeholders
- [ ] Demo GIF/video in README
- [ ] Posted to Twitter/Show HN

---

## 📚 Documentation (MVP)

### README Structure
```markdown
# react-native-adk-chat

Clean, neutral chat UI for Google ADK agents. [GIF HERE]

## Quick Start

1. Clone: `git clone ...`
2. Install: `npm install`
3. Configure: Copy `.env.example` to `.env` and add your ADK endpoint
4. Run: `npx expo start`
5. Scan QR code

## Configuration

Add to `.env`:
- ADK_BASE_URL - Your ADK agent endpoint
- ADK_AGENT_ID - Your agent ID

## Features

- ✅ Chat with ADK agents
- ✅ Clean, neutral UI (white-label ready)
- ✅ Expo/iOS/Android support
- ✅ TypeScript

## Design Philosophy

Built to be neutral and white-label friendly:
- Minimal styling, easy to customize
- No opinionated colors or branding
- Professional for B2B, clean for B2C
- Works with any company's design system

## Coming Soon

- Streaming responses
- Message persistence
- Theme system
- NPM package

## License

MIT
```

**Total README length: ~120 lines**

---

## 🎯 Success Metrics (MVP Launch)

### Week 2
- [ ] Repo is public on GitHub
- [ ] 5 people can successfully run it
- [ ] Show HN post gets 50+ upvotes
- [ ] 3+ GitHub stars

**That's success. Everything else comes later.**

---

## ⚡ Tech Stack (Locked In)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.3",
    "expo-constants": "latest"
  }
}
```

**Zero UI libraries. Zero animation libraries. Pure React Native.**

---

## 🚀 Development Workflow

### Day 1-2: Setup
- Create Expo project
- Basic TypeScript config
- Git repo setup

### Day 3-4: ADK Client
- HTTP client implementation
- Type definitions
- Test with real ADK endpoint

### Day 5-7: UI Components
- Message bubble component
- Message list with ScrollView
- Input component
- Wire everything together

### Day 8-10: Integration
- Connect UI to client
- Error handling
- Loading states
- Polish

### Day 11-12: Launch Prep
- README with GIF
- .env.example
- Clean up code
- Test on real devices

### Day 13-14: Launch
- Make repo public
- Post to Show HN
- Post to Twitter
- Share in communities

---

## 🎨 MVP UI Spec (Exact)

### Colors (Neutral & White-label Ready)
```typescript
const colors = {
  // Message colors - easily overridable
  userMessageBg: '#F5F5F5',       // Light gray (90% neutral)
  userMessageText: '#1A1A1A',     // Near black

  aiMessageBg: '#FFFFFF',          // White
  aiMessageText: '#1A1A1A',        // Near black
  aiMessageBorder: '#E8E8E8',      // Subtle border

  // Container colors
  background: '#FFFFFF',           // White
  inputBg: '#FAFAFA',             // Off-white
  inputBorder: '#E0E0E0',         // Light gray

  // UI elements
  textPrimary: '#1A1A1A',         // Near black
  textSecondary: '#6B6B6B',       // Gray
  textPlaceholder: '#A0A0A0',     // Light gray

  // Actions - minimal accent
  sendButton: '#2A2A2A',          // Dark gray (not blue!)
  sendButtonDisabled: '#E0E0E0',  // Light gray

  // States
  divider: '#F0F0F0',             // Very light gray
  error: '#DC2626',               // Red (only for errors)
}
```

### Typography Hierarchy
```typescript
const typography = {
  // Message text
  messageSize: 15,
  messageLineHeight: 22,
  messageWeight: '400',

  // Metadata
  timestampSize: 11,
  timestampWeight: '400',

  // Input
  inputSize: 16,
  inputLineHeight: 22,

  // Headers
  headerSize: 17,
  headerWeight: '600',
}
```

### Spacing System (8px base)
```typescript
const spacing = {
  xs: 4,   // Tight spacing
  sm: 8,   // Standard spacing
  md: 16,  // Medium spacing
  lg: 24,  // Large spacing
  xl: 32,  // Extra large spacing
}
```

### Layout (Clean & Minimal)
```
┌─────────────────────────────────┐
│  Chat                           │ ← Header (simple text, 56px)
├─────────────────────────────────┤
│                                 │
│  AI Agent                       │ ← Role label (optional)
│  ┌───────────────────────────┐ │
│  │ Hello! How can I help you │ │ ← AI message (white bg)
│  │ with your project today?  │ │   Subtle border
│  └───────────────────────────┘ │
│  9:41 AM                        │ ← Timestamp (gray)
│                                 │
│                           You   │ ← Role label
│  ┌───────────────────────────┐ │
│  │ I need help setting up    │ │ ← User message (light gray)
│  │ authentication            │ │   No border
│  └───────────────────────────┘ │
│                        9:42 AM  │
│                                 │
│  AI Agent                       │
│  ┌───────────────────────────┐ │
│  │ I can help with that...   │ │
│  └───────────────────────────┘ │
│  9:42 AM                        │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────┐  ┌───┐│ ← Input area (64px)
│ │ Type a message...   │  │ → ││   Clean text field
│ └─────────────────────┘  └───┘│   Simple send icon
└─────────────────────────────────┘
```

### Message Styling
```
┌──────────────────────────────┐
│ AI Agent                     │ ← 11px, gray-600
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │  Message content here    │ │ ← 15px, black
│ │  with multiple lines     │ │   22px line-height
│ │                          │ │   16px padding
│ └──────────────────────────┘ │   8px border-radius
│ 9:41 AM                      │ ← 11px, gray-500
└──────────────────────────────┘
     └─ 8px gap
```

### Dimensions
- Message container padding: 16px
- Message text padding: 16px all sides
- Message max width: 85% (more generous)
- Message border: 1px solid (AI messages only)
- Message border radius: 8px (subtle, not bubbly)
- Input height: 64px
- Message vertical spacing: 12px
- Screen padding: 16px horizontal
- Role label spacing: 4px below label, 8px below message
- Timestamp margin: 4px top

### Border & Shadow (Subtle Depth)
- AI message border: 1px solid #E8E8E8
- User message border: none (relies on background)
- No shadows (flat design)
- Input border: 1px solid #E0E0E0

### White-Label Friendly Design Decisions

**Why This Design Works for Any Brand:**

1. **Neutral Base Colors**
   - Grays instead of brand colors
   - Easy to override with company colors
   - Professional for B2B, clean for B2C

2. **Minimal Visual Identity**
   - No distinct "style" (no rounded bubbles, no specific look)
   - Typography-focused (works with any font)
   - Uses spacing for hierarchy, not color

3. **Easy Customization Points**
   ```typescript
   // Companies can easily change:
   - Message background colors
   - Border colors
   - Text colors
   - Send button color
   - Font family
   ```

4. **Examples of Customization**
   ```typescript
   // Enterprise SaaS (Professional)
   colors.userMessageBg = '#F8F9FA';
   colors.sendButton = '#1A56DB';

   // Consumer App (Friendly)
   colors.userMessageBg = '#FEF3C7';
   colors.aiMessageBg = '#DBEAFE';
   colors.sendButton = '#3B82F6';

   // Internal Tool (Minimal)
   // Keep defaults - already perfect!
   ```

5. **What We Avoid**
   - ❌ Bright accent colors (screams "default theme")
   - ❌ Rounded bubble shapes (too consumer-y)
   - ❌ Shadows/gradients (hard to match brand)
   - ❌ Emojis/illustrations (not professional)
   - ❌ Specific design language (Material/iOS/etc)

---

## 🔧 Code Structure (MVP)

### src/api/types.ts (~30 lines)
```typescript
export interface ADKConfig {
  baseUrl: string;
  agentId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ADKResponse {
  content: string;
}
```

### src/api/adkClient.ts (~100 lines)
```typescript
export class ADKClient {
  private config: ADKConfig;

  constructor(config: ADKConfig) {
    this.config = config;
  }

  async sendMessage(message: string, userId: string): Promise<string> {
    // HTTP POST to ADK /run endpoint
    // Return response text
    // Throw on error
  }
}
```

### app/index.tsx (~200 lines)
```typescript
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // Add user message
    // Call ADK client
    // Add AI response
    // Handle errors
  };

  return (
    <View>
      <FlatList /> {/* Messages */}
      <ChatInput />
    </View>
  );
}
```

### src/components/MessageBubble.tsx (~50 lines)
- Simple View with Text
- Conditional styling based on role

### src/components/ChatInput.tsx (~50 lines)
- TextInput + TouchableOpacity
- Send disabled when empty

**Total: ~430 lines of actual code**

---

## 🎬 Launch Day Checklist

### Pre-Launch (Day 13)
- [ ] Code is clean and commented
- [ ] README has demo GIF
- [ ] .env.example is clear
- [ ] Tested on real iPhone
- [ ] Tested on real Android
- [ ] No console errors
- [ ] Works with real ADK endpoint

### Launch (Day 14)
- [ ] Make repo public
- [ ] Post to Show HN with title: "Show HN: React Native chat UI for Google's new Agent Development Kit"
- [ ] Tweet with GIF
- [ ] Post in r/reactnative
- [ ] Post in Expo Discord
- [ ] Add to awesome-react-native list

### Post-Launch (Day 15+)
- [ ] Respond to GitHub issues
- [ ] Answer HN comments
- [ ] Note feature requests for v2
- [ ] Start planning library extraction

---

## 💡 What Makes This An MVP

1. **One thing well:** Chat with ADK agents
2. **No bells/whistles:** Just the core functionality
3. **Runnable today:** No waiting for perfect
4. **Feedback-ready:** Real users can try it
5. **Evolvable:** Can build on this foundation

---

## 🎯 Success = Learning

### What We Learn From MVP
- Does anyone actually want this?
- What's the first thing people ask for?
- What breaks first?
- What's confusing in setup?
- What features matter most?

**Then we build v2 based on real feedback.**

---

## 🚀 Post-MVP Roadmap (Not Now, But Soon)

### Version 0.2.0 (Based on Feedback)
- Top 3 requested features
- Fix bugs from MVP
- Better error messages

### Version 1.0.0 (Library)
- Extract to NPM package
- CLI tool: `npx create-adk-chat`
- Actual tests
- Proper documentation site

**But first: Ship the MVP. Get feedback. Iterate.**

---

## 📊 MVP Cost

- **Time:** 2 weeks (1 developer)
- **Money:** $0 (free tier everything)
- **Risk:** Low (just time investment)
- **Reward:** First-mover in new space

---

## ✅ Final MVP Checklist

**The app must:**
- [ ] Run without errors
- [ ] Send a message to ADK
- [ ] Display the response
- [ ] Work on iOS and Android
- [ ] Have clear README

**The developer experience must:**
- [ ] Take <5 minutes to set up
- [ ] Have <3 configuration steps
- [ ] Show errors clearly
- [ ] Feel fast and responsive

**If those work, we ship it.** 🚀

---

## 🎯 Remember

> "Perfect is the enemy of shipped."

Get it working. Get it public. Get feedback. Then make it better.

**MVP = Minimum VIABLE Product**
Not minimum features. Minimum to be VIABLE.

---

**Ready to build? Start with Day 1.**
