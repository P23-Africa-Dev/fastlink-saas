<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Throwable;

class LeadImportService
{
    private const MAX_PHONE_LENGTH = 30;

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
                $errors[] = 'Row ' . ($index + 2) . ': missing one of first_name/company/email.';
                continue;
            }

            try {
                Lead::create($payload);
                $imported++;
            } catch (Throwable $exception) {
                $skipped++;
                $errors[] = 'Row ' . ($index + 2) . ': ' . $this->friendlyImportError($exception->getMessage());
            }
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

        $headers = array_map(fn($header) => $this->normalizeHeader((string) $header), $headers);
        $rows = [];

        while (($row = fgetcsv($handle)) !== false) {
            $mapped = $this->mapRowToHeaders($headers, $row);
            if ($this->isEmptyRow($mapped)) {
                continue;
            }

            $rows[] = $mapped;
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

        $headers = array_map(fn($header) => $this->normalizeHeader((string) $header), Arr::first($rawRows));
        $rows = [];

        foreach (array_slice($rawRows, 1) as $row) {
            $cells = array_map(fn($value) => trim((string) $value), $row);
            $mapped = array_combine($headers, $cells) ?: [];

            if ($this->isEmptyRow($mapped)) {
                continue;
            }

            $rows[] = $mapped;
        }

        return $rows;
    }

    private function normalizeHeader(string $value): string
    {
        $normalized = preg_replace('/^\xEF\xBB\xBF/u', '', $value) ?? $value;

        return Str::snake(trim(strtolower($normalized)));
    }

    private function buildPayload(array $row, array $defaults, User $actor): ?array
    {
        $name = trim((string) ($row['name'] ?? ''));
        $firstName = trim((string) ($row['first_name'] ?? ''));
        $lastName = trim((string) ($row['last_name'] ?? ''));
        if ($firstName === '' && $name !== '') {
            $parts = preg_split('/\s+/', $name, 2) ?: [];
            $firstName = trim((string) ($parts[0] ?? ''));
            if ($lastName === '') {
                $lastName = trim((string) ($parts[1] ?? ''));
            }
        }

        $company = trim((string) ($row['company'] ?? ''));
        $email = trim((string) ($row['email'] ?? ''));

        if ($firstName === '' && $company === '' && $email === '') {
            return null;
        }

        $priority = $this->normalizePriority((string) ($row['priority'] ?? ($defaults['priority'] ?? 'medium')));
        $status = trim(strtolower((string) ($row['status'] ?? ($defaults['status'] ?? 'new'))));
        $status = $status !== '' ? $status : 'new';

        $source = trim((string) ($row['source'] ?? ''));
        if ($source === '') {
            $source = 'import';
        }

        $assignedTo = $defaults['assigned_to'] ?? null;
        if ($assignedTo === null && is_numeric($row['assigned_to'] ?? null)) {
            $assignedTo = (int) $row['assigned_to'];
        }

        return [
            'first_name' => $this->limit($firstName !== '' ? $firstName : ($company !== '' ? $company : 'Imported Lead')),
            'last_name' => $this->limit($lastName),
            'email' => $this->limit($email),
            'phone' => $this->extractPhone($row['phone'] ?? null),
            'company' => $this->limit($company),
            'employee_count' => $this->toPositiveInt($row['employee_count'] ?? null),
            'year_founded' => $this->toPositiveInt($row['year_founded'] ?? null),
            'job_title' => $this->limit((string) ($row['job_title'] ?? '')),
            'industry' => $this->limit((string) ($row['industry'] ?? '')),
            'country' => $this->limit((string) ($row['country'] ?? '')),
            'city' => $this->limit((string) ($row['city'] ?? '')),
            'address' => $this->limit((string) ($row['address'] ?? '')),
            'website' => $this->limit((string) ($row['website'] ?? '')),
            'company_linkedin_profile' => $this->limit((string) ($row['company_linkedin_profile'] ?? '')),
            'ceo_linkedin_profile' => $this->limit((string) ($row['contact_linkedin_profile'] ?? $row['ceo_linkedin_profile'] ?? '')),
            'source' => $this->limit($source),
            'priority' => $priority,
            'status' => $this->limit($status),
            'estimated_value' => $this->toDecimal($row['estimated_value'] ?? null),
            'currency' => $this->normalizeCurrency((string) ($row['currency'] ?? ($defaults['currency'] ?? 'USD'))),
            'interested_services' => $this->toStringArray($row['interested_services'] ?? null),
            'requirements' => $this->toText($row['requirements'] ?? null),
            'lost_reason' => $this->limit((string) ($row['lost_reason'] ?? '')),
            'drive_id' => $defaults['drive_id'] ?? null,
            'status_id' => $defaults['status_id'] ?? null,
            'assigned_to' => $assignedTo,
            'created_by' => $actor->id,
            'notes' => $this->toText($row['notes'] ?? null),
        ];
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, mixed>  $row
     * @return array<string, string>
     */
    private function mapRowToHeaders(array $headers, array $row): array
    {
        $headerCount = count($headers);
        $rowValues = array_map(fn($value) => trim((string) $value), $row);

        if (count($rowValues) < $headerCount) {
            $rowValues = array_pad($rowValues, $headerCount, '');
        } elseif (count($rowValues) > $headerCount) {
            $rowValues = array_slice($rowValues, 0, $headerCount);
        }

        return array_combine($headers, $rowValues) ?: [];
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function normalizePriority(string $value): string
    {
        $priority = trim(strtolower($value));

        return match ($priority) {
            'normal' => 'medium',
            'urgent' => 'high',
            '' => 'medium',
            default => $priority,
        };
    }

    private function normalizeCurrency(string $value): string
    {
        $currency = strtoupper(trim($value));
        if ($currency === '') {
            return 'USD';
        }

        return substr($currency, 0, 3);
    }

    private function toPositiveInt(mixed $value): ?int
    {
        if ($value === null) {
            return null;
        }

        $normalized = preg_replace('/[^0-9]/', '', (string) $value);
        if ($normalized === null || $normalized === '') {
            return null;
        }

        $int = (int) $normalized;

        return $int > 0 ? $int : null;
    }

    private function toDecimal(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $normalized = str_replace(',', '', trim((string) $value));
        if ($normalized === '' || !is_numeric($normalized)) {
            return null;
        }

        return (float) $normalized;
    }

    private function extractPhone(mixed $value): ?string
    {
        $phone = trim((string) $value);
        if ($phone === '') {
            return null;
        }

        $first = preg_split('/[,;]/', $phone, 2)[0] ?? $phone;
        $first = trim($first);
        if ($first === '') {
            return null;
        }

        return substr($first, 0, self::MAX_PHONE_LENGTH);
    }

    private function limit(string $value, int $maxLength = 255): ?string
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        return substr($trimmed, 0, $maxLength);
    }

    private function toText(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text !== '' ? $text : null;
    }

    /**
     * @return array<int, string>|null
     */
    private function toStringArray(mixed $value): ?array
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return null;
        }

        $parts = array_values(array_filter(array_map(
            static fn(string $item): string => trim($item),
            preg_split('/[,;]+/', $raw) ?: []
        )));

        return $parts === [] ? null : $parts;
    }

    private function friendlyImportError(string $message): string
    {
        $normalized = trim(preg_replace('/\s+/', ' ', $message) ?? $message);
        if ($normalized === '') {
            return 'Unable to import this row due to invalid data.';
        }

        return substr($normalized, 0, 180);
    }
}
