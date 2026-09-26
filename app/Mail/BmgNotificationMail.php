<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BmgNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $recipientName,
        public string $heading,
        public string $body,
        public ?string $actionUrl = null,
        public string $actionLabel = 'Buka Portal BMG',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Bulan Mutu GGF] '.$this->heading,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.notification',
        );
    }
}
