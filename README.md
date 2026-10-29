# 12월 12일 장학금 수여식 참석 조사

GitHub Pages(웹페이지 호스팅) + Firebase(데이터 저장·관리자 로그인)로 동작하는 참석 조사 웹페이지입니다.

| 페이지 | 주소 | 용도 |
| --- | --- | --- |
| 설문 페이지 | `https://<깃허브아이디>.github.io/Scholarship/` | 장학생이 이름·연락처·출신 고교·대학교 재학 여부(대학교·학과)·참석 여부·출발 지역 입력 |
| 관리자 페이지 | `https://<깃허브아이디>.github.io/Scholarship/admin.html` | 응답을 사람별 한 줄로 확인, 검색·필터, **엑셀 다운로드**, 잘못된 응답 삭제 |

엑셀 파일에는 `응답 목록` 시트와 `지역별 참석 인원` 시트가 함께 만들어집니다. 검색·필터를 걸어 둔 상태라면 화면에 보이는 응답만 내보냅니다.

## 파일 구성

```
index.html            설문 페이지
admin.html            관리자 페이지
css/style.css         디자인
js/firebase-config.js ★ Firebase 설정값을 붙여넣을 파일
js/firebase.js        Firebase 초기화
js/survey.js          설문 제출 로직
js/admin.js           관리자 목록·엑셀 내보내기 로직
js/regions.js         출발 지역(시·도, 시·군) 선택 목록
firestore.rules       ★ Firebase 보안 규칙 (콘솔에 붙여넣기)
```

## 설정 순서

### 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → **프로젝트 추가** → 이름 입력(예: `scholarship-survey`) → 생성 (Google 애널리틱스는 꺼도 됩니다).

### 2. 웹 앱 등록 후 설정값 복사
1. 프로젝트 개요 화면에서 **`</>` (웹)** 아이콘 클릭 → 앱 닉네임 입력 → **앱 등록** (Firebase 호스팅 체크는 하지 않음).
2. 화면에 나오는 `firebaseConfig = { ... }` 값을 복사해 `js/firebase-config.js`의 같은 항목에 붙여넣습니다.

### 3. Firestore 데이터베이스 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**.
2. 위치: `asia-northeast3 (서울)` 선택 → **프로덕션 모드**로 시작.

### 4. 관리자 계정 만들기
1. **빌드 → Authentication → 시작하기 → 로그인 방법 → 이메일/비밀번호** 사용 설정.
2. **Users 탭 → 사용자 추가**에서 관리자 이메일과 비밀번호를 등록합니다. (여러 명 가능)

### 5. 보안 규칙 적용
1. `firestore.rules` 파일의 관리자 이메일 목록에 4단계에서 등록한 관리자 이메일을 **소문자로** 적습니다. 여러 명이면 `['a@gmail.com', 'b@gmail.com']`처럼 씁니다.
2. **Firestore Database → 규칙** 탭에 파일 내용을 전체 붙여넣고 **게시**.

> 이 규칙으로 누구나 응답을 **제출**할 수는 있지만, **조회·삭제**는 관리자 이메일로 로그인한 사람만 가능합니다. 개인정보가 외부에 노출되지 않도록 반드시 적용하세요.

### 6. 수정한 파일을 GitHub에 반영
`js/firebase-config.js`, `firestore.rules` 수정 내용을 커밋해 `main` 브랜치에 올립니다. (GitHub 웹에서 파일을 열고 연필 아이콘으로 직접 수정해도 됩니다.)

### 7. GitHub Pages 켜기
1. GitHub 저장소 → **Settings → Pages**.
2. Source: **Deploy from a branch**, Branch: **`main`** / **`/ (root)`** → Save.
3. 1~2분 뒤 상단에 표시되는 주소(`https://<아이디>.github.io/Scholarship/`)가 설문 페이지입니다.

> 무료 계정에서 GitHub Pages를 쓰려면 저장소가 **Public**이어야 합니다. 설정값은 공개되어도 안전하며, 응답 데이터는 Firebase에 저장되고 5단계 규칙으로 보호됩니다.

### 8. Firebase에 도메인 허용
**Authentication → 설정 → 승인된 도메인 → 도메인 추가**에 `<아이디>.github.io`를 추가합니다. (관리자 로그인에 필요)

### 9. 테스트 후 배포
1. 설문 페이지에서 테스트 응답을 1건 제출합니다.
2. `admin.html`에서 로그인 → 응답이 보이는지, **엑셀 다운로드**가 되는지 확인합니다.
3. 테스트 응답을 **삭제**한 뒤 설문 주소를 장학생들에게 공유합니다.
