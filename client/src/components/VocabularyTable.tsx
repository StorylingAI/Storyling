import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Volume2, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VocabularyWord {
  word: string;
  pinyin?: string;
  translation?: string;
  exampleSentences?: string[];
  audioUrl?: string;
}

interface VocabularyData {
  word: string;
  pinyin?: string;
  translation: string;
  exampleSentences: string[];
}

interface VocabularyTableProps {
  words: string[];
  targetLanguage: string;
  vocabularyTranslations?: Record<string, VocabularyData>;
}

export function VocabularyTable({
  words,
  targetLanguage,
  vocabularyTranslations,
}: VocabularyTableProps) {
  console.log("VocabularyTable received words:", words);
  console.log("VocabularyTable words type:", typeof words, Array.isArray(words));
  console.log("VocabularyTable vocabularyTranslations:", vocabularyTranslations);
  
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const utils = trpc.useUtils();
  const saveWordMutation = trpc.wordbank.saveWord.useMutation({
    onSuccess: (_, variables) => {
      setSavedWords((prev) => new Set(Array.from(prev).concat(variables.word)));
      toast.success("Word saved to wordbank!");
      utils.wordbank.getMyWords.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save word");
    },
  });

  // Check if language is Chinese
  const isChinese =
    targetLanguage?.toLowerCase().includes("chinese") ||
    targetLanguage?.toLowerCase().includes("mandarin");

  const generateAudioMutation = trpc.audio.generateWordAudio.useMutation();

  const handlePlayAudio = async (word: string) => {
    setPlayingWord(word);
    
    try {
      const result = await generateAudioMutation.mutateAsync({
        word,
        targetLanguage,
      });

      // Play the audio
      const audio = new Audio(result.audioUrl);
      audio.onended = () => setPlayingWord(null);
      audio.onerror = () => {
        toast.error("Failed to play audio");
        setPlayingWord(null);
      };
      await audio.play();
    } catch (error) {
      console.error("Audio generation failed:", error);
      toast.error("Failed to generate audio");
      setPlayingWord(null);
    }
  };

  const handleSaveWord = async (word: string) => {
    const vocabData = vocabularyTranslations?.[word];
    
    // Allow saving even without full vocab data - use word itself as fallback
    saveWordMutation.mutate({
      word,
      pinyin: vocabData?.pinyin,
      translation: vocabData?.translation || "",
      targetLanguage,
      exampleSentences: vocabData?.exampleSentences || [],
    });
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-bold">Word</TableHead>
            {isChinese && <TableHead className="font-bold">Pinyin</TableHead>}
            <TableHead className="font-bold">Translation</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.map((word, idx) => {
            const vocabData = vocabularyTranslations?.[word];
            const translation = vocabData?.translation || "—";
            const pinyin = vocabData?.pinyin || "—";
            const isSaved = savedWords.has(word);

            return (
              <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-lg">{word}</TableCell>
                {isChinese && (
                  <TableCell className="text-muted-foreground italic">
                    {pinyin}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{translation}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handlePlayAudio(word)}
                      disabled={playingWord === word}
                    >
                      <Volume2
                        className={`h-4 w-4 ${
                          playingWord === word ? "animate-pulse text-primary" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleSaveWord(word)}
                      disabled={isSaved || saveWordMutation.isPending}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <BookmarkPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
