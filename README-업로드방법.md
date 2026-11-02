# 춘삼마을 GitHub 파일 올리는 방법

1. 저장소가 비어 있으면 [저장소 첫 화면](https://github.com/choonsam777/choonsam)의 **creating a new file**을 누릅니다. 이름을 `START-HERE.md`로 하고 내용에 `춘삼마을 런처`를 적은 뒤 **Commit changes**를 눌러 `main` 브랜치를 만듭니다. 이 과정을 건너뛰고 `/upload/main`으로 가면 `Select a branch to upload files` 오류가 납니다. 앱 소개 `README.md`는 ZIP에 포함되어 있습니다.
2. 이 ZIP의 **압축을 푼 뒤**, 안의 파일과 폴더를 모두 선택합니다. ZIP 파일 자체는 올리지 않습니다. `.github` 폴더와 `mods/.gitkeep`도 포함해야 합니다.
3. [GitHub 업로드 페이지](https://github.com/choonsam777/choonsam/upload/main)에 끌어다 놓고, 아래쪽 **Commit changes**를 누릅니다.
4. [Actions 설정](https://github.com/choonsam777/choonsam/settings/actions)에서 Workflow permissions를 **Read and write permissions**로 저장합니다.
5. [Actions 페이지](https://github.com/choonsam777/choonsam/actions)에서 **Update launcher distribution** 작업이 성공(초록색)하는지 확인합니다.

## 공지 바꾸기

[notices.json](https://github.com/choonsam777/choonsam/blob/main/notices.json)을 열고 연필(편집)을 눌러 `title`(제목), `body`(내용), `date`(날짜)를 바꾼 뒤 **Commit changes**를 누릅니다. 런처가 켜져 있으면 약 1분 뒤 표시됩니다.

## 모드 추가/교체/삭제

- 추가: [mods 폴더](https://github.com/choonsam777/choonsam/tree/main/mods)에서 **Add file → Upload files**를 눌러 Fabric 26.3용 `.jar` 파일을 올립니다.
- 교체: 같은 이름의 `.jar` 파일을 다시 업로드하고 변경 사항을 저장합니다.
- 삭제: 해당 `.jar` 파일을 열어 삭제하고 변경 사항을 저장합니다.

모드 변경 후 [Actions 페이지](https://github.com/choonsam777/choonsam/actions)에서 작업이 초록색인지 확인하세요. 런처는 약 1분 간격으로 목록을 확인하고, 다음 게임 실행 전에 파일을 동기화합니다. 이미 실행 중인 Minecraft는 다시 켜야 새 모드가 적용됩니다.

GitHub 웹 업로드는 파일당 25 MiB 제한이 있습니다. 더 큰 모드는 GitHub Desktop 또는 Git 명령줄로 올려야 합니다.

런처에는 Microsoft Entra 앱의 Client ID `0d433033-ce35-49a2-8930-ac73e9308a88`가 설정되어 있습니다. 사용자가 개인 계정 지원과 토큰 버전 2를 설정한 뒤 기존 `unauthorized_client` 오류는 사라졌습니다. Microsoft 로그인 뒤 Minecraft 게임 인증이 실패하면 앱 ID의 Minecraft Services 승인 상태를 확인해야 할 수 있습니다. 진단 메시지는 런처 버전 1.0.4부터 표시됩니다.
