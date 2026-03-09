import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Users, Sparkles, Target } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function About() {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold gradient-text">About Storyling AI</h1>
            <p className="text-muted-foreground mt-2">Learn languages like you live them</p>
          </div>
        </div>

        {/* Mission */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-teal-500 p-3 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At Storyling AI, we believe language learning should be as natural and engaging as listening to your favorite podcast or watching a captivating film. Our AI-powered platform transforms vocabulary into immersive stories, making language acquisition effortless and enjoyable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Leveraging cutting-edge AI to create personalized learning experiences
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="bg-gradient-to-br from-teal-500 to-blue-500 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Community</h3>
              <p className="text-sm text-muted-foreground">
                Building a global community of passionate language learners
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="bg-gradient-to-br from-pink-500 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Passion</h3>
              <p className="text-sm text-muted-foreground">
                Driven by a love for languages and cultural exchange
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Storyling AI was born from a simple observation: traditional language learning methods often feel disconnected from real-world usage. We wanted to create a platform that bridges this gap by turning vocabulary lists into engaging narratives that stick in your memory.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, we're proud to serve thousands of language learners worldwide, helping them achieve their goals through personalized, AI-generated content that adapts to their unique learning style and pace.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="rounded-card shadow-playful border-2 bg-gradient-to-br from-purple-100 to-teal-100">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-2xl font-bold">Join Our Community</h3>
            <p className="text-muted-foreground">Start your language learning journey today</p>
            <Link href="/app">
              <Button className="gradient-primary text-white">Get Started Free</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
