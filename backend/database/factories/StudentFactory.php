<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => $this->faker->name(),
            'age' => $this->faker->numberBetween(18, 25),
            'ref_id' => $this->faker->unique()->numerify('STU-#####'),
            'level_id' => \App\Models\Level::factory(),
        ];
    }
}
