import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Compass,
    Lock,
    Scale,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Vote,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Welcome() {
    const { auth } = usePage().props as {
        auth?: { user?: { id: number; name: string } | null };
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Head title="Digital Equb Platform — Self-Service Community Savings" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <AppLogo />
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <Link
                            href="/explore"
                            className="hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <Compass className="size-4 text-[#759B46]" />
                            <span>Discover Circles</span>
                        </Link>
                        <a
                            href="#how-it-works"
                            className="hover:text-foreground transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="#governance"
                            className="hover:text-foreground transition-colors"
                        >
                            Governance
                        </a>
                        <a
                            href="#security"
                            className="hover:text-foreground transition-colors"
                        >
                            Financial Integrity
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {auth?.user ? (
                            <Link href="/dashboard">
                                <Button className="bg-[#759B46] hover:bg-[#5F8037] text-white font-medium shadow-xs">
                                    Go to Dashboard
                                    <ArrowRight className="ml-1.5 size-4" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-sm font-medium">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-[#759B46] hover:bg-[#5F8037] text-white font-medium shadow-xs">
                                        Join Platform
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border/40 bg-gradient-to-b from-[#759B46]/5 to-transparent">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#759B46]/30 bg-[#759B46]/10 px-3.5 py-1 text-xs font-semibold text-[#759B46] mb-6">
                                <Sparkles className="size-3.5" />
                                <span>Self-Service • Member-Governed • Zero Central Dependency</span>
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
                                Traditional Equb, Reimagined for the{' '}
                                <span className="text-[#759B46]">Digital Era</span>
                            </h1>

                            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                                An independent, transparent platform where members discover circles,
                                self-organize rotating savings, participate in server-side verifiable lottery
                                draws, and govern their groups collaboratively.
                            </p>

                            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                <Link href="/explore">
                                    <Button
                                        size="lg"
                                        className="bg-[#759B46] hover:bg-[#5F8037] text-white px-6 font-medium shadow-sm"
                                    >
                                        <Compass className="mr-2 size-4" />
                                        Explore Public Circles
                                    </Button>
                                </Link>

                                {!auth?.user && (
                                    <Link href="/register">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="border-border hover:bg-muted font-medium"
                                        >
                                            Register as Member
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {/* Trust metrics */}
                            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-border/60 pt-8 sm:grid-cols-4 text-left">
                                <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                                    <p className="text-2xl font-bold text-foreground">100%</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Self-Service Groups
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                                    <p className="text-2xl font-bold text-foreground">Server-Side</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Verifiable Lottery Draws
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                                    <p className="text-2xl font-bold text-foreground">Ring-Fenced</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Initial Security Deposits
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                                    <p className="text-2xl font-bold text-foreground">Democratic</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Member-Voted Rules
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Pillars */}
                <section id="features" className="py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                Built for Community Autonomy
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Everything you need to coordinate savings safely without handing over custody
                                to an unaccountable central administrator.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="rounded-2xl border-border/70 shadow-xs hover:border-[#759B46]/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="size-11 rounded-xl bg-[#759B46]/10 text-[#759B46] flex items-center justify-center mb-4">
                                        <Users className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Self-Service Circles
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Create public, private, or invite-only circles with custom
                                        contribution sizes, schedules, membership caps, and admission rules.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-border/70 shadow-xs hover:border-[#759B46]/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="size-11 rounded-xl bg-[#759B46]/10 text-[#759B46] flex items-center justify-center mb-4">
                                        <Vote className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Member Governance
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Group decisions and rule amendments are decided by democratic member
                                        votes. Every approval and vote is recorded with full auditability.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-border/70 shadow-xs hover:border-[#759B46]/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="size-11 rounded-xl bg-[#759B46]/10 text-[#759B46] flex items-center justify-center mb-4">
                                        <Scale className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Tamper-Proof Lottery
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Server-side cryptographic draw logic ensures zero client-side manipulation.
                                        Only compliant members with cleared obligations are eligible to win.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-border/70 shadow-xs hover:border-[#759B46]/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="size-11 rounded-xl bg-[#759B46]/10 text-[#759B46] flex items-center justify-center mb-4">
                                        <Lock className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Ring-Fenced Deposits
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Initial collateral deposits are tracked separately from recurring
                                        contributions and payout disbursements to guarantee solvency.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-border/70 shadow-xs hover:border-[#759B46]/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="size-11 rounded-xl bg-[#759B46]/10 text-[#759B46] flex items-center justify-center mb-4">
                                        <TrendingUp className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Transparent Ledgers
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        Every payment reference, verification, penalty, and adjustment is
                                        recorded in a double-entry style ledger visible to authorized members.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-border/70 shadow-xs hover:border-[#759B46]/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="size-11 rounded-xl bg-[#759B46]/10 text-[#759B46] flex items-center justify-center mb-4">
                                        <Shield className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Strict Non-Custodial Model
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                        The platform coordinates obligations, verification, and disbursement
                                        proofs directly between members without unauthorized internal wallet holding.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="py-20 border-t border-border/60 bg-muted/20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                How an Equb Cycle Works
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Simple, transparent steps from initial group discovery to final disbursement.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-4">
                            <div className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#759B46]">
                                    Step 01
                                </div>
                                <h4 className="mt-2 text-base font-semibold text-foreground">
                                    Discover or Create
                                </h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Browse public groups by location, contribution amount, and schedule, or spin
                                    up your own circle in minutes.
                                </p>
                            </div>

                            <div className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#759B46]">
                                    Step 02
                                </div>
                                <h4 className="mt-2 text-base font-semibold text-foreground">
                                    Fund Initial Deposit
                                </h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Members deposit collateral into the group's verified deposit rounds to guarantee
                                    full participation across rounds.
                                </p>
                            </div>

                            <div className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#759B46]">
                                    Step 03
                                </div>
                                <h4 className="mt-2 text-base font-semibold text-foreground">
                                    Regular Contributions
                                </h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Submit payments with bank references. Designated treasurers or verifiers confirm
                                    receipts before draws occur.
                                </p>
                            </div>

                            <div className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                                <div className="text-xs font-bold uppercase tracking-wider text-[#759B46]">
                                    Step 04
                                </div>
                                <h4 className="mt-2 text-base font-semibold text-foreground">
                                    Draw & Disbursement
                                </h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    The winner is selected via server-side lottery, verified, and paid out with
                                    receipt confirmation recorded immutably.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-20">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-3xl border border-[#759B46]/30 bg-gradient-to-br from-[#759B46]/15 via-card to-card p-8 sm:p-12 text-center shadow-sm">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                Ready to join or start your Equb circle?
                            </h2>
                            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
                                Register your independent member account today and discover community savings groups
                                that align with your financial goals.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-4">
                                <Link href="/explore">
                                    <Button
                                        size="lg"
                                        className="bg-[#759B46] hover:bg-[#5F8037] text-white px-6 font-medium shadow-sm"
                                    >
                                        <Compass className="mr-2 size-4" />
                                        Browse Circles
                                    </Button>
                                </Link>
                                {!auth?.user && (
                                    <Link href="/register">
                                        <Button size="lg" variant="outline" className="font-medium">
                                            Create Account
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/60 bg-card py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <AppLogo />
                        <span>— Self-Service Digital Equb Platform</span>
                    </div>
                    <div>
                        © {new Date().getFullYear()} Digital Equb. Community Savings & Member Governance.
                    </div>
                </div>
            </footer>
        </div>
    );
}
