<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Session>
 */
class SessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->word(),
            'date' => $this->faker->date(),
            'time' => $this->faker->time(),
            'duration' => 90,
            'type' => $this->faker->randomElement(['cour', 'td', 'tp']),
            'subject_id' => \App\Models\Subject::factory(),
            'teacher_id' => \App\Models\User::factory(),
        ];
    }
}
