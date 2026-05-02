<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        return Subject::with('schoolClass')->get();
    }

    public function create()
    {
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'school_class_id' => 'required|exists:school_classes,id',
        ]);

        return Subject::create($validated);
    }

    public function show(Subject $subject)
    {
        return $subject->load('schoolClass');
    }

    public function edit(Subject $subject)
    {
    }

    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'school_class_id' => 'sometimes|required|exists:school_classes,id',
        ]);
        $subject->update($validated);

        return $subject;
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();

        return response()->noContent();
    }
}
