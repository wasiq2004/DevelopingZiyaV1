/**
 * Test suite for Sarvam TTS integration
 * Tests basic functionality, provider switching, and error handling
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');

// Import TTS modules
const { sarvamTTS } = require('../services/tts_sarvam.js');
const { generateTTS } = require('../services/tts_controller.js');

// Test configuration
const TEST_OUTPUT_DIR = path.join(__dirname, '..', '..', 'output');
const TEST_TEXT = "Hello, this is a Sarvam test message.";

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
        fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
        console.log(`✅ Created output directory: ${TEST_OUTPUT_DIR}`);
    }
}

/**
 * Test 1: Basic Sarvam TTS functionality
 */
async function testSarvamTTSBasic() {
    console.log('\n=== Test 1: Basic Sarvam TTS ===');

    try {
        const startTime = Date.now();
        const audioBuffer = await sarvamTTS(TEST_TEXT, {
            language: 'en-IN',
            speaker: 'anushka',
            format: 'mp3'
        });
        const duration = Date.now() - startTime;

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Audio buffer is empty');
        }

        // Save to file
        const outputPath = path.join(TEST_OUTPUT_DIR, 'sarvam_test.mp3');
        fs.writeFileSync(outputPath, audioBuffer);

        console.log(`✅ Test passed!`);
        console.log(`   Audio size: ${audioBuffer.length} bytes`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Output: ${outputPath}`);

        return true;
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test 2: Provider switching - ElevenLabs mode
 */
async function testProviderSwitchingElevenLabs() {
    console.log('\n=== Test 2: Provider Switching - ElevenLabs ===');

    // Temporarily set provider to ElevenLabs
    const originalProvider = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = 'elevenlabs';

    try {
        const startTime = Date.now();
        const audioBuffer = await generateTTS(TEST_TEXT, {
            voiceId: '21m00Tcm4TlvDq8ikWAM' // Default ElevenLabs voice
        });
        const duration = Date.now() - startTime;

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Audio buffer is empty');
        }

        // Save to file
        const outputPath = path.join(TEST_OUTPUT_DIR, 'elevenlabs_test.mp3');
        fs.writeFileSync(outputPath, audioBuffer);

        console.log(`✅ Test passed!`);
        console.log(`   Provider: ElevenLabs`);
        console.log(`   Audio size: ${audioBuffer.length} bytes`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Output: ${outputPath}`);

        return true;
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    } finally {
        // Restore original provider
        process.env.TTS_PROVIDER = originalProvider;
    }
}

/**
 * Test 3: Provider switching - Sarvam mode
 */
async function testProviderSwitchingSarvam() {
    console.log('\n=== Test 3: Provider Switching - Sarvam ===');

    // Temporarily set provider to Sarvam
    const originalProvider = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = 'sarvam';

    try {
        const startTime = Date.now();
        const audioBuffer = await generateTTS(TEST_TEXT, {
            language: 'en-IN',
            speaker: 'anushka'
        });
        const duration = Date.now() - startTime;

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Audio buffer is empty');
        }

        // Save to file
        const outputPath = path.join(TEST_OUTPUT_DIR, 'sarvam_controller_test.mp3');
        fs.writeFileSync(outputPath, audioBuffer);

        console.log(`✅ Test passed!`);
        console.log(`   Provider: Sarvam`);
        console.log(`   Audio size: ${audioBuffer.length} bytes`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Output: ${outputPath}`);

        return true;
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        return false;
    } finally {
        // Restore original provider
        process.env.TTS_PROVIDER = originalProvider;
    }
}

/**
 * Test 4: Error handling - Missing API key
 */
async function testErrorHandlingMissingKey() {
    console.log('\n=== Test 4: Error Handling - Missing API Key ===');

    // Temporarily remove API key
    const originalKey = process.env.SARVAM_API_KEY;
    delete process.env.SARVAM_API_KEY;

    try {
        await sarvamTTS(TEST_TEXT);
        console.error(`❌ Test failed: Should have thrown error for missing API key`);
        return false;
    } catch (error) {
        if (error.message.includes('SARVAM_API_KEY')) {
            console.log(`✅ Test passed! Correctly caught missing API key error`);
            console.log(`   Error: ${error.message}`);
            return true;
        } else {
            console.error(`❌ Test failed: Wrong error message: ${error.message}`);
            return false;
        }
    } finally {
        // Restore API key
        process.env.SARVAM_API_KEY = originalKey;
    }
}

/**
 * Test 5: Multi-language support
 */
async function testMultiLanguageSupport() {
    console.log('\n=== Test 5: Multi-language Support ===');

    const languages = [
        { code: 'en-IN', text: 'Hello, how are you?', speaker: 'anushka' },
        { code: 'hi-IN', text: 'नमस्ते, आप कैसे हैं?', speaker: 'abhilash' },
    ];

    let allPassed = true;

    for (const lang of languages) {
        try {
            console.log(`\n  Testing ${lang.code}...`);
            const audioBuffer = await sarvamTTS(lang.text, {
                language: lang.code,
                speaker: lang.speaker,
                format: 'mp3'
            });

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Audio buffer is empty');
            }

            const outputPath = path.join(TEST_OUTPUT_DIR, `sarvam_${lang.code}.mp3`);
            fs.writeFileSync(outputPath, audioBuffer);

            console.log(`  ✅ ${lang.code} passed (${audioBuffer.length} bytes)`);
        } catch (error) {
            console.error(`  ❌ ${lang.code} failed: ${error.message}`);
            allPassed = false;
        }
    }

    return allPassed;
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🧪 Starting Sarvam TTS Test Suite\n');
    console.log('='.repeat(50));

    ensureOutputDir();

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    const tests = [
        { name: 'Basic Sarvam TTS', fn: testSarvamTTSBasic },
        { name: 'Provider Switching - ElevenLabs', fn: testProviderSwitchingElevenLabs },
        { name: 'Provider Switching - Sarvam', fn: testProviderSwitchingSarvam },
        { name: 'Error Handling - Missing Key', fn: testErrorHandlingMissingKey },
        { name: 'Multi-language Support', fn: testMultiLanguageSupport },
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Results:');
    console.log(`   Total: ${results.total}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests if executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Fatal error running tests:', error);
        process.exit(1);
    });
}

module.exports = {
    testSarvamTTSBasic,
    testProviderSwitchingElevenLabs,
    testProviderSwitchingSarvam,
    testErrorHandlingMissingKey,
    testMultiLanguageSupport,
};
