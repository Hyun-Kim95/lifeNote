# 자체 목업 (lifeNote 내부 트랙)

**시각 최종 기준은 Stitch로 확정**되었다(`docs/requirements/prd-lifenote-integrated-app.md` §13.1, `docs/design/stitch-lifenote-handoff.md` «디자인 확정»).  
이 폴더는 비교·참고용이며, **통계·커뮤니티**처럼 Stitch에 아직 없는 흐름을 잡을 때만 보조로 쓴다.

## 여는 방법

- **권장**: 저장소 루트에서 정적 서버 실행 후 브라우저로 접속.

```bash
cd mock-internal
npx --yes serve -l 5175
```

브라우저에서 `http://localhost:5175` (또는 터미널에 표시된 주소)를 연다.

- `file://` 직접 열기도 가능하나, 일부 브라우저에서 스크립트/폰트가 제한될 수 있다.

## 포함 화면

허브: `index.html`에서 자체 목업·Stitch 대응 관계를 표로 정리했다.

## 테마

헤더의 **다크 모드** 토글은 `data-theme` 속성으로 전환한다. PRD·제품 규칙의 다크모드 점검용이다.
