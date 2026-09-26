<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'employee_id',
        'password',
        'must_change_password',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function hasRole(string|array $roles): bool
    {
        $roleList = is_array($roles) ? $roles : func_get_args();

        return $this->roles->contains(function (Role $role) use ($roleList) {
            return in_array($role->code, $roleList, true);
        });
    }

    public function getActiveRole(): ?Role
    {
        $activeRoleCode = session('active_role');

        if ($activeRoleCode) {
            $matched = $this->roles->firstWhere('code', $activeRoleCode);
            if ($matched) {
                return $matched;
            }
        }

        // Default to first role or null
        $default = $this->roles->first();
        if ($default) {
            session(['active_role' => $default->code]);
        }

        return $default;
    }

    public function setActiveRole(string $roleCode): bool
    {
        if ($this->hasRole($roleCode)) {
            session(['active_role' => $roleCode]);

            return true;
        }

        return false;
    }
}
