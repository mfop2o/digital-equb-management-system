<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Requests\Admin\UpdateUserRolesRequest;
use App\Models\User;
use App\Services\AuthorizationService;
use App\Services\UserProvisioningService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(
        private readonly UserProvisioningService $users,
        private readonly AuthorizationService $authorization,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $filters = [
            'search' => $request->string('search')->trim()->toString(),
            'status' => $request->string('status')->trim()->toString(),
            'role' => $request->string('role')->trim()->toString(),
        ];

        $statuses = array_map(
            static fn (UserStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ],
            UserStatus::cases(),
        );

        $validStatuses = array_column($statuses, 'value');

        $users = User::query()
            ->with('roles')
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $search = '%'.$filters['search'].'%';

                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            })
            ->when(in_array($filters['status'], $validStatuses, true), function ($query) use ($filters): void {
                $query->where('status', $filters['status']);
            })
            ->when($filters['role'] !== '', function ($query) use ($filters): void {
                $query->whereHas('roles', fn ($query) => $query->where('name', $filters['role']));
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user): array => $this->present($user));

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $filters,
            'roles' => Role::query()->orderBy('name')->pluck('name')->all(),
            'statuses' => $statuses,
            'canCreate' => $request->user()?->can('create', User::class) ?? false,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('admin/users/create', [
            'roles' => $this->assignableRoleNames($request->user()),
            'canAssignSuperAdmin' => $request->user()?->isSuperAdmin() ?? false,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $target = $this->users->invite(
            $request->accountAttributes(),
            $request->validated('roles'),
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Invitation sent to {$target->email}.",
        ]);

        return to_route('admin.users.index');
    }

    public function edit(Request $request, User $user): Response
    {
        $this->authorize('view', $user);
        $user->load('roles');

        return Inertia::render('admin/users/edit', [
            'managedUser' => $this->present($user),
            'assignableRoles' => $this->assignableRoleNames($request->user()),
            'canAssignRoles' => $request->user()?->can('assignRoles', $user) ?? false,
            'canResetPassword' => $request->user()?->can('resetPassword', $user) ?? false,
            'canDeactivate' => $request->user()?->can('deactivate', $user) ?? false,
            'canActivate' => $request->user()?->can('activate', $user) ?? false,
            'canUnlock' => $request->user()?->can('unlock', $user) ?? false,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->users->update($user, $request->accountAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Account details updated.',
        ]);

        return back();
    }

    public function updateRoles(UpdateUserRolesRequest $request, User $user): RedirectResponse
    {
        $this->authorization->syncUserRoles(
            $user,
            $request->validated('roles'),
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Roles updated.',
        ]);

        return back();
    }

    public function deactivate(Request $request, User $user): RedirectResponse
    {
        $this->authorize('deactivate', $user);

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->users->deactivate($user, $data['reason'] ?? null);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Account deactivated. The user can no longer sign in.',
        ]);

        return back();
    }

    public function activate(User $user): RedirectResponse
    {
        $this->authorize('activate', $user);

        $this->users->activate($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Account reactivated.',
        ]);

        return back();
    }

    public function unlock(User $user): RedirectResponse
    {
        $this->authorize('unlock', $user);

        $this->users->unlock($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Account unlocked.',
        ]);

        return back();
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $this->authorize('resetPassword', $user);

        $this->users->resetPassword($user, $request->user());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'A password reset link has been sent.',
        ]);

        return back();
    }

    /**
     * @return array<int, string>
     */
    private function assignableRoleNames(?User $actor): array
    {
        return Role::query()
            ->when(! $actor?->isSuperAdmin(), fn ($query) => $query->where('name', '!=', 'super-admin'))
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status->value,
            'status_label' => $user->status->label(),
            'roles' => $user->getRoleNames()->sort()->values()->all(),
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'must_change_password' => $user->must_change_password,
            'is_super_admin' => $user->isSuperAdmin(),
            'is_auditor' => $user->isAuditor(),
            'is_self' => $user->is(auth()->user()),
        ];
    }
}
