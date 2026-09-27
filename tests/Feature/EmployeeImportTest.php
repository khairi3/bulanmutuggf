<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

class EmployeeImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_admin_can_preview_employee_import_csv(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $csvContent = implode("\n", [
            'employee_index,full_name,employee_level,position,unit,division,email,phone',
            'EMP9001,Karyawan Baru Satu,Staff,Operator PG1,PG1,Plantation,baru1@ggf.co.id,0812345678',
            'EMP9002,Karyawan Baru Dua,Officer,Agronomist,PG2,R&D,baru2@ggf.co.id,0812345679',
            'EMP9001,Karyawan Duplikat,Staff,Mechanic,PG1,Plantation,dup@ggf.co.id,0812345670', // duplicate
            ',Karyawan Tanpa Index,Staff,Mechanic,PG1,Plantation,,', // empty index
        ]);

        $file = UploadedFile::fake()->createWithContent('employees.csv', $csvContent);

        $response = $this->actingAs($admin)->post('/admin/employees/preview-import', [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['success']);
        $this->assertNotEmpty($data['token']);
        $this->assertEquals(2, $data['valid_count']);
        $this->assertEquals(2, $data['error_count']);
    }

    public function test_admin_can_commit_employee_import(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $csvContent = implode("\n", [
            'employee_index,full_name,employee_level,position,unit,division,email,phone',
            'EMP9101,Tester Import Satu,Staff,Operator,PG1,Plantation,tester1@ggf.co.id,0811111111',
            'EMP9102,Tester Import Dua,Officer,Leader,PG2,Production,tester2@ggf.co.id,0811111112',
        ]);

        $file = UploadedFile::fake()->createWithContent('employees_commit.csv', $csvContent);

        $previewResponse = $this->actingAs($admin)->post('/admin/employees/preview-import', [
            'file' => $file,
        ]);

        $token = $previewResponse->json('token');

        $commitResponse = $this->actingAs($admin)->post('/admin/employees/commit-import', [
            'token' => $token,
        ]);

        $commitResponse->assertStatus(200);
        $this->assertTrue($commitResponse->json('success'));
        $this->assertEquals(2, $commitResponse->json('imported_count'));

        // Assert records in database
        $this->assertDatabaseHas('employees', [
            'employee_index' => 'EMP9101',
            'full_name' => 'Tester Import Satu',
        ]);

        // Assert user account was auto-created
        $emp = Employee::where('employee_index', 'EMP9101')->first();
        $this->assertNotNull($emp->user);
        $this->assertTrue($emp->user->must_change_password);
        $this->assertTrue($emp->user->hasRole('participant'));

        // Assert audit log was recorded
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'IMPORT_EMPLOYEES',
        ]);
    }

    public function test_admin_can_download_employee_import_template_xlsx(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $response = $this->actingAs($admin)->get('/admin/employees/template?format=xlsx');

        $response->assertStatus(200);
        $response->assertHeader('content-disposition', 'attachment; filename=template_import_karyawan.xlsx');
    }

    public function test_admin_can_download_employee_import_template_csv(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $response = $this->actingAs($admin)->get('/admin/employees/template?format=csv');

        $response->assertStatus(200);
        $response->assertHeader('content-disposition', 'attachment; filename="template_import_karyawan.csv"');
        $this->assertStringContainsString('employee_index', $response->streamedContent());
        $this->assertStringContainsString('Budi Santoso', $response->streamedContent());
    }

    public function test_admin_can_preview_employee_import_xlsx(): void
    {
        $admin = Employee::where('employee_index', 'ADMIN001')->first()->user;

        $tempPath = tempnam(sys_get_temp_dir(), 'test_import_').'.xlsx';
        $writer = new Writer;
        $writer->openToFile($tempPath);

        $writer->addRow(Row::fromValues([
            'employee_index', 'full_name', 'employee_level', 'position', 'unit', 'division', 'email', 'phone',
        ]));
        $writer->addRow(Row::fromValues([
            'EMP9201', 'Tester Excel Satu', 'Staff', 'Operator PG1', 'PG1', 'Plantation', 'tester9201@ggf.co.id', '0812345678',
        ]));
        $writer->addRow(Row::fromValues([
            'EMP9202', 'Tester Excel Dua', 'Officer', 'Agronomist', 'PG2', 'R&D', 'tester9202@ggf.co.id', '0812345679',
        ]));
        $writer->close();

        $file = new UploadedFile($tempPath, 'employees.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $response = $this->actingAs($admin)->post('/admin/employees/preview-import', [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['success']);
        $this->assertEquals(2, $data['valid_count']);
        $this->assertEquals(0, $data['error_count']);

        @unlink($tempPath);
    }
}
