# Lens Master — Real UAT Checklist

Give this to **someone who has never seen the site**. Do not explain anything, do not sit next to them
answering questions. Give them a phone, the site link, and one sentence of context:

> "You need new glasses with your prescription. Buy a pair."

Then shut up and watch. Every time they ask you a question, that's a bug — write it down.

**Setup**
- Device: their own phone (most traffic is mobile), then repeat on a laptop.
- Fresh browser / incognito so there's no saved cart.
- Payment: Razorpay is on **test keys** — use test card `4111 1111 1111 1111`, any future expiry, CVV `123`, OTP `1234`. No real money moves.
- Record the screen if they'll allow it. Ask them to think out loud.

**How to score each item:** ✅ did it alone · ⚠️ did it but hesitated/backtracked · ❌ needed help or gave up.
Note the **time** and the **exact words** they say. Words matter more than scores.

---

## 1. First impression (30 seconds, don't let them scroll far)
- [ ] Can they say what this shop sells, in their own words?
- [ ] Do they think it's a real shop or a template? (trust check)
- [ ] Do they know it's a Jaipur store with a physical address?
- [ ] Anything they try to tap that isn't tappable?

## 2. Finding glasses without help
- [ ] Ask: "Find a pair of computer glasses." Time it. Which path did they take — menu, search, or scrolling?
- [ ] Ask: "Now find sunglasses." Did they use the nav (Frames / Sunglasses / Contact Lenses / Blue Light)?
- [ ] Do they understand the difference between "Frames" and "Blue Light"?
- [ ] Do they scroll past the homepage hero, or stall at the top?

## 3. Is search obvious?
- [ ] Without prompting, do they ever find search? (it's an **icon only** in the header — watch for this)
- [ ] Ask them to search "chashma", "specs", "power glasses", "raybaan" (misspelled). Do they get sensible results?
- [ ] Search a brand we don't stock. Is the empty state helpful or a dead end?
- [ ] Do search results give enough info (photo, name, price) to pick one?

## 4. Do the filters make sense?
- [ ] On /shop, do they notice the **Filters** control at all on mobile?
- [ ] Ask them to find "only frames under ₹1,000". Can they?
- [ ] Do the filter labels match words they'd use themselves?
- [ ] After filtering, is it clear **what's currently applied** and how to clear it?
- [ ] Do they understand the sort control ("Featured")?

## 5. Product page clarity
- [ ] Is the price obviously the **frame-only** price, or do they assume lenses are included?
- [ ] Do they understand "In stock" / "Out of stock"? **Note: 5 of the 9 live products are currently out of stock** — ask how that makes them feel about the shop.
- [ ] Can they tell what the frame is made of and whether it suits them?
- [ ] Do they look for size / face-shape info and not find it?
- [ ] Do they trust "No reviews yet", or does it put them off?

## 6. Prescription entry (the highest-risk step)
- [ ] Do they understand **Step 1: With Power vs Zero Power**? Ask them to explain it back.
- [ ] Do they know what SPH / CYL / AXIS / ADD / PD mean? (Most people won't — the question is whether they can still proceed.)
- [ ] Can they type a real prescription into the table on a phone without mis-tapping?
- [ ] Do they find the **photo upload** and prefer it to typing?
- [ ] Do they notice the "no prescription handy — we'll WhatsApp you" line, and does it reassure them?
- [ ] Do they know what to do if they only have one eye's power, or a doctor's slip in a different format?
- [ ] Does anyone abandon here? That's the number to watch.

## 7. Lens options
- [ ] Do they understand what "Blue Cut Lens" actually does?
- [ ] Can they tell which lens is **included in the price** vs an **extra charge**?
- [ ] Do they understand the **buy-2-for-₹1,200** blue cut offer, and how to trigger it?
- [ ] If they enter a high power (±4.00 or more), do they understand the **₹400 surcharge** and why?
- [ ] Do they see the running total change as they choose, or is it a surprise later?
- [ ] Can they go **Back** and change a choice without losing what they typed?

## 8. Is the final price clear?
- [ ] Before checkout, ask them to state the total from memory. Are they right?
- [ ] Do they expect the **₹99 delivery** or is it a surprise?
- [ ] Does the cart show frame + lens + surcharge as separate lines they can understand?
- [ ] Can they change quantity or remove an item without confusion?
- [ ] Does the banner promise ("pay for the higher-priced item, get the other free") match what the cart actually charges? If not, that's a trust-killer — log it loudly.

## 9. Checkout
- [ ] Can they complete name / mobile / address with no help?
- [ ] Does the **PIN code auto-fill city and state**? Do they notice?
- [ ] Are validation errors (bad mobile, bad PIN) understandable and easy to fix?
- [ ] Do they feel safe paying? Ask directly: "Would you enter your real card here?"
- [ ] Complete the test payment. Time from "Pay" to confirmation.
- [ ] Does the confirmation clearly say **what happens next** (when it ships, who calls them about the prescription)?
- [ ] Can they find their order again later via **Order Status** using the order number?

## 10. Does the order land correctly?
Checked by you, not the tester — immediately after their test order.
- [ ] Order appears in **Shopify admin** with the right customer, address, items and total.
- [ ] Line items show the lens choice; prescription is present as a **reference** (raw Rx values stay in our database by design).
- [ ] Amount in Shopify == amount charged by Razorpay == amount shown at checkout. All three must match to the rupee.
- [ ] Order appears in **/admin/orders** in our panel.

## 11. Does the admin understand the order?
Give this to whoever will actually pack the order — ideally your optician, not you.
- [ ] Open /admin/orders and ask them to say out loud what needs to be made and shipped.
- [ ] Can they read the prescription table (SPH/CYL/AXIS/ADD/PD) without asking?
- [ ] Can they open the uploaded prescription photo?
- [ ] Do they know which lens type to fit?
- [ ] Can they find the customer's phone number to call them?
- [ ] Can they move the order through the stages (pending → confirmed → processing → shipped → delivered) without guessing?
- [ ] Would they ship the wrong thing based on what's on screen? Ask bluntly.

---

## Known things to watch for in this round
Not bugs yet — hypotheses to confirm or kill with real people:
1. **Search is icon-only** in the header, no "Search" label or visible box. Users may never find it.
2. **5 of 9 products are out of stock** right now. First-time visitors may read the shop as empty or abandoned. Consider hiding, restocking, or adding "notify me".
3. **Blue cut bundle pricing** (₹850 each, ₹1,200 for two) is only revealed in the cart. Testers may not discover the offer at all.
4. **High-power ₹400 surcharge** appears after prescription entry — check no one feels bait-and-switched.
5. **Customer OTP login is still demo mode** — any 6-digit code works. Don't UAT the login as if it's real; it must be wired to a real SMS provider before launch.
6. **No frame size / face-shape guidance** on product pages, which is the #1 reason online eyewear gets returned.

## Recording results

| # | Task | Result | Time | What they said | Fix? |
|---|------|--------|------|----------------|------|
| 1 | Find computer glasses | | | | |
| 2 | Use search | | | | |
| 3 | Filter under ₹1,000 | | | | |
| 4 | Enter prescription | | | | |
| 5 | Understand lens options | | | | |
| 6 | State the final price | | | | |
| 7 | Complete checkout | | | | |
| 8 | Find order status later | | | | |

**Rule of thumb:** if 2 out of 5 testers stumble on the same step, fix that step before building anything new.
