<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Append-only audit writer.
 *
 * Never expose secrets here. Callers must pass already-safe values; the user
 * observer strips password and token fields before calling.
 */
class AuditService
{
    /**
     * Record an audit event.
     *
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public function log(
        string $event,
        ?Model $auditable = null,
        array $before = [],
        array $after = [],
        ?int $equbGroupId = null,
        ?string $transactionReference = null,
    ): void {
        $request = request();

        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'equb_group_id' => $equbGroupId,
            'event' => $event,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'before' => $this->encode($before),
            'after' => $this->encode($after),
            'changed_fields' => $this->encode($this->changedFields($before, $after)),
            'transaction_reference' => $transactionReference,
            'request_id' => $request->headers->get('X-Request-Id'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent() !== null
                ? Str::limit($request->userAgent(), 250)
                : null,
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     * @return array<int, string>
     */
    private function changedFields(array $before, array $after): array
    {
        $changed = [];

        foreach (array_unique([...array_keys($before), ...array_keys($after)]) as $key) {
            if (($before[$key] ?? null) !== ($after[$key] ?? null)) {
                $changed[] = $key;
            }
        }

        return $changed;
    }

    /**
     * @param  array<array-key, mixed>  $values
     */
    private function encode(array $values): ?string
    {
        if ($values === []) {
            return null;
        }

        $encoded = json_encode($values);

        return $encoded === false ? null : $encoded;
    }
}
