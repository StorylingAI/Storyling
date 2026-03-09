import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Check, Image, Mail, Share2, FileText } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function AffiliateResources() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const banners = [
    {
      name: "Leaderboard Banner (728x90)",
      size: "728x90",
      url: "/affiliate-banners/leaderboard-728x90.png",
      description: "Perfect for website headers and blog posts",
    },
    {
      name: "Medium Rectangle (300x250)",
      size: "300x250",
      url: "/affiliate-banners/medium-rectangle-300x250.png",
      description: "Great for sidebar placements",
    },
    {
      name: "Large Rectangle (336x280)",
      size: "336x280",
      url: "/affiliate-banners/large-rectangle-336x280.png",
      description: "High visibility sidebar banner",
    },
    {
      name: "Skyscraper (160x600)",
      size: "160x600",
      url: "/affiliate-banners/skyscraper-160x600.png",
      description: "Tall sidebar banner for maximum impact",
    },
  ];

  const socialPosts = [
    {
      platform: "Twitter/X",
      template: `🚀 Transform your language learning with AI-powered stories!

${APP_TITLE} creates personalized podcasts & films tailored to YOUR level.

✨ Learn naturally through engaging narratives
🎧 Practice listening with native speakers
📚 Build vocabulary in context

Start free: [YOUR_REFERRAL_LINK]

#LanguageLearning #AI #EdTech`,
    },
    {
      platform: "LinkedIn",
      template: `I've been using ${APP_TITLE} to accelerate my language learning journey, and the results are incredible!

What makes it special:
• AI-generated stories personalized to your level
• Podcast & film formats for immersive learning
• Vocabulary tracking and spaced repetition
• Progress analytics to stay motivated

If you're serious about mastering a new language, this is the tool you need.

Try it free: [YOUR_REFERRAL_LINK]

#LanguageLearning #ProfessionalDevelopment #AI`,
    },
    {
      platform: "Facebook",
      template: `🎉 Exciting discovery for language learners!

I've been using ${APP_TITLE} and it's completely changed how I learn languages. Instead of boring textbooks, I get personalized stories as podcasts or short films!

The AI adapts to my level, so I'm always challenged but never overwhelmed. Plus, the vocabulary tracking keeps me accountable.

If you've been wanting to learn a new language (or improve one you're studying), check this out: [YOUR_REFERRAL_LINK]

Free to start! 🚀`,
    },
    {
      platform: "Instagram Caption",
      template: `Learning languages just got a whole lot easier 🎯

${APP_TITLE} uses AI to create personalized stories just for you - as podcasts or mini films! 🎧🎬

No more boring textbooks. Just engaging content that matches YOUR level.

Link in bio to try it free! ✨

#LanguageLearning #AI #StudyGram #PolyglotLife #LearnLanguages`,
    },
  ];

  const emailTemplates = [
    {
      subject: "The Language Learning Tool That Changed Everything",
      body: `Hi [Name],

I wanted to share something that's completely transformed my language learning journey.

It's called ${APP_TITLE}, and it uses AI to create personalized stories tailored to your exact level - delivered as podcasts or short films.

Here's why I love it:

✓ No more boring textbooks - learn through engaging narratives
✓ Practice listening with native speaker audio
✓ Build vocabulary naturally in context
✓ Track your progress with detailed analytics

The best part? It's free to start, and you can try it risk-free.

Check it out here: [YOUR_REFERRAL_LINK]

I think you'll love it as much as I do!

Best,
[Your Name]

P.S. They have both podcast and film formats, so you can choose what works best for your learning style.`,
    },
    {
      subject: "Quick Question About Language Learning",
      body: `Hey [Name],

I know you mentioned wanting to [learn Spanish/improve your French/etc.]. Have you found a good method yet?

I recently discovered ${APP_TITLE} and it's been a game-changer for me. Instead of traditional lessons, it creates AI-powered stories personalized to your level.

What I love:
• Stories are actually interesting (not boring textbook stuff)
• Available as podcasts or short films
• Vocabulary tracking keeps me accountable
• I can practice anywhere - commute, gym, etc.

They have a free tier to try it out: [YOUR_REFERRAL_LINK]

Worth checking out if you're still looking for something that works!

[Your Name]`,
    },
  ];

  const videoScripts = [
    {
      title: "60-Second Product Demo",
      duration: "60 seconds",
      script: `[HOOK - 0:00-0:05]
"Struggling to learn a new language? I found something that actually works."

[PROBLEM - 0:05-0:15]
"Most language apps are boring flashcards and repetitive drills. But ${APP_TITLE} is different."

[SOLUTION - 0:15-0:40]
"It uses AI to create personalized stories - as podcasts or short films - tailored to YOUR exact level. Learn vocabulary naturally through engaging narratives. Practice listening with native speakers. Track your progress in real-time."

[PROOF - 0:40-0:50]
"I've learned 500+ new words in just 3 months, and I actually look forward to practicing every day."

[CTA - 0:50-0:60]
"Try it free - link in description. Start learning the way your brain actually works."

[YOUR_REFERRAL_LINK]`,
    },
    {
      title: "3-Minute Tutorial/Review",
      duration: "3 minutes",
      script: `[INTRO - 0:00-0:20]
"Hey everyone! Today I'm reviewing ${APP_TITLE}, an AI-powered language learning tool that's completely changed how I study. Let me show you why it's different."

[DEMO - 0:20-1:30]
"Here's how it works: You input your target language, proficiency level, and vocabulary you want to practice. The AI then generates a custom story - you can choose podcast format for audio-only, or film format with visuals and subtitles.

What I love is that every story is unique and tailored to MY level. No more content that's too easy or too hard."

[FEATURES - 1:30-2:20]
"Key features:
• Personalized AI-generated content
• Podcast AND film formats
• Vocabulary tracking and spaced repetition
• Progress analytics
• Works for 15+ languages

The vocabulary tracking is genius - it highlights words you've learned and reminds you to review them."

[RESULTS - 2:20-2:45]
"After using this for 3 months, my listening comprehension has improved dramatically. I can now understand native speakers much better, and I've built a vocabulary of over 500 words."

[CTA - 2:45-3:00]
"If you're serious about learning a language, try ${APP_TITLE}. They have a free tier to get started. Link in the description - use my code for 20% off Premium.

[YOUR_REFERRAL_LINK]

Let me know in the comments if you try it!"

[OUTRO]
"Thanks for watching! Don't forget to like and subscribe for more language learning tips."`,
    },
    {
      title: "TikTok/Shorts Hook Script",
      duration: "15-30 seconds",
      script: `[HOOK]
"POV: You're learning a language but textbooks are boring AF"

[REVEAL]
"This AI tool creates personalized stories as podcasts or mini films"

[BENEFIT]
"Learn vocabulary naturally. Practice listening. Actually have fun."

[PROOF]
"I learned 500+ words in 3 months"

[CTA]
"Link in bio to try free 👆"

[YOUR_REFERRAL_LINK]`,
    },
  ];

  const quickStartGuide = `
# Affiliate Quick Start Guide

## Step 1: Get Your Referral Link

1. Log in to your ${APP_TITLE} account
2. Navigate to the Referrals page
3. Copy your unique referral code
4. Your link format: ${window.location.origin}/pricing?ref=YOUR_CODE

## Step 2: Choose Your Promotion Strategy

### For Content Creators:
- Create tutorial videos using the video scripts provided
- Write blog posts using our templates
- Share on social media regularly (3-5 times per week)
- Include your link in video descriptions and blog posts

### For Teachers/Tutors:
- Recommend to your students as supplementary material
- Send email templates to your mailing list
- Share in your online teaching communities
- Create a resources page on your website

### For Bloggers:
- Write detailed review posts
- Create comparison articles (vs other language apps)
- Include in "best tools" roundup posts
- Add to your email newsletter

### For Social Media Influencers:
- Post regularly using our social templates
- Create Stories/Reels showing the app in action
- Host giveaways or challenges
- Engage with comments and questions

## Step 3: Track Your Performance

Monitor your affiliate dashboard to see:
- Click-through rates
- Conversion rates
- Total earnings
- Top-performing content

Use this data to optimize your strategy.

## Step 4: Optimize for Conversions

### Best Practices:
- Be authentic - share your real experience
- Focus on benefits, not just features
- Use compelling CTAs ("Try it free", "Start learning today")
- Include social proof (your results, testimonials)
- Make your link easy to find

### What Works Best:
- Video content (YouTube, TikTok, Instagram Reels)
- Detailed blog reviews with screenshots
- Email campaigns to engaged subscribers
- Social media posts with personal stories

## Step 5: Scale Your Earnings

Once you find what works:
- Create more content in that format
- Repurpose successful content across platforms
- Build an email list for recurring promotion
- Collaborate with other creators
- Test different messaging and CTAs

## Commission Structure Reminder

- Monthly Premium: $3/month recurring (30% of $10)
- Annual Premium: $18/year recurring (30% of $60)
- Minimum payout: $50
- Payment schedule: Monthly, within 7 days of month end

## Support & Resources

- Marketing materials: /affiliate-resources
- Affiliate dashboard: /referrals
- Questions? Email: support@storyling.ai

## Pro Tips

1. **Disclose your affiliate relationship** - It builds trust and is legally required
2. **Focus on value** - Help people solve their language learning problems
3. **Be consistent** - Regular promotion beats sporadic efforts
4. **Engage with your audience** - Answer questions and provide support
5. **Test and iterate** - Track what works and do more of it

---

Ready to start earning? Grab your materials from the tabs above and start promoting today!
`;

  const blogContent = `
# Why ${APP_TITLE} is the Best Language Learning Tool I've Ever Used

After trying dozens of language learning apps and methods, I finally found one that actually works: ${APP_TITLE}.

## The Problem with Traditional Methods

Most language learning apps follow the same tired formula:
- Repetitive flashcards
- Boring grammar drills
- Disconnected vocabulary lists
- No real-world context

## How ${APP_TITLE} is Different

${APP_TITLE} uses AI to create personalized stories tailored to your exact proficiency level. But here's the genius part: these stories are delivered as podcasts or short films.

### Key Features:

**1. Personalized Content**
Every story is generated specifically for you based on your level, interests, and learning goals.

**2. Dual Formats**
Choose between podcast (audio-only) or film (video with subtitles) depending on your learning style.

**3. Natural Learning**
Learn vocabulary and grammar in context, the way native speakers actually use the language.

**4. Progress Tracking**
Built-in analytics show your improvement over time and help you stay motivated.

## My Results

After 3 months of using ${APP_TITLE}:
- Vocabulary increased by 500+ words
- Listening comprehension improved dramatically
- Can now hold basic conversations confidently
- Actually enjoy my daily practice sessions

## Try It Yourself

The best part? You can start for free and see if it works for you.

[Try ${APP_TITLE} Free]([YOUR_REFERRAL_LINK])

## Conclusion

If you're serious about learning a language, ${APP_TITLE} is worth trying. It's the first tool that made language learning feel natural and enjoyable rather than a chore.

Have questions? Drop them in the comments below!
`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Affiliate Resources
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Marketing Materials</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to promote {APP_TITLE} and earn commissions
          </p>
        </div>

        <Tabs defaultValue="banners" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="banners">
              <Image className="mr-2 h-4 w-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="mr-2 h-4 w-4" />
              Social Posts
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="blog">
              <FileText className="mr-2 h-4 w-4" />
              Blog Content
            </TabsTrigger>
            <TabsTrigger value="video">
              <FileText className="mr-2 h-4 w-4" />
              Video Scripts
            </TabsTrigger>
            <TabsTrigger value="guide">
              <FileText className="mr-2 h-4 w-4" />
              Quick Start
            </TabsTrigger>
          </TabsList>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Banner Ads</CardTitle>
                <CardDescription>
                  High-quality banner images for your website, blog, or social media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {banners.map((banner) => (
                    <Card key={banner.name}>
                      <CardHeader>
                        <CardTitle className="text-lg">{banner.name}</CardTitle>
                        <CardDescription>{banner.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[150px]">
                          <p className="text-sm text-muted-foreground">{banner.size} Banner</p>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download PNG
                          </Button>
                          <Button variant="outline">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Replace [YOUR_REFERRAL_LINK] in the banner links with your unique affiliate URL
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Posts Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Templates</CardTitle>
                <CardDescription>
                  Ready-to-use posts for Twitter, LinkedIn, Facebook, and Instagram
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {socialPosts.map((post) => (
                    <Card key={post.platform}>
                      <CardHeader>
                        <CardTitle className="text-lg">{post.platform}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm font-mono">{post.template}</pre>
                        </div>
                        <Button
                          onClick={() => handleCopy(post.template, post.platform)}
                          variant="outline"
                          className="w-full"
                        >
                          {copiedText === post.platform ? (
                            <>
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Template
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Professional email templates for reaching out to your network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {emailTemplates.map((template, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">Template {index + 1}</CardTitle>
                        <CardDescription>Subject: {template.subject}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm font-mono">{template.body}</pre>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCopy(template.body, `email-${index}`)}
                            variant="outline"
                            className="flex-1"
                          >
                            {copiedText === `email-${index}` ? (
                              <>
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Body
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleCopy(template.subject, `subject-${index}`)}
                            variant="outline"
                          >
                            {copiedText === `subject-${index}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <>Copy Subject</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Scripts Tab */}
          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Scripts</CardTitle>
                <CardDescription>
                  Ready-to-use scripts for YouTube, TikTok, Instagram Reels, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {videoScripts.map((script, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{script.title}</CardTitle>
                          <Badge variant="outline">{script.duration}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm font-mono">{script.script}</pre>
                        </div>
                        <Button
                          onClick={() => handleCopy(script.script, `video-${index}`)}
                          variant="outline"
                          className="w-full"
                        >
                          {copiedText === `video-${index}` ? (
                            <>
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Script
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <strong>Tip:</strong> Personalize these scripts with your own experiences and results for maximum authenticity!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Start Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
                <CardDescription>
                  Everything you need to know to start earning commissions today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{quickStartGuide}</pre>
                </div>
                <Button
                  onClick={() => handleCopy(quickStartGuide, "guide")}
                  variant="outline"
                  className="w-full"
                >
                  {copiedText === "guide" ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Guide
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Content Tab */}
          <TabsContent value="blog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Post Template</CardTitle>
                <CardDescription>
                  A complete blog post you can customize and publish on your site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{blogContent}</pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopy(blogContent, "blog")}
                    variant="outline"
                    className="flex-1"
                  >
                    {copiedText === "blog" ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Blog Post
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download as Markdown
                  </Button>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Personalize this template with your own experience and results for better engagement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Always disclose your affiliate relationship when promoting {APP_TITLE}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Personalize templates with your own experience for authenticity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Replace [YOUR_REFERRAL_LINK] with your unique affiliate URL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Test different formats to see what resonates with your audience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Track your results and optimize based on performance</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
