<?php

namespace App\Http\Controllers;

use App\Models\Level;
use Illuminate\Http\Request;

class LevelController extends Controller
{
    public function index()
    {
        return Level::with('speciality')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string', 'speciality_id' => 'required|exists:specialities,id']);

        return Level::create($validated);
    }

    public function show(Level $level)
    {
        return $level->load('speciality');
    }

    public function update(Request $request, Level $level)
    {
        $validated = $request->validate(['name' => 'sometimes|required|string', 'speciality_id' => 'sometimes|required|exists:specialities,id']);
        $level->update($validated);

        return $level;
    }

    public function destroy(Level $level)
    {
        $level->delete();

        return response()->noContent();
    }
}
