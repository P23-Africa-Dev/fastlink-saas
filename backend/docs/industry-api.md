# Industry Classification API Guide

## Overview

The CRM lead module now uses a centralized, controlled industry list.

- Industry field remains optional.
- Manual lead creation/update accepts only canonical values.
- Import supports flexible input (case-insensitive, trimmed) and safely defaults unknown values.
- Canonical values are exposed via a dedicated endpoint.

## Canonical Industry Endpoint

### Request

GET /api/v1/industries

### Response (success envelope)

{
  "success": true,
  "data": [
    "Technology / Software",
    "Financial Services",
    "Healthcare",
    "Education",
    "Real Estate",
    "Manufacturing",
    "Retail / E-commerce",
    "Professional Services",
    "Marketing & Advertising",
    "Media & Entertainment",
    "Hospitality & Tourism",
    "Logistics & Transportation",
    "Construction & Engineering",
    "Energy & Utilities",
    "Agriculture",
    "Telecommunications",
    "Automotive",
    "Fashion & Apparel",
    "Food & Beverage",
    "Pharmaceuticals",
    "Insurance",
    "Government / Public Sector",
    "Non-Profit / NGO",
    "Sports & Fitness",
    "Other",
    "Not Specified"
  ],
  "message": "Industries fetched."
}

## Lead Form Integration

### 1) Load options

- Call GET /api/v1/industries on page load.
- Bind response data to an optional dropdown.

### 2) Submit lead (optional industry)

Valid example:

{
  "first_name": "John",
  "email": "john@example.com",
  "industry": "Technology / Software"
}

Empty industry example:

{
  "first_name": "Jane",
  "email": "jane@example.com"
}

Invalid manual value example (rejected 422):

{
  "first_name": "Bad",
  "email": "bad@example.com",
  "industry": "Space Mining"
}

## Import Integration

### CSV format

name,email,industry
John Doe,john@example.com,Technology / Software
Jane Doe,jane@example.com, technology / software 
Bob Doe,bob@example.com,Unknown Vertical

### Import behavior

- Matching is case-insensitive and trimmed.
- Recognized values are normalized to canonical labels.
- Unknown non-empty values are stored as Not Specified.
- Empty industry stays null.
- Invalid industry never fails the whole import.

## Notes

- Source of truth is backend enum App\Enums\Industry.
- Keep UI options synced from GET /api/v1/industries; do not hardcode list in frontend.
