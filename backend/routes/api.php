<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\ClassComponentController;
use App\Http\Controllers\ComponentDiscoveryController;
use App\Http\Controllers\SchoolClassController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'API is working']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('specialities', SpecialityController::class);
    Route::apiResource('levels', LevelController::class);
    Route::apiResource('students', StudentController::class);
    Route::apiResource('school-classes', SchoolClassController::class);
    Route::apiResource('class-components', ClassComponentController::class);
    Route::post('class-components/{classComponent}/toggle', [ClassComponentController::class, 'toggle']);
    Route::apiResource('subjects', SubjectController::class);
    Route::apiResource('sessions', SessionController::class);
    Route::get('component-discoveries/latest', [ComponentDiscoveryController::class, 'latest']);
    Route::get('component-discoveries/unassigned', [ComponentDiscoveryController::class, 'unassigned']);
    Route::get('component-discoveries/assigned', [ComponentDiscoveryController::class, 'assigned']);
    Route::post('component-discoveries/{componentDiscovery}/assign-class', [ComponentDiscoveryController::class, 'assignClass']);
    Route::delete('component-discoveries/{componentDiscovery}', [ComponentDiscoveryController::class, 'destroy']);

    // Applying teacher.session middleware to absences
    Route::post('absences/scan', [AbsenceController::class, 'scan'])->middleware('teacher.session');
    Route::apiResource('absences', AbsenceController::class)->middleware('teacher.session');
});

// Webhook endpoint for ESP32 devices to send discovered component APIs (unauthenticated)
Route::post('webhook/component-apis', [SchoolClassController::class, 'webhookComponentApis']);
