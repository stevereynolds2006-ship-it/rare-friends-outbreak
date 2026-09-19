"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { GameWorld, type GameWorldInteraction } from "@rarefriends/friendsdk/world-view";
import { getWorldPreset, validateWorld } from "@rarefriends/friendsdk/world";
import { GameMenu } from "@rarefriends/friendsdk/frame";
import { formatGameAmount } from "@rarefriends/friendsdk/ui";
import { maximumPrize, type GameSnapshot, type GamePlay } from "@rarefriends/friendsdk/game";
import { createFriendSoundKit, type FriendSoundKit, type FriendSoundCue } from "@rarefriends/friendsdk/sounds";
import "./world-view.css";
import "./style.css";

const courtyard = getWorldPreset("02-circuit-courtyard-complete");
const world = validateWorld({
  ...courtyard,
  name: "Barricaded Outpost",
  setting: "Zombie-held industrial courtyard",
  summary: "A boarded workshop square. Supply crates on one side, an outbreak gate on the other.",
  props: [
    ...courtyard.props,
    { type: "crate", x: 250, y: 210, scale: 1.15 },
    { type: "tank", x: 360, y: 168, scale: 0.95 },
  ],
  actors: [],
});
const spawn = [288, 198] as const;
const interactions: readonly GameWorldInteraction[] = [
  { id: "buy", label: "Supply locker", position: [132, 344], reach: 92, labelOffset: -140 },
  { id: "raid", label: "Outbreak gate", position: [426, 72], reach: 96, labelOffset: -170 },
];

type Menu = "buy" | "raid" | "inventory" | "settings" | "reward" | null;
const rf = (value: bigint) => `${formatGameAmount(value, 18)} RF`;
const marks: Record<string, string> = {
  "Empty Can": "\ud83e\udd6b",
  "Scrap Metal": "\u2699\ufe0f",
  "Medkit": "\u271a",
  "Ammo Cache": "\u25a6",
  "Fuel Drum": "\u26fd",
  "Safehouse Key": "\u26b7",
  "Gold Tooth": "\u2605",
  "Genesis Relic": "\u25c6",
};

function cueForReward(reward: bigint): FriendSoundCue {
  if (reward >= 5_000_000_000_000_000_000n) return "reveal-legendary";
  if (reward >= 1_500_000_000_000_000_000n) return "reveal-rare";
  return "reveal-common";
}

/** Zombie-apocalypse raid loop. Runtime supplies the owned Friend and preview client. */
export default function Outbreak({ friendId, client, paused }: GameComponentProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [result, setResult] = useState<GamePlay | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sound = useRef<FriendSoundKit | null>(null);
  const locked = useRef(false);
  const epoch = useRef(0);
  const definition = client.definition;

  useEffect(() => {
    const version = ++epoch.current;
    sound.current = createFriendSoundKit({ muted: true });
    setSnapshot(null); setMenu(null); setResult(null); setError(""); setMessage("");
    setBusy(false); setMuted(true); locked.current = false;
    void client.read().then(value => { if (version === epoch.current) setSnapshot(value); }).catch(cause => {
      if (version === epoch.current) setError(cause instanceof Error ? cause.message : "Could not load the preview.");
    });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => {
      epoch.current++;
      sound.current?.dispose();
      sound.current = null;
      preference.removeEventListener("change", update);
    };
  }, [client, friendId]);

  async function act(work: () => Promise<void>, cue?: FriendSoundCue, after?: () => void) {
    if (locked.current || paused) return;
    const version = epoch.current;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    void sound.current?.unlock();
    try {
      await work();
      const value = await client.read();
      if (version === epoch.current) {
        setSnapshot(value);
        if (cue) sound.current?.play(cue);
        after?.();
      }
    } catch (cause) {
      if (version === epoch.current) setError(cause instanceof Error ? cause.message : "The preview action failed.");
    } finally {
      if (version === epoch.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }

  const navigate = (next: Menu) => {
    if (!busy && !paused) {
      setMenu(next);
      setError("");
      setMessage("");
    }
  };

  const feedback = (
    <p role={error ? "alert" : "status"}>
      {error || message || (busy ? "Waiting for preview confirmation\u2026" : "Simulated RF and raid outcomes. Labelled preview only.")}
    </p>
  );

  if (!snapshot) {
    return (
      <div className="outbreak-loading" role={error ? "alert" : "status"}>
        {error || "Loading the outpost\u2026"}
        {error && <button type="button" disabled={busy || paused} onClick={() => void act(async () => {})}>Retry</button>}
      </div>
    );
  }
  if (snapshot.friendId !== friendId) {
    return <p role="alert">This game session does not match the selected Friend.</p>;
  }

  const maxPrize = maximumPrize(definition);
  const canBuy = snapshot.rfBalance >= definition.price && snapshot.freeStake >= maxPrize && snapshot.freeStake + definition.price >= maxPrize;
  const pending = snapshot.plays.find(play => play.outcomeId === null);
  const outcome = result?.outcomeId ? definition.outcomes[result.outcomeId - 1] : null;
  const count = snapshot.inventory.reduce((total, amount) => total + amount, 0n);
  const preview = snapshot.mode === "preview";

  const runRaid = () => act(async () => {
    const version = epoch.current;
    sound.current?.play("action-start");
    if (!reducedMotion) sound.current?.play("anticipation");
    const play = pending ?? (await client.play(1n))[0];
    const settled = await client.settle(play.id);
    if (version === epoch.current) {
      setResult(settled);
      setMenu("reward");
      const found = settled.outcomeId ? definition.outcomes[settled.outcomeId - 1] : null;
      if (found) sound.current?.play(cueForReward(found.reward));
    }
  });

  return (
    <section className="outbreak-game" aria-label={definition.name} aria-busy={busy}>
      <div className="outbreak-world" inert={Boolean(menu) || paused || undefined}>
        <GameWorld
          world={world}
          spawn={spawn}
          interactions={interactions}
          friendId={friendId}
          paused={Boolean(menu) || paused}
          reducedMotion={reducedMotion}
          onInteract={id => navigate(id === "buy" ? "buy" : "raid")}
        />
        <p className="outbreak-banner">Day 19 \u00b7 Barricade holding</p>
        <div className="outbreak-hud">
          <span>{preview ? "Preview" : "Live"} \u00b7 {rf(snapshot.rfBalance)} \u00b7 {snapshot.consumables.toString()} kits</span>
          <button type="button" onClick={() => navigate("inventory")}>Stash \u00b7 {count.toString()}</button>
          <button type="button" onClick={() => navigate("settings")}>Settings</button>
        </div>
        <p className="outbreak-hint">
          <span className="outbreak-desktop-hint">WASD / arrows to walk \u00b7 Tap a destination \u00b7 E near the locker or gate</span>
          <span className="outbreak-mobile-hint">Tap to walk \u00b7 Tap the locker or gate when close</span>
        </p>
      </div>
      {menu && (
        <GameMenu
          title={
            menu === "buy" ? "Supply locker"
              : menu === "raid" ? "Outbreak gate"
                : menu === "reward" ? "Raid haul"
                  : menu === "inventory" ? "Safehouse stash"
                    : "Settings"
          }
          onClose={busy ? undefined : () => navigate(null)}
        >
          {menu === "buy" ? <>
            <p>One Raid Kit costs {rf(definition.price)} and funds a single scavenge through the gate.</p>
            <table>
              <thead><tr><th>Find</th><th>Chance</th><th>Value</th></tr></thead>
              <tbody>
                {definition.outcomes.map(item => (
                  <tr key={item.name}><td>{item.name}</td><td>{item.chanceBps / 100}%</td><td>{rf(item.reward)}</td></tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="rf-frame-primary"
              disabled={!canBuy || busy || paused}
              onClick={() => void act(() => client.buy(1n), "purchase", () => setMessage("One simulated Raid Kit added to your Friend."))}
            >
              Buy one Raid Kit \u00b7 {rf(definition.price)}
            </button>
            {!canBuy && <p>{snapshot.rfBalance < definition.price ? "Not enough simulated RF." : "New purchases are paused until there is enough free backing."}</p>}
            <p>Every kit reserves {rf(maxPrize)}. Purchased kits stay usable. All economy actions are simulated.</p>
          </> : menu === "raid" ? <>
            <p>Your Rare Friend is the runner. One kit, one raid. The courtyard beyond the gate is overrun.</p>
            <p>{snapshot.consumables.toString()} kits ready.{pending ? " A raid is already in progress." : ""}</p>
            <button
              type="button"
              className="rf-frame-primary"
              disabled={busy || paused || !pending && snapshot.consumables === 0n}
              onClick={() => void runRaid()}
            >
              {pending ? "Finish pending raid" : "Send Friend through the gate"}
            </button>
            {snapshot.consumables === 0n && !pending && <p>Buy a Raid Kit at the supply locker first.</p>}
          </> : menu === "reward" && outcome ? (
            <div className="outbreak-reward">
              <span aria-hidden="true">{marks[outcome.name] ?? "\u25c7"}</span>
              <h3>{outcome.name}</h3>
              <p>{rf(outcome.reward)} \u00b7 {outcome.chanceBps / 100}% chance</p>
              <p>
                {outcome.reward === 0n
                  ? "Nothing worth hauling back. The can stays in the stash as a reminder."
                  : "This simulated haul is already in your Friend's stash."}
              </p>
              <button type="button" disabled={busy || paused} onClick={() => navigate(null)}>Keep haul</button>
              {outcome.reward > 0n && (
                <button
                  type="button"
                  disabled={busy || paused}
                  onClick={() => void act(() => client.redeem(result!.outcomeId!, 1n), "reward", () => setMenu("inventory"))}
                >
                  Redeem \u00b7 {rf(outcome.reward)}
                </button>
              )}
            </div>
          ) : menu === "inventory" ? <>
            <p>Kept hauls retain their fixed RF value with no expiry. Redemption is simulated.</p>
            {definition.outcomes.map((item, index) => (
              <div className="outbreak-item" key={item.name}>
                <span>
                  <strong>{marks[item.name] ?? "\u00b7"} {item.name}</strong>
                  <small>{snapshot.inventory[index].toString()} owned \u00b7 {rf(item.reward)}</small>
                </span>
                <button
                  type="button"
                  disabled={busy || paused || snapshot.inventory[index] === 0n || item.reward === 0n}
                  onClick={() => void act(() => client.redeem(index + 1, 1n), "reward")}
                >
                  Redeem one
                </button>
              </div>
            ))}
          </> : menu === "settings" ? <>
            <button
              type="button"
              aria-pressed={!muted}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                sound.current?.setMuted(next);
                if (!next) void sound.current?.unlock();
              }}
            >
              {muted ? "Sound off" : "Sound on"}
            </button>
            <label>
              <input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} />
              Reduce motion
            </label>
            <p>
              All balances, kits, raids and redemptions are simulated. Reloading resets this preview.
              Wallet connection and ownership verification are provided by the SDK. Your selected
              Generations NFT is the survivor on screen \u2014 original pixels, no recolors.
            </p>
          </> : null}
          {feedback}
        </GameMenu>
      )}
    </section>
  );
}
