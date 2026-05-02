<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('component_discoveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->string('device_id')->nullable();
            $table->json('apis');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('component_discoveries');
    }
};
