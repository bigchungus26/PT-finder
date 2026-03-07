import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';
import {
  BookOpen,
  MessageCircle,
  Users,
  ArrowRight,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useGroups } from '@/hooks/useGroups';

const Courses = () => {
  const { data: profile } = useCurrentProfile();
  const { data: allCourses = [], isLoading: coursesLoading } = useCourses();
  const { data: allGroups = [] } = useGroups();

  const userCourses = profile?.user_courses ?? [];

  const getCourseStats = (courseId: string) => {
    const groups = allGroups.filter((g) => g.course_id === courseId);
    return { groups: groups.length };
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Your Courses
          </h1>
          <p className="text-muted-foreground">
            View Q&A, resources, and training groups for each specialty
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userCourses.map((uc) => {
            const course = uc.courses;
            if (!course) return null;
            const stats = getCourseStats(course.id);
            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block bg-card rounded-xl p-5 border border-border/50 shadow-soft card-hover group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline">{course.code}</Badge>
                </div>
                <h2 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h2>
                {course.professor && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Prof. {course.professor.replace('Dr. ', '')}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>Q&A</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{stats.groups} groups</span>
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="bg-muted/50 rounded-xl p-5 border-2 border-dashed border-border flex flex-col items-center justify-center text-center min-h-[200px]">
            <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-1">Add a course</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Update your course list in settings or onboarding
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Plus className="w-4 h-4 mr-1" />
                Add Course
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Browse All Courses
            </h2>
          </div>
          {coursesLoading ? (
            <div className="text-muted-foreground">Loading courses...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allCourses.map((course) => {
                const isEnrolled = userCourses.some(
                  (uc) => uc.course_id === course.id || uc.courses?.id === course.id
                );
                const stats = getCourseStats(course.id);
                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block bg-card rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isEnrolled ? 'default' : 'outline'} className="text-xs">
                        {course.code}
                      </Badge>
                      {isEnrolled && (
                        <span className="text-xs text-primary font-medium">Enrolled</span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-foreground truncate mb-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{stats.groups} groups</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Courses;
