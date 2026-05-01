<?php

namespace App\Http\Controllers;

use App\Models\Speciality;
use Illuminate\Http\Request;

class SpecialityController extends Controller
{
    public function index()
    {
        return Speciality::with('department')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string', 'department_id' => 'required|exists:departments,id']);

        return Speciality::create($validated);
    }

    public function show(Speciality $speciality)
    {
        return $speciality->load('department');
    }

    public function update(Request $request, Speciality $speciality)
    {
        $validated = $request->validate(['name' => 'sometimes|required|string', 'department_id' => 'sometimes|required|exists:departments,id']);
        $speciality->update($validated);

        return $speciality;
    }

    public function destroy(Speciality $speciality)
    {
        $speciality->delete();

        return response()->noContent();
    }
}
