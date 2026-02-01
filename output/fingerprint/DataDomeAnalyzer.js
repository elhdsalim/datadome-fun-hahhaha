var DataDomeTools = require("../common/DataDomeTools");
var DataDomeEventsTracking = require("../live-events/DataDomeEventsTracking").DataDomeEventsTracking;
module.exports = function (wrapper) {
  var tools = new DataDomeTools();

  // run a function asynchronously with try/catch
  function runDeferred(fn, ctx, delay) {
    var self = this;
    setTimeout(function () {
      try {
        fn.call(self, ctx);
      } catch (err) {}
    }, delay);
  }

  // check if a DataDome session exists in localStorage (signal: exp8)
  function checkLocalStorageSession() {
    var result = 0;
    if (tools.isLocalStorageEnabled() && window.localStorage.getItem(window.dataDomeOptions.ddCookieSessionName) != null && window.dataDomeOptions.sessionByHeader !== true) {
      result = 1;
    }
    wrapper.i("exp8", result);
  }

  // count and clean duplicate datadome cookies (signal: nddc)
  function cleanDuplicateCookies() {
    var cookieCount;
    try {
      if ((cookieCount = (document.cookie.match(/datadome=/g) || []).length) > 1 && window.ddjskey === "499AE34129FA4E4FABC31582C3075D") {
        tools.deleteAllDDCookies();
      }
      if (["8FE0CF7F8AB30EC588599D8046ED0E", "87F03788E785FF301D90BB197E5803", "765F4FCDDF6BEDC11EC6F933C2BBAF", "00D958EEDB6E382CCCF60351ADCBC5", "E425597ED9CAB7918B35EB23FEDF90", "E425597ED9CAB7918B35EB23FEDF90"].indexOf(window.ddjskey) === -1 && cookieCount === 2 && window.location.href.indexOf("www.") > -1) {
        document.cookie = "datadome=1; Max-Age=0; Path=/;";
      }
    } catch (err) {
      cookieCount = "err";
    }
    wrapper.i("nddc", cookieCount);
  }

  // client-specific: observe DOM for auth form, collect events on submit (key: E6EAF460...)
  function trackAuthForm() {
    var eventsTracker = new DataDomeEventsTracking(wrapper, true);
    function onFormMutation(mutations, observer) {
      try {
        for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          var submitButton = mutation.target.querySelector("button[type=\"submit\"]");
          if (mutation.type === "childList" && submitButton) {
            submitButton.addEventListener("click", function (event) {
              eventsTracker.collect();
            });
            observer.disconnect();
            break;
          }
        }
      } catch (err) {}
    }
    new MutationObserver(function (mutations, observer) {
      try {
        for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          var authOverlay = mutation.target.querySelector("[data-testid=auth-modal--overlay]");
          var authContainer = mutation.target.querySelector(".auth__container");
          var authElement = authOverlay || authContainer;
          if (mutation.type === "childList" && authElement) {
            eventsTracker.process();
            new MutationObserver(onFormMutation).observe(authElement, {
              childList: true,
              subtree: true
            });
            observer.disconnect();
            break;
          }
        }
      } catch (err) {}
    }).observe(document.querySelector("body"), {
      childList: true
    });
  }

  // client-specific: send correlation_id cookie (key: 2211F522...)
  function sendCorrelationId() {
    wrapper.i("uid", tools.getCookie("correlation_id"));
  }

  // client-specific: detect refund button in DOM (signal: rhbe, key: 2D56F91C...)
  function detectRefundButton() {
    var refundSelector = "input#btnSDel[value='  Refund in Square & Delete  ']";
    var svgPathSelector = "path#path3010[inkscape\\:connector-curvature='0'][d^='M45.333,0.901H9.868C4.992']";
    var base64ButtonSelector = "button[style*=\"background-image: url(\"][style*=\"PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4\"]";
    function checkElement() {
      try {
        var element = document.querySelector(refundSelector) || document.querySelector(svgPathSelector) || document.querySelector(base64ButtonSelector);
        if (element) {
          wrapper.i("rhbe", true);
        }
        return element;
      } catch (err) {}
    }
    if (!checkElement()) {
      var pollInterval = setInterval(function () {
        if (checkElement()) {
          clearInterval(pollInterval);
        }
      }, 50);
    }
  }

  // client-specific: detect patched forms or appAjaxCall event (signal: nhbe, key: 2D56F91C...)
  function detectPatchedForms() {
    function reportAndCleanup(value) {
      try {
        wrapper.i("nhbe", value);
        cleanup();
      } catch (err) {}
    }
    function cleanup() {
      try {
        document.documentElement.removeEventListener("appAjaxCall", onAjaxCall);
        clearInterval(pollInterval);
      } catch (err) {}
    }
    function onAjaxCall() {
      reportAndCleanup(2);
    }
    function hasPatchedForms() {
      try {
        for (var forms = document.querySelectorAll("form"), i = 0; i < forms.length; i++) {
          if (forms[i].getAttribute("patched") === "true") {
            return true;
          }
        }
        return false;
      } catch (err) {}
    }
    document.documentElement.addEventListener("appAjaxCall", onAjaxCall);
    if (hasPatchedForms()) {
      return reportAndCleanup(1);
    }
    var pollInterval = setInterval(function () {
      if (hasPatchedForms()) {
        reportAndCleanup(1);
      }
    }, 100);
    setTimeout(function () {
      cleanup();
    }, 60000);
  }

  // client-specific: detect browser extension via HEAD request (signal: obe, key: 2D56F91C...)
  function detectBrowserExtension() {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", "chrome-extension://oojibhnkahnabembdeoicblilpbfmnhg/icon.0024de64.png");
    xhr.onload = function () {
      try {
        if (xhr.status === 200) {
          wrapper.i("obe", true);
        }
      } catch (err) {}
    };
    xhr.send();
  }

  this.process = function () {
    runDeferred(function () {
      wrapper.u();
    });
    runDeferred(cleanDuplicateCookies);
    runDeferred(checkLocalStorageSession);
    if (window.ddjskey === "2211F522B61E269B869FA6EAFFB5E1") {
      runDeferred(sendCorrelationId);
    }
    if (window.ddjskey == "E6EAF460AA2A8322D66B42C85B62F9") {
      runDeferred(trackAuthForm);
    }
    if (window.ddjskey == "2D56F91C2AD1A8EB7C6A5CA65F5567") {
      runDeferred(detectRefundButton);
      runDeferred(detectPatchedForms);
      runDeferred(detectBrowserExtension);
    }
  };
};
