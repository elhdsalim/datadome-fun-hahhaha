var r = require("../common/DataDomeTools");
var i = require("../live-events/DataDomeEventsTracking").DataDomeEventsTracking;
module.exports = function (n) {
  var e = new r();
  function t(n, e, t) {
    var r = this;
    setTimeout(function () {
      try {
        n.call(r, e);
      } catch (n) {}
    }, t);
  }
  function c() {
    var t = 0;
    if (e.isLocalStorageEnabled() && window.localStorage.getItem(window.dataDomeOptions.ddCookieSessionName) != null && window.dataDomeOptions.sessionByHeader !== true) {
      t = 1;
    }
    n.i("exp8", t);
  }
  function o() {
    var t;
    try {
      if ((t = (document.cookie.match(/datadome=/g) || []).length) > 1 && window.ddjskey === "499AE34129FA4E4FABC31582C3075D") {
        e.deleteAllDDCookies();
      }
      if (["8FE0CF7F8AB30EC588599D8046ED0E", "87F03788E785FF301D90BB197E5803", "765F4FCDDF6BEDC11EC6F933C2BBAF", "00D958EEDB6E382CCCF60351ADCBC5", "E425597ED9CAB7918B35EB23FEDF90", "E425597ED9CAB7918B35EB23FEDF90"].indexOf(window.ddjskey) === -1 && t === 2 && window.location.href.indexOf("www.") > -1) {
        document.cookie = "datadome=1; Max-Age=0; Path=/;";
      }
    } catch (n) {
      t = "err";
    }
    n.i("nddc", t);
  }
  function a() {
    var e = new i(n, true);
    function t(n, t) {
      try {
        for (var r = 0; r < n.length; r++) {
          var i = n[r];
          var c = i.target.querySelector("button[type=\"submit\"]");
          if (i.type === "childList" && c) {
            c.addEventListener("click", function (n) {
              e.collect();
            });
            t.disconnect();
            break;
          }
        }
      } catch (n) {}
    }
    new MutationObserver(function (n, r) {
      try {
        for (var i = 0; i < n.length; i++) {
          var c = n[i];
          var o = c.target.querySelector("[data-testid=auth-modal--overlay]");
          var a = c.target.querySelector(".auth__container");
          var s = o || a;
          if (c.type === "childList" && s) {
            e.process();
            new MutationObserver(t).observe(s, {
              childList: true,
              subtree: true
            });
            r.disconnect();
            break;
          }
        }
      } catch (n) {}
    }).observe(document.querySelector("body"), {
      childList: true
    });
  }
  function s() {
    n.i("uid", e.getCookie("correlation_id"));
  }
  function f() {
    var e = "input#btnSDel[value='  Refund in Square & Delete  ']";
    var t = "path#path3010[inkscape\\:connector-curvature='0'][d^='M45.333,0.901H9.868C4.992']";
    var r = "button[style*=\"background-image: url(\"][style*=\"PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4\"]";
    function i() {
      try {
        var i = document.querySelector(e) || document.querySelector(t) || document.querySelector(r);
        if (i) {
          n.i("rhbe", true);
        }
        return i;
      } catch (n) {}
    }
    if (!i()) {
      var c = setInterval(function () {
        if (i()) {
          clearInterval(c);
        }
      }, 50);
    }
  }
  function u() {
    function e(e) {
      try {
        n.i("nhbe", e);
        t();
      } catch (n) {}
    }
    function t() {
      try {
        document.documentElement.removeEventListener("appAjaxCall", r);
        clearInterval(c);
      } catch (n) {}
    }
    function r() {
      e(2);
    }
    function i() {
      try {
        for (var n = document.querySelectorAll("form"), e = 0; e < n.length; e++) {
          if (n[e].getAttribute("patched") === "true") {
            return true;
          }
        }
        return false;
      } catch (n) {}
    }
    document.documentElement.addEventListener("appAjaxCall", r);
    if (i()) {
      return e(1);
    }
    var c = setInterval(function () {
      if (i()) {
        e(1);
      }
    }, 100);
    setTimeout(function () {
      t();
    }, 60000);
  }
  function h() {
    const e = new XMLHttpRequest();
    e.open("HEAD", "chrome-extension://oojibhnkahnabembdeoicblilpbfmnhg/icon.0024de64.png");
    e.onload = function () {
      try {
        if (e.status === 200) {
          n.i("obe", true);
        }
      } catch (n) {}
    };
    e.send();
  }
  this.process = function () {
    t(function () {
      n.u();
    });
    t(o);
    t(c);
    if (window.ddjskey === "2211F522B61E269B869FA6EAFFB5E1") {
      t(s);
    }
    if (window.ddjskey == "E6EAF460AA2A8322D66B42C85B62F9") {
      t(a);
    }
    if (window.ddjskey == "2D56F91C2AD1A8EB7C6A5CA65F5567") {
      t(f);
      t(u);
      t(h);
    }
  };
};