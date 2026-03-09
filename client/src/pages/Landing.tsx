import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Play, Sparkles, BookOpen, Mic, Film, Target, Upload, Palette, Headphones, Star, Quote, X, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";



// Featured Collections Grid Component
function FeaturedCollectionsGrid() {
  const [, setLocation] = useLocation();
  const { data: featuredCollections } = trpc.collections.getFeaturedCollections.useQuery({ limit: 10 });

  if (!featuredCollections || featuredCollections.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <div className="container">
        <div className="text-center mb-12 animate-bounce-in">
          <Badge className="rounded-full px-4 py-2 mb-4 bg-gradient-to-r from-purple-500 to-teal-500 text-white border-0">
            <Star className="inline h-4 w-4 mr-2" />
            Featured Collections
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Explore Popular Learning Collections
          </h2>
          <p className="text-lg text-muted-foreground">
            Curated by our community of language learners
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredCollections.map((collection, index) => (
            <Card 
              key={collection.id}
              className="rounded-card shadow-playful hover-lift transition-all cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => collection.shareToken && setLocation(`/shared/${collection.shareToken}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Collection Icon */}
                  <div 
                    className="w-16 h-16 rounded-card flex items-center justify-center text-white text-2xl font-bold shadow-playful flex-shrink-0"
                    style={{ backgroundColor: collection.color || '#8b5cf6' }}
                  >
                    {collection.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Collection Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 truncate">{collection.name}</h3>
                    <p className="text-sm text-muted-foreground">by {collection.userName}</p>
                  </div>
                </div>

                {collection.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="rounded-full text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {collection.itemCount} stories
                    </Badge>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {collection.cloneCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button 
            variant="outline"
            className="rounded-full"
            onClick={() => setLocation("/discovery?tab=collections")}
          >
            View All Collections
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDemoModal(false);
    };
    if (showDemoModal) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showDemoModal]);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-playful"
            : "bg-transparent"
        }`}
      >
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={APP_LOGO} alt="Flip" className="h-12 w-12" />
            <span className="text-2xl font-bold gradient-text-primary">{APP_TITLE}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <button onClick={() => setLocation("/pricing")} className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = getLoginUrl()}
              className="rounded-button hover-scale active-scale transition-all"
            >
              Login
            </Button>
            <Button
              onClick={() => setLocation("/signup")}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
            >
              Sign Up Free
            </Button>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-button"
            onClick={() => setLocation("/signup")}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(20,184,166,0.15),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.15),transparent_50%)]" />
        
        {/* Floating book emoji */}
        <div className="absolute top-12 md:top-20 right-4 md:right-20 text-4xl md:text-6xl lg:text-8xl animate-float opacity-80">
          📖
        </div>

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <Badge className="rounded-full px-4 py-2 gradient-primary text-white border-0 shadow-playful">
              <Sparkles className="inline h-4 w-4 mr-2" />
              Trusted by 35,000+ language learners
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight px-2" style={{ fontFamily: '"Fredoka One", cursive' }}>
              Learn Languages Like You Live Them
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto px-4">
              Transform your vocabulary into immersive AI-generated podcasts and films
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Button
                size="lg"
                onClick={() => setLocation("/app")}
                className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold text-white border-0 shadow-playful-lg hover-lift active-scale transition-all w-full sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #14B8A6 100%)' }}
              >
                Start Learning Free
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowDemoModal(true)}
                className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold border-2 border-gray-800 hover:bg-gray-50 hover-lift active-scale transition-all w-full sm:w-auto"
              >
                <Play className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Product Demo Video */}
            <div className="mt-8 sm:mt-12 md:mt-16 relative">
              <div className="rounded-card overflow-hidden shadow-playful-lg border-2 sm:border-4 border-white bg-gradient-to-br from-purple-900 to-teal-900 aspect-video flex items-center justify-center relative group">
                {/* Video Demo Placeholder - Replace with actual video */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-teal-600/90 flex items-center justify-center">
                  <div className="text-center space-y-4 px-4 z-10">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Play className="h-10 w-10 text-white ml-1" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white mb-2">
                        See Storyling AI in Action
                      </p>
                      <p className="text-sm text-white/80">
                        Watch how learners transform vocabulary into immersive stories
                      </p>
                    </div>
                  </div>
                  {/* Animated background elements */}
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
                {/* Uncomment when video is ready:
                <video 
                  className="w-full h-full object-cover"
                  poster="/demo-thumbnail.jpg"
                  controls
                  preload="metadata"
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                */}
              </div>
              {/* Floating elements */}
              <div className="absolute -top-3 sm:-top-6 -left-3 sm:-left-6 w-12 sm:w-20 h-12 sm:h-20 bg-purple-400 rounded-full opacity-20 animate-float" />
              <div className="absolute -bottom-4 sm:-bottom-8 -right-4 sm:-right-8 w-20 sm:w-32 h-20 sm:h-32 bg-teal-400 rounded-full opacity-20 animate-float" style={{ animationDelay: "1s" }} />
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="container">
          <div className="text-center mb-16 animate-bounce-in">
            <Badge className="rounded-full px-4 py-2 mb-4">
              <Star className="inline h-4 w-4 mr-2" />
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Learn Your Way
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose how you want to learn - through audio stories or visual films
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1: Podcast Mode */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow active-scale transition-all animate-slide-up cursor-pointer">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto hover-bounce transition-all">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">🎙️ Podcast Mode</h3>
                <p className="text-muted-foreground">
                  Listen to your vocabulary in AI-generated stories. Choose themes, voices, and learn anywhere.
                </p>
                <ul className="text-sm text-left space-y-2 pt-4">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Professional AI voices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Custom themes & genres</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Learn on the go</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: Film Mode */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow active-scale transition-all animate-slide-up stagger-1 cursor-pointer">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full gradient-warm flex items-center justify-center mx-auto hover-bounce transition-all">
                  <Film className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">🎬 Film Mode</h3>
                <p className="text-muted-foreground">
                  Watch your words come alive in stunning AI-generated short films.
                </p>
                <ul className="text-sm text-left space-y-2 pt-4">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span>Cinematic AI videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span>Visual storytelling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span>Immersive learning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3: Context Learning */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow active-scale transition-all animate-slide-up stagger-2 cursor-pointer">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full gradient-success flex items-center justify-center mx-auto hover-bounce transition-all">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">🎯 Context Learning</h3>
                <p className="text-muted-foreground">
                  Learn through stories, not flashcards. Your brain remembers better.
                </p>
                <ul className="text-sm text-left space-y-2 pt-4">
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-lime-500 mt-0.5 flex-shrink-0" />
                    <span>Emotional connections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-lime-500 mt-0.5 flex-shrink-0" />
                    <span>Real-world usage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-lime-500 mt-0.5 flex-shrink-0" />
                    <span>Better retention</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Students vs For Teachers Section */}
      <section id="who-its-for" className="py-20 px-4 bg-gradient-to-br from-blue-50 via-teal-50 to-green-50">
        <div className="container">
          <div className="text-center mb-16 animate-bounce-in">
            <Badge className="rounded-full px-4 py-2 mb-4">
              <Target className="inline h-4 w-4 mr-2" />
              Who It's For
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for Learners & Educators
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're learning solo or teaching a class, Storyling.ai adapts to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* For Students */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow transition-all animate-slide-up">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">For Students</h3>
                  <p className="text-muted-foreground">
                    Learn at your own pace with personalized content
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Self-Paced Learning</p>
                      <p className="text-sm text-muted-foreground">Create stories from your vocabulary lists anytime</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Interactive Quizzes</p>
                      <p className="text-sm text-muted-foreground">Test your knowledge with AI-generated questions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Progress Tracking</p>
                      <p className="text-sm text-muted-foreground">Visualize your vocabulary mastery over time</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Spaced Repetition</p>
                      <p className="text-sm text-muted-foreground">Smart algorithm prioritizes words you struggle with</p>
                    </div>
                  </li>
                </ul>
                <Button
                  className="w-full rounded-button gradient-primary text-white hover-lift active-scale border-0"
                  onClick={() => setLocation("/app")}
                >
                  Start Learning Free
                </Button>
              </CardContent>
            </Card>

            {/* For Teachers */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow transition-all animate-slide-up stagger-1">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">For Teachers</h3>
                  <p className="text-muted-foreground">
                    Manage classes and track student progress effortlessly
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Class Management</p>
                      <p className="text-sm text-muted-foreground">Create classes, enroll students, assign content</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Bulk Enrollment</p>
                      <p className="text-sm text-muted-foreground">Upload CSV to enroll entire class rosters instantly</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Analytics Dashboard</p>
                      <p className="text-sm text-muted-foreground">Track quiz scores, vocabulary mastery, and engagement</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Batch Content Generation</p>
                      <p className="text-sm text-muted-foreground">Create multiple stories at once for your curriculum</p>
                    </div>
                  </li>
                </ul>
                <Button
                  className="w-full rounded-button gradient-warm text-white hover-lift active-scale border-0"
                  onClick={() => setLocation("/teacher")}
                >
                  Explore Teacher Tools
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
        <div className="container">
          <div className="text-center mb-16 animate-bounce-in">
            <Badge className="rounded-full px-4 py-2 mb-4">
              <BookOpen className="inline h-4 w-4 mr-2" />
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Start Learning in 4 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From vocabulary to immersive content in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center space-y-4 animate-scale-in">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto text-3xl font-bold text-white shadow-playful hover-bounce transition-all">
                1
              </div>
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Upload Your Vocabulary</h3>
                <p className="text-sm text-muted-foreground">
                  Paste words or upload a CSV file
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4 animate-scale-in stagger-1">
              <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center mx-auto text-3xl font-bold text-white shadow-playful hover-bounce transition-all">
                2
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Mic className="h-8 w-8 text-pink-500" />
                  <Film className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold">Choose Format</h3>
                <p className="text-sm text-muted-foreground">
                  Podcast or Film Mode
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 animate-scale-in stagger-2">
              <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto text-3xl font-bold text-white shadow-playful hover-bounce transition-all">
                3
              </div>
              <div className="space-y-2">
                <Palette className="h-8 w-8 mx-auto text-lime-500" />
                <h3 className="text-xl font-bold">Customize Your Story</h3>
                <p className="text-sm text-muted-foreground">
                  Pick theme, voice, and style
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="text-center space-y-4 animate-scale-in stagger-3">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto text-3xl font-bold text-white shadow-playful hover-bounce transition-all">
                4
              </div>
              <div className="space-y-2">
                <Headphones className="h-8 w-8 mx-auto text-teal-500" />
                <h3 className="text-xl font-bold">Learn While Entertained</h3>
                <p className="text-sm text-muted-foreground">
                  Enjoy your personalized content
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => setLocation("/signup")}
              className="rounded-button gradient-primary text-white hover-lift border-0 h-14 text-lg px-8"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Try It Free Now
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Collections Grid */}
      <FeaturedCollectionsGrid />

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 via-white to-teal-50">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">
              Trusted by Educators & Institutions Worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity">
              <img src="/images/trust/harvard.png" alt="Harvard University" className="h-12 md:h-16 grayscale hover:grayscale-0 transition-all" />
              <img src="/images/trust/mcgill.png" alt="McGill University" className="h-12 md:h-16 grayscale hover:grayscale-0 transition-all" />
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold gradient-text-primary">500+</div>
                <div className="text-xs text-muted-foreground">Schools</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold gradient-text-warm">50K+</div>
                <div className="text-xs text-muted-foreground">Active Learners</div>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-card bg-white shadow-playful hover-lift transition-all">
              <div className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2">2.5M+</div>
              <div className="text-sm text-muted-foreground">Stories Created</div>
            </div>
            <div className="text-center p-6 rounded-card bg-white shadow-playful hover-lift transition-all">
              <div className="text-3xl md:text-4xl font-bold gradient-text-warm mb-2">19</div>
              <div className="text-sm text-muted-foreground">Languages Supported</div>
            </div>
            <div className="text-center p-6 rounded-card bg-white shadow-playful hover-lift transition-all">
              <div className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div className="text-center p-6 rounded-card bg-white shadow-playful hover-lift transition-all">
              <div className="text-3xl md:text-4xl font-bold gradient-text-warm mb-2">4.8★</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container">
          <div className="text-center mb-16 animate-bounce-in">
            <Badge className="rounded-full px-4 py-2 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Quote className="inline h-4 w-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join 35,000+ Happy Learners
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how Storyling AI has transformed the way thousands learn languages
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift transition-all animate-slide-up">
              <CardContent className="pt-8 pb-8 space-y-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <Quote className="h-8 w-8 text-purple-500 opacity-50" />
                <p className="text-muted-foreground italic">
                  "This is exactly what I needed! Learning Spanish through stories is so much more engaging than flashcards. I actually look forward to my daily lessons now."
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                  <div>
                    <p className="font-semibold">Sarah M.</p>
                    <p className="text-sm text-muted-foreground">Spanish Learner</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift transition-all animate-slide-up stagger-1">
              <CardContent className="pt-8 pb-8 space-y-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <Quote className="h-8 w-8 text-teal-500 opacity-50" />
                <p className="text-muted-foreground italic">
                  "The AI-generated podcasts are incredible! I listen during my commute and I'm learning French faster than I ever did with traditional apps."
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                    J
                  </div>
                  <div>
                    <p className="font-semibold">James L.</p>
                    <p className="text-sm text-muted-foreground">French Learner</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="rounded-card shadow-playful-lg border-2 hover-lift transition-all animate-slide-up stagger-2">
              <CardContent className="pt-8 pb-8 space-y-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <Quote className="h-8 w-8 text-pink-500 opacity-50" />
                <p className="text-muted-foreground italic">
                  "Film Mode is a game-changer! Watching my vocabulary come to life in short films makes learning Japanese so much fun and memorable."
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                    E
                  </div>
                  <div>
                    <p className="font-semibold">Emily K.</p>
                    <p className="text-sm text-muted-foreground">Japanese Learner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
        <div className="container">
          <Card className="rounded-card shadow-playful-lg border-4 border-white max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-12 text-center space-y-6 bg-gradient-to-br from-purple-500 via-teal-500 to-pink-500">
              <img src={APP_LOGO} alt="Flip" className="h-24 w-24 mx-auto animate-float" />
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Start creating personalized language learning content today. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/app")}
                  className="rounded-button bg-white text-primary hover:bg-white/90 hover-lift border-0 h-14 text-lg px-8 font-bold"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-button hover-lift h-14 text-lg px-8 border-2 border-white text-white hover:bg-white/10"
                >
                  View Pricing
                </Button>
              </div>
              <p className="text-sm text-white/80">
                Join 35,000+ learners • Free forever plan available
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Watch Demo Modal */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowDemoModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all hover-scale active-scale"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Video Placeholder */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {/* 16:9 Aspect Ratio */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Demo Video Coming Soon!</h3>
                  <p className="text-white/90 max-w-md mx-auto">
                    We're creating an amazing product walkthrough to show you how Storyling.ai transforms vocabulary into immersive stories.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-gray-800">Ready to start learning?</h4>
                  <p className="text-sm text-gray-600">Create your first story in minutes</p>
                </div>
                <Button
                  onClick={() => {
                    setShowDemoModal(false);
                    setLocation("/app");
                  }}
                  className="rounded-full px-6 py-3 gradient-primary text-white border-0 hover-lift active-scale transition-all"
                >
                  Start Learning Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
