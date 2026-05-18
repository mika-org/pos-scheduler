// Client-side HS256 JWT Generator and Verifier using native Web Crypto API
// No NPM packages required, fully secure and high performance.

const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const base64UrlDecode = (str: string): string => {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) {
    s += '=';
  }
  return atob(s);
};

// Sign a payload using HS256 with Web Crypto API
export const signJwt = async (payload: any, secret: string): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const tokenInput = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(tokenInput);
  const keyData = encoder.encode(secret);

  // Import raw key for HMAC signing
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the signature payload
  const signature = await window.crypto.subtle.sign('HMAC', key, data);
  const signatureArray = new Uint8Array(signature);
  
  // Convert binary to string safely
  let binaryString = '';
  for (let i = 0; i < signatureArray.length; i++) {
    binaryString += String.fromCharCode(signatureArray[i]);
  }
  
  const encodedSignature = base64UrlEncode(binaryString);
  return `${tokenInput}.${encodedSignature}`;
};

// Verify a HS256 JWT using Web Crypto API
export const verifyJwt = async (token: string, secret: string): Promise<any | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const tokenInput = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(tokenInput);
    const keyData = encoder.encode(secret);

    // Import key for HMAC verification
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode signature
    const signatureStr = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signatureBytes[i] = signatureStr.charCodeAt(i);
    }

    const isValid = await window.crypto.subtle.verify('HMAC', key, signatureBytes, data);
    if (!isValid) return null;

    const decodedPayload = JSON.parse(base64UrlDecode(encodedPayload));
    
    // Check if token has expired (optional 24h lifespan check)
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      console.warn('JWT token has expired.');
      return null;
    }

    return decodedPayload;
  } catch (e) {
    console.error('Error verifying JWT signature:', e);
    return null;
  }
};
