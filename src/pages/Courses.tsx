import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/layout/AppLayout';
import {
  BookOpen,
  Users,
  HelpCircle
} from 'lucide-react';
import { useCourses, useMyCoursesIds } from '@/hooks/useCourses';
import { useGroups } from '@/hooks/useGroups';

const Courses = () => {
  const { data: allCourses, isLoading: loadingCourses } = useCourses();
  const { data: userCourses, isLoading: loadingMyCourses } = useMyCoursesIds();
  const { data: allGroups } = useGroups();

  const enrolledIds = new Set((userCourses ?? []).map(uc => uc.course_id));
  const myCourses = (userCourses ?? []);

  const getGroupCount = (courseId: string) =>
    (allGroups ?? []).filter(g => g.course_id === courseId).length;

  const isLoading = loadingCourses || loadingMyCourses;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Your Courses
          </h1>
          <p className="text-muted-foreground">
            View questions, resources, and study groups for each course
          </p>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map(({ courses: course }) => {
              const groupCount = getGroupCount(course.id);
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
                      <Users className="w-4 h-4" />
                      <span>{groupCount} groups</span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Add course card */}
            <div className="bg-muted/50 rounded-xl p-5 border-2 border-dashed border-border flex flex-col items-center justify-center text-center min-h-[200px]">
              <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-foreground mb-1">Add a course</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your course list in settings
              </p>
              <Button variant="outline" size="sm">
                Manage Courses
              </Button>
            </div>
          </div>
        )}

        {/* All Courses */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Browse All Courses
            </h2>
          </div>
          {loadingCourses ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(allCourses ?? []).map(course => {
                const isEnrolled = enrolledIds.has(course.id);
                const groupCount = getGroupCount(course.id);
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
                      <span>{groupCount} groups</span>
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
