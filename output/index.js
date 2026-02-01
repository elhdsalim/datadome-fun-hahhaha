var DetectionWrapper = require("./DetectionWrapper");
var DataDomeTools = require("./common/DataDomeTools");


(function () {
  var tools = new DataDomeTools();

  function exposeCaptchaFunction(wrapper) {
    if (window.dataDomeOptions.exposeCaptchaFunction === true) {
      var displayFn = new (require("./http/DataDomeResponse"))(wrapper).displayResponsePagePublic;
      window.displayDataDomeCaptchaPage = displayFn;
      window.displayDataDomeResponsePage = displayFn;
    }
  }

  function processSyncRequest(dryRun, wrapper) {
    if (dryRun.indexOf(1) === -1) {
      new (require("./services/DataDomeApiClient"))(wrapper).processSyncRequest();
    }
  }

  function processEventsTracking(dryRun, wrapper) {
    if (dryRun.indexOf(3) === -1 && window.dataDomeOptions.eventsTrackingEnabled) {
      new (0, require("./live-events/DataDomeEventsTracking").DataDomeEventsTracking)(wrapper, false).process();
    }
  }

  function processAsyncChallenges(dryRun, wrapper) {
    if (dryRun.indexOf(4) === -1) {
      new (require("./live-events/DataDomeAsyncChallengesTracking"))(wrapper).process();
    }
  }

  function initServiceWorker(options, jsKey) {
    if (options.enableServiceWorkerPlugin) {
      new (require("./services/DataDomeServiceWorker"))(options, jsKey, {
        dataDomeResponse: new (require("./http/DataDomeResponse"))(options, jsData)
      }).initListener();
    }
  }

  // run a function asynchronously via requestIdleCallback (if available) or setTimeout
  function runDeferred(fn, args, options) {
    var context = this;
    function execute() {
      try {
        fn.apply(context, args);
      } catch (e) { }
    }
    if (options && options.useIdleCallback && typeof window.requestIdleCallback == "function") {
      requestIdleCallback(execute, {
        timeout: 2000
      });
    } else {
      setTimeout(execute, 0);
    }
  }

  // only run once per page
  if (!window.dataDomeProcessed && (window.dataDomeProcessed = true, 1)) {

    // restore original referrer after a challenge redirect
    (function () {
      try {
        if (window.sessionStorage) {
          var originalReferrer = sessionStorage.getItem("ddOriginalReferrer");
          if (originalReferrer) {
            Object.defineProperty(document, "referrer", {
              configurable: true,
              get: function () {
                return originalReferrer;
              }
            });
            sessionStorage.removeItem("ddOriginalReferrer");
          }
        }
      } catch (e) { }
    })();

    // initialize config
    window.dataDomeOptions = new (require("./common/DataDomeOptions"))();
    window.ddShouldSkipFingerPrintReq = false;
    window.dataDomeOptions.check(window.ddoptions);

    // dryRun: array of module IDs to skip (1=sync, 2=async, 3=events, 4=challenges)
    var dryRun = function (val) {
      if (Array.isArray(val)) {
        return val;
      } else {
        return [];
      }
    }(window.dataDomeOptions.dryRun);

    var wrapper = new DetectionWrapper(dryRun);

    // 5% telemetry: send site's ddoptions and ddCaptchaOptions to DataDome
    (function (wrapper) {
      if (Math.random() <= 0.05) {
        var ddOptionsStr;
        var captchaOptionsStr;
        try {
          var opts = window.ddoptions;
          ddOptionsStr = opts ? JSON.stringify(opts) : "";
        } catch (e) {
          ddOptionsStr = "error";
        }
        wrapper.i("opts", ddOptionsStr);
        try {
          var captchaOpts = window.ddCaptchaOptions;
          captchaOptionsStr = captchaOpts ? JSON.stringify(captchaOpts) : "";
        } catch (e) {
          captchaOptionsStr = "error";
        }
        wrapper.i("xhr_opts", captchaOptionsStr);
      }
    })(wrapper);

    // intercept XHR/fetch if ajaxListenerPath is configured
    (function (dryRun, wrapper) {
      if (dryRun.indexOf(2) === -1 && (window.dataDomeOptions.ajaxListenerPath != null || !!window.dataDomeOptions.isSalesforce)) {
        new (require("./services/DataDomeApiClient"))(wrapper).processAsyncRequests(window.dataDomeOptions.ajaxListenerPath, window.dataDomeOptions.ajaxListenerPathExclusion, window.dataDomeOptions.abortAsyncOnChallengeDisplay, !window.dataDomeOptions.exposeCaptchaFunction, window.dataDomeOptions.isSalesforce);
      }
    })(dryRun, wrapper);

    // if sessionByHeader mode, copy cookie to localStorage
    (function () {
      if (window.ddSbh) {
        var cookieValue = tools.getCookie("datadome", document.cookie);
        if (cookieValue != null && tools.isLocalStorageEnabled()) {
          window.localStorage.setItem(window.dataDomeOptions.ddCookieSessionName, cookieValue);
        }
      }
    })();

    // launch all modules (deferred)
    runDeferred(function () {
      function launchModules() {
        runDeferred(processAsyncChallenges, [dryRun, wrapper], {
          useIdleCallback: true
        });
        runDeferred(initServiceWorker, [window.dataDomeOptions, window.ddjskey], {
          useIdleCallback: true
        });
        runDeferred(processSyncRequest, [dryRun, wrapper], {
          useIdleCallback: true
        });
        runDeferred(processEventsTracking, [dryRun, wrapper], {
          useIdleCallback: true
        });
        runDeferred(exposeCaptchaFunction, [wrapper], {
          useIdleCallback: true
        });
        if (window.dataDomeOptions.enableTagEvents) {
          tools.dispatchEvent(tools.eventNames.ready);
        }
      }
      if (window.dataDomeOptions.deferSignals && document.readyState !== "complete") {
        window.addEventListener("load", launchModules);
      } else {
        launchModules();
      }
    });
  }
})();
