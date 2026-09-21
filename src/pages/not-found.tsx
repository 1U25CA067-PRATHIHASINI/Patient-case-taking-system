import { ArrowLeft, Compass, HeartPulse } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="app-grain grid min-h-[100dvh] place-items-center bg-[hsl(var(--background))] px-6 text-[hsl(var(--foreground))]">
      <div className="w-full max-w-[560px] text-center">
        <Link href="/" className="mx-auto inline-flex items-center gap-2 text-sm font-semibold" data-testid="link-not-found-logo">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><HeartPulse size={19} /></span>
          pulseguard
        </Link>
        <div className="mx-auto mt-16 grid h-20 w-20 place-items-center rounded-[26px] bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
          <Compass size={36} strokeWidth={1.5} />
        </div>
        <p className="mt-8 font-mono-ui text-[10px] font-bold uppercase tracking-[.24em] text-[hsl(var(--accent))]">Signal lost</p>
        <h1 className="font-display mt-3 text-5xl tracking-[-.05em]">That page isn’t here.</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">The route may have moved, but your health data is still right where you left it.</p>
        <Link href="/dashboard" className="focus-ring mt-8 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90" data-testid="link-not-found-dashboard">
          <ArrowLeft size={16} /> Back to overview
        </Link>
      </div>
    </main>
  );
}