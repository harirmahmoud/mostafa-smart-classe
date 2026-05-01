<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\Department::all();
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
        $validated = $request->validate(['name' => 'required|string|unique:departments']);

        return \App\Models\Department::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\Department $department)
    {
        return $department;
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Department $department)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, \App\Models\Department $department)
    {
        $validated = $request->validate(['name' => 'required|string|unique:departments,name,'.$department->id]);
        $department->update($validated);

        return $department;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\Department $department)
    {
        $department->delete();

        return response()->noContent();
    }
}
