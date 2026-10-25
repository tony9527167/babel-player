const preferredLanguages = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
const language = preferredLanguages.find((tag) => /^en(?:-|$)/i.test(tag) || /^zh(?:-|$)/i.test(tag));
const simplifiedChinese = /^zh(?:-|$)/i.test(language || "") && !/-(?:Hant|TW|HK|MO)(?:-|$)/i.test(language);
location.replace(simplifiedChinese ? "zh-CN.html" : "en.html");
