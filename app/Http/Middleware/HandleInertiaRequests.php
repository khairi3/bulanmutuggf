<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'employee_id' => $user->employee_id,
                    'must_change_password' => $user->must_change_password,
                    'employee' => $user->employee ? [
                        'id' => $user->employee->id,
                        'employee_index' => $user->employee->employee_index,
                        'full_name' => $user->employee->full_name,
                        'employee_level' => $user->employee->employee_level,
                        'position' => $user->employee->position,
                        'unit' => $user->employee->unit,
                        'division' => $user->employee->division,
                        'email' => $user->employee->email,
                    ] : null,
                    'roles' => $user->roles->map(fn ($r) => [
                        'code' => $r->code,
                        'name' => $r->name,
                    ]),
                    'active_role' => $user->getActiveRole()?->code,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'appName' => config('app.name', 'Bulan Mutu GGF'),
        ];
    }
}
