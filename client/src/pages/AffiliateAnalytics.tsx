// Original implementation preserved in git history (Stripe Connect not yet implemented)
// To restore: git show HEAD:client/src/pages/AffiliateAnalytics.tsx

export function AffiliateAnalytics() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>
          Coming Soon
        </h2>
        <p className="text-gray-500 max-w-md mb-6">
          The affiliate analytics are being finalized. You'll be able to track your referrals, earnings, and performance metrics here very soon.
        </p>
        <a href="/app" className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold hover:opacity-90 transition-all">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
