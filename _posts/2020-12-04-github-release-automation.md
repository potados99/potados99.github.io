---
title: "GitHub, 릴리즈도 귀찮으니 봇에게 맡기자"
excerpt: "게으름의 끝은 어디일까. 아무튼 자동화는 좋습니다."
date: 2020-12-04 03:42:31 +0900
category: dev
---

브랜치가 많은 것을 싫어한다. 그래서 `main`에 직접 작업하거나 일이 커진다 싶으면 feature 브랜치를 만들어 커밋한다.

> 그렇다면 `main` 브랜치의 내용이 항상 완전한 코드가 아닌 것인데? 출시 가능한 프로덕션 코드는 어디에 있나?

이는 릴리즈를 만들어 해결한다.

## 릴리즈

코드가 출시 가능한 상태가 되었을 때, `main` 브랜치의 특정 커밋(아마 최신)에 대해 태그를 만들고, 그 태그에 대해 릴리즈를 만든다. 고로 릴리즈는 `main`의 어느 한 순간(출시가 가능한 하나의 버전이 나온 순간)의 스냅샷인 것이다. 이렇게 만들면 이런 것들이 좋다:

- `main`에 뭐가 들어가든, 이미 출시된 릴리즈는 영향을 받지 않는다.
- 과도한 브랜칭으로 인한 merge 지옥을 피할 수 있다.

![merge-hell](/assets/images/Tl102fo.png)

> Merge 지옥([출처](https://xebia.com/blog/git-workflow/git-merge-hell))

## 릴리즈 생성

릴리즈를 만들려면 일단 태그를 만들어야 한다.

~~~
git tag v1.0.0
~~~

그리고 푸시하면 된다

~~~
git push --tags
~~~

이제 GitHub에 가보면 새로운 태그가 생겨 있다. 이 태그로부터 새로운 릴리즈를 만들 수 있다. 해당 릴리즈가 무엇에 대한 것인지 내용을 써 주고, 적당한 에셋들을 담는다.

그런데, 태그 생성 시점과 태그 이름까지는 개발자의 영역이지만 릴리즈를 만드는 것은 자동화가 가능한 영역이다. 새 태그가 올라오면, 지난 릴리즈 이후의 커밋들을 가져와 그 커밋 메시지를 릴리즈의 내용으로 쓸 수 있다. 해보자.

## GiHub App

GitHub에서 이벤트(푸시 등등)가 일어나면 웹 훅을 통해 이를 받아볼 수 있다. 그리고 GitHub API를 사용해서 이런저런 일을 할 수 있다.

이 둘을 결합하면 새 태그가 생길 때마다 릴리즈를 자동으로 만들어 주는 앱을 만들 수 있다.

## 구현

> 구현에는 [Probot](https://probot.github.io)을 사용했다. GitHub API를 예쁘게 다듬어 제공해주고, 개발과 테스트 환경 셋업도 도와준다.

[소스는 여기에](https://github.com/potados99/cafeteria-bot)

~~~js
app.on('create', async (context) => {
  if (context.payload.ref_type === 'tag') {
    const drafter = new ReleaseDrafter(context);
    await drafter.draftRelease();
  }
});
~~~

도입부는 간단하게 만들었다.

태그는 [`git ref`](https://docs.github.com/en/free-pro-team@latest/rest/reference/git#get-a-reference)에 해당한다. 따라서 새로운 태그의 생성은 `git ref` 생성에 대응하는 `create` 이벤트로 감지할 수 있다.

`create` 이벤트의 모든 내용은 저 `context` 객체에 들어 있다. 이것만 있으면 무슨 일을 해야 할 지 결정할 수 있다.

### 동작

새 릴리즈를 만들려면 다음 일들을 순차적으로 수행해야 한다.

1. 마지막 릴리즈에 딸린 커밋의 SHA를 가져온다.
2. 해당 커밋 이후로 새로 추가된 커밋을 모두 가져온다.
3. 새로 가져온 커밋들의 메시지를 참고해 릴리즈를 생성한다.

### 마지막 릴리즈 커밋 가져오기

저장소의 이름과 소유자 이름을 알면 해당 저장소의 마지막 릴리즈를 가져올 수 있다.

가져온 릴리즈에는 `tag_name`이라는 필드가 있다. 저장소와 `tag` 이름을 알면, `getRef` API를 사용해서 해당 `tag`의 상세 정보를 가져올 수 있다.

그렇게 가져온 태그의 `data.object.sha` 속성을 통해 해당 태그가 달린 커밋의 SHA를 가져올 수 있다.

이렇게 마지막 릴리즈의 커밋을 가져왔다.

### 신규 커밋 가져오기

GitHub API는 `compareCommits` endpoint를 지원한다. `base` 파라미터에 마지막 릴리즈 커밋 ID(SHA)를 넣어 요청하면, 그 후로 새로 생긴 커밋들의 리스트를 포함한 응답을 준다.

~~~js
{
      owner: ownerName,
      repo: repoName,
      base: lastReleaseSha,
      head: 'HEAD'
}
~~~

> `compareCommits` 요청 파라미터.

### 릴리즈 생성

가져온 커밋들의 메시지를 잘 조합해 `body`를 만든 뒤, `createRelease` 요청을 보낸다.

~~~js
{
      owner: ownerName,
      repo: repoName,
      tag_name: newTagName,
      name: newTagName,
      body: body,
}
~~~

> `createRelease` 요청 파라미터. 릴리즈 이름은 새로 생성된 태그 이름으로 한다.

## 테스트

[Probot](https://probot.github.io)을 만든 팀이 [smee.io](https://github.com/probot/smee.io)도 만들었다. 그래서인지 Probot에 smee.io가 내장되어 있다. 덕분에 손 하나 안 대고 **로컬에서 GitHub의 webhook을 수신할 수 있다!**

Probot이 사용하는 `WEBHOOK_PROXY_URL`, `PORT` 환경변수만 넣어주면 webhook이 알아서 잘 들어온다.

> 사실 위의 환경변수 설정 과정도 자동이다. 방화벽 때문에 포트 바꿀 때에만 `PORT` 건드려주면 된다.

## 마치며

`git tag vx.x.x && git push --tags` 이거면 릴리즈 뚝딱이다. 역시 게으른게 최고다.

## References

- https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/about-webhooks
- https://probot.github.io
- https://github.com/probot/smee.io
