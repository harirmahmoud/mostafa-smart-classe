<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionTeacher
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            return $next($request);
        }

        if ($user->hasRole('teacher')) {
            $session_id = $request->input('session_id');

            // Find session_id from route model binding or direct input
            $absence = $request->route('absence');
            if ($absence instanceof \App\Models\Absence) {
                $session_id = $absence->session_id;
            } elseif (is_numeric($absence)) {
                $absence = \App\Models\Absence::find($absence);
                $session_id = $absence?->session_id;
            }

            if ($session_id) {
                $session = \App\Models\Session::find($session_id);
                if ($session && (int) $session->teacher_id !== (int) $user->id) {
                    return response()->json(['message' => 'Unauthorized. You do not teach this session.'], 403);
                }
            }
        }

        return $next($request);
    }
}
