import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'modify',
  standalone: true,
})
export class ModifyPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    if (!value) return value;

    // 1. Escape HTML to prevent XSS (basic escaping)
    const escapedText = this.escapeHtml(value);

    // 2. Regex for URLs
    // Matches http://, https://, or www.
    const urlRegex =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

    const linkedText = escapedText.replace(urlRegex, (url) => {
      let href = url;
      // If it starts with www, append http://
      if (url.toLowerCase().startsWith('www.')) {
        href = 'http://' + url;
      }
      return `<a href="${href}" target="_blank" class="underline text-blue-500 hover:text-blue-700" rel="noopener noreferrer">${url}</a>`;
    });

    // 3. Regex for Emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const withEmails = linkedText.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}" class="underline text-blue-500 hover:text-blue-700">${email}</a>`;
    });

    // 4. Regex for Phone Numbers
    // Matches formats like: 123-456-7890, (123) 456-7890, 123 456 7890, +1-123-456-7890
    const phoneRegex = /(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g;
    const finalHtml = withEmails.replace(phoneRegex, (phone) => {
      return `<a href="tel:${phone.trim()}" class="underline text-blue-500 hover:text-blue-700">${phone}</a>`;
    });

    // 5. Return safe HTML
    return this.sanitizer.bypassSecurityTrustHtml(finalHtml);
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
