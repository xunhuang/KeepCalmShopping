
async function getOptionFromStorage(storage_key) {
  const data = await new Promise(resolve => {
    chrome.storage.sync.get(storage_key, function (result) {
      resolve(result);
    });
  });
  return data[storage_key];
}

async function getServerResults(url) {
  const response = await self.fetch(url);
  return await response.text(); // there's response.json() as well
}

let WaitSeconds = 5;

const Module = {
  Costco: {
    name: 'Costco',
    proccesor: processCostco,
    monitorSetting: "monitorCostco",
  }
}

async function processCostco() {
  let result;
  console.log('Checking costco');
  let CostcoDeliveryURL = await getOptionFromStorage("CostcoDeliveryURL");
  result = await getServerResults(CostcoDeliveryURL);
  return result;
}

function whichModule(url) {
  if (url.startsWith("https://sameday.costco.com/store/checkout")) {
    return Module.Costco;
  }
  return null;
}

(async function () {
  console.log("content.js -- started " + window.location.href)
  let timeout = 1000 * WaitSeconds; // turn into a config later
  let module = whichModule(window.location.href);
  window.setInterval(async function () {
    if (module) {
      let monitorSetting = await getOptionFromStorage(module.monitorSetting);
      if (monitorSetting) {
        let result = await module.proccesor();
        if (result) {
          chrome.runtime.sendMessage({
            module: module.name,
            command: "monitor",
            content: result,
          });
        }
      }
    }
  }, timeout);
})();