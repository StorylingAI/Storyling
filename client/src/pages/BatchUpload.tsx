import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, CheckCircle2, XCircle, Loader2, BookOpen, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Info, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function BatchUpload() {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [jobName, setJobName] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.batch.uploadCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch job created! Processing ${data.totalItems} items.`);
      setCSVFile(null);
      setJobName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      jobsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const jobsQuery = trpc.batch.getJobs.useQuery(undefined, {
    refetchInterval: 3000, // Poll every 3 seconds for updates
  });

  const templateQuery = trpc.batch.downloadTemplate.useQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setCSVFile(file);
      if (!jobName) {
        setJobName(file.name.replace(".csv", ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!csvFile || !jobName) {
      toast.error("Please provide a job name and CSV file");
      return;
    }

    const csvContent = await csvFile.text();
    uploadMutation.mutate({ name: jobName, csvContent });
  };

  const handleDownloadTemplate = () => {
    if (!templateQuery.data) return;
    
    const blob = new Blob([templateQuery.data.template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storylingai_batch_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProgressPercentage = (job: any) => {
    if (job.totalItems === 0) return 0;
    return Math.round(((job.completedItems + job.failedItems) / job.totalItems) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              Batch Content Generation
            </h1>
            <p className="text-gray-600">
            Upload a CSV file to generate multiple stories at once
          </p>
        </div>
      </div>

      {/* CSV Format Guide */}
      <Card className="p-6 border-2 border-purple-200">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold">CSV Format Guide</h2>
              <p className="text-sm text-gray-600">Learn how to structure your batch file</p>
            </div>
          </div>
          {showGuide ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showGuide && (
          <div className="mt-6 space-y-6 animate-slide-up">
            {/* Required Columns */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Required Columns
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <code className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">vocabulary_words</code>
                    <p className="text-sm text-gray-600 mt-1">Comma or semicolon-separated words (e.g., "hello,world,friend")</p>
                  </div>
                  <div>
                    <code className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">target_language</code>
                    <p className="text-sm text-gray-600 mt-1">Language to learn (e.g., Spanish, French, German)</p>
                  </div>
                  <div>
                    <code className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">proficiency_level</code>
                    <p className="text-sm text-gray-600 mt-1">Must be: A1, A2, B1, B2, C1, or C2</p>
                  </div>
                  <div>
                    <code className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">theme</code>
                    <p className="text-sm text-gray-600 mt-1">Story theme (e.g., Comedy, Romance, Adventure, Mystery)</p>
                  </div>
                  <div>
                    <code className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">format</code>
                    <p className="text-sm text-gray-600 mt-1">Must be: podcast or film</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Columns */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Optional Columns
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">voice_type</code>
                    <p className="text-sm text-gray-600 mt-1">For podcasts (e.g., "Warm & Friendly", "Professional")</p>
                  </div>
                  <div>
                    <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">cinematic_style</code>
                    <p className="text-sm text-gray-600 mt-1">For films (e.g., "Cinematic & Epic", "Documentary")</p>
                  </div>
                  <div>
                    <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">topic_prompt</code>
                    <p className="text-sm text-gray-600 mt-1">Custom context (e.g., "Travel vocabulary for tourists")</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Example CSV Row</h3>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono">
{`"hello,world,friend",Spanish,A2,Comedy,podcast,Warm & Friendly,,Learn basic greetings`}
                </pre>
              </div>
            </div>

            {/* Best Practices */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Best Practices
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Keep vocabulary focused:</strong> 5-15 words per story works best for retention</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Match proficiency level:</strong> A1/A2 for beginners, B1/B2 for intermediate, C1/C2 for advanced</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Use thematic groups:</strong> Group related words (e.g., food, travel, emotions) for better context</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Batch limit:</strong> Maximum 100 items per upload to ensure timely processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Quote special characters:</strong> Wrap values containing commas in quotes (e.g., "hello,world")</span>
                </li>
              </ul>
            </div>

            {/* Common Errors */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Common Errors
              </h3>
              <div className="bg-red-50 rounded-lg p-4 space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span><strong>Empty vocabulary_words:</strong> Each row must have at least one word</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span><strong>Invalid format value:</strong> Must be exactly "podcast" or "film" (lowercase)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span><strong>Wrong proficiency level:</strong> Use standard CEFR levels: A1, A2, B1, B2, C1, C2</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span><strong>Column count mismatch:</strong> Ensure all rows have the same number of columns as the header</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Section */}
        <Card className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Upload CSV</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={!templateQuery.data}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Name</label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., Spanish Vocabulary Batch 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">CSV File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {csvFile ? csvFile.name : "Click to upload CSV file"}
                  </span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!csvFile || !jobName || uploadMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Batch Generation
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Job Queue */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Batch Jobs</h2>
          
          {jobsQuery.isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
              <p className="text-gray-600 mt-2">Loading jobs...</p>
            </div>
          ) : jobsQuery.data && jobsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {jobsQuery.data.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h3 className="font-semibold text-lg">{job.name}</h3>
                        <p className="text-sm text-gray-600">
                          {job.completedItems} / {job.totalItems} completed
                          {job.failedItems > 0 && (
                            <span className="text-red-600 ml-2">
                              ({job.failedItems} failed)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : job.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : job.status === "processing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{getProgressPercentage(job)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(job)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Created: {new Date(job.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No batch jobs yet. Upload a CSV to get started!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
