<?php

namespace Tests\Unit;

use App\Models\CategoryOption;
use App\Models\Stream;
use App\Services\RegistrationCodeService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationCodeServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_determines_correct_prefix_for_cic_stream(): void
    {
        $cic = Stream::where('code', Stream::CODE_CIC)->first();
        $service = new RegistrationCodeService;

        // Option Beginner (B), Mechanization (MECH), Estate PG1 (PG1)
        $bOpt = CategoryOption::where('abbreviation', 'B')->first();
        $mechOpt = CategoryOption::where('abbreviation', 'MECH')->first();
        $pg1Opt = CategoryOption::where('abbreviation', 'PG1')->first();

        $prefix = $service->determinePrefix($cic, [$mechOpt->id, $bOpt->id, $pg1Opt->id]);

        // Code order: 1 (Level=B) + 2 (Improvement=MECH) + 3 (Area=PG1) -> BMECHPG1
        $this->assertEquals('BMECHPG1', $prefix);
    }

    public function test_determines_correct_prefix_for_k3_and_energy_and_tpm_streams(): void
    {
        $k3 = Stream::where('code', Stream::CODE_K3)->first();
        $energy = Stream::where('code', Stream::CODE_ENERGY)->first();
        $tpm = Stream::where('code', Stream::CODE_TPM)->first();
        $service = new RegistrationCodeService;

        $this->assertEquals('SIGAP', $service->determinePrefix($k3, []));
        $this->assertEquals('ENRG', $service->determinePrefix($energy, []));
        $this->assertEquals('TPM', $service->determinePrefix($tpm, []));
    }

    public function test_generates_fifty_consecutive_unique_registration_codes_without_duplicate(): void
    {
        $cic = Stream::where('code', Stream::CODE_CIC)->first();
        $service = new RegistrationCodeService;

        $bOpt = CategoryOption::where('abbreviation', 'B')->first();
        $mechOpt = CategoryOption::where('abbreviation', 'MECH')->first();
        $pg1Opt = CategoryOption::where('abbreviation', 'PG1')->first();
        $options = [$bOpt->id, $mechOpt->id, $pg1Opt->id];

        $generatedCodes = [];

        // Generate 50 codes sequentially/concurrently on same prefix
        for ($i = 1; $i <= 50; $i++) {
            $code = $service->generateCode($cic, $options);
            $generatedCodes[] = $code;

            $expectedCode = sprintf('BMECHPG1-%03d', $i);
            $this->assertEquals($expectedCode, $code);
        }

        // Verify all 50 codes are strictly unique (0 duplicates)
        $this->assertCount(50, array_unique($generatedCodes));
    }
}
