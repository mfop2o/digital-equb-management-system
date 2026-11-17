<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * No user account is created here. Provision the first administrator with
     * `php artisan equb:create-admin` so no default password ever exists.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
        ]);

        // Default Super Administrator for development login
        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
                'must_change_password' => false,
            ]
        );

        $admin->syncRoles(['super-admin']);
    }
}
