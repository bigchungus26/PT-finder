import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCreateGroup } from '@/hooks/useGroups';
import { useToast } from '@/hooks/use-toast';

const LEVELS = ['beginner', 'average', 'advanced'] as const;

const CreateGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const createGroup = useCreateGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [maxMembers, setMaxMembers] = useState(8);
  const [level, setLevel] = useState<string>('average');
  const [tagsStr, setTagsStr] = useState('');
  const [rules, setRules] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !courseId) {
      toast({ title: 'Missing fields', description: 'Please fill in name, description, and course.', variant: 'destructive' });
      return;
    }
    const tags = tagsStr.split(/[\s,]+/).filter(Boolean);
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        course_id: courseId,
        max_members: maxMembers,
        level,
        tags: tags.length ? tags : undefined,
        rules: rules.trim() || undefined,
        is_public: isPublic,
      });
      toast({ title: 'Group created', description: 'Your training group is ready.' });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      toast({
        title: 'Could not create group',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-2xl">
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Create a Study Group
        </h1>
        <p className="text-muted-foreground mb-6">
          Set up a new group so others can find and join.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Group name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS101 Problem Solvers"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you study and how will you work together?"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <select
              id="course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select a course</option>
              {coursesLoading
                ? (
                  <option disabled>Loading courses...</option>
                )
                : courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max members</Label>
              <Input
                id="maxMembers"
                type="number"
                min={2}
                max={20}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value) || 8)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma or space separated)</Label>
            <Input
              id="tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. exam-prep, homework, collaborative"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rules">Group rules (optional)</Label>
            <Textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. Be respectful, come prepared"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="public">Public group</Label>
              <p className="text-sm text-muted-foreground">Anyone can discover and request to join</p>
            </div>
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={createGroup.isPending}>
              {createGroup.isPending ? 'Creating...' : 'Create Group'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/groups">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreateGroup;
