---
title: "GitHub 잔디밭 꾸미기 포기"
summary: "굳이 매일 커밋을 채워넣을 필요가 없는 것 같습니다..."
date: 2021-12-17 07:35:17 +0900
categories:
   - writings
---

작년 여름 즈음에 [1일 1커밋을 위한 약간의 트릭](https://blog.potados.com/dev/gardening-github/)이라는 글을 썼는데요, 1일 1커밋 못 했을 때에 잔디밭에 구멍 나는 것을 막기 위한 일종의 꼼수(?)였습니다.

이 방법으로 1년 넘게 푸릇푸릇한 잔디밭을 유지해 왔는데요, 요즈음은 *굳이 잔디밭을 꽉 채워야 할까* 하는 생각이 듭니다. 커밋 안 하고 지나가는 날이 당연이 있을 수 있는건데 말이죠. 굳이 신경쓰지 않기로 했습니다.

그런데 잔디밭이 꽉 차 있다가 갑자기 빈 칸이 생기기 시작하면 또 어색하니까, 이전에 인공적으로 채워넣었던 빈 커밋들을 지우기로 했습니다. 그 방법을 찾아 스택오버플로를 수소문하여 이런 명령을 알아냈습니다:

```bash
git filter-branch --commit-filter 'if [ z$1 = z`git rev-parse $3^{tree}` ]; then skip_commit "$@"; else git commit-tree "$@"; fi' "$@"
```

실행하니 커밋 수가 100개 남짓 줄어들었습니다.

사실 이걸 GitHub에 적용시키는 과정에서 헤프닝이 하나 있었는데요, 저렇게 로컬에서 작업한 내용을 GitHub에 force push 하였는데도 잔디밭에 변화가 없었습니다. 혹시나 싶어 `main`으로부터 새 브랜치를 판 다음에 그 브랜치를 GitHub Pages 브랜치로 지정했다가 다시 `main`으로 돌려놓으니 변경된 것이 반영되었습니다.

다시 돌아온 잔디밭을 보니 빈 칸 덕분에 contrast가 좀 살아나는 것 같습니다. 아주 입체적이에요. ㅋㅋㅋ

![github-grass-without-empty-commits.png](https://i.imgur.com/Atw7Kfh.png)

> 저기 유난히 발광하는 부분을 보니 [한창 힘들 때](https://blog.potados.com/writings/being-a-paid-worker)가 생각나네요. ㅠ
