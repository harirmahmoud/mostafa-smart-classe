<?php

namespace App\Http\Controllers;

use App\Models\ComponentDiscovery;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    public function index()
    {
        return SchoolClass::all();
    }

    public function create()
    {
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|unique:school_classes']);

        return SchoolClass::create($validated);
    }

    public function show(SchoolClass $schoolClass)
    {
        return $schoolClass;
    }

    public function edit(SchoolClass $schoolClass)
    {
    }

    public function update(Request $request, SchoolClass $schoolClass)
    {
        $validated = $request->validate(['name' => 'required|string|unique:school_classes,name,'.$schoolClass->id]);
        $schoolClass->update($validated);

        return $schoolClass;
    }

    public function destroy(SchoolClass $schoolClass)
    {
        $schoolClass->delete();

        return response()->noContent();
    }

    /**
     * Webhook endpoint for ESP32 devices to send discovered component APIs.
     * ESP32 sends device APIs without specifying which class they belong to.
     * Admin later assigns the discovery to a class via the assignment endpoint.
     * Accepts:
     * - device_id (optional): identifier for the ESP32 device
     * - apis: array of strings OR objects ({ label, api })
     * Each API is a single toggle endpoint for on/off control.
     */
    public function webhookComponentApis(Request $request)
    {
        $data = $request->validate([
            'device_id' => 'sometimes|string|max:255',
            'apis' => 'required|array|min:1',
            'apis.*' => 'required',
        ]);

        $normalizedApis = collect($data['apis'])->map(function ($api, $index) {
            if (is_string($api)) {
                return [
                    'label' => 'Component '.($index + 1),
                    'api' => $api,
                ];
            }

            return [
                'label' => $api['label'] ?? ('Component '.($index + 1)),
                'api' => $api['api'] ?? '',
            ];
        })->filter(function ($api) {
            return !empty($api['api']);
        })->values()->all();

        if (empty($normalizedApis)) {
            return response()->json(['message' => 'No valid APIs were provided'], 422);
        }

        if (!empty($data['device_id'])) {
            ComponentDiscovery::where('device_id', $data['device_id'])->delete();
        }

        $discovery = ComponentDiscovery::create([
            'school_class_id' => null,
            'device_id' => $data['device_id'] ?? null,
            'apis' => $normalizedApis,
        ]);

        return response()->json([
            'message' => 'Component APIs received',
            'discovery' => $discovery,
            'apis' => $normalizedApis,
        ]);
    }
}
