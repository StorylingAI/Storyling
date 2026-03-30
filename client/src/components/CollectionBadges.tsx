import { Badge } from "@/components/ui/badge";

interface CollectionBadgesProps {
  cloneCount: number;
  className?: string;
}

// Badge definitions matching server-side achievements
const BADGE_TIERS = [
  { threshold: 10000, name: "Iconic Collection", icon: "💎", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { threshold: 1000, name: "Legend Creator", icon: "👑", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { threshold: 500, name: "Viral Collection", icon: "🔥", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { threshold: 100, name: "Popular Collection", icon: "⭐", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { threshold: 50, name: "Rising Creator", icon: "📈", color: "bg-green-100 text-green-800 border-green-300" },
  { threshold: 10, name: "Collection Starter", icon: "🌱", color: "bg-teal-100 text-teal-800 border-teal-300" },
];

export function CollectionBadges({ cloneCount, className = "" }: CollectionBadgesProps) {
  // Find the highest badge tier achieved
  const achievedBadge = BADGE_TIERS.find((tier) => cloneCount >= tier.threshold);

  if (!achievedBadge) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className={`${achievedBadge.color} border font-medium`}>
        <span className="mr-1.5">{achievedBadge.icon}</span>
        {achievedBadge.name}
      </Badge>
    </div>
  );
}

// Component to show progress to next milestone
interface NextMilestoneProps {
  cloneCount: number;
  className?: string;
}

export function NextMilestone({ cloneCount, className = "" }: NextMilestoneProps) {
  // Find the next badge tier to achieve
  const nextBadge = BADGE_TIERS.slice()
    .reverse()
    .find((tier) => cloneCount < tier.threshold);

  if (!nextBadge) {
    // Already at max tier
    return null;
  }

  const progress = (cloneCount / nextBadge.threshold) * 100;
  const remaining = nextBadge.threshold - cloneCount;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Next: {nextBadge.icon} {nextBadge.name}
        </span>
        <span className="font-medium text-muted-foreground">
          {remaining} more {remaining === 1 ? "clone" : "clones"}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
