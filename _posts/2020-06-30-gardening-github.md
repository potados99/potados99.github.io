---
title: "1일 1커밋을 위한 약간의 트릭"
summary: "트릭이라고 쓰고 사기라고 읽어도 좋습니다(?)"
date: 2020-06-30 22:48:40 +0900
categories:
   - dev
---

## 들어가며

![github-grass.png](/assets/images/drobHY7.png)

GitHub 프로필에 들어가면 잔디밭이 보인다. 지난 1년간의 활동을 요약하여 보여 주는 화면인데, 빈 칸이 눈에 띈다.

한 칸이 하루에 대응된다. 하루에 1커밋씩 하면 모든 칸이 채워지는 것이다.

그럼 이제 잔디를 심어 보자.

## 알아두기

Git은 `GIT_AUTHOR_DATE`와 `GIT_COMMITTER_DATE` 환경변수를 사용한다. `commit`시에 이 변수들이 정의되지 않았다면 현재 날짜로 커밋을 만든다. 만약 변수들이 설정되어 있으면 변수에 주어진 날짜로 커밋을 만들고 해당 변수를 정의되지 않은 상태로 되돌린다. 즉, 일회용 날짜 지정용 변수이다.

## 아무 날짜로 커밋하기

지금 잔디밭에는 28일과 29일이 비어 있다. 해당 날짜에 대해 커밋을 만들어 보겠다.

~~~shell
$ git add assets/images/github-grass.png
$ GIT_AUTHOR_DATE=2020-06-28T12:00:00 GIT_COMMITTER_DATE=2020-06-28T12:00:00 git commit -m "Add asset"
~~~

위에 나온 잔디밭 사진을 추가하는 커밋이다. 글 작성 시점으로부터 이틀 전인 28일 날짜로 커밋을 생성하였다.

## 더 편하게 하기

`date -v -1d +%Y-%m-%dT%H:%M:%S` 명령으로 `ISO-8601` 포맷의 어제 날짜를 가져올 수 있다. 이틀 전 날짜는 `date -v -2d +%Y-%m-%dT%H:%M:%S` 하면 된다. `-{며칠전}d` 부분만 다르다.

이런 쉘 스크립트를 사용하면 N일 전 날짜로 커밋을 작성할 수 있다.

~~~shell
...

N=$1
shift

N_DAYS_BEFORE=$(date -v -"$N"d +%Y-%m-%dT%H:%M:%S)

GIT_AUTHOR_DATE=$N_DAYS_BEFORE GIT_COMMITTER_DATE=$N_DAYS_BEFORE git commit $@
~~~

## 편하게 써보기

> 스크립트는 [요기](https://gist.github.com/potados99/ce629c34270f3bfd247ac46b8cc4608c)에.

~~~shell
$ ./commit-n-days-before 1 -m "Add script."
[master 3a1a4f8] Add script.
 1 file changed, 29 insertions(+)
 create mode 100755 commit-n-days-before
~~~

헤헤.

## 마치며

![github-grass-filled.png](/assets/images/cNLjXg7.png)

마지막 잔디 두 칸이 찼다.

오늘부터는 빈 칸을 만들지 않을 계획이다. ㅎ
