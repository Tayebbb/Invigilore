<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('role');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role?->name,
            'profile_picture' => $this->profile_picture,
            'is_active' => (bool) ($this->is_active ?? true),
            'status' => (bool) ($this->is_active ?? true) ? 'active' : 'inactive',
            'restrict_login_to_one_device' => (bool) ($this->restrict_login_to_one_device ?? false),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}