import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function FAQ() {
  useScrollToTop();
  const faqs = [
    {
      question: "What is Storyling AI?",
      answer: "Storyling AI is an AI-powered language learning platform that transforms your vocabulary into immersive podcasts and films. Learn languages naturally through engaging stories tailored to your level."
    },
    {
      question: "How does it work?",
      answer: "Simply input the words you want to learn, choose your target language and difficulty level, and our AI will generate a personalized story in podcast or film format. You can then listen, watch, and practice with built-in quizzes and spaced repetition."
    },
    {
      question: "What languages are supported?",
      answer: "We support major languages including Spanish, French, German, Italian, Portuguese, Chinese (Mandarin), Japanese, Korean, Arabic, Russian, and many more."
    },
    {
      question: "Is there a free plan?",
      answer: "Yes! Our free plan includes 5 stories per month and access to podcast format. Upgrade to Premium for unlimited stories, film format, and advanced analytics."
    },
    {
      question: "Can I use my own vocabulary?",
      answer: "Absolutely! You can create stories from your own wordbank, import vocabulary lists, or let our AI suggest relevant words based on your learning level."
    },
    {
      question: "How does the spaced repetition system work?",
      answer: "Our SRS algorithm tracks your progress on each word and schedules reviews at optimal intervals to maximize retention. Words you struggle with appear more frequently, while mastered words are reviewed less often."
    },
    {
      question: "Can I share my collections?",
      answer: "Yes! You can create public collections and share them with other learners. Top creators appear on our leaderboard."
    },
    {
      question: "What devices can I use?",
      answer: "Storyling AI works on any device with a web browser - desktop, tablet, or mobile. Your progress syncs across all devices."
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold gradient-text flex items-center gap-2">
              <HelpCircle className="h-8 w-8" />
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground mt-2">Find answers to common questions about Storyling AI</p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="rounded-card shadow-playful border-2 bg-gradient-to-br from-purple-100 to-teal-100">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Still have questions?</h3>
            <p className="text-muted-foreground">We're here to help!</p>
            <Link href="/contact">
              <Button className="gradient-primary text-white">Contact Us</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
