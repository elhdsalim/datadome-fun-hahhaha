var r = 31536000000;
module.exports = function () {
  this.dataDomeCookieName = "datadome";
  this.IECustomEvent = null;
  this.emptyCookieDefaultValue = ".keep";
  this.dataDomeStatusHeader = "x-dd-b";
  this.dataDomeSfccStatusHeader = "x-sf-cc-x-dd-b";
  this.eventNames = {
    ready: "dd_ready",
    posting: "dd_post",
    posted: "dd_post_done",
    blocked: "dd_blocked",
    responseDisplayed: "dd_response_displayed",
    responseError: "dd_response_error",
    responsePassed: "dd_response_passed",
    responseUnload: "dd_response_unload",
    captchaDisplayed: "dd_captcha_displayed",
    captchaError: "dd_captcha_error",
    captchaPassed: "dd_captcha_passed"
  };
  this.internalEventNames = {
    replayRequest: "dd_replay_request"
  };
  this.ChallengeType = {
    BLOCK: "block",
    HARD_BLOCK: "hard_block",
    DEVICE_CHECK: "device_check",
    DEVICE_CHECK_INVISIBLE_MODE: "device_check_invisible_mode"
  };
  this.responseFormats = {
    html: "HTML",
    json: "JSON"
  };
  this.getCookie = function (n, e) {
    if (n == null) {
      n = this.dataDomeCookieName;
    }
    if (e == null) {
      e = document.cookie;
    }
    var t = new RegExp(n + "=([^;]+)").exec(e);
    if (t != null) {
      return unescape(t[1]);
    } else {
      return null;
    }
  };
  this.findCookiesByName = function (n, e) {
    for (var t, r = e || document.cookie, i = new RegExp("(?:^|;\\s*)(" + n + ")=([^;]+)", "gi"), c = []; t = i.exec(r);) {
      c.push({
        name: t[1],
        value: t[2]
      });
    }
    return c;
  };
  this.findDataDomeCookies = function (n) {
    return this.findCookiesByName(this.dataDomeCookieName, n);
  };
  this.setCookie = function (n) {
    try {
      document.cookie = n;
    } catch (n) {}
  };
  this.replaceCookieDomain = function (n, e) {
    try {
      n = n.replace(/Domain=.*?;/, "Domain=" + e + ";");
    } catch (n) {}
    return n;
  };
  this.getCookieDomainFromCookie = function (n) {
    var e = "Domain=";
    var t = n.indexOf(e);
    if (t === -1) {
      return "";
    }
    var r = t + e.length;
    var i = n.indexOf(";", r);
    if (i === -1) {
      i = n.length;
    }
    return n.substring(r, i).trim();
  };
  this.hasPartitionedAttribute = function (n) {
    return !!n && typeof n == "string" && /;\s*Partitioned\s*(;|$)/i.test(n);
  };
  this.setCookieWithFallback = function (n) {
    var e = "ddCookieCandidateDomain";
    var t = this.getCookie(this.dataDomeCookieName, n);
    if (t === null) {
      return n;
    }
    var r = function (e) {
      var t = this.replaceCookieDomain(n, e);
      document.cookie = t;
      return {
        candidateCookie: t,
        actualValue: this.getCookie(this.dataDomeCookieName)
      };
    }.bind(this);
    if (this.isSessionStorageEnabled()) {
      var i = window.sessionStorage.getItem(e);
      if (i) {
        if ((a = r(i)).actualValue === t) {
          return a.candidateCookie;
        }
      }
    }
    for (var c = function (n) {
        for (var e = n.split("."), t = [], r = 2; r <= e.length; r++) {
          t.push("." + e.slice(-r).join("."));
        }
        if (t.length === 0) {
          t.push(n);
        }
        return t;
      }(window.location.hostname), o = 0; o < c.length; o++) {
      var a;
      var s = c[o];
      if ((a = r(s)).actualValue === t) {
        if (this.isSessionStorageEnabled()) {
          try {
            window.sessionStorage.setItem(e, s);
          } catch (n) {}
        }
        return a.candidateCookie;
      }
    }
    return n;
  };
  this.getDDSession = function () {
    if (window.ddSbh && this.isLocalStorageEnabled()) {
      var n = window.localStorage.getItem(window.dataDomeOptions.ddCookieSessionName);
      if (n) {
        return n;
      }
    }
    var e = this.getCookie(this.dataDomeCookieName, document.cookie);
    return e || this.emptyCookieDefaultValue;
  };
  this.setDDSession = function (n) {
    try {
      var e = this.getCookie(this.dataDomeCookieName, n);
      var t = this.getRootDomain(window.location.origin ? window.location.origin : window.location.href);
      if (window.ddSbh && this.isLocalStorageEnabled()) {
        window.localStorage.setItem(window.dataDomeOptions.ddCookieSessionName, e);
      }
      var i = "; expires=" + new Date(Date.now() + r).toGMTString();
      this.setCookieWithFallback("datadome=" + e + i + "; path=/" + (t ? "; domain=" + t : ""));
    } catch (n) {}
  };
  this.getRootDomain = function (n) {
    if (typeof n != "string") {
      return "";
    }
    var e = "://";
    var t = n.indexOf(e);
    if (t === -1) {
      return "";
    }
    var r = n.substring(t + e.length);
    var i = r.indexOf("/");
    var c = i !== -1 ? r.substring(0, i) : r;
    var o = c.indexOf(":");
    if (o > -1) {
      c = c.slice(0, o);
    }
    var a = c.split(".");
    if (a.length >= 2) {
      return "." + a.slice(-2).join(".");
    } else {
      return c;
    }
  };
  this.debug = function (n, e) {
    if (typeof console != "undefined" && console.log !== undefined) {
      window.dataDomeOptions.debug;
    }
  };
  this.removeSubstringPattern = function (n, e) {
    if (e) {
      return n.replace(new RegExp(e), function (n, e) {
        return n.replace(e, "");
      });
    } else {
      return n;
    }
  };
  this.addEventListener = function (n, e, t, r) {
    if (n.addEventListener) {
      n.addEventListener(e, t, r);
    } else if (n.attachEvent !== undefined) {
      n.attachEvent("on" + e, t);
    } else {
      n["on" + e] = t;
    }
  };
  this.removeEventListener = function (n, e, t, r) {
    if (n.removeEventListener) {
      n.removeEventListener(e, t, r);
    } else if (n.detachEvent) {
      n.detachEvent("on" + e, t);
    }
  };
  this.noscroll = function () {
    window.scrollTo(0, 0);
  };
  this.isSafariUA = function () {
    return !!window.navigator && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  };
  this.dispatchEvent = function (n, e) {
    var t;
    (e = e || {}).context = "tags";
    if (typeof window.CustomEvent == "function") {
      t = new CustomEvent(n, {
        detail: e
      });
    } else {
      this.IECustomEvent ||= function (n, e) {
        var t = document.createEvent("CustomEvent");
        t.initCustomEvent(n, false, false, e);
        return t;
      };
      t = new this.IECustomEvent(n, e);
    }
    if (t) {
      window.dispatchEvent(t);
    }
  };
  this.isLocalStorageEnabled = function () {
    if (this.localStorageEnabled == null) {
      this.localStorageEnabled = function () {
        try {
          return !!window.localStorage;
        } catch (n) {
          return false;
        }
      }();
    }
    return this.localStorageEnabled;
  };
  this.isSessionStorageEnabled = function () {
    if (this.sessionStorageEnabled == null) {
      this.sessionStorageEnabled = function () {
        try {
          return !!window.sessionStorage;
        } catch (n) {
          return false;
        }
      }();
    }
    return this.sessionStorageEnabled;
  };
  this.removeCookie = function (n, e) {
    var t = [];
    t.push(n + "=0");
    if (e && e.domain) {
      t.push("Domain=" + e.domain);
    }
    if (e && e.path) {
      t.push("Path=" + e.path);
    }
    if (e && e.partitioned) {
      t.push("Partitioned");
    }
    t.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    document.cookie = t.join(";");
    return this.getCookie(n) === null;
  };
  this.deleteAllDDCookies = function () {
    for (var n = document.cookie.split("; "), e = document.location.host, t = e.split("."), r = [e, t.slice(t.length - 2).join(".")], i = 0; i < n.length; i++) {
      var c = n[i];
      var o = c.indexOf("=");
      var a = o > -1 ? c.substr(0, o) : c;
      if (a === "datadome") {
        for (var s = 0; s < r.length; s++) {
          document.cookie = a + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=" + r[s] + "; path=/";
        }
      }
    }
  };
  this.getResponseTypeAndContent = function (n) {
    try {
      var e = JSON.parse(n);
      return {
        type: this.responseFormats.json,
        data: e
      };
    } catch (e) {
      return {
        type: this.responseFormats.html,
        data: n
      };
    }
  };
  this.hasHeader = function (n, e) {
    if (typeof n == "string") {
      var t = e + ": ";
      return n.indexOf("\n" + t) > 0 || n.indexOf(t) === 0;
    }
    return typeof n == "object" && n.constructor.name === "Headers" && n.has(e);
  };
  this.checkDataDomeStatusHeader = function (n) {
    return this.hasHeader(n, this.dataDomeStatusHeader) || this.hasHeader(n, this.dataDomeSfccStatusHeader);
  };
  this.findXHRHeaderValue = function (n, e) {
    for (var t = n.trim().split(/[\r\n]+/), r = 0; r < t.length; r++) {
      var i = t[r].split(": ");
      if (i[0].toLowerCase() === e.toLowerCase()) {
        return i[1] || null;
      }
    }
    return null;
  };
  this.decodeHTMLEntity = function (n) {
    var e = new DOMParser().parseFromString(n, "text/html");
    if (e) {
      return e.documentElement.textContent;
    } else {
      return "";
    }
  };
  this.getDataDomeChallengeType = function (n) {
    var e = null;
    if (typeof n == "string") {
      e = this.findXHRHeaderValue(n, this.dataDomeStatusHeader) || this.findXHRHeaderValue(n, this.dataDomeSfccStatusHeader);
    } else if (typeof n == "object" && n.constructor.name === "Headers") {
      e = n.get(this.dataDomeStatusHeader) || n.get(this.dataDomeSfccStatusHeader);
    }
    if (!e) {
      return null;
    }
    switch (e & 255) {
      case 1:
        return this.ChallengeType.BLOCK;
      case 2:
        return this.ChallengeType.HARD_BLOCK;
      case 3:
        if (Boolean(e >> 8 & 1)) {
          return this.ChallengeType.DEVICE_CHECK_INVISIBLE_MODE;
        } else {
          return this.ChallengeType.DEVICE_CHECK;
        }
      default:
        return this.ChallengeType.UNKNOWN;
    }
  };
  this.removeUnpartitionedCookieIfPartitionedOneIsPresent = function (n) {
    if (!window.dataDomeUnpartitionedCookieCleanupExecuted) {
      var e = this.findDataDomeCookies();
      if (!(e.length < 2)) {
        this.removeCookie(e[0].name, {
          domain: n || window.location.hostname,
          path: "/",
          partitioned: false
        });
        window.dataDomeUnpartitionedCookieCleanupExecuted = true;
      }
    }
  };
};