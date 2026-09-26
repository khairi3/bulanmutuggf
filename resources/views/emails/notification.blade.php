<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $heading }}</title>
</head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:'Plus Jakarta Sans',Inter,Arial,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
            <td style="background:#0f5132;padding:20px 24px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8;">Bulan Mutu GGF</div>
                <div style="font-size:20px;font-weight:700;margin-top:4px;">{{ $heading }}</div>
            </td>
        </tr>
        <tr>
            <td style="padding:24px;font-size:16px;line-height:1.6;">
                <p style="margin:0 0 12px;">Halo {{ $recipientName }},</p>
                <p style="margin:0 0 20px;white-space:pre-line;">{{ $body }}</p>
                @if ($actionUrl)
                    <a href="{{ $actionUrl }}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">{{ $actionLabel }}</a>
                @endif
            </td>
        </tr>
        <tr>
            <td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b;">
                Email ini dikirim otomatis oleh Sistem Web BMG &middot; GGF Learning Center. Mohon tidak membalas email ini.
            </td>
        </tr>
    </table>
</body>
</html>
