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

## 클라이언트 라이브러리를 만들어 보자

이제 에디터로 작성하여 정적 호스팅중인 파일을 가져다가 복호화하고 파싱해서 예쁜 객체로 만들어 주는 라이브러리를 작성해야 합니다.

### API부터 설계

라이브러리를 작성하기 전에 먼저 어떻게 사용될 것인지를 생각해 보았습니다. 기존 데스크탑 앱에서 큰 수정 없이 이 라이브러리를 가져다 쓸 수 있어야 합니다.

이 라이브러리를 적용하는 데에 시간과 에너지가 또 쓰이면 안 되기 떄문에 정말 간단하게 설계합니다. 코드가 여러 군데에 분산되지 않도록 하고 비동기 코드도 안 씁니다. 또한 훗날 새로운 기능이 추가되어도 호환성을 유지할 수 있도록 최대한 현재 프로퍼티 정의에 변화가 적게 설계합니다.

```csharp
using CloudConfig;

namespace Console
{
    internal static class Program
    {
        public static void Main(string[] args)
        {
            var ulsan = RmsConfig
                .Initialize()
                .GetConfig(ConfigClient.POP_UL_FOLDING) // 현재 POP 프로그램 정보
                .DataSources
                .FilterOneBySchema("rms_ulsan");
                
            System.Console.Out.WriteLine($"Host: {ulsan.Host}");
            System.Console.Out.WriteLine($"Port: {ulsan.Port}");
            System.Console.Out.WriteLine($"Username: {ulsan.Username}");
            System.Console.Out.WriteLine($"Password: {ulsan.Password}");
            System.Console.Out.WriteLine($"Schema: {ulsan.Schema}");
        }
    }
}
```

어디서든 DLL만 참조 추가하여 하나의 expression으로 설정에 접근할 수 있도록 틀을 잡았습니다.

### 웹에서 암호화, C#으로 복호화

위에서 웹 에디터를 만들면서 `CryptoJS`를 통해 평문을 암호화하는 코드를 작성하였습니다. 이제 이렇게 암호화된 텍스트를 다시 복호화해야 합니다. 이번에는 C#에서 말이죠!

```csharp

using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using CloudConfig.Exceptions;

namespace CloudConfig.Utils
{
    /// <summary>
    ///     암호화된 스트링을 복호화하는 일을 담당하는 클래스입니다.
    /// </summary>
    /// <remarks>
    ///     AES-256-CBC로 암호화된 설정 파일의 내용을 복호화할 때에 사용합니다.
    /// </remarks>
    internal class Decrypter
    {
        private readonly string _encrypted;
        private readonly string _iv;
        private readonly string _password;

        public Decrypter(string encrypted, string password, string iv)
        {
            _encrypted = encrypted;
            _password = password;
            _iv = iv;
        }

        /// <summary>
        ///     주어진 스트링을 복호화합니다.
        /// </summary>
        /// <remarks>
        ///     AES-256-CBC로 암호화된 설정 파일의 내용을 복호화할 때에 사용하면 좋습니다.
        /// </remarks>
        /// <returns>복호화된 평문 스트링</returns>
        public string Decrypt()
        {
            try
            {
                return DecryptDataWithAes(_encrypted, _password, _iv);
            }
            catch (Exception e)
            {
                throw new CloudConfigException("주어진 텍스트를 복호화하는 중에 문제가 생겼습니다.", e);
            }
        }

        private string DecryptDataWithAes(string encrypted, string password, string iv)
        {
            using (var aesAlgorithm = Aes.Create())
            {
                aesAlgorithm.KeySize = 256;
                aesAlgorithm.BlockSize = 128;
                aesAlgorithm.Key = Encoding.UTF8.GetBytes(password.PadLeft(32, ' '));
                aesAlgorithm.IV = Encoding.UTF8.GetBytes(iv.PadLeft(16, ' '));
                aesAlgorithm.Mode = CipherMode.CBC;
                aesAlgorithm.Padding = PaddingMode.PKCS7;

                var decryptor = aesAlgorithm.CreateDecryptor();
                var cipher = Convert.FromBase64String(encrypted);

                using (var ms = new MemoryStream(cipher))
                {
                    using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                    {
                        using (var sr = new StreamReader(cs))
                        {
                            return sr.ReadToEnd();
                        }
                    }
                }
            }
        }
    }
}

```

위 코드는 완성된 복호화 유틸리티 클래스, `Decrypter`의 전문입니다. 암호화할 때와 복호화할 때에 key, iv, mode, padding이 모두 같아야 합니다. key와 iv는 길이가 짧을 경우 좌측을 빈 스트링으로 채워 주었습니다.

### 복호화 키는 [Credential Manager](https://support.microsoft.com/en-us/windows/accessing-credential-manager-1b5c916a-6a16-889f-8581-fc16e8165ac0)에서

원격 설정을 가져오는 이 라이브러리는 별도의 DLL로 배포됩니다. 이 DLL에 복호화 키가 스트링 리터럴로 들어 있으면 몹시 문제일 것입니다(!). 따라서 소스 코드를 포함한 바이너리 일체에는 키가 없습니다. 그러면 어디에서 가져오나? Windows가 제공하는 [Credential Manager](https://support.microsoft.com/en-us/windows/accessing-credential-manager-1b5c916a-6a16-889f-8581-fc16e8165ac0)에서 받아옵니다.

Credential Manager에는 비밀번호를 포함한 인증 정보를 넣어 두기에 적합한 장소입니다. ~~일단 어디 레지스트리에 박아두는 것보다는 훨씬 낫습니다.~~사용자가 웹에 저장한 암호도 여기에 저장됩니다. 

이 Credential Manager를 C#에서 쓰기 편하게 잘 포장해준 [NuGet 패키지](https://www.nuget.org/packages/Meziantou.Framework.Win32.CredentialManager/)가 있습니다. 이걸 사용해보겠습니다.

```csharp

using System;
using CloudConfig.Exceptions;
using CloudConfig.Model.Configuration;
using CloudConfig.Utils;
using Meziantou.Framework.Win32;

namespace CloudConfig.Model.Storage
{
    /// <summary>
    ///     원격 설정 저장소를 나타냅니다.
    ///     사용 가능한지 여부는 직접 가져와 보아야 알 수 있습니다.
    /// </summary>
    internal class RemoteConfigStorage : IConfigStorage
    {
        private readonly Cache<ConfigHolder> _cache = new Cache<ConfigHolder>(3600);
		
        private readonly string _iv;
        private readonly string _name;
        private readonly string _password;
        private readonly string _url;
		
        public RemoteConfigStorage(string name, string url, string password, string iv)
        {
            _name = name;
            _url = url;
				
            if (password == null)
            {
	            // 인자로 넘어온 정보가 없으면 CredentialManager를 참조합니다.
                var credential = CredentialManager.ReadCredential("CloudConfig") ??
                                 throw new CloudConfigException("Windows 자격 증명에 CloudConfig가 없습니다.");
                                 
                _password = credential.Password;
            }
            else
            {
                _password = password;
            }
            
            _iv = iv;
        }
    }
    
	// 생략...
}

```

인증 정보를 가져오는 것은 이렇게 마무리됩니다. 

> 인증 정보를 집어 넣으려면 대상 머신에서 [cmdkey](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmdkey) 명령을 사용합니다.

### 여러 개의 원격 저장소

원격 저장소는 기본적으로 항상 클라이언트의 요청에 응답해야 합니다. 그러나 클라이언트가 알고 있는 원격 저장소의 주소가 바뀌거나 서버의 상태에 문제가 생기는 일이 발생할 수도 있습니다. 따라서 여러 개의 원격 저장소 중 살아있는 것들을 찾아 그 중 가장 우선순위가 높은 곳에 연결해야 합니다.

```csharp
using System.Linq;
using CloudConfig.Exceptions;

namespace CloudConfig.Model.Storage
{
    /// <summary>
    ///     여러 개의 <see cref="IConfigStorage" />를 나타냅니다.
    /// </summary>
    internal class ConfigStorages
    {
        private readonly IConfigStorage[] _storages;

        public ConfigStorages(params IConfigStorage[] storages)
        {
            _storages = storages;
        }

        public bool AreAllAvailable()
        {
            return _storages.All(r => r.IsAvailable());
        }

        public IConfigStorage GetFirstAvailableOne()
        {
            return _storages.FirstOrDefault(r => r.IsAvailable()) ??
                   throw new CloudConfigException($"설정 저장소 {_storages.Length}곳 모두 사용 불가능합니다.");
        }
    }
}
```

여러 개의 원격 저장소(`IConfigStorage`)가 주어지면, 그들 중 사용 가능한 가장 첫 번째 것이 선택됩니다. 저장소가 사용 가능한지는 실제로 요청을 보내 응답을 받아보아야 알 수 있습니다. 따라서 라이브러리는 우선 순위에 따라 지정된 순서대로 가장 먼저 성공하는 원격지가 발견될 때까지 설정을 받아와 복호화까지 가능한 상태인지 확인합니다.

### 배포 파이프라인도 간단하게

이 라이브러리는 외부의 개발팀에게 전달되어야 합니다. 따라서 소스 코드의 수정을 마친 순간부터는 빌드를 하고 메일을 쓰고 파일을 첨부하는 기나긴 과정이 따라옵니다. 그런데 이것도 개발로 크게 단축시킬 수 있는 문제입니다.

코드가 GitHub에 푸시되는 순간부터 바로 빌드와 테스트가 일어나 그 결과물이 새로운 릴리즈로 생성되도록 Workflow를 작성하였습니다.

```yaml

name: Build and Release

# v*.*.* 형태의 태그가 푸시되면 실행되어
# 프로젝트 빌드 및 릴리즈를 생성하는 워크플로우입니다.

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Setup MSBuild
        uses: microsoft/setup-msbuild@v1

      - name: Setup NuGet
        uses: NuGet/setup-nuget@v1.1.1

      - name: Restore Packages
        run: nuget restore CloudConfig.sln

      - name: Build CloudConfig Project
        run: msbuild.exe CloudConfig.sln /t:CloudConfig:Rebuild /p:Platform="Any CPU" /p:Configuration="Release" /p:OutputPath="_build"

      - name: Merge DLLs Into One
        run: packages\ILMerge.Tools.2.14.1208\tools\ILMerge.exe /wildcards /out:CloudConfig.dll CloudConfig\_build\*.dll

      - name: Build Changelog
        id: Changelog
        run: .github/workflows/build-changelog.sh
        shell: bash

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body_path: CHANGELOG.txt
          files: CloudConfig.dll

```

MSBuild를 사용하여 솔루션을 빌드하고, 깔끔한 전달을 위해 ILMerge로 하나의 DLL로 합칩니다. 그리고는 커밋 메시지로부터 change log를 만들어 릴리즈를 달아줍니다.

```bash
#!/bin/bash -l

# 현재 이전 태그 이후로 현재 태그까지의 커밋을 모아
# 이번 릴리즈의 changelog를 만드는 스크립트입니다.
# changelog는 스크립트를 실행한 디렉토리의 
# CHANGELOG.txt 파일에 기록됩니다.

prev_tag=$(git tag --sort version:refname | tail -n 2 | head -n 1)
current_tag=$(git tag --sort version:refname | tail -n 1)

if [ "$prev_tag" ]; then
  changelog=$(git log --oneline --no-decorate $prev_tag..HEAD)
else
  changelog=$(git log --oneline --no-decorate)
fi

output="CHANGELOG.txt"

echo -e "## 📂 [DLL 다운로드](https://github.com/dhsol-company/cloud-config/releases/download/${current_tag}/CloudConfig.dll)" >> ${output}
echo -e "클릭하시면 다운로드로 이어집니다." >> ${output}
echo -e "## 📝 변경 내역" >> ${output}
echo -e "${changelog}" >> ${output}
```

## 마치며

어떤 문제를 마주할 때 마다 *이런 게 있으면 좋겠다* 싶은 생각으로 시작하였던 것들이 어느새 쌓이고 쌓여 인터널 프로덕트라고 부를 만한 것이 되어가고 있습니다. 하하
