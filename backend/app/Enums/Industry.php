<?php

namespace App\Enums;

use Illuminate\Support\Str;

enum Industry: string
{
    case TECHNOLOGY_SOFTWARE = 'Technology / Software';
    case FINANCIAL_SERVICES = 'Financial Services';
    case HEALTHCARE = 'Healthcare';
    case EDUCATION = 'Education';
    case REAL_ESTATE = 'Real Estate';
    case MANUFACTURING = 'Manufacturing';
    case RETAIL_ECOMMERCE = 'Retail / E-commerce';
    case PROFESSIONAL_SERVICES = 'Professional Services';
    case MARKETING_ADVERTISING = 'Marketing & Advertising';
    case MEDIA_ENTERTAINMENT = 'Media & Entertainment';
    case HOSPITALITY_TOURISM = 'Hospitality & Tourism';
    case LOGISTICS_TRANSPORTATION = 'Logistics & Transportation';
    case CONSTRUCTION_ENGINEERING = 'Construction & Engineering';
    case ENERGY_UTILITIES = 'Energy & Utilities';
    case AGRICULTURE = 'Agriculture';
    case TELECOMMUNICATIONS = 'Telecommunications';
    case AUTOMOTIVE = 'Automotive';
    case FASHION_APPAREL = 'Fashion & Apparel';
    case FOOD_BEVERAGE = 'Food & Beverage';
    case PHARMACEUTICALS = 'Pharmaceuticals';
    case INSURANCE = 'Insurance';
    case GOVERNMENT_PUBLIC = 'Government / Public Sector';
    case NON_PROFIT = 'Non-Profit / NGO';
    case SPORTS_FITNESS = 'Sports & Fitness';
    case OTHER = 'Other';
    case NOT_SPECIFIED = 'Not Specified';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn(self $case): string => $case->value, self::cases());
    }

    public static function fromInput(?string $value): ?self
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return null;
        }

        $needle = self::key($raw);

        foreach (self::cases() as $case) {
            if (self::key($case->value) === $needle) {
                return $case;
            }
        }

        return null;
    }

    private static function key(string $value): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($value)) ?? $value;

        return Str::lower($normalized);
    }
}
