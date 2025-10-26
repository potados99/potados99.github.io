---
title: "흙 대신 NPM 퍼나르는 삽질"
excerpt: "NPM v8로 업데이트했다가 난데없이 날아온 에러와 삽질, 그리고 버그 없는 가장 최신 NPM 버전 구하기."
date: 2022-02-02 19:05:14 +0900
category: dev
---

어제 새벽에 장대한 삽질을 했습니다. 동기는 다름이 아니라 GitHub의 dependabot 알림을 보고 취약 의존성을 업데이트하려 `npm audit fix`를 실행하려던 것이었습니다.

## 첫 번째 이슈: ERESOLVE

`npm audit fix`를 실행하자 마자 뻗었습니다. 에러 메시지는 아래와 같았습니다:

```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While resolving: cafeteria@4.8.4
npm ERR! Found: react-native@0.64.1
npm ERR! node_modules/react-native
npm ERR!   react-native@"0.64.1" from the root project
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer react-native@"^0.63.0" from react-native-auto-height-image@3.2.4
npm ERR! node_modules/react-native-auto-height-image
npm ERR!   react-native-auto-height-image@"^3.2.4" from the root project
npm ERR!
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force, or --legacy-peer-deps
npm ERR! to accept an incorrect (and potentially broken) dependency resolution.
```

읽어 보니, 프로젝트에서는 `react-native@0.64.1`을 쓰는 데 반해 같이 설치한 다른 라이브러리인 `react-native-auto-height-image@3.2.4`는 `react-native@^0.63.0`를 원하기 때문이랍니다. 결국 Peer dependency가 현재 프로젝트에 없어서 생긴 문제였습니다.

얼마 전에 `npm@6`에서 `npm@8`로 업데이트한 것이 직접적인 원인이었습니다. [`npm@7`부터는 패키지를 설치할 때에 peer dependency를 자동으로 설치해준다고 합니다.](https://stackoverflow.com/questions/66239691/what-does-npm-install-legacy-peer-deps-do-exactly-when-is-it-recommended-wh)

해결책은 로그에 나와있는 대로 `--force` 또는 `--legacy-peer-deps`를 넣어서 실행하는 것입니다. 이렇게 하면 `npm@6`과 같이 동작합니다.

## 두 번째 이슈: Cannot read property 'children' of null

위에서 알아낸 정보로 `npm audit fix --force`를 실행합니다. 아, 이번에는 또다른 에러가 반겨줍니다.

```bash
npm ERR! Cannot read property 'children' of null

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/potados/.npm/_logs/2022-02-02T11_19_06_143Z-debug-0.log
```

그냥 이렇게만 뜹니다. 그래도 로그 파일 위치는 알려주네요. 로그 파일이 지시하는 에러 발생 위치는 `@npmcli` 패키지 내부의 `can-place-deps.js` 파일입니다.

```javascript
// @npmcli/arborist/lib/can-place-dep.js
247       const entryNode = entryEdge.to
248       const entryRep = dep.parent.children.get(entryNode.name)
249       if (entryRep) {
250         if (entryRep.canReplace(entryNode, dep.parent.children.keys())) {
251           continue
252         }
253       }
```

248번 줄을 주목해주세요. `dep.parent.children`에 접근하고 싶은데, 사실 `dep.parent`는 `null`이었던겁니다. 저런 부분이 사실 하나 더 있습니다.

```javascript
// @npmcli/arborist/lib/can-place-dep.js
263             const rep = dep.parent.children.get(edge.name)
264             if (!rep) {
265               if (edge.to) {
266                 peerReplacementWalk.add(edge.to)
267               }
268               continue
269             }
```

여기는 263줄입니다. 해당 부분들을 모두 `dep.parent ? dep.parent.children.get(어쩌구) : null` 꼴로 바꾸면 적어도 저 에러는 발생하지 않습니다. 대신에 `npm audit` 명령이 무한루프에 빠집니다.

> 현재 프로젝트의 package.json과 package-lock.json에 개발자들이 예상하지 못한 시나리오가 들어 있는 것 같습니다. 그래서 저런 언어 차원의 에러도 대비가 안 되어 있는 것이겠지요. `npm audit fix --force` 명령을 성공적으로 수행하고 나면 그 이후부터는 해당 에러가 사라집니다. 어찌 보면 제 프로젝트 패키지 트리에 문제가 있었던 것.

## 세 번째 이슈: NPM 다운그레이드

저 문제의 코드는 [2021년 7월 29일](https://github.com/npm/cli/commit/97cb5ec312e151527ba2aab77ed0307917e1d845)에 커밋되었습니다. 저게 포함된 버전은 `@npmcli/arborist@2.8.0`. 음... 최신인 `npm@8.4.0`은 `@npmcli/arborist@4.3.0`을 씁니다.

어떤 버전의 `npm`으로 돌려야 이 문제가 해결될까요? 심지어 저것만이 원인이 아닐 수도 있습니다. 그래서 브루트 포스 접근을 선택했습니다.

실행하고 싶은 명령은 아래와 같습니다:

```bash
npm audit fix --force --dry-run --audit-level=none
```

`--dry-run`은 실제로 audit을 수행하지는 말라는 뜻이고, `-audit-level=none`은 audit 결과에 문제(취약점)가 있어도 종료 코드 1을 반환하지 말고 성공시키라는(종료 코드 0) 뜻입니다.

이제 해당 명령을 가장 최신 버전의 `npm`부터, 성공할 때까지 버전을 낮춰 가며 실행해 봅니다:

```bash
for i in $(
    npm view npm versions --json |
    jq -r '.[]' |
    tac |
    xargs -I % echo "npm@%"
);
    npx --yes -p $i \
    npm audit fix --force --dry-run --audit-level=none &&
    echo "$i succeeded." &&
    break ||
    echo "$i failed. continue.";
```

잠깐 바람 쐬러 나갔다 오니 `npm@8.1.0 succeeded.`가 출력되어 있습니다.

`npm@8.1.0`을 쓰면 이제 이 문제에서 벗어날 수 있습니다. 야호.

## 외전: audit은 포기

`npm audit`은 [프로젝트의 패키지 중 취약점이 발견된 것들을 감지해주고, 가능하다면 해결도 해줍니다.](https://www.whitesourcesoftware.com/free-developer-tools/blog/npm-audit/) 문제를 모두 해결하고 `npm audit fix --force`를 실행해 보았는데, 결과는 썩 만족스럽지 않았습니다. `react-native` 버전이 `0.64.1`에서 `0.61.4`로 바뀌어 있고, 다른 패키지 몇 개도 다운그레이드 되어 있는 등 breaking change가 너무 많았습니다. 그래서 패키지 취약점은 발견되는 대로 직접 관리하기로 하였습니다.

## 마치며

`npm` 관련 이슈로 삽질해본 것은 처음이네요. 덕분에 조금 더 알아갈 수 있었습니다.

## References

- [What does npm install --legacy-peer-deps do exactly? When is it recommended / What's a potential use case?](https://stackoverflow.com/questions/66239691/what-does-npm-install-legacy-peer-deps-do-exactly-when-is-it-recommended-wh)

- [NPM Audit: How to Enforce Your Code Security](https://www.whitesourcesoftware.com/free-developer-tools/blog/npm-audit/)

- [Viewing All Versions of an NPM Package (Including Pre-Release)](https://willi.am/blog/2015/07/17/viewing-all-versions-of-an-npm-package-including-pre-release/)

- [How to conditionally do something if a command succeeded or failed](https://unix.stackexchange.com/questions/22726/how-to-conditionally-do-something-if-a-command-succeeded-or-failed)

- [How can I reverse the order of lines in a file?](https://stackoverflow.com/questions/742466/how-can-i-reverse-the-order-of-lines-in-a-file)

- [라인 1줄로 만드는 담력테스트 게임](http://www.todayhumor.co.kr/board/view.php?table=humorbest&no=835182&s_no=835182&page=1)

- [Linux : Xargs 사용 방법, 예제, 명령어](https://jjeongil.tistory.com/1574)

- [How to remove double-quotes in jq output for parsing json files in bash?](https://stackoverflow.com/questions/44656515/how-to-remove-double-quotes-in-jq-output-for-parsing-json-files-in-bash)
