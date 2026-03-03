import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/components/layout/AppLayout';
import {
  ArrowLeft,
  BookOpen,
  MessageCircle,
  Users,
  HelpCircle,
  Plus,
  ThumbsUp,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import {
  useCourseQuestions,
  useCreateQuestion,
  useCreateAnswer,
  useVoteQuestion,
  useAcceptAnswer,
} from '@/hooks/useQuestions';
import { useGroups } from '@/hooks/useGroups';
import { useRecommendedPeople } from '@/hooks/useMatching';
import { BuddyCompatibilityCard } from '@/components/BuddyCompatibilityCard';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});

  const { data: allCourses = [] } = useCourses();
  const course = id ? allCourses.find((c) => c.id === id) : null;
  const { data: questions = [] } = useCourseQuestions(id);
  const { data: allGroups = [] } = useGroups();
  const { data: recommendedPeople = [] } = useRecommendedPeople();
  const groups = id ? allGroups.filter((g) => g.course_id === id) : [];
  const buddiesInCourse = id
    ? recommendedPeople.filter((m) =>
        (m.user.user_courses ?? []).some((uc) => uc.course_id === id)
      )
    : [];

  const createQuestion = useCreateQuestion();
  const createAnswer = useCreateAnswer();
  const voteQuestion = useVoteQuestion();
  const acceptAnswer = useAcceptAnswer();

  const handlePostQuestion = () => {
    if (!id || !newQuestion.title.trim() || !newQuestion.content.trim()) return;
    const tags = newQuestion.tags.split(/[\s,]+/).filter(Boolean);
    createQuestion.mutate(
      {
        course_id: id,
        title: newQuestion.title.trim(),
        content: newQuestion.content.trim(),
        tags: tags.length ? tags : undefined,
      },
      {
        onSuccess: () => {
          setNewQuestion({ title: '', content: '', tags: '' });
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handlePostAnswer = (questionId: string) => {
    const content = answerInputs[questionId]?.trim();
    if (!content) return;
    createAnswer.mutate(
      { questionId, content },
      {
        onSuccess: () => {
          setAnswerInputs((prev) => ({ ...prev, [questionId]: '' }));
        },
      }
    );
  };

  const handleVote = (questionId: string, hasVoted: boolean) => {
    voteQuestion.mutate({ questionId, hasVoted });
  };

  const handleAcceptAnswer = (answerId: string, questionId: string) => {
    acceptAnswer.mutate({ answerId, questionId });
  };

  if (!id) return null;

  if (!course) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <Button asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalMembers = groups.reduce(
    (acc, g) => acc + (g.group_members?.length ?? 0),
    0
  );

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{course.code}</Badge>
                  {course.professor && (
                    <span className="text-sm text-muted-foreground">
                      Prof. {course.professor.replace('Dr. ', '')}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                  {course.title}
                </h1>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="coral">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Ask a Question</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Question Title</Label>
                    <Input
                      id="title"
                      placeholder="What's your question about?"
                      value={newQuestion.title}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Details</Label>
                    <Textarea
                      id="content"
                      placeholder="Provide more context..."
                      value={newQuestion.content}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, content: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., homework, exam, concept"
                      value={newQuestion.tags}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, tags: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePostQuestion}
                      disabled={
                        !newQuestion.title.trim() ||
                        !newQuestion.content.trim() ||
                        createQuestion.isPending
                      }
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Post Question
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft text-center">
            <div className="text-2xl font-bold text-foreground">{questions.length}</div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft text-center">
            <div className="text-2xl font-bold text-foreground">{groups.length}</div>
            <div className="text-sm text-muted-foreground">Study Groups</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft text-center">
            <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
            <div className="text-sm text-muted-foreground">Students</div>
          </div>
        </div>

        <Tabs defaultValue="buddies" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="buddies">
              <UserPlus className="w-4 h-4 mr-2" />
              Find Buddies
            </TabsTrigger>
            <TabsTrigger value="questions">
              <HelpCircle className="w-4 h-4 mr-2" />
              Course Q&A
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="w-4 h-4 mr-2" />
              Study Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buddies" className="mt-0">
            {buddiesInCourse.length > 0 ? (
              <div className="space-y-4">
                {buddiesInCourse.map((match) => (
                  <BuddyCompatibilityCard
                    key={match.user.id}
                    match={match}
                    courseId={id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No buddies in this course yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add this course to your profile or check Discover for more matches.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/discover">Discover Buddies</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="mt-0">
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => {
                  const profile = question.profiles;
                  const answers = question.answers ?? [];
                  const acceptedAnswer = answers.find((a) => a.is_accepted);
                  const isExpanded = expandedQuestion === question.id;
                  const isQuestionOwner = user?.id === question.user_id;

                  return (
                    <div
                      key={question.id}
                      className="bg-card rounded-xl p-4 border border-border/50 shadow-soft"
                    >
                      <div className="flex items-start gap-4">
                        {/* Vote column */}
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'h-8 w-8 p-0',
                              question.user_voted && 'text-primary'
                            )}
                            onClick={() => handleVote(question.id, question.user_voted)}
                            disabled={voteQuestion.isPending}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium text-foreground">
                            {question.vote_count ?? 0}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-foreground">{question.title}</h3>
                            {question.is_resolved && (
                              <Badge className="bg-success/10 text-success border-success/20 shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {question.content}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(question.tags ?? []).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={profile?.avatar ?? undefined} />
                                <AvatarFallback>
                                  {(profile?.name ?? '?')[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{profile?.name ?? 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {answers.length} answers
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(question.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded answers section */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          {answers.map((answer) => (
                            <div
                              key={answer.id}
                              className={cn(
                                'flex items-start gap-3 rounded-lg p-3',
                                answer.is_accepted ? 'bg-success/5' : 'bg-muted/50'
                              )}
                            >
                              {answer.is_accepted && (
                                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage
                                      src={answer.profiles?.avatar ?? undefined}
                                    />
                                    <AvatarFallback>
                                      {(answer.profiles?.name ?? '?')[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-foreground">
                                    {answer.profiles?.name ?? 'Unknown'}
                                  </span>
                                  {answer.is_accepted && (
                                    <Badge variant="secondary" className="text-xs">
                                      Accepted
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {new Date(answer.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {answer.content}
                                </p>
                                {/* Accept button for question owner on unresolved questions */}
                                {isQuestionOwner && !question.is_resolved && !answer.is_accepted && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-xs h-7"
                                    onClick={() => handleAcceptAnswer(answer.id, question.id)}
                                    disabled={acceptAnswer.isPending}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Accept Answer
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}

                          {answers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No answers yet. Be the first to help!
                            </p>
                          )}

                          {/* Answer input */}
                          <div className="flex gap-2 pt-2">
                            <Textarea
                              placeholder="Write your answer..."
                              value={answerInputs[question.id] ?? ''}
                              onChange={(e) =>
                                setAnswerInputs((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handlePostAnswer(question.id)}
                              disabled={
                                !answerInputs[question.id]?.trim() ||
                                createAnswer.isPending
                              }
                              className="self-end"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Show accepted answer preview when collapsed */}
                      {!isExpanded && question.is_resolved && acceptedAnswer && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-start gap-3 bg-success/5 rounded-lg p-3">
                            <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage
                                    src={acceptedAnswer.profiles?.avatar ?? undefined}
                                  />
                                  <AvatarFallback>
                                    {(acceptedAnswer.profiles?.name ?? '?')[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-foreground">
                                  {acceptedAnswer.profiles?.name ?? 'Unknown'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  Accepted
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {acceptedAnswer.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No questions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to ask a question for this course
                </p>
                <Button variant="coral" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ask Question
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            {groups.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="block bg-card rounded-xl p-4 border border-border/50 shadow-soft card-hover"
                  >
                    <h3 className="font-medium text-foreground mb-1">{group.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {group.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(group.tags ?? []).slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {(group.group_members ?? []).slice(0, 4).map((member) => (
                          <Avatar
                            key={member.user_id}
                            className="w-7 h-7 border-2 border-card"
                          >
                            <AvatarImage
                              src={member.profiles?.avatar ?? undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {(member.profiles?.name ?? '?')[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <Badge
                        className={cn(
                          'text-xs capitalize',
                          group.level === 'beginner' && 'bg-success/10 text-success',
                          group.level === 'average' && 'bg-info/10 text-info',
                          group.level === 'advanced' && 'bg-warning/10 text-warning'
                        )}
                      >
                        {group.level}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No study groups yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a study group for this course
                </p>
                <Button variant="coral" asChild>
                  <Link to="/groups/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 bg-gradient-to-br from-primary/10 to-accent rounded-xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-foreground mb-1">
                Need help using StudyHub for {course.code}?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI assistant can help you find study groups for this course,
                navigate the Q&A section, and make the most of StudyHub's features.
              </p>
              <Button variant="soft" asChild>
                <Link to="/ai">
                  Ask StudyHub Assistant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CourseDetail;
