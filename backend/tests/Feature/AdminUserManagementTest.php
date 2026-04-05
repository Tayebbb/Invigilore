<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_view_update_and_toggle_user_accounts(): void
    {
        $adminRole = Role::create(['name' => 'admin', 'description' => 'Administrator']);
        $teacherRole = Role::create(['name' => 'teacher', 'description' => 'Teacher']);
        $studentRole = Role::create(['name' => 'student', 'description' => 'Student']);

        $admin = User::factory()->create([
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/users', [
            'name' => 'Jane Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'Password123!',
            'role' => 'teacher',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'jane.doe@example.com')
            ->assertJsonPath('data.role', 'teacher')
            ->assertJsonPath('data.status', 'active');

        $createdUserId = $createResponse->json('data.id');

        $this->assertDatabaseHas('users', [
            'id' => $createdUserId,
            'email' => 'jane.doe@example.com',
            'role_id' => $teacherRole->id,
            'is_active' => 1,
        ]);

        $showResponse = $this->getJson('/api/admin/users/' . $createdUserId);

        $showResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $createdUserId)
            ->assertJsonPath('data.status', 'active');

        $updateResponse = $this->patchJson('/api/admin/users/' . $createdUserId, [
            'name' => 'Jane Updated',
            'email' => 'jane.updated@example.com',
            'role' => 'student',
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Jane Updated')
            ->assertJsonPath('data.email', 'jane.updated@example.com')
            ->assertJsonPath('data.role', 'student');

        $this->assertDatabaseHas('users', [
            'id' => $createdUserId,
            'email' => 'jane.updated@example.com',
            'role_id' => $studentRole->id,
        ]);

        $statusResponse = $this->patchJson('/api/admin/users/' . $createdUserId . '/status', [
            'is_active' => false,
        ]);

        $statusResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'inactive')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('users', [
            'id' => $createdUserId,
            'is_active' => 0,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'admin_user_created',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'admin_user_deactivated',
        ]);
    }

    public function test_non_admin_cannot_access_admin_user_endpoints(): void
    {
        $studentRole = Role::create(['name' => 'student', 'description' => 'Student']);
        $adminRole = Role::create(['name' => 'admin', 'description' => 'Administrator']);

        $student = User::factory()->create([
            'role_id' => $studentRole->id,
            'is_active' => true,
        ]);

        $adminTarget = User::factory()->create([
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($student);

        $this->postJson('/api/admin/users', [
            'name' => 'Blocked User',
            'email' => 'blocked@example.com',
            'password' => 'Password123!',
            'role' => 'teacher',
        ])->assertForbidden();

        $this->patchJson('/api/admin/users/' . $adminTarget->id . '/status', [
            'is_active' => false,
        ])->assertForbidden();
    }

    public function test_inactive_users_cannot_login(): void
    {
        $studentRole = Role::create(['name' => 'student', 'description' => 'Student']);

        $user = User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => bcrypt('Password123!'),
            'role_id' => $studentRole->id,
            'is_active' => false,
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertStatus(403)
            ->assertJsonPath('message', 'Account is inactive. Please contact an administrator.');
    }
}