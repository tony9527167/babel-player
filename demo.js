const chinese = document.documentElement.lang === "zh-CN";
for (const player of document.querySelectorAll("[data-demo]")) {
  const button = player.querySelector("button");
  const mask = player.querySelector(".subtitle-mask");
  button.addEventListener("click", () => {
    const enabled = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(enabled));
    mask.hidden = !enabled;
    const label = player.closest(".demo-example").querySelector(".state-label");
    label.textContent = `${chinese ? (enabled ? "字幕已隐藏" : "字幕已显示") : enabled ? "Subtitles hidden" : "Subtitles revealed"}`;
  });
  player.closest(".demo-example").querySelector(".state-label").setAttribute("aria-live", "polite");
}
