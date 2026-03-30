const fs = await import('fs');
const voices = JSON.parse(fs.readFileSync('all_voices.json', 'utf8'));

// Get all voice IDs and names
console.log("=== ALL AVAILABLE VOICES (first 30) ===\n");
voices.slice(0, 30).forEach((v, i) => {
  console.log(`${i+1}. ${v.name} (${v.voice_id})`);
  if (v.labels) {
    const labelStr = Object.entries(v.labels)
      .filter(([k,v]) => v)
      .map(([k,v]) => `${k}:${v}`)
      .join(', ');
    if (labelStr) console.log(`   Labels: ${labelStr}`);
  }
  console.log("");
});

// Check if our current Spanish voices exist
console.log("\n=== CHECKING CURRENT SPANISH VOICE IDS ===\n");
const spanishVoices = {
  "Miguel (Warm male)": "vAxdfYVShGAQEwKYqDZR",
  "Yinet (Warm female)": "GPzYRfJNEJniCw2WrKzi",
  "Francisco (Prof male)": "BPoDAH7n4gFrnGY27Jkj",
  "Santiago (Energetic male)": "15bJsujCI3tcDWeoZsQP",
  "Mateo (Calm male)": "Yko7PKHZNXotIFUBG7I9",
  "Dante (Dramatic male)": "usTmJvQOCyW3nRcZ8OEo",
};

for (const [name, id] of Object.entries(spanishVoices)) {
  const found = voices.find(v => v.voice_id === id);
  console.log(`${name}: ${found ? '✓ EXISTS' : '✗ NOT FOUND'}`);
  if (found) {
    console.log(`  Name: ${found.name}`);
  }
}
