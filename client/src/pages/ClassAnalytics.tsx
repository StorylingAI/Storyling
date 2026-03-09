import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, TrendingUp, Users, Award, AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function ClassAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const classId = parseInt(id || "0");

  const { data: analytics, isLoading } = trpc.analytics.getClassAnalytics.useQuery({ classId });
  const quizChartRef = useRef<HTMLCanvasElement>(null);
  const vocabChartRef = useRef<HTMLCanvasElement>(null);
  const performanceChartRef = useRef<HTMLCanvasElement>(null);

  // Render quiz scores trend chart
  useEffect(() => {
    if (!analytics || !quizChartRef.current) return;

    const ctx = quizChartRef.current.getContext("2d");
    if (!ctx) return;

    // Group scores by date
    const scoresByDate: Record<string, number[]> = {};
    analytics.quizScoresTrend.forEach((item) => {
      const date = new Date(item.date).toLocaleDateString();
      if (!scoresByDate[date]) scoresByDate[date] = [];
      scoresByDate[date].push(item.score);
    });

    const dates = Object.keys(scoresByDate).sort();
    const avgScores = dates.map((date) => {
      const scores = scoresByDate[date];
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    });

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Average Quiz Score",
            data: avgScores,
            borderColor: "rgb(139, 92, 246)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value: number | string) => value + "%",
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [analytics]);

  // Render vocabulary progress chart
  useEffect(() => {
    if (!analytics || !vocabChartRef.current) return;

    const ctx = vocabChartRef.current.getContext("2d");
    if (!ctx) return;

    // Group by date and count new words
    const wordsByDate: Record<string, number> = {};
    analytics.vocabularyProgress.forEach((item) => {
      const date = new Date(item.date).toLocaleDateString();
      wordsByDate[date] = (wordsByDate[date] || 0) + 1;
    });

    const dates = Object.keys(wordsByDate).sort();
    const counts = dates.map((date) => wordsByDate[date]);

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Words Learned",
            data: counts,
            backgroundColor: "rgba(20, 184, 166, 0.8)",
            borderColor: "rgb(20, 184, 166)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [analytics]);

  // Render student performance comparison chart
  useEffect(() => {
    if (!analytics || !performanceChartRef.current) return;

    const ctx = performanceChartRef.current.getContext("2d");
    if (!ctx) return;

    const students = analytics.studentPerformance.slice(0, 10); // Top 10 students
    const names = students.map((s) => s.userName.split(" ")[0]); // First name only
    const scores = students.map((s) => s.averageQuizScore);
    const mastery = students.map((s) => s.masteryPercentage);

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: names,
        datasets: [
          {
            label: "Quiz Score",
            data: scores,
            backgroundColor: "rgba(139, 92, 246, 0.8)",
          },
          {
            label: "Vocabulary Mastery",
            data: mastery,
            backgroundColor: "rgba(20, 184, 166, 0.8)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value: number | string) => value + "%",
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-500">Analytics not available</p>
      </div>
    );
  }

  // Identify struggling students (low scores or low engagement)
  const strugglingStudents = analytics.studentPerformance.filter(
    (s) => s.averageQuizScore < 60 || s.masteryPercentage < 40
  );

  return (
    <div className="container mx-auto py-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/teacher/class/${classId}`)}
            className="hover:scale-110 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Class Analytics</h1>
            <p className="text-gray-600">Performance insights and trends</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-3xl font-bold">{analytics.studentCount}</p>
            </div>
            <Users className="h-10 w-10 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Quiz Score</p>
              <p className="text-3xl font-bold">{analytics.averageQuizScore}%</p>
            </div>
            <TrendingUp className="h-10 w-10 text-teal-500" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vocabulary Mastery</p>
              <p className="text-3xl font-bold">{analytics.averageVocabularyMastery}%</p>
            </div>
            <Award className="h-10 w-10 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-3xl font-bold">{analytics.totalQuizAttempts}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              Q
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quiz Scores Trend (Last 30 Days)</h3>
          <div style={{ height: "300px" }}>
            <canvas ref={quizChartRef}></canvas>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Vocabulary Progress (Last 30 Days)</h3>
          <div style={{ height: "300px" }}>
            <canvas ref={vocabChartRef}></canvas>
          </div>
        </Card>
      </div>

      {/* Student Performance Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Student Performance Comparison</h3>
        <div style={{ height: "400px" }}>
          <canvas ref={performanceChartRef}></canvas>
        </div>
      </Card>

      {/* Struggling Students Alert */}
      {strugglingStudents.length > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Students Needing Attention ({strugglingStudents.length})
              </h3>
              <p className="text-sm text-orange-700 mb-4">
                These students have low quiz scores (&lt;60%) or vocabulary mastery (&lt;40%) and may benefit from additional support.
              </p>
              <div className="space-y-2">
                {strugglingStudents.map((student) => (
                  <div
                    key={student.userId}
                    className="flex items-center justify-between bg-white p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{student.userName}</p>
                      <p className="text-sm text-gray-600">{student.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Quiz: <span className="font-semibold">{student.averageQuizScore}%</span>
                      </p>
                      <p className="text-sm">
                        Mastery: <span className="font-semibold">{student.masteryPercentage}%</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Student Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Student Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-center py-3 px-4">Quiz Attempts</th>
                <th className="text-center py-3 px-4">Avg Score</th>
                <th className="text-center py-3 px-4">Words Learned</th>
                <th className="text-center py-3 px-4">Mastery</th>
                <th className="text-center py-3 px-4">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {analytics.studentPerformance.map((student) => (
                <tr key={student.userId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{student.userName}</p>
                      <p className="text-sm text-gray-600">{student.userEmail}</p>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">{student.quizAttempts}</td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        student.averageQuizScore >= 80
                          ? "bg-green-100 text-green-800"
                          : student.averageQuizScore >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.averageQuizScore}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {student.masteredWords} / {student.totalWords}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        student.masteryPercentage >= 70
                          ? "bg-green-100 text-green-800"
                          : student.masteryPercentage >= 40
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.masteryPercentage}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-sm text-gray-600">
                    {new Date(student.lastActive).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
