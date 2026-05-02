<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    /** @use HasFactory<\Database\Factories\SchoolClassFactory> */
    use HasFactory;

    protected $fillable = ['name', 'last_seen'];

    protected $casts = [
        'last_seen' => 'datetime',
    ];

    public function subjects(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function components(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ClassComponent::class);
    }

    public function discoveries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ComponentDiscovery::class);
    }
}
