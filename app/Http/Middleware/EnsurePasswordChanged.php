<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            // Allow access to password change and logout routes
            if ($request->routeIs('password.change*') || $request->routeIs('logout')) {
                return $next($request);
            }

            return redirect()->route('password.change.notice');
        }

        return $next($request);
    }
}
