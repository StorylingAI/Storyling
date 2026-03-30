import fetch from 'node-fetch';

const API_KEY = process.env.ELEVENLABS_API_KEY;

// Test the current Spanish female voices
const voicesToTest = [
  { name: "Laura (Professional)", id: "FGY2WhTYpPnrIDTdsKH5" },
  { name: "LoidaBurgos (Energetic)", id: "UDJf7VRO3sTy4sABpNWO" },
  { name: "Yinet (Warm/Calm)", id: "GPzYRfJNEJniCw2WrKzi" },
];

console.log("Testing Spanish voice IDs...\n");

for (const voice of voicesToTest) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voice.id}`, {
      headers: {
        'xi-api-key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ ${voice.name}`);
      console.log(`  ID: ${voice.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Labels: ${JSON.stringify(data.labels)}`);
      console.log(`  Description: ${data.description || 'N/A'}`);
      console.log("");
    } else {
      console.log(`✗ ${voice.name} - Status: ${response.status}`);
      console.log("");
    }
  } catch (error) {
    console.log(`✗ ${voice.name} - Error: ${error.message}`);
    console.log("");
  }
}
