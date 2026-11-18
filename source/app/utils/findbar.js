/*
 * Ctrl+F: find a word in the page being displayed (guide, editor tabs...).
 * Enter / F3 = next, Shift+Enter = previous, Esc = close.
 * Matches are highlighted with the CSS Custom Highlight API when the runtime has it, with the text selection otherwise.
 */
! function() {
  var bar = null, input = null, info = null, ranges = [], cur = -1, lastQuery = "", hasHL = !!(window.Highlight && window.CSS && CSS.highlights);

  function tr(key, fallback) {
    try {
      var inj = angular.element(document.body).injector(), v = inj.get("$i18n").get(key);
      return v && v !== key ? v : fallback;
    } catch (e) { return fallback; }
  }

  function build() {
    bar = document.createElement("div");
    bar.id = "xt-find";
    bar.innerHTML = '<input type="text" spellcheck="false"><span class="xt-find-info"></span>' +
      '<a class="xt-find-btn" data-act="prev" title="Shift+Enter">&#9650;</a><a class="xt-find-btn" data-act="next" title="Enter">&#9660;</a>' +
      '<a class="xt-find-btn" data-act="close" title="Esc">&#10005;</a>';
    document.body.appendChild(bar);
    input = bar.querySelector("input");
    info = bar.querySelector(".xt-find-info");
    input.addEventListener("input", function() { search(true); });
    input.addEventListener("keydown", function(ev) {
      if (ev.keyCode === 13) { ev.preventDefault(); step(ev.shiftKey ? -1 : 1); }
    });
    bar.addEventListener("mousedown", function(ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute("data-act");
      if (!act) { return; }
      ev.preventDefault();
      if (act === "close") { close(); } else { step(act === "next" ? 1 : -1); }
    });
  }

  function visibleText(node) {
    var el = node.parentElement;
    if (!el || bar.contains(el)) { return false; }
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/.test(el.tagName)) { return false; }
    return el.getClientRects().length > 0;
  }

  function collect(q) {
    var out = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n, low = q.toLowerCase(), t, i, r;
    while ((n = walker.nextNode())) {
      t = n.nodeValue.toLowerCase();
      if (t.indexOf(low) < 0 || !visibleText(n)) { continue; }
      i = t.indexOf(low);
      while (i >= 0) {
        r = document.createRange();
        r.setStart(n, i); r.setEnd(n, i + q.length);
        out.push(r);
        i = t.indexOf(low, i + q.length);
      }
    }
    return out;
  }

  function render(select) {
    var sel;
    if (hasHL) {
      CSS.highlights.delete("xt-find"); CSS.highlights.delete("xt-find-cur");
      if (ranges.length) {
        var h = new Highlight();
        ranges.forEach(function(r, i) { if (i !== cur) { h.add(r); } });
        CSS.highlights.set("xt-find", h);
        if (cur >= 0) { CSS.highlights.set("xt-find-cur", new Highlight(ranges[cur])); }
      }
    } else if (select && cur >= 0) {
      sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(ranges[cur]);
    }
    if (!lastQuery) { info.textContent = ""; }
    else if (!ranges.length) { info.textContent = tr("FIND_NONE", "No result"); }
    else { info.textContent = (cur + 1) + " / " + ranges.length; }
    bar.className = lastQuery && !ranges.length ? "none" : "";
    if (cur >= 0 && ranges[cur]) {
      var el = ranges[cur].startContainer.parentElement;
      if (el && el.scrollIntoView) { el.scrollIntoView({ block: "center", inline: "nearest" }); }
    }
  }

  function search(fromStart) {
    var q = input.value;
    lastQuery = q;
    ranges = q ? collect(q) : [];
    if (fromStart || cur >= ranges.length) { cur = ranges.length ? 0 : -1; }
    render(false);
  }

  function step(dir) {
    if (input.value !== lastQuery || !ranges.length) { search(true); render(true); return; }
    ranges = collect(lastQuery);
    if (!ranges.length) { cur = -1; render(true); return; }
    cur = (cur + dir + ranges.length) % ranges.length;
    render(true);
  }

  function open() {
    if (!bar) { build(); }
    input.placeholder = tr("FIND_PLACEHOLDER", "Find in the page");
    bar.style.display = "flex";
    input.focus(); input.select();
    if (input.value) { search(true); }
  }

  function close() {
    if (!bar || bar.style.display === "none") { return; }
    bar.style.display = "none";
    ranges = []; cur = -1; lastQuery = "";
    if (hasHL) { CSS.highlights.delete("xt-find"); CSS.highlights.delete("xt-find-cur"); }
  }

  window.addEventListener("keydown", function(ev) {
    var k = ev.keyCode;
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && k === 70) { ev.preventDefault(); ev.stopPropagation(); open(); return; }
    if (bar && bar.style.display !== "none") {
      if (k === 27) { ev.preventDefault(); ev.stopPropagation(); close(); }
      else if (k === 13 && ev.target !== input) { ev.preventDefault(); step(ev.shiftKey ? -1 : 1); }
      else if (k === 114 || ((ev.ctrlKey || ev.metaKey) && k === 71)) { ev.preventDefault(); step(ev.shiftKey ? -1 : 1); }
    }
  }, true);
}();
