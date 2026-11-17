export type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    status?: string;
    status_label?: string;
    must_change_password?: boolean;
    /* @chisel-2fa */
    two_factor_enabled?: boolean;
    /* @end-chisel-2fa */
    roles?: string[];
    is_super_admin?: boolean;
    is_auditor?: boolean;
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    roles: string[];
    permissions: string[];
    is_super_admin: boolean;
    is_auditor: boolean;
    must_change_password: boolean;
    two_factor_enabled: boolean;
};

export type Organization = {
    name: string;
    timezone: string;
    currency: string;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

/* @chisel-2fa */
export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
/* @end-chisel-2fa */
