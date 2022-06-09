---
title: "ASP.NET의 런타임"
summary: "ASP.NET과 IIS"
date: 2022-06-03 21:33:04 +0900
categories:
   - dev
---

ASP.NET을 사용하는 프로젝트에 참여하게 되었습니다. 열심히 개발하다가 문득 애플리케이션의 구동 환경에 궁금함이 생겨 정리해보았습니다.

## IIS

> 이 글에서는 IIS 7 및 그 이후 버전에 대해 다룹니다.

IIS(Internet Information Services)는 웹 서버입니다. ASP.NET 앱이 인터넷을 통해 상호작용하도록 도와주며, 사용자의 요청을 받아 처리하고 응답합니다.

IIS 위에서 굴러가는 ASP.NET 애플리케이션이 요청을 받아 처리하고 응답하기까지의 과정을 요약하면 다음과 같습니다:

1. 사용자가 브라우저를 통해 HTTP 요청을 보냅니다. HTTP.sys가 요청을 포착합니다.
2. HTTP.sys는 설정 저장소로부터 정보를 얻기 위해 WAS에게 부탁합니다.
3. WAS는 설정 저장소(applicationHost.config)에서 정보를 꺼내옵니다.
4. 이제 WWW service가 설정 정보를 받았습니다(애플리케이션 풀, 사이트 설정 등).
5. WWW service가 그 정보를 가지고 HTTP.sys를 설정합니다.
6. WAS가 해당 요청이 바라보는 애플리케이션 풀에 worker 프로세스를 띄웁니다.
7. Worker 프로세스가 요청을 처리하고 HTTP.sys에게 결과를 돌려줍니다.
8. 사용자가 응답을 받습니다.

![Svchost exe.png](/assets/images/Svchost_exe.png)

많은 친구들이 등장합니다. 하나씩 살펴보겠습니다.

## IIS를 이루는 것들

IIS는 세 개의 부분으로 이루어집니다.

### Protocol Listener

Protocol Listener는 요청을 받아서 IIS에게 넘기고, 처리가 끝나면 만들어진 응답을 전달합니다.

위에 등장한 HTTP.sys는 HTTP와 HTTPS(IIS 7부터)를 지원하는 protocol listener입니다. IIS는 HTTP 요청을 처리하기 위해 HTTP.sys를 기본으로 사용합니다.

> HTTP.sys는 커널 모드에서 작동합니다. IIS 6 이전에는 유저 모드에서 구동되는 Winsocket이 사용되었으나, HTTP.sys로 대체되었습니다.

> 커널 모드에서 작동하기 때문에 좋은 점이 몇 가지 있습니다. 유저 모드로 전환하지 않고도 캐시된 응답을 내보낼 수 있습니다. 그리고 커널이 요청을 직접 worker 프로세스로 전달하기 때문에 컨텍스트 스위칭 부담이 적습니다.

### World Wide Web Publishing Service (WWW service)

> W3SVC라고도 합니다.

익숙한 이름인데 어째 낯선 친구입니다.

예전(IIS 7 이전)에는 WWW service가 HTTP 설정과 worker 프로세스를 관리했습니다.

IIS 7부터는 프로세스 관리 기능이 WAS로 떨어져 나갔습니다. 이제 WWW service는 HTTP.sys와 WAS 사이에 위치한 listener 어댑터만으로 기능합니다.

설정을 읽어 HTTP.sys에 적용하고, 설정이 바뀌었을 때에 HTTP.sys를 업데이트합니다. 그리고 새 요청이 요청 큐에 담겼을 때에 이를 WAS에게 알려줍니다.

### Windows Process Activation Service (WAS)

여기도 익숙한 이름이지만 Web Application Server가 아님에 주의해주세요😉

WAS는 애플리케이션 풀 설정과 worker 프로세스를 관리합니다.

IIS 6까지는 WWW service가 프로세스 관리까지 맡았지만 IIS 7부터는 이를 WAS가 담당합니다.

WAS는 HTTP와 무관합니다. 그렇기 때문에 HTTP가 필요하지 않으면 WWW service 없이도 WAS를 굴릴 수 있습니다.

IIS가 켜질 때, WAS는 applicationHost.config 파일에서 정보를 읽어 listener 어댑터(WWW service)에게 넘겨줍니다. 그러면 어댑터는 딸린 protocol listener를 설정하여 요청을 들을 준비가 되게 합니다.


## References

- [What is IIS - Internet Information Server](http://net-informations.com/faq/asp/iis.htm)

- [Introduction to IIS Architectures | Microsoft Docs](https://docs.microsoft.com/en-us/iis/get-started/introduction-to-iis/introduction-to-iis-architecture)

- [IIS Request Processing | Microsoft Docs](https://docs.microsoft.com/en-us/previous-versions/iis/6.0-sdk/ms524901(v=vs.90))
