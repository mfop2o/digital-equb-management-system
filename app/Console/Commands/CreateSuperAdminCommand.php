<?php

namespace App\Console\Commands;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

/**
 * Provision the first super administrator without shipping a default account.
 */
class CreateSuperAdminCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'equb:create-admin
                            {--name= : Full name}
                            {--email= : Email address}
                            {--password= : Password (prefer the interactive prompt; it is not echoed)}
                            {--no-force-change : Do not require a password change at first login}';

    /**
     * @var string
     */
    protected $description = 'Create a super administrator account for the Equb system';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Full name');
        $email = $this->option('email') ?: $this->ask('Email address');
        $password = $this->option('password');

        if ($password === null) {
            $password = $this->secret('Password');
            $confirmation = $this->secret('Confirm password');

            if ($password !== $confirmation) {
                $this->error('The password confirmation does not match.');

                return self::FAILURE;
            }
        }

        if ($password === null || $password === '') {
            $this->error('A password is required.');

            return self::FAILURE;
        }

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => [
                    'required',
                    'string',
                    Password::min(12)->mixedCase()->numbers()->symbols(),
                ],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        if (! Role::query()->where('name', 'super-admin')->where('guard_name', 'web')->exists()) {
            $this->error('The super-admin role does not exist. Run: php artisan db:seed --class=RolesAndPermissionsSeeder');

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        $user->forceFill([
            'status' => UserStatus::Active,
            'email_verified_at' => now(),
            'must_change_password' => ! $this->option('no-force-change'),
        ])->save();

        $user->assignRole('super-admin');

        $this->info("Super administrator created: {$user->email}");

        if ($user->must_change_password) {
            $this->line('The account must change its password at first login.');
        }

        return self::SUCCESS;
    }
}
