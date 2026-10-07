<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    /**
     * Update visual branding wallpaper & header background images (presets or upload).
     */
    public function updateLoginBackground(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! $user->hasRole('admin')) {
            abort(403, 'Hanya Admin yang dapat mengubah visual background.');
        }

        $request->validate([
            'target' => ['nullable', 'in:login,header,both'],
            'background_type' => ['required', 'in:preset,upload,url'],
            'preset' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
            'custom_url' => ['nullable', 'string', 'max:1000'],
        ], [
            'image.image' => 'File harus berupa gambar.',
            'image.mimes' => 'Format gambar harus JPEG, PNG, JPG, atau WebP.',
            'image.max' => 'Ukuran gambar maksimal 5MB.',
        ]);

        $target = $request->input('target', 'login');
        $defaultFallback = $target === 'header' ? '/images/login-bg-plantation.jpg' : '/images/login-bg-default.jpg';
        $backgroundPath = Setting::get($target === 'header' ? 'app_header_background_image' : 'login_background_image', $defaultFallback);

        if ($request->input('background_type') === 'upload' && $request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = 'bg_'.time().'_'.bin2hex(random_bytes(4)).'.'.$file->getClientOriginalExtension();
            $file->move(public_path('images/uploads'), $fileName);
            $backgroundPath = '/images/uploads/'.$fileName;
        } elseif ($request->input('background_type') === 'preset' && $request->filled('preset')) {
            $backgroundPath = $request->input('preset');
        } elseif ($request->input('background_type') === 'url' && $request->filled('custom_url')) {
            $backgroundPath = $request->input('custom_url');
        }

        $afterLogs = [];

        if (in_array($target, ['login', 'both'], true)) {
            Setting::set('login_background_image', $backgroundPath);
            $afterLogs['login_background_image'] = $backgroundPath;
        }

        if (in_array($target, ['header', 'both'], true)) {
            Setting::set('app_header_background_image', $backgroundPath);
            $afterLogs['app_header_background_image'] = $backgroundPath;
        }

        $targetLabel = match ($target) {
            'header' => 'Banner Header Dashboard',
            'both' => 'Wallpaper Login dan Banner Header',
            default => 'Halaman Login',
        };

        AuditLog::log(
            action: 'UPDATE_VISUAL_BRANDING',
            entityType: 'Setting',
            entityId: 1,
            after: $afterLogs,
            reason: "Admin {$user->employee?->full_name} memperbarui foto visual {$targetLabel}."
        );

        return back()->with('success', "Foto visual {$targetLabel} berhasil diperbarui!");
    }
}
