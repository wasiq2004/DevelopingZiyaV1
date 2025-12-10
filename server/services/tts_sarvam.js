const nodeFetch = require("node-fetch");
const { WaveFile } = require('wavefile');

/**
 * Sarvam TTS Service
 * Provides text-to-speech functionality using Sarvam.ai API
 */

/**
 * Generate speech audio using Sarvam TTS API
 * @param {string} text - The text to convert to speech
 * @param {Object} options - TTS options
 * @param {string} options.language - Target language code (default: en-IN)
 * @param {string} options.speaker - Speaker/voice name (default: anushka)
 * @param {string} options.format - Audio format: mp3, wav, pcm (default: mp3)
 * @returns {Promise<Buffer>} - Audio buffer in ulaw_8000 format for Twilio compatibility
 */
async function sarvamTTS(text, options = {}) {
    try {
        const apiKey = process.env.SARVAM_API_KEY;

        if (!apiKey) {
            throw new Error("SARVAM_API_KEY not configured in environment variables");
        }

        // Default options from environment or fallback values
        // CHECK: Changed default to 'wav' to support pure JS conversion (wavefile) without ffmpeg
        const language = options.language || process.env.SARVAM_TTS_LANGUAGE || "en-IN";
        const speaker = options.speaker || process.env.SARVAM_TTS_SPEAKER || "anushka";
        const format = options.format || process.env.SARVAM_TTS_FORMAT || "wav";

        console.log(`[TTS] Using provider: Sarvam`);
        console.log(`[TTS] Sending request...`);
        console.log(`   Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        console.log(`   Language: ${language}`);
        console.log(`   Speaker: ${speaker}`);
        console.log(`   Format: ${format}`);

        const response = await nodeFetch(
            "https://api.sarvam.ai/text-to-speech",
            {
                method: "POST",
                headers: {
                    "api-subscription-key": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: [text],
                    target_language_code: language,
                    speaker: speaker,
                    model: "bulbul:v2",
                    enable_preprocessing: true,
                    // Ensure backend returns WAV if we requested it
                    // Sarvam api might not support 'target_format' param directly in the body usually? 
                    // Checking docs: usually it sends wav/mp3 based on Accept header or params.
                    // But if not, we handle what we get.
                }),
            }
        );


        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[TTS] Sarvam API error: ${response.status} - ${response.statusText}`);
            console.error(`[TTS] Error details: ${errorText}`);
            throw new Error(`Sarvam API error: ${response.status} - ${response.statusText}`);
        }

        // Sarvam returns JSON with base64 audio
        const jsonResponse = await response.json();
        console.log(`[TTS] Response received from Sarvam`);

        // Extract base64 audio from response
        const base64Audio = jsonResponse.audios && jsonResponse.audios[0];
        if (!base64Audio) {
            throw new Error('No audio data in Sarvam response');
        }

        // Convert base64 to buffer
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        console.log(`[TTS] Audio received: ${audioBuffer.length} bytes`);

        // Check actual audio format by inspecting magic numbers
        // This is important because even if we say 'wav', we verify what we got.
        const actualFormat = detectAudioFormat(audioBuffer);
        console.log(`[TTS] Detected audio format: ${actualFormat} (requested: ${format})`);

        // Convert to ulaw_8000 format for Twilio compatibility
        // If skipConversion is true, return the original buffer
        if (options.skipConversion) {
            console.log(`[TTS] Skipping conversion, returning ${format}`);
            return audioBuffer;
        }

        const ulawBuffer = await convertToUlaw(audioBuffer, actualFormat);

        console.log(`[TTS] Converted to ulaw_8000: ${ulawBuffer.length} bytes`);
        return ulawBuffer;

    } catch (error) {
        console.error("[TTS] Error in Sarvam TTS:", error.message);

        // Provide specific error messages for common issues
        if (error.message.includes("SARVAM_API_KEY")) {
            throw new Error("Sarvam API key is missing. Please set SARVAM_API_KEY in your environment variables.");
        } else if (error.message.includes("ENOTFOUND") || error.message.includes("ETIMEDOUT")) {
            throw new Error("Network error: Unable to reach Sarvam API. Please check your internet connection.");
        } else if (error.message.includes("401")) {
            throw new Error("Authentication failed: Invalid Sarvam API key.");
        } else if (error.message.includes("429")) {
            throw new Error("Rate limit exceeded: Too many requests to Sarvam API.");
        }

        throw error;
    }
}

/**
 * Detect audio format by inspecting magic numbers (file signatures)
 * @param {Buffer} buffer - Audio buffer to inspect
 * @returns {string} - Detected format: 'mp3', 'wav', 's16le', or 'unknown'
 */
function detectAudioFormat(buffer) {
    if (buffer.length < 4) return 'unknown';

    // Check for MP3 (ID3 tag or MPEG frame sync)
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
        return 'mp3'; // ID3v2 tag
    }
    if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
        return 'mp3'; // MPEG frame sync
    }

    // Check for WAV (RIFF header)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        return 'wav'; // RIFF
    }

    // If no recognizable header, assume raw PCM (signed 16-bit little-endian)
    return 's16le';
}

/**
 * Convert audio buffer to ulaw_8000 format for Twilio compatibility
 * @param {Buffer} audioBuffer - Input audio buffer
 * @param {string} sourceFormat - Source audio format (mp3, wav, pcm)
 * @returns {Promise<Buffer>} - Audio buffer in ulaw_8000 format
 */
async function convertToUlaw(audioBuffer, sourceFormat) {
    try {
        console.log(`[TTS] Converting ${sourceFormat} (${audioBuffer.length} bytes) to ulaw_8000...`);

        // OPTION 1: Use wavefile for WAV (Pure JS, no ffmpeg needed)
        // This is preferred if input is WAV, as we often lack ffmpeg on standard environments
        if (sourceFormat === 'wav' || sourceFormat === 'unknown') {
            try {
                const wav = new WaveFile();

                if (sourceFormat === 'wav') {
                    // Load existing WAV
                    wav.fromBuffer(audioBuffer);
                } else {
                    // If unknown, we try to parse it as WAV first. If it fails, we assume Raw PCM.
                    try {
                        wav.fromBuffer(audioBuffer);
                    } catch (e) {
                        // Fallback: Assume Raw PCM: 24kHz, 1 channel, 16-bit (Sarvam typical default)
                        console.log("[TTS] Could not parse as WAV, assuming Raw PCM 24kHz 16-bit");
                        wav.fromScratch(1, 24000, '16', audioBuffer);
                    }
                }

                // Check formatting
                const fmt = wav.fmt;
                console.log(`[TTS] Wave format: ${fmt.sampleRate}Hz, ${fmt.numChannels} channel(s), ${fmt.bitsPerSample}-bit`);

                // Resample to 8000Hz if needed
                if (fmt.sampleRate !== 8000) {
                    wav.toSampleRate(8000);
                }

                // Extract samples
                // getSamples returns Float64Array by default, or Int16Array if specified?
                // Actually wavefile returns Float64Array for 'toSampleRate' output usually unless configured?
                // Let's safe-guard: extract as Int16.
                let samples = wav.getSamples(false, Int16Array);

                // If stereo (array of arrays), mix down or take first channel
                if (Array.isArray(samples) && samples.length > 0 && samples[0].length !== undefined && typeof samples[0] !== 'number') {
                    console.log(`[TTS] Multiple channels detected, using first channel`);
                    samples = samples[0];
                }

                const length = samples.length;
                const ulawBuffer = Buffer.alloc(length);

                // Manual encoding loop (very fast in JS V8)
                for (let i = 0; i < length; i++) {
                    let sample = samples[i];
                    ulawBuffer[i] = encodeMuLaw(sample);
                }

                console.log(`[TTS] Conversion successful (manual encode): ${ulawBuffer.length} bytes`);
                return ulawBuffer;

            } catch (waveError) {
                console.error(`[TTS] wavefile conversion failed:`, waveError);
                // If wavefile failed, we might try ffmpeg below, or throw if input was really bad
                if (sourceFormat !== 'mp3') {
                    // If it wasn't MP3, and wavefile failed, ffmpeg likely won't save us if the file is corrupt 
                    // BUT if it's some weird encoding, maybe. 
                    console.log("[TTS] Attempting fallback to ffmpeg...");
                }
            }
        }

        // OPTION 2: Use ffmpeg (Required for MP3, or fallback)
        const { spawn } = require('child_process');
        return new Promise((resolve, reject) => {
            let ffmpegArgs;

            if (sourceFormat === 's16le') {
                // Raw PCM fallback
                ffmpegArgs = [
                    '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0',
                    '-ar', '8000', '-ac', '1', '-acodec', 'pcm_mulaw', '-f', 'mulaw',
                    '-loglevel', 'error', 'pipe:1'
                ];
            } else {
                // MP3 or WAV (if wavefile failed)
                ffmpegArgs = [
                    '-i', 'pipe:0',
                    '-ar', '8000', '-ac', '1', '-acodec', 'pcm_mulaw', '-f', 'mulaw',
                    '-af', 'volume=2.0',
                    '-loglevel', 'error', 'pipe:1'
                ];
            }

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);

            const chunks = [];
            let stderrOutput = '';

            ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
            ffmpeg.stderr.on('data', (data) => stderrOutput += data.toString());

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    const ulawBuffer = Buffer.concat(chunks);
                    console.log(`[TTS] Conversion successful (using ffmpeg): ${ulawBuffer.length} bytes`);
                    resolve(ulawBuffer);
                } else {
                    console.error(`[TTS] ffmpeg failed with code ${code}`);
                    // Don't crash entire process, but reject promise
                    reject(new Error(`ffmpeg exited with code ${code}: ${stderrOutput}`));
                }
            });

            ffmpeg.on('error', (error) => {
                // IMPORTANT: If ffmpeg is missing (ENOENT), this fires.
                console.error(`[TTS] ffmpeg process error (is ffmpeg installed?):`, error.message);
                reject(new Error(`ffmpeg process error: ${error.message}`));
            });

            // Write input buffer to ffmpeg stdin
            ffmpeg.stdin.write(audioBuffer);
            ffmpeg.stdin.end();
        });

    } catch (error) {
        console.error("[TTS] Error converting audio format:", error.message);
        throw new Error(`Audio format conversion failed: ${error.message}`);
    }
}

/**
 * Encode a single 16-bit PCM sample to u-law
 * @param {number} sample - Signed 16-bit integer
 * @returns {number} - 8-bit u-law encoded byte
 */
function encodeMuLaw(sample) {
    const BIAS = 0x84;
    const CLIP = 32635;
    let sign, exponent, mantissa, ulawbyte;

    // Get sign
    sign = (sample >> 8) & 0x80;
    if (sign !== 0) sample = -sample;

    // Clip magnitude
    if (sample > CLIP) sample = CLIP;

    sample += BIAS;

    // Determine exponent
    exponent = 7;
    for (let exp = 0; exp < 8; exp++) {
        if (sample < (1 << (exp + 5))) {
            exponent = exp;
            break; // Found exponent
        }
    }
    // Correction: the loop above finds exponent such that sample < 2^(exp+5)
    // Wait, let's use the explicit check logic which is safer
    if (sample > 0x7FFF) exponent = 7;
    else if (sample > 0x3FFF) exponent = 6;
    else if (sample > 0x1FFF) exponent = 5;
    else if (sample > 0x0FFF) exponent = 4;
    else if (sample > 0x07FF) exponent = 3;
    else if (sample > 0x03FF) exponent = 2;
    else if (sample > 0x01FF) exponent = 1;
    else exponent = 0;

    // Determine mantissa
    mantissa = (sample >> (exponent + 3)) & 0x0F;

    // Assemble u-law byte
    ulawbyte = ~(sign | (exponent << 4) | mantissa);

    return ulawbyte & 0xFF;
}

module.exports = {
    sarvamTTS,
};

