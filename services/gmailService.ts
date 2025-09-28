import type { Draft, Email } from '../types';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Helper function to convert a file to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

// Helper to build the raw email string for the Gmail API
const createMimeMessage = async (email: Email): Promise<string> => {
    const boundary = `----=${Date.now()}`;
    
    let mimeMessage = `To: ${email.to}\r\n`;
    mimeMessage += `Subject: ${email.subject}\r\n`;
    mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // HTML body part
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${email.body}\r\n\r\n`;

    // Attachments
    if (email.attachments && email.attachments.length > 0) {
        for (const file of email.attachments) {
            const base64Data = await fileToBase64(file);
            mimeMessage += `--${boundary}\r\n`;
            mimeMessage += `Content-Type: ${file.type}; name="${file.name}"\r\n`;
            mimeMessage += `Content-Disposition: attachment; filename="${file.name}"\r\n`;
            mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
            mimeMessage += `${base64Data}\r\n\r\n`;
        }
    }

    mimeMessage += `--${boundary}--`;
    return mimeMessage;
};

// Function to encode the MIME message in Base64URL format
const encodeMessage = (message: string): string => {
    return btoa(unescape(encodeURIComponent(message)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const makeApiRequest = async (url: string, method: string, token: string, body?: any) => {
    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const options: RequestInit = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gmail API Error: ${error.error.message}`);
    }
    return response.json();
};

export const sendEmail = async (token: string, email: Email): Promise<any> => {
    const mimeMessage = await createMimeMessage(email);
    const raw = encodeMessage(mimeMessage);
    return makeApiRequest(`${GMAIL_API_URL}/messages/send`, 'POST', token, { raw });
};

export const createDraft = async (token: string, email: Email): Promise<any> => {
    const mimeMessage = await createMimeMessage(email);
    const raw = encodeMessage(mimeMessage);
    const payload = { message: { raw } };
    if(email.id) {
        // Update existing draft
        return makeApiRequest(`${GMAIL_API_URL}/drafts/${email.id}`, 'PUT', token, payload);
    } else {
        // Create new draft
        return makeApiRequest(`${GMAIL_API_URL}/drafts`, 'POST', token, payload);
    }
};

export const listDrafts = async (token: string): Promise<Draft[]> => {
    const response = await makeApiRequest(`${GMAIL_API_URL}/drafts?includeSpamTrash=false&maxResults=20`, 'GET', token);
    const draftDetailsPromises = (response.drafts || []).map((draft: {id: string}) => getDraft(token, draft.id));
    return Promise.all(draftDetailsPromises);
};

export const getDraft = async (token: string, id: string): Promise<Draft> => {
    return makeApiRequest(`${GMAIL_API_URL}/drafts/${id}?format=full`, 'GET', token);
};
