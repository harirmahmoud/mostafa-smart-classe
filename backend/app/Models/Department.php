<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    /** @use HasFactory<\Database\Factories\DepartmentFactory> */
    use HasFactory;

    protected $fillable = ['name'];

    public function specialities(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Speciality::class);
    }
}
