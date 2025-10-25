---
title: "ASP.NET 웹에서 오래 걸리는 요청 진행 상황 보여주기"
summary: "웹소켓을 사용하여 요청 처리 상태를 실시간으로 클라이언트에게 알려줍니다."
date: 2022-05-23 21:27:18 +0900
category: dev
---

## 들어가며

하나의 HTTP 요청은 빠른 시간 안에 끝나는 것이 좋습니다. 그렇지 않으면 사용자는 오래도록 응답이 없는 페이지를 바라보면서 답답함을 느끼게 될 것입니다. 따라서 [클라이언트가 오래 걸리는 작업을 요청하면 즉시 응답을 내려준 다음에 클라이언트가 진행 상황을 물을 때마다 답변해주는 것이 좋습니다.](https://medium.com/geekculture/rest-api-best-practices-decouple-long-running-tasks-from-http-request-processing-9fab2921ace8)

그러나 현실이 녹록치 않을 때도 있습니다. 지금 작업중인 레거시 시스템은 소요 시간에 관계 없이 모든 작업을 하나의 요청-응답으로 처리합니다. 따라서 이러한 컨벤션을 모두 바꾸기는 어려운 상황이었습니다. 그래서 조금 다른 방향으로 생각해보았습니다.

## 상호작용 채널

기본적인 아이디어는, 오래 걸리는 HTTP 요청 옆에 따라가는 웹 소켓 연결을 수립하여 서버쪽 메시지 출력을 클라이언트쪽 콘솔에서 보이도록 하는 것입니다.

요청 처리 상태를 실시간으로 응답에 내려주고 싶지만, 그러려면 완성된 처리 결과를 내려주기 전에 먼저 응답이 전송되어야 합니다. 그리고 처리가 끝나면 결과를 또 다시 응답으로 보내주어야 하죠. 그러나 하나의 요청에 여러 번의 응답을 내려주는 것은 HTTP 특성상 어렵습니다.

결국 하나의 요청만 가지고는 작업 진행 상황과 작업 결과를 모두 전달할 수 없습니다. 그래서 본 요청에 바인드된 별도의 웹 소켓 연결을 사용하여 작업 진행 상황을 전달하기로 하였습니다. 이 웹 소켓 연결을 상호작용 채널(interaction channel)이라고 부르기로 하였습니다.

상호작용 채널은 웹 소켓 기반인 만큼, 요청을 처리하면서 사용자의 의사 확인이 필요할 때에 실시간으로 양방향으로 소통하며 다음 행동에 필요한 정보를 물어볼 수 있습니다. 예를 들어, 대용량의 엑셀 파일 업로드 및 DB 저장 작업을 수행하던 중에 하나의 row에서 처리 문제가 발생한 경우, 이를 무시하고 넘어갈지 아니면 전체 작업을 중단하고 되돌릴지 사용자에게 즉시 물어보고 답변에 따라 처리를 달리할 수 있습니다.

## 작동 원리

상호작용 채널을 사용하여 요청 처리 상태를 보내는 과정을 수립부터 종료까지 하나씩 살펴보겠습니다.

### 1. 클라이언트: 상호작용 채널 소켓 연결 요청

먼저 본 요청을 보내기 전에 클라이언트 쪽에서 채널 ID를 발급합니다. 그리고 이 ID를 URL에 포함하여 서버에 웹 소켓 요청을 보냅니다.

```javascript
// 채널 ID 발급
const channelId = generateUuidV4();

// 웹 소켓 연결 시작
const ws = new WebSocket(`http://example.com/WebSocketHandler.ashx?channelId=${channelId}`);
```

요청이 수립되면 바로 본 요청을 시작하도록 설정합니다. 그리고 연결 이후에 메시지가 도착하면 콘솔에 출력되도록 합니다.

```javascript
ws.onopen = () => {
  // 소켓이 열리면 본 요청을 시작합니다.
  doRequest(channelId);
};

ws.onmessage = (incoming) => {
  // 메시지가 오면 콘솔에 출력합니다.
  console.log(incoming);
};
```

### 2. 서버: 연결된 상호작용 채널 소켓을 저장

클라이언트 쪽에서 웹 소켓 요청을 보내면 서버에서는 `WebSocketHandler`가 반응합니다.

```csharp
public class WebSocketHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        // 웹 소켓 연결이 아니면 무시하고 넘어갑니다.
        if (!context.IsWebSocketRequest) return;

        // 쿼리스트링 파라미터로 넘어온 채널 ID를 꺼내옵니다.
        var channelId = context.Request.Params["channelId"];

        // 연결을 수락한 후, 다음 동작은 InteractionService에 위임합니다.
        context.AcceptWebSocketRequest(async socketContext =>
        {
            // 내부에서 소켓과 채널 ID는 함께 짝지어진 채로 저장됩니다.
            await InteractionService.HandleWebSocketRequest(channelId, socketContext);
        });
    }

    public bool IsReusable => false;
}
```

`InteractionService`의 `HandleWebSocketRequest` 메소드는 **`static`으로 선언된 필드**에 채널 ID와 소켓을 `Dictionary` 형식으로 저장합니다.

> ASP.NET 애플리케이션에서 요청 간의 정보를 보존하려면 [`AppDomain`과 생명 주기를 함께하는 `static` 필드](https://stackoverflow.com/questions/17114629/what-is-the-lifecycle-of-a-static-field)를 사용하는 것이 좋습니다.

### 3. 클라이언트: 본 요청 시작

위에서 소켓이 열리면 본 요청이 시작되도록 설정해 두었습니다.

```javascript
ws.onopen = () => {
  // 소켓이 열리면 본 요청을 시작합니다.
  doRequest(channelId);
};
```

본 요청으로 보내는 함수 `doRequest`는 채널 ID를 헤더에 담아 요청을 보냅니다. 그리하여 **서버가 해당 요청을 아까 수립된 상호작용 채널과 연관지을 수 있게** 합니다.

### 4. 서버: 본 요청에 상호작용 채널 연결

요청을 받은 `UserControl`에서는 `OnPost` 생명주기 콜백에 의해 부모 클래스에서 정의된 `BindInteractionChannelIfExists`가 실행됩니다.

```csharp
private void BindInteractionChannelIfExists()
{
    string channelId =
        IsAjaxCall ? Page.QueryData["channelId"]?.Value as string : Request.Form["channelId"] /*post*/;

    if (!InteractionService.HasChannel(channelId))
    {
        Logger.Warn($"클라이언트가 제시한 상호작용 채널({channelId})이 존재하지 않기 때문에 연결할 수 없습니다.");
        return;
    }

    InteractionService.CurrentChannelId = channelId;

    Logger.Debug(Tag, $"상호작용 채널({channelId})에 연결되었습니다.");
}
```

이제 현재 요청과 연결된 상호작용 채널이 확정되었습니다. 어디서든 `InteractionService.CurrentChannelId` 속성을 통해 지금 연결된 상호작용 채널을 알 수 있습니다.

### 5. 서버: 요청 처리 상황을 클라이언트에 전달

요청을 처리하면서 로그를 출력하듯이 클라이언트에게 진행 상황을 알릴 수 있습니다.

```csharp
for (int i = 0; i < 10; i++) {
    InteractionService.Say("잘 처리하고 있어요!");
}
```

`InteractionService`는 현재 연결된 상호작용 채널(`CurrentChannelId`)을 알고 있습니다. 따라서 `Say` 메소드에 메시지만 넘겨 주면 적절한 소켓을 찾아 데이터를 보내줄 수 있습니다.

### 6. 클라이언트: 요청 처리 상황을 콘솔에 출력

위에서 소켓에 메시지가 수신되면 콘솔에 출력하도록 설정해 두었습니다.

```javascript
ws.onmessage = (incoming) => {
  // 메시지가 오면 콘솔에 출력합니다.
  console.log(incoming);
};
```

서버가 보낸 요청 처리 상황이 콘솔에 출력됩니다.

## 마치며

구현하기에 앞서, *요청 사이에서 정보가 저장될까?* 하는 물음이 자꾸 떠올라 IIS와 ASP.NET의 런타임에 관해 꽤나 오래 찾아보았습니다. 돌아가는 프로토타입을 만들기는 했지만 아직 낯선 것들 투성이네요🥲

## References

- [REST API Best Practices — Decouple Long-running Tasks from HTTP Request Processing](https://medium.com/geekculture/rest-api-best-practices-decouple-long-running-tasks-from-http-request-processing-9fab2921ace8)

- [What is the Lifecycle of a static field](https://stackoverflow.com/questions/17114629/what-is-the-lifecycle-of-a-static-field)
