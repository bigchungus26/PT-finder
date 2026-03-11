import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, MapPin, Phone, ShoppingBag, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Beirut');
  const [saving, setSaving] = useState(false);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone((profile as { saved_phone?: string }).saved_phone ?? '');
      setAddress((profile as { saved_address?: string }).saved_address ?? '');
      setCity((profile as { saved_city?: string }).saved_city ?? 'Beirut');
    }
  }, [profile]);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark((d) => !d);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, saved_phone: phone, saved_address: address, saved_city: city })
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Profile saved!' });
    } catch {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-12">
        <h1 className="font-display text-xl font-bold text-foreground">My Profile</h1>

        {/* Avatar / email */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
            {name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-bold text-foreground">{name || 'Your Name'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Info
          </h2>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+961 70 000 000" type="tel" className="rounded-xl" />
          </div>
        </div>

        {/* Saved delivery address */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Saved Delivery Address
          </h2>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">City / Area</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Beirut" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Street / Building</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, floor..." className="rounded-xl" />
          </div>
          <p className="text-xs text-muted-foreground">Saved address auto-fills at checkout.</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>

        {/* Quick links */}
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          <Link to="/orders" className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground flex-1">My Orders</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
          >
            {isDark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground flex-1">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left text-red-500"
          >
            <span className="text-sm font-medium flex-1">Sign Out</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Stackr · Lebanon's Supplement Store
        </p>
      </div>
    </AppLayout>
  );
}
