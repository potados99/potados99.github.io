---
title: "개발자는 왜 공부를 해야 할까요"
summary: "진짜 실력을 키워보자구요."
date: 2021-02-08 09:54:51 +0900
categories:
   - writings
---

> 블로그에 매주 포스트를 올리기로 마음을 먹었습니다. 재미난 것을 해야 글감이 생기는데, 정신을 차리고 보니 이번 주는 한 것 없이 흘러갔습니다. 그래서 평소에 생각하던 것을 써 보았습니다.

![campus-grass.jpg](https://i.imgur.com/VodC461.jpg)

공부라 하면 '초등학교-고등학교에 걸쳐 입시를 위해 준비하는 행위'가 떠오릅니다. 수업을 듣고 학원에 다니며, 예습과 복습을 하는 모습이죠. 공부라는 단어의 가장 흔한 쓰임입니다. 그런데 '개발자의 공부'를 이야기할 때에는 '공부'를 다시 정의할 필요가 있습니다.

간접적으로 정의해보겠습니다. 공부를 하면 실력이 올라갑니다. 개발자의 실력은 단순히 많이 아는 것을 뜻하지 않습니다. 숫자로 보는 연차나 쌓아올린 지식의 총량은 실력을 말해주지 않습니다. 실력은 처음 보는 문제를 파악하고 해결하는 능력과 새로운 지식을 습득하는 능력입니다. 그러므로 공부는 실력을 키우는 일, 즉 문제 해결 능력과 학습 능력을 증진시키는 행위입니다.

피상적으로, 단편적 지식을 흡수하는 행위를 공부라고 한다면 우리는 매일 피드에 올라오는 개발 글을 읽고 어제 나온 라이브러리를 써보고 토이 프로젝트를 여러 개 만들어 보는 것으로써 이를 실천할 수 있을 것입니다. 그러면 새 프로젝트를 시작할 때에 어떤 기술을 사용할지 자신있게 정할 수 있겠죠. 하지만 그 정도만으로 우리가 만족할까요? 우리는 더 많은 것을 원합니다. 낯선 문제를 풀어내는 '통찰'을 가지고 싶어 합니다.

5년 전을 떠올려 보겠습니다. iOS로 시간표 앱을 만들고 있었습니다. 급식 정보를 보여주는 화면이 있었는데, 요일별/시간대별 식단을 표시해 주어야 했는데, 어떻게 해야 할 지 몰라 하나의 콜백에 if문을 21개나 반복했습니다. 조건 속에 =< 연산자를 썼다가(순서가 바뀌었습니다) 왜 빨간 줄이 그어지는지 몰라 한참을 고생하기도 했습니다. if문 자체도 상당히 두꺼워 몇 글자씩만 다른 코드 뭉텅이가 수백 줄을 차지했습니다. 만약 변경이 생기면 불안한 검색-대치 기능을 쓰거나 21번의 단순 노동을 해야 했습니다.

왜 그런 일이 생겼을까요? 일단 단편적 '지식'이 전무했습니다. iOS 플랫폼이 처음이었습니다. 물론 Objective-C도요. 그리고 더욱 중요한 것인, 프로그래밍의 '개념'이 없었습니다. CPU가 명령(instruction)을 실행하는 구조가 지속되는 한 가장 기초적이고 중요한 부분인 변수, 프로시저, 분기, 반복에 대한 개념이 없었습니다. 아무것도 모른 채로 예제를 보고 따라하고, 안 된다 싶으면 스택 오버플로를 찾아갔습니다. 눈을 감은 채로 소리만 들으며 비포장도로를 달리는 모양새였습니다.

조금은 극단적인 예시였습니다만, 소프트웨어를 만들려면 본질에 가까운 '개념'과 국지적인 '지식'을 모두 가지고 있어야 합니다. 개발과 학습을 이렇게 비유하고 싶습니다. 큰 그림을 보면서 새로운 퍼즐 조각들을 적절한 위치에 끼워넣는 것. 작은 지식의 단편만 있어도 무언가를 만들 수는 있습니다. 하지만 전체를 볼 수 없다면 조각을 어디에다가 두어야 할 지 알 수 없을 뿐만 아니라 쉽사리 잃어버리기 마련입니다. 무언가를 익혀도 기존의 지식 기반과 통합되지 않으면 곧 녹아 사라집니다. 그리고 큰 그림을 손에 들고 있지 않으면 곧 방향이 헷갈리고 의지가 꺾입니다. 소프트웨어를 개발하며 겪는 대부분의 일들은 지식 자체가 아니라 축적된 지식 기반이 만들어내는 통찰을 요구하기 때문입니다.

주어진 대로 만들기는 쉬워도 버그 또는 원치 않는 동작이 발생하였을 때에 대처하기는 어렵습니다. 이는 조금 더 넓은 시각을 요구합니다. 당장 구글에 해결책을 검색할 때만 해도 그렇습니다. 이 문제가 내가 짠 로직에 의한 것인지, 아니면 사용한 라이브러리에 의한 것인지, 아니면 플랫폼의 사용법을 몰라서 생긴 것인지, 아니면 일시적인 빌드 오류인 것인지, 아니면 전부 다인지 정도는 짐작해야 합니다. 돌아는 가는데 무언가 조금 예상에서 엇나가는 동작을 하는 경우도 그렇습니다. 상황을 정확히 묘사하거나 원인에 근접하여 짐작할 수 있어야 합니다. 전체를 보는 눈이 없다면 아주 어려운 일입니다.

그렇기 때문에 개발자는 본질에 다가가려는 노력을 해야 합니다. 쇼케이스에 자신의 기술 스택을 전시하듯이 하는 것은 지양하고, 그 기술들을 이루는 불변의 본질을 좇아야 합니다. 그 여정에서 설계 철학, 패턴, 패러다임을 앎과 동시에, 그 배움의 경험이 쌓임으로 인해 공부를 하는 방법 자체 또한 익히게 됩니다. 이 모든 것은 스스로 해야 합니다. 강의를 보며 '우아하게' 코드를 따라 치거나 레퍼런스를 복제하는 것도 좋지만, 때로는 울타리를 벗어나서 내가 밟고 있는 이 땅이 무엇인지, 땅 끝과 땅 밑에는 어떤 것이 있는지 두 눈으로 직접 확인하려는 노력을 기울여야 합니다.

삽질을 적극적으로 해야 합니다. 버그를 해결하고 나면 원래 기능을 구현하는 데에 필요했던 지식의 최소 수 배 이상을 습득하게 됩니다. 그리고 그것은 뼈에 새겨져 절대로 잊어버릴 수 없습니다. 그야말로 가장 자연스럽고 주도적이며 효율적인 공부입니다. 그렇기 때문에 삽질은 시간 낭비가 아닙니다. 그렇게 '날린' 시간들은 실력으로 환원됩니다. 뜨는 해를 바라보며 맞이한 절망과 기쁨의 순간들은 다음 문제를 헤쳐나가는 힘이 됩니다. 그러므로 삽질은 본질을 탐구하는 값진 노력이라고 생각하는 편이 맞습니다.

오히려 고통 없이 평탄하게 흘러가는 개발을 조금 경계할 필요가 있습니다. 그것은 통찰을 요구하지 않을, 즉 공부와 성장의 동기를 제공하지 않을 가능성이 큽니다. 보통의 개발은 자신이 가진 것보다 조금 더 많은 능력을 요구합니다. 이를 얻기 위해서는 공부를 해야 합니다. 공부를 하면 성장을 이룰 수 있습니다. 반대로 만만하고(?) 통찰을 요구하지 않는 개발은 성장의 동력을 빼앗아 갑니다. 성장을 하지 않으면 현실적으로 커리어를 유지하기 힘들어 집니다. 따라서 개발자로서 잘 살고 싶다면 조금은 어려운 프로젝트를 선택하여 꾸준히 도전하고, 이를 이겨내기 위해 배움의 끈을 놓지 말아야 합니다.
