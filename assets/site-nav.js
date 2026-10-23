/* Phones: music store links open in the same tab, so the app launches without leaving a blank tab behind.
   Computers keep opening them in a new window. Runs on its own, before the menu code, and also catches
   links the menu adds later (checked again at tap time). */
(function () {
  var stores = ["open.spotify.com", "music.apple.com", "music.youtube.com", "soundcloud.com"];
  var redirects = ["/spotify/", "/apple/", "/youtube-music/"];
  /* David's YouTube channel (not single videos): opens the app on phones like the stores. */
  var channels = ["/channel/ucdqz1e9ur4phyneylnmjdg", "/@relaxinginstrumentalvideos"];

  function isChannel(url) {
    var host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
    if (host !== "youtube.com") return false;
    var path = url.pathname.toLowerCase().replace(/_/g, "").replace(/\/+$/, "");
    for (var i = 0; i < channels.length; i++) {
      if (path === channels[i] || path.indexOf(channels[i] + "/") === 0) return true;
    }
    return false;
  }

  function isPhone() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true; /* iPadOS */
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }

  function isMusicLink(a) {
    var raw = a.getAttribute("href");
    if (!raw) return false;
    var url;
    try { url = new URL(raw, location.href); } catch (err) { return false; }
    var host = url.hostname.toLowerCase();
    if (stores.indexOf(host) !== -1) return true;
    if (isChannel(url)) return true;
    if (url.origin !== location.origin) return false;
    var path = url.pathname.replace(/index\.html$/, "");
    if (path.charAt(path.length - 1) !== "/") path += "/";
    return redirects.indexOf(path) !== -1;
  }

  function sameTab(a) {
    if (a.getAttribute("target") === "_blank" && isMusicLink(a)) a.removeAttribute("target");
  }

  function sweep() {
    if (!isPhone()) return;
    var links = document.querySelectorAll("a[target=_blank]");
    for (var i = 0; i < links.length; i++) sameTab(links[i]);
  }

  /* Tap time, capture phase: runs before the browser follows the link and leaves other click handlers alone. */
  document.addEventListener("click", function (event) {
    if (!isPhone()) return;
    var a = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (a) sameTab(a);
  }, true);

  /* After the menu code below has built its links (and on sites where it re-adds new-window targets). */
  setTimeout(sweep, 0);
  window.addEventListener("load", sweep);

  /* YouTube channel taps: Meta Pixel "YouTubeTap" (where the pixel is installed) and GoatCounter event "youtube". */
  document.addEventListener("click", function (event) {
    var a = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!a) return;
    var url;
    try { url = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
    if (!isChannel(url)) return;
    try { if (typeof window.fbq === "function") window.fbq("trackCustom", "YouTubeTap"); } catch (err) {}
    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: "youtube", title: "youtube", event: true });
      }
    } catch (err) {}
  }, true);
})();

/* Site menu. Add a destination by appending one entry. The open menu lists every other destination.
   Subscribe confirmation and thank-you pages are not destinations.
   Scores is the one shared score library, on Lackadaisical Perfection.
   Albums, newest first, sit under Scores. The current site is a "You're here" row. */
(function () {
  var pages = [
    { href: "/", label: "Album" },
    { href: "https://lackadaisicalperfection.com/scores/", label: "Scores", blank: true },
    { href: "https://lackadaisicalperfection.com/about/", label: "About", blank: true }
  ];

  function normalize(path) {
    var p = path || "/";
    var base = location.origin && location.origin !== "null"
      ? location.origin
      : "https://pianoincolors.com";
    try {
      p = new URL(p, base).pathname;
    } catch (err) {
      p = "/";
    }
    if (p === "/index.html" || p.slice(-11) === "/index.html") {
      p = p.slice(0, -10);
    }
    if (p.charAt(p.length - 1) !== "/") p += "/";
    return p;
  }

  function excluded(path) {
    return path.indexOf("/subscribe/confirmed/") !== -1
      || path.indexOf("/thank-you/") !== -1
      || path.indexOf("/thanks/") !== -1;
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  var here = normalize(location.pathname);
  var links = pages.filter(function (page) {
    var path = normalize(page.href);
    if (excluded(path)) return false;
    return path !== here;
  });

  var button = document.createElement("button");
  button.type = "button";
  button.className = "nav-toggle";
  button.setAttribute("aria-label", "Open menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "site-menu");

  var img = document.createElement("img");
  img.src = "/assets/david-with-lp.jpg";
  img.srcset = "/assets/david-with-lp.jpg 1x, /assets/david-with-lp@2x.jpg 2x";
  img.width = 160;
  img.height = 160;
  img.alt = "";
  img.decoding = "async";
  button.appendChild(img);

  var list = document.createElement("ul");
  list.setAttribute("role", "list");
  links.forEach(function (page) {
    var item = document.createElement("li");
    var link = document.createElement("a");
    link.href = page.href;
    link.textContent = page.label;
    if (page.blank) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    item.appendChild(link);
    list.appendChild(item);
  });

  var menu = document.createElement("nav");
  menu.id = "site-menu";
  menu.className = "site-menu";
  menu.setAttribute("aria-label", "Pages");
  menu.hidden = true;
  menu.appendChild(list);

  var albums = [
    { href: "https://lackadaisicalperfection.com/", title: "Lackadaisical Perfection", file: "lackadaisical-perfection" },
    { href: "https://pianoreveries.com/", title: "Piano Reveries and Phantasies", file: "piano-reveries" },
    { href: "https://smittenwiththemuses.com/", title: "Smitten with the Muses", file: "smitten-with-the-muses" },
    { href: "https://whereintheworldisdiane.com/", title: "Where In The World Is Diane", file: "where-in-the-world-is-diane" },
    { href: "https://cleancalmpiano.com/", title: "Clean Calm Piano", file: "clean-calm-piano" },
    { href: "https://tantalizingproof.com/", title: "Tantalizing Proof", file: "tantalizing-proof" },
    { href: "https://pianoincolors.com/", title: "Piano In Colors", file: "piano-in-colors" },
    { href: "https://melodicsubtlety.com/", title: "Melodic Subtlety \u2013 Solo Piano", file: "melodic-subtlety" }
  ];

  function siteHost() {
    var host = (location.hostname || "").toLowerCase();
    if (host.indexOf("www.") === 0) host = host.slice(4);
    if (!host || host === "localhost" || host === "127.0.0.1") return "pianoincolors.com";
    return host;
  }

  function coverImage(file, title) {
    var image = document.createElement("img");
    image.src = "/assets/albums/" + file + ".jpg";
    image.srcset = "/assets/albums/" + file + ".jpg 48w, /assets/albums/" + file + "@2x.jpg 96w";
    image.sizes = "48px";
    image.width = 48;
    image.height = 48;
    image.alt = title ? title.split(" \u2013 ")[0].split(" – ")[0] + " album cover" : "";
    image.decoding = "async";
    return image;
  }

  var thisHost = siteHost();
  var albumList = document.createElement("ul");
  albumList.setAttribute("role", "list");
  albums.forEach(function (album) {
    var item = document.createElement("li");
    var host = "";
    try {
      host = new URL(album.href).hostname.replace(/^www\./, "");
    } catch (err) {
      host = "";
    }
    if (host === thisHost) {
      var current = document.createElement("div");
      current.className = "album-current";
      current.appendChild(coverImage(album.file, album.title));
      var copy = document.createElement("span");
      copy.className = "album-copy";
      var title = document.createElement("span");
      title.className = "album-title";
      title.textContent = album.title;
      var note = document.createElement("span");
      note.className = "album-note";
      note.textContent = "You're here";
      copy.appendChild(title);
      copy.appendChild(note);
      current.appendChild(copy);
      item.className = "is-here";
      item.setAttribute("aria-current", "page");
      item.appendChild(current);
    } else {
      var link = document.createElement("a");
      link.href = album.href;
      link.target = "_blank";
      link.rel = "noopener";
      link.appendChild(coverImage(album.file, album.title));
      var name = document.createElement("span");
      name.className = "album-title";
      name.textContent = album.title;
      link.appendChild(name);
      item.appendChild(link);
    }
    albumList.appendChild(item);
  });

  var albumsLabel = document.createElement("p");
  albumsLabel.id = "albums-label";
  albumsLabel.className = "albums-label";
  albumsLabel.textContent = "Albums";

  var albumsSection = document.createElement("section");
  albumsSection.className = "albums";
  albumsSection.setAttribute("aria-labelledby", "albums-label");
  albumsSection.appendChild(albumsLabel);
  albumsSection.appendChild(albumList);
  menu.appendChild(albumsSection);

  document.body.appendChild(button);
  document.body.appendChild(menu);

  var generation = 0;
  var open = false;

  function setOpenState(next) {
    open = next;
    button.setAttribute("aria-expanded", next ? "true" : "false");
    button.setAttribute("aria-label", next ? "Close menu" : "Open menu");
  }

  function finishClose(gen) {
    if (gen !== generation || open) return;
    menu.hidden = true;
    if ("inert" in menu) menu.inert = true;
  }

  function openMenu() {
    generation += 1;
    menu.hidden = false;
    if ("inert" in menu) menu.inert = false;
    if (reducedMotion()) {
      menu.classList.add("is-open");
    } else {
      menu.classList.remove("is-open");
      void menu.offsetWidth;
      menu.classList.add("is-open");
    }
    setOpenState(true);
  }

  function closeMenu(restoreFocus) {
    var gen = generation += 1;
    setOpenState(false);
    menu.classList.remove("is-open");
    if ("inert" in menu) menu.inert = true;
    if (reducedMotion()) {
      finishClose(gen);
    } else {
      var timer = setTimeout(function () { finishClose(gen); }, 400);
      menu.addEventListener("transitionend", function onEnd(event) {
        if (event.target !== menu || event.propertyName !== "opacity") return;
        menu.removeEventListener("transitionend", onEnd);
        clearTimeout(timer);
        finishClose(gen);
      });
    }
    if (restoreFocus) button.focus();
  }

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    if (open) closeMenu(false);
    else openMenu();
  });

  document.addEventListener("click", function (event) {
    if (!open) return;
    if (menu.contains(event.target)) return;
    closeMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    closeMenu(true);
  });
})();
