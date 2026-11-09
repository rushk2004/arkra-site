import { shell, toast } from "./ui.js";
import { page } from "./state.js";
import { overview, aboutPage, methodologyPage } from "./pages/public.js";
import { dashboard } from "./pages/home.js";
import { guidedCheck } from "./pages/check.js";
import { planPage } from "./pages/plan.js";
import { passportPage } from "./pages/passport.js";
import { communityPage } from "./pages/community.js";
import { lenderPage } from "./pages/lender.js";
shell();
try {
  (
    ({
      overview,
      home: dashboard,
      check: guidedCheck,
      plan: planPage,
      passport: passportPage,
      community: communityPage,
      lender: lenderPage,
      "how-it-works": methodologyPage,
      about: aboutPage,
    })[page] || overview
  )(document.querySelector("main"));
} catch (error) {
  console.error(error);
  document.querySelector("main").innerHTML =
    '<section class="card"><h1>Your page could not load.</h1><p>Reload this page to try again. Your demo data stays in this browser.</p></section>';
}
