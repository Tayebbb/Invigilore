<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Created</title>
</head>
<body>
    <p>Hello {{ $user->name }},</p>

    <p>Your account has been created successfully on Invigilore.</p>

    <p>You can now sign in with your email address: {{ $user->email }}</p>

    <p>Thank you,<br>Invigilore Team</p>
</body>
</html>
