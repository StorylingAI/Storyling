import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function Terms() {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <div className="container max-w-4xl py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Last updated: January 6, 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-teal-500 p-3 rounded-lg flex-shrink-0">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using Storyling AI, you agree to be bound by these Terms of
                  Service and all applicable laws and regulations. If you do not agree with any of
                  these terms, you are prohibited from using or accessing this platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Terms */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Account Terms</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Creation</h3>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                  <li>You must be at least 13 years old to use Storyling AI</li>
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Account Restrictions</h3>
                <p className="text-muted-foreground">You may not:</p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                  <li>Create multiple accounts to circumvent usage limits</li>
                  <li>Share your account credentials with others</li>
                  <li>Use another user's account without permission</li>
                  <li>Transfer or sell your account to another person</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Usage */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Acceptable Use</h2>

            <p className="text-muted-foreground">When using Storyling AI, you agree to:</p>

            <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
              <li>Use the platform only for lawful purposes</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
              <li>Not interfere with or disrupt the platform's operation</li>
              <li>Not use automated tools to access or scrape content without permission</li>
              <li>Not upload malicious code, viruses, or harmful content</li>
              <li>Not impersonate others or misrepresent your affiliation</li>
              <li>Comply with all applicable local, state, national, and international laws</li>
            </ul>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Prohibited Content</h3>
              <p className="text-muted-foreground">You may not create, share, or publish content that:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>Is illegal, harmful, threatening, abusive, or harassing</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains hate speech, discrimination, or promotes violence</li>
                <li>Is sexually explicit or inappropriate for a general audience</li>
                <li>Contains spam, advertising, or promotional material</li>
                <li>Violates the privacy of others</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Terms */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Subscription and Payment Terms</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Free and Premium Plans</h3>
                <p className="text-muted-foreground">
                  Storyling AI offers both free and premium subscription plans. Premium features and
                  pricing are subject to change with notice.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Billing</h3>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                  <li>Premium subscriptions are billed monthly or annually in advance</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>You authorize us to charge your payment method for recurring subscription fees</li>
                  <li>Subscription automatically renews unless canceled before the renewal date</li>
                  <li>Price changes will be communicated at least 30 days in advance</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Cancellation</h3>
                <p className="text-muted-foreground">
                  You may cancel your premium subscription at any time through your account
                  settings. Cancellation takes effect at the end of the current billing period. You
                  will retain access to premium features until the end of your paid period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Usage Limits</h3>
                <p className="text-muted-foreground">
                  Free accounts are subject to usage limits (e.g., 5 stories per month). Premium
                  accounts have higher or unlimited usage limits. We reserve the right to modify
                  usage limits with reasonable notice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Intellectual Property Rights</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Our Content</h3>
                <p className="text-muted-foreground">
                  The Storyling AI platform, including its design, features, functionality, and
                  underlying technology, is owned by us and protected by copyright, trademark, and
                  other intellectual property laws. You may not copy, modify, distribute, or
                  reverse engineer any part of our platform without permission.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Your Content</h3>
                <p className="text-muted-foreground">
                  You retain ownership of content you create using Storyling AI (vocabulary lists,
                  custom stories, collections). By using our platform, you grant us a worldwide,
                  non-exclusive, royalty-free license to use, store, and display your content to
                  provide and improve our services.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">AI-Generated Content</h3>
                <p className="text-muted-foreground">
                  Stories, audio, and video generated by our AI based on your input are considered
                  your content. However, AI-generated content may not be eligible for copyright
                  protection under current laws. You are responsible for ensuring your use of
                  AI-generated content complies with applicable laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Public Collections</h3>
                <p className="text-muted-foreground">
                  When you share collections publicly, you grant other users a license to view,
                  clone, and use that content for their personal language learning. You represent
                  that you have the right to share such content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Service Availability and Modifications</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Service Changes</h3>
                <p className="text-muted-foreground">
                  We reserve the right to modify, suspend, or discontinue any part of Storyling AI
                  at any time, with or without notice. We may also impose limits on certain
                  features or restrict access to parts of the platform.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Maintenance and Downtime</h3>
                <p className="text-muted-foreground">
                  We strive to provide reliable service but cannot guarantee uninterrupted access.
                  The platform may be unavailable due to maintenance, updates, or technical issues.
                  We are not liable for any losses resulting from service interruptions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Disclaimers and Limitations of Liability</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">No Warranty</h3>
                <p className="text-muted-foreground">
                  Storyling AI is provided "as is" and "as available" without warranties of any
                  kind, either express or implied. We do not warrant that the platform will be
                  error-free, secure, or uninterrupted, or that defects will be corrected.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Educational Tool</h3>
                <p className="text-muted-foreground">
                  Storyling AI is a language learning tool and should not be relied upon as the sole
                  method of language instruction. We make no guarantees about learning outcomes or
                  proficiency levels.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">AI-Generated Content Accuracy</h3>
                <p className="text-muted-foreground">
                  While we strive for accuracy, AI-generated content may contain errors,
                  inaccuracies, or inappropriate material. You should verify important information
                  and use your judgment when relying on AI-generated content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, Storyling AI and its affiliates shall not
                  be liable for any indirect, incidental, special, consequential, or punitive
                  damages, or any loss of profits or revenues, whether incurred directly or
                  indirectly, or any loss of data, use, goodwill, or other intangible losses
                  resulting from your use of the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indemnification */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Indemnification</h2>

            <p className="text-muted-foreground">
              You agree to indemnify, defend, and hold harmless Storyling AI, its affiliates,
              officers, directors, employees, and agents from any claims, liabilities, damages,
              losses, and expenses (including reasonable attorney fees) arising out of or related
              to:
            </p>

            <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
              <li>Your use or misuse of the platform</li>
              <li>Your violation of these Terms of Service</li>
              <li>Your violation of any rights of another party</li>
              <li>Content you create, share, or publish on the platform</li>
            </ul>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Termination</h2>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account and access to Storyling AI
                at any time, with or without cause, and with or without notice, for any reason
                including:
              </p>

              <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>Requests by law enforcement or government agencies</li>
              </ul>

              <p className="text-muted-foreground">
                Upon termination, your right to use the platform will immediately cease. We may
                delete your account and content, though we may retain certain information as
                required by law or for legitimate business purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Governing Law and Dispute Resolution</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
                <p className="text-muted-foreground">
                  These Terms of Service shall be governed by and construed in accordance with the
                  laws of the jurisdiction in which Storyling AI operates, without regard to
                  conflict of law principles.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Dispute Resolution</h3>
                <p className="text-muted-foreground">
                  Any disputes arising from these terms or your use of Storyling AI shall be
                  resolved through binding arbitration, except that either party may seek
                  injunctive relief in court for intellectual property infringement or violation of
                  these terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Terms */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">General Terms</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Entire Agreement</h3>
                <p className="text-muted-foreground">
                  These Terms of Service, together with our Privacy Policy, constitute the entire
                  agreement between you and Storyling AI regarding your use of the platform.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Severability</h3>
                <p className="text-muted-foreground">
                  If any provision of these terms is found to be unenforceable or invalid, that
                  provision will be limited or eliminated to the minimum extent necessary, and the
                  remaining provisions will remain in full force and effect.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Waiver</h3>
                <p className="text-muted-foreground">
                  Our failure to enforce any right or provision of these terms will not be
                  considered a waiver of those rights.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Assignment</h3>
                <p className="text-muted-foreground">
                  You may not assign or transfer these terms or your account without our prior
                  written consent. We may assign these terms without restriction.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Changes to Terms</h3>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms of Service at any time. We will notify
                  you of material changes by posting the updated terms on this page and updating
                  the "Last updated" date. Your continued use of Storyling AI after changes take
                  effect constitutes acceptance of the new terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="rounded-card shadow-playful-lg border-2 bg-gradient-to-br from-purple-100 to-teal-100">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Contact Us</h2>

            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:
            </p>

            <div className="text-muted-foreground">
              <p>Email: support@storylingai.com</p>
              <p className="mt-2">Legal inquiries: legal@storylingai.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
