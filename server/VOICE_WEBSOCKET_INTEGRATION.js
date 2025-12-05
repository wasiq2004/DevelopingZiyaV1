/**
 * WebSocket Voice Management Integration
 * Add this code to server.js after the /voice-stream WebSocket endpoint
 */

// WebSocket endpoint for voice list updates
app.ws('/ws/voices', (ws, req) => {
    console.log('🔗 Voice management WebSocket connection established');
    voiceWsHandler.handleConnection(ws, req);
});

console.log('✅ Voice WebSocket endpoint registered at /ws/voices');
