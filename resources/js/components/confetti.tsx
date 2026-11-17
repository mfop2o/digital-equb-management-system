import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    delay: number;
    duration: number;
    color: string;
    emoji: string;
}

const colors = [
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#3b82f6',
    '#ef4444',
    '#ec4899',
    '#14b8a6',
];
const emojis = ['🎉', '🎊', '⭐', '✨', '🏆'];

export function Confetti() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const newParticles: Particle[] = Array.from({ length: 60 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 30 - 10,
            rotation: Math.random() * 360,
            delay: Math.random() * 0.5,
            duration: 2 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
        }));
        setParticles(newParticles);

        const timer = setTimeout(() => setVisible(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute text-lg"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        color: p.color,
                        animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
                        transform: `rotate(${p.rotation}deg)`,
                    }}
                >
                    {p.emoji}
                </div>
            ))}
            <style>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
