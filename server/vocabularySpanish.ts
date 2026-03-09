/**
 * Spanish CEFR Vocabulary Database
 * Comprehensive vocabulary list with CEFR levels (A1-C2) and frequency indicators
 * Based on Instituto Cervantes CEFR curriculum and frequency analysis
 */

export interface SpanishWord {
  word: string;
  translation: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequency: "very_common" | "common" | "uncommon" | "rare";
  partOfSpeech?: string;
}

export const spanishVocabulary: SpanishWord[] = [
  // A1 Level - Beginner (Very Common)
  { word: "hola", translation: "hello", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "adiós", translation: "goodbye", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "gracias", translation: "thank you", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "por favor", translation: "please", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "phrase" },
  { word: "sí", translation: "yes", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adverb" },
  { word: "no", translation: "no", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adverb" },
  { word: "yo", translation: "I", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "tú", translation: "you (informal)", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "él", translation: "he", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "ella", translation: "she", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "ser", translation: "to be", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "estar", translation: "to be (location/state)", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "tener", translation: "to have", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "hacer", translation: "to do/make", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "ir", translation: "to go", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "casa", translation: "house", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "familia", translation: "family", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "amigo", translation: "friend", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "agua", translation: "water", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "comida", translation: "food", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "día", translation: "day", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "noche", translation: "night", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "año", translation: "year", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "tiempo", translation: "time/weather", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "persona", translation: "person", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "hombre", translation: "man", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "mujer", translation: "woman", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "niño", translation: "child/boy", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "niña", translation: "girl", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "grande", translation: "big", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "pequeño", translation: "small", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "bueno", translation: "good", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "malo", translation: "bad", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "nuevo", translation: "new", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "viejo", translation: "old", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "uno", translation: "one", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "dos", translation: "two", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "tres", translation: "three", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "comer", translation: "to eat", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "beber", translation: "to drink", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "hablar", translation: "to speak", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "vivir", translation: "to live", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "trabajar", translation: "to work", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "estudiar", translation: "to study", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "gustar", translation: "to like", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "querer", translation: "to want", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "poder", translation: "to be able to", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "ver", translation: "to see", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "llamar", translation: "to call", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "llegar", translation: "to arrive", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },

  // A2 Level - Elementary (Common)
  { word: "aunque", translation: "although", cefrLevel: "A2", frequency: "common", partOfSpeech: "conjunction" },
  { word: "todavía", translation: "still/yet", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "tampoco", translation: "neither", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "además", translation: "besides/moreover", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "entonces", translation: "then", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "mientras", translation: "while", cefrLevel: "A2", frequency: "common", partOfSpeech: "conjunction" },
  { word: "durante", translation: "during", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "después", translation: "after", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "antes", translation: "before", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "siempre", translation: "always", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "nunca", translation: "never", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "alguno", translation: "some", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "ninguno", translation: "none", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "varios", translation: "several", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "todo", translation: "all/everything", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "cada", translation: "each", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "mismo", translation: "same", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "otro", translation: "other", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "siguiente", translation: "next/following", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "anterior", translation: "previous", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "lugar", translation: "place", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "ciudad", translation: "city", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "país", translation: "country", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "mundo", translation: "world", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "vida", translation: "life", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "parte", translation: "part", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "momento", translation: "moment", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "hora", translation: "hour", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "mes", translation: "month", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "semana", translation: "week", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "trabajo", translation: "work/job", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "escuela", translation: "school", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "libro", translation: "book", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "coche", translation: "car", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "dinero", translation: "money", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "problema", translation: "problem", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "pregunta", translation: "question", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "respuesta", translation: "answer", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "idea", translation: "idea", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "cosa", translation: "thing", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "forma", translation: "way/form", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "manera", translation: "manner/way", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "caso", translation: "case", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "ejemplo", translation: "example", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "razón", translation: "reason", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "verdad", translation: "truth", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "sentir", translation: "to feel", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "pensar", translation: "to think", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "creer", translation: "to believe", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "saber", translation: "to know", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "conocer", translation: "to know/meet", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "parecer", translation: "to seem", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "encontrar", translation: "to find", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "buscar", translation: "to look for", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "esperar", translation: "to wait/hope", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "necesitar", translation: "to need", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "deber", translation: "to owe/must", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "poner", translation: "to put", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "dar", translation: "to give", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "tomar", translation: "to take", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "dejar", translation: "to leave/let", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "seguir", translation: "to follow/continue", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "llevar", translation: "to carry/wear", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "volver", translation: "to return", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "empezar", translation: "to begin", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "terminar", translation: "to finish", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },

  // B1 Level - Intermediate (Common)
  { word: "conseguir", translation: "to achieve/get", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "lograr", translation: "to achieve", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "realizar", translation: "to carry out", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "desarrollar", translation: "to develop", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "establecer", translation: "to establish", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "mantener", translation: "to maintain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "considerar", translation: "to consider", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "suponer", translation: "to suppose", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "imaginar", translation: "to imagine", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "recordar", translation: "to remember", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "olvidar", translation: "to forget", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "explicar", translation: "to explain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "entender", translation: "to understand", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "comprender", translation: "to understand", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "aprender", translation: "to learn", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "enseñar", translation: "to teach", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "mostrar", translation: "to show", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "demostrar", translation: "to demonstrate", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "probar", translation: "to prove/try", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "intentar", translation: "to try", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "tratar", translation: "to treat/try", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "evitar", translation: "to avoid", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "impedir", translation: "to prevent", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "permitir", translation: "to allow", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "obligar", translation: "to force", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "decidir", translation: "to decide", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "elegir", translation: "to choose", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "preferir", translation: "to prefer", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "aceptar", translation: "to accept", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "rechazar", translation: "to reject", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "sociedad", translation: "society", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "gobierno", translation: "government", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "política", translation: "politics/policy", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "economía", translation: "economy", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "empresa", translation: "company", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "negocio", translation: "business", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "mercado", translation: "market", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "producto", translation: "product", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "servicio", translation: "service", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "sistema", translation: "system", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "proceso", translation: "process", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "desarrollo", translation: "development", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "cambio", translation: "change", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "situación", translation: "situation", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "condición", translation: "condition", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "estado", translation: "state", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "nivel", translation: "level", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "grado", translation: "degree", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "medida", translation: "measure", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "cantidad", translation: "quantity", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },

  // B2 Level - Upper Intermediate (Uncommon)
  { word: "ámbito", translation: "field/sphere", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "enfoque", translation: "approach/focus", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "perspectiva", translation: "perspective", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "contexto", translation: "context", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "entorno", translation: "environment", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "ámbito", translation: "scope/field", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "dimensión", translation: "dimension", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "aspecto", translation: "aspect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "factor", translation: "factor", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "elemento", translation: "element", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "componente", translation: "component", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "estructura", translation: "structure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "mecanismo", translation: "mechanism", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "procedimiento", translation: "procedure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "metodología", translation: "methodology", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "estrategia", translation: "strategy", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "objetivo", translation: "objective", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "meta", translation: "goal", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "propósito", translation: "purpose", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "finalidad", translation: "purpose/aim", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "consecuencia", translation: "consequence", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "resultado", translation: "result", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "efecto", translation: "effect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "impacto", translation: "impact", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "influencia", translation: "influence", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "tendencia", translation: "tendency/trend", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "patrón", translation: "pattern", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "modelo", translation: "model", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "esquema", translation: "scheme", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "marco", translation: "framework", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "vincular", translation: "to link", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "relacionar", translation: "to relate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "asociar", translation: "to associate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "integrar", translation: "to integrate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "incorporar", translation: "to incorporate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "incluir", translation: "to include", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "excluir", translation: "to exclude", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "distinguir", translation: "to distinguish", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "diferenciar", translation: "to differentiate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "comparar", translation: "to compare", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "contrastar", translation: "to contrast", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "analizar", translation: "to analyze", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "evaluar", translation: "to evaluate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "valorar", translation: "to value/assess", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "estimar", translation: "to estimate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "calcular", translation: "to calculate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "medir", translation: "to measure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "determinar", translation: "to determine", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "definir", translation: "to define", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "especificar", translation: "to specify", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },

  // C1 Level - Advanced (Rare)
  { word: "paradigma", translation: "paradigm", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "postulado", translation: "postulate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "premisa", translation: "premise", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "hipótesis", translation: "hypothesis", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "teoría", translation: "theory", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "axioma", translation: "axiom", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "corolario", translation: "corollary", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "inferencia", translation: "inference", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "deducción", translation: "deduction", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "inducción", translation: "induction", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "razonamiento", translation: "reasoning", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "argumentación", translation: "argumentation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "refutación", translation: "refutation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "corroboración", translation: "corroboration", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "validación", translation: "validation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "verificación", translation: "verification", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "constatación", translation: "verification", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "comprobación", translation: "verification", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "discernir", translation: "to discern", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "dilucidar", translation: "to elucidate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "esclarecer", translation: "to clarify", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "elucidar", translation: "to elucidate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "desentrañar", translation: "to unravel", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "descifrar", translation: "to decipher", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "interpretar", translation: "to interpret", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "matizar", translation: "to nuance", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "precisar", translation: "to specify", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "puntualizar", translation: "to clarify/specify", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "circunscribir", translation: "to circumscribe", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "delimitar", translation: "to delimit", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },

  // C2 Level - Mastery (Rare)
  { word: "epistemología", translation: "epistemology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "hermenéutica", translation: "hermeneutics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "fenomenología", translation: "phenomenology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "ontología", translation: "ontology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "teleología", translation: "teleology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "dialéctica", translation: "dialectics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "heurística", translation: "heuristics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "exégesis", translation: "exegesis", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "hermenéutico", translation: "hermeneutic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "paradigmático", translation: "paradigmatic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "axiomático", translation: "axiomatic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "tautológico", translation: "tautological", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "dicotómico", translation: "dichotomic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "polisémico", translation: "polysemic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "multívoco", translation: "multivocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "equívoco", translation: "equivocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "unívoco", translation: "univocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "conceptualizar", translation: "to conceptualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "teorizar", translation: "to theorize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "postular", translation: "to postulate", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "axiomatizar", translation: "to axiomatize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "sistematizar", translation: "to systematize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "formalizar", translation: "to formalize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "operacionalizar", translation: "to operationalize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "problematizar", translation: "to problematize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "contextualizar", translation: "to contextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "descontextualizar", translation: "to decontextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "recontextualizar", translation: "to recontextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "deconstruir", translation: "to deconstruct", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "reconstruir", translation: "to reconstruct", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
];

/**
 * Get Spanish vocabulary by CEFR level
 */
export function getSpanishVocabularyByLevel(level: string): SpanishWord[] {
  return spanishVocabulary.filter(word => word.cefrLevel === level);
}

/**
 * Get Spanish vocabulary by frequency
 */
export function getSpanishVocabularyByFrequency(frequency: string): SpanishWord[] {
  return spanishVocabulary.filter(word => word.frequency === frequency);
}

/**
 * Get CEFR level for a Spanish word
 */
export function getSpanishWordLevel(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const found = spanishVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
  return found ? found.cefrLevel : null;
}

/**
 * Get frequency indicator for a Spanish word
 */
export function getSpanishWordFrequency(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const found = spanishVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
  return found ? found.frequency : null;
}

/**
 * Enrich Spanish vocabulary with level and frequency data
 */
export function enrichSpanishVocabulary(words: string[]): Array<{
  word: string;
  translation: string;
  level: string;
  frequency: string;
}> {
  return words.map(word => {
    const normalizedWord = word.toLowerCase().trim();
    const found = spanishVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    
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
