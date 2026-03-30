import { Link } from "wouter";
import { ArrowLeft, Briefcase, Globe, Heart, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const jobListings = [
  {
    id: 1,
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description: "Build the next generation of AI-powered language learning experiences. Work with React, Node.js, and cutting-edge AI technologies.",
  },
  {
    id: 2,
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote (Worldwide)",
    type: "Full-time",
    description: "Develop and optimize our AI models for story generation, voice synthesis, and personalized learning algorithms.",
  },
  {
    id: 3,
    title: "Product Designer",
    department: "Design",
    location: "Remote (US/EU)",
    type: "Full-time",
    description: "Shape the user experience of our platform. Create intuitive, delightful interfaces that make language learning effortless.",
  },
  {
    id: 4,
    title: "Content Linguist (Spanish)",
    department: "Content",
    location: "Remote (Worldwide)",
    type: "Contract",
    description: "Review and improve AI-generated Spanish content. Ensure cultural authenticity and pedagogical effectiveness.",
  },
  {
    id: 5,
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote (US)",
    type: "Full-time",
    description: "Drive user acquisition and engagement through data-driven marketing strategies. Experience with EdTech or SaaS preferred.",
  },
  {
    id: 6,
    title: "Customer Success Specialist",
    department: "Support",
    location: "Remote (US/EU)",
    type: "Full-time",
    description: "Help our users achieve their language learning goals. Provide exceptional support and gather feedback to improve our product.",
  },
];

const benefits = [
  {
    icon: <Globe className="h-6 w-6 text-purple-600" />,
    title: "Remote-First",
    description: "Work from anywhere in the world with flexible hours",
  },
  {
    icon: <Heart className="h-6 w-6 text-purple-600" />,
    title: "Health & Wellness",
    description: "Comprehensive health insurance and wellness stipend",
  },
  {
    icon: <Zap className="h-6 w-6 text-purple-600" />,
    title: "Learning Budget",
    description: "$2,000 annual budget for courses, conferences, and books",
  },
  {
    icon: <Briefcase className="h-6 w-6 text-purple-600" />,
    title: "Equity & Growth",
    description: "Competitive equity package and clear career progression",
  },
];

export default function Careers() {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Join Our Mission
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Help us transform language learning for millions of people around the world. We're building a diverse, talented team that's passionate about education, technology, and making a real impact.
        </p>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-white to-purple-50">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Join Storyling AI?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition-shadow text-center">
              <div className="mb-4 flex justify-center">{benefit.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Positions */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Open Positions</h2>
        <div className="max-w-4xl mx-auto space-y-6">
          {jobListings.map((job) => (
            <Card key={job.id} className="shadow-lg border-purple-100 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700 shrink-0">
                    Apply Now
                  </Button>
                </div>
                <p className="text-gray-600 leading-relaxed">{job.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white shadow-xl text-center">
          <h2 className="text-3xl font-bold mb-4">Don't See Your Role?</h2>
          <p className="text-lg mb-8 opacity-90">
            We're always looking for talented individuals who share our passion. Send us your resume and let us know how you'd like to contribute.
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
            Send General Application
          </Button>
        </div>
      </section>
      
    </div>
  );
}
