---
title: "12V LED 디밍 스위치 만들기"
summary: "빵판부터 PCB까지."
date: 2021-04-23 00:22:31 +0900
categories:
   - dev
   - electronics
---

![led-dimmer-demo.mp4](/assets/images/led-dimmer-demo.mp4)

> 완성된 모습

## 들어가며

> 소프트웨어의 존재 가치는 어디에 잇는가? 순수하게 기술적인 분야가 아니라면 아마 특정 업무 분야의 문제를 해결하는 데 있을 것이다.    
*이대엽, 『도메인 주도 설계』 옮긴이 글 첫 문장*

소프트웨어는 우리를 대신해서 어떤 일을 처리해줄 때에 가장 빛납니다. 하드웨어도 마찬가지이죠. 우리를 위한 소프트웨어와 그 밖의 물리적인 일들을 처리해줄 때에 존재 가치가 드러납니다. 이 둘은 우리의 게으름을 응원해 준다는 것 외에도 공통점이 있는데, 만드는 과정이 매우 험난하면서도 나름 재미있다는(?) 것입니다.

제 책상에는 예전에 달아놓은 12v LED 스트립이 있습니다. 전원을 연결하면 밝게 빛나지만 그걸 위해 매번 팔을 뻗어 두 커넥터를 잡아 차력싸움을 하고 싶지는 않았습니다. 그래서 빵판에 NodeMCU와 적당한 MOSFET의 조합으로 간단한 스위칭 모듈을 만들어 쓰고 있었습니다. 잘 작동하긴 했으나 마음 한 구석에는 *공장제 퀄리티의 스위칭 모듈*을 언젠가 만들어보고 싶다는 소망이 있었습니다. 그리고 대략 4년만에 그 소망을 이루었습니다. 아래는 그 기록입니다.

## 무엇을 만들어야 하나요

기존 시스템이 어떻게 생겼는지 보겠습니다.

![led-dimmer-before.png](/assets/images/led-dimmer-before.png)

빵판 위에 올라간 마이크로컨트롤러가 **외부로부터 5v 전원을 공급받아** 12v 출력을 조절하는 구성입니다. 이 상태에서는 책상 위에 12v 어댑터 뿐만 아니라 5v 어댑터도 있어야 하고, 빵판과 지저분한 점퍼 케이블까지 있어야 합니다.

그림에서 동그라미 친 부분을 보겠습니다. 동그라미 부분을 하나의 모듈이라고 가정한다면 외부와 연결되는 부분은 12v 입력, 12v 출력, 그리고 5v 입력으로 총 세 곳입니다. 그런데 5v 입력이 꼭 필요할까요? 아래 그림을 보겠습니다.

![led-dimmer-abstract.png](/assets/images/led-dimmer-abstract.png)

위에서 5v 입력 부분을 제거하고 내용물을 추상화한 그림입니다. 기존 12v 선로 중간에 부착하는 흔한 스위치의 모양을 띱니다. 상자 안에서는 마이크로컨트롤러가 5v를 필요로 합니다. 이는 입력으로 들어오는 12v를 병렬로 끌어와 전압을 낮추어 공급함으로써 해결할 수 있습니다. 실현 가능성은 충분하니 만들어 보겠습니다.

## 회로 설계 준비하기

> 부품들을 가지고 빵판에 꽂아보는게 제일 먼저이지만, 당장 사용할 수 있는 부품이 없고 회로가 그리 복잡할 것 같지는 않아서 바로 회로를 그리기로 했습니다.

회로에 필요한 부분을 정리해 보겠습니다. 가장 먼저 마이크로컨트롤러가 필요합니다. 여기서는 가장 값싸고 강력한 ESP-01을 사용했습니다. 이 보드는 3.3v 전원을 사용합니다. 따라서 12v를 3.3v로 강압시켜 주는 회로가 필요합니다. 또한 마이크로컨트롤러의 GPIO 출력으로 12v 출력을 조절하는 스위칭 회로가 필요합니다. 정리하면 아래와 같습니다:

- ESP-01
- 12v to 3.3v dc 강압 회로
- 논리 레벨 12v 스위칭 회로

우리가 필요한 이 부분들을 만들 수 있을까요? 하나씩 따져보겠습니다.

### DC 강압 회로

#### 선형 레귤레이터

구글에 `dc 12v to 3.3v`라고 물어봅니다. `LM1117`이나 `AM1117` 같은 [LDO(Low-dropout regulator)](https://www.rohm.co.kr/electronics-basics/dc-dc-converters/dcdc_what8)를 쓰라고 합니다. 정말 괜찮은지 알아보기 위해 [LM1117의 데이터시트](https://www.ti.com/lit/ds/symlink/lm1117.pdf?HQS=dis-mous-null-mousermode-dsf-pf-null-wwe&DCM=yes&ref_url=https%3A%2F%2Fkr.mouser.com%2F&distId=26)를 봅니다.

![lm1117-datasheet.png](/assets/images/lm1117-datasheet.png)

빨간 밑줄 친 부분만 일단 보겠습니다. 입력 최대 15v, 출력전류 최대 800mA를 감당한다고 합니다.

조금 더 자세히 보니, 최대는 20v이지만 아무튼 권장은 15v까지인 것 같습니다.

![lm1117-datasheet-max-ratings.png](/assets/images/lm1117-datasheet-max-ratings.png)

> Maximum Input Voltage가 20v라고 합니다.

우리는 입력 전압으로 12v를 쓸 것이고 출력 전류도 많아야 300mA정도일 것이기 때문에 전기적 특성으로 안 될 것이 없습니다. 일단 채택하기로 합니ㄷ

.  

.  

.  

**그런데**

사실 선형 레귤레이터를 사용해서 2년 전에 같은 시도를 했습니다. 작동은 했는데 회로에 붙은 레귤레이터 부분이 **미.치.도.록.** 뜨거웠습니다.

![led-dimmer-2019.JPG](/assets/images/led-dimmer-2019.JPG)

> 그때 만든 보드~~실패작~~입니다.

선형 레귤레이터의 중요한 특성을 놓쳤기 때문입니다. `LM1117`같은 선형 레귤레이터는 강하되는 전압 만큼의 에너지를 **공중에 열로 발산합니다**. 다시 말해서 `(12v - 3.3v) * 0.2A` 즉 **1.74W**를 열로 전환시키고 있었던 것입니다.

[스택 오버플로에서 찾은 답변](https://electronics.stackexchange.com/a/384478)에서 도움을 얻어 데이터시트를 보니, 제가 사용한(SOT223) LM1117은 1W당 61.6°C의 온도 상승을 동반한다고 합니다. 열로 낭비되는 에너지가 1.74W이니 발열은 대략 **107.2°C**인 것입니다.

![lm1117-datasheet-thermal-ratings.png](/assets/images/lm1117-datasheet-thermal-ratings.png)

100도가 넘는 온도를 정상 작동 온도라고 보기는 어렵죠. 선형 레귤레이터는 포기합니다.

#### 스위칭 레귤레이터

한참을 검색하다가, [스위칭 레귤레이터](https://www.rohm.co.kr/electronics-basics/dc-dc-converters/dcdc_what5)라는 것을 발견했습니다.

![stepdown-module-from-google.jpeg](/assets/images/stepdown-module-from-google.jpeg)

아주 익숙하게 생겼습니다. 코일이 달려 있고, 커다란 커패시터가 두 개 달려있습니다. 보통 휴대전화 보조배터리 충방전모듈에서 많이 보입니다. 사용 예시로 보나 부품 크기로 보나(?) 우리의 상황에서 선형 레귤레이터보다는 훨씬 나아 보입니다.

> 스위칭 레귤레이터는 입력 전압과 0v 사이에서 줄타기하며 아주 빠르게 스위칭하는 방식으로 중간 어딘가의 출력 전압을 만들어 냅니다. 스위칭으로 인한 순간적 전압 및 전류의 급격한 변화는 각각 커패시터와 인덕터로 막습니다.

선형 레귤레이터는 전원 입력과 출력 양단에 자그마한 커패시터를 하나만 달아주면 되었습니다. 반면 스위칭 레귤레이터는 기본 회로가 조금 복잡하게 생겼습니다.

![lm2596-typical-application.png](/assets/images/lm2596-typical-application.png)
> [LM2596 데이터시트](https://www.ti.com/lit/ds/symlink/lm2596.pdf?ts=1619058211278&ref_url=https%253A%252F%252Fwww.google.com%252F)

아... 핀이 5개나 있습니다. 우리에겐 아주 사치스럽게도 `ON/OFF` 핀도 달려 있습니다. 회로를 보면 여느 강압회로와 같이 입출력 부분에 커패시터가 하나씩 달려 있습니다. 그리고 출력이 쇼트키 다이오드를 통해 그라운드와 연결되고는 인덕터를 거쳐 나가면서 피드백 핀으로도 들어갑니다. 왜 이렇게 생겨야만 하는지는 [이 글](https://techweb.rohm.co.kr/knowledge/dcdc/dcdc_sr/dcdc_sr01/696)이 친절하게 알려주었습니다.

아무튼 예제가 있으니 해볼 만 합니다. 적절한 스위칭 레귤레이터로 위 예제에 등장한 것과 비슷한 [LM2576S-3.3](https://lcsc.com/product-detail/DC-DC-Converters_UMW-Youtai-Semiconductor-Co-Ltd-LM2576S-3-3_C347412.html)를 사용하기로 합니다.

### 12v 스위칭 회로

구글에 `arduino 12v led control` 비슷한 키워드로 검색을 해 보면 아주 다양한 예제 회로를 볼 수 있습니다. 이들 중 어떤 것들은 트랜지스터를(BJT), 또 어떤 것들은 MOSFET을 사용합니다.

[이 글](https://www.elprocus.com/difference-between-bjt-and-mosfet/)에 따르면, MOSFET은 고전력을 다룰 때에 많이 사용된다고 합니다. 또한 MOSFET은 BJT와 다르게 전류가 아닌 전압에 의해 구동되며, 입력 전류가 매우 작다고 합니다. LED 스트립은 꽤나 고전력이고, GPIO 허용 전류가 낮은 점과 개인적 선호(그냥 MOSFET이 좋아 보였습니다) 등을 고려해 MOSFET을 사용하기로 합니다.

우리가 선택한 ESP-1의 GPIO 입출력 전압은 논리 레벨, 즉 0-3.3v입니다. 이 자그마한 전압과 고작 수십 mA의 전류로 어마어마한(?) LED 조명의 전원을 제어하려면 이에 맞는 적절한 부품을 선택해야 합니다. 구글에 다시 `logic level mosfet` 정도로 검색해 후보를 추려 봅니다. `IRL520`, `IRL540`, `FQP30N06L` 등이 언급됩니다.

아래는 [IRL540NPbF의 데이터시트](https://www.infineon.com/dgdl/irl540npbf.pdf?fileId=5546d462533600a40153565fc2a62567)입니다.

![irl540-vgs.png](/assets/images/irl540-vgs.png)

> 이름이 예뻐서 골랐어요.

게이트 전압이 3v만 넘어가도 우리가 필요로 하는 '켜짐' 상태에 도달한다고 합니다. 우리에게 필요한 부품이 맞는 것 같습니다.


## 회로 + PCB 아트웍 그리기

이제 회로를 그리는 일만 남았습니다. [EasyEDA](https://easyeda.com)라는 툴을 사용했습니다. [Altium](https://www.altium.com)같은 것은 좀 부담스럽고, 마침 EasyEDA는 PCB와 부품 주문까지 한 번에 되는 점이 편해서 선택했습니다.

![dimming-switch-sheet1.png](/assets/images/dimming-switch-sheet1.png)

요대로 그려 주었습니다.

![dimming-switch-pcb.png](/assets/images/dimming-switch-pcb.png)

그리고 바로 아트웍으로 넘어가 적당한 배치를 잡아주고 라우팅까지 마쳤습니다.

![dimming-switch-preview.png](/assets/images/dimming-switch-preview.png)

미리보기를 통해 본 모습입니다.

## 주문하기

EasyEDA로 최종 거버 파일 생성까지 끝나면 [JLCPCB](https://jlcpcb.com/)에서 PCB를, [LCSC](https://lcsc.com/)에서 부품들을 주문할 수 있습니다.

바로 주문 넣고 기다립니다. JLCPCB에서 주문하면 보드가 2$, 배송비가 9$ 정도로 배보다 배꼽이 더 크긴 하지만 국내에서 이 가격은 상상도 할 수 없으므로 어쩔 수 없이 주문합니다. LCSC에서는 JLCPCB에서 주문한 PCB와 묶음배송은 할 수 없지만 15$짜리 배송비 쿠폰을 주니 조금 저렴하게 주문할 수 있습니다.

## 실장과 납땜

약 2주 정도 기다리면 물건을 받아볼 수 있습니다. 부품들을 다 꺼내어 나열해 봅니다.

![led-dimmer-before-assembly.jpeg](/assets/images/led-dimmer-before-assembly.jpeg)

사진에는 빠졌지만 아주 작은 다이오드가 하나 더 있습니다.

![led-dimmer-before-start.jpeg](/assets/images/led-dimmer-before-start.jpeg)

납땜 장비를 모두 꺼내어 본격적으로 작업을 시작합니다. 표면 실장은 처음이라 조금 어려웠습니다. 손이 생각보다 많이 떨린다는 것을 깨달았을 정도로 부품들이 아주 작고 잘 미끄러졌습니다. 다행히 핀셋과 테이프, 그리고 새로 산 인두의 도움을 받아 무사히 마쳤습니다.

![led-dimmer-assembled.jpeg](/assets/images/led-dimmer-assembled.jpeg)

완성된 모습입니다. ESP-01 모듈도 장착한 상태입니다.

## 소프트웨어 설정

이제 ESP-01이 일을 하도록 펌웨어를 만들어서 올려 주어야 합니다. 예전에는 Arduino IDE를 켜고 Wi-Fi 연결부터 시작해서 프로토콜 구성까지 직접 시도했었지만 이내 그것은 욕심이라는 것을 깨닫고 [Home Assistant](https://www.home-assistant.io)와 [ESPHome](https://esphome.io)의 조합을 사용하고 있습니다.

> 가내 ESP8266/ESP32 기기들을 제대로 관리해보고 싶으시다면 Home Assistant와 ESPHome 만한 것이 또 없습니다.

아래는 위 디밍 스위치를 제어하기 위한 ESPHome 노드 설정 파일의 일부입니다.

~~~yaml
...

light:
  - platform: monochromatic
    name: "Dimming Light"
    id: dimming_light
    output: gpio_output
    restore_mode: ALWAYS_ON
    default_transition_length: 0.5s

output:
  - platform: esp8266_pwm
    pin: 2
    id: gpio_output

...
~~~

`esphome dimming-light.yaml run`으로 플래싱을 진행하고 테스트해 봅니다.

![led-dimmer-demo.mp4](/assets/images/led-dimmer-demo.mp4)

잘 작동합니다.

## 마치며

알고봤더니 이것과 정확히 똑같은 기능을 하는 물건이 알리익스프레스에서 7$ 선에서 [판매중](https://www.aliexpress.com/item/1005001670745785.html?spm=a2g0o.productlist.0.0.64e97168kFy1vw&algo_pvid=e9b71f1d-73bf-424a-873d-0c4b18f0dc3b&algo_expid=e9b71f1d-73bf-424a-873d-0c4b18f0dc3b-0&btsid=0b0a556616191172241503727e066b&ws_ab_test=searchweb0_0,searchweb201602_,searchweb201603_)이었습니다. 하하.. 그래도 직접 만들었다는 것에 의미를 둡니다...

## 참고한 글

- [LDO란?](https://www.rohm.co.kr/electronics-basics/dc-dc-converters/dcdc_what8)
- [Overheating of LM1117 SOT223, 5v-3.3v](https://electronics.stackexchange.com/a/384478)
- [스위칭 레귤레이터](https://www.rohm.co.kr/electronics-basics/dc-dc-converters/dcdc_what5)
- [스위칭 레귤레이터의 기본 : 강압 동작 원리](https://techweb.rohm.co.kr/knowledge/dcdc/dcdc_sr/dcdc_sr01/696)
- [What are the Differences between BJT and MOSFET?](https://www.elprocus.com/difference-between-bjt-and-mosfet/)
