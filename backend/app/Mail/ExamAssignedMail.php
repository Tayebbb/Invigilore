<?php

namespace App\Mail;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExamAssignedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public Exam $exam,
        public string $recipientEmail,
        public string $accessLink,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You Have Been Assigned an Exam: ' . $this->exam->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.exam-assigned',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
