<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\LeadFollowup;
use App\Models\LeadFollowupAttachment;
use App\Models\LeadFollowupUpdateRequest;
use App\Models\Notification;
use App\Models\User;
use App\Notifications\LeadFollowupApprovalRequestedNotification;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\Storage;

class LeadFollowupService
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function listForLead(Lead $lead, int $perPage = 20): LengthAwarePaginator
    {
        return LeadFollowup::query()
            ->where('lead_id', $lead->id)
            ->with([
                'creator:id,name,email',
                'attachments:id,followup_id,uploaded_by,original_filename,mime_type,file_size,created_at',
                'activities.actor:id,name,email',
                'updateRequests.requester:id,name,email',
                'updateRequests.approver:id,name,email',
            ])
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, UploadedFile>  $attachments
     */
    public function create(Lead $lead, User $actor, array $payload, array $attachments = []): LeadFollowup
    {
        return DB::transaction(function () use ($lead, $actor, $payload, $attachments) {
            /** @var LeadFollowup $followup */
            $followup = LeadFollowup::create([
                'lead_id' => $lead->id,
                'created_by' => $actor->id,
                'title' => $payload['title'],
                'content' => $payload['content'] ?? [],
                'form_schema' => $payload['form_schema'] ?? null,
            ]);

            $this->storeAttachmentFiles($followup, $actor, $attachments);

            $this->logActivity($followup, 'followup.created', $actor, [
                'lead_id' => $lead->id,
                'has_attachments' => !empty($attachments),
            ]);

            $lead->activities()->create([
                'user_id' => $actor->id,
                'type' => 'follow_up',
                'title' => 'Follow-up added',
                'description' => $followup->title,
                'is_completed' => true,
                'metadata' => ['followup_id' => $followup->id],
            ]);

            $this->notifyFollowupCreated($lead, $followup, $actor);

            return $followup->load([
                'creator:id,name,email',
                'attachments:id,followup_id,uploaded_by,original_filename,mime_type,file_size,created_at',
                'activities.actor:id,name,email',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, UploadedFile>  $attachmentsAdd
     * @param  array<int, int>  $attachmentIdsRemove
     * @return array{mode: string, followup: LeadFollowup, update_request: LeadFollowupUpdateRequest|null}
     */
    public function update(LeadFollowup $followup, User $actor, array $payload, array $attachmentsAdd = [], array $attachmentIdsRemove = []): array
    {
        $followup->loadMissing(['lead:id,first_name,last_name,created_by,assigned_to', 'creator:id,name,email']);

        $decision = $this->approvalDecision($followup->creator, $actor);

        if (!$decision['requires_approval']) {
            DB::transaction(function () use ($followup, $actor, $payload, $attachmentsAdd, $attachmentIdsRemove) {
                $this->applyDirectUpdate($followup, $actor, $payload, $attachmentsAdd, $attachmentIdsRemove);
            });

            return [
                'mode' => 'updated',
                'followup' => $followup->fresh()->load([
                    'creator:id,name,email',
                    'attachments:id,followup_id,uploaded_by,original_filename,mime_type,file_size,created_at',
                    'activities.actor:id,name,email',
                    'updateRequests.requester:id,name,email',
                    'updateRequests.approver:id,name,email',
                ]),
                'update_request' => null,
            ];
        }

        /** @var LeadFollowupUpdateRequest $updateRequest */
        $updateRequest = DB::transaction(function () use ($followup, $actor, $payload, $attachmentsAdd, $attachmentIdsRemove, $decision) {
            $existingPending = $followup->updateRequests()
                ->where('status', LeadFollowupUpdateRequest::STATUS_PENDING)
                ->exists();

            if ($existingPending) {
                throw new DomainException('A pending approval request already exists for this follow-up.');
            }

            $pendingAttachmentMeta = $this->storePendingAttachmentFiles($followup, $actor, $attachmentsAdd);

            $request = LeadFollowupUpdateRequest::create([
                'followup_id' => $followup->id,
                'requested_by' => $actor->id,
                'original_data' => [
                    'title' => $followup->title,
                    'content' => $followup->content,
                    'form_schema' => $followup->form_schema,
                ],
                'proposed_changes' => [
                    'title' => array_key_exists('title', $payload) ? $payload['title'] : null,
                    'content' => array_key_exists('content', $payload) ? $payload['content'] : null,
                    'form_schema' => array_key_exists('form_schema', $payload) ? $payload['form_schema'] : null,
                    'attachment_ids_remove' => array_values($attachmentIdsRemove),
                    'attachments_add_meta' => $pendingAttachmentMeta,
                    'eligible_approver_ids' => $decision['approver_ids'],
                ],
                'status' => LeadFollowupUpdateRequest::STATUS_PENDING,
            ]);

            $this->logActivity($followup, 'followup.update_requested', $actor, [
                'update_request_id' => $request->id,
                'eligible_approver_ids' => $decision['approver_ids'],
            ]);

            $this->notifyApprovalRequested($followup, $request, $actor, $decision['approver_ids']);

            return $request;
        });

        return [
            'mode' => 'approval_required',
            'followup' => $followup->fresh()->load([
                'creator:id,name,email',
                'attachments:id,followup_id,uploaded_by,original_filename,mime_type,file_size,created_at',
                'activities.actor:id,name,email',
                'updateRequests.requester:id,name,email',
                'updateRequests.approver:id,name,email',
            ]),
            'update_request' => $updateRequest,
        ];
    }

    public function approve(LeadFollowup $followup, User $actor, ?string $note = null): LeadFollowup
    {
        $followup->loadMissing(['creator:id,name,email', 'lead:id,first_name,last_name,created_by,assigned_to']);

        return DB::transaction(function () use ($followup, $actor, $note) {
            /** @var LeadFollowupUpdateRequest|null $pending */
            $pending = $followup->updateRequests()
                ->where('status', LeadFollowupUpdateRequest::STATUS_PENDING)
                ->latest('id')
                ->first();

            if (!$pending) {
                throw new DomainException('No pending approval request found for this follow-up.');
            }

            $eligibleIds = collect($pending->proposed_changes['eligible_approver_ids'] ?? [])->map(fn($id) => (int) $id);
            if (!$eligibleIds->contains((int) $actor->id)) {
                throw new DomainException('You are not authorized to approve this follow-up update request.');
            }

            $this->applyPendingChanges($followup, $pending, $actor);

            $pending->update([
                'status' => LeadFollowupUpdateRequest::STATUS_APPROVED,
                'approver_id' => $actor->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            $this->logActivity($followup, 'followup.update_approved', $actor, [
                'update_request_id' => $pending->id,
                'note' => $note,
            ]);

            $this->notifyApprovalOutcome($followup, $pending, $actor, true, $note);

            return $followup->fresh()->load([
                'creator:id,name,email',
                'attachments:id,followup_id,uploaded_by,original_filename,mime_type,file_size,created_at',
                'activities.actor:id,name,email',
                'updateRequests.requester:id,name,email',
                'updateRequests.approver:id,name,email',
            ]);
        });
    }

    public function reject(LeadFollowup $followup, User $actor, ?string $reason = null): LeadFollowup
    {
        $followup->loadMissing(['creator:id,name,email', 'lead:id,first_name,last_name,created_by,assigned_to']);

        return DB::transaction(function () use ($followup, $actor, $reason) {
            /** @var LeadFollowupUpdateRequest|null $pending */
            $pending = $followup->updateRequests()
                ->where('status', LeadFollowupUpdateRequest::STATUS_PENDING)
                ->latest('id')
                ->first();

            if (!$pending) {
                throw new DomainException('No pending approval request found for this follow-up.');
            }

            $eligibleIds = collect($pending->proposed_changes['eligible_approver_ids'] ?? [])->map(fn($id) => (int) $id);
            if (!$eligibleIds->contains((int) $actor->id)) {
                throw new DomainException('You are not authorized to reject this follow-up update request.');
            }

            $this->cleanupPendingAttachmentFiles($pending);

            $pending->update([
                'status' => LeadFollowupUpdateRequest::STATUS_REJECTED,
                'approver_id' => $actor->id,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $this->logActivity($followup, 'followup.update_rejected', $actor, [
                'update_request_id' => $pending->id,
                'reason' => $reason,
            ]);

            $this->notifyApprovalOutcome($followup, $pending, $actor, false, $reason);

            return $followup->fresh()->load([
                'creator:id,name,email',
                'attachments:id,followup_id,uploaded_by,original_filename,mime_type,file_size,created_at',
                'activities.actor:id,name,email',
                'updateRequests.requester:id,name,email',
                'updateRequests.approver:id,name,email',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, UploadedFile>  $attachmentsAdd
     * @param  array<int, int>  $attachmentIdsRemove
     */
    private function applyDirectUpdate(LeadFollowup $followup, User $actor, array $payload, array $attachmentsAdd, array $attachmentIdsRemove): void
    {
        $updates = [];
        foreach (['title', 'content', 'form_schema'] as $field) {
            if (array_key_exists($field, $payload)) {
                $updates[$field] = $payload[$field];
            }
        }

        if (!empty($updates)) {
            $followup->update($updates);
        }

        $this->removeAttachments($followup, $attachmentIdsRemove);
        $this->storeAttachmentFiles($followup, $actor, $attachmentsAdd);

        $this->logActivity($followup, 'followup.updated', $actor, [
            'updated_fields' => array_keys($updates),
            'attachments_added' => count($attachmentsAdd),
            'attachments_removed' => count($attachmentIdsRemove),
        ]);
    }

    private function applyPendingChanges(LeadFollowup $followup, LeadFollowupUpdateRequest $pending, User $actor): void
    {
        $changes = $pending->proposed_changes;
        $updates = [];

        foreach (['title', 'content', 'form_schema'] as $field) {
            if (array_key_exists($field, $changes) && $changes[$field] !== null) {
                $updates[$field] = $changes[$field];
            }
        }

        if (!empty($updates)) {
            $followup->update($updates);
        }

        $removeIds = collect($changes['attachment_ids_remove'] ?? [])->map(fn($id) => (int) $id)->all();
        $this->removeAttachments($followup, $removeIds);

        $attachmentsAddMeta = collect($changes['attachments_add_meta'] ?? []);
        $attachmentsAddMeta->each(function ($item) use ($followup, $actor) {
            LeadFollowupAttachment::create([
                'followup_id' => $followup->id,
                'uploaded_by' => $actor->id,
                'disk' => $item['disk'] ?? 'local',
                'file_path' => $item['file_path'] ?? '',
                'original_filename' => $item['original_filename'] ?? 'attachment',
                'mime_type' => $item['mime_type'] ?? null,
                'file_size' => $item['file_size'] ?? null,
            ]);
        });
    }

    /**
     * @param  array<int, UploadedFile>  $attachments
     */
    private function storeAttachmentFiles(LeadFollowup $followup, User $actor, array $attachments): void
    {
        foreach ($attachments as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $path = $file->store("crm/followups/{$followup->lead_id}/{$followup->id}", 'local');
            $originalFilename = $this->safeOriginalFilename($file);

            LeadFollowupAttachment::create([
                'followup_id' => $followup->id,
                'uploaded_by' => $actor->id,
                'disk' => 'local',
                'file_path' => $path,
                'original_filename' => $originalFilename,
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }
    }

    /**
     * @param  array<int, UploadedFile>  $attachments
     * @return array<int, array<string, mixed>>
     */
    private function storePendingAttachmentFiles(LeadFollowup $followup, User $actor, array $attachments): array
    {
        $items = [];

        foreach ($attachments as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $path = $file->store("crm/followups/pending/{$followup->id}/{$actor->id}", 'local');
            $originalFilename = $this->safeOriginalFilename($file);

            $items[] = [
                'disk' => 'local',
                'file_path' => $path,
                'original_filename' => $originalFilename,
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ];
        }

        return $items;
    }

    /**
     * @param  array<int, int>  $attachmentIdsRemove
     */
    private function removeAttachments(LeadFollowup $followup, array $attachmentIdsRemove): void
    {
        if (empty($attachmentIdsRemove)) {
            return;
        }

        $attachments = $followup->attachments()
            ->whereIn('id', collect($attachmentIdsRemove)->map(fn($id) => (int) $id)->all())
            ->get();

        foreach ($attachments as $attachment) {
            if (Storage::disk($attachment->disk)->exists($attachment->file_path)) {
                Storage::disk($attachment->disk)->delete($attachment->file_path);
            }
            $attachment->delete();
        }
    }

    private function cleanupPendingAttachmentFiles(LeadFollowupUpdateRequest $pending): void
    {
        $items = collect($pending->proposed_changes['attachments_add_meta'] ?? []);
        $items->each(function ($item) {
            $disk = $item['disk'] ?? 'local';
            $path = $item['file_path'] ?? null;
            if ($path && Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }
        });
    }

    private function safeOriginalFilename(UploadedFile $file): string
    {
        $original = trim((string) $file->getClientOriginalName());
        if ($original === '') {
            return 'attachment';
        }

        $name = pathinfo($original, PATHINFO_FILENAME);
        $extension = pathinfo($original, PATHINFO_EXTENSION);

        $safeName = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name) ?: 'attachment';
        $safeExtension = preg_replace('/[^A-Za-z0-9]/', '', $extension) ?: '';

        $combined = $safeExtension !== '' ? ($safeName . '.' . $safeExtension) : $safeName;

        return substr($combined, 0, 240);
    }

    /**
     * @return array{requires_approval: bool, approver_ids: array<int>}
     */
    private function approvalDecision(User $creator, User $modifier): array
    {
        if ((int) $creator->id === (int) $modifier->id) {
            return ['requires_approval' => false, 'approver_ids' => []];
        }

        $creatorTier = $this->roleTier($creator);
        $modifierTier = $this->roleTier($modifier);

        if ($creatorTier === 'staff') {
            if (in_array($modifierTier, ['admin', 'supervisor'], true)) {
                return ['requires_approval' => false, 'approver_ids' => []];
            }

            $approverIds = User::query()
                ->role(['admin', 'supervisor'])
                ->pluck('id')
                ->push($creator->id)
                ->unique()
                ->map(fn($id) => (int) $id)
                ->values()
                ->all();

            return ['requires_approval' => true, 'approver_ids' => $approverIds];
        }

        if ($creatorTier === 'supervisor') {
            if ($modifierTier === 'admin') {
                return ['requires_approval' => false, 'approver_ids' => []];
            }

            $approverIds = User::query()
                ->role('admin')
                ->pluck('id')
                ->push($creator->id)
                ->unique()
                ->map(fn($id) => (int) $id)
                ->values()
                ->all();

            return ['requires_approval' => true, 'approver_ids' => $approverIds];
        }

        // Creator is admin: any non-creator modification needs original admin approval.
        return ['requires_approval' => true, 'approver_ids' => [(int) $creator->id]];
    }

    private function roleTier(User $user): string
    {
        if ($user->hasRole('admin')) {
            return 'admin';
        }

        if ($user->hasRole('supervisor')) {
            return 'supervisor';
        }

        return 'staff';
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function logActivity(LeadFollowup $followup, string $action, User $actor, array $metadata = []): void
    {
        $followup->activities()->create([
            'action' => $action,
            'actor_id' => $actor->id,
            'metadata' => $metadata,
        ]);
    }

    private function notifyFollowupCreated(Lead $lead, LeadFollowup $followup, User $actor): void
    {
        $recipientIds = collect([$lead->created_by, $lead->assigned_to])
            ->merge($this->notificationService->roleUserIds('admin', 'supervisor'))
            ->filter(fn($id) => $id !== null && (int) $id !== (int) $actor->id)
            ->map(fn($id) => (int) $id)
            ->unique();

        $leadName = trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? ''));

        $this->notificationService->notifyUsers(
            $recipientIds,
            'crm.followup.created',
            'New lead follow-up added',
            "{$actor->name} added a follow-up on lead " . ($leadName !== '' ? $leadName : "#{$lead->id}"),
            [
                'lead_id' => $lead->id,
                'followup_id' => $followup->id,
            ],
            Notification::PRIORITY_MEDIUM,
            'crm.followup.created:' . $followup->id
        );
    }

    /**
     * @param  array<int>  $approverIds
     */
    private function notifyApprovalRequested(LeadFollowup $followup, LeadFollowupUpdateRequest $updateRequest, User $actor, array $approverIds): void
    {
        $followup->loadMissing(['lead:id,first_name,last_name', 'creator:id,name,email']);

        if ($followup->creator) {
            NotificationFacade::send($followup->creator, new LeadFollowupApprovalRequestedNotification($followup, $actor));
        }

        $leadName = trim(($followup->lead?->first_name ?? '') . ' ' . ($followup->lead?->last_name ?? ''));

        $this->notificationService->notifyUsers(
            collect($approverIds)->push($followup->created_by)->unique(),
            'crm.followup.approval_requested',
            'Follow-up update approval needed',
            "{$actor->name} requested approval to modify a follow-up on lead " . ($leadName !== '' ? $leadName : "#{$followup->lead_id}"),
            [
                'lead_id' => $followup->lead_id,
                'followup_id' => $followup->id,
                'update_request_id' => $updateRequest->id,
                'device_recommended' => true,
                'critical' => true,
            ],
            Notification::PRIORITY_HIGH,
            'crm.followup.approval_requested:' . $updateRequest->id
        );
    }

    private function notifyApprovalOutcome(LeadFollowup $followup, LeadFollowupUpdateRequest $request, User $actor, bool $approved, ?string $note): void
    {
        $followup->loadMissing(['lead:id,first_name,last_name']);

        $type = $approved ? 'crm.followup.approval_approved' : 'crm.followup.approval_rejected';
        $title = $approved ? 'Follow-up update approved' : 'Follow-up update rejected';

        $leadName = trim(($followup->lead?->first_name ?? '') . ' ' . ($followup->lead?->last_name ?? ''));

        $this->notificationService->notifyUsers(
            collect([$request->requested_by, $followup->created_by])->unique(),
            $type,
            $title,
            "{$actor->name} " . ($approved ? 'approved' : 'rejected') . " a follow-up modification on lead " . ($leadName !== '' ? $leadName : "#{$followup->lead_id}"),
            [
                'lead_id' => $followup->lead_id,
                'followup_id' => $followup->id,
                'update_request_id' => $request->id,
                'note' => $note,
            ],
            $approved ? Notification::PRIORITY_MEDIUM : Notification::PRIORITY_HIGH,
            ($approved ? 'crm.followup.approval_approved:' : 'crm.followup.approval_rejected:') . $request->id
        );
    }
}
