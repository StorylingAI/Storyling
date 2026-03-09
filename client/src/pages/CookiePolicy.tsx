import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function CookiePolicy() {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <div className="container py-8 space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold gradient-text flex items-center gap-2">
              <Cookie className="h-8 w-8" />
              Cookie Policy
            </h1>
            <p className="text-muted-foreground mt-2">Last updated: January 5, 2026</p>
          </div>
        </div>

        {/* Content */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-6 prose prose-sm max-w-none">
            <section>
              <h2 className="text-2xl font-bold mb-3">What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">How We Use Cookies</h2>
              
              <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies are necessary for the website to function properly. They enable core functionality such as:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Authentication and account access</li>
                <li>Security and fraud prevention</li>
                <li>Session management</li>
                <li>Load balancing</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Performance Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies help us understand how visitors interact with our website by collecting anonymous information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Pages visited and time spent</li>
                <li>Features used most frequently</li>
                <li>Error messages encountered</li>
                <li>Loading times and performance metrics</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                These cookies remember your preferences and choices:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Language preferences</li>
                <li>Learning goals and settings</li>
                <li>UI customizations</li>
                <li>Volume and playback preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use analytics services to help us improve our platform:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Google Analytics (anonymized)</li>
                <li>Usage patterns and trends</li>
                <li>Feature adoption rates</li>
                <li>User journey analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use trusted third-party services that may set their own cookies:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Stripe:</strong> For secure payment processing</li>
                <li><strong>Google Analytics:</strong> For usage analytics</li>
                <li><strong>Content Delivery Networks:</strong> For faster content delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies in several ways:
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">Browser Settings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>View and delete cookies</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Clear all cookies when closing the browser</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Important Note</h3>
              <p className="text-muted-foreground leading-relaxed">
                Blocking or deleting cookies may impact your experience on Storyling AI. Some features may not work properly without cookies enabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Cookie Duration</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use both session cookies (deleted when you close your browser) and persistent cookies (remain on your device for a set period or until you delete them).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us through our <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
