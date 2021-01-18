---
title: "프로젝트는 나의 행복"
summary: "코오딩에 중독돼버린 어느 개발자의 이야기."
date: 2021-01-05 11:58:49 +0900
categories:
   - writings
---

~~제목을 너무 변태같이 지었나~~

정확히 말하자면 프로젝트 보다는 *무언가에 열중하는 것, 특히 창작 행위*가 곧 나의 행복이다.

2년 가까이 애정을 갖고 쏟아부은 프로젝트가 이제 안정 궤도에 진입했다.

팀원이 iOS 개발자분을 제외하면 나 뿐이라 뇌내 디자이너, 뇌내 서버개발자, 뇌내 데브옵스, 뇌내 테스터, 뇌내 프로젝트 매니저가 활약해 주었다. 물론 하나의 코어(신체)를 공유하기 때문에 병렬(parallel)로 활동하지는 못하고 동시에(concurrent)만 진행했다.

![software development team](https://miro.medium.com/max/2760/1*SmBWZFn25RMpfC1le4DFmw.jpeg)

> 협업 비용은 줄지만 나만의 틀에 갇히게 될 수 있다는 치명적인 단점이 있다! 다만 어쩔 수 없었다. 팀원이 대부분 도망가서...

열심히 코드를 짜고 테스트하고 커밋하고 푸시하고 PR을 머지하고 태그 달아 출시하기를 하루 종일 하다가 힘이 쪽 빠지면 그대로 밥먹고 잠들곤 했다. 다음 날 일어나면(언제가 될 지는 모른다!) 뇌내 프로젝트 매니저가 갑자기 새로운 기능을 제안해 온다. 그렇게 무한 코딩루프가 시작된다.

~~~
label everyday_task:

  while (am_I_okay()) {
    implement();
    test();
    deploy();
  }

goto everyday_task;

// NOREACH
~~~

> 뇌내 프로젝트 매니저가 만족해서 인터럽트를 날릴 때까지, 끝은 없는거다.

써놓고 보니 [스크럼](https://ko.wikipedia.org/wiki/스크럼_(애자일_개발_프로세스)) 같기도 하다. 제일 큰 목표는 마음 속 깊은 곳에다가 적어놓고, 스프린트 백 로그는 이슈에다가 적어놓고, 열심히 스프린트 뛰는거다 (이렇게 하는게 맞나..?).

![스크럼](https://upload.wikimedia.org/wikipedia/commons/5/58/Scrum_process.svg)

> 할 일을 정하고 대략 4주의 기간 동안 목표를 수행한다. 매일 간단한 진행 상황 공유를 한다. 뇌내 팀이기 때문에 모든 것은 자동으로 공유된다.

뭔가 목표가 생기면 장작이 공급되어 몇 달 동안 활활 불타는데, 그 목표를 다 이뤘다 싶으면 휴지기로 접어든다. 그래서 수 차례 반복하고 몇 달 쉬고, 또 불이 붙으면 한참 달렸다 쉬기를 반복했다.

그러던 프로젝트가 이제 드디어 끝을 바라보고 있다. 외부 전산망 담당 업체에서 이쪽으로 웹훅만 쏴주면 된다. 요청은 넣어놨는데 아직 답이 없다.

![병목 현상](http://static.news.zumst.com/images/2/2019/04/22/1a1cae8aadac4cc68b5a181fc386060f.jpg)

> 사람이 병목이다. 엄청 간단한건데 결재받고 요청넣고 답변 기다리고.. 윽!

아무튼 정말 불꽃튀기게 몰입하다가 이제 할 일이 없어지니(뇌내 프로젝트 매니저가 아무런 지시도 내리지 않고 있다) 허전하다. 보통 프로젝트 끝나면 지친 심신을 달래는 것 같은데, 이번 프로젝트는 내내 너무 행복했어서 딱히 지치는 일은 없었고, 그냥 몸이 근질근질하다.

그래서 vim을 제대로 배워보기로 했다.

![vim-vs-emacs](https://cmd.com/wp-content/uploads/2020/04/vim-emacs.gif)

> 나는 vim을 선택헀다.

[지금 쓰는 맥의 esc 키가 물리 키가 아니라](https://zdnet.co.kr/view/?no=20161031163126) 그냥은 쓰기는 힘들고, 캡스락을 esc로 바인드해서 연습하고 있다. 캡스락 키의 원래 기능인 *한/영 전환*은 예전처럼 `Command + Space`로 사용하고 있다.

사실 할 일을 찾아 떠나는건, 어딘가 몰입해 있지 않으면 불안해서이기도 하다. 몰입 밖의 현실 세계에서 나는 *['세상의 거대함과 자신이 물고 태어난 수저에 대하여 탄식하고 신분하락과 몰락의 공포에 떠는'](http://www.psychiatricnews.net/news/articleView.html?idxno=20468)* 가엾은 청년 1일 뿐이다.
> 젊은이들은 그 어느 때보다도 허무주의에 빠져있다. 10대와 20대와 같이 젊은 세대일수록 더욱 심하다. 세상에 대한 그 어떠한 준비도 되어있지 않은 채로 격동의 시대로 던져져 버린 청년들. 다가올 미래가 과거와는 너무나 다르기에 어른으로부터 배우지 못한 아이들, 파괴된 전통과 상식의 잔해 속을 헤매는 실존적 고아들.    
[출처](http://www.psychiatricnews.net/news/articleView.html?idxno=20468)

존재론적 외로움도, 미래에 대한 막막함도, 육신의 배고픔도 잊은 채로 행복할 수 있는 건 코오-딩 할 때 뿐이다. 좋게 말하면 취미, 나쁘게 말하면 도피처. 내 삶에는 이런 탈출구가 몇 개 있어 그나마 다행이다.

다음 프로젝트 시작은 1월 중순으로 계획되어 있다. 곧 새로운 설렘이 찾아올 예정이다. ㅎㅎ

> 마치며: 잠깐 쉬어가는 이 틈에 경제활동에도 참여해보고자(=용돈이나 벌어보고자) 배민커넥트 다시 준비중이다.