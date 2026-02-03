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

// ===== PHASE 1: register + terms + prompt'a kadar =====
async function phase1_registerToPrompt(i) {
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
    await page.getByTestId("register-first-name").fill("hakan");
    await page.getByTestId("register-last-name").fill("timur");
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

    // ✅ Phase 1 bitti: tarayıcıyı KAPATMIYORUZ, phase 2 için döndürüyoruz
    return { ok: true, i, browser, context, page, log };
  } catch (err) {
    console.error(`\n[user ${i}] FAILED (phase1): ${err.message}\n`);
    try {
      console.error(`[user ${i}] url: ${page.url()}`);
    } catch (_) {}

    // Phase1 fail olduysa browser'ı kapat
    await browser.close();
    return { ok: false, i };
  }
}

// ===== PHASE 2: prompt doldur + generate =====
async function phase2_generate(session) {
  const { i, page, log } = session;

  try {
    log("fill prompt");
    await page.getByTestId("prompt-input").fill(uniquePrompt(i));

    log("generate");
    await page.getByTestId("generate-button").click();

    // generate sayfasına yönlendirmeyi bekle (sabit ID yok)
    log("wait generate page");
    await page.waitForURL(/\/tr\/generate(\?|$)/, { timeout: 180000 });
    log(`generate url: ${page.url()}`);

    log("done");
    return { ok: true };
  } catch (err) {
    console.error(`\n[user ${i}] FAILED (phase2): ${err.message}\n`);
    try {
      console.error(`[user ${i}] url: ${page.url()}`);
    } catch (_) {}
    return { ok: false };
  }
}

async function main() {
  const USERS = 10;
  console.log(`Starting ${USERS} users...`);

  const start = Date.now();

  // ===== PHASE 1: Önce tüm user'lar oluşsun =====
  console.log("PHASE 1: register -> terms -> prompt");

  const phase1Tasks = [];
  for (let i = 0; i < USERS; i++) {
    // Her kullanıcı 1 saniye arayla başlasın (senin mevcut davranışın)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    phase1Tasks.push(phase1_registerToPrompt(i));
  }

  const sessions = await Promise.all(phase1Tasks);
  const okSessions = sessions.filter((s) => s && s.ok);

  console.log(`PHASE 1 DONE. OK=${okSessions.length}/${USERS}`);

  // Eğer hiç kullanıcı oluşmadıysa bitir
  if (okSessions.length === 0) {
    console.log("No users reached prompt. Stopping.");
    return;
  }

  // ===== PHASE 2: Sonra kitap istekleri gönderilsin =====
  console.log("PHASE 2: prompt -> generate");

  const phase2Results = await Promise.all(okSessions.map((s) => phase2_generate(s)));
  const okCount = phase2Results.filter((r) => r.ok).length;

  console.log(`PHASE 2 DONE. OK=${okCount}/${okSessions.length}`);

  // ===== cleanup =====
  for (const s of okSessions) {
    try {
      await s.browser.close();
    } catch (_) {}
  }

  console.log(`Finished in ${(Date.now() - start) / 1000}s`);
}

main();





