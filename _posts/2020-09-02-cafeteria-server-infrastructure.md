---
title: "[서버] 카페테리아 서버 운영 환경 구축하기"
date: 2020-09-02 21:50:24 +0900
categories:
   - dev
---

## 들어가며

[앱센터](https://github.com/inu-appcenter)에서 운영하는 서비스 중에 가장 수요가 많은 `카페테리아`는 멤버십 할인 혜택을 제공하기 때문에 **서비스가 항상 유지되어야 한다.**

따라서 서버 배포/운영에서 실수 또는 업데이트로 인한 다운타임이 생겨서는 안 된다.

## 그린-블루 배포

`그린-블루 배포는` 훌륭한 무중단 배포 방식이다. 기본적인 발상은 운영중인 서버와 똑같은 환경을 하나 더 구성하여 업데이트/실행한 뒤 트래픽을 이전 환경에서 새 환경으로 보내는 것이다.

카페테리아 서버가 의존하는 AWS는 그린-블루 배포를 위한 타겟 그룹이나 스케일링 그룹, 로드 밸런싱 등 고오급 기능들을 제대로 지원한다. 하지만 이 서비스는 수요가 그리 많지 않고 예산이 넉넉하지 않기 때문에 약간 변형된 방식을 사용하기로 했다.

| | In-place 배포 | Green-blue 배포 | (변종)저예산 무중단 배포 |
|-|-|-|-|
| 설명 | 하나의 서버 그룹에서 각각의 인스턴스들이 업데이트를 수행하는 동안 다른 인스턴스들이 트래픽을 부담 | 최신의 서버 그룹을 통째로 하나 더 생성 후 트래픽 이전 | 단일 서버 인스턴스 내에서 새로운 애플리케이션 프로세스를 실행하여 리버스 프록시로 트래픽을 이전 |

그린-블루 배포의 발상만 가져와 '서버 환경의 복제'를 '단일 서버 내에서 서버 프로세스의 복제'로 축소시켰다.

서버 그룹 같은 것은 없고, 딱 서버 한 대 뿐이다. 로드 밸런서의 역할은 서버 내부의 리버스 프록시가 한다.

서버 내에는 두 개의 애플리케이션 프로세스(인스턴스라고 부른다)가 실행된다. 리버스 프록시는 트래픽을 이 인스턴스 중 하나로 연결한다.

만약 20201번 포트에서 listen하는 인스턴스(A, 그린 역할)가 서비스 트래픽을 감당하고 있을 때에 새로운 배포를 진행하고자 한다면, 20202번 포트에서 listen하는 인스턴스(B, 블루 역할)를 업데이트한 뒤에 리버스 프록시를 블루 인스턴스로 이어주면 된다.

## 게으름을 추구

배포를 해보자.

아무런 도구도 없다고 해 보자.

> 먼저 어떤 인스턴스가 돌아가고 있는지 알아야 한다. 인스턴스 A(20201포트)가 실행중일까?    
~~~
$ lsof -i tcp:20201 | grep LISTEN
~~~
없으면 20202포트로 확인해본다.    
~~~
$ lsof -i tcp:20202
node    1671 potados   25u  IPv4  18709      0t0  TCP *:20201 (LISTEN)
~~~
인스턴스 B가 실행중이었다.    
트래픽은 B로 잘 가고 있었을까?    
~~~
$ cat /etc/nginx/conf.d/cafeteria*
server {
    listen 8080;
    server_name cafeteria_instanceB;    
    location / {
        proxy_pass	http://127.0.0.1:20202;
    }
}
~~~
20202번 포트로 잘 이어져 있었다.    
자 그러면 이제 20201번 포트를 사용하는 인스턴스 A를 업데이트하면 된다.     
먼저 인스턴스 A가 위치할 곳에 가서 소스를 내려받는다.     
~~~
$ git clone https://github.com/inu-appcenter/cafeteria-server.git
~~~
앱 디렉토리로 가서 의존성도 설치해준다.     
~~~
$ cd cafeteria-server && npm install
~~~
이제 실행해줄 차례다.     
~~~
$ nohup npm start -- --host=$HOST --port=20201 --log-dir=../logs > /dev/null &
~~~
잘 실행되었을까?     
~~~
$ curl -s -o /dev/null -w "%{http_code}" "127.0.0.1:$port/documentation"
200
~~~
제대로 응답한다.     
이제 nginx 리버스 프록시 설정을 바꿔준다.     
~~~
$ sudo rm -f /etc/nginx/conf.d/cafeteria*.conf &&
$ sudo cp ~/.cafeteria/config.d/cafeteria_instanceA.conf /etc/nginx/conf.d/ &&
~~~
바꿔주었으면 이제 적용한다.     
~~~
sudo systemctl reload nginx
~~~     
이제 배포가 끝났다.

나는 게으르기 때문에 명령어 하나만 치면 모든 것이 해결되는 것을 선호한다.

그래서 스크립트를 짜야겠다고 마음을 먹었는데, 초안을 작성해보니 실제 상황에서의 맞닥뜨릴 수 있는 문제들에 대해 상당히 융통성이 떨어졌다.

예를 들어 배포 스크립트 실행 중에 인터럽트가 걸렸다고 해보자. 어디까지가 진행되었고 어디부터 다시 해야 하는지 모른다. 그래서 하나하나 체크해 보아야 한다. 인스턴스 버전은 몇인지, 인스턴스가 제대로 응답하는지, 리버스 프록시는 어떤 인스턴스로 연결되는지, 설정은 적용된 것인지 등등.

위의 체크 사항들은 이미 커다란 배포 스크립트 안에 포함된 것들이다. 이를 잘게 쪼개면 더 사용하기 편하지 않을까 싶었다.

## 하나의 일을 잘 할 수 있게 만들 것

긴 스크립트는 징그럽다.

유닉스 철학을 따르기로 했다. 이름값을 하는(= 이름만 보고 누구나 코드를 떠올릴 수 있을 정도) 작은 스크립트를 여러 개 만들어서 사용하기로 했다.

이 정도로 요약해 보았다.

### 식별

- `disabled-instance`: 프록시에 연결되지 않은(비활성화된) 인스턴스의 이름을 가져옴.
- `disabled-port`: 비활성화된 인스턴스가 사용하는 포트를 가져옴.
- `enabled-instance`: 프록시에 연결된(활성화된) 인스턴스의 이름을 가져옴.
- `enabled-port`: 프록시에 연결된 인스턴스가 사용하는 포트를 가져옴.
- `pid`: 인자로 주어진 인스턴스의 프로세스 id를 가져옴.

### 동작

- `start-instance`: 인자로 주어진 인스턴스를 실행함.
- `stop-instance`: 인자로 주어진 인스턴스를 종료함.
- `update-instance`: 인자로 주어진 인스턴스를 종료 후 업데이트함.
- `connect-to-nginx`: 인자로 주어진 인스턴스를 리버스 프록시에 연결함.

### 고수준 동작

- `install`: 서버 셋업 전 과정을 자동으로 수행함.
- `deploy`: 배포 전 과정을 자동으로 수행함.
- `status`: 인스턴스와 프록시 연결 상태를 표시함.

### 기타

- `bootup`: 시스템이 시작될 때에 on shot으로 실행될 스크립트. 리버스 프록시에 연결된 인스턴스를 실행함.

고수준 스크립트는 여러 개의 저수준 스크립트로 이어진다. 예를 들어, `deploy`는 어떤 인스턴스를 업데이트할 지 결정한 후에 `update-instance`, `start-instance`, `connect-to-nginx`를 연달아 실행한다.

각각의 작은 스크립트들은 별도로 실행할 수 있어서, 배포와 운영 과정에 예상치 못한 일이 일어나도 명령어를 몰라서 구글 검색하러 자리를 비우지 않아도 된다.

## 설치와 배포

실제 운영 서버의 쉘에서 직접 무언가 작업을 한다는 것이 썩 좋은 일은 아니다. 요즈음 어지간한 서비스 운영사들은 다 고오급진 GUI 웹 콘솔을 사용해서 서버를 모니터링하고 제어할 것이다.

일단 서버에서 수동 조작이 필요한 때를 위해 스크립트를 만들어 놓긴 했는데, 이를 정해진 디렉토리에 배치하고 PATH를 설정하고, nginx 설정 파일을 복사하고 하는 일련의 작업들을 따로 수행하는 것도 지저분한 일이다.

아무 것도 없이 딱 DB만 설치된 환경에, 명령어 단 몇 줄로 서버 환경을 셋업할 수 있으면 좋지 않을까. 하여 이 모든 준비 작업을 수행하여 주는 설치 스크립트 `install`을 만들었다.

그런데 이 모든 것들이 서버 애플리케이션 자체와는 조금 거리가 먼 내용들이다. 그래서 설치 프로그램의 개념으로 `cafeteria-server-deploy`라는 저장소로 분리하였다.

서버에 애플리케이션을 배포하려면 이제 위 저장소를 클론한 다음 `install`을 실행하여 지시에 따르면 모든 일이 끝난다. 참으로 편하다.

## AWS 콘솔을 통해 배포

위에서 언급했다시피, 실 서버에 ssh 접속을 하는 것은 좋지도 않고 무섭기만 하다. 그래도 배포 명령은 누군가 실행해줘야 한다.

찾아보니 AWS가 `System Manager`라는 것을 제공하는데, 이걸 써서 EC2 인스턴스에서 쉘 명령을 실행할 수가 있다고 한다.

다음 명령을 실행해 주면 배포가 일어난다.

~~~
runuser -l potados -c '/home/potados/.cafeteria/bin/deploy'
~~~

## 결론

개발만 하면 되는 줄 알았는데 참 복잡하다.

이제 AWS 웹 콘솔로 클릭 한 번만 하면 배포가 일어나고 결과도 볼 수 있다(더 적절한 CodeDeploy도 있는데, 내 취향이 아닌 듯 싶어 이번 프로젝트에는 사용하지 않았다).

여차하면 직접 쉘 띄워서 무슨 일이 일어나는지 볼 수도 있게 해 놓았다.

이제 서버 때문에 쫄릴 일은 없길 기대한다...

## Reference

- https://www.redhat.com/ko/topics/devops/what-is-blue-green-deployment
- https://wallees.wordpress.com/2018/04/22/blue-green-방식/
- https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/run-command.html
- https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-rc-setting-up-cwlogs.html
- https://www.cyberciti.biz/open-source/command-line-hacks/linux-run-command-as-different-user/