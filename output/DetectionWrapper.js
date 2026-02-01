var DataDomeTools = require("./common/DataDomeTools");
module.exports = function (dryRun) {
  var detectionModule;
  var detectionResult;
  var detectionApi;
  var isLoading = true;

  // load detection module (deferred)
  setTimeout(function () {
    detectionModule = require("detection-js/dist/jstag");
  });

  // initialize detection module (deferred, runs after load)
  setTimeout(function () {
    var options = {};
    if (dryRun && Array.isArray(dryRun) && dryRun.indexOf(5) > -1) {
      options.dww = true; // disable web worker
    }
    detectionResult = detectionModule(options);
    detectionApi = detectionResult[2];
    isLoading = false;
  });

  // add a key/value pair to the fingerprint data
  this.i = function (key, value) {
    function send() {
      try {
        (0, detectionApi[1])(key, value);
      } catch (e) { }
    }
    if (isLoading) {
      setTimeout(send);
    } else {
      send();
    }
  };

  // retrieve detection data
  this.o = function (arg) {
    return (0, detectionApi[2])(arg);
  };

  // start detection: run fingerprinting, then dispatch event when done
  this.u = function () {
    window.addEventListener("datadome-det-d", function () {
      (0, detectionResult[1])();
      setTimeout(function () {
        new DataDomeTools().dispatchEvent("datadome-jstag-ch");
      });
    }, {
      capture: true,
      once: true
    });
    (0, detectionResult[0])();
  };
};
