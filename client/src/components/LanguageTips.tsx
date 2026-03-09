import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLanguageTips, type LanguageTip } from '../../../shared/languageTips';
import { Lightbulb, Sparkles } from 'lucide-react';

interface LanguageTipsProps {
  language: string;
  maxTips?: number;
  showCategory?: boolean;
  variant?: 'default' | 'compact';
}

const categoryColors: Record<LanguageTip['category'], string> = {
  pronunciation: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  grammar: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  vocabulary: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  culture: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  practice: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

const categoryLabels: Record<LanguageTip['category'], string> = {
  pronunciation: 'Pronunciation',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  culture: 'Culture',
  practice: 'Practice',
};

export function LanguageTips({
  language,
  maxTips,
  showCategory = true,
  variant = 'default',
}: LanguageTipsProps) {
  const allTips = getLanguageTips(language);
  const tips = maxTips ? allTips.slice(0, maxTips) : allTips;

  if (tips.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Learning Tips for {language}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
              <div className="text-2xl flex-shrink-0">{tip.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{tip.title}</h4>
                  {showCategory && (
                    <Badge variant="secondary" className={`text-xs ${categoryColors[tip.category]}`}>
                      {categoryLabels[tip.category]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          Learning Tips for {language}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Culturally relevant advice to accelerate your learning
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl flex-shrink-0">{tip.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-base">{tip.title}</h4>
                {showCategory && (
                  <Badge variant="secondary" className={categoryColors[tip.category]}>
                    {categoryLabels[tip.category]}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
