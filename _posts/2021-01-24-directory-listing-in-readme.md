---
title: "README.md에 소스 트리 보여주기 feat. tree & gsed"
summary: "저장소의 소스 트리를 실시간으로 README.md에 표시해 보았습니다."
date: 2021-01-24 19:33:10 +0900
categories:
   - dev
---

![readme-source-tree.png](/assets/images/readme-source-tree.png)

> 완성된 모습

## 들어가며

백준에서 문제를 하나 풀어보려던 참이었습니다. 코드는 어디에다가 보관할 지 고민하다가, 예전에 알고리즘 문제 풀이를 넣어 두던 [저장소](https://github.com/potados99/problem-solving)를 발견하였습니다.

![boj-solved-problems.png](/assets/images/boj-solved-problems.png)

> 1년도 더 되었군요...

당시 README.md가 텅 비어있었습니다. 해당 저장소에는 백준 온라인 저지(boj) 디렉토리 밑에 문제 번호를 이름으로 하는 소스 파일들이 들어 있었는데요, **이 목록을 README.md에 표시하고 싶다**는 생각이 들었습니다.

![problem-solving-tree-in-terminal.png](/assets/images/problem-solving-tree-in-terminal.png)

> 이런 식으로 말이죠.

README.md는 매우 정적인 파일입니다. HTML을 일부 지원하긴 하지만 자바스크립트를 끼워넣을 수는 없습니다. 결국 일일이 직접 업데이트해야 한다는 결론에 도달합니다.

더 나은 방법은 없을까요, 구글을 뒤져봅니다.

## `tree` 응용하기

![google-search-list-directory-in-readme.png](/assets/images/google-search-list-directory-in-readme.png)

> 972만개를 검색하는 데에 1초도 안 걸렸습니다. 역시 구글 대단해요.

빛으로 가득한 스택 오버플로가 제일 먼저 나옵니다. 맨 위에 있는 [질문](https://stackoverflow.com/questions/23989232/is-there-a-way-to-represent-a-directory-tree-in-a-github-readme-md)을 봅니다.

![so-answer-list-directory-in-readme.png](/assets/images/so-answer-list-directory-in-readme.png)

> 단호하네요.

채택된 답변을 보니, 역시나 직접적인 해법은 없다고 합니다. `tree` 명령의 결과를 `README.md`에 붙여넣으라고 합니다.

이건 좀 귀찮겠다 싶었습니다. 다른 답변을 더 찾아보려 스크롤을 내리다가, 흥미로운 [스크립트](https://stackoverflow.com/a/35889620/11929317)를 발견했습니다.

~~~bash
#!/bin/bash

#File: tree-md

tree=$(tree -tf --noreport -I '*~' --charset ascii $1 |
       sed -e 's/| \+/  /g' -e 's/[|`]-\+/ */g' -e 's:\(* \)\(\(.*/\)\([^/]\+\)\):\1[\4](\2):g')

printf "# Project tree\n\n${tree}"
~~~

이 스크립트를 사용하면 `tree`의 결과가 아래와 같이 마크다운 친화적으로 표시된다는 것입니다.

~~~
$ ./tree-md .
# Project tree

.
 * [tree-md](./tree-md)
 * [dir2](./dir2)
   * [file21.ext](./dir2/file21.ext)
   * [file22.ext](./dir2/file22.ext)
   * [file23.ext](./dir2/file23.ext)
 * [dir1](./dir1)
   * [file11.ext](./dir1/file11.ext)
   * [file12.ext](./dir1/file12.ext)
 * [file_in_root.ext](./file_in_root.ext)
 * [README.md](./README.md)
 * [dir3](./dir3)
~~~

이거면 적당하겠다 싶었습니다. 스크립트를 복사해서 실행해 봅니다.

그런데 기대한 대로 나오지 않고 그냥 `tree`의 결과가 출력됩니다. 어디서부터 문제일까 싶어 스크립트를 수정해 보았습니다.

~~~bash
tree -tf --noreport -I '*~' --charset ascii $1 | sed -e 's/| \+/  /g' -e 's/[|`]-\+/ */g' -e 's:\(* \)\(\(.*/\)\([^/]\+\)\):\1[\4](\2):g'
~~~

~~~bash
tree -tf --noreport -I '*~' --charset ascii $1
 ~~~

전자는 `tree`의 결과를 `sed`에 넘겨 주어 가공한 후 `stdout`으로 출력하고, 후자는 `tree`의 결과를 바로 출력합니다. 그런데 두 스크립트가 같은 결과를 출력했습니다. 즉, `sed`가 제대로 작동하지 않고 있었습니다.

## `sed`가 이상해요

스크립트를 실행한 환경은 macOS 11.0.1이었습니다. 맥은 Darwin 기반이고, 조상은 BSD입니다. 설치된 sed 또한 BSD sed였습니다.

혹시나 싶어 GNU sed가 설치된 GNU/Linux 환경으로 가서 스크립트를 실행해 봅니다. 잘 됩니다.

BSD sed와 GNU sed 모두 [POSIX sed 규격](http://pubs.opengroup.org/onlinepubs/9699919799/utilities/sed.html)은 준수합니다. 그런데 문제가 생겼다는 것은, 위 스크립트의 `sed` 식에 GNU 확장을 사용하는 비표준 코드가 있었다는 뜻이 됩니다.

[잘 정리된 글](https://riptutorial.com/sed/topic/9436/bsd-macos-sed-vs--gnu-sed-vs--the-posix-sed-specification)을 주욱 훑으며 찾아 봅니다.

> Caveat: do not assume that \\|, \\+ and \\? are supported: While GNU sed supports them (unless --posix is used), BSD sed does not - these features are not POSIX-compliant.

아... *| 문자 후에 공백이 하나 이상 있음*을 표현하기 위해 `| \+`를 사용했는데, 이게 표준에서 벗어나는 부분이었습니다.

그러면 이제 두 가지 선택지가 주어집니다.

- POSIX sed 규격을 준수하도록 코드 변경하기
- 맥에 GNU sed를 설치하기

고민 끝에 후자를 골랐습니다. 왜냐하면요,

- GNU를 개인적인 선호합니다(?)
- POSIX sed 표준은 기능이 너무 적습니다.
- 앞으로도 BSD sed를 사용하면 고통받을 것 같았습니다.

## gsed 설치하기

`gsed`는 `brew`를 이용해 쉽게 설치할 수 있습니다.

~~~bash
$ brew install gnu-sed
~~~

이제 `sed` 대신 `gsed`를 사용할 수 있습니다. 기존의 `sed`는 그래도 필요할 때가 있을 것 같아 놓아 두었습니다.

## 스크립트 다듬기

이제 스크립트를 어떻게 만들 지 고민을 시작했습니다.

가장 게으르고 편안한 사용 시나리오를 고민한 끝에, **커밋할 때마다 현재 소스 트리를 반영하도록 README.md를 업데이트**하는 방향으로 결정했습니다.

먼저 `README.md`를 업데이트하는 스크립트를 생각해 보았습니다.

제일 먼저 떠오른 것은 트리를 만들어 `README.md`의 내용 위에 덮어쓰는 것이었습니다.

~~~bash
$ generate_project_tree >> README.md
~~~

슬프게도, 이렇게 하면 문제가 발생합니다. `README.md`에는 프로젝트 트리 뿐만 아니라 저장소 개요와 같은 내용 또한 들어가야 합니다. 그런 내용은 마크다운 편집기를 통해 직접 작성해야 하구요.

그런데 `generate_project_tree`의 결과가 내용을 모두 덮어쓰게 된다면 **다른 내용을 `README.md`에 직접 작성할 수 없**게 됩니다.

그래서 `README.md`의 템플릿을 작성하였습니다.

### README 템플릿

사실 템플릿이라 하기도 거창합니다만,,, 그냥 특정 텍스트를 나중에 다른 텍스트로 치환할 수 있게 만드는 것입니다.

~~~markdown
# problem-solving

알고리즘 문제 풀이입니다.

## 해결한 문제들

__PROJECT_TREE__
~~~

> .readme_template.md

`__PROJECT_TREE__` 부분이 나중에 실제 프로젝트 트리로 치환될 부분입니다. C/C++의 전처리기와 비슷한 발상입니다.

그래서 이런 식으로 데이터가 흐르는 것이죠:

~~~bash
$ generate_project_tree | generate_readme >> README.md
~~~

- `generate_project_tree`: 프로젝트 트리를 만들어 `stdout`으로 출력합니다.
- `generate_readme`: 프로젝트 트리를 `stdin`으로 받아 README 템플릿에 채워넣어 진짜 `README.md`에 들어갈 내용을 만들고 `stdout`으로 출력합니다.

그러면 `README.md`는 템플릿의 내용을 기반으로 최신의 프로젝트 트리를 반영하게 됩니다.

이제 저 두 명령어를 각각의 함수로 만들어 하나의 파일에 잘 정리해 보겠습니다.

~~~bash
#!/bin/bash

function generate_project_tree() {
  # Original from https://stackoverflow.com/a/35889620/11929317
  # This is a ported version for mac

  IGNORED="venv|update-readme|README.md"
  SED_FOR_MAC="gsed"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v $SED_FOR_MAC >/dev/null; then
      SED=$SED_FOR_MAC
    else
      echo "$SED_FOR_MAC not installed!" && exit 1
    fi
  else
    SED="sed"
  fi

  tree -tf --noreport -I $IGNORED --charset ascii "$1" |
    $SED -e '1d' |                                        # Cut first line
    $SED -e 's/| \+/  /g' |                               # Remove duplicated '|'
    $SED -e 's/[|`]-\+/ */g' |                            # Replace '|--' with '*'
    $SED -e 's:\(* \)\(\(.*/\)\([^/]\+\)\):\1[\4](\2):g'  # Add link for contents
}

function generate_readme() {
  readme="$1/README.md"
  readme_template="$1/.readme_template.md"

  perl -p0e 's/__PROJECT_TREE__/`cat`/se' "$readme_template" > "$readme"
}

cd "$(dirname "$0")" || exit 1
generate_project_tree . | generate_readme .
~~~

`generate_project_tree`는 맥에서 실행하면 `gsed`를, 그 외의 경우에는 `sed`를 사용합니다.

`generate_readme`에서 템플릿의 `__PROJECT_TREE__` 부분을 치환할 때에는 여러 줄의 텍스트를 처리하기 위해 `perl`을 사용했습니다.

이 스크립트를 `update-readme`라고 부르겠습니다. 이제 `update-readme`를 커밋 직전마다 실행해야 합니다. 이건 git hook이 도와줄 겁니다.

## Git hook

Git 이벤트가 발생할 때에 어떤 일을 수행하도록 만들 수 있습니다. 예를 들어, 커밋 직전에 lint를 실행하거나, 커밋 직후에 커밋 메시지에 무언가를 추가할 수 있습니다.

Hook은 운영 체제가 실행할 수 있는 파일이라면 무엇이든 가능합니다. 가장 간단하게 쉘 스크립트일 수도 있고, 파이썬 스크립트 또는 바이너리일 수도 있습니다.

Git이 지원하는 hook은 `pre-commit`, `pre-push`, `post-update` 등이 있는데요,
여기서는 커밋 직전에 파일을 업데이트할 것이므로, `pre-commit` hook을 사용하면 됩니다.

프로젝트의 `./git/hooks` 디렉토리에 가보면 아래와 같은 샘플들이 준비되어 있습니다.

![git-hook-samples.png](/assets/images/git-hook-samples.png)

> `pre-commit.sample`은 파일 이름에 아스키가 아닌 문자가 들어있을 경우에 커밋을 중단하는 스크립트입니다.

여기에 `pre-commit`이라는 파일을 만들어 준 뒤, `chmode +x pre-commit` 명령으로 실행 권한을 줍니다.

그리고 내용을 채워 줍니다.

~~~bash
#!/bin/sh

GIT_DIR=$(git rev-parse --git-dir)
$GIT_DIR/../update-readme
~~~

Hook이 실행될 때의 working directory를 알 수 없으므로 `git rev-parse --git-dir`를 사용해 해당 저장소 `.git` 디렉토리의 절대 경로를 구했습니다.

이제 매 커밋마다 최신 버전의 프로젝트 트리가 `README.md`에 반영됩니다.

**끝!**

## 마치며

역시 자동화는 좋습니다.

## 참고

- [BSD/macOS Sed vs. GNU Sed vs. the POSIX Sed specification](https://riptutorial.com/sed/topic/9436/bsd-macos-sed-vs--gnu-sed-vs--the-posix-sed-specification)

- [8.3 Git맞춤 - Git Hooks](https://git-scm.com/book/ko/v2/Git맞춤-Git-Hooks)
