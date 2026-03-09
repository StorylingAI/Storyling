import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, ExternalLink, Check } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";

interface BannerSize {
  name: string;
  width: number;
  height: number;
  description: string;
}

const BANNER_SIZES: BannerSize[] = [
  { name: "Leaderboard", width: 728, height: 90, description: "Top of page banner" },
  { name: "Medium Rectangle", width: 300, height: 250, description: "Sidebar banner" },
  { name: "Large Rectangle", width: 336, height: 280, description: "Sidebar banner" },
  { name: "Wide Skyscraper", width: 160, height: 600, description: "Vertical sidebar" },
  { name: "Mobile Banner", width: 320, height: 100, description: "Mobile optimized" },
];

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [affiliateId, setAffiliateId] = useState(user?.id?.toString() || "");

  const generateEmbedCode = (size: BannerSize) => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/?ref=${affiliateId}`;
    
    return `<!-- ${APP_TITLE} Affiliate Banner - ${size.name} -->
<a href="${trackingUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${baseUrl}/api/banners/${size.width}x${size.height}?ref=${affiliateId}" 
       alt="${APP_TITLE} - AI-Powered Language Learning" 
       width="${size.width}" 
       height="${size.height}" 
       style="border: 0;" />
</a>`;
  };

  const generateBannerUrl = (size: BannerSize) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/banners/${size.width}x${size.height}?ref=${affiliateId}`;
  };

  const handleCopy = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = (size: BannerSize) => {
    const bannerUrl = generateBannerUrl(size);
    const link = document.createElement("a");
    link.href = bannerUrl;
    link.download = `${APP_TITLE.toLowerCase().replace(/\s+/g, "-")}-banner-${size.width}x${size.height}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text-primary">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">
          Share {APP_TITLE} with your audience and earn rewards. Use these banners to promote our platform.
        </p>
      </div>

      {/* Affiliate ID Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate ID</CardTitle>
          <CardDescription>
            This ID is used to track referrals from your banners and links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="affiliate-id">Affiliate ID</Label>
              <Input
                id="affiliate-id"
                value={affiliateId}
                onChange={(e) => setAffiliateId(e.target.value)}
                placeholder="Enter your affiliate ID"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => handleCopy(affiliateId, -1)}
                className="gap-2"
              >
                {copiedIndex === -1 ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Your Referral Link:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-background px-3 py-2 rounded border">
                {window.location.origin}/?ref={affiliateId}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(`${window.location.origin}/?ref=${affiliateId}`, -2)}
              >
                {copiedIndex === -2 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner Sizes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Available Banner Sizes</h2>
        <div className="grid gap-6">
          {BANNER_SIZES.map((size, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{size.name}</CardTitle>
                    <CardDescription>
                      {size.width} × {size.height}px - {size.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(size)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(generateBannerUrl(size), "_blank")}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Banner Preview */}
                <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center overflow-auto">
                  <img
                    src={generateBannerUrl(size)}
                    alt={`${size.name} banner preview`}
                    width={size.width}
                    height={size.height}
                    className="max-w-full h-auto"
                    style={{ maxHeight: "400px" }}
                  />
                </div>

                {/* Embed Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Embed Code</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(generateEmbedCode(size), index)}
                      className="gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{generateEmbedCode(size)}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Choose a banner size that fits your website layout</li>
            <li>Copy the embed code for your chosen banner</li>
            <li>Paste the code into your website's HTML where you want the banner to appear</li>
            <li>The banner will automatically track clicks and referrals using your affiliate ID</li>
            <li>Monitor your referral performance in the analytics section</li>
          </ol>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> You can also use the "Download" button to save banners locally and upload them to your preferred hosting service.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
