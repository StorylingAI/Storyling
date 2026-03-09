const fs = await import('fs');
const voices = JSON.parse(fs.readFileSync('all_voices.json', 'utf8'));

// Find female voices
const femaleVoices = voices.filter(v => {
  const labels = v.labels || {};
  return labels.gender === 'female';
});

console.log(`Found ${femaleVoices.length} female voices\n`);
console.log("=== FEMALE VOICES WITH DESCRIPTIONS ===\n");

femaleVoices.slice(0, 40).forEach((v, i) => {
  const desc = v.description || v.name;
  const labels = v.labels || {};
  const descriptive = labels.descriptive || 'N/A';
  const age = labels.age || 'N/A';
  const useCase = labels.use_case || 'N/A';
  
  console.log(`${i+1}. ${v.name} (${v.voice_id})`);
  console.log(`   Desc: ${desc}`);
  console.log(`   Traits: ${descriptive}, ${age}, ${useCase}`);
  console.log("");
});
