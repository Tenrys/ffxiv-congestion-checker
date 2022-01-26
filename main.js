const { app, dialog } = require("electron");
const puppeteer = require("puppeteer");

app.whenReady().then(async () => {
  const browser = await puppeteer.launch({ headless: true, devtools: false });
  const page = await browser.newPage();
  // await page.setViewport({ width: 1280, height: 720 });
  await page.goto("https://na.finalfantasyxiv.com/lodestone/worldstatus/");

  let interval;
  const check = async () => {
    const worlds = await page.evaluate(async () => {
      const worlds = document.querySelectorAll(".world-list__item");

      return Object.fromEntries(
        [].map
          .call(worlds, world => {
            const name = world
              .querySelector(".world-list__world_name p")
              ?.textContent?.toLowerCase();
            const category = world
              .querySelector(".world-list__world_category p")
              ?.textContent?.toLowerCase();
            if (!name || !category) return [];
            return [name, category];
          })
          .filter(x => x?.length)
      );
    });

    console.log(`[${new Date().toISOString()}] Balmung is ${worlds.balmung}`);

    if (worlds.balmung != "congested") {
      clearInterval(interval);

      await dialog.showMessageBox({
        title: "OH SHIT",
        message: `BALMUNG IS ${worlds.balmung.toUpperCase()}!`,
      });

      await browser.close();
      await app.quit();
    }
  };

  await check();
  interval = setInterval(async () => {
    await page.reload({ waitUntil: ["networkidle0"] });
    await check();
  }, 1000 * 60 * 5);
});
