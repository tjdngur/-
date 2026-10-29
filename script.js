// ⚠️ 주의: 티처블 머신에서 학습 후 [모델 내보내기] -> [TensorFlow.js] 탭에서 생성된 URL로 아래 값을 교체해주세요!
// 현재는 기본 샘플 모델 주소가 들어가 있어, 커스텀 학습을 하려면 본인의 링크를 넣어야 정확한 판정이 가능합니다.
const URL = "https://teachablemachine.withgoogle.com/models/Model_URL_Here/";

let model, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 티처블 머신 모델 로드
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // UI 상태 변경 (로딩 완료)
        document.getElementById("loading-status").style.display = "none";
        document.getElementById("upload-section").style.display = "block";

        // 결과 레이블 컨테이너 초기화
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = "";
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.innerHTML += `
                <div class="mb-2">
                    <span id="class-name-${i}" class="fw-bold">클래스 ${i}</span>
                    <div class="progress">
                        <div id="bar-${i}" class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById("loading-status").className = "alert alert-danger text-center";
        document.getElementById("loading-status").innerHTML = "모델을 불러오지 못했습니다. script.js 파일의 <strong>URL</strong> 변수에 올바른 티처블 머신 링크를 입력했는지 확인해주세요.";
    }
}

// 파일 업로드 이벤트 리스너
document.getElementById("imageUpload").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.getElementById("preview-img");
            img.src = e.target.result;
            img.style.display = "block";
            
            // 이미지가 로드된 후 예측 수행
            img.onload = function () {
                predict(img);
            }
        }
        reader.readAsDataURL(file);
    }
});

// 이미지 예측 함수
async function predict(imageElement) {
    // 모델에 이미지 전달하여 예측 수행
    const prediction = await model.predict(imageElement);
    
    document.getElementById("result-section").style.display = "block";

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(1);
        
        // 클래스 이름 업데이트
        document.getElementById(`class-name-${i}`).innerText = `${className}: ${probability}%`;
        
        // 프로그레스 바 애니메이션 업데이트
        const bar = document.getElementById(`bar-${i}`);
        bar.style.width = `${probability}%`;
        bar.innerText = `${probability}%`;

        // 상태에 따른 색상 변화 (예: 정상이면 초록색, 심각하면 빨간색 등)
        if (probability > 50) {
            bar.className = "progress-bar bg-success";
        } else {
            bar.className = "progress-bar bg-secondary";
        }
    }
}

// 앱 실행
init();
