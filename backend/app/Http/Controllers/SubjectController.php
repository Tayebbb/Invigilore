<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubjectStoreRequest;
use App\Http\Requests\SubjectUpdateRequest;
use App\Models\Subject;
use App\Services\AuditTrailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->query(), [
            'page' => 'sometimes|integer|min:1',
            'limit' => 'sometimes|integer|min:1|max:100',
            'search' => 'sometimes|string|max:150',
            'department' => 'sometimes|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 400);
        }

        $limit = (int) ($request->query('limit', 15));
        $search = trim((string) $request->query('search', ''));
        $department = trim((string) $request->query('department', ''));

        $query = Subject::query()->orderBy('id', 'desc');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('subject_code', 'like', '%' . strtoupper($search) . '%')
                    ->orWhere('subject_id', 'like', '%' . strtoupper($search) . '%');
            });
        }

        if ($department !== '') {
            $query->where('department', 'like', $department);
        }

        $subjects = $query->paginate($limit)->appends($request->query());

        return response()->json([
            'success' => true,
            'message' => 'Subjects retrieved successfully',
            'data' => array_map(fn (Subject $subject) => $this->transformSubject($subject), $subjects->items()),
            'meta' => [
                'current_page' => $subjects->currentPage(),
                'per_page' => $subjects->perPage(),
                'total' => $subjects->total(),
                'last_page' => $subjects->lastPage(),
            ],
        ]);
    }

    public function show(Subject $subject): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Subject retrieved successfully',
            'data' => $this->transformSubject($subject),
        ]);
    }

    public function store(SubjectStoreRequest $request, AuditTrailService $auditTrailService): JsonResponse
    {
        $data = $request->validated();

        if ($this->isDuplicateName($data['name'])) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['subjectName' => ['Subject name must be unique (case-insensitive).']],
            ], 400);
        }

        if ($this->isDuplicateCode($data['subject_code'])) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['subjectCode' => ['Subject code must be unique.']],
            ], 400);
        }

        $subject = Subject::create([
            'subject_id' => $this->generateSubjectId(),
            'name' => $data['name'],
            'subject_code' => $data['subject_code'],
            'department' => $data['department'],
            'credit_hours' => (int) $data['credit_hours'],
            'description' => $data['description'] ?? null,
        ]);

        $auditTrailService->log(
            $request->user(),
            'subject.created',
            [
                'subject_id' => $subject->subject_id,
                'changes' => $subject->only(['name', 'subject_code', 'department', 'credit_hours', 'description']),
                'timestamp' => now()->toISOString(),
            ],
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Subject created successfully',
            'data' => $this->transformSubject($subject),
        ], 201);
    }

    public function update(SubjectUpdateRequest $request, Subject $subject, AuditTrailService $auditTrailService): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('name', $data) && $this->isDuplicateName($data['name'], $subject->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['subjectName' => ['Subject name must be unique (case-insensitive).']],
            ], 400);
        }

        if (array_key_exists('subject_code', $data) && $this->isDuplicateCode($data['subject_code'], $subject->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['subjectCode' => ['Subject code must be unique.']],
            ], 400);
        }

        $before = $subject->only(['name', 'subject_code', 'department', 'credit_hours', 'description']);

        if (array_key_exists('name', $data)) {
            $subject->name = $data['name'];
        }

        if (array_key_exists('subject_code', $data)) {
            $subject->subject_code = $data['subject_code'];
        }

        if (array_key_exists('department', $data)) {
            $subject->department = $data['department'];
        }

        if (array_key_exists('credit_hours', $data)) {
            $subject->credit_hours = (int) $data['credit_hours'];
        }

        if (array_key_exists('description', $data)) {
            $subject->description = $data['description'];
        }

        $subject->save();

        $after = $subject->only(['name', 'subject_code', 'department', 'credit_hours', 'description']);

        $auditTrailService->log(
            $request->user(),
            'subject.updated',
            [
                'subject_id' => $subject->subject_id,
                'before' => $before,
                'after' => $after,
                'timestamp' => now()->toISOString(),
            ],
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Subject updated successfully',
            'data' => $this->transformSubject($subject),
        ]);
    }

    public function destroy(Request $request, Subject $subject, AuditTrailService $auditTrailService): JsonResponse
    {
        $auditTrailService->log(
            $request->user(),
            'subject.deleted',
            [
                'subject_id' => $subject->subject_id,
                'changes' => $subject->only(['name', 'subject_code', 'department', 'credit_hours', 'description']),
                'timestamp' => now()->toISOString(),
            ],
            $request->ip()
        );

        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully',
        ]);
    }

    private function transformSubject(Subject $subject): array
    {
        return [
            'id' => $subject->id,
            'subjectId' => $subject->subject_id,
            'subjectName' => $subject->name,
            'subjectCode' => $subject->subject_code,
            'department' => $subject->department,
            'creditHours' => $subject->credit_hours,
            'description' => $subject->description,
            'createdAt' => $subject->created_at,
            'updatedAt' => $subject->updated_at,
        ];
    }

    private function isDuplicateName(string $name, ?int $ignoreId = null): bool
    {
        $query = Subject::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    private function isDuplicateCode(string $subjectCode, ?int $ignoreId = null): bool
    {
        $query = Subject::query()->whereRaw('UPPER(subject_code) = ?', [strtoupper($subjectCode)]);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    private function generateSubjectId(): string
    {
        do {
            $candidate = 'SUBJ-' . strtoupper(bin2hex(random_bytes(3)));
        } while (Subject::query()->where('subject_id', $candidate)->exists());

        return $candidate;
    }
}
