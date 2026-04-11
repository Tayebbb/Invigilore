<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body>
    <p>Hello {{ $user->name }},</p>

    <p>Use this verification code to complete your signup:</p>

    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ $code }}</p>

    <p>This code will expire in 10 minutes.</p>

    <p>If you did not request this account, you can ignore this email.</p>

    <p>Invigilore Team</p>
</body>
</html>
