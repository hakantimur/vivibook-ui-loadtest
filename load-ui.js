const { chromium } = require("playwright");

function uniqueEmail(i) {
  return `loadtest_${Date.now()}_${i}@testmail.com`;
}

function uniquePrompt(i) {
  const topics = [
    "an emotional love story set in Paris where two strangers from different cultures meet and change each other’s lives forever",
"a dark mystery novel taking place in ancient Rome involving political conspiracies, secret societies, and a forbidden romance",
"an intense adventure story about a group of explorers surviving dangers in the Amazon jungle while searching for a lost civilization",
"a fantasy epic in a magical kingdom ruled by dragons where a young hero discovers their hidden powers",
"a historical drama set in the Ottoman Empire focusing on palace intrigues, forbidden love, and power struggles",
"a romantic story by the sea about childhood friends reuniting after many years and facing their past secrets",
"a science fiction novel about a space exploration mission that discovers a new habitable planet with intelligent life",
"a thrilling time travel story where a modern teenager is sent back to the medieval era and must survive as a knight",
"a detective novel set in New York where a private investigator uncovers a complex criminal network",
"a magical school story about young students learning powerful spells while uncovering a dark secret beneath the academy",
"a survival story about a family stranded on a remote island after a plane crash and their fight to stay alive",
"a political thriller set in a futuristic city where technology controls society and a rebel group rises",
"a heartfelt coming-of-age story about a small-town teenager chasing dreams in a big city",
"a horror novel set in an abandoned hospital where strange supernatural events begin to occur",
"a mythological adventure inspired by ancient Greek legends involving gods, heroes, and monsters",
"a romantic comedy about two rivals forced to work together and slowly falling in love",
"a post-apocalyptic story where humanity struggles to rebuild after a global disaster",
"a psychological thriller about a writer who starts living the events of their own novel",
"a historical adventure following a pirate crew searching for a legendary hidden treasure",
"a fantasy romance about a human falling in love with a magical creature from another realm",
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  return `${randomTopic} - user ${i} - ${Date.now()}`;
}

async function runOneUser(i) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const log = (m) => console.log(`[user ${i}] ${m}`);

  try {
    log("home");
    await page.goto("https://dev.vivibook.ai/tr", { waitUntil: "domcontentloaded" });

    log("open register");
    await page.getByRole("link", { name: "Kayıt Ol" }).click();

    const email = uniqueEmail(i);
    log(`fill register: ${email}`);
    await page.getByTestId("register-first-name").fill("test");
    await page.getByTestId("register-last-name").fill("hakan");
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-password").fill("Ht**41324132");

    log("submit register");
    await page.getByTestId("register-submit").click();

    // Register başarılıysa terms gelmeli
    log("wait terms");
    await page.getByTestId("profile-terms-checkbox").waitFor({ timeout: 60000 });

    log("accept terms");
    await page.getByTestId("profile-terms-checkbox").check();
    await page.getByTestId("profile-submit").click();

    // Profile başarılıysa prompt gelmeli
    log("wait prompt");
    await page.getByTestId("prompt-input").waitFor({ timeout: 60000 });

    log("fill prompt");
    await page.getByTestId("prompt-input").fill(uniquePrompt(i));

    log("set language/type/category");
    await page.getByTestId("language-button").click();
    await page.getByTestId("language-option-en").click();
    await page.getByTestId("category-option-c3c5df6a-dd4a-4d15-9795-62005ac4ffd6").click();

    log("generate");
    await page.getByTestId("generate-button").click();

    // generate sayfasına yönlendirmeyi bekle (sabit ID yok)
    log("wait generate page");
    await page.waitForURL(/\/tr\/generate(\?|$)/, { timeout: 180000 });
    log(`generate url: ${page.url()}`);
    
    log("done");
  } catch (err) {
    console.error(`\n[user ${i}] FAILED: ${err.message}\n`);
    try {
      console.error(`[user ${i}] url: ${page.url()}`);
    } catch (_) {}
  } finally {
    await browser.close();
  }
}

async function main() {
  const USERS = 3;
  console.log(`Starting ${USERS} parallel users...`);

  const start = Date.now();

  // 3 kullanıcıyı aynı anda başlatıyoruz
const tasks = [];

for (let i = 0; i < USERS; i++) {
  // Her kullanıcı 5 saniye arayla başlasın
  await new Promise((resolve) => setTimeout(resolve, 5000));

  tasks.push(runOneUser(i));
}

await Promise.all(tasks);

  console.log(`Finished in ${(Date.now() - start) / 1000}s`);
}

main();





