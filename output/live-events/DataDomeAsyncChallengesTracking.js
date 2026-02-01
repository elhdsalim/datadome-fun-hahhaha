var DataDomeRequest = require("./../http/DataDomeRequest");
var DataDomeTools = require("./../common/DataDomeTools");
module.exports = function (wrapper) {
  var request = new DataDomeRequest("ac");
  var tools = new DataDomeTools();
  var hasSent = false;

  // listen for async detection completion, then send fingerprint data once
  this.process = function () {
    tools.addEventListener(window, "datadome-det-a", function () {
      if (window.dataDomeOptions && !hasSent) {
        hasSent = true;
        request.requestApi(window.ddjskey, wrapper, [], window.dataDomeOptions.patternToRemoveFromReferrerUrl, true, window.dataDomeOptions.ddResponsePage);
      }
    });
  };
};
