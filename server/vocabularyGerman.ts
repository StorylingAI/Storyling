/**
 * German CEFR Vocabulary Database
 * Comprehensive vocabulary list with CEFR levels (A1-C2) and frequency indicators
 * Based on Goethe-Institut CEFR curriculum and frequency analysis
 */

export interface GermanWord {
  word: string;
  translation: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequency: "very_common" | "common" | "uncommon" | "rare";
  partOfSpeech?: string;
}

export const germanVocabulary: GermanWord[] = [
  // A1 Level - Beginner (Very Common)
  { word: "hallo", translation: "hello", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "auf Wiedersehen", translation: "goodbye", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "phrase" },
  { word: "danke", translation: "thank you", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "bitte", translation: "please", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "ja", translation: "yes", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adverb" },
  { word: "nein", translation: "no", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adverb" },
  { word: "ich", translation: "I", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "du", translation: "you (informal)", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "er", translation: "he", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "sie", translation: "she/they", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "sein", translation: "to be", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "haben", translation: "to have", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "machen", translation: "to do/make", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "gehen", translation: "to go", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "kommen", translation: "to come", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "Haus", translation: "house", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Familie", translation: "family", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Freund", translation: "friend", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Wasser", translation: "water", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Essen", translation: "food", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Tag", translation: "day", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Nacht", translation: "night", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Jahr", translation: "year", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Zeit", translation: "time", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Person", translation: "person", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Mann", translation: "man", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Frau", translation: "woman", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Kind", translation: "child", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Junge", translation: "boy", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "Mädchen", translation: "girl", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "groß", translation: "big", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "klein", translation: "small", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "gut", translation: "good", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "schlecht", translation: "bad", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "neu", translation: "new", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "alt", translation: "old", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "eins", translation: "one", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "zwei", translation: "two", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "drei", translation: "three", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "essen", translation: "to eat", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "trinken", translation: "to drink", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "sprechen", translation: "to speak", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "leben", translation: "to live", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "arbeiten", translation: "to work", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "lernen", translation: "to learn", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "mögen", translation: "to like", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "wollen", translation: "to want", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "können", translation: "to be able to", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "sehen", translation: "to see", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "rufen", translation: "to call", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "ankommen", translation: "to arrive", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },

  // A2 Level - Elementary (Common)
  { word: "obwohl", translation: "although", cefrLevel: "A2", frequency: "common", partOfSpeech: "conjunction" },
  { word: "noch", translation: "still/yet", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "auch nicht", translation: "neither", cefrLevel: "A2", frequency: "common", partOfSpeech: "phrase" },
  { word: "außerdem", translation: "besides/moreover", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "dann", translation: "then", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "während", translation: "during/while", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "nach", translation: "after", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "vor", translation: "before", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "immer", translation: "always", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "nie", translation: "never", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "einige", translation: "some", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "keine", translation: "none", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "mehrere", translation: "several", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "alle", translation: "all", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "jeder", translation: "each", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "gleich", translation: "same", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "andere", translation: "other", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "nächste", translation: "next", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "vorherige", translation: "previous", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "Ort", translation: "place", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Stadt", translation: "city", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Land", translation: "country", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Welt", translation: "world", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Leben", translation: "life", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Teil", translation: "part", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Moment", translation: "moment", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Stunde", translation: "hour", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Monat", translation: "month", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Woche", translation: "week", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Arbeit", translation: "work/job", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Schule", translation: "school", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Buch", translation: "book", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Auto", translation: "car", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Geld", translation: "money", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Problem", translation: "problem", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Frage", translation: "question", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Antwort", translation: "answer", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Idee", translation: "idea", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Sache", translation: "thing", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Art", translation: "way/kind", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Weise", translation: "manner/way", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Fall", translation: "case", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Beispiel", translation: "example", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Grund", translation: "reason", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "Wahrheit", translation: "truth", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "fühlen", translation: "to feel", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "denken", translation: "to think", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "glauben", translation: "to believe", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "wissen", translation: "to know", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "kennen", translation: "to know/meet", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "scheinen", translation: "to seem", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "finden", translation: "to find", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "suchen", translation: "to look for", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "warten", translation: "to wait", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "hoffen", translation: "to hope", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "müssen", translation: "to have to/must", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "stellen", translation: "to put", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "geben", translation: "to give", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "nehmen", translation: "to take", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "lassen", translation: "to leave/let", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "folgen", translation: "to follow", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "tragen", translation: "to carry/wear", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "zurückkehren", translation: "to return", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "beginnen", translation: "to begin", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "beenden", translation: "to finish", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },

  // B1 Level - Intermediate (Common)
  { word: "erreichen", translation: "to achieve/reach", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "gelingen", translation: "to succeed", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "verwirklichen", translation: "to realize", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "entwickeln", translation: "to develop", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "einrichten", translation: "to establish", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "beibehalten", translation: "to maintain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "betrachten", translation: "to consider", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "annehmen", translation: "to suppose", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "vorstellen", translation: "to imagine", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "erinnern", translation: "to remember", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "vergessen", translation: "to forget", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "erklären", translation: "to explain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "verstehen", translation: "to understand", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "begreifen", translation: "to comprehend", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "unterrichten", translation: "to teach", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "zeigen", translation: "to show", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "beweisen", translation: "to prove", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "versuchen", translation: "to try", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "vermeiden", translation: "to avoid", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "verhindern", translation: "to prevent", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "erlauben", translation: "to allow", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "zwingen", translation: "to force", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "entscheiden", translation: "to decide", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "wählen", translation: "to choose", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "bevorzugen", translation: "to prefer", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "akzeptieren", translation: "to accept", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "ablehnen", translation: "to reject", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "Gesellschaft", translation: "society", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Regierung", translation: "government", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Politik", translation: "politics/policy", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Wirtschaft", translation: "economy", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Unternehmen", translation: "company", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Geschäft", translation: "business", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Markt", translation: "market", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Produkt", translation: "product", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Dienst", translation: "service", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "System", translation: "system", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Prozess", translation: "process", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Entwicklung", translation: "development", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Veränderung", translation: "change", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Situation", translation: "situation", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Bedingung", translation: "condition", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Zustand", translation: "state", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Ebene", translation: "level", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Grad", translation: "degree", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Maßnahme", translation: "measure", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "Menge", translation: "quantity", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },

  // B2 Level - Upper Intermediate (Uncommon)
  { word: "Bereich", translation: "field/area", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Ansatz", translation: "approach", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Perspektive", translation: "perspective", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Kontext", translation: "context", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Umgebung", translation: "environment", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Dimension", translation: "dimension", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Aspekt", translation: "aspect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Faktor", translation: "factor", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Element", translation: "element", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Komponente", translation: "component", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Struktur", translation: "structure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Mechanismus", translation: "mechanism", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Verfahren", translation: "procedure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Methodik", translation: "methodology", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Strategie", translation: "strategy", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Ziel", translation: "goal/objective", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Zweck", translation: "purpose", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Folge", translation: "consequence", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Ergebnis", translation: "result", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Wirkung", translation: "effect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Auswirkung", translation: "impact", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Einfluss", translation: "influence", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Tendenz", translation: "tendency/trend", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Modell", translation: "model", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Schema", translation: "scheme", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "Rahmen", translation: "framework", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "verknüpfen", translation: "to link", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "verbinden", translation: "to connect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "assoziieren", translation: "to associate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "integrieren", translation: "to integrate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "einbeziehen", translation: "to incorporate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "einschließen", translation: "to include", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "ausschließen", translation: "to exclude", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "unterscheiden", translation: "to distinguish", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "differenzieren", translation: "to differentiate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "vergleichen", translation: "to compare", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "kontrastieren", translation: "to contrast", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "analysieren", translation: "to analyze", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "bewerten", translation: "to evaluate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "schätzen", translation: "to estimate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "berechnen", translation: "to calculate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "messen", translation: "to measure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "bestimmen", translation: "to determine", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "definieren", translation: "to define", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "spezifizieren", translation: "to specify", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },

  // C1 Level - Advanced (Rare)
  { word: "Paradigma", translation: "paradigm", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Postulat", translation: "postulate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Prämisse", translation: "premise", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Hypothese", translation: "hypothesis", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Theorie", translation: "theory", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Axiom", translation: "axiom", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Folgerung", translation: "corollary", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Schlussfolgerung", translation: "inference", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Deduktion", translation: "deduction", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Induktion", translation: "induction", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Argumentation", translation: "argumentation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Widerlegung", translation: "refutation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Bestätigung", translation: "corroboration", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Validierung", translation: "validation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "Verifizierung", translation: "verification", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "unterscheiden", translation: "to discern", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "aufklären", translation: "to elucidate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "entschlüsseln", translation: "to decipher", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "interpretieren", translation: "to interpret", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "nuancieren", translation: "to nuance", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "präzisieren", translation: "to specify", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "eingrenzen", translation: "to circumscribe", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "abgrenzen", translation: "to delimit", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },

  // C2 Level - Mastery (Rare)
  { word: "Erkenntnistheorie", translation: "epistemology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Hermeneutik", translation: "hermeneutics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Phänomenologie", translation: "phenomenology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Ontologie", translation: "ontology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Teleologie", translation: "teleology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Dialektik", translation: "dialectics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Heuristik", translation: "heuristics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "Exegese", translation: "exegesis", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "hermeneutisch", translation: "hermeneutic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "paradigmatisch", translation: "paradigmatic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "axiomatisch", translation: "axiomatic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "tautologisch", translation: "tautological", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "dichotomisch", translation: "dichotomic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "polysemisch", translation: "polysemic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "mehrdeutig", translation: "equivocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "eindeutig", translation: "univocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "konzeptualisieren", translation: "to conceptualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "theoretisieren", translation: "to theorize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "postulieren", translation: "to postulate", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "axiomatisieren", translation: "to axiomatize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "systematisieren", translation: "to systematize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "formalisieren", translation: "to formalize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "operationalisieren", translation: "to operationalize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "problematisieren", translation: "to problematize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "kontextualisieren", translation: "to contextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "dekontextualisieren", translation: "to decontextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "rekontextualisieren", translation: "to recontextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "dekonstruieren", translation: "to deconstruct", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "rekonstruieren", translation: "to reconstruct", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
];

/**
 * Get German vocabulary by CEFR level
 */
export function getGermanVocabularyByLevel(level: string): GermanWord[] {
  return germanVocabulary.filter(word => word.cefrLevel === level);
}

/**
 * Get German vocabulary by frequency
 */
export function getGermanVocabularyByFrequency(frequency: string): GermanWord[] {
  return germanVocabulary.filter(word => word.frequency === frequency);
}

/**
 * Get CEFR level for a German word
 */
export function getGermanWordLevel(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const found = germanVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
  return found ? found.cefrLevel : null;
}

/**
 * Get frequency indicator for a German word
 */
export function getGermanWordFrequency(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const found = germanVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
  return found ? found.frequency : null;
}

/**
 * Enrich German vocabulary with level and frequency data
 */
export function enrichGermanVocabulary(words: string[]): Array<{
  word: string;
  translation: string;
  level: string;
  frequency: string;
}> {
  return words.map(word => {
    const normalizedWord = word.toLowerCase().trim();
    const found = germanVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    
    if (found) {
      return {
        word: found.word,
        translation: found.translation,
        level: found.cefrLevel,
        frequency: found.frequency,
      };
    }
    
    // Default for unknown words
    return {
      word,
      translation: "",
      level: "B1", // Default to intermediate
      frequency: "common",
    };
  });
}
