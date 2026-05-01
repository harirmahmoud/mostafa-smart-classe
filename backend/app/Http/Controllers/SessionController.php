<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if ($user->hasRole('admin')) {
            return Session::with(['subject', 'teacher'])->get();
        }

        return Session::where('teacher_id', $user->id)->with(['subject', 'teacher'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'duration' => 'required|integer',
            'type' => 'required|in:cour,td,tp',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
        ]);

        return Session::create($validated);
    }

    public function show(Session $session)
    {
        return $session->load(['subject', 'teacher']);
    }

    public function update(Request $request, Session $session)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'duration' => 'sometimes|required|integer',
            'type' => 'sometimes|required|in:cour,td,tp',
            'subject_id' => 'sometimes|required|exists:subjects,id',
            'teacher_id' => 'sometimes|required|exists:users,id',
        ]);
        $session->update($validated);

        return $session;
    }

    public function destroy(Session $session)
    {
        $session->delete();

        return response()->noContent();
    }
}
