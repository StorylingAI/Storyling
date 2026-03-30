import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { BookOpen, Sparkles, Save, Loader2, Volume2, BookMarked } from 'lucide-react';
import { useConfetti } from '../components/Confetti';
import { toast } from 'sonner';

type Language = 'Chinese' | 'French' | 'Spanish' | 'German';

interface WordExplanation {
  word: string;
  translation: string;
  pinyin?: string;
  partOfSpeech: string;
  grammarNotes: string;
  examples: Array<{ sentence: string; translation: string }>;
  culturalNotes?: string;
}

export default function ReadingAssistant() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<Language>('Chinese');
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordExplanation, setWordExplanation] = useState<WordExplanation | null>(null);
  const { celebrate } = useConfetti();

  const analyzeMutation = trpc.readingAssistant.analyzeText.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success(`Text analyzed! Found ${data.vocabulary?.length || 0} key words 🎉`);
    },
    onError: () => {
      toast.error('Failed to analyze text');
    },
  });

  const explainMutation = trpc.readingAssistant.explainWord.useMutation({
    onSuccess: (data) => {
      setWordExplanation(data as WordExplanation);
    },
    onError: () => {
      toast.error('Failed to get explanation');
    },
  });

  const generateStoryMutation = trpc.readingAssistant.generateStoryFromText.useMutation({
    onSuccess: (data) => {
      celebrate(100);
      toast.success('Story generated! Check your library 📚');
      console.log('Generated story:', data);
    },
    onError: () => {
      toast.error('Failed to generate story');
    },
  });

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast.error('Please enter some text first');
      return;
    }
    analyzeMutation.mutate({
      text: text.trim(),
      targetLanguage,
      userLevel: 'intermediate',
    });
  };

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    explainMutation.mutate({
      word,
      context: text.substring(0, 500),
      targetLanguage,
    });
  };

  const handleGenerateStory = () => {
    if (!analysis) {
      toast.error('Please analyze text first');
      return;
    }
    generateStoryMutation.mutate({
      sourceText: text,
      targetLanguage,
      vocabularyFocus: analysis.vocabulary?.map((v: any) => v.word),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-peach/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-coral to-peach p-3 rounded-2xl shadow-lg hover-pop">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-coral via-lavender to-sunshine bg-clip-text text-transparent">
              AI Reading Assistant
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Read anything in your target language with AI support ✨
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="card-playful bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BookMarked className="w-6 h-6 text-coral" />
                Your Text
              </h2>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as Language)}
                className="px-4 py-2 border-2 border-lavender/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender transition-all"
              >
                <option value="Chinese">🇨🇳 Chinese</option>
                <option value="French">🇫🇷 French</option>
                <option value="Spanish">🇪🇸 Spanish</option>
                <option value="German">🇩🇪 German</option>
              </select>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Paste any ${targetLanguage} text here...\n\nTry a paragraph from a book, article, or even a menu!`}
              className="w-full h-64 p-4 border-2 border-peach/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral transition-all resize-none font-mono text-sm"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || !text.trim()}
                className="flex-1 bg-gradient-to-r from-coral to-peach text-white px-6 py-3 rounded-xl font-semibold hover-lift btn-squish disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Text
                  </>
                )}
              </button>

              {analysis && (
                <button
                  onClick={handleGenerateStory}
                  disabled={generateStoryMutation.isPending}
                  className="bg-gradient-to-r from-lavender to-sunshine text-white px-6 py-3 rounded-xl font-semibold hover-lift btn-squish disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  {generateStoryMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                  Story
                </button>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          <div className="card-playful bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-sunshine" />
              AI Analysis
            </h2>

            {!analysis && !analyzeMutation.isPending && (
              <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <p className="text-lg">Paste some text and click "Analyze" to get started!</p>
                <p className="text-sm mt-2">I'll help you understand vocabulary, grammar, and more ✨</p>
              </div>
            )}

            {analyzeMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="loading-fun mb-4" style={{ width: '40px', height: '40px' }}></div>
                <p className="text-muted-foreground">Analyzing your text...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4 animate-slide-up">
                {/* Difficulty Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
                  <span className={`badge-${analysis.difficultyLevel === 'beginner' ? 'new' : 'trending'}`}>
                    {analysis.difficultyLevel}
                  </span>
                </div>

                {/* Summary */}
                {analysis.summary && (
                  <div className="p-4 bg-cream rounded-xl border-2 border-peach/20">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Summary</h3>
                    <p className="text-foreground">{analysis.summary}</p>
                  </div>
                )}

                {/* Vocabulary */}
                {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Save className="w-4 h-4 text-coral" />
                      Key Vocabulary ({analysis.vocabulary.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analysis.vocabulary.map((vocab: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleWordClick(vocab.word)}
                          className="w-full text-left p-3 bg-gradient-to-r from-lavender/10 to-peach/10 rounded-lg hover-lift btn-squish border-2 border-transparent hover:border-coral/30 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-foreground">{vocab.word}</span>
                              {vocab.pinyin && (
                                <span className="text-sm text-muted-foreground ml-2">({vocab.pinyin})</span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">{vocab.translation}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grammar Patterns */}
                {analysis.grammarPatterns && analysis.grammarPatterns.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Grammar Patterns</h3>
                    <ul className="space-y-2">
                      {analysis.grammarPatterns.map((pattern: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-sunshine mt-1">✦</span>
                          <span className="text-sm text-foreground">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Word Explanation Modal */}
        {wordExplanation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={() => setWordExplanation(null)}
          >
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-3xl font-bold text-foreground">{wordExplanation.word}</h3>
                  {wordExplanation.pinyin && (
                    <p className="text-lg text-muted-foreground">{wordExplanation.pinyin}</p>
                  )}
                </div>
                <button
                  onClick={() => setWordExplanation(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-coral/10 rounded-xl">
                  <p className="text-xl font-semibold text-foreground">{wordExplanation.translation}</p>
                  <p className="text-sm text-muted-foreground mt-1">{wordExplanation.partOfSpeech}</p>
                </div>

                {wordExplanation.grammarNotes && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Grammar Notes</h4>
                    <p className="text-sm text-muted-foreground">{wordExplanation.grammarNotes}</p>
                  </div>
                )}

                {wordExplanation.examples && wordExplanation.examples.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Examples</h4>
                    <div className="space-y-3">
                      {wordExplanation.examples.map((example, index) => (
                        <div key={index} className="p-3 bg-lavender/10 rounded-lg">
                          <p className="font-medium text-foreground">{example.sentence}</p>
                          <p className="text-sm text-muted-foreground mt-1">{example.translation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {wordExplanation.culturalNotes && (
                  <div className="p-4 bg-sunshine/10 rounded-xl border-2 border-sunshine/20">
                    <h4 className="font-semibold text-foreground mb-2">💡 Cultural Note</h4>
                    <p className="text-sm text-foreground">{wordExplanation.culturalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
