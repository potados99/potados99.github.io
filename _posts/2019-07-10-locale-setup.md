---
title: Jekyll 테마 적용기
date: 2019-07-10 03:33:00 +0900
excerpt: 블로그 시작하기 어렵다..
categories:
  - blog
tags:
  - jekyll
---

블로그를 시작하면서 [minimal-mistakes](https://github.com/mmistakes/minimal-mistakes) 테마를 적용하였다.

처음에는 `_config.yml`만 수정하면 되는 줄 알았는데, 생각보다 복잡했다.

### Jekyll 테마를 적용하는 방법

Jekyll 테마를 적용하는 세 가지 방법이 있다. ruby gem에 기반한 방식, 테마 repository를 직접 fork하는 방법, 그리고 remote-theme을 사용하는 방법이다.
첫 번째 방법은 로컬에서 빌드 환경을 만드는 것이 귀찮아서 포기했다. 두번째 방법은 저장소를 직접 포크하면 내것이 아닌 것 같아서 건너뛰었다.

remote-theme을 사용하는 것이 가장 마음에 들었다. Github 블로그로 사용할 저장소를 만들고,  `_config.yml `에 remote-theme으로 원하는 테마를 써주기만 하면 된다.
원본 저장소에 있는 것을 기반으로 빌드를 진행하되 내 블로그 저장소에 있는 파일을 우선적으로 사용해서 원본을 override할 수 있다.

### 추가적인 작업들

Remote-theme에 기반하여 테마를 적용하였다. 해당 테마의 [예제 페이지](https://github.com/mmistakes/mm-github-pages-starter)를 많이 참고하였다.
이 Jekyll 사이트는 로컬에서 빌드하지 않고 Github으로만 운영할 예정이라 예시에 등장하는 Gem 파일은 만들지 않았다.

config 파일을 복사한 다음에 수정해서 커밋하고 페이지에 들어가보니 테마가 적용되기는 하였으나 예시 페이지와 조금 달랐다.
예시 페이지에는 상단 네이게이션 바도 있고, 검색 버튼도 있었다. 해당 저장소를 자세히 들여다보니  `_data `와  `_pages ` 디렉토리가 있었다.
두 디렉토리 모두 Jekyll 빌드 과정에서 참조하는 디렉토리인 것으로 추정된다.  `_data `에는  `_layout `에서 참조하는 데이터들이 존재하며,
 `_pages `에는 정적인 소개 페이지나 태그, 카테고리별 모아보기 페이지가 존재한다. 해당 디렉토리와 파일 모두 그대로 가져와서 붙여넣으니 모양은 얼추 비슷해졌다.

### 디테일 다듬기

Config에서 locale까지 ko-KR로 잡아주었으나 아직 사이트에 영어가 남아있는 부분이 있었다. 검색 버튼을 누르면 키워드를 입력하라고 placeholder 텍스트가 나오는데, 이게 영어로 되어 있었다.
테마를 잘 뜯어보니  `_includes/search/search_form.html `에서 해당 문자열을 참조하는 부분이 있었다.

~~~
    ...
    "{{ site.data.ui-text[site.locale].search_placeholder_text | default: 'Enter your search term...' }}"
    ...
~~~

`site.data.ui-text[site.locale].search_placeholder_text`가 중요하다.
`_data` 디렉토리의 `ui-text.yml` 파일 아래 `ko-KR`에 속한 `search_placeholder_text`를 가져온다는 뜻이다. 그런데 기본값인 "Enter your search term..."가 출력되었다. 한글 번역이 안되었다는 뜻이다.

테마 원본 저장소로 가보니 해당 key를 포함해서 3개가 번역이 덜 되었다. 이를 오버라이드하기 위해서 블로그 저장소에 `_data/ui-text.yml`을 만들고 원본 내용을 그대로 가져온 뒤 ko에 다음 세 줄을 더해주었다.

~~~
search_placeholder_text    : "검색어를 입력하세요..."
results_found              : "개 결과 발견"
back_to_top                : "맨 위로 이동"
~~~

적용하니 잘 나온다.

### 날짜 포맷 바꾸기

이건 더 복잡한 문제인데, 글 하단 footer에 업데이트 날짜가 표시되는데, 날짜 포맷이 locale과 관계없이 무조건 "%B %d, %Y"로 표시되었다. 가령 July 9, 2019. 이런 식이다. 이 부분은 찾아보니 `_layouts/single.html`에 있었다.

크게 나누면 두 군데에 나타나는데, 첫번째는 23번째 줄이다.

~~~
{% if page.date %}<meta itemprop="datePublished" content="{{ page.date | date: "%B %d, %Y" }}">{% endif %}
~~~

`page.date` 속성을 가져와 `date`라는 필터를 씌우는데, 날짜 포맷 스트링을 전달하는 것이다. 이 포맷 스트링을 locale에 맞게 구분하기 위해 `ui-text.yml`과 비슷하게 `format.yml`을 만들었다.

~~~
en: &DEFAULT_EN
  date_format           : "%B %d, %Y"
en-US:
  <<: *DEFAULT_EN

ko: &DEFAULT_KO
  date_format           : "%Y년 %m월 %d일"
ko-KR:
  <<: *DEFAULT_KO
~~~

영어의 경우 기존 그대로 유지하고 한국어의 경우 년 월 일 순서로 표시되도록 하였다. 이는 레이아웃 파일에서 `site.data.format[site.locale].date_format`로 접근할 수 있다. 만약에 없을 수도 있으니 `defult` 필터를 씌우면 `site.data.format[site.locale].date_format | default: "%B %d, %Y"`가 된다.

이를 레이아웃에 적용하였다.

~~~
{% assign dateformat = site.data.format[site.locale].date_format | default: "%B %d, %Y" %}
{% if page.date %}<meta itemprop="datePublished" content="{{ page.date | date: dateformat }}">{% endif %}
~~~

포맷 스트링을 가져와 `dateformat`이라는 변수에 넣어 사용한다.

Jekyll의 `date` 필터는 locale를 지원하지 않는 모양이다. 아쉽다.
