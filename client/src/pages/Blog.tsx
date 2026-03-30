import { Link } from "wouter";
import { ArrowLeft, Calendar, Clock, User, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useState } from "react";
import { toast } from "sonner";

const blogPosts = [
  {
    id: 1,
    slug: "science-behind-story-based-learning",
    title: "The Science Behind Story-Based Language Learning",
    excerpt: "Discover why our brains are wired to learn through narratives and how Storyling AI leverages this natural ability to accelerate language acquisition.",
    author: "Dr. Sarah Chen",
    date: "January 5, 2026",
    readTime: "8 min read",
    category: "Research",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop",
  },
  {
    id: 2,
    slug: "5-tips-maximizing-learning",
    title: "5 Tips for Maximizing Your Learning with AI-Generated Stories",
    excerpt: "Learn how to get the most out of your personalized stories with these expert strategies for active listening and vocabulary retention.",
    author: "Michael Rodriguez",
    date: "January 3, 2026",
    readTime: "6 min read",
    category: "Tips & Tricks",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
  },
  {
    id: 3,
    slug: "zero-to-conversational-90-days",
    title: "From Zero to Conversational: A 90-Day Spanish Journey",
    excerpt: "Follow Maria's inspiring story of how she went from complete beginner to having her first Spanish conversation in just three months using Storyling AI.",
    author: "Maria Gonzalez",
    date: "December 28, 2025",
    readTime: "10 min read",
    category: "Success Stories",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop",
  },
  {
    id: 4,
    slug: "ai-revolutionizing-language-education",
    title: "How AI is Revolutionizing Language Education",
    excerpt: "Explore the cutting-edge technologies powering modern language learning platforms and what the future holds for personalized education.",
    author: "Dr. James Park",
    date: "December 20, 2025",
    readTime: "12 min read",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  },
  {
    id: 5,
    slug: "building-daily-language-routine",
    title: "Building Your Daily Language Learning Routine",
    excerpt: "Consistency is key to language mastery. Here's how to create a sustainable daily practice that fits your busy schedule.",
    author: "Emma Thompson",
    date: "December 15, 2025",
    readTime: "7 min read",
    category: "Productivity",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
  },
  {
    id: 6,
    slug: "cultural-immersion-through-stories",
    title: "Cultural Immersion Through AI-Generated Stories",
    excerpt: "Language learning isn't just about words—it's about understanding culture. Discover how Storyling AI incorporates cultural context into every narrative.",
    author: "Carlos Mendez",
    date: "December 10, 2025",
    readTime: "9 min read",
    category: "Culture",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop",
  },
];

const categories = ["All", "Research", "Tips & Tricks", "Success Stories", "Technology", "Productivity"];

export default function Blog() {
  useScrollToTop();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - in production, this would call a newsletter API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Thanks for subscribing! Check your inbox for a confirmation email.");
      setEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Storyling AI Blog
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Insights, tips, and stories from the world of AI-powered language learning
        </p>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 pb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "default" : "outline"}
              size="sm"
              className={category === "All" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Featured Post */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="overflow-hidden shadow-xl border-purple-100">
          <div className="grid md:grid-cols-2 gap-0">
            <div
              className="h-64 md:h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${blogPosts[0].image})` }}
            />
            <CardContent className="p-8 flex flex-col justify-center">
              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full mb-4 w-fit">
                {blogPosts[0].category}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {blogPosts[0].title}
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {blogPosts[0].excerpt}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {blogPosts[0].author}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {blogPosts[0].date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {blogPosts[0].readTime}
                </div>
              </div>
              <Link href={`/blog/${blogPosts[0].slug}`}>
                <Button className="bg-purple-600 hover:bg-purple-700 w-fit">
                  Read More
                </Button>
              </Link>
            </CardContent>
          </div>
        </Card>
      </section>

      {/* Blog Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <Card key={post.id} className="overflow-hidden shadow-lg border-purple-100 hover:shadow-xl transition-shadow">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.image})` }}
              />
              <CardContent className="p-6">
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-3">
                  {post.category}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Read Article
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg mb-8 opacity-90">
            Get the latest language learning tips, research insights, and success stories delivered to your inbox.
          </p>
          <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            />
            <Button 
              type="submit" 
              size="lg" 
              variant="secondary" 
              disabled={isSubmitting}
              className="bg-white text-purple-600 hover:bg-gray-100 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
          <p className="text-sm mt-4 opacity-75">
            Join 35,000+ language learners • Unsubscribe anytime
          </p>
        </div>
      </section>
      
    </div>
  );
}
