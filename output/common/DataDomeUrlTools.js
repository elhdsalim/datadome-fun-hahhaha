var r = "*";
var i = "//";
var c = "/";
var o = "?";
var a = "#";
var s = {
  matchesPattern: function (n, e) {
    return !!e && !!n && (e.indexOf(r) > -1 ? this.wildcardMatch(n, e) : n.indexOf(e) > -1);
  },
  wildcardMatch: function (n, e) {
    for (var t = e.split("*"), r = 0, i = 0; i < t.length; i++) {
      var c = t[i];
      if (c !== "") {
        var o = n.indexOf(c, r);
        if (o === -1) {
          return false;
        }
        r = o + c.length;
      }
    }
    return true;
  },
  urlStrictlyMatchesPattern: function (n, e, t) {
    var r = this;
    return Object.keys(t).filter(function (n) {
      return n !== "strict";
    }).every(function (i) {
      switch (i) {
        case "url":
          return r.matchesPattern(n, t[i]);
        case "host":
        case "fragment":
        case "path":
        case "query":
          return r.matchesPattern(e[i], t[i]);
        default:
          return false;
      }
    });
  },
  matchURLParts: function (n, e) {
    if (typeof e != "string") {
      return false;
    }
    if (n.host == null && n.path == null && n.query == null && n.fragment == null) {
      return n.url != null && this.matchesPattern(e, n.url);
    }
    var t;
    var r = {
      host: "",
      path: "",
      query: "",
      fragment: ""
    };
    var s = e.indexOf(i);
    if (e.indexOf("://") > -1 || s === 0) {
      var f = (t = e.slice(s + i.length)).indexOf(c);
      r.host = t.slice(0, f > -1 ? f : undefined);
    } else {
      t = e;
      r.host = document.location.host;
    }
    var u = t.indexOf(c);
    var h = t.indexOf(o);
    var l = t.indexOf(a);
    var w = u > -1 ? u : 0;
    if (h > -1) {
      r.path ||= t.slice(w, h);
      r.query = t.slice(h, l > -1 ? l : undefined);
    }
    if (l > -1) {
      r.path ||= t.slice(w, l);
      r.fragment = t.slice(l);
    }
    r.path ||= t.slice(w);
    if (n.strict) {
      return this.urlStrictlyMatchesPattern(e, r, n);
    } else {
      return this.matchesPattern(r.host, n.host) || this.matchesPattern(r.path, n.path) || this.matchesPattern(r.query, n.query) || this.matchesPattern(r.fragment, n.fragment) || this.matchesPattern(e, n.url);
    }
  },
  matchURLConfig: function (n, e, t) {
    if (n == null) {
      return false;
    }
    if (Array.isArray(t)) {
      for (var r = 0; r < t.length; ++r) {
        var i = t[r];
        if (this.matchURLParts(i, n)) {
          return false;
        }
      }
    }
    if (Array.isArray(e)) {
      for (var c = 0; c < e.length; ++c) {
        var o = e[c];
        if (this.matchURLParts(o, n)) {
          return true;
        }
      }
    }
    return false;
  },
  isAbsoluteUrl: function (n) {
    return typeof n == "string" && (n.indexOf("://") !== -1 || n.indexOf("//") === 0);
  },
  hasDatadomeDomain: function (n) {
    if (!this.isAbsoluteUrl(n)) {
      return false;
    }
    var e = n.split("/")[2];
    e = (e = (e = (e = e.split(":")[0]).split("?")[0]).split("#")[0]).split(".").slice(-2).join(".");
    for (var t = ["datado.me", "captcha-delivery.com"], r = 0; r < t.length; r++) {
      if (e === t[r]) {
        return true;
      }
    }
    return false;
  },
  getHostname: function (n) {
    var e = "https://";
    if (typeof n != "string" || n.indexOf(e) !== 0) {
      return "";
    } else {
      return n.replace(e, "").split("/")[0];
    }
  },
  isFpOrigin: function (n) {
    var e = this.getHostname(n);
    var t = this.getHostname(window.location.href);
    if (!e || !t) {
      return false;
    }
    for (var r = e.split(".").reverse(), i = t.split(".").reverse(), c = 0, o = 0; o < i.length && r[o] === i[o]; ++o) {
      ++c;
    }
    return c >= 2 && r[c] === "ddc";
  },
  isTrustedOrigin: function (n) {
    return this.hasDatadomeDomain(n) || this.isFpOrigin(n);
  },
  getRequestURL: function (n) {
    var e = false;
    var t = false;
    if (window.URL && typeof window.URL == "function") {
      t = n instanceof URL;
    }
    if (window.Request && typeof window.Request == "function") {
      e = n instanceof Request;
    }
    if (e) {
      return n.url;
    } else if (t) {
      return n.href;
    } else {
      return n;
    }
  }
};
module.exports = s;