<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Database-portable SQL expression for "due date plus grace days has passed".
 *
 * MySQL/MariaDB and SQLite use different date arithmetic syntax; keeping the
 * expression in one place prevents driver-specific queries leaking into
 * services (and breaking the SQLite test suite).
 */
final class OverdueExpression
{
    public static function dueDatePlusGraceDaysHasPassed(): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "date(due_on, '+' || grace_days || ' days') < date('now')"
            : 'DATE_ADD(due_on, INTERVAL grace_days DAY) < CURDATE()';
    }
}
