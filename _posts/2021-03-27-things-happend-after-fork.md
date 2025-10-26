---
title: "fork() 후에 생기는 일"
excerpt: "메모리 공간과 file descriptor 위주로 복습해 보았습니다."
date: 2021-03-27 16:28:59 +0900
category: dev
---

## 들어가며

친구가 운영체제 과제를 하면서 C의 시스템 호출 `fork()` 함수를 다루고 있었습니다. 부모 프로세스와 자식 프로세스 사이에서 신호를 주고받는 방법을 연구하고 있었는데, 이 부분이 잘 기억이 안 나 복습할 겸 정리해 보았습니다.

## fork()

![man-fork.png](/assets/images/s89hfBJ.png)

`fork()`는 새 프로세스를 만드는 시스템 호출입니다. 새로 생성된 프로세스(=자식 프로세스)는 몇 가지를 제외하고는 호출자 프로세스(=부모 프로세스)와 동일합니다.

[POSIX 표준](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fork.html#tag_16_156_08)에 따르면, `fork()`의 용도는 두 가지입니다.

> There are two reasons why POSIX programmers call fork(). One reason is to **create a new thread of control within the same program** (which was originally only possible in POSIX by creating a new process); the other is to **create a new process running a different program**. In the latter case, the call to fork() is soon followed by a call to one of the exec functions.

하나는 같은 프로그램에서 새로운 제어 흐름을 만드는 것입니다. 스레드와 비슷한 용도입니다. 물론 스레드와는 다른 점이 많습니다. 이 내용은 [Forking vs Threading](http://www.geekride.com/fork-forking-vs-threading-thread-linux-kernel/)에서 자세히 다룹니다. `fork()`는 스레드 대신 프로세스를 만든다는 점에서 "poor-man’s threading"이라고도 불립니다.

다른 하나는 다른 프로그램을 실행하는 새 프로세스를 만드는 것입니다. 가장 간단한 예시는 쉘에서 명령어를 통해 프로세스를 실행하는 것입니다. 사용자가 명령어를 실행하면 쉘은 `fork()`를 통해 자식 프로세스를 만들고, `exec()`를 통해 주어진 명령에 해당하는 프로그램을 실행합니다.

`fork()`를 통해 만들어진 자식 프로세스에 대해 [알아야 할 것](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fork.html#tag_16_156_08)이 있습니다:

- 자식 프로세스는 고유한 프로세스 ID를 가집니다.
- 자식 프로세스는 고유의 메모리 공간을 가집니다.
- 자식 프로세스는 부모 프로세스의 file descriptor의 복사본을 가집니다. 부모와 자식 프로세스의 file descriptor는 같은 파일을 가리킵니다.

여러 개 중 몇 개만 간추려 보았습니다. 하나씩 코드를 작성하며 이해해 보겠습니다.

## 자식 프로세스는 고유한 프로세스 ID를 가진다.

아래와 같은 코드를 보겠습니다.

~~~c
#include <stdio.h>
#include <unistd.h>
#include <errno.h>

int main(int argc, const char * argv[]) {
    int pid;

	puts("Press Ctrl-C to stop");

	pid = fork();
	if (pid == -1) {
		// possible errors: EAGAIN, ENOMEM.
	    perror("Failed to fork");
	    return -1;
	}

	if (pid == 0) {
		// child
		printf("Child pid: %d\n", getpid());
		while (1);
	} else {
		// parent
		printf("Parent pid: %d\n", getpid());
		while (1);
	}

	return 0;
}
~~~

`fork()` 후 각각 자식/부모 프로세스에서 자신의 프로세스 ID를 출력하고 루프에 빠지는 코드입니다.

실행해 보면 다음과 같은 출력을 얻을 수 있습니다:

~~~
Press Ctrl-C to stop
Parent pid: 23729
Child pid: 23730
~~~

아직 두 프로세스는 무한루프를 돌고 있기 때문에 종료되지 않았습니다. 이 때를 틈타 자식 프로세스의 프로세스 ID가 유일한지 확인해 봅니다.

~~~bash
$ ps aux | grep 23730
potados          23730  95.8  0.0  4277500    408 s000  R+    6:08PM   0:49.76 ./run
~~~

해당 pid를 가지는 프로세스는 하나밖에 보이지 않습니다. 자식 프로세스의 pid는 unique합니다.

## 자식 프로세스는 고유의 메모리 공간을 가진다.

아래와 같은 소스 코드를 준비합니다:

~~~c
#include <stdio.h>
#include <unistd.h>
#include <errno.h>

int global_count = 0;

int main(int argc, const char * argv[]) {
	int local_count = 0;
    int pid = fork();

	if (pid == -1) {
		// possible errors: EAGAIN, ENOMEM.
	    perror("Failed to fork");
	    return -1;
	}

	if (pid == 0) {
		// child
		global_count++;
		local_count++;

		printf("[Child] global count: %d(%p)\n", global_count, &global_count);
		printf("[Child] local count: %d(%p)\n", local_count, &local_count);
	} else {
		// parent
		sleep(1);

		printf("[Parent] global count: %d(%p)\n", global_count, &global_count);
		printf("[Parent] local count: %d(%p)\n", local_count, &local_count);
	}

	return 0;
}
~~~

전역 변수와 지역 변수를 `fork()` 전에 먼저 준비한 다음, 두 프로세스가 분기된 후 변경을 가합니다.

실행 결과는 다음과 같습니다:

~~~
[Child] global count: 1(0x10ddc5028)
[Child] local count: 1(0x7ffee1e4283c)
[Parent] global count: 0(0x10ddc5028)
[Parent] local count: 0(0x7ffee1e4283c)
~~~

두 프로세스에서 각각의 변수가 위치한 메모리의 주소는 같습니다. 허나 해당 메모리에 가해진 변경은 두 프로세스에서 공유되지 않습니다. 즉, 두 프로세스는 각각 독립된 별도의 가상 메모리 공간을 가진다는 것을 알 수 있습니다.

## 자식 프로세스는 부모 프로세스의 file descriptor의 복사본을 가진다.

이 부분이 제일 헷갈렸던 부분입니다. [매뉴얼](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fork.html#tag_16_156_08)에서는 자식 프로세스가 부모의 file descriptor의 복사본을 가진다고 했습니다. 또한 자식의 각 file descriptor는 부모의 그것과 같은 파일을 가리킨다고 했습니다.

이는 어느 정도 추측할 수 있는 부분입니다. 대부분의 unix/linux 프로세스는 [세 개의 file descriptor](https://ko.wikipedia.org/wiki/표준_스트림)를 가집니다. 0은 `stdin`, 1은 `stdout`, 2는 `stderr`이죠. 해당 숫자는 각각의 스트림에 대응되도록 [정해져 있습니다](https://stackoverflow.com/questions/22367920/is-it-possible-that-linux-file-descriptor-0-1-2-not-for-stdin-stdout-and-stderr).

쉘에서 `fork()`를 사용하는 프로그램을 실행하면 자식과 부모 프로세스에서 출력한 문자들이 모두 같은 터미널에 표시됩니다. 이를 통해 두 프로세스가 `stdout`을 공유한다는 것을 알 수 있습니다.

또한 `stdout`의 file descriptor 번호는 1로 고정입니다. 따라서 자식 프로세스가 `stdout`을 사용했다는 것은 자식 프로세스의 `stdout` 또한 file descriptor 1에 연결되었다는 것을 알 수 있습니다.

따라서 자식 프로세스는 부모의 file descriptor를 복사해 소유하며, 해당 descriptor는 부모의 그것과 같은 파일을 가리킨다고 생각할 수 있습니다.

코드를 통해 검증해 보겠습니다. 위의 `자식 프로세스는 고유한 프로세스 ID를 가진다.`에 사용한 소스 코드를 그대로 가져와 보겠습니다.

~~~c
#include <stdio.h>
#include <unistd.h>
#include <errno.h>

int main(int argc, const char * argv[]) {
    int pid;

	puts("Press Ctrl-C to stop");

	pid = fork();
	if (pid == -1) {
		// possible errors: EAGAIN, ENOMEM.
	    perror("Failed to fork");
	    return -1;
	}

	if (pid == 0) {
		// child
		printf("Child pid: %d\n", getpid());
		while (1);
	} else {
		// parent
		printf("Parent pid: %d\n", getpid());
		while (1);
	}

	return 0;
}
~~~

이제 이 프로그램을 실행한 뒤 쉘을 통해 각각 프로세스의 1번 file descriptor로 무언가를 써 보겠습니다.

~~~bash
$ ./run
Press Ctrl-C to stop
Parent pid: 879
Child pid: 880
~~~

이 상태에서 새 터미널을 띄우고 아래 명령을 실행합니다. 자식 프로세스의 `stdout`으로 "hello"라는 문자를 출력하는 명령입니다.

~~~bash
echo "hello" > /proc/880/fd/1
~~~

그리고 다시 원래 터미널로 돌아오면 아래처럼 새 줄이 출력되어 있습니다:

~~~bash
$ ./run
Press Ctrl-C to stop
Parent pid: 879
Child pid: 880
hello
~~~

이번에는 부모 프로세스의 `stdout`에 "hahaha"라고 출력해 보겠습니다.

> 맥(BSD 기반)에는 /proc 디렉토리가 없어 리눅스 환경으로 이동했습니다...

~~~bash
echo "hahaha" > /proc/879/fd/1
~~~

그러면 원래 터미널에는 또 한 줄이 출력됩니다.

~~~bash
$ ./run
Press Ctrl-C to stop
Parent pid: 879
Child pid: 880
hello
hahaha
~~~

이 터미널은 처음에는 부모 프로세스의 표준 스트림에 연결되어 있었습니다(`stdin`, `stdout`, `stderr`). `fork()` 후에는 자식 프로세스가 부모의 표준 스트림을 공유함에 따라 터미널이 자식 프로세스의 표준 스트림에도 연결된 것입니다. 따라서 두 프로세스가 만든 `stdout` 출력이 모두 한 터미널에 보인 것이죠. 간단하게 말해서, **두 개의 프로세스가 하나의 파일에 쓰는 것**과 같습니다.

그림으로 나타내면 아래와 같습니다.

![two-processes-same-shell.png](/assets/images/InWkqiD.png)

대강 `stdout`만 나타내어 보았습니다. 자식 프로세스는 부모의 file descriptor 테이블을 복사해 가져오고, 각각 descriptor는 부모가 가리키는 것과 같은 파일을 가리킵니다.

### pipe()를 사용한 프로세스간 통신에서

`fork()`를 통해 만들어진 자식 프로세스와 부모 프로세스가 통신하는 방법 중 하나는 `pipe()`를 사용하는 것입니다. `pipe()`는 커널이 관리하는 무명 pipe를 생성해 줍니다.

아래 예제 코드를 보겠습니다.

~~~c
#include <stdio.h>
#include <unistd.h>
#include <errno.h>

#define IN 0
#define OUT 1

int main(int argc, const char * argv[]) {
    int pid;
	int pipe_fd[2];

	if (pipe(pipe_fd) == -1) {
		// possible errors: EFAULT, EMFILE, ENFILE.
		perror("Failed to create pipe");
		return -1;
	}

	printf("pipe_fd[IN]: %d, pipe_fd[OUT]: %d\n", pipe_fd[IN], pipe_fd[OUT]);

	pid = fork();
	if (pid == -1) {
		// possible errors: EAGAIN, ENOMEM.
	    perror("Failed to fork");
	    return -1;
	}

	if (pid == 0) {
		// child
		printf("Child pid: %d\n", getpid());
		while (1) {
			write(pipe_fd[OUT], "hello", 5);
			sleep(1);
		}
	} else {
		// parent
		printf("Parent pid: %d\n", getpid());
		char buf[10];
		while (1) {
			read(pipe_fd[IN], buf, 10);
			printf("Incomming message from child process: %s\n", buf);
		}
	}

	return 0;
}
~~~

Pipe는 프로세스 입장에서는 파일 또는 표준 스트림과 같습니다. File descriptor 테이블을 공유하는 두 프로세스는 **서로 연결된 pipe 스트림**을 통해 통신할 수 있습니다. `stdin`이 파일에서 프로세스로, `stdout`이 프로세스에서 파일로 이어지는 것과 달리 pipe는 프로세스에서 프로세스로 이어집니다.

시스템에 따라 다르지만, [POSIX. 1-2001에 따르면 파이프는 단방향입니다](https://linux.die.net/man/7/pipe). 그래서 `pipe()` 호출은 그 결과로 두 개의 file descriptor를 제공합니다. 하나는 읽는 데에, 하나는 쓰는 데에 사용합니다.

아래는 간단하게 나타낸 프로세스간 pipe 통신입니다.

![pipe-between-parent-and-child.png](/assets/images/QmOzfNM.png)

Pipe는 각 프로세스가 아닌 커널에 의해 관리됩니다. 위의 예제를 실행한 뒤 열려있는 file descriptor 목록을 보면 아래와 같습니다.

~~~bash
$ ls -la                                                                                          
total 0
dr-x------ 2 potados potados  0 Mar 27 19:24 .
dr-xr-xr-x 8 potados potados  0 Mar 27 19:24 ..
lrwx------ 1 potados potados 64 Mar 27 19:24 0 -> /dev/pts/0
lrwx------ 1 potados potados 64 Mar 27 19:24 1 -> /dev/pts/0
lrwx------ 1 potados potados 64 Mar 27 19:24 2 -> /dev/pts/0
lr-x------ 1 potados potados 64 Mar 27 19:24 3 -> pipe:[142710]
l-wx------ 1 potados potados 64 Mar 27 19:24 4 -> pipe:[142710]
~~~

3번과 4번 file descriptor는 각각 읽기, 쓰기용입니다. 0, 1, 2와는 다르게 이들은 `pipe:[142710]`로 이어집니다. 이는 커널에서 관리하는 pipe입니다.

## 마치며

오랜만에 찾아보며 공부하니 좋습니다. 리눅스의 IPC는 참 잘 디자인된 것 같습니다.

본문에 사용된 예제 소스 코드는 [이 저장소](https://github.com/potados99/learn-fork)에도 있습니다.

## 참고

- [fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html)
- [fork](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fork.html#tag_16_156_08)
- [Forking vs Threading](http://www.geekride.com/fork-forking-vs-threading-thread-linux-kernel/)
- [표준 스트림](https://ko.wikipedia.org/wiki/표준_스트림)
- [Is it possible that linux file descriptor 0 1 2 not for stdin, stdout and stderr?](https://stackoverflow.com/questions/22367920/is-it-possible-that-linux-file-descriptor-0-1-2-not-for-stdin-stdout-and-stderr)
- [pipe(7)](https://linux.die.net/man/7/pipe)
