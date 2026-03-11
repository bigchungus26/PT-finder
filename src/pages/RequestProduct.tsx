import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Package, Search } from 'lucide-react';
import { useSubmitProductRequest } from '@/hooks/useStores';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function RequestProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const submitRequest = useSubmitProductRequest();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await submitRequest.mutateAsync({
      name: name.trim(),
      brand: brand.trim() || undefined,
      notes: notes.trim() || undefined,
      user_id: user?.id,
    });
    toast({
      title: 'Request submitted!',
      description: 'We\'ll look for this product across our stores and notify you.',
    });
    navigate('/browse');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Can't find it?
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Tell us what supplement you're looking for. We'll search across all our partner stores and get back to you.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Product Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Whey Protein Isolate"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Brand (optional)</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Optimum Nutrition, Dymatize..."
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Additional Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Flavor, size, any other details..."
              className="rounded-xl resize-none h-24 text-sm"
            />
          </div>
        </div>

        <Button
          className="w-full h-12 text-base"
          onClick={handleSubmit}
          disabled={!name.trim() || submitRequest.isPending}
        >
          <Package className="w-5 h-5 mr-2" />
          {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          We review all requests and try to source products within 24–48 hours.
        </p>
      </div>
    </AppLayout>
  );
}
