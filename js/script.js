/**
 * ============================================================
 * script.js — ページの動き（コピー機能・チェックリスト保存など）
 * ============================================================
 * このファイルは基本的に編集不要です。
 * 文章を変更したい場合は js/content.js を編集してください。
 * ============================================================
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     文字のエスケープ（安全にHTMLへ差し込むための処理）
     プロンプト・検索キーワードなど「そのままコピーされる文章」は
     必ずこの関数を通してから表示します。
  ------------------------------------------------------------ */
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ------------------------------------------------------------
     SEO・OGP・favicon の反映
  ------------------------------------------------------------ */
  function applyMeta(m) {
    if (!m) return;
    document.title = m.pageTitle;
    setMetaContent('meta[name="description"]', m.description);
    setMetaContent('meta[property="og:title"]', m.pageTitle);
    setMetaContent('meta[property="og:description"]', m.description);
    setMetaContent('meta[property="og:image"]', m.ogpImage);
    setMetaContent('meta[property="og:url"]', m.siteUrl);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && m.faviconPath) favicon.setAttribute("href", m.faviconPath);
  }

  function setMetaContent(selector, value) {
    if (value == null) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", value);
  }

  /* ------------------------------------------------------------
     セクションの表示・非表示（content.js の sections で一括制御）
  ------------------------------------------------------------ */
  function toggleSection(id, visible) {
    const root = document.getElementById(id);
    if (!root) return;
    if (visible) {
      root.style.display = "";
      root.removeAttribute("aria-hidden");
    } else {
      root.style.display = "none";
      root.setAttribute("aria-hidden", "true");
    }
  }

  /* ------------------------------------------------------------
     1. ファーストビュー
  ------------------------------------------------------------ */
  function renderHero(c) {
    const root = document.getElementById("hero");
    if (!root || !c) return;
    root.querySelector(".hero__label").textContent = c.label;
    root.querySelector(".hero__title").innerHTML = `${c.titleLine1}<br>${c.titleLine2}`;
    root.querySelector(".hero__subtitle").innerHTML = `${c.subtitleLine1}<br>${c.subtitleLine2}`;
    const introRoot = document.getElementById("hero-intro");
    if (introRoot) {
      introRoot.innerHTML = (c.introParagraphs || []).map((p) => `<p>${p}</p>`).join("");
    }
    const btn = root.querySelector(".btn");
    btn.textContent = c.buttonText;
    btn.setAttribute("href", "#" + c.buttonScrollTargetId);
  }

  /* ------------------------------------------------------------
     「このガイドの流れ」目次（メニューバーではなく単純なリンク一覧）
  ------------------------------------------------------------ */
  function renderGuideFlow(c) {
    const root = document.getElementById("guide-flow");
    if (!root || !c) return;
    root.querySelector(".guide-flow__heading").textContent = c.heading;
    const list = document.getElementById("guide-flow-list");
    list.innerHTML = c.items
      .map((item) => `<li><a href="#${item.target}" data-scroll>${escapeHtml(item.label)}</a></li>`)
      .join("");
  }

  /* ------------------------------------------------------------
     このガイドでできること
  ------------------------------------------------------------ */
  function renderCanDo(c) {
    const root = document.getElementById("can-do");
    if (!root || !c) return;
    root.querySelector(".section__heading").textContent = c.heading;
    const list = document.getElementById("can-do-list");
    list.innerHTML = c.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  /* ------------------------------------------------------------
     冒頭の注意書き（目立ちすぎない注意ボックス）
  ------------------------------------------------------------ */
  function renderDisclaimer(c) {
    const root = document.getElementById("disclaimer-box");
    if (!root || !c) return;
    root.innerHTML = (c.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
  }

  /* ------------------------------------------------------------
     STEP内の部品（画像枠・検索キーワード・プロンプト・注意ボックス）
  ------------------------------------------------------------ */
  function renderImagePlaceholder(image) {
    if (!image) return "";
    if (image.src) {
      return `<img src="${image.src}" alt="${escapeHtml(image.alt || "")}" class="step-image">`;
    }
    return `
      <div class="image-placeholder">
        <span class="image-placeholder__icon" aria-hidden="true">🖼</span>
        <p>${escapeHtml(image.placeholder || "画像を追加してください")}</p>
      </div>`;
  }

  function renderKeywordList(kw, stepIndex) {
    if (!kw) return "";
    const itemsHtml = kw.items
      .map((word, j) => {
        const id = `keyword-${stepIndex}-${j}`;
        return `
        <li class="keyword-item">
          <span class="keyword-item__text" id="${id}">${escapeHtml(word)}</span>
          <button type="button" class="keyword-item__copy copy-btn" data-copy-target="${id}" aria-label="${escapeHtml(word)}をコピーする">
            <span class="copy-btn__label">コピー</span>
            <span class="copy-btn__done" role="status" aria-live="polite">コピーしました</span>
          </button>
        </li>`;
      })
      .join("");
    return `
      <div class="keyword-list">
        <p class="keyword-list__heading">${escapeHtml(kw.heading)}</p>
        <ul class="keyword-list__items">${itemsHtml}</ul>
      </div>`;
  }

  function renderPromptBox(prompt) {
    return `
      <div class="prompt-box">
        <p class="prompt-box__title">${escapeHtml(prompt.title)}</p>
        <pre class="prompt-box__text" id="${prompt.id}">${escapeHtml(prompt.text)}</pre>
        <button type="button" class="btn btn--primary copy-btn" data-copy-target="${prompt.id}" aria-label="${escapeHtml(prompt.title)}をコピーする">
          <span class="copy-btn__label">コピーする</span>
          <span class="copy-btn__done" role="status" aria-live="polite">コピーしました ✓</span>
        </button>
      </div>`;
  }

  function renderCautionBox(box) {
    if (!box) return "";
    const variantClass = box.variant === "strong" ? " caution-box--strong" : " caution-box--soft";
    return `<div class="caution-box${variantClass}"><p>${box.text}</p></div>`;
  }

  /* ------------------------------------------------------------
     STEP1〜8
     steps 配列の数だけ、STEPセクションをその場で組み立てます。
     content.js の steps を増減させれば、STEPの数も自由に変わります。
  ------------------------------------------------------------ */
  function renderSteps(steps) {
    const container = document.getElementById("steps-container");
    if (!container || !steps) return;

    container.innerHTML = steps
      .map((step, i) => {
        const id = "step" + (i + 1);
        const softClass = i % 2 === 1 ? " section--soft" : "";

        let prose = (step.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
        if (step.list && step.list.length) {
          prose += '<ul class="check-list">' + step.list.map((li) => `<li>${li}</li>`).join("") + "</ul>";
        }
        prose += (step.afterParagraphs || []).map((p) => `<p>${p}</p>`).join("");

        const imageHtml = renderImagePlaceholder(step.image);
        const keywordHtml = renderKeywordList(step.keywordList, i);
        const cautionHtml = renderCautionBox(step.cautionBox);
        const promptsHtml = (step.prompts || []).map(renderPromptBox).join("");
        const noteHtml = step.note
          ? `<div class="note-box"><p class="note-box__label">${escapeHtml(step.note.label)}</p><p>${step.note.text}</p></div>`
          : "";

        return `
        <section class="section${softClass} step" id="${id}" aria-labelledby="${id}-heading">
          <div class="section__inner reveal">
            <p class="step__number">${step.number}</p>
            <h2 class="step__title" id="${id}-heading">${step.title}</h2>
            <div class="prose">${prose}</div>
            ${imageHtml}
            ${keywordHtml}
            ${cautionHtml}
            ${promptsHtml}
            ${noteHtml}
          </div>
        </section>`;
      })
      .join("");
  }

  /* ------------------------------------------------------------
     STEP9 応募前チェックリスト
     状態は localStorage に保存し、ページ再読み込みでも保持します。
     保存するのはチェックのON/OFF（true/false）のみです。
  ------------------------------------------------------------ */
  const CHECKLIST_STORAGE_KEY = "linkedin-guide-checklist-v1";

  function loadChecklistState(len) {
    try {
      const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? parsed : [];
      return Array.from({ length: len }, (_, i) => !!arr[i]);
    } catch (e) {
      // プライベートブラウジング等で localStorage が使えない場合は、保存なしで続行します
      return new Array(len).fill(false);
    }
  }

  function saveChecklistState(state) {
    try {
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // 保存できなくてもページの利用自体は続けられるようにします
    }
  }

  function renderChecklist(c) {
    const root = document.getElementById("checklist");
    if (!root || !c) return;
    root.querySelector(".step__number").textContent = c.number;
    root.querySelector(".step__title").textContent = c.heading;
    const descEl = document.getElementById("checklist-desc");
    if (descEl) descEl.textContent = c.description;

    const state = loadChecklistState(c.items.length);
    const list = document.getElementById("checklist-list");
    list.innerHTML = c.items
      .map((item, i) => {
        const id = `checklist-item-${i}`;
        return `
        <li class="checklist-item">
          <label class="checklist-item__label" for="${id}">
            <input type="checkbox" id="${id}" class="checklist-item__input" data-index="${i}" ${
          state[i] ? "checked" : ""
        }>
            <span class="checklist-item__box" aria-hidden="true"></span>
            <span class="checklist-item__text">${escapeHtml(item)}</span>
          </label>
        </li>`;
      })
      .join("");

    list.addEventListener("change", function (e) {
      const input = e.target.closest(".checklist-item__input");
      if (!input) return;
      const idx = Number(input.getAttribute("data-index"));
      const current = loadChecklistState(c.items.length);
      current[idx] = input.checked;
      saveChecklistState(current);
    });
  }

  /* ------------------------------------------------------------
     最後のまとめ
  ------------------------------------------------------------ */
  function renderFinalSummary(c) {
    const root = document.getElementById("final-summary");
    if (!root || !c) return;
    root.querySelector(".section__heading").textContent = c.heading;
    const introEl = document.getElementById("final-summary-intro");
    if (introEl) introEl.textContent = c.intro;

    const flowList = document.getElementById("final-summary-flow");
    flowList.innerHTML = c.flow
      .map((item, i) => `<li><span class="summary-list__number">${i + 1}</span>${escapeHtml(item)}</li>`)
      .join("");

    const body = document.getElementById("final-summary-body");
    body.innerHTML = `<p>${c.flowEnd}</p>` + (c.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
  }

  /* ------------------------------------------------------------
     最後の案内（CTA）
  ------------------------------------------------------------ */
  function renderCta(c) {
    const root = document.getElementById("cta");
    if (!root || !c) return;
    root.querySelector(".cta-card__heading").innerHTML = c.heading;
    const [p1, p2, p3] = c.paragraphs;
    const prose = root.querySelector(".prose");
    prose.innerHTML =
      `<p>${p1}</p><p>${p2}</p>` +
      `<p>${p3}<br><strong class="cta-card__highlight">${c.highlightText}</strong><br>${c.afterHighlight}</p>`;
    const btn = document.getElementById("cta-button");
    btn.setAttribute("href", c.buttonUrl);

    if (c.bannerImage) {
      btn.classList.remove("btn", "btn--primary", "btn--large");
      btn.classList.add("cta-card__banner-link");
      btn.innerHTML = `<img src="${c.bannerImage}" alt="${escapeHtml(c.bannerAlt || c.buttonText)}" class="cta-card__banner-img">`;
      const img = btn.querySelector("img");
      img.addEventListener(
        "error",
        () => {
          // 画像が読み込めなかった場合は、安全のため通常のテキストボタンに戻す
          btn.classList.remove("cta-card__banner-link");
          btn.classList.add("btn", "btn--primary", "btn--large");
          btn.textContent = c.buttonText;
        },
        { once: true }
      );
    } else {
      btn.classList.remove("cta-card__banner-link");
      btn.classList.add("btn", "btn--primary", "btn--large");
      btn.textContent = c.buttonText;
    }
  }

  /* ------------------------------------------------------------
     フッター
  ------------------------------------------------------------ */
  function renderFooter(c) {
    const root = document.querySelector(".footer");
    if (!root || !c) return;
    const noticesHtml = (c.notices || []).map((n) => `<p>${escapeHtml(n)}</p>`).join("");
    root.innerHTML = `<p>${escapeHtml(c.copyright)}</p>${noticesHtml}`;
  }

  /* ------------------------------------------------------------
     コピー機能（クリップボードAPI／古いブラウザ向けの代替あり）
  ------------------------------------------------------------ */
  function legacyCopy(text) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch (e) {
      return false;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        () => true,
        () => legacyCopy(text)
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function bindCopyDelegation() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".copy-btn[data-copy-target]");
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute("data-copy-target"));
      if (!target) return;
      copyText(target.textContent).then((ok) => {
        if (!ok) return;
        btn.classList.add("is-copied");
        window.clearTimeout(btn._copyTimeout);
        btn._copyTimeout = window.setTimeout(() => btn.classList.remove("is-copied"), 2200);
      });
    });
  }

  /* ------------------------------------------------------------
     スクロールで軽くフェードインする演出
  ------------------------------------------------------------ */
  function setupRevealAnimation() {
    const revealEls = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------
     初期化
     content.js が正しく読み込めた場合のみ、内容を反映します。
     content.js が読み込めなかった場合は、index.html に書かれている
     初期文章がそのまま表示されます（ページが真っ白になりません）。
  ------------------------------------------------------------ */
  function init() {
    if (typeof CONTENT !== "undefined") {
      try {
        applyMeta(CONTENT.meta);
        renderHero(CONTENT.hero);
        renderGuideFlow(CONTENT.guideFlow);
        renderCanDo(CONTENT.canDo);
        renderDisclaimer(CONTENT.disclaimer);
        renderSteps(CONTENT.steps);
        renderChecklist(CONTENT.checklist);
        renderFinalSummary(CONTENT.finalSummary);
        renderCta(CONTENT.cta);
        renderFooter(CONTENT.footer);

        const s = CONTENT.sections || {};
        toggleSection("guide-flow", s.guideFlow !== false);
        toggleSection("can-do", s.canDo !== false);
        toggleSection("disclaimer", s.disclaimer !== false);
        toggleSection("steps-container", s.steps !== false);
        toggleSection("checklist", s.checklist !== false);
        toggleSection("final-summary", s.finalSummary !== false);
        toggleSection("cta", s.cta !== false);
      } catch (err) {
        // content.js の書き方に誤りがある場合はここに来ます。
        // index.html に書かれた初期文章がそのまま表示されるので、ページは壊れません。
        console.error("content.js の反映中にエラーが発生しました。index.html の初期内容を表示しています。", err);
      }
    }
    bindCopyDelegation();
    setupRevealAnimation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
