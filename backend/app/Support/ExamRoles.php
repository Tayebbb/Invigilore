<?php

namespace App\Support;

final class ExamRoles
{
    public const CONTROLLER = 'controller';
    public const QUESTION_SETTER = 'question_setter';
    public const MODERATOR = 'moderator';
    public const INVIGILATOR = 'invigilator';

    public static function all(): array
    {
        return [
            self::CONTROLLER,
            self::QUESTION_SETTER,
            self::MODERATOR,
            self::INVIGILATOR,
        ];
    }

    public static function toExamColumn(string $role): ?string
    {
        return match ($role) {
            self::CONTROLLER => 'controller_id',
            self::QUESTION_SETTER => 'question_setter_id',
            self::MODERATOR => 'moderator_id',
            self::INVIGILATOR => 'invigilator_id',
            default => null,
        };
    }
}
