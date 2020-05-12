---
title: "[JS] 새 글 배지 다시 구현하기"
date: 2020-05-13 03:37:13 +0900
categories:
   - dev
---

## 들어가며

예전에 [[Jekyll] 최신 글 옆에 N 띄우기](https://blog.potados.net/dev/mark-new-posts/)라는 글에서 새 글 옆에 N을 띄우는 방법을 알아보았다. 처음엔 잘 작동하는가 싶었으나, 일주일이 한참 넘게 지나도 마지막 글에서 N 배지가 사라지지 않는 것이다.

생각해보니 Jekyll은 정적 웹페이지를 호스팅하는 플랫폼이고, N 배지를 그리는건 **서버에서, 빌드 시에** 수행되고 있었다. 오랫동안 글을 올리지 않아 빌드가 유발되지 않았고, 배지 업데이트가 일어나지 않았던 것이다.

## 문제

이전 코드는 아래와 같이 생겼었다.

{% raw %}
~~~html
<!-- index.html -->
<section>

	{% for post in site.posts %}
		<!-- 생략 -->

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

	{% endfor %}

</section>
~~~
{% endraw %}

Jekyll의 for문으로 글 목록을 빌드 타임에 생성하는 코드이다. 이제 이것을 사용자의 브라우저에서 실시간으로 실행되는 방식으로 바꾸어야 한다.

## 해결책

위 코드에서 핵심은 이 부분이다.

{% raw %}
~~~html
<span>
  {% assign past_ts = post.date | date: '%s' | plus: 0 %}
  {% assign current_ts = site.time | date: '%s' | plus: 0 %}
  {% assign delta_ts = current_ts | minus: past_ts %}
  {% assign seven_days_ts = 86400 | times: 7 %}

  {% if seven_days_ts > delta_ts %}N {% endif %}
  {{ post.date | date: "%m/%d" }}
</span>
~~~
{% endraw %}

해당 부분을 아래와 같이 바꾸어 준다.

{% raw %}
~~~html
<span class="date-text" data-date="{{ post.date | date_to_xmlschema }}">
  {{ post.date | date: "%m/%d" }}
</span>
~~~
{% endraw %}

세 가지 변경이 가해졌다. 하나씩 살펴보자.

{% raw %}
- **계산 부분 제거**
  - `span` 내부에 존재하던, Jekyll에 의해 수행되는 Liquid template을 제거하였다. 실제 날짜 표시에 사용되는 `{{ post.date | date: "%m/%d" }}`만 남겨두었다.

- **Class 추가**
  - 클라이언트 단에서 DOM 조작을 하려면, 해당 객체를 스크립트 상에서 특정할 수 있어야 한다. 이를 위해서 날짜를 표시하는 `span`에 `date-text` class를 부여했다.

- **속성 data-date 추가**:
  - 해당 `span`이 표시하는 데이터 `월/일` 형태이다. 따라서 날짜 계산에는 사용할 수 없다. 그래서 온전한 형식의 날짜 스트링을 태그에 담기로 하였다. HTML5에서는 `data-*` 형식의 속성에 데이터를 보관할 수 있다. 아래는 예시이다.
~~~html
<span class="date-text" data-date="2020-04-21T21:40:57+09:00"> 04/21 </span>
~~~

{% endraw %}

그리고 스크립트를 작성하였다.

~~~js
const dateTexts = document.getElementsByClassName('date-text');

for (const dateText of dateTexts) {
  const createDate = new Date(dateText.getAttribute('data-date'));
  const currentDate = new Date();

  const diff = (currentDate.getTime() - createDate.getTime()) / (1000 * 86400);

  if (diff < {{ site.new_badge_period | default: 7 }}) {
    dateText.innerText = 'N ' + dateText.innerText;
  }
}
~~~

흐름은 다음과 같다:
1. `date-text` 클래스를 가지는 요소를 모두 소환한다.
2. 해당 요소들을 순회하면서 다음 작업을 반복한다:
  1. 요소의 `data-date` 태그로부터 날짜 스트링을 가져와 날짜 객체를 생성한다.
  2. 오늘 날짜와 비교한다.
  3. 둘의 날짜 차이가 지정된 일수보다 크면 `N`을 붙여준다.

> 자바스크립트의 Date 클래스는 getTime() 메소드를 지원하는데, 이는 해당 객체의 타임스탬프(1970년 1월 1일 0시부터 지금까지 경과한 시간)를 밀리초 단위로 반환한다. 이 타임스탬프를 1000\*60\*60\*24로 나누어 날짜 비교에 사용할 수 있다.

해당 스크립트는 `<script>` 태그로 감싸서 적절한 곳에 배치하면 된다. 완성된 전체 코드는 아래와 같다.

{% raw %}
~~~html
<section>

	{% for post in site.posts %}
		{% unless post.next %}
			<h3 class="code">{{ post.date | date: '%Y' }}</h3>
		{% else %}
			{% capture year %}{{ post.date | date: '%Y' }}{% endcapture %}
			{% capture nyear %}{{ post.next.date | date: '%Y' }}{% endcapture %}
			{% if year != nyear %}
				<h3 class="code">{{ post.date | date: '%Y' }}</h3>
			{% endif %}
		{% endunless %}

		<ul>
			<li>
				<div class="post-date code">
					<span class="date-text" data-date="{{ post.date | date_to_xmlschema }}">
						{{ post.date | date: "%m/%d" }}
					</span>
				</div>
				<div class="title">
					<a href="{{ post.url | prepend: site.baseurl | prepend: site.url }}">{{ post.title }}</a>
				</div>
			</li>
		</ul>

	{% endfor %}

	<script>
		const dateTexts = document.getElementsByClassName('date-text');

		for (const dateText of dateTexts) {
			const createDate = new Date(dateText.getAttribute('data-date'));
			const currentDate = new Date();

			const diff = (currentDate.getTime() - createDate.getTime()) / (1000 * 86400);

      if (diff < {{ site.new_badge_period | default: 7 }}) {
				dateText.innerText = 'N ' + dateText.innerText;
			}
		}
	</script>

</section>
~~~
{% endraw %}

## 마치며

하는 김에 블로그 주소도 `blog.potados.net`으로 바꿨다.

:)

## References

- https://stackoverflow.com/questions/14054586/save-data-in-html-tag-attribute
- https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
