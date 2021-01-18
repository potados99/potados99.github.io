---
title: "GitHub Issue로 댓글 달기"
summary: "GitHub 블로그에 댓글 플러그인을 달아 보았습니다."
date: 2020-07-01 01:41:31 +0900
categories:
   - dev
---

## 들어가며

세상이 많이 좋아졌다.

GitHub의 이슈 기능을 댓글로 활용할 수 있는 위젯이 있다.

바로 [utterances](https://utteranc.es/?installation_id=10166801&setup_action=install)다.

![utterances.png](/assets/images/utterances.png)

이슈 남기듯이 댓글을 달 수 있다.

## 내 GitHub 블로그에 Utterances 적용하기

아주 간단하다.

1. **[utterances](https://github.com/apps/utterances)를 블로그 repository에 설치한다.**

2. **페이지 어딘가에 다음 스크립트를 붙여넣는다:**

~~~html
<script src="https://utteranc.es/client.js"
        repo="[사용자 이름]/[블로그 저장소 이름]"
        issue-term="pathname"
        theme="github-light"
        crossorigin="anonymous"
        async>
</script>
~~~

물론 `[사용자 이름]`과 `[블로그 저장소 이름]`은 적절하게 변경한다.

아래는 예시이다:

~~~html
<script src="https://utteranc.es/client.js"
        repo="potados99/potados99.github.io"
        issue-term="title"
        label="comment"
        theme="github-light"
        crossorigin="anonymous"
        async>
</script>
~~~

각 속성이 무엇을 뜻하는지는 [여기](https://utteranc.es/?installation_id=10166801&setup_action=install)에 나와 있다.

## References

- https://utteranc.es/?installation_id=10166801&setup_action=install
