import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function Privacy() {
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
            <h1 className="text-4xl font-bold gradient-text">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">Last updated: January 6, 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-teal-500 p-3 rounded-lg flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Privacy Matters</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At Storyling AI, we are committed to protecting your privacy and ensuring the
                  security of your personal information. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when you use our platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                <p className="text-muted-foreground">
                  When you create an account, we collect your name, email address, and
                  authentication credentials provided through our OAuth provider.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Learning Data</h3>
                <p className="text-muted-foreground">
                  We collect information about your language learning activities, including:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                  <li>Vocabulary lists and words you're learning</li>
                  <li>Stories you generate and interact with</li>
                  <li>Quiz results and progress metrics</li>
                  <li>Learning preferences and settings</li>
                  <li>Content you create, share, or save</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Usage Information</h3>
                <p className="text-muted-foreground">
                  We automatically collect information about how you use our platform, including:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground space-y-1">
                  <li>Pages visited and features used</li>
                  <li>Time spent on different activities</li>
                  <li>Device information and browser type</li>
                  <li>IP address and general location data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
                <p className="text-muted-foreground">
                  If you subscribe to our Premium plan, payment processing is handled securely by
                  Stripe. We do not store your full credit card information on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">How We Use Your Information</h2>

            <p className="text-muted-foreground">We use the information we collect to:</p>

            <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve our language learning services</li>
              <li>Generate personalized content based on your vocabulary and preferences</li>
              <li>Track your learning progress and provide analytics</li>
              <li>Send you notifications about your learning activities and achievements</li>
              <li>Process payments and manage subscriptions</li>
              <li>Respond to your questions and provide customer support</li>
              <li>Detect and prevent fraud, abuse, and security issues</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
              <li>Improve our AI models and content generation algorithms</li>
            </ul>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Information Sharing and Disclosure</h2>

            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information in the
              following circumstances:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Service Providers</h3>
                <p className="text-muted-foreground">
                  We work with third-party service providers who help us operate our platform,
                  including cloud hosting, payment processing, email delivery, and analytics
                  services. These providers have access to your information only to perform
                  specific tasks on our behalf.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Public Content</h3>
                <p className="text-muted-foreground">
                  When you share collections or stories publicly, that content becomes visible to
                  other users. Your username and basic profile information may be displayed
                  alongside your public content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Legal Requirements</h3>
                <p className="text-muted-foreground">
                  We may disclose your information if required by law, court order, or government
                  request, or if we believe disclosure is necessary to protect our rights, your
                  safety, or the safety of others.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Business Transfers</h3>
                <p className="text-muted-foreground">
                  If Storyling AI is involved in a merger, acquisition, or sale of assets, your
                  information may be transferred as part of that transaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Data Security</h2>

            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your information,
              including:
            </p>

            <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
              <li>Encrypted data transmission using SSL/TLS protocols</li>
              <li>Secure authentication and session management</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication for our systems</li>
              <li>Secure cloud infrastructure with reputable providers</li>
            </ul>

            <p className="text-muted-foreground">
              However, no method of transmission over the internet or electronic storage is 100%
              secure. While we strive to protect your information, we cannot guarantee absolute
              security.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Your Rights and Choices</h2>

            <p className="text-muted-foreground">You have the following rights regarding your information:</p>

            <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
              <li>
                <strong>Access:</strong> Request a copy of the personal information we hold about
                you
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information in your
                account settings
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data
              </li>
              <li>
                <strong>Export:</strong> Download your learning data in a portable format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing emails or disable certain
                notifications
              </li>
              <li>
                <strong>Object:</strong> Object to certain processing activities
              </li>
            </ul>

            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us through your account settings or by
              emailing support@storylingai.com.
            </p>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Data Retention</h2>

            <p className="text-muted-foreground">
              We retain your information for as long as your account is active or as needed to
              provide our services. If you delete your account, we will delete or anonymize your
              personal information within 90 days, except where we are required to retain it for
              legal, regulatory, or security purposes.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Children's Privacy</h2>

            <p className="text-muted-foreground">
              Storyling AI is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13. If you believe we have
              collected information from a child under 13, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* International Users */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">International Data Transfers</h2>

            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your
              country of residence. These countries may have data protection laws that differ from
              those in your country. By using Storyling AI, you consent to the transfer of your
              information to our facilities and service providers worldwide.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Changes to This Privacy Policy</h2>

            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new Privacy Policy on this page and updating the
              "Last updated" date. We encourage you to review this Privacy Policy periodically for
              any changes.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="rounded-card shadow-playful-lg border-2 bg-gradient-to-br from-purple-100 to-teal-100">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Contact Us</h2>

            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our privacy practices, please
              contact us at:
            </p>

            <div className="text-muted-foreground">
              <p>Email: support@storylingai.com</p>
              <p className="mt-2">
                For data protection inquiries, you can also contact our Data Protection Officer at
                privacy@storylingai.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
