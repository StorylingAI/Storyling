import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, DollarSign, Users, TrendingUp, Gift, Zap, BarChart3, Rocket, Target, Award, ArrowRight, Download, Share2 } from "lucide-react";

export default function AffiliateOnboarding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              storyling.ai
            </a>
          </Link>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setLocation("/referrals")}>
              Dashboard
            </Button>
            <Button onClick={() => setLocation("/affiliate-application")}>
              Apply Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-bold">
            🚀 Welcome to the Affiliate Program
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Start Earning Today
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Join our affiliate program and turn your passion for language learning into a sustainable income stream. 
            Here's everything you need to know to get started and succeed.
          </p>
        </div>
      </section>

      {/* Quick Start Steps */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Get Started in 3 Simple Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Sign Up</h3>
                <p className="text-gray-600 mb-4">
                  Complete our simple application form. We'll review it and approve you within 24 hours.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/affiliate-application")}
                >
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Get Your Link</h3>
                <p className="text-gray-600 mb-4">
                  Receive your unique referral link and access to marketing materials instantly.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/affiliate-resources")}
                >
                  View Resources <Download className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-14 w-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Start Sharing</h3>
                <p className="text-gray-600 mb-4">
                  Share your link on social media, blogs, or with your audience and start earning!
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/referrals")}
                >
                  Track Earnings <BarChart3 className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Program Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Join Our Program?</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            We've designed our affiliate program to help you succeed with industry-leading benefits
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-purple-300 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>30% Recurring Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Earn 30% on every Premium subscription—monthly or annual. That's $36-60 per referral per year!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Passive Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Earn recurring commissions as long as your referrals stay subscribed. Build predictable monthly income.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-teal-300 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>90-Day Cookie Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Industry-leading tracking window. Get credit for referrals up to 90 days after their first click.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-300 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track clicks, conversions, and earnings in real-time with our comprehensive affiliate dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-pink-300 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center mb-2">
                  <Gift className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle>Marketing Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access pre-made banners, social posts, email templates, and more to make promotion effortless.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Performance Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Top-performing affiliates receive monthly bonuses, exclusive perks, and recognition.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Earning Potential */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12">Your Earning Potential</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-purple-600">$360/year</CardTitle>
                <CardDescription className="text-lg">With 10 Referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Perfect for beginners
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    $30/month passive income
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Achievable in first month
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-blue-400 shadow-lg scale-105">
              <CardHeader className="text-center">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-2">
                  MOST POPULAR
                </div>
                <CardTitle className="text-3xl font-bold text-blue-600">$1,800/year</CardTitle>
                <CardDescription className="text-lg">With 50 Referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Solid side income
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    $150/month passive income
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Achievable in 3-6 months
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-teal-600">$3,600/year</CardTitle>
                <CardDescription className="text-lg">With 100 Referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Full-time income potential
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    $300/month passive income
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Top affiliate tier
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-xl p-8 border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <Rocket className="h-10 w-10 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold mb-3">Success Story</h3>
                <p className="text-gray-700 mb-4">
                  "I started with just 5 referrals in my first month. After sharing my link with my language learning community, 
                  I now have 80+ active referrals earning me over $2,400/year in passive income. The best part? It keeps growing!"
                </p>
                <p className="text-sm text-gray-600 font-semibold">— Sarah K., Top Affiliate Partner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Join */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start p-6 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Language Teachers & Tutors</h3>
                <p className="text-gray-600">
                  Recommend Storyling AI to your students as a supplementary learning tool and earn recurring income.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-blue-50 rounded-lg">
              <Share2 className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Content Creators & Influencers</h3>
                <p className="text-gray-600">
                  Share with your audience on YouTube, Instagram, TikTok, or your blog and monetize your content.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-teal-50 rounded-lg">
              <Target className="h-8 w-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Education Bloggers</h3>
                <p className="text-gray-600">
                  Write reviews, tutorials, or guides featuring Storyling AI and earn commissions from your readers.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Language Learning Communities</h3>
                <p className="text-gray-600">
                  Run a forum, Discord, or Facebook group? Share with your members and build passive income.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I get paid?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We process payouts monthly via PayPal or bank transfer. Minimum payout threshold is $50. 
                  You'll receive payment within 7 business days after the end of each month.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does approval take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Most applications are reviewed and approved within 24 hours. You'll receive an email with your 
                  unique referral link and access to the affiliate dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I promote on social media?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Absolutely! We encourage sharing on all social platforms. We provide ready-made content for 
                  Instagram, Twitter, Facebook, TikTok, and YouTube to make it easy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What if my referral cancels?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  You earn commissions only for active subscriptions. If a referral cancels, commissions stop. 
                  However, if they resubscribe within 90 days, you'll continue earning from them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a limit to how much I can earn?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No limits! The more referrals you generate, the more you earn. Our top affiliates earn $5,000+ 
                  per year in recurring commissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of affiliates already earning passive income by sharing Storyling AI. 
            Apply now and get your referral link within 24 hours.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
              onClick={() => setLocation("/affiliate-application")}
            >
              <Zap className="mr-2 h-5 w-5" />
              Apply Now - It's Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => setLocation("/affiliates")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
