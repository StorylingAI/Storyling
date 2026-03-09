const API_KEY = process.env.ELEVENLABS_API_KEY;

try {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': API_KEY
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log(`Total voices: ${data.voices.length}\n`);
    
    // Show first 5 voices as sample
    console.log("Sample voices:");
    data.voices.slice(0, 5).forEach(v => {
      console.log(`- ${v.name} (${v.voice_id})`);
      console.log(`  Labels: ${JSON.stringify(v.labels)}`);
    });
    
    // Save all to file for analysis
    const fs = await import('fs');
    fs.writeFileSync('all_voices.json', JSON.stringify(data.voices, null, 2));
    console.log("\nAll voices saved to all_voices.json");
  } else {
    console.log(`Error: ${response.status}`);
  }
} catch (error) {
  console.log(`Error: ${error.message}`);
}
