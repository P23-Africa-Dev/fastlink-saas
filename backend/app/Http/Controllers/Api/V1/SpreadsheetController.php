<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Spreadsheet\StoreSpreadsheetRequest;
use App\Http\Requests\Spreadsheet\UpdateSpreadsheetRequest;
use App\Models\Spreadsheet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SpreadsheetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $spreadsheets = Spreadsheet::query()
            ->with(['creator:id,name,email', 'editor:id,name,email'])
            ->orderByDesc('id')
            ->paginate((int) $request->integer('per_page', 15));

        return $this->paginated($spreadsheets, $spreadsheets->items(), 'Spreadsheets fetched.');
    }

    public function store(StoreSpreadsheetRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $storedPath = $file->store('spreadsheets', 'local');

        $spreadsheet = Spreadsheet::create([
            'name' => $request->string('name')->toString(),
            'description' => $request->string('description')->toString() ?: null,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => basename($storedPath),
            'mime_type' => $file->getClientMimeType(),
            'disk' => 'local',
            'file_path' => $storedPath,
            'file_size' => $file->getSize(),
            'extension' => strtolower($file->getClientOriginalExtension()),
            'created_by' => $request->user()->id,
            'last_edited_by' => $request->user()->id,
            'last_edited_at' => now(),
        ]);

        return $this->success($spreadsheet->load(['creator:id,name,email', 'editor:id,name,email']), 'Spreadsheet uploaded.', 201);
    }

    public function show(Spreadsheet $spreadsheet): JsonResponse
    {
        return $this->success(
            $spreadsheet->load(['creator:id,name,email', 'editor:id,name,email']),
            'Spreadsheet fetched.'
        );
    }

    public function download(Spreadsheet $spreadsheet)
    {
        if (!Storage::disk($spreadsheet->disk)->exists($spreadsheet->file_path)) {
            return $this->error('File not found in storage.', 404);
        }

        return response()->download(
            Storage::disk($spreadsheet->disk)->path($spreadsheet->file_path),
            $spreadsheet->original_filename
        );
    }

    public function update(UpdateSpreadsheetRequest $request, Spreadsheet $spreadsheet): JsonResponse
    {
        $payload = $request->validated();
        $payload['last_edited_by'] = $request->user()->id;
        $payload['last_edited_at'] = now();

        $spreadsheet->update($payload);

        return $this->success($spreadsheet->fresh()->load(['creator:id,name,email', 'editor:id,name,email']), 'Spreadsheet updated.');
    }

    public function destroy(Spreadsheet $spreadsheet): JsonResponse
    {
        if (Storage::disk($spreadsheet->disk)->exists($spreadsheet->file_path)) {
            Storage::disk($spreadsheet->disk)->delete($spreadsheet->file_path);
        }

        $spreadsheet->delete();

        return $this->success(null, 'Spreadsheet deleted.');
    }
}
