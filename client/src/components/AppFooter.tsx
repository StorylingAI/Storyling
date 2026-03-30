import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { Home, Library, FolderOpen, BookOpen, Settings, TrendingUp, Gift, Award } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="hidden sm:block border-t border-blue-100/30 bg-gradient-to-b from-white to-blue-50/30 mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg gradient-text-primary">{APP_TITLE}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Master languages through immersive AI-powered stories tailored to your level
            </p>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">Quick Access</h4>
            <nav className="flex flex-col space-y-2.5 text-sm">
              <Link href="/app" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/library" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Library className="h-4 w-4" />
                Library
              </Link>
              <Link href="/collections" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <FolderOpen className="h-4 w-4" />
                Collections
              </Link>
              <Link href="/wordbank" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <BookOpen className="h-4 w-4" />
                Wordbank
              </Link>
            </nav>
          </div>

          {/* Learning & Progress */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">Learning & Progress</h4>
            <nav className="flex flex-col space-y-2.5 text-sm">
              <Link href="/progress" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <TrendingUp className="h-4 w-4" />
                Progress
              </Link>
              <Link href="/leaderboard" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Award className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link href="/referrals" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Gift className="h-4 w-4" />
                Referrals
              </Link>
            </nav>
          </div>

          {/* Account & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">Account & Support</h4>
            <nav className="flex flex-col space-y-2.5 text-sm">
              <Link href="/settings/profile" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link href="/settings/subscription" className="text-gray-500 hover:text-blue-600 transition-colors">
                Subscription
              </Link>
              <Link href="/help" className="text-gray-500 hover:text-blue-600 transition-colors">
                Help Center
              </Link>
              <Link href="/contact" className="text-gray-500 hover:text-blue-600 transition-colors">
                Contact Support
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-blue-100/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2026 {APP_TITLE}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-blue-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-blue-500 transition-colors">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-blue-500 transition-colors">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
