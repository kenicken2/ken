// ===== 조절용 값 =====
const SPEED = 1;      // 전체 템포 배율 (1보다 크면 느려지고, 작으면 빨라짐)
const DRAW = 1400;    // 선을 그리는 시간 (ms)
const HOLD = 700;     // 다 그린 상태로 멈춰 있는 시간 (ms)
const ERASE = 1400;   // 선을 푸는 시간 (ms)
const OVERLAP = 500;  // 선이 풀리는 중 다음 선이 미리 출발하는 시간 (ms)
                      // 0이면 다 사라진 순간 바로 시작, ERASE보다 작게 줄 것
// =====================

const T_DRAW = DRAW * SPEED;
const T_HOLD = HOLD * SPEED;
const T_ERASE = ERASE * SPEED;
const RUN = T_DRAW + T_HOLD + T_ERASE;                     // 선 하나가 나타나서 사라질 때까지
const PERIOD = RUN - Math.min(OVERLAP * SPEED, T_ERASE);   // 다음 선이 출발하는 간격

// 머티리얼 디자인 표준 곡선 cubic-bezier(0.4, 0, 0.2, 1)
function cubicBezier(x1, y1, x2, y2) {
  const bx = t => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = t => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  const dx = t => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
  return x => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx(t) - x) / d;
      t = Math.min(1, Math.max(0, t));
    }
    return by(t);
  };
}
const ease = cubicBezier(0.4, 0, 0.2, 1);
const clamp01 = v => Math.min(1, Math.max(0, v));

// 선이 겹치는 순간에는 두 개가 동시에 필요하므로 path를 하나 복제해서 번갈아 사용
const outlineA = document.getElementById("outline");
const outlineB = outlineA.cloneNode(true);
outlineB.removeAttribute("id");
outlineA.after(outlineB);
const lines = [outlineA, outlineB];
const len = outlineA.getTotalLength();

// 선 하나가 출발한 지 u(ms) 지났을 때의 모습을 그림
function render(el, u) {
  if (u < 0 || u > RUN) {
    el.style.visibility = "hidden";
    return;
  }
  const head = ease(clamp01(u / T_DRAW)) * len;
  const tail = ease(clamp01((u - T_DRAW - T_HOLD) / T_ERASE)) * len;
  const visible = head - tail;

  if (visible < 1) {
    // 길이가 0에 가까우면 둥근 끝(round cap)만 점처럼 남으므로 숨김
    el.style.visibility = "hidden";
  } else {
    el.style.visibility = "visible";
    el.style.strokeDasharray = `${visible} ${len * 2}`;
    el.style.strokeDashoffset = -tail;
  }
}

function frame(now) {
  const k = Math.floor(now / PERIOD); // 지금 몇 번째 선인지
  // 현재 선(k)과 아직 풀리고 있을 수 있는 직전 선(k-1)을 각각 그림
  render(lines[k % 2], now - k * PERIOD);
  render(lines[(k + 1) % 2], now - (k - 1) * PERIOD);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
