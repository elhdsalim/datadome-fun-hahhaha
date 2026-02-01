var r = require("./DetectionWrapper");
var i = require("./common/DataDomeTools");
(function () {
  var e = new i();
  function t(e) {
    if (window.dataDomeOptions.exposeCaptchaFunction === true) {
      var t = new (require("./http/DataDomeResponse"))(e).displayResponsePagePublic;
      window.displayDataDomeCaptchaPage = t;
      window.displayDataDomeResponsePage = t;
    }
  }
  function c(e, t) {
    if (e.indexOf(1) === -1) {
      new (require("./services/DataDomeApiClient"))(t).processSyncRequest();
    }
  }
  function o(e, t) {
    if (e.indexOf(3) === -1 && window.dataDomeOptions.eventsTrackingEnabled) {
      new (0, require("./live-events/DataDomeEventsTracking").DataDomeEventsTracking)(t, false).process();
    }
  }
  function a(e, t) {
    if (e.indexOf(4) === -1) {
      new (require("./live-events/DataDomeAsyncChallengesTracking"))(t).process();
    }
  }
  function s(e, t) {
    if (e.enableServiceWorkerPlugin) {
      new (require("./services/DataDomeServiceWorker"))(e, t, {
        dataDomeResponse: new (require("./http/DataDomeResponse"))(e, jsData)
      }).initListener();
    }
  }
  function f(n, e, t) {
    var r = this;
    function i() {
      try {
        n.apply(r, e);
      } catch (n) {}
    }
    if (t && t.useIdleCallback && typeof window.requestIdleCallback == "function") {
      requestIdleCallback(i, {
        timeout: 2000
      });
    } else {
      setTimeout(i, 0);
    }
  }
  if (!window.dataDomeProcessed && (window.dataDomeProcessed = true, 1)) {
    (function () {
      try {
        if (window.sessionStorage) {
          var n = sessionStorage.getItem("ddOriginalReferrer");
          if (n) {
            Object.defineProperty(document, "referrer", {
              configurable: true,
              get: function () {
                return n;
              }
            });
            sessionStorage.removeItem("ddOriginalReferrer");
          }
        }
      } catch (n) {}
    })();
    window.dataDomeOptions = new (require("./common/DataDomeOptions"))();
    window.ddShouldSkipFingerPrintReq = false;
    window.dataDomeOptions.check(window.ddoptions);
    var u = function (n) {
      if (Array.isArray(n)) {
        return n;
      } else {
        return [];
      }
    }(window.dataDomeOptions.dryRun);
    var h = new r(u);
    (function (n) {
      if (Math.random() <= 0.05) {
        var e;
        var t;
        try {
          var r = window.ddoptions;
          e = r ? JSON.stringify(r) : "";
        } catch (n) {
          e = "error";
        }
        n.i("opts", e);
        try {
          var i = window.ddCaptchaOptions;
          t = i ? JSON.stringify(i) : "";
        } catch (n) {
          t = "error";
        }
        n.i("xhr_opts", t);
      }
    })(h);
    (function (e, t) {
      if (e.indexOf(2) === -1 && (window.dataDomeOptions.ajaxListenerPath != null || !!window.dataDomeOptions.isSalesforce)) {
        new (require("./services/DataDomeApiClient"))(t).processAsyncRequests(window.dataDomeOptions.ajaxListenerPath, window.dataDomeOptions.ajaxListenerPathExclusion, window.dataDomeOptions.abortAsyncOnChallengeDisplay, !window.dataDomeOptions.exposeCaptchaFunction, window.dataDomeOptions.isSalesforce);
      }
    })(u, h);
    (function () {
      if (window.ddSbh) {
        var n = e.getCookie("datadome", document.cookie);
        if (n != null && e.isLocalStorageEnabled()) {
          window.localStorage.setItem(window.dataDomeOptions.ddCookieSessionName, n);
        }
      }
    })();
    f(function () {
      function n() {
        f(a, [u, h], {
          useIdleCallback: true
        });
        f(s, [window.dataDomeOptions, window.ddjskey], {
          useIdleCallback: true
        });
        f(c, [u, h], {
          useIdleCallback: true
        });
        f(o, [u, h], {
          useIdleCallback: true
        });
        f(t, [h], {
          useIdleCallback: true
        });
        if (window.dataDomeOptions.enableTagEvents) {
          e.dispatchEvent(e.eventNames.ready);
        }
      }
      if (window.dataDomeOptions.deferSignals && document.readyState !== "complete") {
        window.addEventListener("load", n);
      } else {
        n();
      }
    });
  }
})();