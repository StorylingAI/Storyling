import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EnrollStudents() {
  const params = useParams<{ classId: string }>();
  const classId = parseInt(params.classId || "0");
  const [, navigate] = useLocation();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: template } = trpc.enrollment.getTemplate.useQuery();
  const { data: invitations, refetch } = trpc.enrollment.getInvitations.useQuery({ classId });
  const bulkEnrollMutation = trpc.enrollment.bulkEnroll.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setCsvFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvContent) {
      toast.error("Please select a CSV file first");
      return;
    }

    setIsUploading(true);

    try {
      const result = await bulkEnrollMutation.mutateAsync({
        classId,
        csvContent,
      });

      toast.success(`Successfully invited ${result.invitedCount} students!`);
      
      if (result.warnings && result.warnings.length > 0) {
        toast.warning(`Some rows had issues: ${result.warnings.join(", ")}`);
      }

      // Clear file
      setCsvFile(null);
      setCsvContent("");
      
      // Refresh invitations
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to enroll students");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    if (!template) return;

    const blob = new Blob([template.template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_enrollment_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "expired":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "expired":
        return "Expired";
      default:
        return "Pending";
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/teacher/class/${classId}`)}
        >
          ← Back to Class
        </Button>
      </div>

      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Student Enrollment</CardTitle>
            <CardDescription>
              Upload a CSV file to invite multiple students to this class at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Need a template?</p>
                <p className="text-sm text-muted-foreground">
                  Download our CSV template to get started
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {csvFile ? csvFile.name : "Click to upload CSV file"}
                </p>
                <p className="text-sm text-muted-foreground">
                  CSV file with student names and emails
                </p>
              </label>
            </div>

            {/* Upload Button */}
            {csvFile && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? "Sending Invitations..." : "Upload and Send Invitations"}
              </Button>
            )}

            {/* CSV Format Guide */}
            <details className="p-4 bg-muted rounded-lg">
              <summary className="cursor-pointer font-medium">
                CSV Format Requirements
              </summary>
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">Required columns:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    <code className="bg-background px-1 py-0.5 rounded">name</code> - Student's full name
                  </li>
                  <li>
                    <code className="bg-background px-1 py-0.5 rounded">email</code> - Student's email address
                  </li>
                </ul>
                <p className="mt-4 font-medium">Example:</p>
                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
{`name,email
John Doe,john.doe@example.com
Jane Smith,jane.smith@example.com`}
                </pre>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Invitations</CardTitle>
            <CardDescription>
              Track the status of sent invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!invitations || invitations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No invitations sent yet. Upload a CSV file to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{invitation.name}</p>
                      <p className="text-sm text-muted-foreground">{invitation.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invitation.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(invitation.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
