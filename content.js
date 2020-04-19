let WaitSeconds = 5;
(async function () {
  console.log("content.js -- started " + window.location.href)
  let timeout = 1000 * WaitSeconds; // turn into a config later
  let module = whichModule(window.location.href);
  window.setInterval(async function () {
    if (module) {
      let monitorSetting = await getOptionFromStorage(module.monitorSetting());
      if (monitorSetting) {
        let result = await module.proccesor();
        if (result) {
          chrome.runtime.sendMessage({
            module: module.name(),
            command: "monitor",
            content: result,
          });
        }
      }
    }
  }, timeout);
})();