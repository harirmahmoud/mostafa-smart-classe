<?php

namespace App\Http\Controllers;

use App\Models\ClassComponent;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class ClassComponentController extends Controller
{
    public function index()
    {
        return ClassComponent::with('schoolClass')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'name' => 'required|string|max:255',
            'api' => 'required|string|max:2048',
        ]);

        return ClassComponent::create($validated)->load('schoolClass');
    }

    public function show(ClassComponent $classComponent)
    {
        return $classComponent->load('schoolClass');
    }

    public function update(Request $request, ClassComponent $classComponent)
    {
        $validated = $request->validate([
            'school_class_id' => 'sometimes|required|exists:school_classes,id',
            'name' => 'sometimes|required|string|max:255',
            'api' => 'sometimes|required|string|max:2048',
        ]);

        $classComponent->update($validated);

        return $classComponent->load('schoolClass');
    }

    public function destroy(ClassComponent $classComponent)
    {
        $classComponent->delete();

        return response()->noContent();
    }

    /**
     * Toggle a component on/off by calling its API endpoint.
     */
    public function toggle(ClassComponent $classComponent)
    {
        if (!$classComponent->api) {
            return response()->json(['message' => 'Component has no API configured'], 400);
        }

        try {
            $client = new Client();
            $response = $client->post($classComponent->api, [
                'timeout' => 5,
                'connect_timeout' => 5,
            ]);

            return response()->json([
                'message' => 'Component toggled successfully',
                'status' => $response->getStatusCode(),
            ]);
        } catch (RequestException $e) {
            return response()->json([
                'message' => 'Failed to toggle component',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
