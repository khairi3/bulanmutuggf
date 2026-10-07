<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Sertifikat {{ $certificate->certificate_number }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #faf9f5;
            color: #1e293b;
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
        }

        .bg-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 1;
        }
        .bg-image img {
            width: 297mm;
            height: 210mm;
            display: block;
        }

        /* Common Category Badges */
        .badge-winner {
            display: inline-block;
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #f59e0b;
            font-size: 7.5pt;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 1mm 3.5mm;
            border-radius: 3px;
            text-transform: uppercase;
        }
        .badge-finalist {
            display: inline-block;
            background-color: #ecfdf5;
            color: #065f46;
            border: 1px solid #10b981;
            font-size: 7.5pt;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 1mm 3.5mm;
            border-radius: 3px;
            text-transform: uppercase;
        }
        .badge-participant {
            display: inline-block;
            background-color: #f1f5f9;
            color: #334155;
            border: 1px solid #94a3b8;
            font-size: 7.5pt;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 1mm 3.5mm;
            border-radius: 3px;
            text-transform: uppercase;
        }

        @if(!empty($templateImageBase64) && empty($showSystemTitle))
            /* ========================================================= */
            /* MODE A: PRE-PRINTED / CANVA TEMPLATE OVERLAY              */
            /* ========================================================= */
            .canva-recipient-box {
                position: absolute;
                top: {{ $recipientNameTop ?? 107 }}mm;
                left: 25mm;
                right: 25mm;
                height: 16mm;
                text-align: center;
                z-index: 10;
            }
            .canva-recipient-name {
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 28pt;
                font-weight: bold;
                color: #064e3b;
                letter-spacing: 0.5px;
                line-height: 1;
            }

            .canva-meta-box {
                position: absolute;
                top: {{ ($recipientNameTop ?? 107) + 18 }}mm;
                left: 30mm;
                right: 30mm;
                text-align: center;
                z-index: 10;
            }
            .canva-recipient-meta {
                font-size: 8.5pt;
                color: #047857;
                font-weight: 600;
                letter-spacing: 0.3px;
            }

            .canva-details-box {
                position: absolute;
                top: 131mm;
                left: 38mm;
                right: 38mm;
                text-align: center;
                z-index: 10;
            }
            .canva-category-tag {
                margin-bottom: 1.5mm;
            }
            .canva-award-text {
                font-size: 8.5pt;
                color: #475569;
                line-height: 1.35;
            }
            .canva-project-title {
                font-size: 10.5pt;
                font-weight: bold;
                font-style: italic;
                color: #065f46;
                margin-top: 0.5mm;
            }
            .canva-stream-tag {
                font-size: 8pt;
                font-weight: 700;
                color: #b45309;
                margin-top: 0.5mm;
            }

            .canva-sig-left-name {
                position: absolute;
                top: 164.5mm;
                left: 51mm;
                width: 70mm;
                text-align: center;
                z-index: 10;
                font-size: 10.5pt;
                font-weight: 800;
                color: #0f172a;
            }
            .canva-sig-left-title {
                position: absolute;
                top: 175mm;
                left: 51mm;
                width: 70mm;
                text-align: center;
                z-index: 10;
                font-size: 8pt;
                color: #475569;
                font-weight: 600;
                line-height: 1.25;
            }

            .canva-sig-right-name {
                position: absolute;
                top: 164.5mm;
                right: 51mm;
                width: 70mm;
                text-align: center;
                z-index: 10;
                font-size: 10.5pt;
                font-weight: 800;
                color: #0f172a;
            }
            .canva-sig-right-title {
                position: absolute;
                top: 175mm;
                right: 51mm;
                width: 70mm;
                text-align: center;
                z-index: 10;
                font-size: 8pt;
                color: #475569;
                font-weight: 600;
                line-height: 1.25;
            }

            .canva-validation-box {
                position: absolute;
                top: 183mm;
                left: 105mm;
                right: 105mm;
                text-align: center;
                z-index: 10;
            }
            .canva-qr-img {
                width: 12mm;
                height: 12mm;
                display: inline-block;
            }
            .canva-cert-no {
                font-family: 'Courier New', Courier, monospace;
                font-size: 6pt;
                font-weight: bold;
                color: #475569;
                margin-top: 0.5mm;
            }
            .canva-cert-date {
                font-size: 6pt;
                color: #64748b;
            }

        @else
            /* ========================================================= */
            /* MODE B: BUILT-IN SYSTEM OR BLANK FRAME TEMPLATE           */
            /* ========================================================= */
            .outer-border {
                position: absolute;
                top: 10mm;
                left: 10mm;
                right: 10mm;
                bottom: 10mm;
                border: 3px solid #065f46;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: inset 0 0 0 4px #fef3c7, inset 0 0 0 6px #047857;
                padding: 6mm 10mm;
                z-index: 10;
            }
            .corner-decoration {
                position: absolute;
                width: 24mm;
                height: 24mm;
                border: 2px solid #d97706;
            }
            .corner-tl { top: 3mm; left: 3mm; border-right: none; border-bottom: none; }
            .corner-tr { top: 3mm; right: 3mm; border-left: none; border-bottom: none; }
            .corner-bl { bottom: 3mm; left: 3mm; border-right: none; border-top: none; }
            .corner-br { bottom: 3mm; right: 3mm; border-left: none; border-top: none; }

            .content-layer {
                position: relative;
                z-index: 20;
                padding: 4mm 10mm;
            }

            .header {
                text-align: center;
                margin-top: 1mm;
            }
            .header .org-name {
                font-size: 11pt;
                font-weight: 800;
                letter-spacing: 3px;
                color: #047857;
                text-transform: uppercase;
            }
            .header .event-name {
                font-size: 8.5pt;
                font-weight: 600;
                color: #b45309;
                letter-spacing: 1.5px;
                margin-top: 0.5mm;
                text-transform: uppercase;
            }

            .cert-title-container {
                text-align: center;
                margin-top: 3mm;
            }
            .cert-title {
                font-size: 22pt;
                font-weight: 900;
                letter-spacing: 1.5px;
                color: #064e3b;
                text-transform: uppercase;
                font-family: Georgia, serif;
            }
            .cert-subtitle {
                font-size: 9pt;
                color: #64748b;
                margin-top: 0.5mm;
                font-style: italic;
            }
            .category-banner {
                margin-top: 2mm;
            }

            .recipient-section {
                text-align: center;
                margin-top: 3.5mm;
            }
            .recipient-prefix {
                font-size: 8.5pt;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .recipient-name {
                font-size: 21pt;
                font-weight: 800;
                color: #0f172a;
                font-family: Georgia, serif;
                margin-top: 1mm;
                border-bottom: 2px solid #d1fae5;
                display: inline-block;
                padding: 0 15mm 1mm 15mm;
            }
            .recipient-meta {
                font-size: 8.5pt;
                color: #059669;
                font-weight: 600;
                margin-top: 1mm;
            }

            .body-section {
                text-align: center;
                margin-top: 3mm;
                padding: 0 15mm;
            }
            .body-text {
                font-size: 9pt;
                line-height: 1.4;
                color: #334155;
            }
            .project-title {
                font-size: 11pt;
                font-weight: 800;
                color: #065f46;
                margin-top: 1mm;
                font-style: italic;
            }
            .stream-tag {
                font-size: 8pt;
                font-weight: 700;
                color: #b45309;
                margin-top: 0.5mm;
            }

            .footer {
                position: absolute;
                bottom: 6mm;
                left: 12mm;
                right: 12mm;
                height: 30mm;
            }
            .footer-table {
                width: 100%;
                border-collapse: collapse;
            }
            .footer-table td {
                vertical-align: bottom;
            }
            .col-signatory {
                width: 35%;
                text-align: center;
                padding: 0 4mm;
            }
            .col-center {
                width: 30%;
                text-align: center;
            }
            .cert-number {
                font-family: 'Courier New', Courier, monospace;
                font-size: 7pt;
                font-weight: 700;
                color: #475569;
                margin-top: 1mm;
            }
            .cert-date {
                font-size: 7pt;
                color: #64748b;
                margin-top: 0.5mm;
            }
            .qr-box {
                display: inline-block;
                text-align: center;
            }
            .qr-box img {
                width: 15mm;
                height: 15mm;
                display: inline-block;
            }
            .qr-label {
                font-size: 5.5pt;
                color: #64748b;
                margin-top: 0.5mm;
                display: block;
            }
            .signatory-space {
                height: 11mm;
            }
            .signatory-name {
                font-size: 9.5pt;
                font-weight: 800;
                color: #0f172a;
                border-bottom: 1px solid #94a3b8;
                display: inline-block;
                padding: 0 4mm 1mm 4mm;
                min-width: 45mm;
            }
            .signatory-title {
                font-size: 7.5pt;
                color: #475569;
                margin-top: 1mm;
                font-weight: 600;
                line-height: 1.25;
            }
        @endif
    </style>
</head>
<body>
    @if(!empty($templateImageBase64))
        <!-- Custom Background Template Image Uploaded by Admin -->
        <div class="bg-image">
            <img src="{{ $templateImageBase64 }}" alt="Template Background" />
        </div>
    @endif

    @if(!empty($templateImageBase64) && empty($showSystemTitle))
        <!-- ========================================================= -->
        <!-- MODE A: PRE-PRINTED / CANVA TEMPLATE OVERLAY              -->
        <!-- ========================================================= -->
        <!-- Recipient Name (Sitting directly above the line) -->
        <div class="canva-recipient-box">
            <div class="canva-recipient-name">{{ $employee->full_name }}</div>
        </div>

        <!-- Recipient Meta (Directly below the line) -->
        <div class="canva-meta-box">
            <div class="canva-recipient-meta">
                NIK: {{ $employee->employee_index }} &nbsp;·&nbsp; Unit: {{ $employee->unit ?? 'Great Giant Foods' }} &nbsp;·&nbsp; Peran: {{ $certificate->role_in_team }}
            </div>
        </div>

        <!-- Details: Category, Award & Project -->
        <div class="canva-details-box">
            <div class="canva-category-tag">
                @if($certificate->type === 'winner')
                    <span class="badge-winner">KATEGORI: JUARA &nbsp;·&nbsp; {{ strtoupper($certificate->award_title ?? 'PEMENANG PENILAIAN JURI') }}</span>
                @elseif($certificate->type === 'finalist')
                    <span class="badge-finalist">KATEGORI: FINALIS CONVENTION DAY</span>
                @else
                    <span class="badge-participant">KATEGORI: PARTICIPANT (PESERTA)</span>
                @endif
            </div>

            <div class="canva-award-text">
                @if($certificate->type === 'winner')
                    Atas dedikasi, keunggulan inovasi, dan prestasi luar biasa sebagai <strong>{{ $certificate->award_title ?? 'Pemenang' }}</strong> pada project:
                @elseif($certificate->type === 'finalist')
                    Atas dedikasi, kerja keras, dan keberhasilan lolos seleksi sebagai <strong>Finalis Convention Day</strong> pada project:
                @else
                    Atas partisipasi aktif, dedikasi, dan kontribusi continuous improvement pada project:
                @endif
            </div>

            <div class="canva-project-title">
                "{{ $project->title }}"
            </div>

            <div class="canva-stream-tag">
                Stream: {{ $project->stream->name ?? 'Continuous Improvement' }}
                &nbsp;·&nbsp; {{ $eventName }}
            </div>
        </div>

        <!-- Signatory 1 (Left) -->
        <div class="canva-sig-left-name">{{ $signatory1Name }}</div>
        <div class="canva-sig-left-title">{{ $signatory1Title }}</div>

        <!-- Signatory 2 (Right) -->
        <div class="canva-sig-right-name">{{ $signatory2Name }}</div>
        <div class="canva-sig-right-title">{{ $signatory2Title }}</div>

        <!-- Center Validation: QR Code & Cert Details below Medal Seal -->
        <div class="canva-validation-box">
            <img class="canva-qr-img" src="{{ $qrCodeBase64 }}" alt="QR Code" />
            <div class="canva-cert-no">No: {{ $certificate->certificate_number }}</div>
            <div class="canva-cert-date">Terbanggi Besar, {{ $certificate->issued_at->translatedFormat('d F Y') }}</div>
        </div>

    @else
        <!-- ========================================================= -->
        <!-- MODE B: BUILT-IN SYSTEM OR BLANK FRAME TEMPLATE           -->
        <!-- ========================================================= -->
        <div class="{{ empty($templateImageBase64) ? 'outer-border' : '' }}">
            @if(empty($templateImageBase64))
                <!-- Built-in Elegant Golden/Emerald Border -->
                <div class="corner-decoration corner-tl"></div>
                <div class="corner-decoration corner-tr"></div>
                <div class="corner-decoration corner-bl"></div>
                <div class="corner-decoration corner-br"></div>
            @endif

            <div class="content-layer">
                <!-- Header -->
                <div class="header">
                    <div class="org-name">Great Giant Foods</div>
                    <div class="event-name">{{ $eventName }}</div>
                </div>

                <!-- Title -->
                <div class="cert-title-container">
                    <div class="cert-title">
                        @if($certificate->type === 'winner')
                            Sertifikat Pemenang (Winner)
                        @elseif($certificate->type === 'finalist')
                            Sertifikat Finalis Convention
                        @else
                            Sertifikat Partisipasi
                        @endif
                    </div>
                    <div class="cert-subtitle">
                        @if($certificate->type === 'winner')
                            Certificate of Outstanding Achievement - Winner
                        @elseif($certificate->type === 'finalist')
                            Certificate of Finalist Convention Day
                        @else
                            Certificate of Appreciation & Participation
                        @endif
                    </div>
                    <div class="category-banner">
                        @if($certificate->type === 'winner')
                            <span class="badge-winner">KATEGORI: JUARA &nbsp;·&nbsp; {{ strtoupper($certificate->award_title ?? 'PEMENANG') }}</span>
                        @elseif($certificate->type === 'finalist')
                            <span class="badge-finalist">KATEGORI: FINALIS CONVENTION DAY</span>
                        @else
                            <span class="badge-participant">KATEGORI: PARTICIPANT (PESERTA)</span>
                        @endif
                    </div>
                </div>

                <!-- Recipient -->
                <div class="recipient-section">
                    <div class="recipient-prefix">Diberikan secara hormat kepada:</div>
                    <div class="recipient-name">{{ $employee->full_name }}</div>
                    <div class="recipient-meta">
                        NIK: {{ $employee->employee_index }} &nbsp;·&nbsp; Unit: {{ $employee->unit ?? 'GGF' }} &nbsp;·&nbsp; Peran: {{ $certificate->role_in_team }}
                    </div>
                </div>

                <!-- Body -->
                <div class="body-section">
                    <div class="body-text">
                        @if($certificate->type === 'winner')
                            Atas dedikasi, keunggulan inovasi, dan prestasi luar biasa sebagai <strong>{{ $certificate->award_title ?? 'Pemenang' }}</strong> pada project:
                        @elseif($certificate->type === 'finalist')
                            Atas dedikasi, kerja keras, dan keberhasilan lolos seleksi sebagai <strong>Finalis Convention Day</strong> pada project:
                        @else
                            Atas kontribusi, dedikasi, dan partisipasi aktif dalam mencetuskan inovasi continuous improvement pada project:
                        @endif
                    </div>
                    <div class="project-title">
                        "{{ $project->title }}"
                    </div>
                    <div class="stream-tag">
                        Stream: {{ $project->stream->name ?? 'Continuous Improvement' }}
                    </div>
                </div>
            </div>

            <!-- Footer: 2 Signatories + Center QR Code -->
            <div class="footer">
                <table class="footer-table">
                    <tr>
                        <!-- Signatory 1 (Left) -->
                        <td class="col-signatory">
                            <div class="signatory-space"></div>
                            <div class="signatory-name">{{ $signatory1Name }}</div>
                            <div class="signatory-title">{{ $signatory1Title }}</div>
                        </td>

                        <!-- Center: QR Code & Cert Number -->
                        <td class="col-center">
                            <div class="qr-box">
                                <img src="{{ $qrCodeBase64 }}" alt="QR Code" />
                                <span class="qr-label">Scan untuk validasi resmi sistem</span>
                            </div>
                            <div class="cert-number">No: {{ $certificate->certificate_number }}</div>
                            <div class="cert-date">Terbanggi Besar, {{ $certificate->issued_at->translatedFormat('d F Y') }}</div>
                        </td>

                        <!-- Signatory 2 (Right) -->
                        <td class="col-signatory">
                            <div class="signatory-space"></div>
                            <div class="signatory-name">{{ $signatory2Name }}</div>
                            <div class="signatory-title">{{ $signatory2Title }}</div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    @endif
</body>
</html>
