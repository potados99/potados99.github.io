---
title: "브라우저 하이재커 제거하기"
summary: "어도비 플래시 플레이어 업데이트인줄 알고 설치했다가 당했습니다."
date: 2020-09-02 22:23:20 +0900
category: digging
---

## 들어가며

나에게도 이런 일이 일어날 줄 몰랐다.

사파리 상단 주소창에 키워드를 넣고 검색을 하면 구글로 이어져야 했는데, 이상하게도 야후로 이어졌다.

다른 브라우저도 마찬가지였다.

증상을 검색해보니, 이상한 프로그램이 달라붙은 것이 확실했다.

## 증상

사용자의 검색 요청을 `search.validplatform.com`라는 곳으로 리다이렉트한다. 이는 다시 `sg.search.yahoo.com`로 이어진다.

## 원인 파악하기

액티비티 모니터를 열어 프로세스 목록을 보는데, 상위에 `PublicCharacterSearch`라는 프로세스가 떠 있었다. 자세히 보니 이 녀석은 `PublicCharacterSearchDaemon`이 스폰한 것이었다.

구글에 검색해보니 증상이 일치했다. 이 녀석이 바로 야후로 리디렉션을 일으키는 녀석이었다.

## 실행파일 지우기

아무리 프로세스를 죽여 보아도 자꾸 실행되니 실행 파일을 지워야 했다.

맥의 액티비티 모니터에서는 프로세스의 실행 파일 위치를 알 수가 없어 `ps` 명령어를 사용하였다.

~~~
$ ps aux | grep PublicCharacterSearch                             
root             96376  10.2  0.9  4608096  74252   ??  S    10:07PM   0:07.70 /var/root/.PublicCharacterSearch/PublicCharacterSearch --mode socks5 --showhost -q -s /var/root/.PublicCharacterSearch/PublicCharacterSearch.py
root             96361   0.7  0.1  4350228   9820   ??  Ss   10:07PM   0:00.56 /var/root/.PublicCharacterSearch/PublicCharacterSearchDaemon pd
potados          97572   0.0  0.0  4268176    564 s001  S+   10:10PM   0:00.00 grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn Public
root             96374   0.0  0.1  4317620  11152   ??  S    10:07PM   0:00.24 /var/root/.PublicCharacterSearch/PublicCharacterSearch --mode socks5 --showhost -q -s /var/root/.PublicCharacterSearch/PublicCharacterSearch.py
~~~

해당 파일은 `/var/root/.PublicCharacterSearch/PublicCharacterSearch`에 위치한다.

어떻게 루트 권한이 필요한 디렉토리까지 진입했는지는 알 수가 없지만 아무튼 삭제했다.

~~~
$ rm -rf /var/root/.PublicCharacterSearch/
~~~

## 프로파일 지우기

검색하다가 발견하였는데, `PublicCharacterSearch`는 사용자의 맥에 프로파일 또한 설치하는 모양이다. `설정->프로파일`에서 해당 이름을 가진 프로파일을 두 개 발견하였다. 바로 삭제하였다.

## 프록시 설정 되돌려놓기

모든 조치를 끝냈다고 생각했는데, 웹페이지로 연결에 자꾸 실패하였다. 네트워크는 살아있는데 이상하다 싶어 크롬을 열어 보았다.

![chrome-for-the-win.png](/assets/images/opNjfgk.png)

사파리는 불친절한 편이었다. 크롬은 `ERR_PROXY_CONNECTION_FAILED`라고 친절하게 알려준다.

![proxy-setting.png](/assets/images/YeGJBTz.png)

설정으로 따라가보니 설정한 적도 없는 이상한 프록시가 연결되어 있었다.

`SOCKS` 프록시였다. 어디선가 본 듯 한 단어이다.

`PublicCharacterSearch` 프로세스에 인자로 넘어간 것을 보자.

~~~
/.../PublicCharacterSearch --mode socks5 ...options...
~~~

다른 옵션은 너무 길어서 생략했다. `--mode`를 `socks5`로 지정한 것을 볼 수 있다.

해당 프로세스가 CPU를 꾸준히 점유하고 있었던 점, 종료 후 HTTP 연결을 수립할 수 없었던 점, 실행 인자에 프록시 모드 설정이 있었던 점으로 미루어 보아, **`PublicCharacterSearch`는 로컬호스트 8080에 프록시 서버를 열어놓고, 구글 검색하는 트래픽을 엉뚱한 곳으로 돌려버리는 프로그램**인 것으로 추정된다.

## 결론

아무거나 막 깔지 말자. ㅠㅠ

## Reference

- https://malwaretips.com/blogs/remove-publiccharactersearch/
