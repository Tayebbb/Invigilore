<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exam Assignment</title>
</head>
<body style="font-family: Arial, sans-serif; background: #0b1220; color: #e5e7eb; margin: 0; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 24px;">
        <h2 style="margin: 0 0 16px; color: #f9fafb;">You have been assigned a new exam</h2>

        <p style="margin: 0 0 12px; line-height: 1.6;">
            Your email <strong>{{ $recipientEmail }}</strong> was assigned to the exam:
            <strong>{{ $exam->title }}</strong>.
        </p>

        @if($exam->start_time)
            <p style="margin: 0 0 6px; color: #d1d5db;">Start: {{ \Illuminate\Support\Carbon::parse($exam->start_time)->toDayDateTimeString() }}</p>
        @endif

        @if($exam->end_time)
            <p style="margin: 0 0 6px; color: #d1d5db;">End: {{ \Illuminate\Support\Carbon::parse($exam->end_time)->toDayDateTimeString() }}</p>
        @endif

        <p style="margin: 0 0 20px; color: #d1d5db;">Duration: {{ (int) $exam->duration }} minutes</p>

        <a href="{{ $accessLink }}" style="display: inline-block; background: #10b981; color: #02120b; text-decoration: none; font-weight: bold; padding: 10px 16px; border-radius: 8px;">
            Open Exam Access Link
        </a>

        <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
            If you are not expecting this assignment, please contact your exam administrator.
        </p>
    </div>
</body>
</html>
