<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeadFollowup\ReviewLeadFollowupUpdateRequest;
use App\Http\Requests\LeadFollowup\StoreLeadFollowupRequest;
use App\Http\Requests\LeadFollowup\UpdateLeadFollowupRequest;
use App\Models\Lead;
use App\Models\LeadFollowup;
use App\Models\LeadFollowupAttachment;
use App\Services\Crm\LeadFollowupService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LeadFollowupController extends Controller
{
    public function __construct(private readonly LeadFollowupService $leadFollowupService) {}

    public function index(Lead $lead, Request $request): JsonResponse
    {
        $followups = $this->leadFollowupService->listForLead($lead, (int) $request->integer('per_page', 20));

        return $this->paginated($followups, $followups->items(), 'Lead follow-ups fetched.');
    }

    public function store(Lead $lead, StoreLeadFollowupRequest $request): JsonResponse
    {
        $followup = $this->leadFollowupService->create(
            $lead,
            $request->user(),
            $request->validated(),
            $request->file('attachments', [])
        );

        return $this->success($followup, 'Lead follow-up created.', 201);
    }

    public function update(LeadFollowup $followup, UpdateLeadFollowupRequest $request): JsonResponse
    {
        try {
            $result = $this->leadFollowupService->update(
                $followup,
                $request->user(),
                $request->validated(),
                $request->file('attachments_add', []),
                array_map('intval', $request->validated('attachment_ids_remove', []))
            );
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success([
            'mode' => $result['mode'],
            'followup' => $result['followup'],
            'update_request' => $result['update_request'],
        ], $result['mode'] === 'approval_required'
            ? 'Follow-up update request submitted for approval.'
            : 'Lead follow-up updated.');
    }

    public function approve(LeadFollowup $followup, ReviewLeadFollowupUpdateRequest $request): JsonResponse
    {
        try {
            $updated = $this->leadFollowupService->approve(
                $followup,
                $request->user(),
                $request->validated('reason')
            );
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success($updated, 'Follow-up modification approved.');
    }

    public function reject(LeadFollowup $followup, ReviewLeadFollowupUpdateRequest $request): JsonResponse
    {
        try {
            $updated = $this->leadFollowupService->reject(
                $followup,
                $request->user(),
                $request->validated('reason')
            );
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success($updated, 'Follow-up modification rejected.');
    }

    public function downloadAttachment(LeadFollowup $followup, LeadFollowupAttachment $attachment)
    {
        if ((int) $attachment->followup_id !== (int) $followup->id) {
            return $this->error('Attachment does not belong to this follow-up.', 422);
        }

        if (!Storage::disk($attachment->disk)->exists($attachment->file_path)) {
            return $this->error('Attachment file not found.', 404);
        }

        return response()->download(
            Storage::disk($attachment->disk)->path($attachment->file_path),
            $attachment->original_filename
        );
    }
}
