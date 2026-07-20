import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const form = document.getElementById("guestbookForm");
const nickname = document.getElementById("nickname");
const message = document.getElementById("message");
const counter = document.getElementById("counter");
const statusBox = document.getElementById("gbStatus");
const list = document.getElementById("gbList");
const offline = document.getElementById("gbOffline");
const submit = document.getElementById("gbSubmit");

const configured = !Object.values(firebaseConfig).some(v => String(v).includes("PASTE_YOUR"));
let db = null;
let uid = null;

const escapeHtml = (value) => {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
};

const relativeTime = (date) => {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "刚刚";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return date.toLocaleString("zh-CN", {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
};

const render = (docs) => {
  if (!docs.length) {
    list.innerHTML = '<div class="gb-empty">暂时还没有留言，留下第一条吧。</div>';
    return;
  }
  list.innerHTML = docs.map(({id, data}) => {
    const name = data.nickname || "匿名访客";
    const content = data.message || "";
    const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    return `<article class="gb-message" data-id="${id}">
      <div class="gb-message-head">
        <div class="gb-author">
          <div class="gb-avatar">${escapeHtml(name.slice(0,1).toUpperCase())}</div>
          <div><b>${escapeHtml(name)}</b><small>访客留言</small></div>
        </div>
        <span class="gb-time">${relativeTime(date)}</span>
      </div>
      <p>${escapeHtml(content)}</p>
    </article>`;
  }).join("");
};

message.addEventListener("input", () => {
  counter.textContent = `${message.value.length} / 300`;
});

async function start() {
  if (!configured) {
    offline.hidden = false;
    submit.disabled = true;
    statusBox.textContent = "Firebase 尚未配置。请根据压缩包内的设置说明完成一次连接。";
    statusBox.className = "gb-status error";
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getFirestore(app);
    const credential = await signInAnonymously(auth);
    uid = credential.user.uid;

    const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"), limit(100));
    onSnapshot(q, snapshot => {
      render(snapshot.docs.map(doc => ({id: doc.id, data: doc.data()})));
      offline.hidden = true;
    }, error => {
      console.error(error);
      offline.hidden = false;
      offline.textContent = "无法读取留言，请检查 Firestore 规则和网络连接。";
    });
  } catch (error) {
    console.error(error);
    offline.hidden = false;
    offline.textContent = "留言板连接失败，请检查 Firebase 配置。";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!db || !uid) return;

  const name = nickname.value.trim();
  const text = message.value.trim();

  if (!name || !text) {
    statusBox.textContent = "请填写昵称和留言内容。";
    statusBox.className = "gb-status error";
    return;
  }
  if (name.length > 20 || text.length > 300) {
    statusBox.textContent = "昵称最多 20 个字，留言最多 300 个字。";
    statusBox.className = "gb-status error";
    return;
  }

  const lastSent = Number(localStorage.getItem("guestbookLastSent") || 0);
  if (Date.now() - lastSent < 15000) {
    statusBox.textContent = "请稍等 15 秒后再发送下一条留言。";
    statusBox.className = "gb-status error";
    return;
  }

  submit.disabled = true;
  statusBox.textContent = "正在发布…";
  statusBox.className = "gb-status";
  try {
    await addDoc(collection(db, "guestbook"), {
      nickname: name,
      message: text,
      uid,
      createdAt: serverTimestamp()
    });
    localStorage.setItem("guestbookLastSent", String(Date.now()));
    message.value = "";
    counter.textContent = "0 / 300";
    statusBox.textContent = "留言已发布，所有正在浏览的人都会实时看到。";
    statusBox.className = "gb-status success";
  } catch (error) {
    console.error(error);
    statusBox.textContent = "发布失败，请检查网络或数据库规则。";
    statusBox.className = "gb-status error";
  } finally {
    submit.disabled = false;
  }
});

start();
