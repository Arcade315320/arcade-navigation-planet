const storageKey = "arcade-planet-public-demo-v1";
function localDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function sampleRecords() {
  const date = localDate();
  const songs = [
    ["星际漫游", "北纬乐队", 4, "assets/home-backgrounds/space.jpg"],
    ["山海之间", "云岸", 3, "assets/home-backgrounds/alpine.jpg"],
    ["晚风来信", "暮色电台", 2, "assets/diary-backgrounds/sunset.jpg"],
    ["晨光航线", "云岸", 1, "assets/home-backgrounds/meadow.jpg"]
  ];
  let minute = 8 * 60 + 12;
  const music = songs.flatMap(([title, artist, plays, coverUrl], index) => Array.from({ length: plays }, (_, number) => {
    const playedAt = `${date}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00`;
    minute += 48 + index * 9 + number;
    return { songId: `demo-${index}`, title, artist, album: "示例专辑", playedAt, coverUrl };
  }));
  return { [date]: { mood: "专注", energy: 8, schedules: [
    { id: "demo-1", time: "09:00", title: "制定今日计划", type: "学习" },
    { id: "demo-2", time: "14:30", title: "专注完成一个小目标", type: "专注", durationMinutes: 50 },
    { id: "demo-3", time: "19:00", title: "散步，看一看晚霞", type: "生活" }
  ], music, meals: { breakfast: "燕麦与水果", lunch: "清爽的午餐", dinner: "和朋友一起吃饭", notes: "今天记得多喝水" },
  diary: { body: "今天沿着自己的节奏前进。午后的专注让我离目标更近了一点，傍晚的天空也值得停下来看看。", mood: "期待", tags: ["日常", "成长"], photos: [], background: "", backgroundMode: "auto", backgroundPreset: "", backgroundOpacity: 78, updatedAt: new Date().toISOString() } } };
}
let records;
try { records = JSON.parse(localStorage.getItem(storageKey) || "null") || sampleRecords(); } catch (_) { records = sampleRecords(); }
const $ = (selector) => document.querySelector(selector);
const state = { date: localDate() };
let diaryBackgrounds = [];
let homeBackgrounds = [];
let homeBackgroundIndex = 0;
let homeLayerIsA = true;
let homeRotationTimer = null;
let homeRotationPaused = false;
const fields = {
  date: $("#selectedDate"), dayTitle: $("#dayTitle"), mood: $("#moodSelect"), energy: $("#energyRange"), energyValue: $("#energyValue"),
  completionText: $("#completionText"), completionBar: $("#completionBar"), scheduleList: $("#scheduleList"), musicList: $("#musicList"), reviewList: $("#reviewList"),
  daysCount: $("#daysCount"), scheduleCount: $("#scheduleCount"), musicCount: $("#musicCount"), todayPlayCount: $("#todayPlayCount"),
  uniqueSongCount: $("#uniqueSongCount"), repeatPlayCount: $("#repeatPlayCount"), todayArtistCount: $("#todayArtistCount"), topArtist: $("#topArtist"),
  musicMoodSummary: $("#musicMoodSummary"), topSong: $("#topSong"), peakListenTime: $("#peakListenTime"), musicTasteNarrative: $("#musicTasteNarrative"),
  musicTasteTags: $("#musicTasteTags"), topSongSpotlight: $("#topSongSpotlight"), musicSyncResult: $("#musicSyncResult"), breakfast: $("#breakfast"), lunch: $("#lunch"), dinner: $("#dinner"), mealNotes: $("#mealNotes"),
  diaryBody: $("#diaryBody"), diaryWordCount: $("#diaryWordCount"), diarySaveStatus: $("#diarySaveStatus"), diaryExtras: $("#diaryExtras"), diaryMood: $("#diaryMood"), diaryTags: $("#diaryTags"),
  diaryCanvas: $("#diaryCanvas"), diaryPhotoGallery: $("#diaryPhotoGallery"), diaryMediaStatus: $("#diaryMediaStatus"), diaryBackgroundOpacity: $("#diaryBackgroundOpacity"), diaryBackgroundOpacityValue: $("#diaryBackgroundOpacityValue"), tomatoDesktopStatus: $("#tomatoDesktopStatus"), yibenSyncStatus: $("#yibenSyncStatus"),
  homeView: $("#homeView"), appView: $("#appView"), homeBackgroundA: $("#homeBackgroundA"), homeBackgroundB: $("#homeBackgroundB"), homeBackgroundName: $("#homeBackgroundName"), homeTodayDate: $("#homeTodayDate"), homeScheduleCount: $("#homeScheduleCount"), homeMusicCount: $("#homeMusicCount"), homeDiaryCount: $("#homeDiaryCount"),
  voyageReportDate: $("#voyageReportDate"), voyageReportStatus: $("#voyageReportStatus"), voyageReportBody: $("#voyageReportBody")
};

function blankDay() { return { mood: "", energy: 6, schedules: [], music: [], meals: { breakfast: "", lunch: "", dinner: "", notes: "" }, diary: { body: "", mood: "", tags: [], photos: [], background: "", backgroundMode: "auto", backgroundPreset: "", backgroundOpacity: 78, updatedAt: "" } }; }
function getDay(date = state.date) { if (!records[date]) records[date] = blankDay(); return records[date]; }
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = String(value || ""); return node.innerHTML; }
function formatDate(value) { return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date(`${value}T12:00:00`)); }
function playHour(item) { return Number((item.playedAt || "").slice(11, 13)); }
function timeBand(hour) { if (hour < 6) return "深夜"; if (hour < 11) return "清晨"; if (hour < 14) return "中午"; if (hour < 18) return "午后"; if (hour < 23) return "夜晚"; return "深夜"; }
function songKey(item) { return String(item.songId || `${item.title}|${item.artist}`).toLowerCase(); }
function safeImageUrl(value) { const text = String(value || ""); if (/^assets\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i.test(text)) return text; try { const url = new URL(text); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch (_) { return ""; } }
function safeDiaryPhotoUrl(value) { const text = String(value || ""); if (text.startsWith("data:image/") || /^\/data\/yiben-photos\/[A-Z0-9._-]+$/i.test(text)) return text; return safeImageUrl(text); }
function diaryLength(value) { return String(value || "").replace(/\s/g, "").length; }
function diarySavedLabel(value) { if (!value) return "尚未保存"; return `上次保存 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))}`; }
function ensureDiary(day = getDay()) { const existing = day.diary || {}; day.diary = { body: "", mood: "", tags: [], photos: [], background: "", backgroundMode: "auto", backgroundPreset: "", backgroundOpacity: 78, updatedAt: "", ...existing }; if (!existing.backgroundMode && existing.background) day.diary.backgroundMode = "custom"; day.diary.backgroundOpacity = Math.min(90, Math.max(60, Number(day.diary.backgroundOpacity) || 78)); return day.diary; }
function stableBackgroundIndex(value) { return [...String(value)].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7) % Math.max(1, diaryBackgrounds.length); }
function selectedDiaryBackground(diary) {
  if (diary.backgroundMode === "none") return null;
  if (diary.backgroundMode === "custom" && String(diary.background || "").startsWith("data:image/")) return { id: "custom", name: "自定义背景", url: diary.background };
  return diaryBackgrounds.find(item => item.id === diary.backgroundPreset) || diaryBackgrounds[stableBackgroundIndex(`${state.date}-${diary.mood || "default"}`)] || null;
}
function parseDiaryTags(value) { return [...new Set(String(value || "").split(/[,，#]/).map(tag => tag.trim()).filter(Boolean))].slice(0, 8); }
function readAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("无法读取照片")); reader.readAsDataURL(file); }); }
function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("照片格式不受支持")); image.src = src; }); }
async function compressDiaryImage(file) {
  const imageExtension = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file?.name || "");
  if (!file || (!file.type?.startsWith("image/") && !imageExtension)) throw new Error("请选择图片文件");
  if (file.size > 20 * 1024 * 1024) throw new Error("单张照片不能超过 20MB");
  const source = await readAsDataUrl(file); const image = await loadImage(source); const maxSide = 1200; const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.76);
}
async function setDiaryBackground(file) {
  if (!file) throw new Error("没有选择背景照片");
  fields.diarySaveStatus.textContent = "正在处理背景…";
  const diary = ensureDiary(); diary.background = await compressDiaryImage(file); diary.backgroundMode = "custom"; diary.updatedAt = new Date().toISOString(); await persist(); render();
}

async function persist() {
  getDay().voyageReport = generateVoyageReport(state.date, getDay());
  try { localStorage.setItem(storageKey, JSON.stringify(records)); }
  catch (_) { fields.diarySaveStatus.textContent = "浏览器存储空间不足，请减少照片数量"; }
}
async function loadRecords() {
  try {
    const response = await fetch("assets/diary-backgrounds/backgrounds.json");
    if (response.ok) diaryBackgrounds = (await response.json()).map(item => ({ ...item, url: `assets/diary-backgrounds/${item.file}` }));
  } catch (_) {}
  render();
}
function setHomeBackground(index) {
  if (!homeBackgrounds.length) return;
  homeBackgroundIndex = (index + homeBackgrounds.length) % homeBackgrounds.length;
  const background = homeBackgrounds[homeBackgroundIndex]; const current = homeLayerIsA ? fields.homeBackgroundA : fields.homeBackgroundB; const incoming = homeLayerIsA ? fields.homeBackgroundB : fields.homeBackgroundA;
  incoming.style.backgroundImage = `url("${background.url}")`; incoming.classList.add("active"); current.classList.remove("active"); homeLayerIsA = !homeLayerIsA; fields.homeBackgroundName.textContent = `${background.name} · ${homeBackgroundIndex + 1}/${homeBackgrounds.length}`;
}
function startHomeRotation() { if (homeRotationTimer) clearInterval(homeRotationTimer); if (!homeRotationPaused) homeRotationTimer = setInterval(() => setHomeBackground(homeBackgroundIndex + 1), 10000); }
async function loadHomeBackgrounds() {
  try { const response = await fetch("assets/home-backgrounds/backgrounds.json"); const data = await response.json(); homeBackgrounds = data.map(item => ({ ...item, url: item.file })); const dayKey = localDate(); homeBackgroundIndex = [...dayKey].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7) % Math.max(1, homeBackgrounds.length); setHomeBackground(homeBackgroundIndex); startHomeRotation(); }
  catch (_) { fields.homeBackgroundName.textContent = "首页背景库暂不可用"; }
}
function showHome() { fields.homeView.hidden = false; fields.appView.hidden = true; }
function showApp() { fields.homeView.hidden = true; fields.appView.hidden = false; }

function generateVoyageReport(date, day) {
  const schedules = [...(day.schedules || [])].sort((a,b) => String(a.time).localeCompare(String(b.time)));
  const music = day.music || []; const meals = day.meals || {}; const diary = day.diary || {};
  const songCounts = new Map(); const artistCounts = new Map();
  music.forEach(item => { const key = songKey(item); const existing = songCounts.get(key) || { item, plays: 0 }; existing.plays += 1; songCounts.set(key, existing); artistCounts.set(item.artist, (artistCounts.get(item.artist) || 0) + 1); });
  const topSong = [...songCounts.values()].sort((a,b) => b.plays-a.plays)[0];
  const topArtist = [...artistCounts.entries()].sort((a,b) => b[1]-a[1])[0];
  const mealNames = [["早餐",meals.breakfast],["午餐",meals.lunch],["晚餐",meals.dinner]].filter(([,value]) => String(value || "").trim()).map(([name]) => name);
  const words = diaryLength(diary.body); const focusMinutes = schedules.reduce((sum,item) => sum + (Number(item.durationMinutes) || 0),0);
  const completion = Math.round([day.mood,schedules.length,music.length,meals.breakfast,meals.lunch,meals.dinner,diary.body].filter(Boolean).length / 7 * 100);
  return { date, generatedAt: new Date().toISOString(), brand: "Arcade的航海星球", signature: { latin: "Per aspera ad astra", chinese: "循此苦旅 以达繁星" },
    title: focusMinutes >= 120 ? "向深水区持续前行" : music.length >= 8 ? "由旋律陪伴的一段航程" : words >= 80 ? "把今日写进星图" : "沿着今日坐标稳步航行",
    summary: `${schedules.length ? `完成 ${schedules.length} 项日程` : "今天没有记录日程"}；${music.length ? `听了 ${music.length} 次歌曲` : "没有听歌记录"}；${words ? `写下 ${words} 字日记` : "暂未写下日记"}；${mealNames.length ? `记录了${mealNames.join("、")}` : "三餐尚未记录"}。`,
    completion, mood: diary.mood || day.mood || "未记录", energy: Number(day.energy) || 6,
    metrics: { schedules: schedules.length, focusMinutes, musicPlays: music.length, uniqueSongs: songCounts.size, meals: mealNames.length, diaryWords: words, diaryPhotos: (diary.photos || []).length },
    topSong: topSong ? { title: topSong.item.title, artist: topSong.item.artist, plays: topSong.plays } : null,
    topArtist: topArtist ? { name: topArtist[0], plays: topArtist[1] } : null,
    scheduleHighlights: schedules.slice(0,5), diaryPreview: String(diary.body || "").slice(0,180), tags: diary.tags || [] };
}

function renderVoyageReport(day) {
  const report = day.voyageReport;
  fields.voyageReportDate.textContent = formatDate(state.date);
  if (!report) {
    fields.voyageReportStatus.textContent = state.date === new Date().toISOString().slice(0, 10) ? "今天的报告将在 24:00 自动生成" : "这一天还没有航海报告，可点击重新生成";
    fields.voyageReportBody.innerHTML = `<div class="empty">等待当天航程结算</div>`;
    return;
  }
  fields.voyageReportStatus.textContent = `生成于 ${new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(report.generatedAt))} · 报告已保存`;
  const schedules = (report.scheduleHighlights || []).map(item => `<div class="voyage-schedule-line"><b>${escapeHtml(item.time || "--:--")}</b>${escapeHtml(item.title)}${item.durationMinutes ? ` · ${item.durationMinutes} 分钟` : ""}</div>`).join("") || `<p>没有日程记录</p>`;
  const musicText = report.topSong ? `循环最多：《${escapeHtml(report.topSong.title)}》 · ${escapeHtml(report.topSong.artist)}，播放 ${report.topSong.plays} 次${report.topArtist ? `；常听歌手 ${escapeHtml(report.topArtist.name)} 共 ${report.topArtist.plays} 次` : ""}` : "没有听歌记录";
  const diaryText = report.diaryPreview ? `${escapeHtml(report.diaryPreview)}${report.metrics.diaryWords > report.diaryPreview.length ? "…" : ""}` : "没有日记记录";
  const brand = report.brand || "Arcade的航海星球"; const signature = report.signature || { latin: "Per aspera ad astra", chinese: "循此苦旅 以达繁星" };
  fields.voyageReportBody.innerHTML = `<div class="voyage-report-brand"><span>${escapeHtml(brand)}</span><em>${escapeHtml(signature.latin)}</em><strong>${escapeHtml(signature.chinese)}</strong></div><h4 class="voyage-report-title">${escapeHtml(report.title)}</h4><p class="voyage-report-summary">${escapeHtml(report.summary)}</p><div class="voyage-report-metrics"><div><span>今日完整度</span><strong>${report.completion}%</strong></div><div><span>日程 / 专注</span><strong>${report.metrics.schedules} / ${report.metrics.focusMinutes}m</strong></div><div><span>播放 / 歌曲</span><strong>${report.metrics.musicPlays} / ${report.metrics.uniqueSongs}</strong></div><div><span>日记 / 照片</span><strong>${report.metrics.diaryWords} / ${report.metrics.diaryPhotos}</strong></div></div><div class="voyage-report-details"><section><h5>今日航线</h5>${schedules}</section><section><h5>情绪与能量</h5><p>${escapeHtml(report.mood)} · 能量 ${report.energy}/10 · 三餐记录 ${report.metrics.meals}/3</p></section><section><h5>今日旋律</h5><p>${musicText}</p></section><section><h5>船长手记</h5><p>${diaryText}</p>${report.tags?.length ? `<div class="tags review-tags">${report.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}</section></div>`;
}

function renderMusic(day) {
  const plays = day.music || [];
  const songs = new Map();
  const artists = new Map();
  const periods = new Map();
  plays.forEach((item) => {
    const key = songKey(item);
    const current = songs.get(key) || { ...item, playCount: 0, times: [], eventTimes: [] };
    if (!current.coverUrl && item.coverUrl) current.coverUrl = item.coverUrl;
    current.playCount += 1; current.times.push(item.playedAt); current.eventTimes.push(Number(item.playedAtMs) || new Date(item.playedAt).getTime() || 0); songs.set(key, current);
    artists.set(item.artist || "未知歌手", (artists.get(item.artist || "未知歌手") || 0) + 1);
    const band = timeBand(playHour(item)); periods.set(band, (periods.get(band) || 0) + 1);
  });
  const sortedSongs = [...songs.values()].sort((a, b) => b.playCount - a.playCount || Math.max(...b.eventTimes) - Math.max(...a.eventTimes) || String(a.title).localeCompare(String(b.title), "zh-CN"));
  const sortedArtists = [...artists.entries()].sort((a, b) => b[1] - a[1]);
  const sortedPeriods = [...periods.entries()].sort((a, b) => b[1] - a[1]);
  const repeats = Math.max(0, plays.length - songs.size);
  fields.todayPlayCount.textContent = plays.length;
  fields.uniqueSongCount.textContent = songs.size;
  fields.repeatPlayCount.textContent = repeats;
  fields.todayArtistCount.textContent = artists.size;
  fields.topArtist.textContent = sortedArtists[0] ? `${sortedArtists[0][0]} · ${sortedArtists[0][1]}次` : "暂无";
  fields.topSong.textContent = sortedSongs[0] ? `${sortedSongs[0].title} × ${sortedSongs[0].playCount}` : "暂无";
  fields.peakListenTime.textContent = sortedPeriods[0]?.[0] || "暂无";
  const mood = !plays.length ? "等待记录" : repeats >= Math.max(2, plays.length / 3) ? "沉浸循环" : sortedPeriods[0]?.[0] === "深夜" ? "深夜内省" : artists.size >= 6 ? "好奇漫游" : "稳定陪伴";
  fields.musicMoodSummary.textContent = mood;
  fields.musicTasteNarrative.textContent = plays.length ? `今天共播放 ${plays.length} 次，涉及 ${songs.size} 首歌和 ${artists.size} 位歌手。整体听歌心情偏向“${mood}”，最活跃的时段是${sortedPeriods[0]?.[0] || "未知"}。` : "网易云上传当天播放后，这里会自动生成听歌品味摘要。";
  const tags = plays.length ? [mood, sortedPeriods[0]?.[0], repeats ? `重复播放 ${repeats}` : "不重复漫游"] : [];
  fields.musicTasteTags.innerHTML = tags.filter(Boolean).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const champion = sortedSongs[0];
  if (champion) {
    const coverUrl = safeImageUrl(champion.coverUrl);
    const share = plays.length ? (champion.playCount / plays.length * 100).toFixed(1) : "0.0";
    fields.topSongSpotlight.hidden = false;
    fields.topSongSpotlight.innerHTML = `${coverUrl ? `<img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(champion.title)} 专辑封面" loading="lazy" referrerpolicy="no-referrer">` : `<div class="cover-placeholder" aria-hidden="true">♪</div>`}<div class="spotlight-copy"><span>今日播放冠军</span><strong>${escapeHtml(champion.title)}</strong><p>${escapeHtml(champion.artist)}${champion.album ? ` · ${escapeHtml(champion.album)}` : ""}</p></div><div class="spotlight-count"><strong>${champion.playCount}</strong><span>次播放 · ${share}%</span></div>`;
  } else {
    fields.topSongSpotlight.hidden = true;
    fields.topSongSpotlight.innerHTML = "";
  }
  fields.musicList.innerHTML = sortedSongs.length ? sortedSongs.map((item, index) => {
    const ordered = item.times.filter(Boolean).sort();
    const first = ordered[0]?.slice(11) || "--:--:--"; const last = ordered.at(-1)?.slice(11) || "--:--:--";
    const share = plays.length ? (item.playCount / plays.length * 100).toFixed(1) : "0.0";
    const timeline = ordered.map(value => value.slice(11)).join(" · ");
    return `<article class="music-item"><div class="song-rank">${index + 1}</div><div class="main"><strong>${escapeHtml(item.title)}</strong><div class="meta">${escapeHtml(item.artist)}${item.album ? ` · ${escapeHtml(item.album)}` : ""}</div><div class="meta">首次 ${first} · 最后 ${last} · 占当日 ${share}%</div><div class="play-timeline">每次播放：${escapeHtml(timeline)}</div></div><div class="play-count"><strong>${item.playCount}</strong><span>次</span></div></article>`;
  }).join("") : `<div class="empty">今天还没有云端听歌记录</div>`;
}

function render() {
  const day = getDay();
  if (!day.voyageReport) day.voyageReport = generateVoyageReport(state.date, day);
  fields.dayTitle.textContent = formatDate(state.date); fields.date.value = state.date; fields.mood.value = day.mood || ""; fields.energy.value = day.energy || 6; fields.energyValue.textContent = day.energy || 6;
  fields.scheduleList.innerHTML = day.schedules.length ? day.schedules.sort((a,b)=>a.time.localeCompare(b.time)).map((item) => `<article class="list-item"><strong>${escapeHtml(item.time)}${item.endTime ? `–${escapeHtml(item.endTime)}` : ""}</strong><div class="main"><strong>${escapeHtml(item.title)}</strong><div class="meta">${escapeHtml(item.type)}${item.durationMinutes ? ` · ${item.durationMinutes} 分钟` : ""}${item.source ? ` · ${escapeHtml(item.source)}` : ""}</div></div><button class="delete" data-kind="schedule" data-id="${item.id}">删除</button></article>`).join("") : `<div class="empty">还没有日程记录</div>`;
  fields.breakfast.value = day.meals?.breakfast || ""; fields.lunch.value = day.meals?.lunch || ""; fields.dinner.value = day.meals?.dinner || ""; fields.mealNotes.value = day.meals?.notes || "";
  const diary = ensureDiary(day); fields.diaryBody.value = diary.body || ""; fields.diaryMood.value = diary.mood || ""; fields.diaryTags.value = (diary.tags || []).join(", "); fields.diaryWordCount.textContent = `${diaryLength(diary.body)} 字`; fields.diarySaveStatus.textContent = diarySavedLabel(diary.updatedAt);
  const selectedBackground = selectedDiaryBackground(diary); const background = selectedBackground?.url || ""; const overlayOpacity = diary.backgroundOpacity / 100; fields.diaryCanvas.style.backgroundImage = background ? `linear-gradient(rgba(255,255,255,${overlayOpacity}), rgba(255,255,255,${overlayOpacity})), url("${background}")` : ""; fields.diaryBackgroundOpacity.value = diary.backgroundOpacity; fields.diaryBackgroundOpacityValue.textContent = `${diary.backgroundOpacity}%`;
  fields.diaryPhotoGallery.innerHTML = (diary.photos || []).map((photo, index) => { const src = safeDiaryPhotoUrl(photo); return src ? `<figure><img src="${escapeHtml(src)}" alt="日记照片 ${index + 1}"><button type="button" class="remove-diary-photo" data-index="${index}" title="删除这张照片" aria-label="删除第 ${index + 1} 张照片">×</button></figure>` : ""; }).join("");
  fields.diaryMediaStatus.textContent = `${(diary.photos || []).length}/4 张照片${selectedBackground ? ` · 背景：${selectedBackground.name}` : " · 已关闭背景"}`;
  renderMusic(day);
  const filled = [day.mood, day.schedules.length, day.music.length, day.meals?.breakfast, day.meals?.lunch, day.meals?.dinner, day.diary?.body].filter(Boolean).length;
  const percent = Math.round(filled / 7 * 100); fields.completionText.textContent = `${percent}%`; fields.completionBar.style.width = `${percent}%`;
  const values = Object.values(records); fields.daysCount.textContent = values.filter((item) => item.schedules?.length || item.music?.length || item.diary?.body || Object.values(item.meals || {}).some(Boolean)).length;
  fields.scheduleCount.textContent = values.reduce((sum,item)=>sum+(item.schedules?.length||0),0); fields.musicCount.textContent = values.reduce((sum,item)=>sum+(item.music?.length||0),0);
  renderVoyageReport(day);
  fields.reviewList.innerHTML = Object.entries(records).filter(([,item])=>item.schedules?.length||item.music?.length||item.diary?.body).sort(([a],[b])=>b.localeCompare(a)).slice(0,20).map(([date,item])=>`<article class="list-item"><div class="main"><strong>${escapeHtml(formatDate(date))}${item.diary?.mood ? ` · ${escapeHtml(item.diary.mood)}` : ""}</strong><div class="meta">${item.schedules?.length||0} 项日程 · ${item.music?.length||0} 次播放${item.diary?.body ? ` · 日记 ${diaryLength(item.diary.body)} 字` : ""}${item.diary?.photos?.length ? ` · ${item.diary.photos.length} 张照片` : ""}</div>${item.diary?.tags?.length ? `<div class="tags review-tags">${item.diary.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}${item.diary?.body ? `<div class="review-diary">${escapeHtml(item.diary.body.slice(0, 100))}${item.diary.body.length > 100 ? "…" : ""}</div>` : ""}</div></article>`).join("") || `<div class="empty">记录会在这里慢慢累积</div>`;
  fields.homeTodayDate.textContent = formatDate(state.date); fields.homeScheduleCount.textContent = day.schedules.length; fields.homeMusicCount.textContent = day.music.length; fields.homeDiaryCount.textContent = diaryLength(day.diary?.body);
}

document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".nav-button,.panel").forEach((node)=>node.classList.remove("active")); button.classList.add("active"); $(`#${button.dataset.panel}`).classList.add("active"); }));
[$("#openApp"),$("#openAppTop"),$("#openTodayLog")].forEach(button=>button.addEventListener("click",showApp));
$("#backHome").addEventListener("click",showHome);
$("#previousHomeBackground").addEventListener("click",()=>{setHomeBackground(homeBackgroundIndex-1);startHomeRotation();});
$("#nextHomeBackground").addEventListener("click",()=>{setHomeBackground(homeBackgroundIndex+1);startHomeRotation();});
$("#toggleHomeRotation").addEventListener("click",event=>{homeRotationPaused=!homeRotationPaused;event.currentTarget.textContent=homeRotationPaused?"▶":"Ⅱ";event.currentTarget.setAttribute("aria-label",homeRotationPaused?"继续背景轮播":"暂停背景轮播");startHomeRotation();});
$("#generateVoyageReport").addEventListener("click",()=>{getDay().voyageReport=generateVoyageReport(state.date,getDay());persist();render();});
$("#exportVoyagePdf").addEventListener("click",()=>window.print());
$("#exportVoyageWord").addEventListener("click",()=>{const report=getDay().voyageReport || generateVoyageReport(state.date,getDay());const html=`<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#17212b;line-height:1.7;margin:48px}h1{color:#287565}small{color:#66727d}</style></head><body><small>ARCADE'S PLANET / DAILY VOYAGE REPORT</small><h1>${escapeHtml(report.brand)}</h1><p>Per aspera ad astra · 循此苦旅 以达繁星</p><h2>${escapeHtml(report.title)}</h2><p>${escapeHtml(report.date)}</p><p>${escapeHtml(report.summary)}</p><h3>今日航线</h3>${report.scheduleHighlights.map(item=>`<p>${escapeHtml(item.time)} · ${escapeHtml(item.title)}</p>`).join("")}<h3>今日旋律</h3><p>${report.topSong ? `${escapeHtml(report.topSong.title)} · ${escapeHtml(report.topSong.artist)}，播放 ${report.topSong.plays} 次` : "没有听歌记录"}</p><h3>船长手记</h3><p>${escapeHtml(getDay().diary?.body || "没有日记记录")}</p></body></html>`;const blob=new Blob([html],{type:"application/msword;charset=utf-8"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`arcade-voyage-${state.date}.doc`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);});
fields.date.addEventListener("change",()=>{state.date=fields.date.value;render();}); fields.mood.addEventListener("change",()=>{getDay().mood=fields.mood.value;persist();render();}); fields.energy.addEventListener("input",()=>{getDay().energy=Number(fields.energy.value);persist();render();});
$("#scheduleForm").addEventListener("submit",(event)=>{event.preventDefault();getDay().schedules.push({id:crypto.randomUUID(),time:$("#scheduleTime").value,title:$("#scheduleTitle").value.trim(),type:$("#scheduleType").value});event.target.reset();persist();render();});
document.addEventListener("click",(event)=>{const button=event.target.closest(".delete");if(!button)return;const list=getDay().schedules;const index=list.findIndex(item=>item.id===button.dataset.id);if(index>=0)list.splice(index,1);persist();render();});
$("#saveMeals").addEventListener("click",()=>{getDay().meals={breakfast:fields.breakfast.value.trim(),lunch:fields.lunch.value.trim(),dinner:fields.dinner.value.trim(),notes:fields.mealNotes.value.trim()};persist();render();});
fields.diaryBody.addEventListener("input",()=>{fields.diaryWordCount.textContent=`${diaryLength(fields.diaryBody.value)} 字`;fields.diarySaveStatus.textContent="有未保存的修改";});
fields.diaryBackgroundOpacity.addEventListener("input",()=>{const diary=ensureDiary();diary.backgroundOpacity=Number(fields.diaryBackgroundOpacity.value);fields.diaryBackgroundOpacityValue.textContent=`${diary.backgroundOpacity}%`;const selected=selectedDiaryBackground(diary);const overlay=diary.backgroundOpacity/100;fields.diaryCanvas.style.backgroundImage=selected?`linear-gradient(rgba(255,255,255,${overlay}), rgba(255,255,255,${overlay})), url("${selected.url}")`:"";fields.diarySaveStatus.textContent="有未保存的背景设置";});
fields.diaryBackgroundOpacity.addEventListener("change",()=>{const diary=ensureDiary();diary.backgroundOpacity=Number(fields.diaryBackgroundOpacity.value);diary.updatedAt=new Date().toISOString();persist();render();});
$("#toggleDiaryExtras").addEventListener("click",(event)=>{const expanded=event.currentTarget.getAttribute("aria-expanded")==="true";event.currentTarget.setAttribute("aria-expanded",String(!expanded));fields.diaryExtras.hidden=expanded;});
$("#saveDiary").addEventListener("click",()=>{const diary=ensureDiary();const nextBody=fields.diaryBody.value.trim();if(diary.source==="一本日记"&&nextBody!==diary.yibenBody)diary.yibenManaged=false;diary.body=nextBody;diary.mood=fields.diaryMood.value;diary.tags=parseDiaryTags(fields.diaryTags.value);diary.updatedAt=new Date().toISOString();persist();render();});
$("#diaryPhotos").addEventListener("change",async(event)=>{try{const diary=ensureDiary();const available=Math.max(0,4-(diary.photos||[]).length);const files=[...event.target.files].slice(0,available);if(!files.length)throw new Error(available?"没有选择照片":"每篇日记最多 4 张照片");fields.diarySaveStatus.textContent="正在处理照片…";for(const file of files)diary.photos.push(await compressDiaryImage(file));diary.updatedAt=new Date().toISOString();await persist();render();}catch(error){fields.diarySaveStatus.textContent=error.message;}event.target.value="";});
$("#diaryBackground").addEventListener("change",async(event)=>{try{await setDiaryBackground(event.target.files[0]);}catch(error){fields.diarySaveStatus.textContent=error.message;}event.target.value="";});
fields.diaryCanvas.addEventListener("dragover",event=>{event.preventDefault();fields.diaryCanvas.classList.add("is-dragging");});
fields.diaryCanvas.addEventListener("dragleave",()=>fields.diaryCanvas.classList.remove("is-dragging"));
fields.diaryCanvas.addEventListener("drop",async(event)=>{event.preventDefault();fields.diaryCanvas.classList.remove("is-dragging");try{await setDiaryBackground([...event.dataTransfer.files].find(file=>file.type?.startsWith("image/")||/\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name)));}catch(error){fields.diarySaveStatus.textContent=error.message;}});
fields.diaryCanvas.addEventListener("paste",async(event)=>{const file=[...event.clipboardData.items].find(item=>item.type.startsWith("image/"))?.getAsFile();if(!file)return;event.preventDefault();try{await setDiaryBackground(file);}catch(error){fields.diarySaveStatus.textContent=error.message;}});
$("#nextDiaryBackground").addEventListener("click",()=>{if(!diaryBackgrounds.length){fields.diarySaveStatus.textContent="后端背景库暂不可用";return;}const diary=ensureDiary();const current=selectedDiaryBackground(diary);const index=Math.max(-1,diaryBackgrounds.findIndex(item=>item.id===current?.id));const next=diaryBackgrounds[(index+1)%diaryBackgrounds.length];diary.background="";diary.backgroundMode="auto";diary.backgroundPreset=next.id;diary.updatedAt=new Date().toISOString();persist();render();});
$("#removeDiaryBackground").addEventListener("click",()=>{const diary=ensureDiary();diary.background="";diary.backgroundMode="none";diary.backgroundPreset="";diary.updatedAt=new Date().toISOString();persist();render();});
document.addEventListener("click",event=>{const button=event.target.closest(".remove-diary-photo");if(!button)return;const diary=ensureDiary();diary.photos.splice(Number(button.dataset.index),1);diary.updatedAt=new Date().toISOString();persist();render();});
$("#exportData").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(records,null,2)],{type:"application/json"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`arcade-planet-demo-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);});
fields.date.value=state.date; render(); loadRecords(); loadHomeBackgrounds();
