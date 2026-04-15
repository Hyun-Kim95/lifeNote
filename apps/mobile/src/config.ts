const trimSlash = (s: string) => s.replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:4000';
  return trimSlash(raw.trim());
}

export function getGoogleWebClientId(): string | undefined {
  const v = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  return v || undefined;
}

/** 네이티브(Android/iOS) 전용 OAuth 클라이언트. 미설정 시 `clientId`로 웹 ID를 쓰는 흐름에 맡김. */
export function getGoogleAndroidClientId(): string | undefined {
  const v = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  return v || undefined;
}

export function getGoogleIosClientId(): string | undefined {
  const v = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  return v || undefined;
}

/**
 * Google 웹 클라이언트에 등록한 redirect_uri와 동일해야 함.
 *
 * 미설정 시 API 베이스 + `/v1/auth/google/mobile-callback`을 쓰되,
 * 호스트가 Android 에뮬 전용 주소 `10.0.2.2`이면 **`localhost`로 치환**한다.
 * Google은 사설 IP(`10.0.2.2` 등) redirect에 `device_id`/`device_name`을 요구해 차단하는 경우가 많다.
 * 에뮬에서는 `adb reverse tcp:4000 tcp:4000` 후 브라우저가 `http://localhost:4000/...`로 콜백하면 호스트 API로 연결된다.
 */
function oauthRedirectBaseFromApiBase(apiBase: string): string {
  try {
    const u = new URL(apiBase.includes('://') ? apiBase : `http://${apiBase}`);
    if (u.hostname === '10.0.2.2') {
      u.hostname = 'localhost';
    }
    return trimSlash(u.origin);
  } catch {
    return trimSlash(apiBase);
  }
}

export function getGoogleOAuthRedirectUri(): string {
  const explicit = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return trimSlash(explicit);
  return `${oauthRedirectBaseFromApiBase(getApiBaseUrl())}/v1/auth/google/mobile-callback`;
}
