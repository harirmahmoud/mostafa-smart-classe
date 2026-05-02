<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $role = request()->query('role');

        if ($role) {
            // If using spatie/laravel-permission, filter by role name
            try {
                return User::role($role)->get();
            } catch (\Throwable $e) {
                // Fallback if role helper not available
                return User::whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                })->get();
            }
        }

        // By default, return non-admin users only (exclude users with 'admin' role)
        try {
            return User::whereDoesntHave('roles', function ($q) {
                $q->where('name', 'admin');
            })->get();
        } catch (\Throwable $e) {
            return User::all();
        }
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
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'rf_id' => 'nullable|string|unique:users,rf_id',
            'password' => 'required|string|min:8',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        return User::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return $user;
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'rf_id' => 'sometimes|nullable|string|unique:users,rf_id,'.$user->id,
            'password' => 'sometimes|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return $user;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->noContent();
    }
}
