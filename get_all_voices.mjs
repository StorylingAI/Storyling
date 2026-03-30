const API_KEY = process.env.ELEVENLABS_API_KEY;

try {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': API_KEY
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    const spanishVoices = data.voices.filter(v => {
      const labels = v.labels || {};
      return Object.values(labels).some(val => 
        val && val.toLowerCase().includes('spanish')
      );
    });
    
    console.log(`Found ${spanishVoices.length} Spanish voices:\n`);
    
    // Filter for female voices
    const femaleSpanishVoices = spanishVoices.filter(v => {
      const labels = v.labels || {};
      return Object.values(labels).some(val => 
        val && val.toLowerCase().includes('female')
      );
    });
    
    console.log(`Female Spanish voices (${femaleSpanishVoices.length}):\n`);
    
    femaleSpanishVoices.forEach(voice => {
      console.log(`Name: ${voice.name}`);
      console.log(`ID: ${voice.voice_id}`);
      console.log(`Labels: ${JSON.stringify(voice.labels)}`);
      console.log(`Description: ${voice.description || 'N/A'}`);
      console.log("---\n");
    });
  } else {
    console.log(`Error: ${response.status} - ${await response.text()}`);
  }
} catch (error) {
  console.log(`Error: ${error.message}`);
  console.log(error.stack);
}
