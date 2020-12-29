---
title: "[MlKit] 휴대폰이 글자에 눈을 뜨다니"
date: 2020-12-27 11:46:58 +0900
categories:
   - dev
---

## 들어가며

대기표에 인쇄된 글자를 카메라로 읽어야 할 일이 생겼다. 일단 생각나는게 `tesseract`였다. 영상 전처리까지 포함해 `ndk`, `cmake`, `opencv` 환경 설정하고 이것저것 삽질해서 돌아가게 만들었더니만 인식률이 거의 뭐 **한 글자도 못 읽는 수준**이었다(640*480, 초점도 잘맞고 조명도 좋았고 인쇄물인데다가 흔들리지도 않았는데...).

더 찾다 보니, 구글이 온-디바이스 텍스트 인식 API를 [MlKit](https://developers.google.com/ml-kit/samples)에 묶어서 풀고 있더라. [예제 앱](https://github.com/googlesamples/mlkit/tree/master/android/vision-quickstart)을 써 보았는데, **기가막히게 잘 돌아간다**. 그래서 프로젝트에 바로 투입했다.

## 준비하기

> 일부(아니 대부분) 내용은 [구글 개발자 가이드](https://developers.google.com/ml-kit/vision/text-recognition/android?hl=ko)에서 가져왔습니다 :)

의존성부터 맞춰주자.

~~~
dependencies {
  // ...

  implementation 'com.google.android.gms:play-services-mlkit-text-recognition:16.1.2'
}
~~~

그리고 `AndroidManifest.xml`에는 ML 모델을 앱 설치 시점에 가져오도록 메타데이터를 추가해주자.

~~~xml
<application ...>
  ...
  <meta-data
      android:name="com.google.mlkit.vision.DEPENDENCIES"
      android:value="ocr" />
  <!-- To use multiple models: android:value="ocr,model2,model3" -->
</application>
~~~

## CameraX

잠깐! 텍스트 인식을 하려면 먼저 이미지가 있어야 한다. 이미지를 가져오려면 카메라가 필요하다.

카메라라서 *하드웨어 다루기 힘들지 않을까 호달달* 했는데 다행히 구글의 고오오급 개발자들께서 [CameraX](https://developer.android.com/training/camerax?hl=ko)라는걸 만들어 주셨다.

![camerax-beta-notion.png](/assets/images/camerax-beta-notion.png)

> 베타라고 한다. 나는 알파여도 갖다 쓸거다!!

CameraX는 API가 참 신기하게 생겼는데, `ProcessCameraProvider`를 가져온 다음에 거기다가 use case를 붙이는 식이다.

Use case라는게 거창한게 아니고 그냥 빌더로 뚝딱 만들 수 있게 생겼다. 지금 지원하는 use case는 세 개가 있다: `preview`, `analysis`, `capture`. 여기서는 화면에 뿌리기 위해 `preview`를, 그리고 MlKit에 넘겨주기 위해 `analysis`를 사용할 것이다.

## 간단한 구현

API는 아래처럼 쓰면 된다. 진짜 간단하다.

~~~kotlin
val cameraProviderFuture = ProcessCameraProvider.getInstance(mContext)
val textRecognizer: TextRecognizer = TextRecognition.getClient()

cameraProviderFuture.addListener({
    val provider = cameraProviderFuture.get()

    val previewUseCase = Preview.Builder().build().apply {
        setSurfaceProvider(previewView.createSurfaceProvider())
    }

    val analysisUseCase = ImageAnalysis.Builder().build().apply {
        setAnalyzer(ContextCompat.getMainExecutor(this@MainActivity),
            { image: ImageProxy ->
                textRecognizer.process(
                    InputImage.fromMediaImage(
                      image.image!!,
                      image.imageInfo.rotationDegrees
                    )
                ).addOnSuccessListener {
                    // 인식이 끝났을 때에 할 일
                }.addOnCompleteListener {
                    image.close()
                }
            }
        )
    }

    provider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, previewUseCase, analysisUseCase)

}, ContextCompat.getMainExecutor(this))
~~~

## 제대로 된 구현

위는 최소한의 돌아만 가는 예시이고, 프로젝트에 사용하려면 구글의 ~~고오오오오오오급~~ 개발자들이 만든 [요 예시](https://github.com/googlesamples/mlkit/blob/master/android/vision-quickstart/app/src/main/java/com/google/mlkit/vision/demo/kotlin/CameraXLivePreviewActivity.kt)를 참고하면 아주 좋다.

## 마치며

이런걸 무료로 풀다니..대단해 구글...

## References

- https://github.com/googlesamples/mlkit/tree/master/android/vision-quickstart
- https://developers.google.com/ml-kit/samples
- https://developer.android.com/training/camerax?hl=ko
