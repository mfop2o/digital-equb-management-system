export type LocaleCode = 'en' | 'am' | 'om';

export interface LocaleConfig {
    code: LocaleCode;
    label: string;
    nativeName: string;
    flag: string;
    dir?: 'ltr' | 'rtl';
}

export type CommonTranslations = typeof import('./en/common').common;
export type NavTranslations = typeof import('./en/nav').nav;
export type DashboardTranslations = typeof import('./en/dashboard').dashboard;
export type GroupsTranslations = typeof import('./en/groups').groups;
export type DepositsTranslations = typeof import('./en/deposits').deposits;
export type ContributionsTranslations =
    typeof import('./en/contributions').contributions;
export type PayoutsTranslations = typeof import('./en/payouts').payouts;
export type LotteryTranslations = typeof import('./en/lottery').lottery;
export type FinanceTranslations = typeof import('./en/finance').finance;
export type PenaltiesTranslations = typeof import('./en/penalties').penalties;
export type WithdrawalsTranslations =
    typeof import('./en/withdrawals').withdrawals;
export type MembersTranslations = typeof import('./en/members').members;
export type AuthTranslations = typeof import('./en/auth').auth;

export interface TranslationDictionary {
    common: CommonTranslations;
    nav: NavTranslations;
    dashboard: DashboardTranslations;
    groups: GroupsTranslations;
    deposits: DepositsTranslations;
    contributions: ContributionsTranslations;
    payouts: PayoutsTranslations;
    lottery: LotteryTranslations;
    finance: FinanceTranslations;
    penalties: PenaltiesTranslations;
    withdrawals: WithdrawalsTranslations;
    members: MembersTranslations;
    auth: AuthTranslations;
}
