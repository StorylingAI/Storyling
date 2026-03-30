import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, DollarSign, Share2, Repeat, Globe, Zap } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

export default function Affiliates() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      <MobileNav title="Affiliates" backPath="/app" />

      {/* ─── Hero Section ─── */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-block mb-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
            💰 Affiliate Program
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent leading-tight">
            Earn Passive Income Sharing Storyling
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Earn 30% recurring commission every time someone subscribes through your link.
          </p>
          <Link href="/affiliate-application">
            <a>
              <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-200">
                <Zap className="mr-2 h-5 w-5" />
                Become a Storyling Affiliate
              </Button>
            </a>
          </Link>
        </div>
      </section>

      {/* ─── Earnings Example Table ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Your Earning Potential</h2>
          <p className="text-center text-gray-500 mb-10 text-lg">
            See how your commissions grow as you refer more users.
          </p>
          <div className="rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="px-6 py-4 text-base font-semibold">Referrals</th>
                  <th className="px-6 py-4 text-base font-semibold">Monthly Earnings</th>
                  <th className="px-6 py-4 text-base font-semibold">Yearly Earnings</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                <tr className="border-b border-gray-100 bg-white">
                  <td className="px-6 py-5 font-medium">5 users</td>
                  <td className="px-6 py-5 font-semibold text-purple-600">$15/month</td>
                  <td className="px-6 py-5 font-semibold text-blue-600">$180/year</td>
                </tr>
                <tr className="border-b border-gray-100 bg-purple-50/40">
                  <td className="px-6 py-5 font-medium">25 users</td>
                  <td className="px-6 py-5 font-semibold text-purple-600">$75/month</td>
                  <td className="px-6 py-5 font-semibold text-blue-600">$900/year</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-5 font-medium">50 users</td>
                  <td className="px-6 py-5 font-semibold text-purple-600">$150/month</td>
                  <td className="px-6 py-5 font-semibold text-blue-600">$1,800/year</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">
            Based on 30% commission on $9.99/month Premium subscriptions.
          </p>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-10">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-14 w-14 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-200">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sign up for free</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create your affiliate account in seconds — no fees, no commitment. You'll get a personal dashboard and unique referral link right away.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-14 w-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-200">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Share your affiliate link</h3>
                <p className="text-gray-600 leading-relaxed">
                  Post it on social media, your blog, email newsletter, YouTube description — anywhere your audience hangs out.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-14 w-14 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-200">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Earn recurring commissions</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every time someone subscribes through your link, you earn 30% — and you keep earning every month they stay subscribed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Creators Love Storyling ─── */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Creators Love Storyling</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">30% recurring commission</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  One of the highest rates in the edtech space — and it's recurring, not one-time.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Repeat className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Earn every month users stay subscribed</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Your income grows over time as referrals keep their subscriptions active.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Share2 className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Easy link sharing</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  One link, one click. Share on any platform — no complicated setup required.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Global audience learning languages</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Millions of people worldwide want to learn languages — your audience is already out there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl mb-10 text-purple-100">
            Join our affiliate program today and start building passive income by sharing something you believe in.
          </p>
          <Link href="/affiliate-application">
            <a>
              <Button size="lg" className="text-lg px-10 py-6 bg-white text-purple-600 hover:bg-gray-100 shadow-lg">
                <Zap className="mr-2 h-5 w-5" />
                Become a Storyling Affiliate
              </Button>
            </a>
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
