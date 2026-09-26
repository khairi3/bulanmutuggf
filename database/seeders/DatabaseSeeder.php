<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Employee;
use App\Models\Role;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Roles
        $rolesData = [
            ['code' => Role::ADMIN, 'name' => 'Admin / Panitia (L&D)'],
            ['code' => Role::PARTICIPANT, 'name' => 'Peserta (Ketua / Anggota Tim)'],
            ['code' => Role::VERIFIER, 'name' => 'Verifikator Lapangan'],
            ['code' => Role::JUDGE, 'name' => 'Juri Convention Day'],
            ['code' => Role::VIEWER, 'name' => 'Viewer Manajemen'],
        ];

        $roles = [];
        foreach ($rolesData as $roleItem) {
            $roles[$roleItem['code']] = Role::firstOrCreate(
                ['code' => $roleItem['code']],
                ['name' => $roleItem['name']]
            );
        }

        // 2. Admin User
        $adminEmployee = Employee::firstOrCreate(
            ['employee_index' => 'ADMIN001'],
            [
                'full_name' => 'Administrator L&D',
                'employee_level' => 'Manager',
                'position' => 'L&D Section Head',
                'unit' => 'GGF HO',
                'division' => 'Learning & Development',
                'email' => 'admin.bmg@ggf.co.id',
                'phone' => '08110000001',
                'is_active' => true,
            ]
        );

        $adminUser = User::firstOrCreate(
            ['employee_id' => $adminEmployee->id],
            [
                'password' => Hash::make('Admin123!'),
                'must_change_password' => false,
            ]
        );
        $adminUser->roles()->sync([$roles[Role::ADMIN]->id]);

        // 3. 20 Dummy Employees with realistic GGF structure
        $dummyEmployees = [
            // User Multi-Role: Peserta + Verifikator (Untuk test Role Switcher)
            [
                'index' => 'EMP1001',
                'name' => 'Budi Pratama',
                'level' => 'Senior Specialist',
                'position' => 'Mechanization Lead',
                'unit' => 'PG1',
                'division' => 'Plantation Engineering',
                'email' => 'budi.pratama@ggf.co.id',
                'phone' => '08120000001',
                'roles' => [Role::PARTICIPANT, Role::VERIFIER],
                'must_change' => true,
            ],
            // Verifier 1
            [
                'index' => 'EMP1002',
                'name' => 'Siti Rahmawati',
                'level' => 'Specialist',
                'position' => 'Agronomist Specialist',
                'unit' => 'PG2',
                'division' => 'R&D Plantation',
                'email' => 'siti.rahma@ggf.co.id',
                'phone' => '08120000002',
                'roles' => [Role::VERIFIER],
                'must_change' => false,
            ],
            // Verifier 2
            [
                'index' => 'EMP1003',
                'name' => 'Ahmad Fauzi',
                'level' => 'Senior Officer',
                'position' => 'HSE Superintendent',
                'unit' => 'PG3',
                'division' => 'Safety & Environment',
                'email' => 'ahmad.fauzi@ggf.co.id',
                'phone' => '08120000003',
                'roles' => [Role::VERIFIER],
                'must_change' => false,
            ],
            // Judge 1
            [
                'index' => 'EMP1004',
                'name' => 'Dr. Ir. Hendra Gunawan',
                'level' => 'General Manager',
                'position' => 'GM Operations',
                'unit' => 'GGF HO',
                'division' => 'Operation Directorate',
                'email' => 'hendra.gunawan@ggf.co.id',
                'phone' => '08120000004',
                'roles' => [Role::JUDGE],
                'must_change' => false,
            ],
            // Judge 2
            [
                'index' => 'EMP1005',
                'name' => 'Mariana Kusuma',
                'level' => 'Division Head',
                'position' => 'Head of Quality Assurance',
                'unit' => 'MFG',
                'division' => 'Quality Control & QA',
                'email' => 'mariana.k@ggf.co.id',
                'phone' => '08120000005',
                'roles' => [Role::JUDGE],
                'must_change' => false,
            ],
            // Viewer Manajemen
            [
                'index' => 'EMP1006',
                'name' => 'Bambang Soediro',
                'level' => 'Director',
                'position' => 'Managing Director',
                'unit' => 'GGF HO',
                'division' => 'Board of Directors',
                'email' => 'bambang.s@ggf.co.id',
                'phone' => '08120000006',
                'roles' => [Role::VIEWER],
                'must_change' => false,
            ],
            // Peserta & Anggota Tim (PG1 - PG4, FFP, PPP, FSTL, MFG, UMM)
            [
                'index' => 'EMP1007',
                'name' => 'Dedi Iskandar',
                'level' => 'Foreman',
                'position' => 'Field Supervisor',
                'unit' => 'PG1',
                'division' => 'Estate Operations',
                'email' => 'dedi.i@ggf.co.id',
                'phone' => '08120000007',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1008',
                'name' => 'Rina Marlina',
                'level' => 'Staff',
                'position' => 'Lab Analyst',
                'unit' => 'PG2',
                'division' => 'QC Post Harvest',
                'email' => 'rina.m@ggf.co.id',
                'phone' => '08120000008',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1009',
                'name' => 'Agus Setiawan',
                'level' => 'Officer',
                'position' => 'Mechanic Heavy Equipment',
                'unit' => 'PG3',
                'division' => 'Workshop PG3',
                'email' => 'agus.s@ggf.co.id',
                'phone' => '08120000009',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1010',
                'name' => 'Eko Prasetyo',
                'level' => 'Senior Officer',
                'position' => 'Irrigation Engineer',
                'unit' => 'PG4',
                'division' => 'Water Management',
                'email' => 'eko.p@ggf.co.id',
                'phone' => '08120000010',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1011',
                'name' => 'Dewi Anggraini',
                'level' => 'Staff',
                'position' => 'Packhouse Lead',
                'unit' => 'FFP',
                'division' => 'Fresh Fruit Produce',
                'email' => 'dewi.a@ggf.co.id',
                'phone' => '08120000011',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1012',
                'name' => 'Fajar Nugraha',
                'level' => 'Foreman',
                'position' => 'Nursery Supervisor',
                'unit' => 'PPP',
                'division' => 'Protein & Plant Product',
                'email' => 'fajar.n@ggf.co.id',
                'phone' => '08120000012',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1013',
                'name' => 'Gita Permata',
                'level' => 'Staff',
                'position' => 'Fleet Logistics Controller',
                'unit' => 'FSTL',
                'division' => 'Transport & Logistic',
                'email' => 'gita.p@ggf.co.id',
                'phone' => '08120000013',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1014',
                'name' => 'Hasan Basri',
                'level' => 'Technician',
                'position' => 'Boiler Operator',
                'unit' => 'MFG',
                'division' => 'Canning Plant',
                'email' => 'hasan.b@ggf.co.id',
                'phone' => '08120000014',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            // Karyawan operasional TANPA EMAIL (Uji Reset Password via Admin AUTH-03)
            [
                'index' => 'EMP1015',
                'name' => 'Joko Supriyanto',
                'level' => 'Operator',
                'position' => 'Tractor Operator',
                'unit' => 'PG1',
                'division' => 'Land Preparation',
                'email' => null,
                'phone' => '08120000015',
                'roles' => [Role::PARTICIPANT],
                'must_change' => true,
            ],
            [
                'index' => 'EMP1016',
                'name' => 'Kartika Sari',
                'level' => 'Staff',
                'position' => 'Procurement Officer',
                'unit' => 'UMM',
                'division' => 'General Affairs',
                'email' => 'kartika.s@ggf.co.id',
                'phone' => '08120000016',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1017',
                'name' => 'Lukman Hakim',
                'level' => 'Staff',
                'position' => 'Safety Officer',
                'unit' => 'PG2',
                'division' => 'HSE Unit',
                'email' => 'lukman.h@ggf.co.id',
                'phone' => '08120000017',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1018',
                'name' => 'Mega Utami',
                'level' => 'Officer',
                'position' => 'Continuous Improvement Specialist',
                'unit' => 'GGF HO',
                'division' => 'Operational Excellence',
                'email' => 'mega.u@ggf.co.id',
                'phone' => '08120000018',
                'roles' => [Role::PARTICIPANT, Role::VERIFIER],
                'must_change' => false,
            ],
            [
                'index' => 'EMP1019',
                'name' => 'Nanang Kosim',
                'level' => 'Operator',
                'position' => 'Electrical Maintenance',
                'unit' => 'MFG',
                'division' => 'Engineering Factory',
                'email' => null,
                'phone' => '08120000019',
                'roles' => [Role::PARTICIPANT],
                'must_change' => true,
            ],
            [
                'index' => 'EMP1020',
                'name' => 'Olivia Putri',
                'level' => 'Staff',
                'position' => 'Inventory Controller',
                'unit' => 'PG4',
                'division' => 'Warehouse PG4',
                'email' => 'olivia.p@ggf.co.id',
                'phone' => '08120000020',
                'roles' => [Role::PARTICIPANT],
                'must_change' => false,
            ],
        ];

        foreach ($dummyEmployees as $emp) {
            $employee = Employee::firstOrCreate(
                ['employee_index' => $emp['index']],
                [
                    'full_name' => $emp['name'],
                    'employee_level' => $emp['level'],
                    'position' => $emp['position'],
                    'unit' => $emp['unit'],
                    'division' => $emp['division'],
                    'email' => $emp['email'],
                    'phone' => $emp['phone'],
                    'is_active' => true,
                ]
            );

            $user = User::firstOrCreate(
                ['employee_id' => $employee->id],
                [
                    'password' => Hash::make('password123'),
                    'must_change_password' => $emp['must_change'],
                ]
            );

            $roleIds = array_map(fn ($r) => $roles[$r]->id, $emp['roles']);
            $user->roles()->sync($roleIds);
        }

        // 4. Seed Event Configurations (BMG 2026, Streams, Dimensions, Parameters, Phases)
        $this->call(EventConfigurationSeeder::class);

        // 5. Seed Default Assignments for Demo / Local dev (ADM-01)
        if (! app()->runningUnitTests()) {
            $cic = Stream::where('code', Stream::CODE_CIC)->first();
            $k3 = Stream::where('code', Stream::CODE_K3)->first();
            $energy = Stream::where('code', Stream::CODE_ENERGY)->first();

            // Siti Rahmawati (EMP1002) -> Verifier CIC
            $siti = Employee::where('employee_index', 'EMP1002')->first()?->user;
            if ($siti && $cic) {
                Assignment::firstOrCreate(['user_id' => $siti->id, 'stream_id' => $cic->id, 'stage' => 'verification']);
            }

            // Ahmad Fauzi (EMP1003) -> Verifier K3 & Energy
            $ahmad = Employee::where('employee_index', 'EMP1003')->first()?->user;
            if ($ahmad && $k3) {
                Assignment::firstOrCreate(['user_id' => $ahmad->id, 'stream_id' => $k3->id, 'stage' => 'verification']);
            }
            if ($ahmad && $energy) {
                Assignment::firstOrCreate(['user_id' => $ahmad->id, 'stream_id' => $energy->id, 'stage' => 'verification']);
            }

            // Hendra Gunawan (EMP1004) -> Judge CIC
            $hendra = Employee::where('employee_index', 'EMP1004')->first()?->user;
            if ($hendra && $cic) {
                Assignment::firstOrCreate(['user_id' => $hendra->id, 'stream_id' => $cic->id, 'stage' => 'judging']);
            }

            // Mariana Kusuma (EMP1005) -> Judge K3
            $mariana = Employee::where('employee_index', 'EMP1005')->first()?->user;
            if ($mariana && $k3) {
                Assignment::firstOrCreate(['user_id' => $mariana->id, 'stream_id' => $k3->id, 'stage' => 'judging']);
            }
        }
    }
}
