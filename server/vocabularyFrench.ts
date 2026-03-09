/**
 * French CEFR Vocabulary Database
 * Comprehensive vocabulary list with CEFR levels (A1-C2) and frequency indicators
 * Based on Alliance Française CEFR curriculum and frequency analysis
 */

export interface FrenchWord {
  word: string;
  translation: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  frequency: "very_common" | "common" | "uncommon" | "rare";
  partOfSpeech?: string;
}

export const frenchVocabulary: FrenchWord[] = [
  // A1 Level - Beginner (Very Common)
  { word: "bonjour", translation: "hello", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "au revoir", translation: "goodbye", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "phrase" },
  { word: "merci", translation: "thank you", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "interjection" },
  { word: "s'il vous plaît", translation: "please", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "phrase" },
  { word: "oui", translation: "yes", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adverb" },
  { word: "non", translation: "no", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adverb" },
  { word: "je", translation: "I", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "tu", translation: "you (informal)", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "il", translation: "he", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "elle", translation: "she", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "pronoun" },
  { word: "être", translation: "to be", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "avoir", translation: "to have", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "faire", translation: "to do/make", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "aller", translation: "to go", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "venir", translation: "to come", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "maison", translation: "house", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "famille", translation: "family", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "ami", translation: "friend", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "eau", translation: "water", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "nourriture", translation: "food", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "jour", translation: "day", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "nuit", translation: "night", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "année", translation: "year", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "temps", translation: "time/weather", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "personne", translation: "person", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "homme", translation: "man", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "femme", translation: "woman", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "enfant", translation: "child", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "garçon", translation: "boy", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "fille", translation: "girl", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "noun" },
  { word: "grand", translation: "big", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "petit", translation: "small", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "bon", translation: "good", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "mauvais", translation: "bad", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "nouveau", translation: "new", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "vieux", translation: "old", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "adjective" },
  { word: "un", translation: "one", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "deux", translation: "two", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "trois", translation: "three", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "number" },
  { word: "manger", translation: "to eat", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "boire", translation: "to drink", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "parler", translation: "to speak", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "vivre", translation: "to live", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "travailler", translation: "to work", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "étudier", translation: "to study", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "aimer", translation: "to like/love", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "vouloir", translation: "to want", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "pouvoir", translation: "to be able to", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "voir", translation: "to see", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "appeler", translation: "to call", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },
  { word: "arriver", translation: "to arrive", cefrLevel: "A1", frequency: "very_common", partOfSpeech: "verb" },

  // A2 Level - Elementary (Common)
  { word: "bien que", translation: "although", cefrLevel: "A2", frequency: "common", partOfSpeech: "conjunction" },
  { word: "encore", translation: "still/yet", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "non plus", translation: "neither", cefrLevel: "A2", frequency: "common", partOfSpeech: "phrase" },
  { word: "d'ailleurs", translation: "besides/moreover", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "alors", translation: "then", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "pendant", translation: "during", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "après", translation: "after", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "avant", translation: "before", cefrLevel: "A2", frequency: "common", partOfSpeech: "preposition" },
  { word: "toujours", translation: "always", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "jamais", translation: "never", cefrLevel: "A2", frequency: "common", partOfSpeech: "adverb" },
  { word: "quelque", translation: "some", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "aucun", translation: "none", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "plusieurs", translation: "several", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "tout", translation: "all/everything", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "chaque", translation: "each", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "même", translation: "same", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "autre", translation: "other", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "suivant", translation: "next/following", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "précédent", translation: "previous", cefrLevel: "A2", frequency: "common", partOfSpeech: "adjective" },
  { word: "lieu", translation: "place", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "ville", translation: "city", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "pays", translation: "country", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "monde", translation: "world", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "vie", translation: "life", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "partie", translation: "part", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "moment", translation: "moment", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "heure", translation: "hour", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "mois", translation: "month", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "semaine", translation: "week", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "travail", translation: "work/job", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "école", translation: "school", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "livre", translation: "book", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "voiture", translation: "car", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "argent", translation: "money", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "problème", translation: "problem", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "question", translation: "question", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "réponse", translation: "answer", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "idée", translation: "idea", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "chose", translation: "thing", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "façon", translation: "way", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "manière", translation: "manner/way", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "cas", translation: "case", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "exemple", translation: "example", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "raison", translation: "reason", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "vérité", translation: "truth", cefrLevel: "A2", frequency: "common", partOfSpeech: "noun" },
  { word: "sentir", translation: "to feel", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "penser", translation: "to think", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "croire", translation: "to believe", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "savoir", translation: "to know", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "connaître", translation: "to know/meet", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "sembler", translation: "to seem", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "trouver", translation: "to find", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "chercher", translation: "to look for", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "attendre", translation: "to wait", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "espérer", translation: "to hope", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "devoir", translation: "to have to/must", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "mettre", translation: "to put", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "donner", translation: "to give", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "prendre", translation: "to take", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "laisser", translation: "to leave/let", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "suivre", translation: "to follow", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "porter", translation: "to carry/wear", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "retourner", translation: "to return", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "commencer", translation: "to begin", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },
  { word: "finir", translation: "to finish", cefrLevel: "A2", frequency: "common", partOfSpeech: "verb" },

  // B1 Level - Intermediate (Common)
  { word: "obtenir", translation: "to obtain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "réussir", translation: "to succeed", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "réaliser", translation: "to realize/carry out", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "développer", translation: "to develop", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "établir", translation: "to establish", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "maintenir", translation: "to maintain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "considérer", translation: "to consider", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "supposer", translation: "to suppose", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "imaginer", translation: "to imagine", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "rappeler", translation: "to remember/recall", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "oublier", translation: "to forget", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "expliquer", translation: "to explain", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "comprendre", translation: "to understand", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "apprendre", translation: "to learn", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "enseigner", translation: "to teach", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "montrer", translation: "to show", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "démontrer", translation: "to demonstrate", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "prouver", translation: "to prove", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "essayer", translation: "to try", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "tenter", translation: "to attempt", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "éviter", translation: "to avoid", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "empêcher", translation: "to prevent", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "permettre", translation: "to allow", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "obliger", translation: "to force", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "décider", translation: "to decide", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "choisir", translation: "to choose", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "préférer", translation: "to prefer", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "accepter", translation: "to accept", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "refuser", translation: "to refuse", cefrLevel: "B1", frequency: "common", partOfSpeech: "verb" },
  { word: "société", translation: "society", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "gouvernement", translation: "government", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "politique", translation: "politics/policy", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "économie", translation: "economy", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "entreprise", translation: "company", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "affaire", translation: "business", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "marché", translation: "market", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "produit", translation: "product", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "service", translation: "service", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "système", translation: "system", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "processus", translation: "process", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "développement", translation: "development", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "changement", translation: "change", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "situation", translation: "situation", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "condition", translation: "condition", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "état", translation: "state", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "niveau", translation: "level", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "degré", translation: "degree", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "mesure", translation: "measure", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },
  { word: "quantité", translation: "quantity", cefrLevel: "B1", frequency: "common", partOfSpeech: "noun" },

  // B2 Level - Upper Intermediate (Uncommon)
  { word: "domaine", translation: "field/domain", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "approche", translation: "approach", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "perspective", translation: "perspective", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "contexte", translation: "context", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "environnement", translation: "environment", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "dimension", translation: "dimension", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "aspect", translation: "aspect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "facteur", translation: "factor", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "élément", translation: "element", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "composant", translation: "component", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "structure", translation: "structure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "mécanisme", translation: "mechanism", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "procédure", translation: "procedure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "méthodologie", translation: "methodology", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "stratégie", translation: "strategy", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "objectif", translation: "objective", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "but", translation: "goal", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "finalité", translation: "purpose", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "conséquence", translation: "consequence", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "résultat", translation: "result", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "effet", translation: "effect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "impact", translation: "impact", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "influence", translation: "influence", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "tendance", translation: "tendency/trend", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "modèle", translation: "model", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "schéma", translation: "scheme", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "cadre", translation: "framework", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "noun" },
  { word: "lier", translation: "to link", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "relier", translation: "to connect", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "associer", translation: "to associate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "intégrer", translation: "to integrate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "incorporer", translation: "to incorporate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "inclure", translation: "to include", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "exclure", translation: "to exclude", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "distinguer", translation: "to distinguish", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "différencier", translation: "to differentiate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "comparer", translation: "to compare", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "contraster", translation: "to contrast", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "analyser", translation: "to analyze", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "évaluer", translation: "to evaluate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "estimer", translation: "to estimate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "calculer", translation: "to calculate", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "mesurer", translation: "to measure", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "déterminer", translation: "to determine", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "définir", translation: "to define", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },
  { word: "spécifier", translation: "to specify", cefrLevel: "B2", frequency: "uncommon", partOfSpeech: "verb" },

  // C1 Level - Advanced (Rare)
  { word: "paradigme", translation: "paradigm", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "postulat", translation: "postulate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "prémisse", translation: "premise", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "hypothèse", translation: "hypothesis", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "théorie", translation: "theory", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "axiome", translation: "axiom", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "corollaire", translation: "corollary", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "inférence", translation: "inference", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "déduction", translation: "deduction", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "induction", translation: "induction", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "raisonnement", translation: "reasoning", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "argumentation", translation: "argumentation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "réfutation", translation: "refutation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "corroboration", translation: "corroboration", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "validation", translation: "validation", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "vérification", translation: "verification", cefrLevel: "C1", frequency: "rare", partOfSpeech: "noun" },
  { word: "discerner", translation: "to discern", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "élucider", translation: "to elucidate", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "éclaircir", translation: "to clarify", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "déchiffrer", translation: "to decipher", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "interpréter", translation: "to interpret", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "nuancer", translation: "to nuance", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "préciser", translation: "to specify", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "circonscrire", translation: "to circumscribe", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },
  { word: "délimiter", translation: "to delimit", cefrLevel: "C1", frequency: "rare", partOfSpeech: "verb" },

  // C2 Level - Mastery (Rare)
  { word: "épistémologie", translation: "epistemology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "herméneutique", translation: "hermeneutics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "phénoménologie", translation: "phenomenology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "ontologie", translation: "ontology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "téléologie", translation: "teleology", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "dialectique", translation: "dialectics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "heuristique", translation: "heuristics", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "exégèse", translation: "exegesis", cefrLevel: "C2", frequency: "rare", partOfSpeech: "noun" },
  { word: "herméneutique", translation: "hermeneutic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "paradigmatique", translation: "paradigmatic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "axiomatique", translation: "axiomatic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "tautologique", translation: "tautological", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "dichotomique", translation: "dichotomic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "polysémique", translation: "polysemic", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "équivoque", translation: "equivocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "univoque", translation: "univocal", cefrLevel: "C2", frequency: "rare", partOfSpeech: "adjective" },
  { word: "conceptualiser", translation: "to conceptualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "théoriser", translation: "to theorize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "postuler", translation: "to postulate", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "axiomatiser", translation: "to axiomatize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "systématiser", translation: "to systematize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "formaliser", translation: "to formalize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "opérationnaliser", translation: "to operationalize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "problématiser", translation: "to problematize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "contextualiser", translation: "to contextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "décontextualiser", translation: "to decontextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "recontextualiser", translation: "to recontextualize", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "déconstruire", translation: "to deconstruct", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
  { word: "reconstruire", translation: "to reconstruct", cefrLevel: "C2", frequency: "rare", partOfSpeech: "verb" },
];

/**
 * Get French vocabulary by CEFR level
 */
export function getFrenchVocabularyByLevel(level: string): FrenchWord[] {
  return frenchVocabulary.filter(word => word.cefrLevel === level);
}

/**
 * Get French vocabulary by frequency
 */
export function getFrenchVocabularyByFrequency(frequency: string): FrenchWord[] {
  return frenchVocabulary.filter(word => word.frequency === frequency);
}

/**
 * Get CEFR level for a French word
 */
export function getFrenchWordLevel(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const found = frenchVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
  return found ? found.cefrLevel : null;
}

/**
 * Get frequency indicator for a French word
 */
export function getFrenchWordFrequency(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim();
  const found = frenchVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
  return found ? found.frequency : null;
}

/**
 * Enrich French vocabulary with level and frequency data
 */
export function enrichFrenchVocabulary(words: string[]): Array<{
  word: string;
  translation: string;
  level: string;
  frequency: string;
}> {
  return words.map(word => {
    const normalizedWord = word.toLowerCase().trim();
    const found = frenchVocabulary.find(v => v.word.toLowerCase() === normalizedWord);
    
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
