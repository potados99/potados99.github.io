---
title: "Jekyll 테마 적용기"
date: 2019-07-10 03:33:00 +0900
categories: 
  - blog
tags: 
  - jekyll
---

블로그를 시작하면서 [minimal-mistakes](https://github.com/mmistakes/minimal-mistakes) 테마를 적용하였다.

처음에는 _config.yml만 수정하면 되는 줄 알았는데, 생각보다 복잡했다.

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

Config에서 locale까지 ko-KR로 잡아주었으나 아직 사이트에 영어가 남아있는 부분이 있었다. 검색 버튼을 누르면 키워드를 입력하라고 placeholder 텍스트가 나오는데,
이게 영어로 되어 있었다. 테마를 잘 뜯어보니  `_includes/search/search_form.html `에서 해당 문자열을 참조하는 부분이 있었다.

~~~
    <input type="search" id="search" aria-placeholder="{{ site.data.ui-text[site.locale].search_placeholder_text | default: 'Enter your search term...' }}" class="search-input" tabindex="-1" placeholder="{{ site.data.ui-text[site.locale].search_placeholder_text | default: 'Enter your search term...' }}" />
~~~

