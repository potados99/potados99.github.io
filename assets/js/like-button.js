/* 좋아요 버튼 API 및 UI 관련 함수들 */

const API_BASE = "https://collect.potados.com/likes";
const cache = {}; /* URL별 { id, counts } 저장 */
const url = window.location.href;
const reaction = "💙";

/* API에서 모든 메시지 가져오기 */
async function fetchAllMessages() {
  const response = await fetch(`${API_BASE}?response=api`);
  const messages = await response.json();
  return messages.map((msg) => ({
    id: msg.id,
    body: JSON.parse(msg.body),
  }));
}

/* 현재 URL의 메시지 찾기 */
function findMessageByUrl(messages, targetUrl) {
  const matching = messages.filter((msg) => msg.body.url === targetUrl);
  return matching.length > 0 ? matching[matching.length - 1] : undefined;
}

/* 메시지로부터 캐시 업데이트 */
function updateCacheFromMessage(message) {
  if (message) {
    cache[url] = {
      id: message.id,
      counts: message.body.counts,
    };
  }
}

/* 이 글의 좋아요 개수 가져오기 */
async function getLikesCount() {
  if (cache[url]) {
    return cache[url].counts[reaction] ?? 0;
  }

  const messages = await fetchAllMessages();
  const message = findMessageByUrl(messages, url);
  updateCacheFromMessage(message);

  return message?.body?.counts?.[reaction] ?? 0;
}

/* 좋아요 개수 증가 */
async function increaseLikesCount() {
  const cached = cache[url];
  const currentCount = cached?.counts?.[reaction] ?? 0;
  const newCount = currentCount + 1;

  const payload = {
    url: url,
    counts: {
      ...cached?.counts,
      [reaction]: newCount,
    },
  };

  if (cached) {
    /* 기존 데이터 업데이트 */
    await fetch(`${API_BASE}/${cached.id}?response=api`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    /* 새로운 데이터 생성 */
    const response = await fetch(`${API_BASE}?response=api`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    payload.id = result.url.split("/").pop();
  }

  /* 캐시에 저장 */
  cache[url] = { id: cached?.id ?? payload.id, counts: payload.counts };
}

/* 버튼 UI 업데이트 */
async function updateLikeButton() {
  const button = document.getElementById("like-button");
  const count = await getLikesCount();
  button.querySelector(".like-count").textContent = count;
  button.classList.remove("loading");
}

/* 초기화 및 이벤트 리스너 */
document.addEventListener("DOMContentLoaded", updateLikeButton);
document.getElementById("like-button").addEventListener("click", async () => {
  const button = document.getElementById("like-button");
  button.classList.add("loading");
  await increaseLikesCount();
  await updateLikeButton();
});
