---
title: "아두이노에서 Socket.IO 사용해보기"
summary: "아두이노에서 Socket.IO 클라이언트를 돌리기 위해 삽질한 내용을 공유합니다."
date: 2021-01-24 03:08:16 +0900
categories:
   - dev
---

웹 소켓이 무엇인지는 *폴링 없이 데이터를 주고받을 수 있게 해준다*는 정도만 알았고 직접 써본 적은 없었습니다. 그게 실제로 구동되는 실체를 본 것은, 카카오톡 뉴스의 댓글 부분이었습니다.

댓글마다 추천/비추천 버튼이 있는데, 이게 그냥 놔두어도 자동으로 업데이트됩니다. 신기해서 브라우저 콘솔을 열어보니 `Sockets`라고 눈에 띄는 부분이 있어 살펴 보았습니다.

![daum-news-websocket.png](/assets/images/daum-news-websocket.png)

> 댓글 정보가 알아서 업데이트됩니다.

30초마다 심장박동(`heartbeat`)을 보내는 웹소켓 연결이 구성되어 있었고, 그 소켓으로 실시간 댓글 정보가 업데이트되고 있었습니다.

아무튼 여러 모로 쓸모있는 녀석이구나 정도로만 생각만 하고 있다가, 최근에 어떤 아이디어가 떠올랐습니다.

***아두이노를 사용하는 IoT 프로젝트에 웹소켓을 써보면 어떨까?***

왜 하필 웹 소켓을 선택했냐면요...

- 노드는 서버에게 자신의 데이터를 보낼 수 있어야 합니다.
- 동시에 서버로부터 데이터 전송 요청을 받아 즉각적으로 새 데이터를 보낼 수 있어야 합니다.

노드는 기본적으로 데이터를 서버로 전달하는 역할이라 `노드->서버` 단방향 데이터 흐름으로도 충분할 것 같았지만, **데이터의 실시간성을 위해서는 전송 주기를 줄여야 하고, 이는 배터리와 네트워크에 부담으로 작용합니다.**

이를 극복하려면 서버가 새로운 데이터를 원할 때에만 전송이 이루어지도록 해야 합니다. 그리고 이 시나리오에는 웹소켓을 사용하는 것이 적절하다고 판단했습니다.

## WebSocket

웹 소켓은 TCP를 기반으로 양방향 연결을 만들어 주는 프로토콜입니다. 보통 이런 식으로 씁니다.

~~~html
<script>
  const socket = new WebSocket("ws://도메인/경로");

  wSocket.onopen = function(e){
    alert("연결됨!");
  }
  wSocket.onclose = function(e) {
    alert("종료됨!");
  }  

  socket.onmessage = function (e) {
    // 서버에서 메시지가 왔어요.
    alert(e.data);  
  }  

  function send(data) {
    // data라고 서버에 보냅니다.
    wSocket.send(data);
  }
</script>
~~~

간단합니다. 그런데 웹 소켓을 직접 사용하지는 않고 [Socket.IO](https://socket.io)을 사용했습니다.

## Socket.IO

`Socket.IO`는 [공식 문서](https://socket.io/docs/v3/)에 따르면 `WebSocket` API의 얇은 wrapper입니다.

조금 더 자세히 들어가면 다음과 가깝습니다.

- 실제 일은 `Engine.IO`라는 친구가 다 합니다.
- `Socket.IO`는 `Engine.IO`가 제공하는 raw API의 wrapper에 가깝습니다.
- `Engine.IO`는 `WebSocket`을 사용할 수도, 사용하지 않을 수도 있습니다.
- `Engine.IO`는 연결 직후에는 HTTP long polling을 사용하다가 `HTTP Upgrade` 메커니즘을 통해 `WebSocket`으로 갈아탑니다.

`Socket.IO`의 핵심은, 97%에 달하는 브라우저 호환성을 보장하는 것, 기존 HTTP 프록시와 로드밸런서를 그대로 사용할 수 있다는 것과, **패킷에 여러 메타데이터를 붙인다**는 것입니다.

> `Socket.IO`는 `WebSocket`을 전송 계층으로 사용할 뿐, 패킷에 추가적인 데이터를 덧붙이기 때문에 기존 `WebSocket` 서버 또는 클라이언트와는 연결할 수 없습니다.

`Socket.IO`의 메시지에는 다음과 같은 정보가 들어갑니다:

- `type`: 메시지의 타입입니다. `CONNECT(0)`, `DISCONNECT(1)`, `EVENT(2)`, `ACK(3)`, `CONNECT_ERROR(4)`, `BINARY_EVENT(5)`, `BINARY_ACK(6)`, 이렇게 7개가 있습니다.
- `nsp`: 메시지의 네임스페이스입니다.
- `data`: 메시지의 페이로드입니다. `JSON` 배열 형식으로, 여러 데이터가 들어갈 수 있습니다.
- `id`: 메시지의 id입니다.

예를 들어보겠습니다.

- `2["hello",1]`: `hello`라는 이벤트에 `1`이라는 페이로드를 담아 보내는 메시지입니다.
- `2/admin,456["project:delete",123]`: `/admin` 네임스페이스에서 `project:delete`라는 이벤트에 대해 `123`이라는 페이로드를 담아 보내는 메시지입니다.

그냥 `WebSocket`이 스트링만 달랑 보내는 것에 비해 더 할 수 있는 게 조금 더 많습니다. 네임스페이스를 정해 트래픽을 격리할 수 있고, 데이터 여러 개를 `JSON` 형식으로 주고받을 수 있습니다.

서론이 길었네요. 서버 쪽으로 넘어가보겠습니다.

## Socket.IO 서버

[예제](https://socket.io/docs/v3/#Minimal-working-example)를 먼저 보겠습니다. 엄청나게 간단합니다.

~~~javascript
const io = require('socket.io')(3000);

io.on('connection', socket => {
  // either with send()
  socket.send('Hello!');

  // or with emit() and custom event names
  socket.emit('greetings', 'Hey!', { 'ms': 'jane' }, Buffer.from([4, 3, 3, 1]));

  // handle the event sent with socket.send()
  socket.on('message', (data) => {
    console.log(data);
  });

  // handle the event sent with socket.emit()
  socket.on('salutations', (elem1, elem2, elem3) => {
    console.log(elem1, elem2, elem3);
  });
});
~~~

이 정도만 해도 서버는 제대로 작동합니다. 이제 가장 중요한 아두이노쪽으로 넘어가 보겠습니다 ~~오늘의 하이라이트~~.

## Arduino에서 Socket.IO 클라이언트 구축하기

일단 인터넷 연결이 필요합니다. 마침 굴러다니는 `ESP32` 개발 보드가 있어 사용했습니다.

> WEMOS LOLIN D32 보드를 사용했습니다. 와이파이와 블루투스를 지원합니다. 만세!

아두이노에서 사용할 수 있는 `Socket.IO` 구현체를 열심히 검색하여 아래 두 후보를 추렸습니다.

- [arduinoWebSockets](https://github.com/Links2004/arduinoWebSockets)
- [ArduinoWebsockets](https://github.com/gilmaimon/ArduinoWebsockets)

이 중 첫 번째가 압도적으로 별이 많이 찍혀 있어 사용했습니다.

> [arduinoWebSockets](https://github.com/Links2004/arduinoWebSockets)는 활발하게 관리되고 있고 이슈 대응도 빠릅니다. 이슈 오픈한지 5분만에 답이 달렸습니다.

모든(?) 아두이노 라이브러리는 `example` 디렉토리에 예제를 가지고 있습니다. `Socket.IO` 클라이언트로 사용하는 [예제](https://github.com/Links2004/arduinoWebSockets/blob/master/examples/esp8266/WebSocketClientSocketIO/WebSocketClientSocketIO.ino)를 보겠습니다.

~~~c++
// ...적절한 헤더 파일과 기타 전역변수 선언...

SocketIOclient socketIO;

void socketIOEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case sIOtype_DISCONNECT:
          // ...적절한 코드...
        case sIOtype_CONNECT:
            // ...적절한 코드...

            // join default namespace (no auto join in Socket.IO V3)
            socketIO.send(sIOtype_CONNECT, "/");
            break;
        case sIOtype_EVENT:
            // ...적절한 코드...
        case sIOtype_ACK:
            // ...적절한 코드...
        case sIOtype_ERROR:
            // ...적절한 코드...
        case sIOtype_BINARY_EVENT:
            // ...적절한 코드...
        case sIOtype_BINARY_ACK:
            // ...적절한 코드...
    }
}

void setup() {
  // ...인터넷에 연결하는 적절한 코드...

  // server address, port and URL
  socketIO.begin("10.11.100.100", 8880);

  // event handler
  socketIO.onEvent(socketIOEvent);
}

void loop() {
  socketIO.loop();

  // ...지정된 시간마다 서버로 메시지를 보내는 코드...
}
~~~

이대로만 실행하면 아무 문제 없을 것 같습니다.

## 연결이 안 돼요

되라는 연결은 안 되고 5초마다 연결이 끊겼다는 메시지만 시리얼 모니터에 출력되었습니다. 그런데 디버그 출력도 없어 원인을 찾아내는 데에 어려움을 겪었습니다.

> `arduinoWebSockets` 라이브러리는 디버그 출력을 지원하지만 그걸 활성화하는 과정에서 매우 많은 삽질을 하다가 결국 포기했습니다... ㅠ

서버 쪽을 보아도 아무 것도 출력되지 않았습니다. 여기서 궁금해지기 시작했습니다. 과연 연결을 시도하긴 한 걸까? 알아내기 위해 WireShark를 켰습니다.

![eio3-bad-request.png](/assets/images/eio3-bad-request.png)

`/socket.io/?EIO=3&nodeName=Watcher&transport=polling`으로 `GET`을 날렸는데 `400 Bad Request`가 왔습니다.

![루피 ???](https://item.kakaocdn.net/do/58119590d6204ebd70e97763ca933baf82f3bd8c9735553d03f6f982e10ebe70)

> 아니 왜????

도저히 원인을 찾을 수가 없어 그냥 다 포기했습니다.

~~하하..아하하하ㅏㅏ하하하하ㅏ~~

머리를 좀 식히고 문서와 GitHub 저장소를 돌아보았습니다. 그러다가 최신 버전인 3.1.0 릴리즈 로그를 보았습니다.

![socketio-3.1.0-release-log.png](/assets/images/socketio-3.1.0-release-log.png)

`allowEIO3`가 기본으로 `false`라고 합니다. 아, 클라이언트가 요청 시에 `Engine.IO`의 버전을 지정할 수 있나 봅니다. 그런데 `EIO3`라.. 뭔가 익숙합니다. 아까 WireShark로 본 HTTP 요청에 `EIO=3`라는 쿼리 파라미터가 있었습니다.

즉, 서버는 `Engine.IO` v3을 사용하는 요청을 기본으로 막아놓고 있었기 때문에 아두이노의 `EIO=3` 연결 요청이 실패한 것이었습니다.

그렇다면 아두이노 쪽에서 왜 그런 파라미터가 붙어서 날아가는지 보니 arduinoWebSockets 라이브러리의 [`SocketIOclient.h` 49번째 줄](https://github.com/Links2004/arduinoWebSockets/blob/900d81e5345fe2dbe74fd175749c80e2bbda2f00/src/SocketIOclient.h#L49)에 이유가 있었습니다.

~~~c++
void begin(const char * host, uint16_t port, const char * url = "/socket.io/?EIO=3", const char * protocol = "arduino");
~~~

`url` 인자 기본값이 `/socket.io/?EIO=3`이었습니다. 기본 인자가 사용되지 않도록 `/socket.io/?EIO=4`를 넘겨 주니 제대로 연결되기 시작했습니다.

그런데...

~~고통이 끝나지 않습니다...~~

## 연결이 자꾸 끊어져요!

그렇게 힘들게 만든 연결이 대략 20초마다 끊어지고 새로 생기기를 반복했습니다. 물론 자동 연결이 지원되기 때문에 사용상에 문제는 없었지만 매우 거슬렸습니다.

공유기가 문제인가 싶어 인터넷 연결도 테스트 해 보고, 기기들끼리 너무 다닥다닥 붙어있어서 그런가 싶어 떨어뜨려도 보았지만, 연결 끊김을 피할 수 없었습니다.

![disconnection](https://www.margotandersen.com/wp-content/uploads/2016/08/Disconnection.jpg)

> 이토록 연결이 불안정해서야...ㅠ

라이브러리 저장소 [이슈](https://github.com/Links2004/arduinoWebSockets/issues)에서 *disconnects* 키워드로 검색을 해 보니 비슷한 사례가 몇 개 나왔습니다. 슬프게도 해결책은 찾지 못했습니다.

머리를 굴리기 시작했습니다.

![전자두뇌!](https://mblogthumb-phinf.pstatic.net/MjAyMDAzMTJfMTEx/MDAxNTgzOTkzMDI3MjA5.a1WDJUSvZyVcP4l059gOgqmKNlu54MgNEWUSLHZesRgg.J7Rm3Kl5rL-jgg5J-5PH16jXNbTi5y9OyZEIMoYLK50g.PNG.doa_kagi/무도_정준하_전자두뇌.PNG?type=w800)

> 두뇌 풀가동!

만약 서버가 보낸 무언가로 인해 연결이 끊어지는 것이라면 이벤트에 반응하는 콜백, 또는 그 콜백을 실행하는 코드에서 실마리를 찾을 수 있을 것입니다. 만약 클라이언트가 보내는 무언가로 인해 연결이 끊어지는 경우라면, 이를 차단하면 연결 끊김을 막을 수 있을 것입니다.

전자의 경우에는 문제가 없었습니다. 노드는 서버의 메시지를 정상적으로 수신할 수 있었습니다. 그래서 클라이언트가 서버로 무언가를 보낼 여지가 있는, 라이브러리의 `loop()`함수를 관찰하기 시작했습니다.

~~~c++
void SocketIOclient::loop(void) {
    WebSocketsClient::loop();
    unsigned long t = millis();
    if((t - _lastConnectionFail) > EIO_HEARTBEAT_INTERVAL) {
        _lastConnectionFail = t;
        DEBUG_WEBSOCKETS("[wsIOc] send ping\n");
        WebSocketsClient::sendTXT(eIOtype_PING);
    }
}
~~~

클라이언트가 지정된 시간마다 서버로 `PING`을 보내도록 구현되어 있었습니다. 그리고 그 시간은 20초였습니다.

~~~c++
#define EIO_HEARTBEAT_INTERVAL 20000
~~~

연결이 끊어지는 주기와 일치했습니다. `WebSocketsClient::sendTXT(eIOtype_PING)` 호출이 의심되었습니다. 해당 호출 직전에 `Serial.println()` 호출을 두어 연결 끊김과 ping의 발생 시각을 관찰하였습니다.

![arduino-socket-keep-disconnecting.png](/assets/images/arduino-socket-keep-disconnecting.png)

그리고 **`PING` 전송 시도 직후에 연결이 끊어지는 것**을 확인할 수 있었습니다.

## `PING`을 거부하는 서버?

서버가 클라이언트의 `PING`을 거부하고 있었습니다.

다시 머리를 굴려보았습니다.

![전자두뇌2](https://byline.network/wp-content/uploads/2018/08/전자두뇌-1280x720.jpg)

> 지금 자면 몇 시에 일어나지...

아까 `begin()` 함수의 `url` 파라미터 기본값이 `/socket.io?EIO=3`였던 것을 상기해 보았습니다.

이를 통해 **arduinoWebSockets 라이브러리가 `Engine.IO` v3에 맞춰 작성되어 있다**고 추측할 수 있었습니다. 반면 **연결은 `EIO=4`를 사용**해서 수립했구요.

arduinoWebSockets 라이브러리가 `Engine.IO` v4에 맞지 않는 동작을 할 수도 있겠다는 의심을 했습니다. 그리고 `Engine.IO` v4 [릴리즈 로그](https://socket.io/blog/engine-io-4-release/)에서 실마리를 찾았습니다.

![eio4-breaking-change.png](/assets/images/eio4-breaking-change.png)

> 앞으로는 서버가 ping을 보내면 클라이언트가 pong으로 답한다고 합니다.

`Engine.IO` v3 까지는 클라이언트가 주기적으로 `PING`을 서버에게 보내면 서버가 `PONG`으로 답하였다고 합니다. 그런데 클라이언트에서 타이머가 지연되어 `PING`을 조금 늦게 보내면 서버는 클라이언트가 죽었다고 판단해 연결을 끊는 이슈가 있었다고 합니다.

그래서 **서버가 `PING`을 보내면 클라이언트가 `PONG`으로 받아치도록 heartbeat 메커니즘을 뒤집은(reversal) 것**입니다.

그러니까, `Engine.IO` v4 클라이언트는 서버에 `PING`을 보낼 필요가 없던 것입니다. 그래서는 안 되는 것이기도 하구요.

결국 연결이 자꾸 끊어지던 문제는 클라이언트가 `Engine.IO` v4를 사용해 연결한 상태에서 20초마다 `PING`을 보냈기 때문에(=해서는 안 되는 짓) 발생한 것입니다..

해결책은 간단합니다. `PING`을 보내는 코드를 지워버리면 됩니다.

~~~c++
void SocketIOclient::loop(void) {
    WebSocketsClient::loop();
    unsigned long t = millis();
    if((t - _lastConnectionFail) > EIO_HEARTBEAT_INTERVAL) {
        _lastConnectionFail = t;
        DEBUG_WEBSOCKETS("[wsIOc] send ping\n");

        // 보내지 마 ping!
        // WebSocketsClient::sendTXT(eIOtype_PING);
    }
}
~~~

**해결!**

이제 몇 시간을 놓아 두어도 연결이 잘 유지됩니다.

## 마치며

라이브러리 소스를 보면서 배워가는게 많습니다.

다른 무엇보다 문서와 소스가 제일 정확하다는 걸 느꼈습니다. 구글링 전에 문서부터 봐야겠습니다.

## 참고

- [Polling vs SSE vs WebSocket— How to choose the right one](https://codeburst.io/polling-vs-sse-vs-websocket-how-to-choose-the-right-one-1859e4e13bd9)

- [Internals overview](https://socket.io/docs/v3/)
