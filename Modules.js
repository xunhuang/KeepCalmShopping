
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

function whichModule(url) {
    if (url.startsWith("https://sameday.costco.com/store/checkout")) {
        return Module.Costco;
    }
    if (url.startsWith("https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html")) {
        return Module.AmazonWholeFoods;
    }
    return null;
}

class ModuleType {
    constructor() {
        this.FoundState = false;
    }
    name() { throw "no implemented" }
    monitorSetting() { throw "no implemented" }
    // FoundState() { throw "no implemented" }
    async proccesor() { throw "no implemented" }
    availableSlots() { throw "no implemented" }
    prettyMessageFromSlots() { throw "no implemented" }
};
class AmazonWholeFoods extends ModuleType {

    name() { return "AmazonWholeFoods" }
    monitorSetting() { return "monitorAmazonWholeFoods" }

    async proccesor() {
        let result;
        console.log('Checking Whole Foods');
        let url = "https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html";
        result = await getServerResults(url);
        return result;
    }
    availableSlots(data) {
        let result = [];
        const $ = cheerio.load(data);
        let days = $("div.ufss-slotselect");
        days.map(s => {
            let day = days[s];
            let daystr = day.attribs.id;
            let slots = [];
            let slots1 = cheerio(day, ".ufss-available");
            slots1.map(s => slots.push(slots1[s]));
            let slots2 = cheerio(day, "ul.ufss-slot-list li.ufss-slot-container");
            slots2.map(s => slots.push(slots2[s]));

            for (let slot of slots) {
                let html = cheerio(slot).text();
                html = html.replace(/  +/g, ' ')
                    .replace(/^\s*$(?:\r\n?|\n)/gm, "");
                if (!html.toLocaleLowerCase().includes("not available")
                    && !html.toLocaleLowerCase().includes("no delivery")) {
                    result.push(daystr + html);
                }
            }
            result = [...new Set(result)];
        })
        return result;
    }
    prettyMessageFromSlots(slots) {

        return slots.join(",");
    }

}

class Costco extends ModuleType {
    name() { return "Costco" }
    monitorSetting() { return "monitorCostco" }
    async proccesor() {
        let result;
        console.log('Checking costco');
        let CostcoDeliveryURL = await getOptionFromStorage("CostcoDeliveryURL");
        result = await getServerResults(CostcoDeliveryURL);
        return result;

    }
    availableSlots(data) {
        let result = [];
        try {
            let r = JSON.parse(data);
            let days = r.service_options.days;
            for (let day of days) {
                if (day.message === null) {
                    result.push(day);
                    continue;
                }
                let flatmessage = day.message.map(msgarray => {
                    return msgarray.strings.map(msg => msg.value).join();
                }).join();
                if (!flatmessage.toLowerCase().includes("sorry")) {
                    result.push(day);
                }
            }
        } catch (e) {
            console.log(e);
            return [];
        }
        return result;
    }
    prettyMessageFromSlots(slots) {
        return slots.map(d => d.date).join(", ");
    }
}

const Module = {
    Costco: new Costco(),
    AmazonWholeFoods: new AmazonWholeFoods(),
}