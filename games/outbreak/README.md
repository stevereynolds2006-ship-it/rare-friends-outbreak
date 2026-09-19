# Rare Friends: Outbreak

SDK version **v0.1**. A zombie-apocalypse raid loop inside FriendSDK's 960 × 640
container. You walk your owned Rare Friend around a barricaded industrial
courtyard, buy a Raid Kit at the supply locker, and send them through the
outbreak gate to scavenge.

The component has no application routes, wallet connection or Friend selector.
The SDK runtime supplies those, plus a freshly verified Generations NFT
(generation ≥ 1) on Robinhood mainnet.

## How to play

Move with WASD, arrow keys, or a tap/click destination. Walk to the **Supply
locker**, press E or tap its prompt, and buy a simulated Raid Kit. Walk to the
**Outbreak gate** to consume one kit and reveal a haul. Keep it or redeem it
from **Stash**. Settings include mute and reduced motion.

## Economy (simulated)

| Rule | Exact value |
| --- | --- |
| Raid Kit price | 1 RF (`1000000000000000000` base units) |
| Empty Can | 15% / 1,500 bps; 0 RF |
| Scrap Metal | 28% / 2,800 bps; 0.25 RF |
| Medkit | 22% / 2,200 bps; 0.50 RF |
| Ammo Cache | 14% / 1,400 bps; 0.75 RF |
| Fuel Drum | 9% / 900 bps; 1.50 RF |
| Safehouse Key | 6% / 600 bps; 2.50 RF |
| Gold Tooth | 4% / 400 bps; 5 RF |
| Genesis Relic | 2% / 200 bps; 10 RF |
| Expected reward | 0.97 RF per kit |
| Consumable | One kit produces exactly one haul |
| Backing | Each purchased or pending kit reserves 10 RF; kept rewards reserve their fixed RF value |
| Redemption | Fixed value, no expiry |

All balances, purchases, raids, collectibles and redemptions are simulated and
labelled as preview. An owned hardwired Generations NFT is still required. The
component only calls the SDK's fixed preview client. No trading, creator fees or
wearable NFTs are implemented.

## Run it

From the FriendSDK root, Node.js 22+:

```sh
npm ci
npm run dev:game -- games/outbreak
```

Open the printed URL (normally `http://localhost:4173`). Connect a browser
wallet on Robinhood mainnet (chain 4663) that holds a hardwired Generations NFT
generation 1 or higher, then select that Friend.

Phone on the same network:

```sh
npm run dev:game -- games/outbreak --host 0.0.0.0 --port 4173
```

Then open `http://YOUR_LAN_IP:4173` on the phone.

## Art and credits

World base is the SDK `02-circuit-courtyard-complete` preset (industrial square
with tanks, pipes, terminals and crates), restyled as a barricaded outpost.
Canonical Rare Friend walking sprites come from the SDK sprite reader and are
not recolored, stretched or replaced. Sounds use the SDK Friend sound kit.
No third-party assets.

## Known limitations

Preview progress resets when the session ends. Live token spending, on-chain
raids, trading and wearable loot are not in SDK v0.1 and are left for a later
Rare Friends review.
