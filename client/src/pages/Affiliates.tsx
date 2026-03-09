import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, DollarSign, Users, TrendingUp, Gift, Zap } from "lucide-react";

export default function Affiliates() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            storyling.ai
          </Link>
          <div className="flex gap-3">
            <Link href="/login">
              <a><Button variant="ghost">Sign In</Button></a>
            </Link>
            <Link href="/signup">
              <a><Button>Get Started</Button></a>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block mb-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
            💰 Earn While You Share
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Join Our Affiliate Program
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Help language learners discover Storyling AI and earn generous commissions for every referral. 
            Share your unique link, track your earnings, and get paid monthly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/affiliate-application">
              <a>
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Zap className="mr-2 h-5 w-5" />
                  Become an Affiliate
                </Button>
              </a>
            </Link>
            <Link href="/affiliate-onboarding">
              <a>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Learn How It Works
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">30%</div>
              <div className="text-gray-600">Commission Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$50+</div>
              <div className="text-gray-600">Average Earnings per Referral</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">90 Days</div>
              <div className="text-gray-600">Cookie Duration</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Join Our Program?</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            We've built an affiliate program that rewards you generously for sharing something you believe in.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-purple-300 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Generous Commissions</h3>
                <p className="text-gray-600 leading-relaxed">
                  Earn 30% recurring commission on every Premium subscription you refer. 
                  That's up to $60 per annual subscription!
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-Time Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track clicks, conversions, and earnings in your personalized dashboard. 
                  See exactly how your referrals are performing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-teal-300 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Bonus Rewards</h3>
                <p className="text-gray-600 leading-relaxed">
                  Unlock milestone bonuses: 5 referrals = 1 extra month Premium, 
                  10 referrals = 3 months Premium, and more!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sign Up for Free</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create your account and get instant access to your unique referral link and dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Share Your Link</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share your referral link on social media, your blog, email newsletter, or anywhere your audience hangs out.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Earn Commissions</h3>
                <p className="text-gray-600 leading-relaxed">
                  When someone signs up using your link and subscribes to Premium, you earn 30% commission. 
                  Get paid monthly via PayPal or bank transfer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Earn Passive Income with Every Referral</h2>
            <p className="text-xl text-gray-600">30% recurring commission on all Premium subscriptions—earn while you sleep!</p>
          </div>
          
          {/* Earning Potential Showcase */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 mb-8 border-2 border-purple-200">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                $1,800/year
              </div>
              <div className="text-lg text-gray-700 font-semibold">Potential Annual Income with Just 50 Referrals</div>
              <div className="text-sm text-gray-600 mt-2">That's $150/month in passive recurring revenue!</div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">10 Referrals</div>
                <div className="text-gray-600">$360/year</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">25 Referrals</div>
                <div className="text-gray-600">$900/year</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-teal-600 mb-1">100 Referrals</div>
                <div className="text-gray-600">$3,600/year</div>
              </div>
            </div>
          </div>

          {/* Commission Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-3">
                    Most Popular
                  </div>
                  <div className="text-4xl font-bold text-purple-600 mb-1">$36/year</div>
                  <div className="text-gray-600 font-semibold">Per Monthly Subscriber</div>
                  <div className="text-sm text-gray-500 mt-1">$3 per month × 12 months</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">30% recurring commission</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Earn every month they stay subscribed</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Build predictable passive income</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Average subscriber lifetime: 8+ months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
                    Higher Payout
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-1">$18/year</div>
                  <div className="text-gray-600 font-semibold">Per Annual Subscriber</div>
                  <div className="text-sm text-gray-500 mt-1">30% of $60 annual plan</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">$18 paid upfront immediately</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Recurring commission on each renewal</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Higher customer retention rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Faster path to earning goals</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Benefits */}
          <div className="mt-8 bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-6 border border-teal-200">
            <div className="flex items-start gap-4">
              <Gift className="h-8 w-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bonus Incentives</h3>
                <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-teal-600" />
                    <span>90-day cookie duration (industry-leading)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-teal-600" />
                    <span>Monthly performance bonuses for top affiliates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-teal-600" />
                    <span>Exclusive promotional materials & support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-teal-600" />
                    <span>Real-time tracking & transparent reporting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Join */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
              <Users className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Language Teachers & Tutors</h3>
                <p className="text-gray-600">Recommend Storyling AI to your students and earn passive income.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Content Creators</h3>
                <p className="text-gray-600">Share with your audience on YouTube, TikTok, Instagram, or your blog.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="h-6 w-6 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Language Learning Communities</h3>
                <p className="text-gray-600">Share in forums, Facebook groups, Discord servers, or Reddit communities.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Education Bloggers</h3>
                <p className="text-gray-600">Write reviews and tutorials featuring Storyling AI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join hundreds of affiliates already earning commissions by sharing Storyling AI. 
            Sign up today and get your unique referral link instantly.
          </p>
          <Link href="/referrals">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-purple-600 hover:bg-gray-100">
              <Zap className="mr-2 h-5 w-5" />
              Join the Affiliate Program
            </Button>
          </Link>
          <p className="mt-6 text-purple-200">
            Already a member?{" "}
            <Link href="/referrals">
              <a className="underline font-semibold hover:text-white">Access your dashboard</a>
            </Link>
          </p>
        </div>
      </section>


    </div>
  );
}
