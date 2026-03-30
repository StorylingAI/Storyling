import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Users, UserPlus, BookOpen, Archive, ArrowLeft, BarChart3 } from "lucide-react";

export default function ClassDetail() {
  const params = useParams<{ id: string }>();
  const classId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const { data: classData, isLoading } = trpc.class.getById.useQuery({ classId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Class not found</p>
          <Button onClick={() => navigate("/teacher")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-7xl py-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/teacher")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              <p className="text-muted-foreground mt-1">
                {classData.targetLanguage} • {classData.proficiencyLevel}
              </p>
              {classData.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {classData.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/teacher/class/${classId}/enroll`)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Students
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/teacher/class/${classId}/analytics`)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl py-8">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="mr-2 h-4 w-4" />
              Students ({classData.members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <BookOpen className="mr-2 h-4 w-4" />
              Assignments
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>
                  Manage students enrolled in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!classData.members || classData.members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No students enrolled yet</p>
                    <p className="text-muted-foreground mb-4">
                      Start by enrolling students to this class
                    </p>
                    <Button onClick={() => navigate(`/teacher/class/${classId}/enroll`)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enroll Students
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classData.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{member.userName}</p>
                          <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Enrolled: </span>
                            <span>
                              {new Date(member.enrolledAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {member.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                  Manage story assignments for this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No assignments yet</p>
                  <p className="text-muted-foreground mb-4">
                    Create your first assignment to get started
                  </p>
                  <Button>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Class Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Class Actions</CardTitle>
            <CardDescription>Manage this class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Archive className="mr-2 h-4 w-4" />
              Archive Class
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
