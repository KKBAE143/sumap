import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

// Use VITE_ prefixed env vars for client-side code
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'demo-jwt-secret-key';
const SERVER_SECRET = import.meta.env.VITE_SERVER_SECRET || 'demo-server-secret-key';

export interface QRPayload {
  pass_id: string;
  iat: number;
  exp: number;
  nonce: string;
  color_token: string;
}

export const generateColorToken = (passId: string, colorSeed: string): string => {
  // Generate time window (5-minute windows)
  const epochWindow = Math.floor(Date.now() / (5 * 60 * 1000));
  
  // Create HMAC
  const data = `${passId}_${colorSeed}_${epochWindow}`;
  const hash = CryptoJS.HmacSHA256(data, SERVER_SECRET).toString();
  
  // Convert hash to color
  const r = parseInt(hash.substring(0, 2), 16);
  const g = parseInt(hash.substring(2, 4), 16);
  const b = parseInt(hash.substring(4, 6), 16);
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const generateSignedPayload = (passId: string, colorSeed: string): { signedPayload: string; payload: QRPayload } => {
  const now = Math.floor(Date.now() / 1000);
  const colorToken = generateColorToken(passId, colorSeed);
  
  const payload: QRPayload = {
    pass_id: passId,
    iat: now,
    exp: now + (10 * 60), // 10 minute expiry for better security
    nonce: Math.random().toString(36).substring(7),
    color_token: colorToken,
  };
  
  const payloadString = JSON.stringify(payload);
  const signature = CryptoJS.HmacSHA256(payloadString, JWT_SECRET).toString();
  const signedPayload = `${btoa(payloadString)}.${signature}`;
  
  return { signedPayload, payload };
};

export const generateQRCode = async (passId: string, colorSeed: string): Promise<{ qrCodeDataUrl: string; payload: QRPayload }> => {
  const { signedPayload, payload } = generateSignedPayload(passId, colorSeed);
  
  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(signedPayload, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return { qrCodeDataUrl, payload };
};

export interface VerificationResult {
    payload: QRPayload | null;
    status: 'VALID' | 'EXPIRED' | 'INVALID_SIGNATURE' | 'INVALID_FORMAT';
}

export const verifyQRPayload = (qrPayload: string): VerificationResult => {
  try {
    const [encodedPayload, signature] = qrPayload.split('.');
    if (!encodedPayload || !signature) {
      return { payload: null, status: 'INVALID_FORMAT' };
    }
    const payloadString = atob(encodedPayload);
    
    // Verify signature first - this is critical
    const expectedSignature = CryptoJS.HmacSHA256(payloadString, JWT_SECRET).toString();
    if (signature !== expectedSignature) {
        return { payload: null, status: 'INVALID_SIGNATURE' };
    }
    
    const payload = JSON.parse(payloadString) as QRPayload;
    
    // Check expiry, but don't fail hard
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { payload, status: 'EXPIRED' };
    }
    
    return { payload, status: 'VALID' };
  } catch (error) {
    console.error('QR verification failed:', error);
    return { payload: null, status: 'INVALID_FORMAT' };
  }
};

export const validateColorToken = (passId: string, colorSeed: string, expectedColor: string): boolean => {
  const currentColor = generateColorToken(passId, colorSeed);
  return currentColor === expectedColor;
};
