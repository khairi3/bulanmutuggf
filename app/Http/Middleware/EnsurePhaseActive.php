<?php

namespace App\Http\Middleware;

use App\Models\Stream;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePhaseActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $phaseType): Response
    {
        $user = $request->user();

        // Admin always has override access
        if ($user && $user->hasRole('admin')) {
            return $next($request);
        }

        // Determine stream from route or request
        $stream = null;
        if ($request->route('stream')) {
            $stream = $request->route('stream');
            if (is_numeric($stream)) {
                $stream = Stream::find($stream);
            }
        } elseif ($request->has('stream_id')) {
            $stream = Stream::find($request->input('stream_id'));
        }

        if ($stream instanceof Stream) {
            if (! $stream->isPhaseOpen($phaseType)) {
                $phase = $stream->phases()->where('phase_type', $phaseType)->first();
                $phaseName = ucfirst($phaseType);

                $msg = "Akses ditutup: Fase {$phaseName} untuk stream {$stream->name} tidak sedang aktif.";
                if ($phase && $phase->end_at && $phase->end_at < now()) {
                    $msg .= ' Periode telah berakhir pada '.$phase->end_at->format('d M Y H:i');
                }

                if ($request->expectsJson()) {
                    return response()->json(['message' => $msg], 403);
                }

                return back()->with('error', $msg);
            }
        }

        return $next($request);
    }
}
