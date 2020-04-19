console.log("Background Page started");

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    if (details.url.includes("delivery_options")) {
      chrome.storage.sync.set({
        CostcoDeliveryURL: details.url
      });
    }
    return {
      requestHeaders: details.requestHeaders
    };
  },
  {
    urls: [
      "*://*.amazon.com/*",
      "*://*.costco.com/*",
    ]
  },
  ["requestHeaders"]
);

async function sendNotification(message) {
  let phone = await getOptionFromStorage("userPhone");
  const url = "https://us-central1-covid-19-live.cloudfunctions.net/datajsonNew?";
  const response = await self.fetch(url + new URLSearchParams({
    msg: message,
    number: phone,
  }));
  const text = await response.text(); // there's response.json() as well
  console.log(text);
}
chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    let module = Module[request.module];
    if (module) {
      // console.log(module);
      if (request.command == "monitor") {
        let monitorSetting = await getOptionFromStorage(module.monitorSetting());
        if (!monitorSetting) {
          console.log(`Monitor ${module.name()} is off.`)
          return;
        }
        let found = false;
        let availdays = module.availableSlots(request.content);
        if (availdays.length > 0) {
          console.log("available!");
          console.log(availdays);
          found = true;
        } else {
          console.log("Not available, be patient");
          found = false
        }
        if (found !== module.FoundState) {
          if (found) {
            let dates = module.prettyMessageFromSlots(availdays);
            sendNotification(`Check ${module.name()} ${availdays.length} slots. ` + dates);
          } else {
            sendNotification(`${module.name()} slots are gone!`);
          }
          module.FoundState = found;
        }
      } else if (request.command == "reset") {
        let monitorSetting = await getOptionFromStorage(module.monitorSetting());
        if (monitorSetting) {
          console.log(`${module.name()} monitoring has started!`);
          sendNotification(`${module.name()} monitoring has started.`);
        } else {
          console.log(`${module.name()} monitoring turned off!`);
          sendNotification(`${module.name()} monitoring is turned off.`);
        }
        module.FoundState = false;
      }
    }
  });
