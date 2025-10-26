/* Utterances 댓글 모듈 로딩 관련 동작들 */

const 테마_이름_변환_맵 = {
  dark: "dark-blue",
  light: "github-light",
};

function 댓글_모듈_로드(테마_이름) {
  const wrapper = document.getElementById("comments-wrapper");
  wrapper.innerHTML = "";

  const script = document.createElement("script");
  script.src = "https://utteranc.es/client.js";
  script.setAttribute("repo", "potados99/potados99.github.io");
  script.setAttribute("issue-term", "title");
  script.setAttribute("label", "comment");
  script.setAttribute("theme", 테마_이름);
  script.setAttribute("crossorigin", "anonymous");
  script.async = true;

  wrapper.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  댓글_모듈_로드(테마_이름_변환_맵[현재_테마()]);

  토글_클릭하면(() => {
    const 다음_테마 = 현재_테마() === "dark" ? "light" : "dark";
    댓글_모듈_로드(테마_이름_변환_맵[다음_테마]);
  });

  시스템_테마가_바뀌면((새_시스템_테마) => {
    if (사용자가_테마_선택한_적이_없을_때에만()) {
      댓글_모듈_로드(테마_이름_변환_맵[새_시스템_테마]);
    }
  });
});
