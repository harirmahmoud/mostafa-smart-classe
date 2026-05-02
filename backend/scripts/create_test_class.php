<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$exists = \App\Models\SchoolClass::where('name', 'ESP32 Test Class')->first();
if ($exists) {
    echo $exists->id . PHP_EOL;
    exit(0);
}

$schoolClass = \App\Models\SchoolClass::create(['name' => 'ESP32 Test Class']);
echo $schoolClass->id . PHP_EOL;
