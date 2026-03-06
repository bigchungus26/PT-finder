import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2, Users, Dumbbell } from 'lucide-react';

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Kotch Community Guidelines</h1>
            <p className="text-sm text-muted-foreground">Standards that keep our platform safe and professional</p>
          </div>
        </div>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">For Trainers</h2>
          </div>
          <div className="space-y-3">
            {[
              'Maintain professional conduct in all interactions with clients',
              'Keep all bookings and payments within the Kotch platform',
              'Provide accurate information about your qualifications and experience',
              'Respond to booking requests and messages within your stated commitment time',
              'Show up on time for confirmed sessions — repeated no-shows will be flagged',
              'Respect client privacy and do not share their personal information',
              'Use only your real identity and verified credentials on your profile',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">For Clients</h2>
          </div>
          <div className="space-y-3">
            {[
              'Show up for confirmed sessions or cancel with reasonable notice',
              'Communicate respectfully with trainers at all times',
              'Provide honest reviews based on your actual experience',
              'Do not share trainer contact information outside the platform',
              'Report any unprofessional behavior through the app',
              'Follow your trainer\'s safety instructions during sessions',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-xl bg-primary/5 border border-primary/20">
          <h2 className="font-display font-semibold text-foreground mb-2">The Kotch Promise</h2>
          <p className="text-sm text-muted-foreground">
            If your trainer cancels or doesn't show up, Kotch will help you find a replacement session at no extra cost.
            We're committed to making every booking a positive experience.
          </p>
        </section>
      </div>
    </div>
  );
}
