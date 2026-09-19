# Rare Friends: Outbreak

Walk your Rare Friend through a barricaded courtyard, buy Raid Kits, scavenge the outbreak gate, and keep or redeem the haul.

**Builder:** Sharp · [@Sharpbigred](https://x.com/Sharpbigred) · [@stevereynolds2006-ship-it](https://github.com/stevereynolds2006-ship-it)  
**Category:** Character Spotlight  
**SDK:** FriendSDK v0.1 (0.1.0)

Source lives in `games/outbreak`. Drop that folder into a FriendSDK checkout and run the game command below.

## Run it

Use Node.js 22+ on Linux, macOS, or Ubuntu/WSL2, plus a browser wallet holding a hardwired Rare Friends Generations NFT (generation ≥ 1) on Robinhood mainnet (4663).

```sh
git clone https://github.com/spokesz/friendsdk.git
cd friendsdk
git clone https://github.com/stevereynolds2006-ship-it/rare-friends-outbreak.git /tmp/outbreak
cp -R /tmp/outbreak/games/outbreak games/outbreak
npm ci
npm run dev:game -- games/outbreak
```

Open the printed URL (normally `http://localhost:4173`), connect your wallet and select your Friend. The SDK verifies ownership before play.

Phone on the same Wi-Fi:

```sh
npm run dev:game -- games/outbreak --host 0.0.0.0 --port 4173
```

Then open `http://YOUR_LAN_IP:4173`.

Move with WASD, arrow keys or click/tap. Buy a kit at **Supply locker**, raid at **Outbreak gate**, keep or redeem from **Stash**. Settings include mute and reduced motion. Everything stays inside the SDK's 960 × 640 container.

## Rules and rewards

**All balances, purchases and rewards are simulated.** One Raid Kit costs 1 RF and produces one haul. Re-raiding does not change the odds.

| Find | Chance | Redemption value |
| --- | --- | --- |
| Empty Can | 15% | 0 RF |
| Scrap Metal | 28% | 0.25 RF |
| Medkit | 22% | 0.50 RF |
| Ammo Cache | 14% | 0.75 RF |
| Fuel Drum | 9% | 1.50 RF |
| Safehouse Key | 6% | 2.50 RF |
| Gold Tooth | 4% | 5 RF |
| Genesis Relic | 2% | 10 RF |

Expected reward is 0.97 RF per kit. Every purchased or pending kit reserves 10 RF. Kept hauls have no redemption expiry.

## Checks

From a FriendSDK checkout with this game in `games/outbreak`:

```sh
npm run check:games
```

`games/outbreak` validated: expected reward `970000000000000000` base units, maximum `10000000000000000000` base units.

Typecheck and full browser suites belong to the SDK repo and were not re-run against a published host. Preview progress resets when the session ends. No live token spending, trading, wearable NFTs or creator fees are included.

## Credits

World geometry from FriendSDK preset `02-circuit-courtyard-complete`. Canonical Rare Friend sprites and the Friend sound kit from FriendSDK v0.1. No third-party assets.
