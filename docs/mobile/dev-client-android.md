# Android Development Build로 실기기에서 실행하기

Google OAuth는 브라우저에서 `https://.../v1/auth/google/mobile-callback`로 돌아온 뒤, API가 `lifenote://auth` 딥링크로 앱에 복귀시키는 흐름입니다. **Expo Go만으로는 커스텀 스킴(`lifenote://`)이 OS에 등록되지 않아** 실기기에서 OAuth가 불안정하거나 멈춘 것처럼 보일 수 있습니다. 실기기 검증에는 **Development Build(Dev Client)** 를 권장합니다.

## 전제

- PC와 폰이 **같은 Wi‑Fi**에 있거나, Metro 접근이 가능한 네트워크 환경입니다.
- 이 문서의 EAS 빌드는 **`apps/mobile` 디렉터리에서** 실행하는 것을 전제로 합니다.  
  레포 루트에서 빌드하면 `android/` 유무에 따라 `app.json`의 `android.package`가 무시되는 등 설정이 엇갈릴 수 있습니다.

## 1) 의존성 설치

`apps/mobile`에서:

```bash
cd apps/mobile
npx expo install expo-dev-client
```

## 2) EAS CLI 로그인

```bash
eas login --sso
eas whoami
```

## 3) Android Development Build 만들기

```bash
cd apps/mobile
npx eas-cli build --profile development --platform android
```

빌드가 끝나면 Expo 대시보드 링크(또는 터미널에 출력된 설치 URL)로 **APK를 폰에 설치**합니다.

### 설치 충돌이 날 때

이미 다른 서명으로 같은 패키지가 설치되어 있으면 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`가 날 수 있습니다. 이 경우 기존 앱을 삭제한 뒤 다시 설치합니다.

## 4) Metro 띄우기 (Dev Client 모드)

```bash
cd apps/mobile
npx expo start --dev-client
```

터미널에 `Using development build`가 보이는지 확인합니다. `Using Expo Go`라면 키보드에서 `s`를 눌러 **development build 모드**로 전환합니다.

## 5) 폰에서 프로젝트 연결

1. 폰에서 설치한 **Development Build 앱**을 실행합니다. (이름은 보통 `mobile` 등)
2. 앱 홈의 **`Scan QR Code`** 로 터미널 QR을 스캔합니다.  
   - **기본 카메라 앱으로 QR을 찍으면** `exp://` 스킴을 처리하지 못해 무반응처럼 보일 수 있습니다.
3. 연결되면 Metro가 번들을 내려주고 앱이 실행됩니다.

### LAN이 안 될 때

`npx expo start --dev-client --tunnel`을 시도할 수 있으나, Windows 환경에서는 `@expo/ngrok` 설치/버전 이슈로 실패할 수 있습니다. 이 경우 **같은 Wi‑Fi + 방화벽에서 8081 허용**이 가장 안정적입니다.

## 6) Google 로그인과 함께 확인할 것

- `apps/mobile/.env`의 `EXPO_PUBLIC_API_BASE_URL`과 `EXPO_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI`는 **배포된 API의 공개 HTTPS 도메인**과 일치해야 합니다.
- Google Cloud Console의 **OAuth Web 클라이언트**에 아래 형태의 리디렉션 URI가 등록되어 있어야 합니다.  
  `https://<api-host>/v1/auth/google/mobile-callback`
- API 환경 변수 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`이 위 Web 클라이언트와 맞아야 합니다.

## 자주 하는 실수

- Dev Client QR을 **Expo Go**로 스캔한다.
- EAS 빌드를 **레포 루트**에서 실행해 잘못된 `android.package`로 빌드된다.
- Metro를 끈 채 Dev Client만 실행해 **Unable to load script**가 난다.
