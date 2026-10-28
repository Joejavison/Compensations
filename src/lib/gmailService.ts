import { getAccessToken } from './firebase.ts';
import { GmailEmailRecord } from '../types/index.ts';

// Helper to decode Base64 / Base64URL
function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

// Extract money figures from email text (e.g. $1,250.00, $500, USD 3,400.50)
export function extractAmounts(text: string): number[] {
  const matches: number[] = [];
  const regex = /(?:\$|USD\s*)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawNum = match[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    if (!isNaN(num) && num > 0 && !matches.includes(num)) {
      matches.push(num);
    }
  }
  return matches.slice(0, 5); // top 5 detected amounts
}

// Extract reference or invoice IDs (e.g. INV-1002, Ref #9021, Check #104)
export function extractReference(text: string): string | undefined {
  const regex = /(?:INV(?:OICE)?|REF(?:ERENCE)?|PO|CHECK|TRANSACTION)\s*#?\s*:?\s*([A-Za-z0-9\-_]{3,20})/i;
  const match = text.match(regex);
  return match ? match[0] : undefined;
}

interface MessagePart {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
}

// Extract plain text or html snippet from Gmail message payload
function extractBodyFromPayload(payload?: MessagePart): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64(part.body.data);
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      }
    }
    for (const part of payload.parts) {
      const nested = extractBodyFromPayload(part);
      if (nested) return nested;
    }
  }
  return '';
}

export async function searchGmailMessages(query: string, maxResults = 12): Promise<GmailEmailRecord[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No Google authentication token found. Please sign in with Google first.');
  }

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const errorData = await listRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to search messages (${listRes.status})`);
  }

  const listData = await listRes.json();
  const messagesList: { id: string; threadId: string }[] = listData.messages || [];

  if (messagesList.length === 0) {
    return [];
  }

  // Fetch message details in parallel
  const details = await Promise.all(
    messagesList.map(async (msg) => {
      try {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const res = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        
        const headers = data.payload?.headers || [];
        const getHeader = (name: string) => {
          const h = headers.find((item: { name: string; value: string }) => item.name.toLowerCase() === name.toLowerCase());
          return h ? h.value : '';
        };

        const from = getHeader('From');
        const to = getHeader('To');
        const subject = getHeader('Subject') || '(No Subject)';
        const date = getHeader('Date');
        const snippet = data.snippet || '';

        const fullText = snippet + ' ' + extractBodyFromPayload(data.payload);
        const amounts = extractAmounts(fullText);
        const reference = extractReference(fullText);

        const record: GmailEmailRecord = {
          id: msg.id,
          threadId: msg.threadId,
          from,
          to,
          subject,
          date: date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '',
          snippet,
          detectedAmounts: amounts,
          detectedRef: reference,
        };
        return record;
      } catch (e) {
        console.error('Failed to load message detail:', e);
        return null;
      }
    })
  );

  return details.filter((item): item is GmailEmailRecord => item !== null);
}

// Convert string to base64url format for RFC 2822 email
function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailMessage(to: string, subject: string, bodyText: string): Promise<{ id: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No Google authentication token available. Please sign in with Google first.');
  }

  // Construct standard RFC 2822 raw email
  const emailLines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ];
  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = encodeBase64Url(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to send email (${res.status})`);
  }

  return await res.json();
}
