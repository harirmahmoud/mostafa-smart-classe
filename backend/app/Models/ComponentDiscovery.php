<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComponentDiscovery extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_class_id',
        'device_id',
        'apis',
    ];

    protected $casts = [
        'apis' => 'array',
    ];

    public function schoolClass(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }
}
