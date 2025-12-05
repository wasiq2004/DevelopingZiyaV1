# Ziya Voice AGI Application

A powerful voice-based AI agent platform with support for multiple Text-to-Speech (TTS) providers.

## Features

- 🎙️ **Real-time Voice Conversations** - Powered by Deepgram STT and advanced TTS
- 🤖 **AI-Powered Agents** - Configurable AI agents with custom personalities
- 🔄 **Dual TTS Provider Support** - Switch between ElevenLabs and Sarvam.ai
- 🌍 **Multi-language Support** - Support for English, Hindi, and other Indian languages
- 📞 **Twilio Integration** - Seamless phone call handling
- 💬 **WebSocket Streaming** - Low-latency audio streaming

---

## Text-to-Speech (TTS) Integration

This application supports two TTS providers:

### 1. **ElevenLabs** (Default)
- High-quality, natural-sounding voices
- Wide range of voice options
- Excellent for English and international languages
- Low latency with streaming support

### 2. **Sarvam.ai** (New)
- Specialized in Indian languages
- Natural-sounding Indian voices
- Support for Hindi, Tamil, Telugu, and more
- Cost-effective alternative

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Gemini API (for LLM)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# ElevenLabs TTS
VITE_ELEVEN_LABS_API_KEY=your_elevenlabs_api_key_here
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# API Base URL
VITE_API_BASE_URL=http://localhost:3000

# TTS Provider Selection
# Options: elevenlabs, sarvam
TTS_PROVIDER=elevenlabs

# Sarvam TTS Configuration (only needed if using Sarvam)
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_TTS_LANGUAGE=en-IN
SARVAM_TTS_SPEAKER=anushka
SARVAM_TTS_FORMAT=mp3
```

### Switching TTS Providers

To switch between TTS providers, simply change the `TTS_PROVIDER` environment variable:

**Use ElevenLabs:**
```env
TTS_PROVIDER=elevenlabs
```

**Use Sarvam:**
```env
TTS_PROVIDER=sarvam
```

After changing the provider, restart your application for the changes to take effect.

---

## Sarvam TTS Configuration

### Supported Languages

Sarvam.ai supports multiple Indian languages:

| Language Code | Language Name |
|--------------|---------------|
| `en-IN` | English (India) |
| `hi-IN` | Hindi |
| `ta-IN` | Tamil |
| `te-IN` | Telugu |
| `kn-IN` | Kannada |
| `ml-IN` | Malayalam |
| `bn-IN` | Bengali |
| `gu-IN` | Gujarati |
| `mr-IN` | Marathi |
| `pa-IN` | Punjabi |

### Supported Voices/Speakers

| Speaker Name | Description |
|-------------|-------------|
| `anushka` | Female voice (English/Hindi) |
| `abhilash` | Male voice (English/Hindi) |
| `chitra` | Female voice (South Indian languages) |
| `meera` | Female voice (Hindi) |
| `arvind` | Male voice (Hindi) |

### Audio Formats

Sarvam supports the following output formats:
- `mp3` - MP3 audio (default)
- `wav` - WAV audio
- `pcm` - Raw PCM audio

**Note:** The application automatically converts Sarvam output to `ulaw_8000` format for Twilio compatibility.

---

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MySQL database
- API keys for:
  - Google Gemini
  - ElevenLabs (for ElevenLabs TTS)
  - Sarvam.ai (for Sarvam TTS)
  - Deepgram (for STT)
  - Twilio (for phone calls)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ziya-voice-agent-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate:schema
   ```

5. **Start the development server:**
   ```bash
   npm run dev:full
   ```

---

## Usage Examples

### Using TTS in Your Code

```javascript
const { generateTTS } = require('./server/services/tts_controller.js');

// The controller automatically uses the provider specified in TTS_PROVIDER

// For ElevenLabs (when TTS_PROVIDER=elevenlabs)
const audio = await generateTTS("Hello world", {
    voiceId: "21m00Tcm4TlvDq8ikWAM"
});

// For Sarvam (when TTS_PROVIDER=sarvam)
const audio = await generateTTS("नमस्ते", {
    language: "hi-IN",
    speaker: "anushka"
});

// Play or stream the audio
playAudio(audio);
```

### Direct Provider Usage

If you need to use a specific provider regardless of the environment variable:

```javascript
// Use Sarvam directly
const { sarvamTTS } = require('./server/services/tts_sarvam.js');

const audio = await sarvamTTS("Hello from Sarvam", {
    language: "en-IN",
    speaker: "anushka",
    format: "mp3"
});
```

---

## Testing

### Run All Tests

```bash
npm run test:sarvam-tts
```

### Test Specific Provider

**Test ElevenLabs:**
```bash
TTS_PROVIDER=elevenlabs npm run test:sarvam-tts
```

**Test Sarvam:**
```bash
TTS_PROVIDER=sarvam npm run test:sarvam-tts
```

Test output files will be saved to the `output/` directory.

---

## Troubleshooting

### Common Issues

#### 1. "SARVAM_API_KEY not configured"

**Solution:** Make sure you've added your Sarvam API key to the `.env` file:
```env
SARVAM_API_KEY=your_actual_api_key_here
```

#### 2. "Network error: Unable to reach Sarvam API"

**Possible causes:**
- No internet connection
- Firewall blocking the request
- Sarvam API is down

**Solution:** Check your internet connection and try again. Verify Sarvam API status at their website.

#### 3. "Authentication failed: Invalid Sarvam API key"

**Solution:** Verify your API key is correct. Get a new key from [Sarvam.ai](https://sarvam.ai).

#### 4. "Rate limit exceeded"

**Solution:** You've made too many requests. Wait a few minutes or upgrade your Sarvam plan.

#### 5. Audio not playing in Twilio calls

**Solution:** Ensure the audio format is compatible. The application automatically converts to `ulaw_8000` for Twilio, but verify the conversion is working correctly.

#### 6. Provider not switching

**Solution:** 
- Make sure you've updated the `TTS_PROVIDER` variable in `.env`
- Restart your application after changing the provider
- Check the logs to confirm which provider is being used

---

## Performance Considerations

### Latency Comparison

| Provider | Average Latency | Notes |
|----------|----------------|-------|
| ElevenLabs | ~500-800ms | Faster with streaming |
| Sarvam | ~800-1200ms | May vary by region |

### Quality Comparison

| Provider | Voice Quality | Language Support |
|----------|--------------|------------------|
| ElevenLabs | Excellent | Global languages |
| Sarvam | Excellent for Indian languages | Indian languages + English |

### Cost Comparison

- **ElevenLabs:** Character-based pricing
- **Sarvam:** Character-based pricing (generally more affordable for Indian languages)

**Recommendation:** Use Sarvam for Indian language content and ElevenLabs for international languages.

---

## API Reference

### `generateTTS(text, options)`

Unified TTS function that routes to the configured provider.

**Parameters:**
- `text` (string) - Text to convert to speech
- `options` (object) - Provider-specific options
  - For ElevenLabs:
    - `voiceId` (string) - ElevenLabs voice ID
  - For Sarvam:
    - `language` (string) - Language code (e.g., 'en-IN', 'hi-IN')
    - `speaker` (string) - Speaker/voice name
    - `format` (string) - Audio format ('mp3', 'wav', 'pcm')

**Returns:** `Promise<Buffer>` - Audio buffer in ulaw_8000 format

**Example:**
```javascript
const audio = await generateTTS("Hello world", { voiceId: "21m00Tcm4TlvDq8ikWAM" });
```

---

### `sarvamTTS(text, options)`

Direct Sarvam TTS function.

**Parameters:**
- `text` (string) - Text to convert to speech
- `options` (object)
  - `language` (string) - Language code (default: 'en-IN')
  - `speaker` (string) - Speaker name (default: 'anushka')
  - `format` (string) - Audio format (default: 'mp3')

**Returns:** `Promise<Buffer>` - Audio buffer

**Example:**
```javascript
const audio = await sarvamTTS("नमस्ते", {
    language: "hi-IN",
    speaker: "abhilash",
    format: "mp3"
});
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run server` | Start backend server |
| `npm run dev:full` | Start both frontend and backend |
| `npm run test:sarvam-tts` | Run Sarvam TTS tests |

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

## License

[Your License Here]

---

## Support

For issues or questions:
- Open an issue on GitHub
- Contact support at [your-email@example.com]

---

## Acknowledgments

- **ElevenLabs** - Premium TTS provider
- **Sarvam.ai** - Indian language TTS specialist
- **Deepgram** - Speech-to-text provider
- **Google Gemini** - LLM provider
- **Twilio** - Telephony infrastructure
