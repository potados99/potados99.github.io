---
title: "[Shell] 마크다운으로 글 쓸 때에 이미지 쉽게 넣기"
date: 2020-06-20 00:01:10 +0900
categories:
   - dev
---

## 들어가며

블로그를 Jekyll로 제작하고 GitHub에서 호스팅하면서 가장 불편한 것은 글에 이미지를 넣는 것이었다. 보통(ex. 네이버) 온라인 편집기는 이미지 업로드 버튼을 제공한다. 이미지를 올리면 서버에 임의의 이름으로 올라가고 글 본문에 `<img src="/어쩌구/저쩌구.png">` 태그를 집어넣는다.

여기서는 블로그 repository 어딘가에 이미지를 올리고 `![이미지 설명](/이미지/위치/파일이름.png)`와 같이 마크다운 태그로 이를 불러와야 한다. 이미지를 한 장 올리려면 해야 하는 일이

- 이미지를 적절한 폴더에 복사
- 해당 이미지 파일 이름을 복사
- `![](/이미지/위치/파일이름.png)` 형태로 태그 만들어서 본문에 작성

으로 무려 이미지 하나 넣기 위해서 삼중고를 겪어야 하는 것이다.

하지만 이는 단순 반복 작업이라, 쉘 스크립트로 대체 가능하다.

## 구상

어느 에디터를 사용하든, 글에 집어넣을 이미지는 직접 선택해야 한다. 따라서 스크립트에 이미지의 경로를 넘겨주도록 한다.

스크립트는 주어진 이미지를 이 블로그 repository 내의 이미지 폴더(`/assets/images/`)에 복사한 후 `![]()` 꼴의 태그를 만들어 **클립보드에 복사하여 준다.** 그러면 원하는 위치에 해당 태그를 붙여 넣으면 된다.

## 구현

### 주의

> 파일 경로를 다루는 쉘 스크립트에서 주의해야 할 점이 있다. 쉘 스크립트의 위치와 해당 스크립트를 실행하는 working directory가 다를 수 있다. 
예를 들어, 스크립트가 `~/scripts/some.sh`에 위치하는데 이를 `~/scripts/`에서 실행하지 않고 가령 홈에서 바로 실행한다면 스크립트 내에서 현재 디렉토리 위치는 `~/`이(가) 될 것이다. 현재 위치가 당연히 `~/scripts/`일 것이라고 가정하면 문제가 생길 수 있다.    
이를 해결하기 위해 `realpath` 명령을 사용하여 시스템 상에서의 스크립트의 절대경로를 알아낸다.    
~~~shell    
DIR="$(dirname "$(realpath "$0")")"    
~~~    
그리고 스크립트가 있는 디렉토리로부터 다른 곳에 접근하고 싶으면 `$DIR/아무데나`와 같이 사용하면 된다.

인자가 부적절할 때에 사용법을 알려주는 `usage`, 이미지를 `/assets/images`로 복사하는 `copy_image`, 이미지 경로로부터 마크다운 태그를 생성하는 `get_image_md`, 이렇게 세 개의 함수가 있다.

~~~shell
imagepath=$1

# Copy given image to assets/images.
copy_image $imagepath

# Get markdown expression for the image and copy it to clipboard..
get_image_md $imagepath | pbcopy

echo "Copied to clipboard!"
~~~

별 거 없다. 사실 너무 별 거 없어서 중간에 작업 실패했을 때에 멈추는 로직도 없다.

`pbcopy`는 처음 써보는데, 이 명령은 `stdin`으로 들어온 내용을 클립보드에 써준다. 즉, `echo 헤헤 | pbcopy`를 쉘에서 실행하면 클립보드에 '헤헤'가 들어간다.

> `pbcopy`가 클립보드에 쓰는 명령이라면, `pbpaste`는 클립보드로부터 가져오는 명령이다.

## Reference

- https://osxdaily.com/2009/12/09/access-the-clipboard-from-the-command-line/
- https://stackoverflow.com/questions/242538/unix-shell-script-find-out-which-directory-the-script-file-resides
- https://www.cyberciti.biz/faq/bash-get-filename-from-given-path-on-linux-or-unix/
- https://stackoverflow.com/questions/14860492/how-to-close-img-tag-properly
