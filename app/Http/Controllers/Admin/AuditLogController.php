<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AuditLog::class);

        $filters = [
            'event' => $request->string('event')->trim()->toString(),
            'user_id' => $request->string('user_id')->trim()->toString(),
            'from' => $request->string('from')->trim()->toString(),
            'to' => $request->string('to')->trim()->toString(),
        ];

        $logs = AuditLog::query()
            ->with('user:id,name')
            ->when($filters['event'] !== '', fn ($query) => $query->where('event', $filters['event']))
            ->when(ctype_digit($filters['user_id']), fn ($query) => $query->where('user_id', (int) $filters['user_id']))
            ->when($filters['from'] !== '', fn ($query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when($filters['to'] !== '', fn ($query) => $query->whereDate('created_at', '<=', $filters['to']))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditLog $log): array => $this->present($log));

        return Inertia::render('admin/audit/index', [
            'logs' => $logs,
            'filters' => $filters,
            'events' => AuditLog::query()->distinct()->orderBy('event')->pluck('event')->all(),
            'users' => User::query()->orderBy('name')->limit(200)->get(['id', 'name']),
        ]);
    }

    public function show(AuditLog $auditLog): Response
    {
        $this->authorize('view', $auditLog);

        $auditLog->loadMissing('user:id,name');

        return Inertia::render('admin/audit/show', [
            'log' => $this->present($auditLog),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'event' => $log->event,
            'user' => $log->user === null ? null : [
                'id' => $log->user->id,
                'name' => $log->user->name,
            ],
            'equb_group_id' => $log->equb_group_id,
            'auditable_type' => $log->auditable_type === null ? null : class_basename($log->auditable_type),
            'auditable_id' => $log->auditable_id,
            'before' => $log->before,
            'after' => $log->after,
            'changed_fields' => $log->changed_fields,
            'transaction_reference' => $log->transaction_reference,
            'request_id' => $log->request_id,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'created_at' => $log->created_at?->toIso8601String(),
            'created_at_display' => $log->created_at?->timezone(config('equb.display_timezone'))->format('Y-m-d H:i:s T'),
        ];
    }
}
