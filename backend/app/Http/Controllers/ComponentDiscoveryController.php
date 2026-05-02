<?php

namespace App\Http\Controllers;

use App\Models\ComponentDiscovery;
use Illuminate\Http\Request;

class ComponentDiscoveryController extends Controller
{
    public function latest()
    {
        $latest = ComponentDiscovery::latest()->first();

        if (!$latest) {
            return response()->json([
                'apis' => [],
            ]);
        }

        return response()->json([
            'id' => $latest->id,
            'school_class_id' => $latest->school_class_id,
            'device_id' => $latest->device_id,
            'apis' => $latest->apis,
            'created_at' => $latest->created_at,
        ]);
    }

    /**
     * Get all unassigned component discoveries (school_class_id is null).
     */
    public function unassigned()
    {
        $discoveries = ComponentDiscovery::whereNull('school_class_id')
            ->latest()
            ->get();

        return response()->json($discoveries);
    }

    /**
     * Get all assigned component discoveries (school_class_id is not null).
     * Includes school class relationships.
     */
    public function assigned()
    {
        $discoveries = ComponentDiscovery::whereNotNull('school_class_id')
            ->with('schoolClass')
            ->latest()
            ->get();

        return response()->json($discoveries);
    }

    /**
     * Assign a discovery to a class.
     * PATCH /component-discoveries/{id}/assign-class
     */
    public function assignClass(Request $request, ComponentDiscovery $componentDiscovery)
    {
        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
        ]);

        $componentDiscovery->update($validated);

        return response()->json([
            'message' => 'Discovery assigned to class',
            'discovery' => $componentDiscovery,
        ]);
    }

    public function destroy(ComponentDiscovery $componentDiscovery)
    {
        $componentDiscovery->delete();

        return response()->noContent();
    }
}
