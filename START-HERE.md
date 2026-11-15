# 크빌서버 런처 관리

이 저장소는 런처가 읽는 공지와 배포 목록을 관리합니다. Minecraft 서버 주소는 `christmas1225.p-e.kr:25565`입니다.

## 모드 바꾸기

1. [Releases](https://github.com/choonsam777/choonsam/releases)에서 **Draft a new release**를 누릅니다.
2. 태그 이름을 `kvill-mods-날짜`처럼 지정합니다. 예: `kvill-mods-2026-12-01`.
3. 이번에 사용할 Fabric 26.3 모드 JAR **전체**를 첨부한 뒤 **Publish release**를 누릅니다. 추가·삭제·수정할 때마다 전체 목록을 새 릴리스에 올립니다.
4. [Actions](https://github.com/choonsam777/choonsam/actions)에서 `Update launcher distribution files` 작업이 성공했는지 확인합니다. 이후 런처를 다시 켜거나 다음 갱신 때 새 목록을 받습니다.

GitHub 일반 파일 업로드에는 크기 제한이 있어 모드는 릴리스 첨부 파일로 관리합니다. 이전 릴리스는 기록으로 남지만 런처는 최신 `kvill-mods-` 릴리스만 사용합니다.

## 쉐이더팩 바꾸기

[shaderpacks.json](shaderpacks.json)의 Modrinth `project`와 `version`을 수정합니다. 현재는 Complementary Reimagined 및 Unbound r5.9.3 두 개입니다. ZIP은 각 제작자의 공식 Modrinth에서 받아 배포하므로 GitHub에 직접 올리지 않습니다.

## 공지 바꾸기

디스코드 공지 채널에 글을 올리면 GitHub Actions가 [notices.json](notices.json)을 갱신합니다. GitHub 예약 실행은 지연될 수 있습니다. 런처를 켜 둔 동안에는 갱신된 공지를 약 60초마다 확인합니다.
