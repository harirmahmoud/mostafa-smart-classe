<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('class_components', function (Blueprint $table) {
            // Drop on_api and off_api if they exist, add api column
            if (Schema::hasColumn('class_components', 'on_api')) {
                $table->dropColumn('on_api');
            }
            if (Schema::hasColumn('class_components', 'off_api')) {
                $table->dropColumn('off_api');
            }
            if (!Schema::hasColumn('class_components', 'api')) {
                $table->string('api')->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_components', function (Blueprint $table) {
            $table->dropColumn('api');
            $table->string('on_api');
            $table->string('off_api');
        });
    }
};
