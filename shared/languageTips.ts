/**
 * Language-specific learning tips for each supported language
 * Provides culturally relevant advice and learning strategies
 */

export interface LanguageTip {
  icon: string;
  title: string;
  description: string;
  category: 'pronunciation' | 'grammar' | 'vocabulary' | 'culture' | 'practice';
}

export const LANGUAGE_TIPS: Record<string, LanguageTip[]> = {
  Chinese: [
    {
      icon: '🎵',
      title: 'Master the Four Tones',
      description: 'Chinese has 4 tones that change word meaning. Practice with our Tone Practice feature to distinguish mā (mother), má (hemp), mǎ (horse), and mà (scold).',
      category: 'pronunciation',
    },
    {
      icon: '✍️',
      title: 'Learn Character Radicals',
      description: 'Characters are built from radicals (building blocks). Learning common radicals like 氵(water), 木(wood), and 人(person) helps you guess meanings and remember characters.',
      category: 'vocabulary',
    },
    {
      icon: '📏',
      title: 'Use Measure Words',
      description: 'Chinese uses measure words between numbers and nouns. Common ones: 个 (gè) for general items, 本 (běn) for books, 杯 (bēi) for cups.',
      category: 'grammar',
    },
    {
      icon: '🗣️',
      title: 'Practice Speaking Daily',
      description: 'Speak out loud even when alone. Chinese pronunciation requires muscle memory for tones and sounds not found in English.',
      category: 'practice',
    },
  ],
  Spanish: [
    {
      icon: '⚧️',
      title: 'Remember Noun Gender',
      description: 'All nouns are masculine (el) or feminine (la). Words ending in -o are usually masculine, -a usually feminine. Learn exceptions like "el agua" (water).',
      category: 'grammar',
    },
    {
      icon: '🔄',
      title: 'Master Ser vs Estar',
      description: 'Both mean "to be" but differ: SER for permanent traits (Soy alto - I\'m tall), ESTAR for temporary states (Estoy cansado - I\'m tired).',
      category: 'grammar',
    },
    {
      icon: '💭',
      title: 'Learn the Subjunctive',
      description: 'The subjunctive mood expresses wishes, doubts, and hypotheticals. Start with common triggers: "Espero que..." (I hope that...), "Quiero que..." (I want that...).',
      category: 'grammar',
    },
    {
      icon: '🎬',
      title: 'Watch Spanish Media',
      description: 'Immerse yourself in Spanish TV shows, movies, and podcasts. Try "Money Heist" (La Casa de Papel) or "Elite" with Spanish subtitles.',
      category: 'practice',
    },
  ],
  French: [
    {
      icon: '⚧️',
      title: 'Learn Noun Gender',
      description: 'French nouns are masculine (le) or feminine (la). Unlike Spanish, endings don\'t reliably predict gender. Memorize gender with each new word.',
      category: 'grammar',
    },
    {
      icon: '🔗',
      title: 'Practice Liaison',
      description: 'Liaison connects words by pronouncing normally silent consonants. "Les amis" sounds like "lay-za-mee". Listen carefully to native speakers.',
      category: 'pronunciation',
    },
    {
      icon: '👥',
      title: 'Master Subject Pronouns',
      description: 'French has formal (vous) and informal (tu) "you". Use "vous" for strangers, elders, and formal settings. "Tu" is for friends and family.',
      category: 'culture',
    },
    {
      icon: '📚',
      title: 'Read French Literature',
      description: 'Start with children\'s books like "Le Petit Prince" (The Little Prince) to build vocabulary with simpler grammar structures.',
      category: 'practice',
    },
  ],
  German: [
    {
      icon: '📦',
      title: 'Understand the Four Cases',
      description: 'German has 4 cases (Nominativ, Akkusativ, Dativ, Genitiv) that change articles. Start with Nominativ (subject) and Akkusativ (direct object).',
      category: 'grammar',
    },
    {
      icon: '🔤',
      title: 'Learn Article Gender',
      description: 'Nouns have 3 genders: der (masculine), die (feminine), das (neuter). Always learn the article with the noun. No reliable rules for gender!',
      category: 'grammar',
    },
    {
      icon: '🔀',
      title: 'Master Word Order',
      description: 'German uses V2 word order (verb in second position) and "verb at end" in subordinate clauses. "Ich glaube, dass er morgen kommt" (I believe that he tomorrow comes).',
      category: 'grammar',
    },
    {
      icon: '🧩',
      title: 'Break Down Compound Words',
      description: 'German creates long compound words. "Handschuh" = Hand + Schuh = glove (hand-shoe). Learn to recognize components for easier comprehension.',
      category: 'vocabulary',
    },
  ],
  Japanese: [
    {
      icon: '✨',
      title: 'Master Particles',
      description: 'Particles (は, が, を, に, で) mark grammatical relationships. は marks topic, が marks subject, を marks object. They\'re essential for sentence structure.',
      category: 'grammar',
    },
    {
      icon: '🙇',
      title: 'Learn Honorific Levels',
      description: 'Japanese has 3 politeness levels: casual, polite (です/ます), and honorific (敬語). Start with polite form for most situations.',
      category: 'culture',
    },
    {
      icon: '🈯',
      title: 'Study Kanji Systematically',
      description: 'Learn kanji by frequency and JLPT levels. Focus on common kanji first (日, 人, 本). Use mnemonics and write each character repeatedly.',
      category: 'vocabulary',
    },
    {
      icon: '🎌',
      title: 'Immerse in Japanese Media',
      description: 'Watch anime with Japanese subtitles, listen to J-pop, and read manga. Exposure to natural Japanese speeds up learning.',
      category: 'practice',
    },
  ],
  Korean: [
    {
      icon: '🙇',
      title: 'Master Honorific Speech',
      description: 'Korean has 7 speech levels. Start with 해요체 (polite informal) for most situations. Use 합니다체 (formal) for strangers and elders.',
      category: 'culture',
    },
    {
      icon: '✨',
      title: 'Learn Particles',
      description: 'Particles (은/는, 이/가, 을/를) mark grammatical roles. 은/는 marks topic, 이/가 marks subject. Choice depends on final consonant.',
      category: 'grammar',
    },
    {
      icon: '🔤',
      title: 'Practice Hangul Daily',
      description: 'Hangul is logical and learnable in hours. Practice reading signs, menus, and lyrics. The more you read, the faster you\'ll recognize characters.',
      category: 'pronunciation',
    },
    {
      icon: '🎬',
      title: 'Watch K-Dramas',
      description: 'Korean dramas expose you to natural speech, cultural context, and various honorific levels. Try "Crash Landing on You" or "Itaewon Class".',
      category: 'practice',
    },
  ],
  Arabic: [
    {
      icon: '✍️',
      title: 'Master the Arabic Script',
      description: 'Arabic is written right-to-left with letters that change shape based on position (initial, medial, final, isolated). Practice writing daily.',
      category: 'pronunciation',
    },
    {
      icon: '🌱',
      title: 'Learn Root Patterns',
      description: 'Arabic words are built from 3-letter roots. The root ك-ت-ب (k-t-b) relates to writing: كتاب (book), مكتب (office), كاتب (writer).',
      category: 'vocabulary',
    },
    {
      icon: '🗣️',
      title: 'Practice Pronunciation',
      description: 'Arabic has sounds not found in English like ع (ʿayn) and ح (ḥa). Listen carefully and practice with native speakers or recordings.',
      category: 'pronunciation',
    },
    {
      icon: '🌍',
      title: 'Choose Your Dialect',
      description: 'Modern Standard Arabic (MSA) is formal. Egyptian, Levantine, and Gulf dialects are spoken. Start with MSA, then add a dialect.',
      category: 'culture',
    },
  ],
  Portuguese: [
    {
      icon: '⚧️',
      title: 'Learn Noun Gender',
      description: 'Nouns are masculine (o) or feminine (a). Similar to Spanish but with different words. "O leite" (milk) is masculine, "a água" (water) is feminine.',
      category: 'grammar',
    },
    {
      icon: '🎵',
      title: 'Master Nasal Sounds',
      description: 'Portuguese has nasal vowels (ã, õ, em, im) not found in English. "Pão" (bread) and "mãe" (mother) require nasal pronunciation.',
      category: 'pronunciation',
    },
    {
      icon: '🇧🇷',
      title: 'Choose Brazilian or European',
      description: 'Brazilian and European Portuguese differ in pronunciation and vocabulary. Choose based on your goals. Brazilian is more widely spoken.',
      category: 'culture',
    },
    {
      icon: '🎶',
      title: 'Listen to Portuguese Music',
      description: 'Bossa nova, samba, and fado expose you to natural pronunciation and cultural context. Try artists like Caetano Veloso or Marisa Monte.',
      category: 'practice',
    },
  ],
  Italian: [
    {
      icon: '⚧️',
      title: 'Remember Noun Gender',
      description: 'Nouns ending in -o are usually masculine (il libro), -a usually feminine (la casa). Exceptions: "la mano" (hand), "il problema" (problem).',
      category: 'grammar',
    },
    {
      icon: '🗣️',
      title: 'Practice Pronunciation',
      description: 'Italian pronunciation is consistent. Every letter is pronounced. Double consonants are held longer: "nonno" (grandfather) vs "nono" (ninth).',
      category: 'pronunciation',
    },
    {
      icon: '🤌',
      title: 'Learn Gestures',
      description: 'Italian communication includes hand gestures. While not essential, understanding common gestures enriches cultural comprehension.',
      category: 'culture',
    },
    {
      icon: '🍝',
      title: 'Immerse in Italian Culture',
      description: 'Watch Italian films (Cinema Paradiso, Life is Beautiful), listen to Italian music, and try cooking with Italian recipes in Italian.',
      category: 'practice',
    },
  ],
  Russian: [
    {
      icon: '🔤',
      title: 'Master the Cyrillic Alphabet',
      description: 'Learn Cyrillic first (А, Б, В...). Some letters look like English but sound different: В = "v", Р = "r", Н = "n".',
      category: 'pronunciation',
    },
    {
      icon: '📦',
      title: 'Learn the Six Cases',
      description: 'Russian has 6 cases that change word endings. Start with Nominative (subject) and Accusative (object). Cases show grammatical relationships.',
      category: 'grammar',
    },
    {
      icon: '🔄',
      title: 'Understand Aspect',
      description: 'Russian verbs have two aspects: imperfective (ongoing/repeated) and perfective (completed). Most verbs come in aspect pairs.',
      category: 'grammar',
    },
    {
      icon: '❄️',
      title: 'Explore Russian Culture',
      description: 'Read Russian literature (start with short stories), watch Russian films, and listen to Russian music to understand cultural context.',
      category: 'practice',
    },
  ],
  Dutch: [
    {
      icon: '⚧️',
      title: 'Learn Common vs Neuter Gender',
      description: 'Dutch has two genders: common (de) and neuter (het). About 75% of nouns use "de". Learn the article with each noun.',
      category: 'grammar',
    },
    {
      icon: '🗣️',
      title: 'Practice the "G" Sound',
      description: 'The Dutch "g" is a guttural sound from the back of the throat. Practice with words like "goed" (good) and "gaan" (to go).',
      category: 'pronunciation',
    },
    {
      icon: '🔀',
      title: 'Master Word Order',
      description: 'Dutch uses V2 word order (verb second) like German. In questions and subordinate clauses, word order changes.',
      category: 'grammar',
    },
    {
      icon: '🚲',
      title: 'Immerse in Dutch Media',
      description: 'Watch Dutch TV shows and movies with subtitles. Try "Lupin" or Dutch news broadcasts to hear natural pronunciation.',
      category: 'practice',
    },
  ],
  Hebrew: [
    {
      icon: '✍️',
      title: 'Master the Hebrew Alphabet',
      description: 'Hebrew is written right-to-left with 22 consonants. Vowels are optional dots (nikud) below letters. Start with printed script before cursive.',
      category: 'pronunciation',
    },
    {
      icon: '🌱',
      title: 'Learn Root Patterns',
      description: 'Hebrew words are built from 3-letter roots like Arabic. The root ל-מ-ד (l-m-d) relates to learning: למד (learned), לימוד (study), תלמיד (student).',
      category: 'vocabulary',
    },
    {
      icon: '⚧️',
      title: 'Understand Gender',
      description: 'Nouns, adjectives, and verbs have masculine and feminine forms. Feminine usually ends in ה- or ת-. Gender affects verb conjugation.',
      category: 'grammar',
    },
    {
      icon: '🎬',
      title: 'Watch Israeli Media',
      description: 'Israeli TV shows like "Shtisel" or "Fauda" expose you to modern Hebrew in context. Start with Hebrew subtitles.',
      category: 'practice',
    },
  ],
  Persian: [
    {
      icon: '✍️',
      title: 'Master the Persian Script',
      description: 'Persian uses a modified Arabic script written right-to-left. Letters change shape based on position. Practice writing daily for fluency.',
      category: 'pronunciation',
    },
    {
      icon: '🎯',
      title: 'No Grammatical Gender',
      description: 'Persian has no grammatical gender! No masculine/feminine articles or verb conjugations. This makes grammar simpler than many languages.',
      category: 'grammar',
    },
    {
      icon: '🔄',
      title: 'Learn Ezafe Construction',
      description: 'The ezafe (-e) links nouns and adjectives: "ketāb-e man" (my book). It\'s not written but essential for proper speech.',
      category: 'grammar',
    },
    {
      icon: '📚',
      title: 'Read Persian Poetry',
      description: 'Persian has rich poetic tradition. Start with simple poems by Rumi or Hafez. Poetry teaches vocabulary and cultural values.',
      category: 'practice',
    },
  ],
  Turkish: [
    {
      icon: '🔗',
      title: 'Master Vowel Harmony',
      description: 'Turkish suffixes change vowels to match the word: "ev-de" (in house) vs "okul-da" (in school). Front vowels with front, back with back.',
      category: 'grammar',
    },
    {
      icon: '🧩',
      title: 'Learn Agglutination',
      description: 'Turkish builds words by adding suffixes: "ev" (house) → "evlerimizde" (in our houses). Learn suffixes systematically.',
      category: 'grammar',
    },
    {
      icon: '🔀',
      title: 'Understand SOV Word Order',
      description: 'Turkish uses Subject-Object-Verb order: "Ben kitap okuyorum" (I book read). Verb always comes last in statements.',
      category: 'grammar',
    },
    {
      icon: '🎬',
      title: 'Watch Turkish Dramas',
      description: 'Turkish TV series (diziler) are popular worldwide. Try "Diriliş: Ertuğrul" or "Muhteşem Yüzyıl" with Turkish subtitles.',
      category: 'practice',
    },
  ],
  Hindi: [
    {
      icon: '🔤',
      title: 'Master Devanagari Script',
      description: 'Hindi uses Devanagari script with 11 vowels and 33 consonants. Each consonant has an inherent "a" sound. Practice writing daily.',
      category: 'pronunciation',
    },
    {
      icon: '⚧️',
      title: 'Learn Noun Gender',
      description: 'Nouns are masculine or feminine. Masculine often ends in -ā, feminine in -ī. Gender affects adjectives and verbs.',
      category: 'grammar',
    },
    {
      icon: '🙏',
      title: 'Understand Honorifics',
      description: 'Hindi has three levels of "you": तू (intimate), तुम (informal), आप (formal/respectful). Use आप for strangers and elders.',
      category: 'culture',
    },
    {
      icon: '🎬',
      title: 'Watch Bollywood Films',
      description: 'Bollywood movies expose you to conversational Hindi and cultural context. Start with subtitles, then try without.',
      category: 'practice',
    },
  ],
  English: [
    {
      icon: '📚',
      title: 'Build Vocabulary Daily',
      description: 'English has a huge vocabulary. Learn 10 new words daily with example sentences. Focus on high-frequency words first.',
      category: 'vocabulary',
    },
    {
      icon: '🎵',
      title: 'Master Pronunciation',
      description: 'English spelling doesn\'t match pronunciation. "Tough, through, though" all sound different. Listen to native speakers and practice speaking.',
      category: 'pronunciation',
    },
    {
      icon: '⏰',
      title: 'Learn Phrasal Verbs',
      description: 'English uses phrasal verbs (verb + preposition): "give up", "look after", "run into". They often have idiomatic meanings.',
      category: 'vocabulary',
    },
    {
      icon: '🎬',
      title: 'Immerse in English Media',
      description: 'Watch English TV shows, movies, and YouTube videos. Listen to podcasts and audiobooks. Exposure builds comprehension naturally.',
      category: 'practice',
    },
  ],
};

/**
 * Get learning tips for a specific language
 */
export function getLanguageTips(language: string): LanguageTip[] {
  return LANGUAGE_TIPS[language] || [];
}

/**
 * Get a random tip for a language
 */
export function getRandomTip(language: string): LanguageTip | null {
  const tips = getLanguageTips(language);
  if (tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Get tips by category for a language
 */
export function getTipsByCategory(
  language: string,
  category: LanguageTip['category']
): LanguageTip[] {
  const tips = getLanguageTips(language);
  return tips.filter((tip) => tip.category === category);
}
