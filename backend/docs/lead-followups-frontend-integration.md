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

## Attachment Notes
- Upload on create/update using multipart form data
- Download via authenticated endpoint
- Rejected pending updates clean up temporary uploaded files

## Backward Compatibility
- Existing lead activity APIs remain unchanged
- New follow-up APIs are additive and isolated
- Existing notification endpoint contract is unchanged
