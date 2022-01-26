---
title: "Traefik 인증서 수동으로 갱신하기"
summary: "Let's Encrypt 인증서에 문제가 생겨서 수동으로 갱신했습니다."
date: 2022-01-27 00:52:02 +0900
categories:
   - dev
---

어제 점심 즈음에 눈을 떠 보니 `Let's Encrypt`에서 이런 메일이 와 있었습니다:

![lets-ecrypt-urgent.png](/assets/images/lets-ecrypt-urgent.png)

> (생략)
>
> Let's Encrypt에서 TLS-ALPN-01 검증 방법과 아래 ACME 등록 ID를 사용해 발급된 TLS **인증서를 즉시 갱신해주세요**:  
>
> 223186000
>
> TLS-ALPN-01 챌린지에 문제가 있어서, 오늘 이전에 발급된 인증서들이 발행 요구사항을 만족하지 않을 수 있다고 판단하였습니다. 이 문제는 해결되었고, 해당 검증 방법을 통해 발행된 인증서들은 **2022년 1월 28일 16:00 UTC에 모두 폐기**할 예정입니다.
>
> (생략)

예전부터 자주 날아오던, 이제 안 쓰는 인증서의 만료 알림 같은 것인 줄 알았는데 이번에는 내용이 조금 달랐습니다.

인증서 발급 과정 중 TLS 챌린지(TLS-ALPN-01)에 문제가 있었으니, 영향 받은 인증서를 모두 갱신하라는 내용이었습니다.

ACME registration ID가 `223186000`인 인증서를 갱신하랍니다. 그런데 도메인도 안 알려주고 다짜고짜 저러니 조금 당황스러웠습니다.

어디에서 쓰이는 건지 도저히 감이 잡히지 않아 일단 터지면 큰일나는(?) 서비스부터 확인해 보았습니다.

지금 학교 내부용으로 운영중인 카페테리아 앱 서버에는 `Traefik` + `Let's Encrypt` 인증서가 올라가 있습니다.

인증서 파일은 Docker 볼륨 속에 들어 있었습니다. `docker volume inspect` 명령을 사용해서 알아봅니다.

```bash
$ docker volume inspect traefik_traefik-public-certificates
[
    {
        "CreatedAt": "2022-01-26T16:30:17Z",
        "Driver": "local",
        "Labels": {
            "com.docker.stack.namespace": "traefik"
        },
        "Mountpoint": "/var/lib/docker/volumes/traefik_traefik-public-certificates/_data",
        "Name": "traefik_traefik-public-certificates",
        "Options": null,
        "Scope": "local"
    }
]
```

마운트 포인트가 보입니다. 저기로 가서 `acme.json` 파일을 열어봅니다.

`uri`를 보니까 이 인증서가 맞는 것 같습니다.

![inside-acme-json.png](/assets/images/inside-acme-json.png)

갱신하려면?

![renew-le-cert-traefik.png](/assets/images/renew-le-cert-traefik.png)

그냥 저 `acme.json` 파일을 지우면 됩니다.

하라는 대로 지우고 `Traefik`을 재실행했더니 `acme.json`이 다시 생겼습니다.

![inside-acme-json-renewed.png](/assets/images/inside-acme-json-renewed.png)

ACME registration ID가 바뀌어 있습니다. 이번에는 `381472840`이네요.

잘 해결되었습니다.

인증서 문제는 참 골치아픈 것 같습니다. 사실 작년 가을 무렵에도 [구형 시스템에서 Let's Encrypt 인증서가 신뢰되지 않는 이슈](https://community.letsencrypt.org/t/hi-from-october-1st-2021-on-worlds-lets-encrypt-ssl-old-certificates-not-working-old-operating-systems-how-to-update-it/162316)가 있었습니다. 어렵지만 매번 부지런히 대응하는 수밖에 없겠습니다.
