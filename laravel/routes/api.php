<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

Route::get('/setup-admin', function () {
    if (User::where('username', 'admin')->exists()) {
        return response()->json(['message' => 'Admin already exists!']);
    }

    $admin = User::create([
        'id' => Str::uuid()->toString(),
        'username' => 'admin',
        'full_name' => 'System Administrator',
        'email' => 'admin@denr.gov.ph',
        'password' => Hash::make('admin123'),
        'role' => 'level1',
        'division_id' => null
    ]);

    return response()->json(['message' => 'Admin created!', 'user' => $admin]);
});
