<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

it('supports spreadsheet upload, update, download, and deletion', function () {
    Storage::fake('local');

    $admin = apiUser('admin');
    Sanctum::actingAs($admin);

    $upload = $this->postJson('/api/v1/spreadsheets', [
        'name' => 'Q2 Pipeline Sheet',
        'description' => 'Sales planning sheet',
        'file' => UploadedFile::fake()->create('pipeline.xlsx', 120),
    ]);

    $upload->assertCreated()->assertJsonPath('success', true);
    $sheetId = $upload->json('data.id');

    $this->patchJson('/api/v1/spreadsheets/'.$sheetId, [
        'name' => 'Q2 Pipeline Sheet Updated',
        'sheet_data' => [
            'version' => 1,
            'rows' => [['A1', 'A2']],
        ],
    ])->assertOk();

    $this->get('/api/v1/spreadsheets/'.$sheetId.'/download')
        ->assertOk();

    $this->deleteJson('/api/v1/spreadsheets/'.$sheetId)
        ->assertOk()
        ->assertJsonPath('success', true);
});
