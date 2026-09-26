<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $activeRole = session('active_role');
        if (! $activeRole) {
            $firstRole = $user->roles()->first();
            $activeRole = $firstRole ? $firstRole->code : null;
            if ($activeRole) {
                session(['active_role' => $activeRole]);
            }
        }

        // Check if the current active role is in the allowed roles list
        // Or if user possesses the role and can switch to it
        if ($activeRole && in_array($activeRole, $roles, true)) {
            return $next($request);
        }

        // If active role doesn't match, check if user has another role that matches
        // If they do have a matching role, auto-switch to that role for smooth UX
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                session(['active_role' => $role]);

                return $next($request);
            }
        }

        // Otherwise, access is forbidden
        abort(403, 'Akses ditolak: Anda tidak memiliki role yang diperlukan untuk mengakses halaman ini.');
    }
}
