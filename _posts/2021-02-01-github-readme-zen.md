---
title: "살아 숨쉬는 README? 마크다운에 생기를 불어넣어봅시다"
excerpt: "깃헙 README에서 동적인 컨텐츠를 표시해 보았습니다."
date: 2021-02-01 04:09:23 +0900
category: dev
---

![github-readme-zen](http://github-readme-zen.herokuapp.com)

> 완성된 모습

## 사건의 발단

몇 달 전부터 GitHub 프로필에 아래와 같은 스탯이 보이기 시작했습니다.

![github stats](https://github-readme-stats.vercel.app/api?username=potados99&show_icons=true)

> 삐까번쩍한 애니메이션에 확대해도 깨지지 않는 글씨까지. 그냥 보면 `iframe` 같지만 사실 한 장의 `svg` 이미지입니다.

알고 보니 GitHub에 사용자의 이름으로 [스페-샬한 저장소](https://torrocus.com/blog/special-github-repository/)를 만들 수 있게 된 것이었습니다. 해당 저장소의 `README.md`가 사용자의 GitHub 페이지를 방문하면 보여지는 것이죠.

그냥 *자기 소개같은 걸 써 놓으면 되는건가보다* 하고 무사히 몇 달을 넘겼습니다. 그러다가 어제 아침, 갑자기 프로필을 꾸미고 싶은 충동에 휩싸입니다.

**"URL에서 가져온 텍스트를 README에 표시하고 싶다!"**

마크다운에서 이미지를 표시하는 건 `![]()` 문법을 통해 간단하게 달성할 수 있습니다. 위의 스탯도 그렇게 구현되어 있었습니다. 그런데 텍스트를 표시하는 건 찾을 수 없었습니다.

## README로 할 수 있는 것

마크업 언어인 마크다운은 ~~말장난~~ 인라인 HTML을 지원합니다. 그래서 인터넷 상에 존재하는 컨텐츠를 `<img>`나 `<iframe>`으로 가져올 수 있습니다.

그런데 GitHub 마크다운에서는 그게 안 됩니다!

## GitHub README에서는 못 하는 것

[한 답변](https://stackoverflow.com/a/54613247)에 인용된 [GitHub-flavored Markdown 스펙](https://github.github.com/gfm/#example-630)을 보면, 지원하지 않는 HTML 태그가 있다고 합니다.

> **6.11 Disallowed Raw HTML (extension)**
>
> GFM enables the tagfilter extension, where **the following HTML tags will be filtered** when rendering HTML output:
>
> `<title>`
> `<textarea>`
> `<style>`
> `<xmp>`
> **`<iframe>`**
> `<noembed>`
> `<noframes>`
> `<script>`
> `<plaintext>`
>
> [...] These tags are chosen in particular as they change how HTML is interpreted in a way unique to them [...], and this is usually undesireable in the context of other rendered Markdown content.
>
> All other HTML tags are left untouched.

그러니까 GitHub의 `README.md`에서 `<iframe>` 은 못 쓴다는 겁니다. 그렇다면 동적인 컨텐츠를 표시하기 위해 우리가 할 수 있는 일은 무엇일까요.

![팝콘로빈](/assets/images/Vhm5GyM.jpg)

> 팝콘이나 가져오기?

아무리 머리를 오래 굴려도, **전부 이미지로 만들어 표시하는 것** 외에는 답이 없는 것 같습니다.

## 이미지 서버 만들기

글 초반에 언급한 [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)은 쿼리 스트링으로 사용자의 정보를 받아 동적으로 `svg` 이미지를 만들어 응답합니다. 이 접근 방식을 차용하였습니다.

[작은 서버](https://github.com/potados99/github-readme-zen)를 하나 만들었습니다. 이 서버가 하는 일은 다음과 같습니다.

- https://api.github.com/zen 으로부터 문장 하나를 꺼내 옵니다.
- 사용자가 요청을 보내면 위에서 가져온 문장으로 `svg` 이미지를 만들어 응답합니다.

이미지를 만드는 과정은 아주 간단했습니다. `content-type`은 `image/svg`이지만 내용은 그냥 `xml`입니다.

집어넣고 싶은 텍스트가 `text`일 때, 아래와 같은 스트링을 응답 body에 넣어 보내주면 됩니다.

~~~xml
<svg
    width="495"
    height="40"
    viewBox="0 0 495 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">

    <style>
        .header {
            font: 600 18px Sans-Serif;
            fill: #0366d6;
            animation: fadeInAnimation 0.8s ease-in-out forwards;
        }

        @keyframes fadeInAnimation {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

    </style>

    <g transform="translate(0, 25)">
        <text class="header" data-testid="header">${text}</text>
    </g>
</svg>
~~~

> `svg`에 애니메이션도 넣을 수 있습니다! 그라데이션은 물론이고 반짝이는 효과도 넣을 수 있지만 계단현상이 생겨 포기했습니다 ㅜ

그리고 이 서버를 heroku에 배포했습니다.

이제 **랜덤으로 나타나는 zen 텍스트**를 README에 표시할 수 있습니다! `README.md` 어딘가에 `![GitHub zen](https://github-readme-zen.herokuapp.com)`를 배치하기만 하면 됩니다.

**끝!**

.

.

.

나긴 했는데, 사실 위에 미처 적지 못한 삽질이 있습니다.

## 삽질 고백 타임!

### 1. README의 이미지가 실시간이 아니었습니다.

> 자세한 내용은 [이 분](https://coding-groot.tistory.com)께서 [이 글](https://coding-groot.tistory.com/42)에 잘 설명해 주셨습니다.

GitHub은 `README.md`에 이미지가 있으면 그걸 사용자가 그냥 보게 놔두지 않고, 원본 이미지를  다른 데에다가 저장한 다음에 그 사본의 URL을 줍니다.

왜 그런가 하니, 이미지의 소스가 `HTTPS`가 아닌 `HTTP`로 로드되는 경우 발생하는 경고를 해결하기 위함이라 합니다. 출처(또는 연결)이 불분명한 이미지를 안전한(`HTTPS`로 연결되는) 임시 캐시에 넣어 두었다가 사용자에게 제공하는 것이죠.

아무튼 캐시를 지우려면? 이렇게 하면 됩니다.

~~~bash
$ curl -X PURGE [캐시된 url]
~~~

### 2. `svg`에 그라데이션을 적용하면 비트맵처럼 픽셀이 보입니다.

단색 글씨가 예쁘지 않아 `<linear-gradient>`로 그라데이션을 주어 보았습니다. 아주 영롱한 것이 마음에 들었습니다. 그런데 배포를 마치고 모바일로 확인해 보니, 마치 비트맵처럼 픽셀이 깨져 흐리게 보이는 것이었습니다.

해당 이미지를 제공하는 URL에 브라우저로 직접 접속하면 문제 없이 표시되었습니다. 그런데 GitHub 프로필 페이지 내에서 보면 화질구지가 꽤나 심하여 무시할 수 없는 수준이었습니다.

결국 원인을 찾지 못하고(ㅠ) 그냥 파란 색으로 칠해버렸습니다.

### 3. GitHub API 호출 제한이 생각보다 빡빡합니다.

이미지에 표시할 텍스트는 모두 [GitHub API](https://api.github.com/zen)에서 가져옵니다. 그런데 어느 순간부터 오라는 zen은 안 오고 이상한 에러 메시지가 옵니다.

~~~
{"message":"API rate limit exceeded for 121.143.229.11. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)","documentation_url":"https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"}
~~~

> 그래도 응답 코드는 200입니다.

[문서](https://docs.github.com/en/rest/overview/resources-in-the-rest-api)를 보니, 한 시간에 최대 60번으로 호출을 제한한다고 합니다. 인증된(authenticated) 사용자에 대해서는 제한이 조금 넉넉하다고는 하는데, 고작 텍스트 몇 개 가져오자고 귀찮은 인증 설정을 하느니 그냥 로컬에 통째로 담아버리기로 정했습니다.

[여기](https://gist.github.com/sorrycc/7214622)에서 모든 zen 목록을 찾았습니다. 이걸 그대로 가져다가 로컬에 담아 두었습니다.

사용자의 요청이 오면 일단은 GitHub의 API를 호출하고, 거기서 에러 응답이 오면 로컬에 있던 것 중 하나를 뽑아 응답하게 만들었습니다.

**진짜 끝!**

## 마치며

`svg`가 할 수 있는 일이 생각보다 많다는 것을 알았습니다.

## 참고

- [What Is Mark Down](http://whatismarkdown.com/)
- [GitHub README.md 이미지가 갱신/업데이트 안 되는 경우 해결법](https://coding-groot.tistory.com/42)
- [get all zen from https://api.github.com/zen](https://gist.github.com/sorrycc/7214622)
