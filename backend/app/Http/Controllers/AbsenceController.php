<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Session;
use App\Models\Student;
use Illuminate\Http\Request;

class AbsenceController extends Controller
{
    /**
     * Handle RFID scan to mark attendance.
     */
    public function scan(Request $request)
    {
        $validated = $request->validate([
            'rf_id' => 'required|string',
            'session_id' => 'required|exists:school_sessions,id',
        ]);

        $student = Student::where('ref_id', $validated['rf_id'])->first();

        if (! $student) {
            return response()->json(['message' => 'Student not found with this RFID.'], 404);
        }

        $session = Session::find($validated['session_id']);

        // Find or create the attendance record
        $attendance = Absence::updateOrCreate(
            [
                'student_id' => $student->id,
                'session_id' => $session->id,
            ],
            [
                'status' => 'present',
                'scan_time' => now(),
            ]
        );

        return response()->json([
            'message' => 'Attendance recorded successfully.',
            'student' => $student->full_name,
            'status' => $attendance->status,
            'scan_time' => $attendance->scan_time,
        ], 200);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        if ($user->hasRole('admin')) {
            return \App\Models\Absence::with(['student', 'session'])->get();
        }

        // Teachers see absences for their sessions
        return \App\Models\Absence::whereHas('session', function ($query) use ($user) {
            $query->where('teacher_id', $user->id);
        })->with(['student', 'session'])->get();
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'session_id' => 'required|exists:school_sessions,id',
        ]);

        return \App\Models\Absence::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\Absence $absence)
    {
        return $absence->load(['student', 'session']);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Absence $absence)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, \App\Models\Absence $absence)
    {
        $validated = $request->validate([
            'student_id' => 'sometimes|required|exists:students,id',
            'session_id' => 'sometimes|required|exists:school_sessions,id',
        ]);

        $absence->update($validated);

        return $absence;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\Absence $absence)
    {
        $absence->delete();

        return response()->noContent();
    }
}
