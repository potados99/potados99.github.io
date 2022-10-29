---
title: "가내수공업 Cloud Config 만들기"
summary: "이제 설정 바꿀때마다 재배포는 그만,,,멈춰,,ㅠ"
date: 2022-10-29 21:39:16 +0900
categories:
   - dev
---

## 들어가며

회사에서 개발 중인 윈도우 데스크탑 앱이 있습니다. 이 앱은 현장에 배포되어 사용중입니다. 이 앱은 백엔드의 데이터베이스와 직접 소통합니다. 그래서 데이터베이스 접속 정보를 알고 있습니다. 이 접속 정보는 소스 코드에 새겨져 있기 때문에 한 번 빌드되면 바꿀 수 없습니다.

문제는 이 접속 정보가 변경될 때입니다. 만약 데이터베이스 서버의 주소가 바뀌면 약 300km 떨어진 곳까지 출장을 가서 다시 배포해야 합니다.😔 이런 상황을 막기 위해 원격 설정을 사용하는 방법을 생각해 보았습니다.

## 원격 설정, 그런데 이제 암호화를 곁들인

업데이트 없이도 앱의 동작을 바꾸는 개념은 친숙합니다. 파이어베이스의 [AppConfig](https://firebase.google.com/docs/remote-config)가 있고, 백엔드에 더 가까운 스프링의 [Cloud Config](https://spring.io/projects/spring-cloud-config)가 있습니다.

굳이 외부 서비스를 사용하거나 Config 서버를 구축하지 않아도 됩니다. 간단한 인증을 포함하는 API 서버를 직접 작성해서 올릴 수도 있습니다. 그러나 지금 제가 일하는 곳은 고질적인 인력난을 겪고 있기 때문에, 별도의 서버를 구축하고 관리하는 것은 조금 어렵다고 판단했습니다.

그래서 설정 파일을 암호화해서 정적으로 호스팅한 다음에, 클라이언트쪽에서 이를 복호화하여 사용하는 방식을 구상하였습니다. 이렇게 하면 서버 구축이 필요 없습니다. 설정 파일을 아무 데에나 던져놓기만 하면 됩니다. 가령 GitHub 저장소라든가, Gist나 아니면 개인 서버에도 올려둘 수 있습니다. 클라이언트는 미리 정해진 설정 파일 URL로부터 내용을 받아오기만 하면 됩니다.

## 만들어야 할 것

세 가지를 만들어야 합니다.
- 설정 파일이 호스팅된 URL
- 클라이언트쪽 라이브러리
- 설정을 편집하는 에디터

### 설정 파일 호스팅

먼저 설정 파일 URL입니다. 설정 파일을 작성한 다음에 **안전하고 오래 가는 URL**에서 호스팅해야 합니다. 신뢰할 수 있는 파일 저장소로는 가장 먼저 GitHub이 떠올랐습니다. 그래서 [public 저장소](https://github.com/dhsol-company/static/blob/main/cloud-config.txt)를 만들어서 파일을 올려 두었습니다.

### 클라이언트 라이브러리

다음으로 클라이언트쪽 라이브러리입니다. 이 쪽은 요구 사항이 조금 많습니다. 일단 기존에 개발중이던 앱에 큰 수정 없이 붙여서 바로 사용할 수 있어야 합니다. 그리고 미리 정해진 설정 파일 URL에 접근하지 못 하는 경우, 다른 URL로 다시 시도하는 failover 동작이 필요합니다. 만약 웹 상의 설정 파일에 접근할 수 없는 경우라면, 로컬에 저장된 fallback 설정을 사용해야 합니다.

### 설정 에디터

설정 파일은 작성할 때에는 JSON이지만 최종 산출물은 암호화된 텍스트 파일입니다. 따라서 원본 JSON 텍스트를 암호화된 텍스트로, 또 반대로 암호화된 텍스트를 평문 JSON 텍스트로 상호 변환해주는 툴이 필요합니다. 이 툴을 사용해야 할 즈음이면 이걸 만들어놓은지 한참이 지난 뒤일 것이므로, 사용하기 쉽고 접근성이 좋아야 합니다. 즉, 무언가 추가적인 설치를 요구하거나 특정 기기에서만 돌아가는 프로그램이면 안 되는 것입니다.

## 설정 에디터를 만들어보자

사실 정리하다 보니 당장 끝날 일은 설정 파일 띄워 두는 것 밖에 없는 것 같고, 그 다음으로는 에디터를 미리 만들어 두는 편이 좋을 것 같아 이걸 만들기로 했습니다. 에디터가 먼저 완성되어야 JSON과 암호문 사이에서의 와리가리가 가능해질 것입니다.

### 암호화는 AES-256

암호화 알고리즘은 가장 익숙하고 믿음직한 `AES-256-CBC`로 하기로 했습니다.

### 웹이 짱

아무 설치도 필요 없어야 하고, 어떠한 기기에서도 돌아가야 하며, 충분히 빨라야 합니다. 이 조건에 부합하는 플랫폼은 웹 밖에 없습니다. 그래서 `html` 파일에 다 집어넣은 다음에 정적으로 호스팅하기로 결정하였습니다.

### React가 짱

화면을 구상하다 보니 대충 `textarea`가 위부터 아래로 3개 있는 모습이 그려졌습니다. 가장 위에 비밀번호를 입력하고, 그 다음에 평문 텍스트를 입력하면 맨 아래에 암호화된 텍스트가 출력되는 모양인 것입니다. 또 맨 아래에 암호화된 텍스트를 붙여넣으면 그 위에 평문 텍스트가 나타나야 합니다.

여기까지 생각하니 날것 자체의 자바스크립트는 쓰기 싫다는 생각이 강하게 들었습니다. 그래서 익숙한 React를 사용하기로 했습니다. 이번에는 CDN에서 받아서 웹 브라우저에서 바로 실행하는 형태가 될 것입니다. 여태껏 React를 사용할 때에는 NodeJS 기반으로만 작업했던 터라 새로운 도전에 호기심이 생긴 것도 한 몫 했습니다.

### 암호화는 crypto-js

소중한 설정 파일을 안전하게 암호화해줄 자바스크립트 기반 암호화 라이브러리는 [crypto-js](https://www.npmjs.com/package/crypto-js)가 되었습니다. 사용자 수와 문서가 몹시 압도적이라 편안하게 선택하였습니다.

### React 모셔오기

이제 본격적으로 만들어 볼 것입니다. 먼저 React를 준비해야 합니다.

브라우저에서 React를 모셔오는 데에는 스크립트 태그 두 개면 됩니다.

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```

그렇지만 JSX도 함께 사용하고 싶다면 저 둘만으로는 안 됩니다. Babel도 같이 가져와야 합니다.

```html
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
```

React와 Babel이 준비되었다면 다음과 같이 스크립트 태그를 열어 바로 작성을 시작할 수 있습니다.

```html
<script type="text/babel">
    <!-- 하고싶은거 다 해 -->
</script>
```

작동하는 가장 최소한의 코드는 아래와 같습니다.

```js
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CloudConfig 에디터</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
<div id="app"></div>

<script type="text/babel">
    function App() {
        return <div>hi</div>
    }

    const container = document.getElementById("app");
    const root = ReactDOM.createRoot(container);
    root.render(<App/>);
</script>
</body>
</html>
```

이제 여기에다가 살을 붙여나갑니다.

### 뼈대 잡기

가장 먼저 `TextField`와 `TextArea` 컴포넌트를 만들어줍니다. 전자는 비밀번호 필드를, 후자는 평문과 암호문 텍스트 영역을 만드는 데에 사용할 것입니다.

```js
function TextField({value, onChange}) {
    return <div>
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
}

function TextArea({value, onChange}) {
    return <div>
        <label>
            <textarea style={{height: '40vh', width: '60vw'}} value={value}
                      onChange={(event) => onChange(event.target.value)}/>
        </label>
    </div>
}
```

이제 `App`은 이렇게 나옵니다:

```js
function App() {
    const [password, setPassword] = useState('');
    const [plain, setPlain] = useState('');
    const [encrypted, setEncrypted] = useState('');

    const passwordIsChanged = useCallback((newValue) => {
        setPassword(newValue);
        setEncrypted('');
        setPlain('');
    });

    const plainIsChanged = useCallback((newValue) => {
        setPlain(newValue);
        setEncrypted(encrypt(newValue, password));
    });

    const encryptedIsChanged = useCallback((newValue) => {
        setEncrypted(newValue);
        setPlain(decrypt(newValue, password));
    });

    return <>
        Password
        <TextField value={password} onChange={passwordIsChanged} />

        Plain
        <TextArea value={plain} onChange={plainIsChanged}/>

        Encrypted
        <TextArea value={encrypted} onChange={encryptedIsChanged}/>
    </>;
}
```

값이 바뀔 때마다 관련된 다른 값들도 바꿔 주고 있습니다. 그런데 가장 중요한 `decrypt`와 `encrypt`는 아직 만들지 않았습니다.

### AES-256-CBC보다 문서가 더 암호같아

부끄럽지만 저는 이걸 만들기 전까지 AES 암호화에 대해 잘 몰랐습니다. 사실 지금도 잘 모르긴 합니다.

그렇지만 두통과 안구 건조를 동반하는 오랜 웹 검색 끝에, [암호화와 복호화에는 똑같은 설정(key, iv, mode, padding)을 사용해야 한다](https://stackoverflow.com/a/28331376/11929317)는 것을 알아내었습니다. 어찌 보면 너무 당연한 것인데, 평소에는 key만 생각하다 보니 나머지는 자동(?)으로 될 것이라고 생각했었나봅니다.

사실 crypto-js로 암호화하고 crypto-js로 복호화하면 딱히 iv, mode, padding은 신경쓰지 않아도 됩니다. 그러나 여기서는 crypto-js로 암호화한 다음에 C#의 `System.Security.Cryptography`로 복호화할 것이기 때문에, 암호화에 필요한 파라미터들을 모두 똑같이 직접 지정해 주어야 합니다.

mode와 padding은 각각 `CBC`와 `PKCS7`로 맞춘다고 치고, key와 iv는 암호화/복호화 시점에 각각 넘겨주도록 구상하였습니다. 그래서 이를 반영한 `decrypt`와 `encrypt` 함수는 아래와 같습니다:

```js
function encrypt(text, password) {
    return CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(password.padStart(32, " ")), {
        iv: CryptoJS.enc.Utf8.parse(iv.padStart(16, " ")),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();
}

function decrypt(text, password) {
    return CryptoJS.AES.decrypt(text, CryptoJS.enc.Utf8.parse(password.padStart(32, " ")), {
        iv: CryptoJS.enc.Utf8.parse(iv.padStart(16, " ")),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
}
```

### 에디터 완성

이제 에디터 쪽은 끝입니다. 전체 코드는 아래와 같습니다:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CloudConfig 에디터</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
</head>
<body>
<div id="app"></div>

<script type="text/babel">
    const iv = 'baked-potato';

    const {useState, useCallback} = React;

    function encrypt(text, password) {
        return CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(password.padStart(32, " ")), {
            iv: CryptoJS.enc.Utf8.parse(iv.padStart(16, " ")),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }).toString();
    }

    function decrypt(text, password) {
        return CryptoJS.AES.decrypt(text, CryptoJS.enc.Utf8.parse(password.padStart(32, " ")), {
            iv: CryptoJS.enc.Utf8.parse(iv.padStart(16, " ")),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }).toString(CryptoJS.enc.Utf8);
    }

    function TextField({value, onChange}) {
        return <div>
            <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
        </div>
    }

    function TextArea({value, onChange}) {
        return <div>
            <label>
                <textarea style={{height: '40vh', width: '60vw'}} value={value}
                          onChange={(event) => onChange(event.target.value)}/>
            </label>
        </div>
    }

    function App() {
        const [password, setPassword] = useState('');
        const [plain, setPlain] = useState('');
        const [encrypted, setEncrypted] = useState('');

        const passwordIsChanged = useCallback((newValue) => {
            setPassword(newValue);
            setEncrypted('');
            setPlain('');
        });

        const plainIsChanged = useCallback((newValue) => {
            setPlain(newValue);
            setEncrypted(encrypt(newValue, password));
        });

        const encryptedIsChanged = useCallback((newValue) => {
            setEncrypted(newValue);
            setPlain(decrypt(newValue, password));
        });

        return <>
            Password
            <TextField value={password} onChange={passwordIsChanged} />

            Plain
            <TextArea value={plain} onChange={plainIsChanged}/>

            Encrypted
            <TextArea value={encrypted} onChange={encryptedIsChanged}/>
        </>;
    }

    const container = document.getElementById("app");
    const root = ReactDOM.createRoot(container);
    root.render(<App/>);
</script>
</body>
</html>
```

### 배포

이제 이 html 파일을 가장 접근하기 쉬운 형태로 배포해야 합니다. html은 브라우저가 바로 읽고 실행(?)할 수 있는 파일이라는 특징을 살려 웹에다가 띄우기로 했습니다. 아까 만든 [public 저장소](https://github.com/dhsol-company/static)에 [GitHub Pages](https://dhsol-company.github.io/static/editor.html)로 띄웠습니다.

## 클라이언트 쪽 라이브러리를 만들어 보자

이제 에디터로 작성하여 정적 호스팅중인 파일을 가져다가 복호화하고 파싱해서 예쁜 객체로 만들어 주는 라이브러리를 작성해야 합니다.

### 
