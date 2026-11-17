// Domain types for the Digital Equb Management System
// Generated from Phase 3 (Member, Group, Membership modules)
// All financial values are strings from DECIMAL(15,2) cast.

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted';
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type GroupStatus =
    | 'draft'
    | 'registration'
    | 'deposit_stage'
    | 'active'
    | 'completed'
    | 'suspended'
    | 'cancelled';
export type GroupRole = 'organizer' | 'treasurer' | 'auditor' | 'member';
export type MembershipStatus =
    | 'pending'
    | 'active'
    | 'suspended'
    | 'withdrawn'
    | 'expelled';
export type ContributionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type RotationMethod = 'predetermined' | 'lottery' | 'committee';
export type InitialDepositTreatment = 'retained';
export type GroupVisibility = 'public' | 'private' | 'invite_only';
export type MembershipMode = 'approval_required' | 'auto_admit';
export type PayoutCommencementRule =
    | 'deposit_completion_and_date'
    | 'deposit_completion_only'
    | 'scheduled_date_only'
    | 'manual_admin_approval';

/** Computed display-only classification — never stored as a DB field */
export type MemberColor = 'green' | 'red' | 'blue';

// ---------------------------------------------------------------------------
// Member types
// ---------------------------------------------------------------------------
export type MemberIdentification = {
    id: number;
    member_profile_id: number;
    id_type: string;
    id_number: string;
    issue_date: string | null;
    expiry_date: string | null;
    issuing_authority: string | null;
    is_primary: boolean;
    id_card_front_path: string | null;
    id_card_back_path: string | null;
};

export type MemberVerification = {
    id: number;
    member_profile_id: number;
    decision: 'verified' | 'rejected';
    rejection_reason: string | null;
    notes: string | null;
    verified_at: string;
    /** Serialized from verifiedBy() relation */
    verified_by: { id: number; name: string } | null;
};

export type MemberGuarantor = {
    id: number;
    member_profile_id: number;
    guarantor_first_name: string;
    guarantor_middle_name: string | null;
    guarantor_last_name: string;
    guarantor_phone: string | null;
    guarantor_relationship: string | null;
    guarantor_address: string | null;
    guarantor_id_type: string | null;
    guarantor_id_number: string | null;
    guarantor_occupation: string | null;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
};

export type MemberProfile = {
    id: number;
    user_id: number | null;
    member_number: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    phone_normalized: string;
    alternative_phone: string | null;
    email: string | null;
    date_of_birth: string | null;
    gender: 'male' | 'female' | null;
    occupation: string | null;
    address_city: string;
    address_subcity: string | null;
    address_woreda: string | null;
    address_house_no: string | null;
    status: MemberStatus;
    kyc_status: KycStatus;
    profile_photo_path: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Relations (optional — only present when loaded)
    identifications?: MemberIdentification[];
    primary_identification?: MemberIdentification | null;
    verifications?: MemberVerification[];
    guarantors?: MemberGuarantor[];
    memberships?: EqubMembership[];
    created_by?: { id: number; name: string } | null;
    // Computed counts (withCount)
    memberships_count?: number;
};

// ---------------------------------------------------------------------------
// Group types
// ---------------------------------------------------------------------------
export type EqubGroupRule = {
    id: number;
    equb_group_id: number;
    contribution_amount: string;
    contribution_frequency: ContributionFrequency;
    expected_members: number;
    initial_deposit_rounds: number;
    initial_deposit_amount: string;
    initial_deposit_treatment: InitialDepositTreatment;
    membership_mode: MembershipMode;
    payout_commencement_rule: PayoutCommencementRule;
    payout_commencement_date: string | null;
    rotation_method: RotationMethod;
    allow_partial_contributions: boolean;
    late_penalty_enabled: boolean;
    late_penalty_fixed_amount: string;
    late_penalty_daily_rate: string;
    late_penalty_grace_days: number;
    withdrawal_refund_treatment: string;
    terms_and_conditions: string | null;
    is_active: boolean;
    version: number;
    configured_by?: { id: number; name: string } | null;
    // Computed accessors from PHP model
    estimated_pot_amount?: number;
    total_initial_deposit_per_member?: number;
};

export type EqubMembership = {
    id: number;
    equb_group_id: number;
    member_profile_id: number;
    membership_number: string;
    role: GroupRole;
    payout_order_number: number | null;
    status: MembershipStatus;
    joined_at: string;
    terms_accepted_at: string | null;
    approved_by?: { id: number; name: string } | null;
    // Loaded relations
    member_profile?: MemberProfile;
    group?: EqubGroup;
};

export type EqubGroup = {
    id: number;
    name: string;
    group_code: string;
    description: string | null;
    category: string | null;
    location: string | null;
    visibility: GroupVisibility;
    invite_code: string | null;
    status: GroupStatus;
    max_members: number;
    created_at: string;
    updated_at: string;
    created_by?: { id: number; name: string } | null;
    // Relations (optional)
    active_rule?: EqubGroupRule | null;
    rules?: EqubGroupRule[];
    memberships?: EqubMembership[];
    requests?: MembershipRequest[];
    // withCount
    memberships_count?: number;
    active_memberships_count?: number;
};

export type MembershipRequest = {
    id: number;
    equb_group_id: number;
    member_profile_id: number;
    requested_role: GroupRole;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    notes: string | null;
    rejection_reason: string | null;
    reviewed_by_user_id: number | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    // Relations (optional)
    group?: EqubGroup;
    member_profile?: MemberProfile & { user?: { id: number; name: string } | null };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export type MemberColorStatus = {
    color: MemberColor;
    color_label: string;
    is_overdue: boolean;
    overdue_periods: number;
};

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
    draft: 'Draft',
    registration: 'Registration',
    deposit_stage: 'Deposit Stage',
    active: 'Active',
    completed: 'Completed',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
};

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
    unverified: 'Unverified',
    pending: 'Pending Review',
    verified: 'Verified',
    rejected: 'Rejected',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    blacklisted: 'Blacklisted',
};

export const GROUP_ROLE_LABELS: Record<GroupRole, string> = {
    organizer: 'Organizer (ዳኛ)',
    treasurer: 'Treasurer (ገንዘብ ያዥ)',
    auditor: 'Auditor (ተቆጣጣሪ)',
    member: 'Member (አባል)',
};

export const FREQUENCY_LABELS: Record<ContributionFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    monthly: 'Monthly',
};

export const GROUP_VISIBILITY_LABELS: Record<GroupVisibility, string> = {
    public: 'Public',
    private: 'Private',
    invite_only: 'Invite Only',
};

export const MEMBERSHIP_MODE_LABELS: Record<MembershipMode, string> = {
    approval_required: 'Approval Required',
    auto_admit: 'Automatic Admission',
};

export const DEPOSIT_TREATMENT_LABELS: Record<InitialDepositTreatment, string> =
    {
        retained: 'Retained by the group (distribution policy pending)',
    };

// ---------------------------------------------------------------------------
// Phase 4: Initial Deposits & Payments
// ---------------------------------------------------------------------------
export type EqubCycle = {
    id: number;
    equb_group_id: number;
    cycle_number: number;
    status:
        | 'planned'
        | 'deposit_stage'
        | 'ready'
        | 'active'
        | 'closing'
        | 'closed'
        | 'cancelled';
    rule_snapshot: Record<string, unknown> | null;
    started_on: string | null;
    deposit_stage_closed_on: string | null;
    activated_on: string | null;
    closed_on: string | null;
    created_at: string;
};

export type DepositRound = {
    id: number;
    equb_group_id: number;
    equb_cycle_id: number | null;
    sequence: number;
    label: string;
    amount_per_member: string;
    opens_on: string;
    due_on: string;
    closes_on: string;
    status: 'pending' | 'open' | 'closed' | 'approved' | 'cancelled';
    requires_previous_close: boolean;
    approved_at: string | null;
    approver?: { id: number; name: string } | null;
    obligations?: DepositObligation[];
};

export type DepositObligation = {
    id: number;
    deposit_round_id: number;
    equb_membership_id: number;
    member_profile_id: number;
    amount_due: string;
    amount_paid: string;
    due_on: string;
    grace_days: number;
    status: 'pending' | 'submitted' | 'verified' | 'overdue' | 'exempt';
    is_exempt: boolean;
    exemption_reason: string | null;
    member_profile?: MemberProfile;
    membership?: EqubMembership;
    allocations?: PaymentAllocation[];
};

export type Payment = {
    id: number;
    equb_group_id: number;
    equb_membership_id: number;
    member_profile_id: number;
    submitted_by_user_id: number | null;
    payment_type: 'deposit' | 'contribution' | 'penalty' | 'other';
    amount: string;
    currency: string;
    method: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque' | 'other';
    reference: string | null;
    paid_on: string;
    status:
        | 'submitted'
        | 'under_review'
        | 'verified'
        | 'rejected'
        | 'cancelled'
        | 'reversed';
    evidence_file_path: string | null;
    notes: string | null;
    verified_at: string | null;
    submitted_by?: { id: number; name: string } | null;
    member_profile?: MemberProfile;
};

export type PaymentAllocation = {
    id: number;
    payment_id: number;
    deposit_obligation_id: number | null;
    contribution_obligation_id: number | null;
    amount: string;
    payment?: Payment;
};

// ---------------------------------------------------------------------------
// Phase 5: Contributions & Status Board
// ---------------------------------------------------------------------------
export type ContributionPeriod = {
    id: number;
    equb_group_id: number;
    equb_cycle_id: number | null;
    sequence: number;
    label: string;
    opens_on: string;
    due_on: string;
    closes_on: string;
    status: 'pending' | 'open' | 'closed' | 'locked';
    amount_due_snapshot: string;
    grace_days_snapshot: number;
    verified_count?: number;
    total_obligations_count?: number;
    obligations?: ContributionObligation[];
};

export type ContributionObligation = {
    id: number;
    contribution_period_id: number;
    equb_membership_id: number;
    member_profile_id: number;
    amount_due: string;
    amount_paid: string;
    due_on: string;
    grace_days: number;
    status: 'pending' | 'submitted' | 'verified' | 'overdue' | 'partial';
    is_late: boolean;
    late_penalty_amount: string;
    member_profile?: MemberProfile;
    membership?: EqubMembership;
    /** Loaded via allocations.payment.submittedBy */
    allocations?: PaymentAllocation[];
};

export type MemberStatusBoardItem = {
    membership_id: number;
    member_profile_id: number;
    full_name: string;
    membership_number: string;
    role: string;
    /** BLUE has priority over GREEN and RED. neutral = deposit stage / no period / suspended. */
    color: 'green' | 'red' | 'blue' | 'neutral';
    is_overdue: boolean;
    label: string;
    badge: string;
};

export type MemberStatusBoard = {
    green: number;
    red: number;
    blue: number;
    neutral: number;
    overdue: number;
    total_active: number;
    members: MemberStatusBoardItem[];
};

// ---------------------------------------------------------------------------
// Phase 6: Payouts
// ---------------------------------------------------------------------------
export type PayoutStatus =
    | 'scheduled'
    | 'pending_approval'
    | 'approved'
    | 'disbursed'
    | 'completed'
    | 'cancelled'
    | 'reversed';

export type Payout = {
    id: number;
    equb_group_id: number;
    equb_cycle_id: number | null;
    lottery_draw_id: number | null;
    equb_membership_id: number;
    member_profile_id: number;
    payout_sequence: number;
    amount: string;
    currency: string;
    status: PayoutStatus;
    method: string | null;
    account_reference: string | null;
    scheduled_on: string | null;
    disbursed_on: string | null;
    /** Set when status transitions to completed. BLUE status is based on this. */
    completed_at: string | null;
    disbursement_reference: string | null;
    requested_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    disbursed_by: number | null;
    notes: string | null;
    rejection_reason: string | null;
    eligibility_snapshot: Record<string, unknown> | null;
    // Relations
    member_profile?: MemberProfile;
    membership?: EqubMembership;
    requester?: { id: number; name: string } | null;
    approver?: { id: number; name: string } | null;
    disburser?: { id: number; name: string } | null;
    lottery_draw?: LotteryDraw | null;
};

// ---------------------------------------------------------------------------
// Phase 6B: Lottery Draws
// ---------------------------------------------------------------------------
export type LotteryDrawStatus =
    | 'pending'
    | 'conducted'
    | 'winner_confirmed'
    | 'cancelled';

export type LotteryDrawParticipant = {
    id: number;
    lottery_draw_id: number;
    equb_membership_id: number;
    is_eligible: boolean;
    exclusion_reason: string | null;
    membership?: EqubMembership;
};

export type LotteryDraw = {
    id: number;
    equb_group_id: number;
    equb_cycle_id: number;
    payout_sequence: number;
    status: LotteryDrawStatus;
    winning_membership_id: number | null;
    eligible_participants: number[] | null;
    eligible_count: number;
    draw_method: 'random_server' | 'committee' | 'predetermined';
    random_seed: string | null;
    draw_evidence: Record<string, unknown> | null;
    conducted_by: number | null;
    conducted_at: string | null;
    witnessed_by_name: string | null;
    witnessed_by_role: string | null;
    notes: string | null;
    result_hash: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    winning_membership?: EqubMembership | null;
    conducted_by_user?: { id: number; name: string } | null;
    participants?: LotteryDrawParticipant[];
    payouts?: Payout[];
};

// ---------------------------------------------------------------------------
// Self-service: member governance
// ---------------------------------------------------------------------------
export type GroupDecisionStatus = 'open' | 'passed' | 'failed' | 'cancelled';
export type GroupDecisionType = 'general' | 'rule_change';
export type VoteChoice = 'approve' | 'reject' | 'abstain';

export type GroupDecisionVote = {
    id: number;
    group_decision_id: number;
    user_id: number;
    vote: VoteChoice;
    voted_at: string;
    user?: { id: number; name: string } | null;
};

export type GroupDecision = {
    id: number;
    equb_group_id: number;
    title: string;
    description: string | null;
    type: GroupDecisionType;
    decision_payload: Record<string, unknown> | null;
    status: GroupDecisionStatus;
    closes_at: string;
    closed_at: string | null;
    closed_by_user_id: number | null;
    approves_count: number;
    rejects_count: number;
    abstains_count: number;
    created_at: string;
    updated_at: string;
    // Relations (optional)
    group?: EqubGroup;
    created_by?: { id: number; name: string } | null;
    closed_by?: { id: number; name: string } | null;
    votes?: GroupDecisionVote[];
};

export type GovernanceMembership = {
    id: number;
    membership_number: string;
    status: MembershipStatus;
    role: GroupRole;
};
