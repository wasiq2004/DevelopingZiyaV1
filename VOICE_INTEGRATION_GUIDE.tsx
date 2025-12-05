/**
 * Voice Selection Integration for AgentDetailPage.tsx
 * 
 * This file contains the code snippets to integrate voice selection
 * functionality into the AgentDetailPage component.
 */

// ============================================
// STEP 1: Add imports at the top of the file
// ============================================
import VoiceList from '../components/VoiceList';

// ============================================
// STEP 2: Add state variables (after existing state declarations around line 104)
// ============================================
const [voicesFromAPI, setVoicesFromAPI] = useState<any[]>([]);
const [loadingVoicesFromAPI, setLoadingVoicesFromAPI] = useState(false);
const [playingPreviewVoiceId, setPlayingPreviewVoiceId] = useState<string | null>(null);
const [voiceWebSocket, setVoiceWebSocket] = useState<WebSocket | null>(null);

// ============================================
// STEP 3: Add useEffect to fetch voices (after existing useEffects around line 267)
// ============================================
useEffect(() => {
    const fetchVoicesFromAPI = async () => {
        try {
            setLoadingVoicesFromAPI(true);

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ziyavoice-production.up.railway.app';
            const url = `${apiBaseUrl}/api/voices?provider=all`;

            console.log('🔍 Fetching voices from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Voices data received:', data);

            if (data.success && data.voices) {
                setVoicesFromAPI(data.voices);
            }
        } catch (error) {
            console.error('❌ Error fetching voices:', error);
        } finally {
            setLoadingVoicesFromAPI(false);
        }
    };

    fetchVoicesFromAPI();
}, []);

// ============================================
// STEP 4: Add WebSocket connection for real-time updates
// ============================================
useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiHostUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || 'http://localhost:5000';
    const wsHost = new URL(apiHostUrl).host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/voices`;

    console.log('🔗 Connecting to voice WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('✅ Voice WebSocket connected');
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 Voice WebSocket message:', data.type);

            switch (data.type) {
                case 'voices.initialize':
                    setVoicesFromAPI(data.payload.voices);
                    break;

                case 'voices.update':
                    // Merge updated voices
                    setVoicesFromAPI(prevVoices => {
                        const otherProviderVoices = prevVoices.filter(
                            v => v.provider !== data.payload.provider
                        );
                        return [...otherProviderVoices, ...data.payload.voices];
                    });
                    break;

                case 'voices.removed':
                    // Remove deleted voices
                    setVoicesFromAPI(prevVoices =>
                        prevVoices.filter(v =>
                            !(v.provider === data.payload.provider &&
                                data.payload.voiceIds.includes(v.id))
                        )
                    );
                    break;
            }
        } catch (error) {
            console.error('Error processing voice WebSocket message:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('❌ Voice WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('🔌 Voice WebSocket disconnected');
    };

    setVoiceWebSocket(ws);

    return () => {
        ws.close();
    };
}, []);

// ============================================
// STEP 5: Add voice selection handler
// ============================================
const handleVoiceSelect = async (voice: any) => {
    try {
        console.log('🎤 Selecting voice:', voice.display_name, voice.provider);

        // Update local state
        const updatedAgent = {
            ...editedAgent,
            voiceId: voice.provider_voice_id,
            voice_provider: voice.provider,
            voice_provider_voice_id: voice.provider_voice_id
        };

        setEditedAgent(updatedAgent);

        // Save to backend
        updateAgent(updatedAgent);

        console.log('✅ Voice selection saved');
    } catch (error) {
        console.error('❌ Error selecting voice:', error);
        alert('Failed to select voice: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};

// ============================================
// STEP 6: Add voice preview handler
// ============================================
const handleVoicePreview = async (voice: any) => {
    try {
        // Stop any currently playing preview
        if (previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
        }

        if (playingPreviewVoiceId === voice.id) {
            // Stop if clicking the same voice
            setPlayingPreviewVoiceId(null);
            return;
        }

        setPlayingPreviewVoiceId(voice.id);

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/voices/${voice.id}/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: "Hello, this is a preview of the selected voice."
            })
        });

        const result = await response.json();

        if (result.success) {
            const audio = new Audio(`data:audio/mpeg;base64,${result.audioData}`);
            audio.play();

            audio.onended = () => {
                setPlayingPreviewVoiceId(null);
                setPreviewAudio(null);
            };

            audio.onerror = () => {
                setPlayingPreviewVoiceId(null);
                setPreviewAudio(null);
            };

            setPreviewAudio(audio);
        } else {
            throw new Error(result.message || 'Failed to generate voice preview');
        }
    } catch (error) {
        console.error('Error playing voice preview:', error);
        alert('Failed to play voice preview: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setPlayingPreviewVoiceId(null);
    }
};

// ============================================
// STEP 7: Add Voice Selection UI to the render
// Add this after the existing voice modal section (search for "isVoiceModalOpen")
// ============================================

{/* Voice Selection Panel */ }
<SettingsCard title="Voice Selection">
    <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
            Choose a voice for your agent from ElevenLabs or Sarvam providers.
        </div>

        <VoiceList
            voices={voicesFromAPI}
            selectedVoiceId={voicesFromAPI.find(v =>
                v.provider === editedAgent.voice_provider &&
                v.provider_voice_id === editedAgent.voice_provider_voice_id
            )?.id}
            onSelect={handleVoiceSelect}
            onPreview={handleVoicePreview}
            playingPreviewId={playingPreviewVoiceId}
            loading={loadingVoicesFromAPI}
        />
    </div>
</SettingsCard>

// ============================================
// NOTES:
// ============================================
// 1. The VoiceList component handles search, filtering, and display
// 2. WebSocket provides real-time updates when voices are synced
// 3. Voice preview uses the /api/voices/:id/preview endpoint
// 4. Voice selection updates both voiceId (legacy) and voice_provider fields
// 5. Make sure to import VoiceList at the top of the file
