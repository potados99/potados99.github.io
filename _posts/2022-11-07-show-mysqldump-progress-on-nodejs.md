---
title: "NodeJS로 mysqldump하고 진행 상황 확인하기"
summary: "파이프라인과 스트림"
date: 2022-11-07 23:16:21 +0900
categories:
   - dev
---

## 들어가며

MySQL 데이터베이스를 백업할 때에는 `mysqldump`를 사용할 수 있습니다.

```bash
$ mysqldump -upotados -p1234 cafeteria > dump.sql
```

진행 상황을 보고 싶으면 [pv를 사용](https://stackoverflow.com/a/32361604/11929317)하면 됩니다.

```bash
$ mysqldump -upotados -p1234 cafeteria | pv --progress --size 8m > dump.sql
```

위 명령은 `mysqldump`의 표준 출력(`stdout`)으로 나온 결과를 `pv`에 통과시킨 다음에 `dump.sql` 파일에 쓰는 명령입니다. `pv`를 통과한 출력은 아래와 같은 콘솔 출력으로 흔적을 남깁니다:

```
[===> ] 20%
```

좋습니다. 커맨드라인으로 스트림 출력의 진행 상황을 열람하는 방법이 준비되어 있습니다. 그런데 NodeJS에서 쉘 명령을 실행하는 경우에 진행 상황을 콜백으로 받아보고 싶다면 어떨까요?

## NodeJS에서 다른 프로세스 실행하기

쉘 명령을 실행한다는 것은 결국 [주어진 이름을 가지는 executable을 자식 프로세스로 실행](https://stackoverflow.com/a/20643568/11929317)한다는 것입니다. NodeJS는 이를 도와주는 내장 모듈 `child_process`를 제공합니다.

```typescript
import { spawn } from "child_process";

const child = spawn('mysqldump', ["-upotados", "-p1234", "cafeteria"]);

child.stdout.on("data", (data) => {
  // 출력 청크가 여기에 나와요
  console.log(data);
});

```
이렇게 하면 자식 프로세스의 `stdout`에 출력이 생기는 대로 받아서 볼 수 있습니다.

> child.stdout.setEncoding('utf8'); 하면 출력 데이터를 텍스트로 볼 수 있습니다. 기본으로는 `Buffer`가 나옵니다.

## pv 패키지와 pipe

`pv`를 npm 패키지로 찾아보니 [아, 있습니다!](https://www.npmjs.com/package/pv) 사용법도 깔끔하니 좋습니다.

```typescript
import PV from 'pv';

const child = /* ... */;

const pv = PV({
  size: /* ... */,
  name: /* ... */,
  time: /* ... */
})

pv.on('info', (info) => {
  console.log(info);
  /*
  {
    name: 'test',
    percentage: 9.05,
    transferred: 949624,
    eta: 42,
    speed: 949624
  }
  */
})

child.stdout.pipe(pv);
```

`pv`라는 스트림을 만들어 `chile` 프로세스의 `stdout` 다음에 붙여 주면 됩니다. 그리고는 이어서 파일 출력으로도 보낼 수 있습니다.

```typescript
child.stdout.pipe(pv).pipe(fs.createWriteStream('dump.sql'));
```

한가지 아쉬운 것은, `pv` 패키지가 Typescript를 지원하지 않는 것입니다. 그래서 [소스 코드](https://github.com/roccomuso/pv/blob/master/index.js)를 열어 보니, [또 다른 패키지인 progress-stream](https://www.npmjs.com/package/progress-stream) 을 감싸는 형태로 구현되어 있었습니다.

```javascript
var progress = require('progress-stream')

module.exports = function (opts) {
  ...
  var str = progress({
    ...
  })

  str.on('progress', function (progress) {
    str.emit('info', {
      ...
    })
  })

  return str
}
```

다행히 `progress-stream`은 Typescript를 지원합니다. 그래서 직접 가져다 쓰기로 했습니다.

## `progress-stream`을 사용한 `CommandRunner` 구현

주어진 명령을 실행하면서 진행 상황을 보여주고 결과를 파일로도 저장하는 `CommandRunner`를 만들었습니다. 이렇게 사용합니다:

```Typescript
new CommandRunner("mysqldump", ["-upotados", "-p1234", "cafeteria"])  
  .setOutputFile("dump.sql")  
  .setProgressMax(1024 * 1024 * 7.5 /*대략 7.5MB*/)  
  .setProgressInterval(10 /*10밀리초에 한 번씩 progress 확인*/)  
  .setProgressListener((p) => console.log(p))  
  .run()
  .then(() => console.log("끝!"));
```

구현은 다음과 같습니다:

```Typescript
import { spawn } from "child_process";
import { Stream } from "stream";
import fs, { WriteStream } from "fs";
import progress, { ProgressListener, ProgressStream } from "progress-stream";

/**
 * 명령을 실행해주는 클래스입니다.
 * 명령의 출력을 파일로 내보낼 수 있으며, 출력 진행 상황을 콜백으로 전달받을 수 있습니다.
 */
export default class CommandRunner {
  constructor(private readonly command: string, private readonly args: ReadonlyArray<string>) {}

  private outputFile?: string;
  private progressMax?: number;
  private progressInterval?: number;
  private progressListener?: ProgressListener;

  setOutputFile(filePath: string): CommandRunner {
    this.outputFile = filePath;
    return this;
  }

  setProgressMax(lengthInBytes: number): CommandRunner {
    this.progressMax = lengthInBytes;
    return this;
  }

  setProgressInterval(interval: number): CommandRunner {
    this.progressInterval = interval;
    return this;
  }

  setProgressListener(onProgress: ProgressListener): CommandRunner {
    this.progressListener = onProgress;
    return this;
  }

  /**
   * 명령을 실행하고, 경우에 따라 출력 파일로 내보내거나 출력 진행 상황을 보고합니다.
   *
   * 출력을 파일로 내보내려면 setOutputFile 메소드로 출력 파일의 path를 지정해주세요.
   * 출력 진행 상황을 콜백으로 받아보려면 setProgressMax, setProgressInterval,
   * setProgressCallback 메소드로 진행 상황 보고에 필요한 정보들을 넘겨 주세요.
   *
   * 실행한 명령이 종료되면 마무리되는 Promise를 반환합니다.
   */
  async run() {
    return new Promise((resolve, reject) => {
      this.runInternal(resolve, reject);
    });
  }

  private runInternal(resolve: (value: unknown) => void, reject: (e: Error) => void) {
    const child = spawn(this.command, this.args);

    // child.stdout.pipe(s1).pipe(s2);과
    // child.stdout.pipe(s1); child.stdout.pipe(s2)는 다릅니다.
    // pipe()의 반환으로 나온 스트림에 pipe()를 이어서 호출해주어야 하기 때문에
    // 반환 값을 out에 저장해둡니다.
    let out: Stream = child.stdout;

    if (this.progressListener) {
      out = out.pipe(this.getProgressViewer());
    }

    if (this.outputFile) {
      out = out.pipe(this.getFileOutput());
    }

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => {
      console.error(data);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(0);
      } else {
        reject(new Error(`Child process exited with code ${code}`));
      }
    });
  }

  private getProgressViewer(): ProgressStream {
    const viewer = progress({
      length: this.progressMax,
      time: this.progressInterval,
    });

    viewer.on("progress", (info) => {
      this.progressListener!!(info);
    });

    return viewer;
  }

  private getFileOutput(): WriteStream {
    return fs.createWriteStream(this.outputFile!!);
  }
}
```

끝!

## References
- [Execute a command line binary with Node.js](https://stackoverflow.com/questions/20643470/execute-a-command-line-binary-with-node-js)
- [pv - npm](https://www.npmjs.com/package/pv)
- [progress-stream - npm](https://www.npmjs.com/package/progress-stream)
