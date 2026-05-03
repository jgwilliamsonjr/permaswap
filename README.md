# Permaswap

A prototype for trading digital games between users without publisher involvement.

Each game entitlement is cryptographically signed (Ed25519) to a specific user. 
When you swap, the signature is re-bound to the new owner. No server, no 
middleman, no permission required.

**Try the demo → (https://permaswap.vercel.app/)**

---

## The problem it solves

When you "buy" a digital game today, you're actually buying a revocable licence. 
The publisher can remove it, the store can close, and you can never resell it. 
Permaswap demonstrates that this is a technical choice, not a technical necessity.

---

## Run it

No build step. Open `index.html` in a browser, or:

```bash
npx serve .
