# Lead Follow-Up & Approval Workflow - Frontend Integration Guide

## Overview
This document defines how frontend clients should integrate with the lead follow-up backend workflow.

- Unlimited follow-ups per lead
- Dynamic/manual form schema support
- Approval workflow for protected edits
- Timeline-oriented retrieval
- Attachment upload and secure download
- In-app and device-notification metadata support

## Base Path
All endpoints below are under `/api/v1`.

## Authentication
- Bearer token (Sanctum)
- Roles: `admin`, `supervisor`, `staff`

## Endpoints

Primary (requested) paths:
- `POST /leads/{lead}/followups`
- `GET /leads/{lead}/followups`
- `PUT /followups/{followup}`
- `POST /followups/{followup}/approve`
- `POST /followups/{followup}/reject`

CRM-prefixed aliases are also available for backward compatibility:
- `POST /crm/leads/{lead}/followups`
- `GET /crm/leads/{lead}/followups`
- `PUT /crm/followups/{followup}`
- `POST /crm/followups/{followup}/approve`
- `POST /crm/followups/{followup}/reject`

### 1. Create Follow-Up
`POST /crm/leads/{lead}/followups`

Content type:
- `application/json` (without files)
- `multipart/form-data` (with attachments)

Request body fields:
- `title` string required
- `content` object required
- `form_schema` object optional
- `attachments[]` file optional (max 10 files, 10MB each)

Response:
- `201 Created`
- Returns created follow-up with creator, attachments, activities

### 2. Get Follow-Ups Timeline
`GET /crm/leads/{lead}/followups?per_page=20`

Response:
- Paginated list ordered latest first
- Includes:
  - follow-up data
  - creator
  - attachments
  - activities (audit trail)
  - update requests (approval history)

### 3. Update Follow-Up
`PUT /crm/followups/{followup}`

Content type:
- `application/json` or `multipart/form-data`

Request fields (all optional):
- `title` string
- `content` object
- `form_schema` object
- `attachments_add[]` file
- `attachment_ids_remove[]` integer

Response modes:
- `mode=updated` when approval not required (changes applied immediately)
- `mode=approval_required` when a pending request is created

### 4. Approve Pending Modification
`POST /crm/followups/{followup}/approve`

Body:
- `reason` string optional

Response:
- Updated follow-up after applying pending changes

### 5. Reject Pending Modification
`POST /crm/followups/{followup}/reject`

Body:
- `reason` string optional

Response:
- Follow-up unchanged, pending request marked rejected

### 6. Download Attachment
`GET /crm/followups/{followup}/attachments/{attachment}/download`

Response:
- Binary file download
- Auth required

## Dynamic Form Schema Format
Use this format in `form_schema`:

```json
{
  "fields": [
    {
      "label": "Title",
      "type": "text",
      "required": true
    },
    {
      "label": "Description",
      "type": "textarea",
      "required": true
    },
    {
      "label": "Communication Channel",
      "type": "select",
      "required": false,
      "options": ["Email", "Phone", "WhatsApp"]
    }
  ]
}
```

Supported field types:
- `text`
- `textarea`
- `radio`
- `checkbox`
- `select`
- `date`
- `number`

## Follow-Up Submission Format
Example create request:

```json
{
  "title": "Email Sent",
  "content": {
    "title": "Email Sent",
    "description": "Pricing proposal emailed to client.",
    "channel": "Email",
    "follow_up_date": "2026-06-05"
  },
  "form_schema": {
    "fields": [
      { "label": "Title", "type": "text", "required": true },
      { "label": "Description", "type": "textarea", "required": true },
      { "label": "Channel", "type": "select", "required": false, "options": ["Email", "Phone"] }
    ]
  }
}
```

## Approval Workflow Response Structures

### Direct update response
```json
{
  "success": true,
  "message": "Lead follow-up updated.",
  "data": {
    "mode": "updated",
    "followup": { "id": 12, "title": "Updated" },
    "update_request": null
  }
}
```

### Approval required response
```json
{
  "success": true,
  "message": "Follow-up update request submitted for approval.",
  "data": {
    "mode": "approval_required",
    "followup": { "id": 12, "title": "Original title" },
    "update_request": {
      "id": 88,
      "status": "pending",
      "requested_by": 5,
      "proposed_changes": {
        "title": "Requested new title"
      }
    }
  }
}
```

## Notification Payload Structures
In-app notifications are stored in the existing notifications channel.

Common metadata keys:
- `lead_id`
- `followup_id`
- `update_request_id`
- `note` (approve/reject reason)

Approval-request notifications include device hints:

```json
{
  "device_recommended": true,
  "critical": true,
  "lead_id": 44,
  "followup_id": 12,
  "update_request_id": 88
}
```

## Timeline Rendering Structure
Frontend timeline can render each follow-up item with:
- `title`
- `content`
- `created_at`
- `creator`
- `attachments` (use `download_url`)
- `activities` (audit events)
- `update_requests` (status history)

Recommended UI order:
1. Sort follow-ups by `created_at` descending
2. Within each follow-up, sort activities by `created_at` descending

## Approval Rules Summary

- Creator is staff:
  - Same staff edits: direct update
  - Different staff edits: approval required
  - Supervisor/admin edits: direct update

- Creator is supervisor:
  - Same supervisor edits: direct update
  - Staff or different supervisor edits: approval required
  - Admin edits: direct update

- Creator is admin:
  - Same admin edits: direct update
  - Any other user edits: approval required

## Error Handling

- `401` unauthenticated
- `403` forbidden by role middleware
- `404` lead/follow-up/attachment not found
- `422` validation/approval workflow errors

Typical `422` messages:
- invalid schema type
- duplicate pending request exists
- no pending approval request found
- actor not authorized to approve/reject

## Attachment Uploads — Multipart/Form-Data Guide

### Why `multipart/form-data` is required
Browsers cannot send binary files in a JSON body.  Any request that includes
one or more file attachments **must** use `Content-Type: multipart/form-data`.
When that content-type is active every non-file field arrives in PHP as a plain
string, so `content` and `form_schema` must be sent as **JSON-serialised
strings** — the backend automatically decodes them before validation runs.

### Correct request format

```javascript
const formData = new FormData();

// Required fields
formData.append("title", "Email Sent");

// Arrays MUST be JSON-stringified — do NOT pass a raw object
formData.append("content", JSON.stringify({
  title: "Email Sent",
  description: "Pricing proposal emailed to client.",
  channel: "Email",
  follow_up_date: "2026-06-05",
}));

// Optional — also JSON-stringified when present
formData.append("form_schema", JSON.stringify({
  fields: [
    { label: "Title",       type: "text",     required: true  },
    { label: "Description", type: "textarea", required: true  },
    { label: "Channel",     type: "select",   required: false,
      options: ["Email", "Phone", "WhatsApp"] },
  ],
}));

// Files — use the `attachments[]` key (note the brackets)
attachments.forEach(file => {
  formData.append("attachments[]", file);
});

// Fetch / Axios — do NOT set Content-Type manually; let the browser set the
// multipart boundary.
await fetch(`/api/v1/crm/leads/${leadId}/followups`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

> **Never** send `Content-Type: application/json` when including files.
> If you have no files, you may send a JSON body and omit the
> `JSON.stringify()` wrapping — the backend accepts both formats.

### Allowed file types and limits

| Constraint        | Value                                               |
|-------------------|-----------------------------------------------------|
| Max files         | 10 per request                                      |
| Max size per file | 10 MB                                               |
| Allowed MIME types | `jpeg`, `jpg`, `png`, `gif`, `webp`, `pdf`, `doc`, `docx`, `xls`, `xlsx`, `zip`, `txt`, `csv` |

Requests with disallowed MIME types, files exceeding 10 MB, or more than 10
files will receive a `422` validation error.

### Response — attachment objects

Each attachment in the response includes:

```json
{
  "id": 7,
  "followup_id": 12,
  "uploaded_by": 3,
  "original_filename": "proposal.pdf",
  "mime_type": "application/pdf",
  "file_size": 204800,
  "created_at": "2026-05-07T10:00:00.000000Z",
  "download_url": "/api/v1/crm/followups/12/attachments/7/download"
}
```

Use `download_url` to fetch the file through the authenticated download
endpoint — files are stored privately and are not publicly accessible.

### Update request — adding and removing attachments

```javascript
const formData = new FormData();

// Optionally update fields
formData.append("title", "Updated title");
formData.append("content", JSON.stringify({ /* ... */ }));

// Add new files
newFiles.forEach(file => formData.append("attachments_add[]", file));

// Remove existing attachments by ID
attachmentIdsToRemove.forEach(id =>
  formData.append("attachment_ids_remove[]", String(id))
);

await fetch(`/api/v1/crm/followups/${followupId}`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

### Storage and access control
Attachments are stored in private server storage and served exclusively through
the authenticated download endpoint.  No direct `/storage/...` URL is exposed.
To display a file in the browser use:

```javascript
// Authenticated blob download
const response = await fetch(attachment.download_url, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await response.blob();
const objectUrl = URL.createObjectURL(blob);
window.open(objectUrl);            // or assign to <a href> / <img src>
URL.revokeObjectURL(objectUrl);    // clean up after use
```

## Backward Compatibility
- Existing lead activity APIs remain unchanged
- New follow-up APIs are additive and isolated
- Existing notification endpoint contract is unchanged

## Backward Compatibility
- Existing lead activity APIs remain unchanged
- New follow-up APIs are additive and isolated
- Existing notification endpoint contract is unchanged
