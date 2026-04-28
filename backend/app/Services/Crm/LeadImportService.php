<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class LeadImportService
{
    public function import(UploadedFile $file, array $defaults, User $actor): array
    {
        $rows = $this->readRows($file);

        if (empty($rows)) {
            return [
                'imported' => 0,
                'skipped' => 0,
                'errors' => ['File does not contain data rows.'],
            ];
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            $payload = $this->buildPayload($row, $defaults, $actor);

            if (!$payload) {
                $skipped++;
                $errors[] = 'Row '.($index + 2).': missing one of first_name/company/email.';
                continue;
            }

            Lead::create($payload);
            $imported++;
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readRows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (in_array($extension, ['csv', 'txt'], true)) {
            return $this->readCsvRows($file);
        }

        if (in_array($extension, ['xlsx', 'xls'], true)) {
            return $this->readSpreadsheetRows($file);
        }

        return [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readCsvRows(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            return [];
        }

        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            return [];
        }

        $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header), $headers);
        $rows = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = array_combine($headers, array_map(fn ($value) => trim((string) $value), $row)) ?: [];
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readSpreadsheetRows(UploadedFile $file): array
    {
        $sheet = IOFactory::load($file->getRealPath())->getActiveSheet();
        $rawRows = $sheet->toArray();

        if (count($rawRows) < 2) {
            return [];
        }

        $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header), Arr::first($rawRows));
        $rows = [];

        foreach (array_slice($rawRows, 1) as $row) {
            $cells = array_map(fn ($value) => trim((string) $value), $row);
            $rows[] = array_combine($headers, $cells) ?: [];
        }

        return $rows;
    }

    private function normalizeHeader(string $value): string
    {
        return Str::snake(trim(strtolower($value)));
    }

    private function buildPayload(array $row, array $defaults, User $actor): ?array
    {
        $firstName = trim((string) ($row['first_name'] ?? $row['name'] ?? ''));
        $company = trim((string) ($row['company'] ?? ''));
        $email = trim((string) ($row['email'] ?? ''));

        if ($firstName === '' && $company === '' && $email === '') {
            return null;
        }

        return [
            'first_name' => $firstName !== '' ? $firstName : ($company !== '' ? $company : 'Imported Lead'),
            'last_name' => trim((string) ($row['last_name'] ?? '')) ?: null,
            'email' => $email !== '' ? $email : null,
            'phone' => trim((string) ($row['phone'] ?? '')) ?: null,
            'company' => $company !== '' ? $company : null,
            'job_title' => trim((string) ($row['job_title'] ?? '')) ?: null,
            'industry' => trim((string) ($row['industry'] ?? '')) ?: null,
            'country' => trim((string) ($row['country'] ?? '')) ?: null,
            'city' => trim((string) ($row['city'] ?? '')) ?: null,
            'address' => trim((string) ($row['address'] ?? '')) ?: null,
            'website' => trim((string) ($row['website'] ?? '')) ?: null,
            'source' => trim((string) ($row['source'] ?? 'import')),
            'priority' => trim((string) ($row['priority'] ?? ($defaults['priority'] ?? 'medium'))),
            'status' => trim((string) ($row['status'] ?? ($defaults['status'] ?? 'new'))),
            'estimated_value' => is_numeric($row['estimated_value'] ?? null) ? (float) $row['estimated_value'] : null,
            'currency' => strtoupper(trim((string) ($row['currency'] ?? ($defaults['currency'] ?? 'USD')))) ?: 'USD',
            'drive_id' => $defaults['drive_id'] ?? null,
            'status_id' => $defaults['status_id'] ?? null,
            'assigned_to' => $defaults['assigned_to'] ?? null,
            'created_by' => $actor->id,
            'notes' => trim((string) ($row['notes'] ?? '')) ?: null,
        ];
    }
}
