const fs = await import('fs');
const voices = JSON.parse(fs.readFileSync('all_voices.json', 'utf8'));

// Find voices with Spanish in any label value
const spanishVoices = voices.filter(v => {
  const labelsStr = JSON.stringify(v.labels || {}).toLowerCase();
  return labelsStr.includes('spanish');
});

console.log(`Found ${spanishVoices.length} Spanish voices\n`);

// Group by gender
const female = spanishVoices.filter(v => {
  const labelsStr = JSON.stringify(v.labels || {}).toLowerCase();
  return labelsStr.includes('female');
});

const male = spanishVoices.filter(v => {
  const labelsStr = JSON.stringify(v.labels || {}).toLowerCase();
  return labelsStr.includes('male') && !labelsStr.includes('female');
});

console.log(`Female: ${female.length}, Male: ${male.length}\n`);
console.log("=== FEMALE SPANISH VOICES ===\n");

female.forEach(v => {
  console.log(`${v.name}`);
  console.log(`  ID: ${v.voice_id}`);
  console.log(`  Labels: ${JSON.stringify(v.labels)}`);
  console.log(`  Desc: ${v.description || 'N/A'}`);
  console.log("");
});
