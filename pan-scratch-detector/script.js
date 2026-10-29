// ⚠️ 티처블 머신에서 모델 학습 후 [모델 내보내기] -> [TensorFlow.js] -> [Upload my model]을 눌러 나온 링크를 여기에 입력해주세요!
// 예시: const URL = "https://teachablemachine.withgoogle.com/models/abc123xyz/";
const URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL_HERE/";

let model, labelContainer, maxPredictions;

// 페이지가 로드되면 모델을 비동기(async)로 불러옵니다.
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 티처블 머신 모델 및 메타데이터 로드
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 모델 로딩 완료 시 UI 상태 변경
        document.getElementById("loading-status").style.display = "none";
        document.getElementById("upload-section").style.display = "block";

        // 결과 레이블 컨테이너 초기화 (클래스 개수만큼 동적 생성)
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = "";
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.innerHTML += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span id="class-name-${i}" class="fw-bold">클래스 ${i}</span>
                        <span id="class-pct-${i}" class="text-muted">0%</span>
                    </div>
                    <div class="progress">
                        <div id="bar-${i}" class="progress-bar bg-primary" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("모델 로딩 에러:", error);
        const statusEl = document.getElementById("loading-status");
        statusEl.className = "alert alert-danger text-center";
        statusEl.innerHTML = "모델을 불러오지 못했습니다. <code>script.js</code> 상단의 <strong>URL</strong> 변수에 올바른 티처블 머신 링크를 넣었는지, 링크 끝에 슬래시(<code>/</code>)가 포함되었는지 확인해주세요.";
    }
}
