import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Sparkles, Clock, Star, Users, BookOpen, ArrowLeft, Search, X } from "lucide-react";
import { APP_LOGO } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Discover() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string | undefined>(undefined);
  const [difficultyFilter, setDifficultyFilter] = useState<string | undefined>(undefined);
  const [themeFilter, setThemeFilter] = useState<string | undefined>(undefined);

  const { data: feed, isLoading } = trpc.discovery.getDiscoveryFeed.useQuery({
    userId: user?.id,
    limit: 20,
    searchQuery: searchQuery || undefined,
    language: languageFilter,
    difficulty: difficultyFilter,
    theme: themeFilter,
  });

  const hasActiveFilters = searchQuery || languageFilter || difficultyFilter || themeFilter;
  const clearFilters = () => {
    setSearchQuery("");
    setLanguageFilter(undefined);
    setDifficultyFilter(undefined);
    setThemeFilter(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading discoveries...</p>
        </div>
      </div>
    );
  }

  const CollectionCard = ({ collection }: { collection: any }) => (
    <Card
      className="rounded-card border-2 hover-lift transition-all cursor-pointer"
      style={{ borderColor: collection.color || '#8b5cf6' }}
      onClick={() => collection.shareToken && setLocation(`/shared/${collection.shareToken}`)}
    >
      <CardContent className="py-6">
        <div className="flex items-start gap-4">
          {/* Collection Icon */}
          <div
            className="w-16 h-16 rounded-card flex items-center justify-center text-white text-2xl font-bold shadow-playful flex-shrink-0"
            style={{ backgroundColor: collection.color || '#8b5cf6' }}
          >
            {collection.name.charAt(0).toUpperCase()}
          </div>

          {/* Collection Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg mb-1 line-clamp-2">{collection.name}</h4>
            {collection.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {collection.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">by {collection.userName}</span>
              <Badge variant="secondary" className="rounded-full">
                <Users className="h-3 w-3 mr-1" />
                {collection.cloneCount}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {collection.itemCount} stories
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-playful">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={APP_LOGO} alt="Storyling.ai" className="h-10 w-10" />
            <h1 className="text-2xl font-bold gradient-text-primary">Discover</h1>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-card p-6 shadow-playful border-2">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-button"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={languageFilter} onValueChange={(value) => setLanguageFilter(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-[180px] rounded-button">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                  <SelectItem value="Korean">Korean</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-[180px] rounded-button">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={themeFilter} onValueChange={(value) => setThemeFilter(value === "all" ? undefined : value)}>
                <SelectTrigger className="w-[180px] rounded-button">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Culture">Culture</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Romance">Romance</SelectItem>
                  <SelectItem value="Mystery">Mystery</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-button"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Result Count */}
            {(feed?.trending || feed?.new || feed?.popular || feed?.personalized) && (
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const total = (feed?.trending?.length || 0) + (feed?.new?.length || 0) + (feed?.popular?.length || 0) + (feed?.personalized?.length || 0);
                  return `${total} collection${total !== 1 ? 's' : ''} found`;
                })()}
              </p>
            )}
          </div>
        </div>
        {/* Personalized Section (only for logged-in users) */}
        {user && feed?.personalized && feed.personalized.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-purple-500" />
              <h2 className="text-3xl font-bold">For You</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Based on your learning preferences and language goals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.personalized.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        {feed?.trending && feed.trending.length > 0 && (
          <section className="animate-slide-up stagger-1">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <h2 className="text-3xl font-bold">Trending Now</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Most popular collections this week
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.trending.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}

        {/* New Collections Section */}
        {feed?.new && feed.new.length > 0 && (
          <section className="animate-slide-up stagger-2">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-teal-500" />
              <h2 className="text-3xl font-bold">Fresh Collections</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Recently created by the community
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.new.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}

        {/* Popular Section */}
        {feed?.popular && feed.popular.length > 0 && (
          <section className="animate-slide-up stagger-3">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-3xl font-bold">All-Time Favorites</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Most cloned collections of all time
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.popular.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!feed?.trending?.length && !feed?.new?.length && !feed?.popular?.length && (
          <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-32 h-32 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">No collections yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create and share a collection!
              </p>
              <Button
                onClick={() => setLocation("/collections")}
                className="rounded-button gradient-primary text-white hover-lift border-0"
              >
                Create Collection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
