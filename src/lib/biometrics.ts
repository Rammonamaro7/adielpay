export const isBiometricsSupported = () => {
  return typeof window !== 'undefined' &&
         window.PublicKeyCredential !== undefined &&
         typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
};

export const checkBiometricsAvailable = async () => {
  if (!isBiometricsSupported()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    return false;
  }
};

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export const registerBiometrics = async (userEmail: string, userName: string) => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "AdPay", id: window.location.hostname },
      user: {
        id: userId,
        name: userEmail,
        displayName: userName
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "none"
    }
  }) as PublicKeyCredential;

  if (credential) {
    const credentialId = bufferToBase64(credential.rawId);
    localStorage.setItem('adielpay_biometric_id', credentialId);
    return true;
  }
  return false;
};

export const authenticateBiometrics = async () => {
  const savedId = localStorage.getItem('adielpay_biometric_id');
  if (!savedId) throw new Error("Biometria não configurada");

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const credentialIdBuffer = base64ToBuffer(savedId);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [{
        type: "public-key",
        id: credentialIdBuffer
      }],
      userVerification: "required",
      timeout: 60000
    }
  });

  return !!assertion;
};

export const disableBiometrics = () => {
  try {
    localStorage.removeItem('adielpay_biometric_id');
  } catch (e) {
    console.error(e);
  }
};

export const isBiometricsEnabled = () => {
  try {
    return !!localStorage.getItem('adielpay_biometric_id');
  } catch (e) {
    return false;
  }
};
