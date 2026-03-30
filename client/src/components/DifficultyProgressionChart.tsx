import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DifficultyProgressionData {
  totalStories: number;
  difficultyDistribution: Record<string, number>;
  progressionTimeline: Array<{
    month: string;
    difficulties: Record<string, number>;
  }>;
  currentLevel: string | null;
  highestLevel: string | null;
}

interface DifficultyProgressionChartProps {
  data: DifficultyProgressionData;
}

// Color mapping for difficulty levels
const DIFFICULTY_COLORS: Record<string, string> = {
  "A1": "#10b981", // green
  "A2": "#34d399",
  "B1": "#fbbf24", // yellow
  "B2": "#f59e0b",
  "C1": "#ef4444", // red
  "C2": "#dc2626",
  "HSK 1": "#10b981",
  "HSK 2": "#34d399",
  "HSK 3": "#fbbf24",
  "HSK 4": "#f59e0b",
  "HSK 5": "#ef4444",
  "HSK 6": "#dc2626",
};

const DIFFICULTY_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'];

export function DifficultyProgressionChart({ data }: DifficultyProgressionChartProps) {
  const { totalStories, difficultyDistribution, progressionTimeline, currentLevel, highestLevel } = data;

  if (totalStories === 0) {
    return (
      <Card className="rounded-card shadow-playful-lg border-2">
        <CardContent className="py-16 text-center space-y-4">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
          <div>
            <h3 className="text-xl font-bold mb-2">No Difficulty Data Yet</h3>
            <p className="text-muted-foreground">
              Create more stories to see your difficulty progression!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for distribution chart (Doughnut)
  const sortedLevels = Object.keys(difficultyDistribution).sort((a, b) => {
    return DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b);
  });

  const distributionData = {
    labels: sortedLevels,
    datasets: [
      {
        data: sortedLevels.map(level => difficultyDistribution[level]),
        backgroundColor: sortedLevels.map(level => DIFFICULTY_COLORS[level] || "#6b7280"),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} stories (${percentage}%)`;
          },
        },
      },
    },
  };

  // Prepare data for timeline chart (Line/Area)
  const allLevelsInTimeline = new Set<string>();
  progressionTimeline.forEach(({ difficulties }) => {
    Object.keys(difficulties).forEach(level => allLevelsInTimeline.add(level));
  });
  
  const timelineLevels = Array.from(allLevelsInTimeline).sort((a, b) => {
    return DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b);
  });

  const timelineData = {
    labels: progressionTimeline.map(({ month }) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: timelineLevels.map(level => ({
      label: level,
      data: progressionTimeline.map(({ difficulties }) => difficulties[level] || 0),
      borderColor: DIFFICULTY_COLORS[level] || "#6b7280",
      backgroundColor: (DIFFICULTY_COLORS[level] || "#6b7280") + "40", // 40 = 25% opacity
      fill: true,
      tension: 0.4,
    })),
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-card shadow-playful border-2">
          <CardHeader className="pb-3">
            <CardDescription>Total Stories</CardDescription>
            <CardTitle className="text-3xl">{totalStories}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-card shadow-playful border-2">
          <CardHeader className="pb-3">
            <CardDescription>Current Level</CardDescription>
            <CardTitle className="text-2xl">
              {currentLevel ? (
                <Badge className="text-lg px-3 py-1" style={{ 
                  backgroundColor: DIFFICULTY_COLORS[currentLevel],
                  color: "white"
                }}>
                  {currentLevel}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-lg">N/A</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-card shadow-playful border-2">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              Highest Level
            </CardDescription>
            <CardTitle className="text-2xl">
              {highestLevel ? (
                <Badge className="text-lg px-3 py-1" style={{ 
                  backgroundColor: DIFFICULTY_COLORS[highestLevel],
                  color: "white"
                }}>
                  {highestLevel}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-lg">N/A</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribution Chart */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Difficulty Distribution
            </CardTitle>
            <CardDescription>
              Stories completed by difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Doughnut data={distributionData} options={distributionOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Timeline Chart */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progression Timeline
            </CardTitle>
            <CardDescription>
              Your difficulty progression over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              {progressionTimeline.length > 0 ? (
                <Line data={timelineData} options={timelineOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Not enough data to show timeline
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
