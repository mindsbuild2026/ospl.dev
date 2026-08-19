/**
 * Production-grade Clipboard Service
 * Ensures text is copied reliably and returns true ONLY if clipboard writing succeeded.
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text || typeof text !== 'string') {
    return false;
  }

  try {
    // 1. Primary API: Modern navigator.clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 2. Fallback API: execCommand for legacy environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('[ClipboardService] Copy to clipboard failed:', err);
    return false;
  }
}
