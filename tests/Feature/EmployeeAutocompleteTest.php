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
}
