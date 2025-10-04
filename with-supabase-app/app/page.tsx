import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  CalendarHeart,
  Clock4,
  Command,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Sun,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const featureHighlights = [
  {
    title: "Mood-first planning",
    description:
      "Tell Scout your vibe — cozy, productive, celebratory — and we orchestrate a timeline packed with matching energy.",
    icon: Sparkles,
  },
  {
    title: "Smart slots & reminders",
    description:
      "Every suggestion auto-fits your calendar with realistic travel time, check-ins, and gentle nudges so you stay on track.",
    icon: AlarmClock,
  },
  {
    title: "Friends & drop-ins",
    description:
      "Share your day board, invite friends to vote, and watch it remix in real time as plans change.",
    icon: MessageCircle,
  },
];

const flowSteps = [
  {
    title: "Set the tone",
    detail:
      "Choose the mood, must-do moments, and how much energy you want to spend today.",
  },
  {
    title: "Mix & match",
    detail:
      "Scout curates food, focus blocks, movement, and treats. Swap anything with one tap.",
  },
  {
    title: "Lock the lineup",
    detail:
      "Publish your day plan, sync it to your calendar, and get live adjustments when things shift.",
  },
];

const pulseStats = [
  { metric: "18K", label: "perfect days sketched" },
  { metric: "92%", label: "users finish their plan in under 5 min" },
  { metric: "54", label: "cities with hyper-local recs" },
];

const dayBlueprint = [
  {
    title: "Sunrise reset",
    description: "Bike to the pier • oat latte at No. 19 • voice note intentions.",
    icon: Sun,
    accent: "from-orange-200/60 to-orange-300/40",
  },
  {
    title: "Deep work groove",
    description: "Heads-down sprint • playlist by Scout • reflection break with friends.",
    icon: Command,
    accent: "from-blue-200/60 to-sky-300/40",
  },
  {
    title: "Night spark",
    description: "Pop-up ramen • indie film • rooftop stargaze.",
    icon: PartyPopper,
    accent: "from-purple-200/60 to-fuchsia-300/40",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/protected");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Backdrop />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24 pt-12 sm:px-8 lg:px-12">
        <Header />
        <Hero />
        <FeatureSection />
        <BlueprintSection />
        <FlowSection />
        <CommunityPulse />
        <CtaSection />
      </div>
    </main>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className={cn(
          "absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-3xl",
          "bg-[radial-gradient(circle_at_center,_hsl(var(--primary)_/_0.35)_0%,_transparent_70%)]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[-6rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full blur-3xl",
          "bg-[radial-gradient(circle_at_center,_hsl(var(--accent)_/_0.35)_0%,_transparent_70%)]",
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(var(--background),1)_0%,_hsla(var(--background),0.3)_45%,_transparent_75%)]" />
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/80 to-primary/40 text-lg font-bold uppercase tracking-tight text-primary-foreground">
          S
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium uppercase tracking-[0.4em] text-muted-foreground">
            Scout
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Your daily plan, perfectly mixed.
          </span>
        </div>
      </Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
        <Link href="#features" className="transition hover:text-foreground">
          Features
        </Link>
        <Link href="#blueprint" className="transition hover:text-foreground">
          Sample day
        </Link>
        <Link href="#flow" className="transition hover:text-foreground">
          How it works
        </Link>
        <Link href="#pulse" className="transition hover:text-foreground">
          Community
        </Link>
        <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
        <Button asChild variant="ghost" size="sm" className="font-semibold">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="font-semibold">
          <Link href="/auth/sign-up">Get started</Link>
        </Button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className="border-none bg-secondary/50 text-secondary-foreground">
            New drop · Day Mode
          </Badge>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <Clock4 className="h-3.5 w-3.5" />
            12 hours, mastered
          </span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Craft the perfect day without overthinking a single moment.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Scout blends AI intuition with your mood board, calendar, and city pulse to serve up a timeline that feels effortless, intentional, and totally you.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button asChild className="h-12 px-7 text-base font-semibold">
            <Link href="/auth/sign-up" className="inline-flex items-center gap-2">
              Build my day
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-7 text-base font-semibold">
            <Link href="#blueprint">See a sample plan</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <div className="flex -space-x-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-[0.65rem] font-semibold uppercase",
                  index === 0 && "bg-gradient-to-br from-primary/70 to-primary/40 text-primary-foreground",
                  index === 1 && "bg-gradient-to-br from-secondary/70 to-secondary/30 text-secondary-foreground",
                  index === 2 && "bg-gradient-to-br from-accent/70 to-accent/30 text-accent-foreground",
                  index === 3 && "bg-card",
                )}
              >
                {index === 3 ? "+" : "★"}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-foreground">Loved by creators, founders, and focus fiends.</span>
            <span className="text-muted-foreground">— everyone chasing a day with more intention and less chaos.</span>
          </div>
        </div>
      </div>
      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative flex justify-center lg:justify-end">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 -z-10 animate-pulse rounded-[2rem] bg-gradient-to-br from-primary/25 via-background to-background blur-2xl" />
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden border-border bg-card/70 backdrop-blur">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary/40 text-base font-semibold text-primary-foreground">
                08
              </span>
              <div>
                <CardTitle className="text-sm font-semibold">Morning reset</CardTitle>
                <CardDescription className="text-xs">
                  45-min flow • sunrise smoothie • gratitude check-in
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <CalendarHeart className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    auto sync
                  </span>
                  <span className="text-foreground">Added to iCal &amp; Notion day page</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <Clock4 className="h-4 w-4 text-secondary" />
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    buffer baked in
                  </span>
                  <span className="text-foreground">Travel time + wind-down reminders handled</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="ml-auto w-[85%] border-border bg-card/70 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-accent" /> Scout pulse update
              </CardTitle>
              <CardDescription className="text-xs">
                New café pop-up nearby. Slot added between 2–3 PM.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 pt-0 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  energy match
                </div>
                <div className="text-foreground">97% aligned</div>
              </div>
              <Button size="icon" className="h-10 w-10 rounded-full">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="space-y-12">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-4 border-border text-xs uppercase tracking-[0.5em]">
          Why Scout
        </Badge>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Designed for the days when you want everything to click.
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          We cross-reference your calendar, city drops, focus windows, and friend invites to compose a flow that keeps your energy high and your decisions light.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {featureHighlights.map((feature) => (
          <Card
            key={feature.title}
            className="relative h-full border-border bg-card/70 backdrop-blur"
          >
            <CardHeader className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function BlueprintSection() {
  return (
    <section id="blueprint" className="space-y-12">
      <div className="flex flex-col gap-4 text-center sm:text-left">
        <Badge variant="outline" className="w-fit border-border text-xs uppercase tracking-[0.5em]">
          Sample day
        </Badge>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A Scout-crafted timeline built for balance.
        </h2>
        <p className="text-base text-muted-foreground sm:text-lg">
          Pick and remix any block. Scout recalibrates the rest of your lineup instantly.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {dayBlueprint.map((item) => (
          <Card
            key={item.title}
            className={cn(
              "relative border-border bg-card/70 backdrop-blur",
              "bg-gradient-to-br",
              item.accent,
            )}
          >
            <CardHeader className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
                <item.icon className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-muted-foreground">
                {item.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FlowSection() {
  return (
    <section id="flow" className="space-y-12">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-4 border-border text-xs uppercase tracking-[0.5em]">
          How it works
        </Badge>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Plan faster than your group chat can say “what’s the move?”
        </h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {flowSteps.map((step, index) => (
          <Card key={step.title} className="relative border-border bg-card/70 backdrop-blur">
            <CardHeader className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                  0{index + 1}
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {step.title}
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                {step.detail}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CommunityPulse() {
  return (
    <section id="pulse" className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
      <div className="space-y-6">
        <Badge variant="outline" className="border-border text-xs uppercase tracking-[0.5em]">
          Community pulse
        </Badge>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The Scout crew keeps feeding the loop.
        </h2>
        <p className="text-base text-muted-foreground sm:text-lg">
          From wellness fams to creative collectives, Scout amplifies how people coordinate days that blend self-care, ambition, and play.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {pulseStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card/70 p-5 text-center backdrop-blur"
            >
              <div className="text-3xl font-semibold text-foreground">{stat.metric}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Card className="border-border bg-card/70 p-0 backdrop-blur">
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            “Every time my day feels chaotic, Scout spins it into a playlist of moments I’m excited about.”
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Tasha used Scout to balance design sprints with yoga, dumpling runs, and late-night inspiration walks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/40 text-sm font-semibold text-primary-foreground">
              T
            </div>
            <div>
              <div className="text-foreground">Tasha Lee</div>
              <div className="text-xs uppercase tracking-[0.2em]">Designer • LA</div>
            </div>
          </div>
          <p>
            “It’s like having a creative producer for my daylight hours. Scout handles logistics so I can stay present.”
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 px-8 py-14 text-center text-primary-foreground shadow-2xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_rgba(255,255,255,0))]" />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <Badge variant="outline" className="border-primary/60 text-xs uppercase tracking-[0.5em] text-primary-foreground">
          ready when you are
        </Badge>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Let Scout produce the perfect day so you can live it.
        </h2>
        <p className="text-base text-primary-foreground/80 sm:text-lg">
          Join the waitlist, drop your vibe, and wake up tomorrow with a curated schedule that keeps the glow all day long.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 min-w-[12rem] border-none bg-foreground text-background hover:bg-foreground/90"
          >
            <Link href="/auth/sign-up">Claim your spot</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-12 min-w-[12rem] border border-primary/40 bg-transparent text-primary-foreground hover:bg-primary/20"
          >
            <Link href="/auth/login">Check invite status</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
