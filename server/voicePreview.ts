/**
 * Voice Preview Generation Module
 * Generates short 5-second audio samples for voice type selection
 */

import { storagePut } from "./storage";

// Sample texts for different languages (short, neutral phrases)
const PREVIEW_TEXTS: Record<string, string> = {
  chinese: "你好，欢迎来到故事学习平台。让我们一起开始学习之旅吧。",
  arabic: "مرحباً بك في منصة التعلم. دعنا نبدأ رحلة التعلم معاً.",
  spanish: "Hola, bienvenido a la plataforma de aprendizaje. Comencemos este viaje juntos.",
  french: "Bonjour, bienvenue sur la plateforme d'apprentissage. Commençons ce voyage ensemble.",
  german: "Hallo, willkommen auf der Lernplattform. Lass uns diese Reise gemeinsam beginnen.",
  japanese: "こんにちは、学習プラットフォームへようこそ。一緒に学習の旅を始めましょう。",
  korean: "안녕하세요, 학습 플랫폼에 오신 것을 환영합니다. 함께 학습 여정을 시작합시다.",
  portuguese: "Olá, bem-vindo à plataforma de aprendizagem. Vamos começar esta jornada juntos.",
  italian: "Ciao, benvenuto sulla piattaforma di apprendimento. Iniziamo questo viaggio insieme.",
  russian: "Здравствуйте, добро пожаловать на платформу обучения. Давайте начнем это путешествие вместе.",
  dutch: "Hallo, welkom op het leerplatform. Laten we samen aan deze reis beginnen.",
  hebrew: "שלום, ברוכים הבאים לפלטפורמת הלמידה. בואו נתחיל את המסע הזה יחד.",
  persian: "سلام، به پلتفرم یادگیری خوش آمدید. بیایید این سفر را با هم شروع کنیم.",
  turkish: "Merhaba, öğrenme platformuna hoş geldiniz. Hadi bu yolculuğa birlikte başlayalım.",
  hindi: "नमस्ते, सीखने के मंच पर आपका स्वागत है। आइए इस यात्रा को एक साथ शुरू करें।",
  english: "Hello, welcome to the learning platform. Let's begin this journey together.",
};

/**
 * Get native voice ID based on language, voice type, and gender
 * This mirrors the logic from contentGeneration.ts
 */
function getNativeVoiceId(
  targetLanguage: string,
  voiceType: string,
  gender: "male" | "female"
): string {
  const lang = targetLanguage.toLowerCase();
  
  // Chinese (Mainland China Mandarin) native voices
  if (lang.includes("chinese") || lang.includes("mandarin")) {
    const chineseVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "4VZIsMPtgggwNg7OXbPY", // James Gao - calm, friendly
        female: "bhJUNIXWQQ94l8eI2VUf", // Amy - relaxed, friendly
      },
      "Professional Narrator": {
        male: "WuLq5z7nEcrhppO0ZQJw", // Martin Li - serious, intimate
        female: "gU2KtIu9OZWy3KqiqNj6", // LeeTingTing - gentle, sweet
      },
      "Energetic & Upbeat": {
        male: "5mZxJZhSmJTjL7GoYfYI", // Karo Yang - lively energy
        female: "fQj4gJSexpu8RDE2Ii5m", // Yu - vibrant, upbeat
      },
      "Calm & Soothing": {
        male: "M0TrFmFeBJS9H4xzdk8Z", // Steven Gor - low, calm, soothing
        female: "GgmlugwQ4LYXBbEXENWm", // Maya - calming tone
      },
      "Dramatic & Expressive": {
        male: "BrbEfHMQu0fyclQR7lfh", // Kevin Tu - high-mid voice, narrative
        female: "Ca5bKgudqKJzq8YRFoAz", // Coco Li - slight rasp, story narration
      },
    };
    return chineseVoices[voiceType]?.[gender] || chineseVoices["Warm & Friendly"][gender];
  }
  
  // Arabic (Modern Standard Arabic) native voices
  if (lang.includes("arabic") || lang.includes("عربي")) {
    const arabicVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "Qp2PG6sgef1EHtrNQKnf", // Mohamed Ben - warm, friendly
        female: "qi4PkV9c01kb869Vh7Su", // Asmaa - warm, conversational
      },
      "Professional Narrator": {
        male: "G1HOkzin3NMwRHSq60UI", // Chaouki - professional, clear
        female: "VwC51uc4PUblWEJSPzeo", // Abrar Sabbah - professional, articulate
      },
      "Energetic & Upbeat": {
        male: "DPd861uv5p6zeVV94qOT", // Mo Wiseman - energetic, upbeat
        female: "mRdG9GYEjJmIzqbYTidv", // Sana - vibrant, lively
      },
      "Calm & Soothing": {
        male: "kERwN6X2cY8g1XbfzJsX", // Mourad Sami - calm, soothing
        female: "u0TsaWvt0v8migutHM3M", // GHIZLANE - gentle, calming
      },
      "Dramatic & Expressive": {
        male: "JjTirzdD7T3GMLkwdd3a", // HMIDA - dramatic, expressive
        female: "yDl2vHQZjPaEFQPl8Tnr", // Mona - dramatic, storytelling
      },
    };
    return arabicVoices[voiceType]?.[gender] || arabicVoices["Warm & Friendly"][gender];
  }
  
  // Spanish native voices
  if (lang.includes("spanish") || lang.includes("español")) {
    const spanishVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "vAxdfYVShGAQEwKYqDZR", // Miguel - warm, friendly
        female: "GPzYRfJNEJniCw2WrKzi", // Yinet - warm, conversational
      },
      "Professional Narrator": {
        male: "BPoDAH7n4gFrnGY27Jkj", // Francisco - professional, clear
        female: "Xb7hH8MSUJpSbSDYk0k2", // Alice - professional, clear educator
      },
      "Energetic & Upbeat": {
        male: "15bJsujCI3tcDWeoZsQP", // Santiago - energetic, youthful
        female: "XrExE9yKIg1WjnnlVkGX", // Matilda - upbeat, professional
      },
      "Calm & Soothing": {
        male: "Yko7PKHZNXotIFUBG7I9", // Mateo - calm, soothing
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - reassuring, warm, mature
      },
      "Dramatic & Expressive": {
        male: "usTmJvQOCyW3nRcZ8OEo", // Dante - dramatic, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - velvety actress, dramatic
      },
    };
    return spanishVoices[voiceType]?.[gender] || spanishVoices["Warm & Friendly"][gender];
  }

  // French native voices - using multilingual voices with proper characteristics
  if (lang.includes("french") || lang.includes("français")) {
    const frenchVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, energetic
      },
      "Calm & Soothing": {
        male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, upbeat
        female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
      },
    };
    return frenchVoices[voiceType]?.[gender] || frenchVoices["Warm & Friendly"][gender];
  }

  // Japanese native voices
  if (lang.includes("japanese") || lang.includes("日本")) {
    const japaneseVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "wAWUBOIVEUw9IEUYoNzR", // Junichi - conversational
        female: "8EkOjt4xTPGMclNlh1pk", // Morioki - conversational
      },
      "Professional Narrator": {
        male: "b34JylakFZPlGS0BnwyY", // Kenzo - calm, professional
        female: "RBnMinrYKeccY3vaUxlZ", // Sakura Suzuki - young, clear
      },
      "Energetic & Upbeat": {
        male: "bqpOyYNUu11tjjvRUbKn", // Yamato - 20s-30s, YouTube style
        female: "8kS8nwk1TQdxvQOmfTZA", // Ena - refreshing
      },
      "Calm & Soothing": {
        male: "MlgbiBnm4o8N3DaDzblH", // Hiro Satake - calm narration
        female: "8EkOjt4xTPGMclNlh1pk", // Morioki - calm conversations
      },
      "Dramatic & Expressive": {
        male: "7V2labMjY8jnJlxDRW75", // Koby - deep, husky, dramatic
        female: "RBnMinrYKeccY3vaUxlZ", // Sakura Suzuki - expressive
      },
    };
    return japaneseVoices[voiceType]?.[gender] || japaneseVoices["Warm & Friendly"][gender];
  }

  // Korean native voices
  if (lang.includes("korean") || lang.includes("한국")) {
    const koreanVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "Ir7oQcBXWiq4oFGROCfj", // Taemin - warm, natural, friendly
        female: "AW5wrnG1jVizOYY7R1Oo", // JiYoung - warm, clear, friendly
      },
      "Professional Narrator": {
        male: "s07IwTCOrCDCaETjUVjx", // Hyun Bin - cool, professional
        female: "sSoVF9lUgTGJz0Xz3J9y", // Jina - news broadcasting
      },
      "Energetic & Upbeat": {
        male: "PDoCXqBQFGsvfO0hNkEs", // KKC HQ - young, bright
        female: "z6Kj0hecH20CdetSElRT", // Jennie - youthful, engaging
      },
      "Calm & Soothing": {
        male: "5XgfKMHL4qnyg2mabE5t", // DeckYuk - steady, trusted
        female: "DMkRitQrfpiddSQT5adl", // Jjeong - calm, soothing
      },
      "Dramatic & Expressive": {
        male: "4JJwo477JUAx3HV0T7n7", // YohanKoo - confident, authoritative
        female: "xi3rF0t7dg7uN2M0WUhr", // Yuna - expressive storytelling
      },
    };
    return koreanVoices[voiceType]?.[gender] || koreanVoices["Warm & Friendly"][gender];
  }

  // Portuguese native voices (Brazilian Portuguese)
  if (lang.includes("portuguese") || lang.includes("português")) {
    const portugueseVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "Libc4Ixlrn2thn1XQaDL", // Higor Bourges - confident, natural
        female: "iScHbNW8K33gNo3lGgbo", // Marianne - sweet, calm
      },
      "Professional Narrator": {
        male: "96cLX3dkyNUmTHwkNXeS", // Thiago Realista - middle aged, clear
        female: "CZD4BJ803C6T0alQxsR7", // Andreia I. - confident, enthusiastic
      },
      "Energetic & Upbeat": {
        male: "36rVQA1AOIPwpA3Hg1tC", // Matheus - young, energetic
        female: "OB6x7EbXYlhG4DDTB1XU", // Michelle - sweet, vibrant
      },
      "Calm & Soothing": {
        male: "Jvj2FoZHFrWICKQxQXqy", // SamuelPro - warm, natural
        female: "iScHbNW8K33gNo3lGgbo", // Marianne - sweet, calm
      },
      "Dramatic & Expressive": {
        male: "y3X5crcIDtFawPx7bcNq", // Eliel - deep, gravelly, epic
        female: "PZIBrGsMjLyYasEz50bI", // Jennifer - hyper-naturalistic
      },
    };
    return portugueseVoices[voiceType]?.[gender] || portugueseVoices["Warm & Friendly"][gender];
  }

  // Hebrew voices - using multilingual voices optimized for Hebrew
  if (lang.includes("hebrew") || lang.includes("עברית")) {
    const hebrewVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, professional
        female: "Xb7hH8MSUJpSbSDYk0k2", // Alice - confident, clear
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, soothing
        female: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, gentle
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - dramatic, velvety
      },
    };
    return hebrewVoices[voiceType]?.[gender] || hebrewVoices["Warm & Friendly"][gender];
  }

  // Italian native voices
  if (lang.includes("italian") || lang.includes("italiano")) {
    const italianVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "ChJuCmdw5W6I2qZbzwVl", // Luigi - young adult, warm
        female: "MLpDWJvrjFIdb63xbJp8", // Angelina - warm, gentle, calm
      },
      "Professional Narrator": {
        male: "Ha21jUwaMwdgQvqNslSM", // Fabi - rich, warm, tutorials
        female: "QttbagfgqUCm9K0VgUyT", // Aida - professional, dynamic
      },
      "Energetic & Upbeat": {
        male: "slEjHpiFudesZaivDTNt", // Piero Italia - dynamic, engaging
        female: "YQ36DZjvxVXPUHeSwvFK", // Valentina - young, fresh
      },
      "Calm & Soothing": {
        male: "549McXP1DeaUBfISRSST", // Stefano - calm, middle-aged
        female: "PS6wM7QnnPTUDE3t4bbl", // Serena - soothing, gentle
      },
      "Dramatic & Expressive": {
        male: "HQ7Ez220YT02q2IAnVFl", // Alberto Arte - distinctive, expressive
        female: "fQmr8dTaOQq116mo2X7F", // Samanta - warm, deep, vibrant
      },
    };
    return italianVoices[voiceType]?.[gender] || italianVoices["Warm & Friendly"][gender];
  }

  // Russian native voices
  if (lang.includes("russian") || lang.includes("русский")) {
    const russianVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "0BcDz9UPwL3MpsnTeUlO", // Denis - pleasant young, social media
        female: "tOo2BJ74frmnPadsDNIi", // Kate - young, calm, friendly
      },
      "Professional Narrator": {
        male: "2OdNfs9Z4GCMvoFiCavC", // Max - clear, professional
        female: "OowtKaZH9N7iuGbsd00l", // Veronica С. - professional, films
      },
      "Energetic & Upbeat": {
        male: "hU3rD0Yk7DoiYULTX1pD", // Dmitry D - energetic, confident
        female: "8M81RK3MD7u4DOJpu2G5", // Viktoriia - clear, enthusiastic
      },
      "Calm & Soothing": {
        male: "rUOpAdbAl56KxO00wR5D", // Igor - soothing, gentle
        female: "rxEz5E7hIAPk7D3bXwf6", // Anna - calm, meditation
      },
      "Dramatic & Expressive": {
        male: "Ga0Zjw9ZBbevb3wIda0V", // Artemii Levkoy - deep, hoarse, dramatic
        female: "FZGeNF7bE3syeQOynDKC", // Victoria - warm, expressive, confident
      },
    };
    return russianVoices[voiceType]?.[gender] || russianVoices["Warm & Friendly"][gender];
  }

  // Dutch native voices
  if (lang.includes("dutch") || lang.includes("nederlands")) {
    const dutchVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "dLPO5AsXc3FZDbTh1IKa", // Ido - clear, warm, friendly
        female: "gC9jy9VUxaXAswovchvQ", // Laura Peeters - calm, enthusiastic
      },
      "Professional Narrator": {
        male: "vEJ3qtg3sMsfnn5mIDnG", // Victor - professional, editorial
        female: "YUdpWWny7k5yb4QCeweX", // Ruth Professional - warm, articulate
      },
      "Energetic & Upbeat": {
        male: "XSQQLeoHwWnBv8tjJ1T7", // Eric - young, entertainment
        female: "gC9jy9VUxaXAswovchvQ", // Laura Peeters - enthusiastic
      },
      "Calm & Soothing": {
        male: "LKZ8pGqli4t1rXhzN7hq", // Milan - calm, expressive, warm
        female: "yO6w2xlECAQRFP6pX7Hw", // Ruth Children's - casual, soothing
      },
      "Dramatic & Expressive": {
        male: "G53Wkf3yrsXvhoQsmslL", // James - deep, powerful
        female: "ANHrhmaFeVN0QJaa0PhL", // Petra Vlaams - variation, expressive
      },
    };
    return dutchVoices[voiceType]?.[gender] || dutchVoices["Warm & Friendly"][gender];
  }

  // Persian (Farsi) voices - using multilingual voices optimized for Persian
  if (lang.includes("persian") || lang.includes("farsi") || lang.includes("فارسی")) {
    const persianVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, soothing
        female: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, gentle
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - dramatic, velvety
      },
    };
    return persianVoices[voiceType]?.[gender] || persianVoices["Warm & Friendly"][gender];
  }

  // Turkish voices - using multilingual voices optimized for Turkish
  if (lang.includes("turkish") || lang.includes("türkçe")) {
    const turkishVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, professional
        female: "Xb7hH8MSUJpSbSDYk0k2", // Alice - confident, clear
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
      },
    };
    return turkishVoices[voiceType]?.[gender] || turkishVoices["Warm & Friendly"][gender];
  }

  // Hindi voices - using multilingual voices optimized for Hindi
  if (lang.includes("hindi") || lang.includes("हिंदी")) {
    const hindiVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, soothing
        female: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, gentle
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - dramatic, velvety
      },
    };
    return hindiVoices[voiceType]?.[gender] || hindiVoices["Warm & Friendly"][gender];
  }

  // German native voices - using multilingual voices with proper characteristics
  if (lang.includes("german") || lang.includes("deutsch")) {
    const germanVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, energetic
      },
      "Calm & Soothing": {
        male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, upbeat
        female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
      },
    };
    return germanVoices[voiceType]?.[gender] || germanVoices["Warm & Friendly"][gender];
  }
  
  // Default: English/multilingual voices for other languages
  // Fixed mappings based on actual voice characteristics
  const defaultVoices: Record<string, { male: string; female: string }> = {
    "Warm & Friendly": {
      male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
      female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
    },
    "Professional Narrator": {
      male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
      female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
    },
    "Energetic & Upbeat": {
      male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
      female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, energetic
    },
    "Calm & Soothing": {
      male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
      female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
    },
    "Dramatic & Expressive": {
      male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, upbeat
      female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
    },
  };
  
  return defaultVoices[voiceType]?.[gender] || defaultVoices["Warm & Friendly"][gender];
}

/**
 * Get voice settings for ElevenLabs API
 */
function getVoiceSettings(voiceType: string) {
  const settingsMap: Record<string, { stability: number; similarity_boost: number; style: number }> = {
    "Warm & Friendly": {
      stability: 0.50,
      similarity_boost: 0.75,
      style: 0.60,
    },
    "Professional Narrator": {
      stability: 0.70,
      similarity_boost: 0.80,
      style: 0.40,
    },
    "Energetic & Upbeat": {
      stability: 0.30,
      similarity_boost: 0.70,
      style: 0.85,
    },
    "Calm & Soothing": {
      stability: 0.75,
      similarity_boost: 0.80,
      style: 0.30,
    },
    "Dramatic & Expressive": {
      stability: 0.35,
      similarity_boost: 0.75,
      style: 0.90,
    },
  };
  
  return settingsMap[voiceType] || settingsMap["Warm & Friendly"];
}

/**
 * Get preview text for a given language
 */
function getPreviewText(targetLanguage: string): string {
  const lang = targetLanguage.toLowerCase();
  
  if (lang.includes("chinese") || lang.includes("mandarin")) {
    return PREVIEW_TEXTS.chinese;
  }
  if (lang.includes("arabic") || lang.includes("عربي")) {
    return PREVIEW_TEXTS.arabic;
  }
  if (lang.includes("spanish") || lang.includes("español")) {
    return PREVIEW_TEXTS.spanish;
  }
  if (lang.includes("french") || lang.includes("français")) {
    return PREVIEW_TEXTS.french;
  }
  if (lang.includes("german") || lang.includes("deutsch")) {
    return PREVIEW_TEXTS.german;
  }
  if (lang.includes("japanese") || lang.includes("日本")) {
    return PREVIEW_TEXTS.japanese;
  }
  if (lang.includes("korean") || lang.includes("한국")) {
    return PREVIEW_TEXTS.korean;
  }
  if (lang.includes("portuguese") || lang.includes("português")) {
    return PREVIEW_TEXTS.portuguese;
  }
  if (lang.includes("italian") || lang.includes("italiano")) {
    return PREVIEW_TEXTS.italian;
  }
  if (lang.includes("russian") || lang.includes("русский")) {
    return PREVIEW_TEXTS.russian;
  }
  if (lang.includes("dutch") || lang.includes("nederlands")) {
    return PREVIEW_TEXTS.dutch;
  }
  if (lang.includes("hebrew") || lang.includes("עברית")) {
    return PREVIEW_TEXTS.hebrew;
  }
  if (lang.includes("persian") || lang.includes("farsi") || lang.includes("فارسی")) {
    return PREVIEW_TEXTS.persian;
  }
  if (lang.includes("turkish") || lang.includes("türkçe")) {
    return PREVIEW_TEXTS.turkish;
  }
  if (lang.includes("hindi") || lang.includes("हिंदी")) {
    return PREVIEW_TEXTS.hindi;
  }
  
  return PREVIEW_TEXTS.english;
}

/**
 * Generate a voice preview sample
 * Returns the URL of the generated audio file
 */
export async function generateVoicePreview(
  targetLanguage: string,
  voiceType: string,
  gender: "male" | "female"
): Promise<string> {
  const voiceId = getNativeVoiceId(targetLanguage, voiceType, gender);
  const voiceSettings = getVoiceSettings(voiceType);
  const previewText = getPreviewText(targetLanguage);

  console.log("[Voice Preview] Generating preview:", {
    targetLanguage,
    voiceType,
    gender,
    voiceId,
  });

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text: previewText,
        model_id: "eleven_multilingual_v2",
        voice_settings: voiceSettings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Voice Preview] ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Generate unique filename for preview
    const timestamp = Date.now();
    const sanitizedVoiceType = voiceType.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `voice-preview-${sanitizedVoiceType}-${gender}-${targetLanguage.replace(/[^a-zA-Z0-9]/g, "_")}-${timestamp}.mp3`;
    
    const { url } = await storagePut(
      `voice-previews/${fileName}`,
      audioData,
      "audio/mpeg"
    );

    console.log("[Voice Preview] Preview generated successfully:", url);
    return url;
  } catch (error) {
    console.error("[Voice Preview] Error generating preview:", error);
    throw error;
  }
}
