<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>프라이팬 긁힘 진단 AI</title>
    <!-- 부트스트랩 디자인 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f4f6f9; padding-top: 50px; font-family: 'Malgun Gothic', sans-serif; }
        .card { border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none; }
        #preview-img { max-width: 100%; max-height: 320px; border-radius: 10px; display: none; margin: 20px auto; object-fit: contain; }
        .progress { height: 28px; border-radius: 14px; background-color: #e9ecef; }
        .progress-bar { font-size: 14px; font-weight: bold; line-height: 28px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card p-4 p-md-5 bg-white">
                    <h2 class="text-center mb-3 text-dark fw-bold">🍳 프라이팬 코팅 상태 진단 AI</h2>
                    <p class="text-muted text-center mb-4">프라이팬 사진을 업로드하면 AI가 코팅 벗김 및 긁힘 상태를 분석해 드립니다.</p>
                    
                    <!-- 모델 로딩 상태 알림 -->
                    <div id="loading-status" class="alert alert-warning text-center fw-medium" role="alert">
                        ⏳ AI 모델을 불러오는 중입니다... 잠시만 기다려주세요.
                    </div>

                    <!-- 파일 업로드 폼 (초기 비활성화) -->
                    <div class="mb-4" id="upload-section" style="display: none;">
                        <label for="imageUpload" class="form-label fw-bold text-secondary">프라이팬 사진 선택</label>
                        <input class="form-control form-control-lg" type="file" id="imageUpload" accept="image/*">
                    </div>

                    <!-- 이미지 미리보기 -->
                    <div class="text-center">
                        <img id="preview-img" alt="업로드된 프라이팬 사진">
                    </div>

                    <!-- 결과 출력 섹션 -->
                    <div id="result-section" class="mt-4" style="display: none;">
                        <h4 class="mb-3 text-secondary fw-bold border-bottom pb-2">🔍 진단 결과</h4>
                        <div id="label-container"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- TensorFlow.js 및 Teachable Machine 라이브러리 -->
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8/dist/teachablemachine-image.min.js"></script>

    <!-- AI 판정 로직 스크립트 -->
    <script>
        // ⚠️ [중요] 본인의 티처블 머신 모델 링크로 아래 주소를 반드시 교체해주세요!
        // 예시: const URL = "https://teachablemachine.withgoogle.com/models/abc123xyz/";
        const URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL_HERE/";

        let model, labelContainer, maxPredictions;

        // 페이지 로드 시 AI 모델 불러오기
        async function init() {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";

            try {
                model = await tmImage.load(modelURL, metadataURL);
                maxPredictions = model.getTotalClasses();

                // 로딩 메시지 숨기고 업로드창 활성화
                document.getElementById("loading-status").style.display = "none";
                document.getElementById("upload-section").style.display = "block";

                // 결과 표시용 프로그레스 바 동적 생성
                labelContainer = document.getElementById("label-container");
                labelContainer.innerHTML = "";
                for (let i = 0; i < maxPredictions; i++) {
                    labelContainer.innerHTML += `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span id="class-name-${i}" class="fw-bold text-dark">클래스 ${i}</span>
                                <span id="class-pct-${i}" class="text-muted fw-bold">0%</span>
                            </div>
                            <div class="progress">
                                <div id="bar-${i}" class="progress-bar bg-secondary" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error("모델 로딩 에러:", error);
                const statusEl = document.getElementById("loading-status");
                statusEl.className = "alert alert-danger text-center fw-medium";
                statusEl.innerHTML = "❌ 모델을 불러오지 못했습니다. 코드 상단의 <strong>URL</strong> 변수에 올바른 티처블 머신 링크를 입력했는지(끝에 슬래시 포함) 확인해주세요.";
            }
        }

        // 이미지 파일 업로드 이벤트 처리
        document.getElementById("imageUpload").addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.getElementById("preview-img");
                img.src = e.target.result;
                img.style.display = "block";
                
                // 이미지가 브라우저에 완전히 렌더링된 후 예측 실행
                img.onload = async function () {
                    if (model) {
                        await predict(img);
                    } else {
                        alert("모델이 아직 로드되지 않았습니다 잠시만 기다려주세요.");
                    }
                };
            };
            reader.readAsDataURL(file);
        });

        // AI 예측 수행 함수
        async function predict(imageElement) {
            try {
                const prediction = await model.predict(imageElement);
                document.getElementById("result-section").style.display = "block";

                let highestIndex = 0;
                let highestProb = 0;

                for (let i = 0; i < maxPredictions; i++) {
                    if (prediction[i].probability > highestProb) {
                        highestProb = prediction[i].probability;
                        highestIndex = i;
                    }
                }

                for (let i = 0; i < maxPredictions; i++) {
                    const className = prediction[i].className;
                    const probability = (prediction[i].probability * 100).toFixed(1);
                    
                    document.getElementById(`class-name-${i}`).innerText = className;
                    document.getElementById(`class-pct-${i}`).innerText = `${probability}%`;
                    
                    const bar = document.getElementById(`bar-${i}`);
                    bar.style.width = `${probability}%`;
                    bar.innerText = `${probability}%`;

                    // 가장 확률이 높은 항목은 초록색 강조, 나머지는 회색
                    if (i === highestIndex) {
                        bar.className = "progress-bar bg-success";
                    } else {
                        bar.className = "progress-bar bg-secondary opacity-50";
                    }
                }
            } catch (error) {
                console.error("예측 오류 발생:", error);
            }
        }

        // 초기화 실행
        init();
    </script>
</body>
</html>
