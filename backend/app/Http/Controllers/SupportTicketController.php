<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupportTicketRequest;
use App\Models\AuditLog;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (SupportTicket $ticket) => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'category' => $ticket->category,
                'message' => $ticket->message,
                'status' => $ticket->status,
                'created_at' => $ticket->created_at?->toISOString(),
                'resolved_at' => $ticket->resolved_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Support tickets fetched successfully',
            'data' => $tickets,
        ]);
    }

    public function store(StoreSupportTicketRequest $request): JsonResponse
    {
        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => trim((string) $request->input('subject')),
            'category' => $request->input('category'),
            'message' => trim((string) $request->input('message')),
            'status' => 'pending',
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'support.ticket_created',
            'description' => json_encode(['ticket_id' => $ticket->id, 'category' => $ticket->category], JSON_UNESCAPED_SLASHES),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support request submitted successfully',
            'data' => [
                'id' => $ticket->id,
                'status' => $ticket->status,
            ],
        ], 201);
    }
}
