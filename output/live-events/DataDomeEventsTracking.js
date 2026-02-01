var r = require("../http/DataDomeRequest");
var i = require("../common/DataDomeTools");
function c(n) {
  return function () {
    try {
      return n.apply(this, arguments);
    } catch (n) {
      return null;
    }
  };
}
function o(n) {
  return function (n) {
    var e = 16777619;
    var t = 2166136261;
    for (var r = 0; r < n.length; r++) {
      t = (t ^= n.charCodeAt(r)) * e >>> 0;
    }
    return t;
  }([Math.ceil(n.mousemove / 10), Math.ceil(n.touchmove / 10), n.scroll, n.click, n.keydown > 0 ? 1 : 0, n.keyup > 0 ? 1 : 0].join("_"));
}
function a(n, e) {
  if (!n || n.length == 0) {
    return null;
  }
  var t = n.sort(function (n, e) {
    return n - e;
  });
  var r = (t.length - 1) * e / 100;
  var i = Math.floor(r);
  if (t[i + 1] !== undefined) {
    var c = r - i;
    return t[i] + c * (t[i + 1] - t[i]);
  }
  return t[i];
}
function s(n, e, t, r) {
  var i = t - n;
  var c = r - e;
  var o = Math.acos(i / Math.sqrt(i * i + c * c));
  if (c < 0) {
    return -o;
  } else {
    return o;
  }
}
function f(n) {
  if (!n || n.length == 0) {
    return null;
  }
  var e = 0;
  for (var t = 0; t < n.length; t++) {
    e += n[t];
  }
  return e / n.length;
}
function u(n, e) {
  if (!n || n.length == 0) {
    return null;
  }
  var t = 0;
  for (var r = 0; r < n.length; r++) {
    var i = e - n[r];
    t += Math.pow(i, 2);
  }
  var c = t / n.length;
  return Math.sqrt(c);
}
function h(n) {
  this.keysAnalyzer = new w();
  this.mouseAnalyzer = new l();
  var e = false;
  this._eventIsValid = function (n) {
    if (n.isTrusted && !n.repeat) {
      var e = performance.now();
      if (n.timeStamp > 0 && n.timeStamp > e - 5000 && n.timeStamp < e) {
        return true;
      }
    }
    return false;
  };
  this.handleEvent = function (t) {
    if (this._eventIsValid(t)) {
      switch (t.type) {
        case "mousemove":
          if (!e) {
            e = true;
            n.i("m_fmi", t.pageY == t.screenY && t.pageX == t.screenX);
          }
          this.mouseAnalyzer._handleMouseMove(t);
          break;
        case "keydown":
        case "keyup":
          this.keysAnalyzer.recordKeyEvent(t);
      }
    }
  };
  this.buildAndStoreSignals = function () {
    try {
      var e = this.mouseAnalyzer.computeSignals();
      var t = this.keysAnalyzer.computeSignals();
      for (var r in e) {
        n.i(r, e[r]);
      }
      for (var i in t) {
        n.i(i, t[i]);
      }
    } catch (n) {}
  };
}
function l() {
  this._lastMouseMoveEvent = null;
  this._currentStrokeEvents = [];
  this._sigmas = [];
  this._mus = [];
  this._dists = [];
  this._startAngles = [];
  this._endAngles = [];
  this._consumeStroke = function () {
    try {
      var n = this._currentStrokeEvents.length;
      if (n > 1) {
        var e = 0;
        var t = 0;
        for (var r = 0; r < n; r++) {
          var i = Math.log(this._currentStrokeEvents[r].timeStamp);
          e += i;
          t += i * i;
        }
        this._sigmas.push(Math.sqrt((n * t - e * e) / n * (n - 1)) / 1000);
        this._mus.push(e / n);
        var c = this._currentStrokeEvents[0];
        var o = this._currentStrokeEvents[n - 1];
        this._dists.push((w = c.clientX, d = c.clientY, v = o.clientX, b = o.clientY, y = v - w, p = b - d, Math.sqrt(y * y + p * p)));
        var a = n < 4 ? n - 1 : 3;
        var f = this._currentStrokeEvents[a];
        var u = this._currentStrokeEvents[n - a - 1];
        var h = s(c.clientX, c.clientY, f.clientX, f.clientY);
        var l = s(o.clientX, o.clientY, u.clientX, u.clientY);
        this._startAngles.push(h);
        this._endAngles.push(l);
      }
      this._currentStrokeEvents = [];
    } catch (n) {}
    var w;
    var d;
    var v;
    var b;
    var y;
    var p;
  };
  this._handleMouseMove = function (n) {
    if (this._lastMouseMoveEvent) {
      if (n.timeStamp - this._lastMouseMoveEvent.timeStamp > 499) {
        this._consumeStroke();
      }
    }
    this._currentStrokeEvents.push(n);
    this._lastMouseMoveEvent = n;
  };
  this.computeSignals = function () {
    try {
      this._consumeStroke();
      return {
        es_sigmdn: c(a)(this._sigmas, 50),
        es_mumdn: c(a)(this._mus, 50),
        es_distmdn: c(a)(this._dists, 50),
        es_angsmdn: c(a)(this._startAngles, 50),
        es_angemdn: c(a)(this._endAngles, 50)
      };
    } catch (n) {
      return {};
    }
  };
}
function w() {
  this._keyEvents = [];
  this.keydowns = 0;
  this.keyups = 0;
  this.recordKeyEvent = function (n) {
    try {
      if (n && n instanceof KeyboardEvent && (n.type === "keydown" || n.type === "keyup")) {
        this._keyEvents.push({
          ts: n.timeStamp,
          key: n.key,
          type: n.type
        });
      }
    } catch (n) {}
  };
  this._getSequenceWindows = function (n, e) {
    var t = [];
    for (var r = 0; r < n.length - e + 1; r++) {
      t.push(n.slice(r, r + e));
    }
    return t;
  };
  this.computeSignals = function () {
    try {
      var n = [];
      var e = [];
      var t = [];
      var r = [];
      var i = null;
      var o = null;
      var a = {};
      var s = [];
      var h = new window.Set();
      for (var l = 0; l < this._keyEvents.length; l++) {
        var w = this._keyEvents[l];
        if (w.type === "keydown") {
          this.keydowns++;
          a[w.key] = w;
          if (i) {
            e.push(w.ts - i.ts);
          }
          i = w;
        } else if (w.type === "keyup") {
          this.keyups++;
          if (a[w.key]) {
            var d = a[w.key];
            a[w.key] = null;
            n.push(w.ts - d.ts);
          }
          if (o) {
            t.push(w.ts - o.ts);
          }
          o = w;
        }
        if (!h.has(l)) {
          for (var v = l + 1; v < this._keyEvents.length; v++) {
            var b = this._keyEvents[v];
            if (w.key === b.key) {
              s.push([w, b]);
              h.add(l);
              h.add(v);
              break;
            }
          }
        }
      }
      for (var y = this._getSequenceWindows(s, 2), p = 0; p < y.length; p++) {
        var m = y[p][0];
        var F = y[p][1];
        r.push(F[0].ts - m[1].ts);
      }
      var L = c(f)(n);
      var U = c(f)(e);
      var A = c(f)(t);
      var Q = c(f)(r);
      return {
        k_hA: L,
        k_hSD: c(u)(n, L),
        k_pA: U,
        k_pSD: c(u)(e, U),
        k_rA: A,
        k_rSD: c(u)(t, A),
        k_ikA: Q,
        k_ikSD: c(u)(r, Q),
        k_kdc: this.keydowns,
        k_kuc: this.keyups
      };
    } catch (n) {
      return {};
    }
  };
}
module.exports.EventStats = h;
module.exports.DataDomeEventsTracking = function (n, e) {
  var t = 10000;
  var c = true;
  var a = "le";
  if (e) {
    a = "fm";
  }
  var s;
  var f = new r(a);
  var u = new i();
  var l = new h(n);
  var w = false;
  var d = null;
  var v = false;
  var b = false;
  var y = ["mousemove", "click", "scroll", "touchstart", "touchend", "touchmove", "keydown", "keyup"];
  var p = function () {
    var n = {};
    for (var e = 0; e < y.length; e++) {
      n[y[e]] = 0;
    }
    return n;
  }();
  function m(n) {
    w = true;
    if (!e) {
      (function () {
        if (d != null || !v) {
          return;
        }
        d = setTimeout(function () {
          F(true);
        }, t);
      })();
    }
    p[n.type]++;
    l.handleEvent(n);
  }
  function F(e) {
    if (!b && w && window.dataDomeOptions) {
      b = true;
      l.buildAndStoreSignals();
      n.i("m_s_c", p.scroll);
      n.i("m_m_c", p.mousemove);
      n.i("m_c_c", p.click);
      n.i("m_cm_r", p.mousemove === 0 ? -1 : p.click / p.mousemove);
      n.i("m_ms_r", p.scroll === 0 ? -1 : p.mousemove / p.scroll);
      try {
        var t = o(p);
        n.i("uish", String(t));
      } catch (n) {}
      f.requestApi(window.ddjskey, n, p, window.dataDomeOptions.patternToRemoveFromReferrerUrl, e, window.dataDomeOptions.ddResponsePage);
      (function () {
        for (var n = 0; n < y.length; n++) {
          u.removeEventListener(document, y[n], m, c);
        }
      })();
    }
  }
  this.process = function () {
    (function () {
      for (var n = 0; n < y.length; n++) {
        u.addEventListener(document, y[n], m, c);
      }
    })();
    s = window.requestAnimationFrame(function (n) {
      v = true;
    });
    if (!e) {
      u.addEventListener(window, "onpagehide" in window ? "pagehide" : "beforeunload", function () {
        clearTimeout(d);
        window.cancelAnimationFrame(s);
        F(false);
      });
    }
  };
  this.collect = function () {
    F(true);
  };
};
module.exports.nech = o;