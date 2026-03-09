import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Play, 
  Search, 
  HelpCircle, 
  Video, 
  FileText, 
  Sparkles,
  Mic,
  Film,
  Library,
  BookMarked,
  TrendingUp,
  Users,
  Settings,
  Gift
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: "getting-started" | "features" | "advanced";
  action: () => void;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: "account" | "learning" | "technical" | "billing";
  content: string;
}

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
}

export default function HelpTutorials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const tutorials: Tutorial[] = [
    {
      id: "quick-start",
      title: "Quick Start Tutorial",
      description: "Learn the basics of Storyling AI in 5 minutes",
      icon: Sparkles,
      category: "getting-started",
      action: () => {
        localStorage.removeItem("hasSeenQuickStartTutorial");
        window.location.href = "/dashboard";
      },
    },
    {
      id: "dashboard-tour",
      title: "Dashboard Tour",
      description: "Explore your dashboard and key features",
      icon: TrendingUp,
      category: "getting-started",
      action: () => {
        localStorage.removeItem("dashboardTutorialSeen");
        window.location.href = "/dashboard";
      },
    },
    {
      id: "library-tour",
      title: "Library Tour",
      description: "Learn how to manage and organize your stories",
      icon: Library,
      category: "getting-started",
      action: () => {
        localStorage.removeItem("libraryTutorialSeen");
        window.location.href = "/library";
      },
    },
    {
      id: "collections-tour",
      title: "Collections Tour",
      description: "Discover how to create and share collections",
      icon: BookOpen,
      category: "getting-started",
      action: () => {
        localStorage.removeItem("collectionsTutorialSeen");
        window.location.href = "/collections";
      },
    },
    {
      id: "create-podcast",
      title: "Create Your First Podcast",
      description: "Step-by-step guide to creating audio stories",
      icon: Mic,
      category: "features",
      action: () => {
        window.location.href = "/create?format=podcast";
      },
    },
    {
      id: "create-film",
      title: "Create Your First Film",
      description: "Learn how to generate video content",
      icon: Film,
      category: "features",
      action: () => {
        window.location.href = "/create?format=film";
      },
    },
    {
      id: "wordbank-guide",
      title: "Using the Wordbank",
      description: "Master vocabulary learning with spaced repetition",
      icon: BookMarked,
      category: "features",
      action: () => {
        window.location.href = "/wordbank";
      },
    },
    {
      id: "referral-program",
      title: "Referral Program Guide",
      description: "Learn how to earn rewards by referring friends",
      icon: Gift,
      category: "advanced",
      action: () => {
        window.location.href = "/referrals";
      },
    },
  ];

  const helpArticles: HelpArticle[] = [
    {
      id: "getting-started",
      title: "Getting Started with Storyling AI",
      description: "Everything you need to know to begin your learning journey",
      category: "learning",
      content: `
        <h3>Welcome to Storyling AI!</h3>
        <p>Storyling AI helps you learn languages through immersive storytelling. Here's how to get started:</p>
        <ol>
          <li><strong>Create Your First Story:</strong> Click the "Create New Story" button and choose between Podcast (audio) or Film (video) format.</li>
          <li><strong>Choose Your Topic:</strong> Select a theme, difficulty level, and language that matches your learning goals.</li>
          <li><strong>Learn and Practice:</strong> Listen to or watch your story, save new vocabulary to your wordbank, and practice with quizzes.</li>
          <li><strong>Track Progress:</strong> Monitor your learning streak, weekly goals, and vocabulary mastery in the Progress section.</li>
        </ol>
      `,
    },
    {
      id: "story-formats",
      title: "Understanding Story Formats",
      description: "Learn about Podcast and Film formats",
      category: "learning",
      content: `
        <h3>Story Formats</h3>
        <p>Storyling AI offers two main content formats:</p>
        <h4>Podcast (Audio)</h4>
        <ul>
          <li>Perfect for listening practice and pronunciation</li>
          <li>Available for all users (Free and Premium)</li>
          <li>Includes transcript and vocabulary highlights</li>
          <li>Great for learning on the go</li>
        </ul>
        <h4>Film (Video)</h4>
        <ul>
          <li>Visual storytelling with subtitles</li>
          <li>Premium feature only</li>
          <li>Enhanced engagement with visual context</li>
          <li>Better for visual learners</li>
        </ul>
      `,
    },
    {
      id: "wordbank-srs",
      title: "How Spaced Repetition Works",
      description: "Understanding the science behind vocabulary retention",
      category: "learning",
      content: `
        <h3>Spaced Repetition System (SRS)</h3>
        <p>Our wordbank uses scientifically-proven spaced repetition to help you remember vocabulary long-term.</p>
        <h4>How It Works:</h4>
        <ol>
          <li><strong>Save Words:</strong> Add new vocabulary while learning stories</li>
          <li><strong>Initial Review:</strong> Review words shortly after adding them</li>
          <li><strong>Increasing Intervals:</strong> Successfully recalled words appear less frequently</li>
          <li><strong>Reinforcement:</strong> Difficult words appear more often until mastered</li>
        </ol>
        <p>Check the badge on the Wordbank icon to see how many words are due for review today!</p>
      `,
    },
    {
      id: "subscription-tiers",
      title: "Free vs Premium Features",
      description: "Compare subscription tiers and features",
      category: "billing",
      content: `
        <h3>Subscription Tiers</h3>
        <h4>Free Tier</h4>
        <ul>
          <li>5 stories per month</li>
          <li>Podcast format only</li>
          <li>Basic vocabulary tools</li>
          <li>Progress tracking</li>
        </ul>
        <h4>Premium Tier</h4>
        <ul>
          <li>Unlimited stories</li>
          <li>Both Podcast and Film formats</li>
          <li>Advanced analytics</li>
          <li>Priority support</li>
          <li>Early access to new features</li>
        </ul>
        <p>Upgrade anytime from Settings → Subscription</p>
      `,
    },
    {
      id: "collections",
      title: "Creating and Sharing Collections",
      description: "Organize your stories and share with others",
      category: "learning",
      content: `
        <h3>Collections</h3>
        <p>Collections help you organize related stories and share them with the community.</p>
        <h4>Creating a Collection:</h4>
        <ol>
          <li>Go to the Collections page</li>
          <li>Click "Create Collection"</li>
          <li>Add a name, description, and cover image</li>
          <li>Add stories from your library</li>
        </ol>
        <h4>Sharing Collections:</h4>
        <ul>
          <li>Make collections public to share with the community</li>
          <li>Get a shareable link to send to friends</li>
          <li>Track views and clones of your collections</li>
          <li>Earn milestone badges for popular collections</li>
        </ul>
      `,
    },
    {
      id: "progress-tracking",
      title: "Understanding Your Progress",
      description: "Learn how to track and improve your learning",
      category: "learning",
      content: `
        <h3>Progress Tracking</h3>
        <p>Storyling AI provides comprehensive progress tracking to keep you motivated.</p>
        <h4>Key Metrics:</h4>
        <ul>
          <li><strong>Learning Streak:</strong> Consecutive days of activity</li>
          <li><strong>Weekly Goals:</strong> Target number of stories per week</li>
          <li><strong>Vocabulary Mastery:</strong> Words learned and retention rate</li>
          <li><strong>Story Completion:</strong> Percentage of stories completed</li>
        </ul>
        <p>View detailed analytics in the Progress section of your dashboard.</p>
      `,
    },
    {
      id: "account-settings",
      title: "Managing Your Account",
      description: "Update profile, preferences, and settings",
      category: "account",
      content: `
        <h3>Account Settings</h3>
        <p>Customize your Storyling AI experience in the Settings page.</p>
        <h4>Available Options:</h4>
        <ul>
          <li><strong>Profile:</strong> Update name, email, and profile picture</li>
          <li><strong>Learning Preferences:</strong> Set default language and difficulty</li>
          <li><strong>Notifications:</strong> Control email and in-app notifications</li>
          <li><strong>Subscription:</strong> Manage billing and plan details</li>
          <li><strong>Privacy:</strong> Data and privacy settings</li>
        </ul>
      `,
    },
    {
      id: "troubleshooting",
      title: "Common Issues and Solutions",
      description: "Fix common problems quickly",
      category: "technical",
      content: `
        <h3>Troubleshooting</h3>
        <h4>Story Generation Failed</h4>
        <p>If story generation fails, try these steps:</p>
        <ol>
          <li>Check your internet connection</li>
          <li>Refresh the page and try again</li>
          <li>Use the "Retry" button in your Library</li>
          <li>Contact support if the issue persists</li>
        </ol>
        <h4>Audio/Video Not Playing</h4>
        <ul>
          <li>Ensure your browser allows media playback</li>
          <li>Check your device volume settings</li>
          <li>Try a different browser</li>
          <li>Clear browser cache and cookies</li>
        </ul>
        <h4>Wordbank Not Syncing</h4>
        <ul>
          <li>Ensure you're logged in</li>
          <li>Check internet connection</li>
          <li>Refresh the page</li>
          <li>Log out and log back in</li>
        </ul>
      `,
    },
  ];

  const demoVideos: DemoVideo[] = [
    {
      id: "platform-overview",
      title: "Platform Overview",
      description: "A complete tour of Storyling AI features",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
      duration: "5:30",
      videoUrl: "#",
    },
    {
      id: "create-first-story",
      title: "Creating Your First Story",
      description: "Step-by-step guide to generating content",
      thumbnail: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&h=225&fit=crop",
      duration: "3:45",
      videoUrl: "#",
    },
    {
      id: "wordbank-tutorial",
      title: "Mastering the Wordbank",
      description: "Learn how to build and review vocabulary",
      thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=225&fit=crop",
      duration: "4:20",
      videoUrl: "#",
    },
    {
      id: "collections-guide",
      title: "Collections Deep Dive",
      description: "Create, organize, and share story collections",
      thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=225&fit=crop",
      duration: "6:15",
      videoUrl: "#",
    },
  ];

  const filteredTutorials = tutorials.filter(
    (tutorial) =>
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = helpArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = demoVideos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "getting-started":
        return "bg-green-100 text-green-800";
      case "features":
        return "bg-blue-100 text-blue-800";
      case "advanced":
        return "bg-purple-100 text-purple-800";
      case "account":
        return "bg-orange-100 text-orange-800";
      case "learning":
        return "bg-teal-100 text-teal-800";
      case "technical":
        return "bg-red-100 text-red-800";
      case "billing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text-primary">Help & Tutorials</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to master Storyling AI
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search tutorials, articles, or videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tutorials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Interactive Tutorials
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Help Articles
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Demo Videos
            </TabsTrigger>
          </TabsList>

          {/* Interactive Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map((tutorial) => {
                const Icon = tutorial.icon;
                return (
                  <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge className={getCategoryBadgeColor(tutorial.category)}>
                          {tutorial.category.replace("-", " ")}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{tutorial.title}</CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={tutorial.action}
                        className="w-full rounded-button gradient-primary text-white hover-lift border-0"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Tutorial
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTutorials.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No tutorials found matching your search</p>
              </div>
            )}
          </TabsContent>

          {/* Help Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            {selectedArticle ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryBadgeColor(selectedArticle.category)}>
                      {selectedArticle.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedArticle(null)}
                      className="rounded-button"
                    >
                      Back to Articles
                    </Button>
                  </div>
                  <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                  <CardDescription>{selectedArticle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content) }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <Badge className={getCategoryBadgeColor(article.category)}>
                          {article.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{article.title}</CardTitle>
                      <CardDescription>{article.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full rounded-button">
                        Read Article
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredArticles.length === 0 && !selectedArticle && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No articles found matching your search</p>
              </div>
            )}
          </TabsContent>

          {/* Demo Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 gradient-primary text-white border-0"
                        onClick={() => window.open(video.videoUrl, "_blank")}
                      >
                        <Play className="h-8 w-8" />
                      </Button>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                      {video.duration}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <CardDescription>{video.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No videos found matching your search</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Contact Support Section */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Still Need Help?</h3>
                  <p className="text-muted-foreground">
                    Our support team is here to assist you
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => (window.location.href = "/contact")}
                className="rounded-button gradient-primary text-white hover-lift border-0"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
