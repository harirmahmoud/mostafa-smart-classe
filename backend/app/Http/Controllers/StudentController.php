<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index()
    {
        return Student::with('level')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string',
            'age' => 'required|integer',
            'ref_id' => 'required|string|unique:students',
            'level_id' => 'required|exists:levels,id',
        ]);

        return Student::create($validated);
    }

    public function show(Student $student)
    {
        return $student->load('level');
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'full_name' => 'sometimes|required|string',
            'age' => 'sometimes|required|integer',
            'ref_id' => 'sometimes|required|string|unique:students,ref_id,'.$student->id,
            'level_id' => 'sometimes|required|exists:levels,id',
        ]);
        $student->update($validated);

        return $student;
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return response()->noContent();
    }
}
