import { useState } from 'react';
import logoImage from '../../images/logo.png';

export default function AuthLogo({ size = 16 }: { size?: number }) {
    const [failed, setFailed] = useState(false);
    const px = size * 4;

    return (
        <div
            className="flex items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-white p-2 shadow-md dark:bg-card"
            style={{ width: px * 1.4, height: px }}
        >
            {failed ? (
                <span className="text-2xl font-bold text-emerald-600">
                    EMS
                </span>
            ) : (
                <img
                    src={logoImage}
                    alt="Logo"
                    className="h-full w-full object-contain"
                    onError={() => setFailed(true)}
                />
            )}
        </div>
    );
}
