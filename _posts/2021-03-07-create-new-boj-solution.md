---
title: "백준 새 문제 풀 때 귀찮은 점 해결해 봅시다"
excerpt: "문제번호.py 파일 자동으로 만들어 주는 스크립트를 만들어 보았습니다."
date: 2021-03-07 15:25:09 +0900
category: dev
---

## 들어가며

[solved.ac](https://solved.ac)에서 [class 1](https://solved.ac/class/1) 문제를 풀고 있습니다.

문제를 풀 때에는 보통 `문제 번호.py` 파일을 만들고 아래처럼 주석으로 문제 정보를 적고 시작합니다.

~~~python
# 1000번 A+B
# https://www.acmicpc.net/problem/1000
~~~

처음 몇 문제를 풀 때에는 딱히 불편함은 못 느꼈습니다. 그런데 앞으로 풀 문제가 수백 개인데 *새 파일 만들고 문제 번호랑 이름 적어넣고 링크 달고...* 하는 일을 수백 번 반복할 것을 생각하니 조금 "별로다" 생각이 들었습니다.

전형적인 단순노동입니다. 스크립트로 자동화하면 딱이죠.

## 요구사항 정리

`문제 번호`를 넣어 주면 주석이 채워진 `문제 번호.py` 파일을 만들어주는 스크립트를 만들면 됩니다.

## 짜 봅시다

일단 문제 번호로부터 문제 이름을 가져오는 부분이 실현 가능한지 확인해 봅니다. `curl` 명령을 사용해 간단한 크롤링을 시도해 보겠습니다.

~~~bash
$ curl https://www.acmicpc.net/problem/1000
<!DOCTYPE html>
<html lang="ko">
<head>
<title>1000번: A+B</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta charset="utf-8"><meta name="author" content="스타트링크 (Startlink)"><meta name="keywords" content="ACM-ICPC, ICPC, 프로그래밍, 온라인 저지, 정보올림피아드, 코딩, 알고리즘, 대회, 올림피아드, 자료구조"><meta http-equiv="X-UA-Compatible" content="IE=edge">
  ...(이하생략)...
~~~

> 응답이 너무 길어서 이하 생략했습니다.

오... 필요한 정보가 다 들어 있습니다.

`<title>1000번: A+B</title>` 부분을 주목해 주세요. 저 부분을 캐 오려면 대략 `^<title>(.*)</title>$` 같은 정규표현식을 쓰면 됩니다.

여기서 착안해 대략 30분의 검색 후에 `백준 문제 번호를 가지고 문제 이름을 가져오는 명령`을 만들었습니다.

~~~bash
$ curl -s -N "https://www.acmicpc.net/problem/$문제번호"| sed -n "s/^.*<title>\(.*\)<\/title>.*$/\1/p"
~~~

이제 핵심 부분은 완성되었습니다. 나머지는 어렵지 않게 완성할 수 있었습니다.

~~~bash
#!/bin/zsh

# 새 백준 문제 풀이 파이썬 파일을 만들어주는 스크립트.
#
# 문제 번호를 제공하면,
# - 해당 문제의 이름과 링크를 주석으로 포함하고
# - 문제 번호를 이름으로 가지는
# 파이썬 파일을 생성함.
#
# 사용법: ./new-boj [문제 번호]

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

if [ "$#" -eq 0 ]; then
  echo -n "백준 문제 번호: "
  read -r problem_number
else
  problem_number="$1"
fi

solution_file="$DIR/boj/$problem_number.py"
problem_link="https://www.acmicpc.net/problem/$problem_number"
problem_name=$(curl -s -N "$problem_link" | sed -n "s/^.*<title>\(.*\)<\/title>.*$/\1/p")

echo "# $problem_name" >> "$solution_file"
echo "# $problem_link" >> "$solution_file"

echo "$problem_name"
echo "$solution_file"
~~~

> DIR은 현재 스크립트의 절대 경로를 저장하는 변수입니다.

끝!

## 마치며

볼수록 느끼는거지만 유닉스 철학이 참 마음에 듭니다.

> 각 프로그램이 **하나의 일을 잘** 할 수 있게 만들 것. 새로운 일을 하려면, 새로운 기능들을 추가하기 위해 오래된 프로그램을 복잡하게 만들지 말고 새로 만들 것.

> 모든 프로그램 **출력이** 아직 잘 알려지지 않은 프로그램이라고 할지라도 **다른 프로그램에 대한 입력**이 될 수 있게 할 것. 무관한 정보로 출력을 채우지 말 것. 까다롭게 세로로 구분되거나 바이너리로 된 입력 형식은 피할 것. 대화식 입력을 고집하지 말 것.

> 소프트웨어를, 심지어는 운영 체제일지라도 이른 시기에 수주에 걸쳐 이상적으로 시도해가며 설계하고 만들 것. 어설픈 부분을 버리고 다시 만드는 것을 주저하지 말 것.

> 프로그래밍 작업을 가볍게 하기 위해, 심지어 우회하는 방법으로 도구를 만들고 바로 버릴지라도 어설픈 도움 보다는 **도구 사용을 선호**할 것.

~~이 모든게 궁극적으로는 게으름을 위한 것!~~

## 참고

- [capturing-groups-from-a-grep-regex](https://stackoverflow.com/questions/1891797/capturing-groups-from-a-grep-regex)
- [can-grep-output-only-specified-groupings-that-match](https://unix.stackexchange.com/questions/13466/can-grep-output-only-specified-groupings-that-match)
