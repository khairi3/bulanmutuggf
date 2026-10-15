<?php

namespace Tests\Feature;

use App\Models\Employee;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeAutocompleteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_autocomplete_rejects_query_less_than_three_characters(): void
    {
        $response = $this->getJson('/api/employees/search?q=bu');

        $response->assertStatus(200);
        $this->assertEmpty($response->json());
    }

    public function test_autocomplete_finds_active_employees_by_name_or_index(): void
    {
        // Query 'Budi' should match Budi Pratama (EMP1001)
        $response = $this->getJson('/api/employees/search?q=Budi');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertNotEmpty($data);
        $this->assertEquals('EMP1001', $data[0]['employee_index']);
        $this->assertEquals('Budi Pratama', $data[0]['full_name']);
    }

    public function test_autocomplete_excludes_inactive_or_resigned_employees(): void
    {
        $budi = Employee::where('employee_index', 'EMP1001')->first();
        $budi->update(['is_active' => false]); // deactive (EMP-04)

        $response = $this->getJson('/api/employees/search?q=Budi');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEmpty($data);
    }

    public function test_authenticated_user_can_quick_create_manual_employee_with_auto_generated_nik(): void
    {
        $user = \App\Models\User::first();

        $response = $this->actingAs($user)->postJson('/api/employees/quick-create', [
            'full_name' => 'Wahyudi Vendor',
            'unit' => 'Vendor Mitra PT ABC',
            'position' => 'Technical Support',
        ]);

        $response->assertStatus(201);
        $data = $response->json();
        $this->assertTrue($data['success']);
        $this->assertStringStartsWith('EXT-', $data['employee']['employee_index']);
        $this->assertEquals('Wahyudi Vendor', $data['employee']['full_name']);
        $this->assertEquals('Vendor Mitra PT ABC', $data['employee']['unit']);
        $this->assertTrue($data['employee']['is_manual']);

        $this->assertDatabaseHas('employees', [
            'full_name' => 'Wahyudi Vendor',
            'is_manual' => true,
        ]);
    }

    public function test_quick_create_manual_employee_validation_fails_when_name_or_unit_is_empty(): void
    {
        $user = \App\Models\User::first();

        $response = $this->actingAs($user)->postJson('/api/employees/quick-create', [
            'full_name' => '',
            'unit' => '',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['full_name', 'unit']);
    }
}
