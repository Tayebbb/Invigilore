<?php

namespace Tests\Feature;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_a_pending_user_record(): void
    {
        $this->artisan('db:seed');

        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Enid Student',
            'email' => 'enid.student@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('requires_verification', true)
            ->assertJsonPath('email', 'enid.student@example.com');

        $roleId = Role::where('name', 'student')->value('id');

        $this->assertNotNull($roleId);
        $this->assertDatabaseHas('pending_user_registrations', [
            'email' => 'enid.student@example.com',
            'name' => 'Enid Student',
            'role_id' => $roleId,
            'verified_at' => null,
            'consumed_at' => null,
        ]);
    }
}