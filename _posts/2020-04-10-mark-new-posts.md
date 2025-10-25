---
title: "[Jekyll] 최신 글 옆에 N 띄우기"
date: 2020-04-10 03:22:50 +0900
category: dev
---

# 들어가며

최근에 갑자기 엄청 간단한(심지어 투박한) 텍스트 기반 디자인에 관심이 꽂혀서 블로그 테마를 싹 뜯어고쳤다. [The Plain Theme](https://github.com/heiswayi/the-plain)이라는 테마를 조금 변형해서 적용했다. 적용해놓고 다른 블로거들은 어떻게 꾸몄나 싶어 돌아다니다가, 문득 어느 블로그 새 글 옆에 반짝이는 `N` 뱃지가 떠있는 것을 봤다.

이 블로그는 정적인 특성이 강하다. 글이 올라왔는지 안 올라왔는지도 모르는 그런 블로그다. 그래서 조금 활기(?)를 주고자 최근 글의 날짜 옆에 자그마한 `N`을 띄워보도록 했다.

# Liquid

이 블로그가 사용하는 `Jekyll` 플랫폼에서는 페이지를 구성할 때에 `Liquid`라는 언어를 사용한다.

{% raw %}
~~~html
...
<tag>{{ site.title }}</tag>
...
~~~
{% endraw %}

`if` 분기도 되고 `assign`을 이용한 변수 할당, `|` 파이프 처리 등을 지원하다 ~~(일단 여기까지밖에 모른다)~~.

{% raw %}
~~~liquid
{% assgin a = 3 %}
{% if a > 0 %}
  {% assign d = site.time | date: "%m/%d" %}
{% endif %}
~~~
{% endraw %}

뭐 이런 식이다.

# 수정할 곳 찾기

사실 Jekyll로 뭔가를 제대로 해본 적이 없어서 어떻게 돌아가는지는 대략만 알고 있다. 일단 수정해야 하는 파일을 찾아보자.

글 목록 옆에는 날짜가 뜬다. 해당 목록은 이 블로그의 첫 페이지다. 첫 화면은 당연히 `index.html`에 있을 것이다. 그러면 이제 수정할 부분을 찾아야 한다. 이 부분은 브라우저 개발 툴의 도움을 받았다.

사파리 개발자 도구를 열고, 날짜가 표시되는 부분을 element selection tool을 이용해 잡아 보니 `class`가 `post-date code`인 `div`였다. `index.html`에서 해당 부분을 찾아보자.

{% raw %}
~~~html
...
<ul>
  <li>
    <div class="post-date code">
      <span>{{ post.date | date: "%m/%d" }}</span>
    </div>
    <div class="title">
      <a href="{{ post.url | prepend: site.baseurl | prepend: site.url }}">{{ post.title }}</a>
    </div>
  </li>
</ul>
...
~~~
{% endraw %}

먼저 날짜가 있고 그 다음에 제목이 있다. 실제로 표시되는 순서는 `post-date`이 오른쪽이다. css에 `float: right;`이라고 명시되어 있기 때문이다.

아무튼 위 소스에서 `<span>{% raw %}{{ post.date | date: "%m/%d" }}{% endraw %}</span>` 부분만 고치면 된다.

# 수정하기

일단 이 글이 얼마나 오래된 글인지 알기 위해서는 아래 정보들이 필요하다.

- 오늘 날짜
- 포스트 업데이트 날짜

전자는 `site.time`으로, 후자는 `post.date`으로 구할 수 있다. 둘 간의 비교는 유닉스 타임스탬프로 하는게 편하다. 예를 들어 둘이 86,400(60*60*24)초 차이가 난다고 하면, 포스트는 24시간 전에 작성된 것이다.

일단 둘을 구해서 변수에 대입해주자.

{% raw %}
~~~Liquid
{% assign past_ts = post.date | date: '%s' | plus: 0 %}
{% assign current_ts = site.time | date: '%s' | plus: 0 %}
~~~
{% endraw %}

둘 다 날짜를 구한 다음, `date` 필터를 써서 타임스탬프를 추출했다. 그런데 이는 숫자가 아니라 문자열이므로 `plus` 필터를 써서 0을 더해주어 숫자로 만들었다.

이제 둘의 차이를 변수에 담는다.

{% raw %}
~~~Liquid
{% assign delta_ts = current_ts | minus: past_ts %}
~~~
{% endraw %}


처음에는 무심코 `current_ts - past_ts`라고 썼는데, 이렇게 쓰면 안된다. `minus` 필터를 사용해주었다.

이제 `{% raw %}{% if delta_ts < 적절한숫자 %}{% endraw %}` 모양의 문(statement)을 전개하면 되는데, 저 `적절한숫자`도 변수로 만들어보겠다.

{% raw %}
~~~Liquid
{% assign seven_days_ts = 86400 | times: 7 %}
~~~
{% endraw %}

포스팅이 워낙 뜸하니까 7일 정도면 최신이라고 두기로 했다..ㅎㅎ

이제 마지막으로, `delta_ts`가 `seven_days_ts`보다 작으면 문자열 `N`을 갖다 두는 코드다.

{% raw %}
~~~Liquid
{% if seven_days_ts > delta_ts %}N {% endif %}
~~~
{% endraw %}

끝이다.

다시 합치면 이렇게.

{% raw %}
~~~html
<ul>
  <li>
    <div class="post-date code">
      <span>
        {% assign past_ts = post.date | date: '%s' | plus: 0 %}
        {% assign current_ts = site.time | date: '%s' | plus: 0 %}
        {% assign delta_ts = current_ts | minus: past_ts %}
        {% assign seven_days_ts = 86400 | times: 7 %}

        {% if seven_days_ts > delta_ts %}N {% endif %}
        {{ post.date | date: "%m/%d" }}
      </span>
    </div>
    <div class="title">
      <a href="{{ post.url | prepend: site.baseurl | prepend: site.url }}">{{ post.title }}</a>
    </div>
  </li>
</ul>
~~~
{% endraw %}

# 마치며

심심할 때 마다 뜯어 고칠 수 있다는게 Jekyll의 큰 장점인 것 같다.
