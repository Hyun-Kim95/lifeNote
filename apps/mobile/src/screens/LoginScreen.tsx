import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth, type AuthTokenResponse } from '../auth/AuthContext';
import { Card, ErrorText, Muted, PrimaryButton, SecondaryButton, SectionLabel } from '../components/Ui';
import {
  getApiBaseUrl,
  getGoogleAndroidClientId,
  getGoogleIosClientId,
  getGoogleOAuthRedirectUri,
  getGoogleWebClientId,
} from '../config';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type ApiErrBody = { error?: { code?: string; message?: string } };

type OAuthCallbackParams = {
  code?: string;
  error?: string;
  errorDescription?: string;
};

function parseApiError(body: unknown): { message: string; conflict: boolean } {
  if (!body || typeof body !== 'object') {
    return { message: '로그인 실패', conflict: false };
  }
  const err = (body as ApiErrBody).error;
  const message = typeof err?.message === 'string' ? err.message : '로그인 실패';
  const conflict = err?.code === 'CONFLICT';
  return { message, conflict };
}

function parseOAuthCallbackUrl(url: string): OAuthCallbackParams | null {
  if (!url.startsWith('lifenote://auth')) return null;
  const qIndex = url.indexOf('?');
  if (qIndex < 0) return {};
  const qs = new URLSearchParams(url.slice(qIndex + 1));
  const code = qs.get('code') ?? undefined;
  const error = qs.get('error') ?? undefined;
  const errorDescription = qs.get('error_description') ?? undefined;
  return { code, error, errorDescription };
}

/**
 * Android/iOS에서는 `webClientId`만으로는 부족하고 `clientId` 또는 플랫폼별 client id가 필요합니다.
 * (expo-auth-session: `androidClientId ?? clientId`)
 */
function LoginScreenWithGoogle({ navigation, webClientId }: Props & { webClientId: string }) {
  const { signInFromExchange } = useAuth();
  const { colors, fonts, spacing, icon } = useAppTheme();
  const androidClientId = getGoogleAndroidClientId();
  const iosClientId = getGoogleIosClientId();
  /** Google 콘솔(웹 클라이언트)에 등록한 http(s) 콜백과 동일 — API GET이 `lifenote://auth`로 이어 줌 */
  const redirectUri = getGoogleOAuthRedirectUri();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId,
    androidClientId: androidClientId ?? webClientId,
    iosClientId: iosClientId ?? webClientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    shouldAutoExchangeCode: false,
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountConflict, setAccountConflict] = useState(false);
  const processedCodeRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setAccountConflict(false);
  }, []);

  const retryGoogle = useCallback(() => {
    clearError();
    void promptAsync();
  }, [clearError, promptAsync]);

  const exchangeAuthorizationCode = useCallback(
    async (code: string) => {
      if (!webClientId) return;
      if (processedCodeRef.current === code) return;
      processedCodeRef.current = code;

      setBusy(true);
      clearError();
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/v1/auth/oauth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'google',
            authorizationCode: code,
            redirectUri,
            codeVerifier: request?.codeVerifier,
          }),
        });
        const text = await res.text();
        let body: unknown;
        try {
          body = text ? (JSON.parse(text) as unknown) : {};
        } catch {
          body = {};
        }
        if (!res.ok) {
          const { message, conflict } = parseApiError(body);
          setAccountConflict(conflict);
          throw new Error(message);
        }
        await signInFromExchange(body as AuthTokenResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : '로그인 실패');
      } finally {
        setBusy(false);
      }
    },
    [clearError, redirectUri, request?.codeVerifier, signInFromExchange, webClientId],
  );

  const handleOAuthCallbackParams = useCallback(
    (params: OAuthCallbackParams) => {
      if (params.error) {
        setBusy(false);
        setAccountConflict(false);
        setError(params.errorDescription ?? params.error ?? '로그인 중 오류가 발생했습니다.');
        return;
      }
      if (!params.code) return;
      void exchangeAuthorizationCode(params.code);
    },
    [exchangeAuthorizationCode],
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      const p = response.params as Record<string, string | undefined> | undefined;
      handleOAuthCallbackParams({
        error: typeof p?.error === 'string' ? p.error : undefined,
        errorDescription: p?.error_description,
      });
      return;
    }

    if (response.type !== 'success') {
      return;
    }

    const code =
      response.params.code ??
      ('authentication' in response &&
      response.authentication &&
      typeof response.authentication === 'object'
        ? (response.authentication as { code?: string }).code
        : undefined);
    if (!code) return;
    void exchangeAuthorizationCode(code);
  }, [exchangeAuthorizationCode, handleOAuthCallbackParams, response]);

  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      const parsed = parseOAuthCallbackUrl(url);
      if (!parsed) return;
      handleOAuthCallbackParams(parsed);
    };

    const sub = Linking.addEventListener('url', onUrl);
    void Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = parseOAuthCallbackUrl(url);
      if (!parsed) return;
      handleOAuthCallbackParams(parsed);
    });

    return () => sub.remove();
  }, [handleOAuthCallbackParams]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxl,
          gap: spacing.xl,
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text
            style={{
              fontFamily: fonts.title,
              fontSize: 32,
              lineHeight: 40,
              color: colors.text,
              letterSpacing: -0.5,
            }}
          >
            lifeNote
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: fonts.titleSemi,
              fontSize: 18,
              lineHeight: 26,
              color: colors.text,
            }}
          >
            하루를 기록하는 습관
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: fonts.body,
              ...fonts.typography.bodySm,
              color: colors.textMuted,
              paddingHorizontal: spacing.xxs,
            }}
          >
            MVP에서는 Google 계정으로만 시작할 수 있어요.
          </Text>
        </View>

        <Card>
          <PrimaryButton
            title="Google로 계속하기"
            loading={busy}
            disabled={!request}
            leading={
              <View accessible={false} importantForAccessibility="no-hide-descendants">
                <Ionicons name="logo-google" size={icon.lg - 2} color={colors.onPrimary} />
              </View>
            }
            onPress={() => {
              clearError();
              void promptAsync();
            }}
          />
          {busy ? (
            <Text
              style={{
                textAlign: 'center',
                fontFamily: fonts.body,
                ...fonts.typography.bodySm,
                color: colors.textMuted,
              }}
            >
              로그인 처리 중…
            </Text>
          ) : null}
          <Text
            style={{
              textAlign: 'center',
              fontFamily: fonts.body,
              ...fonts.typography.bodySm,
              color: colors.textMuted,
            }}
          >
            계속하면 Google에서 프로필·이메일 정보를 받아옵니다.
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: fonts.body,
              ...fonts.typography.bodySm,
              color: colors.textMuted,
            }}
          >
            이메일 직접 로그인은 준비 중이에요.
          </Text>
        </Card>

        {error ? (
          <Card>
            {accountConflict ? (
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Ionicons name="link-outline" size={icon.lg + 2} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text style={{ fontFamily: fonts.titleSemi, fontSize: 16, lineHeight: 24, color: colors.text }}>
                    연동된 계정 안내
                  </Text>
                  <Muted>{error}</Muted>
                </View>
              </View>
            ) : (
              <ErrorText>{error}</ErrorText>
            )}
            <PrimaryButton title="다시 시도" onPress={retryGoogle} loading={busy} disabled={!request} />
          </Card>
        ) : null}

        {__DEV__ ? (
          <Card>
            <SectionLabel>개발용 · 리디렉션 URI</SectionLabel>
            <Text
              selectable
              style={{
                fontFamily: fonts.body,
                color: colors.textMuted,
                ...fonts.typography.sectionLabel,
              }}
            >
              {redirectUri}
            </Text>
            <Muted>Google Cloud Console OAuth 클라이언트에 위 URI를 등록하세요.</Muted>
          </Card>
        ) : null}

        {__DEV__ ? (
          <SecondaryButton title="개발자: 토큰으로 로그인" onPress={() => navigation.navigate('DevToken')} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export function LoginScreen(props: Props) {
  const webClientId = getGoogleWebClientId();
  const { colors, fonts, spacing } = useAppTheme();

  if (!webClientId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xxl,
            gap: spacing.lg,
            justifyContent: 'center',
            backgroundColor: colors.bg,
          }}
        >
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Text
              style={{
                fontFamily: fonts.title,
                fontSize: 32,
                lineHeight: 40,
                color: colors.text,
              }}
            >
              lifeNote
            </Text>
            <Text
              style={{
                textAlign: 'center',
                fontFamily: fonts.body,
                ...fonts.typography.bodySm,
                color: colors.textMuted,
              }}
            >
              Google 계정으로 로그인합니다.
            </Text>
          </View>
          <ErrorText>
            EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID가 설정되지 않았습니다. apps/mobile/.env.example 참고.
          </ErrorText>
          {__DEV__ ? (
            <SecondaryButton
              title="개발자: 토큰으로 로그인"
              onPress={() => props.navigation.navigate('DevToken')}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <LoginScreenWithGoogle {...props} webClientId={webClientId} />;
}
