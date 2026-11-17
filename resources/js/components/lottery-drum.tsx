import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Confetti } from '@/components/confetti';
import {
    AlertTriangle,
    Loader2,
    RotateCw,
    Shuffle,
    Trophy,
    Users,
    Volume2,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface EligibleMember {
    id: number;
    full_name: string;
    membership_number: string;
    role: string;
}

interface LotteryDrumProps {
    groupId: number | string;
    payoutSequence: number;
    eligibleMembers: EligibleMember[];
    disabled?: boolean;
}

type Phase = 'idle' | 'loading' | 'spinning' | 'zooming' | 'winner' | 'error';

/** Speak text using browser TTS */
function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.85;
        u.pitch = 1.0;
        u.volume = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const en = voices.find((v) => v.lang.startsWith('en'));
        if (en) u.voice = en;
        window.speechSynthesis.speak(u);
    } catch {
        // ignore
    }
}

/** Play a chime using Web Audio API */
function playChime() {
    if (typeof window === 'undefined') return;
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            const t = ctx.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.start(t);
            osc.stop(t + 0.5);
        });
    } catch {
        // ignore
    }
}

export function LotteryDrum({
    groupId,
    payoutSequence,
    eligibleMembers,
    disabled,
}: LotteryDrumProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [winner, setWinner] = useState<EligibleMember | null>(null);
    const [excludedIds, setExcludedIds] = useState<number[]>([]);
    const [drawCount, setDrawCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [cyclingIndex, setCyclingIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [zoomScale, setZoomScale] = useState(0);
    const [hasAnnounced, setHasAnnounced] = useState(false);
    const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const effectivePool = eligibleMembers.filter(
        (m) => !excludedIds.includes(m.id),
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (cycleRef.current) clearInterval(cycleRef.current);
            if (spinRef.current) clearInterval(spinRef.current);
            if (stopRef.current) clearTimeout(stopRef.current);
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Cycling names during spin
    useEffect(() => {
        if (phase === 'spinning' && effectivePool.length > 0) {
            cycleRef.current = setInterval(() => {
                setCyclingIndex((prev) => (prev + 1) % effectivePool.length);
            }, 70);
        } else if (cycleRef.current) {
            clearInterval(cycleRef.current);
            cycleRef.current = null;
        }
        return () => {
            if (cycleRef.current) clearInterval(cycleRef.current);
        };
    }, [phase, effectivePool.length]);

    // Rotation during spin
    useEffect(() => {
        if (phase === 'spinning') {
            spinRef.current = setInterval(() => setRotation((r) => r + 12), 40);
        } else if (spinRef.current) {
            clearInterval(spinRef.current);
            spinRef.current = null;
        }
        return () => {
            if (spinRef.current) clearInterval(spinRef.current);
        };
    }, [phase]);

    // Zoom-out animation
    useEffect(() => {
        if (phase !== 'zooming') return;
        setZoomScale(0);
        let frame = 0;
        const totalFrames = 45;
        const interval = setInterval(() => {
            frame++;
            const p = Math.min(frame / totalFrames, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setZoomScale(Math.max(0, Math.min(1, eased)));
            if (frame >= totalFrames) {
                clearInterval(interval);
                setZoomScale(1);
                setPhase('winner');
            }
        }, 33);
        return () => clearInterval(interval);
    }, [phase]);

    // TTS + chime on winner
    useEffect(() => {
        if (phase === 'winner' && winner && !hasAnnounced) {
            setHasAnnounced(true);
            playChime();
            setTimeout(
                () =>
                    speak(
                        `The winner of lottery draw number ${payoutSequence} is ${winner.full_name}.`,
                    ),
                700,
            );
        }
    }, [phase, winner, payoutSequence, hasAnnounced]);

    // Preload voices
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () =>
                window.speechSynthesis.getVoices();
        }
    }, []);

    /** Call the server to conduct a draw, return the winner data */
    const callServer = useCallback(
        async (url: string, body: Record<string, unknown>) => {
            // Get CSRF token from meta tag
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfMeta?.getAttribute('content') ?? '';

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(body),
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.error ?? 'Lottery draw failed.');
            }
            return data;
        },
        [],
    );

    const handleStart = useCallback(async () => {
        if (phase === 'spinning' || phase === 'loading') return;
        setPhase('loading');
        setErrorMsg('');
        setWinner(null);
        setHasAnnounced(false);
        setZoomScale(0);

        try {
            const data = await callServer(
                `/groups/${groupId}/lottery/conduct`,
                {
                    payout_sequence: payoutSequence,
                    witnessed_by_name: '',
                    witnessed_by_role: '',
                    notes: '',
                },
            );

            // Find the winner from our eligible members list
            const foundWinner =
                effectivePool.find(
                    (m) => m.id === data.winning_membership_id,
                ) ??
                eligibleMembers.find((m) => m.full_name === data.winner_name) ??
                null;

            if (foundWinner) {
                setPhase('spinning');
                stopRef.current = setTimeout(() => {
                    setWinner(foundWinner);
                    setPhase('zooming');
                }, 3000);
            } else {
                // Use the server data directly even if not in our list
                setWinner({
                    id: data.winning_membership_id,
                    full_name: data.winner_name ?? 'Unknown',
                    membership_number: data.winner_membership_number ?? '',
                    role: data.winner_role ?? 'member',
                });
                setPhase('spinning');
                stopRef.current = setTimeout(() => setPhase('zooming'), 2000);
            }
        } catch (e) {
            setPhase('error');
            setErrorMsg(
                e instanceof Error ? e.message : 'Lottery draw failed.',
            );
        }
    }, [
        phase,
        groupId,
        payoutSequence,
        effectivePool,
        eligibleMembers,
        callServer,
    ]);

    const handleRerun = useCallback(async () => {
        if (!winner) return;
        const excludeId = winner.id;
        setExcludedIds((prev) => [...prev, excludeId]);
        setDrawCount((c) => c + 1);

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        setPhase('loading');
        setErrorMsg('');
        setWinner(null);
        setHasAnnounced(false);
        setZoomScale(0);

        try {
            const data = await callServer(`/groups/${groupId}/lottery/rerun`, {
                payout_sequence: payoutSequence,
                exclude_membership_id: excludeId,
            });

            const newPool = eligibleMembers.filter(
                (m) => !excludedIds.includes(m.id) && m.id !== excludeId,
            );
            const foundWinner =
                newPool.find((m) => m.id === data.winning_membership_id) ??
                eligibleMembers.find((m) => m.full_name === data.winner_name) ??
                null;

            if (foundWinner) {
                setPhase('spinning');
                stopRef.current = setTimeout(() => {
                    setWinner(foundWinner);
                    setPhase('zooming');
                }, 3000);
            } else {
                setWinner({
                    id: data.winning_membership_id,
                    full_name: data.winner_name ?? 'Unknown',
                    membership_number: data.winner_membership_number ?? '',
                    role: data.winner_role ?? 'member',
                });
                setPhase('spinning');
                stopRef.current = setTimeout(() => setPhase('zooming'), 2000);
            }
        } catch (e) {
            setPhase('error');
            setErrorMsg(e instanceof Error ? e.message : 'Re-run failed.');
        }
    }, [
        winner,
        groupId,
        payoutSequence,
        excludedIds,
        eligibleMembers,
        callServer,
    ]);

    const handleReset = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setPhase('idle');
        setWinner(null);
        setErrorMsg('');
        setRotation(0);
        setZoomScale(0);
        setHasAnnounced(false);
    }, []);

    // No eligible members
    if (eligibleMembers.length === 0 && phase === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 rounded-full border-2 border-red-200 bg-red-50 p-6">
                    <XCircle className="h-12 w-12 text-red-400" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                    No Eligible Members
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                    All members may have received a payout, have overdue
                    obligations, or have unverified contributions.
                </p>
            </div>
        );
    }

    // All excluded
    if (effectivePool.length === 0 && phase === 'winner') {
        return (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 rounded-full border border-border/80 bg-muted/40 p-6">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                    No More Eligible Members
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                    All eligible members have declined this draw.
                </p>
            </div>
        );
    }

    const isWinnerPhase = phase === 'zooming' || phase === 'winner';
    const showWinnerOnDrum = isWinnerPhase && winner;

    return (
        <div className="flex flex-col items-center justify-center px-4 py-6 select-none">
            {/* Drum */}
            <div className="relative mb-4" style={{ perspective: '1200px' }}>
                <div
                    className={cn(
                        'relative h-72 w-72 rounded-full border-4 shadow-2xl',
                        phase === 'spinning'
                            ? 'border-purple-500 shadow-purple-500/50'
                            : isWinnerPhase
                              ? 'border-emerald-500 shadow-emerald-500/50'
                              : phase === 'error'
                                ? 'border-red-400 shadow-red-400/50'
                                : 'border-purple-300 shadow-purple-300/30',
                    )}
                    style={{
                        transform:
                            phase === 'winner'
                                ? 'rotateZ(0deg) scale(1.05)'
                                : phase === 'zooming'
                                  ? 'rotateZ(0deg) scale(0.9)'
                                  : `rotateZ(${rotation}deg)`,
                        transformStyle: 'preserve-3d',
                        background: isWinnerPhase
                            ? 'radial-gradient(circle at 30% 30%, #d1fae5, #10b981 55%, #047857 100%)'
                            : phase === 'error'
                              ? 'radial-gradient(circle at 30% 30%, #fee2e2, #ef4444 60%, #b91c1c 100%)'
                              : 'radial-gradient(circle at 30% 30%, #e9d5ff, #9333ea 55%, #6b21a8 100%)',
                        transition:
                            phase === 'spinning' ? 'none' : 'all 0.5s ease',
                    }}
                >
                    {/* Inner texture */}
                    <div
                        className="absolute inset-3 rounded-full opacity-20"
                        style={{
                            background:
                                'repeating-conic-gradient(transparent 0deg, rgba(255,255,255,0.15) 10deg, transparent 20deg)',
                            animation:
                                phase === 'spinning'
                                    ? 'drum-rotate 0.4s linear infinite'
                                    : 'none',
                        }}
                    />

                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {phase === 'idle' && (
                            <div className="text-center text-white">
                                <Shuffle className="mx-auto mb-2 h-10 w-10 opacity-80" />
                                <p className="text-xs font-medium opacity-90">
                                    {effectivePool.length} members
                                </p>
                            </div>
                        )}

                        {phase === 'loading' && (
                            <div className="text-center text-white">
                                <Loader2 className="mx-auto mb-2 h-10 w-10 animate-spin" />
                                <p className="text-xs font-medium opacity-90">
                                    Contacting server…
                                </p>
                            </div>
                        )}

                        {phase === 'spinning' && effectivePool.length > 0 && (
                            <div className="px-2 text-center text-white">
                                <div
                                    key={cyclingIndex}
                                    className="max-w-[220px] truncate text-base font-bold"
                                    style={{
                                        animation: 'fade-cycle 70ms ease-in',
                                    }}
                                >
                                    {effectivePool[cyclingIndex]?.full_name ??
                                        '—'}
                                </div>
                                <p className="mt-1 text-[10px] opacity-70">
                                    Spinning…
                                </p>
                            </div>
                        )}

                        {/* Winner zoom-out from inside the drum */}
                        {showWinnerOnDrum && winner && (
                            <div
                                className="px-3 text-center text-white"
                                style={{
                                    transform: `scale(${zoomScale})`,
                                    opacity: zoomScale > 0.1 ? 1 : 0,
                                }}
                            >
                                <Trophy
                                    className="mx-auto mb-1"
                                    style={{
                                        height: `${32 * zoomScale}px`,
                                        width: `${32 * zoomScale}px`,
                                    }}
                                />
                                <div
                                    className="max-w-[240px] truncate font-bold"
                                    style={{
                                        fontSize: `${20 * zoomScale}px`,
                                        lineHeight: '1.2',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {winner.full_name}
                                </div>
                                <div
                                    className="mt-1 font-mono opacity-80"
                                    style={{ fontSize: `${11 * zoomScale}px` }}
                                >
                                    {winner.membership_number}
                                </div>
                                {phase === 'winner' && (
                                    <div
                                        className="mt-2 flex items-center justify-center gap-1 text-white/80"
                                        style={{
                                            fontSize: `${10 * zoomScale}px`,
                                            opacity: zoomScale > 0.8 ? 1 : 0,
                                            transition: 'opacity 0.3s',
                                        }}
                                    >
                                        <Volume2 className="h-3 w-3 animate-pulse" />
                                        <span>Announcing winner…</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {phase === 'error' && (
                            <div className="text-center text-white">
                                <AlertTriangle className="mx-auto mb-2 h-10 w-10" />
                                <p className="text-xs font-medium opacity-90">
                                    Error
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Glow ring */}
                {phase === 'spinning' && (
                    <div
                        className="absolute inset-0 animate-ping rounded-full border-2 border-purple-400 opacity-40"
                        style={{ animationDuration: '1s' }}
                    />
                )}

                {/* Rays */}
                {isWinnerPhase && (
                    <div
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                            background:
                                'radial-gradient(circle, transparent 40%, rgba(16,185,129,0.2) 70%, transparent 100%)',
                            animation: 'ray-expand 1.5s ease-out forwards',
                        }}
                    />
                )}

                {/* Confetti */}
                {phase === 'winner' && <Confetti />}
            </div>

            {/* Action buttons */}
            {phase === 'winner' && winner && (
                <div
                    className="mt-2 flex flex-wrap items-center justify-center gap-2"
                    style={{ animation: 'fade-in-up 0.5s ease 0.3s both' }}
                >
                    <div className="mr-2 flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white">
                            Payout Slot #{payoutSequence}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                            {winner.role}
                        </Badge>
                        {drawCount > 0 && (
                            <Badge variant="secondary">
                                Re-run #{drawCount}
                            </Badge>
                        )}
                    </div>
                    {effectivePool.length > 1 && (
                        <Button
                            onClick={handleRerun}
                            variant="secondary"
                            disabled={disabled}
                            size="sm"
                        >
                            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                            Re-run Draw
                        </Button>
                    )}
                    <Button onClick={handleReset} variant="outline" size="sm">
                        Reset
                    </Button>
                    <a href={`/groups/${groupId}/lottery`}>
                        <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            Draw History
                        </Button>
                    </a>
                </div>
            )}

            {phase === 'winner' &&
                drawCount > 0 &&
                effectivePool.length > 1 && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        {drawCount} previous winner{drawCount > 1 ? 's' : ''}{' '}
                        excluded (declined). {effectivePool.length - 1} still
                        eligible.
                    </p>
                )}

            {/* Error */}
            {phase === 'error' && (
                <div className="mt-2 w-full max-w-md">
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center dark:bg-red-950/20">
                        <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-500" />
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            {errorMsg}
                        </p>
                    </div>
                    <div className="mt-4 flex items-center justify-center">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            )}

            {/* Start button */}
            {phase === 'idle' && (
                <Button
                    onClick={handleStart}
                    disabled={disabled || effectivePool.length === 0}
                    size="lg"
                    className="bg-purple-600 px-8 py-6 text-lg text-white shadow-lg hover:bg-purple-700"
                >
                    <Shuffle className="mr-2 h-5 w-5" />
                    Start Lottery Draw
                </Button>
            )}

            {/* Loading/spinning text */}
            {(phase === 'loading' || phase === 'spinning') && (
                <p className="mt-2 animate-pulse text-sm text-muted-foreground">
                    {phase === 'loading'
                        ? 'Contacting secure server…'
                        : 'Selecting winner from the drum…'}
                </p>
            )}

            {/* Eligible list */}
            {phase === 'idle' && effectivePool.length > 0 && (
                <div className="mt-6 w-full max-w-md">
                    <div className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                            {effectivePool.length} eligible member
                            {effectivePool.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex max-h-24 flex-wrap justify-center gap-1.5 overflow-y-auto">
                        {effectivePool.map((m) => (
                            <span
                                key={m.id}
                                className={cn(
                                    'inline-flex items-center rounded px-2 py-1 text-xs',
                                    excludedIds.includes(m.id)
                                        ? 'bg-red-100 text-red-500 line-through'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {m.full_name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes drum-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fade-cycle { from { opacity: 0.3; } to { opacity: 1; } }
                @keyframes ray-expand { 0% { transform: scale(0.8); opacity: 0; } 40% { opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
