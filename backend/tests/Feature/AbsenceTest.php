<?php

use App\Models\Absence;
use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->artisan('db:seed', ['--class' => 'RoleSeeder']);
});

it('allows admin to see all absences', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    Absence::factory()->count(3)->create();

    $response = $this->actingAs($admin)->getJson('/api/absences');

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

it('restricts teacher to absences of their own sessions', function () {
    $teacher1 = User::factory()->create();
    $teacher1->assignRole('teacher');

    $teacher2 = User::factory()->create();
    $teacher2->assignRole('teacher');

    $session1 = Session::factory()->create(['teacher_id' => $teacher1->id]);
    $session2 = Session::factory()->create(['teacher_id' => $teacher2->id]);

    Absence::factory()->create(['session_id' => $session1->id]);
    Absence::factory()->create(['session_id' => $session1->id]);
    Absence::factory()->create(['session_id' => $session2->id]);

    $response = $this->actingAs($teacher1)->getJson('/api/absences');

    $response->assertStatus(200)
        ->assertJsonCount(2);
});

it('prevents teacher from modifying absences of other teachers sessions', function () {
    $teacher1 = User::factory()->create();
    $teacher1->assignRole('teacher');

    $teacher2 = User::factory()->create();
    $teacher2->assignRole('teacher');

    $session2 = Session::factory()->create(['teacher_id' => $teacher2->id]);
    $absence2 = Absence::factory()->create(['session_id' => $session2->id]);

    $response = $this->actingAs($teacher1)->putJson("/api/absences/{$absence2->id}", [
        'student_id' => $absence2->student_id,
        'session_id' => $absence2->session_id,
    ]);

    $response->assertStatus(403);
});

it('allows teacher to modify absences of their own sessions', function () {
    $teacher = User::factory()->create();
    $teacher->assignRole('teacher');

    $session = Session::factory()->create(['teacher_id' => $teacher->id]);
    $absence = Absence::factory()->create(['session_id' => $session->id]);

    $response = $this->actingAs($teacher)->putJson("/api/absences/{$absence->id}", [
        'student_id' => $absence->student_id,
        'session_id' => $absence->session_id,
    ]);

    $response->assertStatus(200);
});

it('allows teacher to scan RFID for their own sessions', function () {
    $teacher = User::factory()->create();
    $teacher->assignRole('teacher');

    $student = \App\Models\Student::factory()->create(['ref_id' => 'CARD123']);
    $session = Session::factory()->create(['teacher_id' => $teacher->id]);

    $response = $this->actingAs($teacher)->postJson('/api/absences/scan', [
        'rf_id' => 'CARD123',
        'session_id' => $session->id,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('status', 'present');

    $this->assertDatabaseHas('absences', [
        'student_id' => $student->id,
        'session_id' => $session->id,
        'status' => 'present',
    ]);
});

it('prevents teacher from scanning RFID for another teachers sessions', function () {
    $teacher1 = User::factory()->create();
    $teacher1->assignRole('teacher');

    $teacher2 = User::factory()->create();
    $teacher2->assignRole('teacher');

    $session2 = Session::factory()->create(['teacher_id' => $teacher2->id]);

    $response = $this->actingAs($teacher1)->postJson('/api/absences/scan', [
        'rf_id' => 'CARD123',
        'session_id' => $session2->id,
    ]);

    $response->assertStatus(403);
});
