import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Award, Copy, BookOpen, Crown } from "lucide-react";
import { APP_TITLE } from "@/const";

type Period = "all-time" | "monthly" | "weekly";

export function Leaderboard() {
  const [period, setPeriod] = useState<Period>("all-time");
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.leaderboard.getLeaderboard.useQuery({
    period,
    limit: 50,
  });

  const top3 = data?.rankings.slice(0, 3) || [];
  const rest = data?.rankings.slice(3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Weekly Goals Leaderboard</h1>
          </div>
          <Button variant="ghost" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        {/* Period Filter */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={period === "all-time" ? "default" : "outline"}
            onClick={() => setPeriod("all-time")}
          >
            All Time
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "outline"}
            onClick={() => setPeriod("monthly")}
          >
            This Month
          </Button>
          <Button
            variant={period === "weekly" ? "default" : "outline"}
            onClick={() => setPeriod("weekly")}
          >
            This Week
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.rankings.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Rankings Yet</h2>
            <p className="text-muted-foreground">
              Be the first to create and share collections!
            </p>
          </Card>
        ) : (
          <>
            {/* Podium for Top 3 */}
            {top3.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  Top Achievers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div className="md:order-1 flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                          2
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gray-400 rounded-full p-2">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <Card className="p-6 w-full text-center border-2 border-gray-300">
                        <h3 
                          className="font-bold text-lg mb-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setLocation(`/profile/${top3[1].userId}`)}
                        >
                          {top3[1].userName}
                        </h3>
                        {top3[1].highestBadge && (
                          <Badge variant="outline" className="mb-3">
                            {top3[1].highestBadge.icon} {top3[1].highestBadge.name}
                          </Badge>
                        )}
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Copy className="h-4 w-4" />
                            <span className="font-semibold">{top3[1].totalClones.toLocaleString()}</span> clones
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-semibold">{top3[1].collectionCount}</span> collections
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Trophy className="h-4 w-4" />
                            <span className="font-semibold">{top3[1].badgeCount}</span> badges
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <div className="md:order-2 flex flex-col items-center">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl mb-4">
                          1
                        </div>
                        <div className="absolute -top-3 -right-3 bg-yellow-500 rounded-full p-3">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <Card className="p-6 w-full text-center border-4 border-yellow-400 shadow-xl">
                        <h3 
                          className="font-bold text-xl mb-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setLocation(`/profile/${top3[0].userId}`)}
                        >
                          {top3[0].userName}
                        </h3>
                        {top3[0].highestBadge && (
                          <Badge variant="outline" className="mb-3 border-yellow-400">
                            {top3[0].highestBadge.icon} {top3[0].highestBadge.name}
                          </Badge>
                        )}
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Copy className="h-4 w-4" />
                            <span className="font-semibold text-base">{top3[0].totalClones.toLocaleString()}</span> clones
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-semibold text-base">{top3[0].collectionCount}</span> collections
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Trophy className="h-4 w-4" />
                            <span className="font-semibold text-base">{top3[0].badgeCount}</span> badges
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <div className="md:order-3 flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                          3
                        </div>
                        <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-2">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <Card className="p-6 w-full text-center border-2 border-orange-300">
                        <h3 
                          className="font-bold text-lg mb-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setLocation(`/profile/${top3[2].userId}`)}
                        >
                          {top3[2].userName}
                        </h3>
                        {top3[2].highestBadge && (
                          <Badge variant="outline" className="mb-3">
                            {top3[2].highestBadge.icon} {top3[2].highestBadge.name}
                          </Badge>
                        )}
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Copy className="h-4 w-4" />
                            <span className="font-semibold">{top3[2].totalClones.toLocaleString()}</span> clones
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-semibold">{top3[2].collectionCount}</span> collections
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Trophy className="h-4 w-4" />
                            <span className="font-semibold">{top3[2].badgeCount}</span> badges
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rest of Rankings */}
            {rest.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Rankings</h2>
                <div className="space-y-2">
                  {rest.map((creator) => (
                    <Card key={creator.userId} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-bold text-white flex-shrink-0">
                          #{creator.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 
                              className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={() => setLocation(`/profile/${creator.userId}`)}
                            >
                              {creator.userName}
                            </h3>
                            {creator.highestBadge && (
                              <Badge variant="outline" className="text-xs">
                                {creator.highestBadge.icon} {creator.highestBadge.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Copy className="h-3.5 w-3.5" />
                              {creator.totalClones.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {creator.collectionCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5" />
                              {creator.badgeCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
