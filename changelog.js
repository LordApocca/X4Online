'use strict';
const X4O_CHANGELOG = [
  {
    version: '0.1.11', date: '2026-11-18',
    title: 'Hotfix',
    changes: [
      { kind: 'mod', text: 'Fixed a cause of joining players’ games crashing when they save: the mod no longer works on the game while it is still loading.' },
      { kind: 'mod', text: 'Joining loads more cleanly: the host’s updates that arrive during your load now wait until your game is running.' },
      { kind: 'app', text: 'The Hub always shows the patch notes of the newest release.' },
    ],
  },
  {
    version: '0.1.10', date: '2026-11-18',
    title: 'Hotfix',
    changes: [
      { kind: 'mod', text: 'NPCs in a sector another player’s game runs attack your ship as they would in single player.' },
      { kind: 'mod', text: 'Scanning or looking at another player’s ship shows its real order, pilot, crew, paint and equipment mods, in every menu.' },
      { kind: 'mod', text: 'Names and descriptions you give your ships and stations reach the other players.' },
      { kind: 'mod', text: 'Ships docked at a station or inside a carrier in another player’s game show as docked in yours, not floating beside the dock.' },
    ],
  },
  {
    version: '0.1.9', date: '2026-11-17',
    title: 'Safe and sound',
    changes: [
      { kind: 'app', text: 'The connection between players is now encrypted, and both sides prove who they are, so nobody on the network can read your session or take your place in it.' },
      { kind: 'mod', text: 'Players in a session can no longer pose as each other or as the host.' },
      { kind: 'mod', text: 'Closed a security hole that could let a modified game in your session make yours run commands it never should, such as deleting a save.' },
      { kind: 'mod', text: 'Every player now gets their own HQ, with its research module, in their starting system the first time they join a universe. The Faction page says so under the starting system.' },
      { kind: 'mod', text: 'Fighters docked in a carrier stay inside it when the carrier flies into a sector another player’s game runs.' },
      { kind: 'mod', text: 'Long sessions no longer pile up leftover data about ships, wrecks and satellites that are gone, which made memory use and save files grow.' },
      { kind: 'app', text: 'In a session, the app warns you 5 minutes before a server update, with a countdown, and leaves the session cleanly when it starts (the host saves first).' },
      { kind: 'app', text: 'The Hub now shows the roadmap: news about the updates we are working on, starting with Invasion.' },
    ],
  },
  {
    version: '0.1.8', date: '2026-11-16',
    title: 'One universe, in step',
    changes: [
      { kind: 'mod', text: 'NPC stations keep the same stock, prices, trade offers, modules, damage and repairs for every player.' },
      { kind: 'mod', text: 'Your stations look the same in every game, with every module in place, and warn you when they come under attack.' },
      { kind: 'mod', text: "Ships keep their orders, equipment and pilots when they fly into a sector another player's game runs, and you can see and edit the order queue of any of your ships as usual." },
      { kind: 'mod', text: 'No more double damage: every shot counts once, and turrets aim at the same target for everyone.' },
      { kind: 'mod', text: 'No ship is lost, frozen or doubled when players join or leave, or when ships cross between players’ sectors.' },
      { kind: 'mod', text: 'Satellites, mines, laser towers, nav beacons and loot are the same for everyone and survive a rejoin.' },
      { kind: 'mod', text: 'When you come back, a report tells you what happened to your ships and stations while you were away, and what your empire earned is yours.' },
      { kind: 'mod', text: 'Faction standings, sector ownership, NPC military responses and Xenon and Kha’ak activity are the same in every game.' },
      { kind: 'mod', text: 'Ships no longer flicker or jump to another place for a moment, and appear at once when a sector comes into view.' },
      { kind: 'mod', text: "Fixed joining players' games closing by themselves during a session." },
      { kind: 'mod', text: 'Time acceleration (SETA) is off during a session, so every game stays in step.' },
      { kind: 'app', text: "A short drop in the host's or your connection no longer ends the session: play carries on." },
      { kind: 'app', text: 'Joining over a slow connection finishes reliably: an interrupted download carries on where it stopped.' },
      { kind: 'app', text: 'X4 Online now supports the Steam version of X4: Foundations only.' },
      { kind: 'app', text: 'Sessions hold up to 3 players for now.' },
    ],
  },
  {
    version: '0.1.7', date: '2026-11-10',
    title: 'Walk together',
    changes: [
      { kind: 'mod', text: 'See other players walking and running around when you share a station or a ship.' },
      { kind: 'mod', text: "Dock at another player's ship, carriers included, and walk aboard together." },
      { kind: 'mod', text: "Other players' ships now wear proper paint instead of a pink checkerboard." },
      { kind: 'mod', text: "Joining no longer uncovers part of your map around the host's position." },
      { kind: 'mod', text: 'Fixed ships and whole fleets showing twice for joining players.' },
      { kind: 'mod', text: 'Ships travelling along highways move smoothly for joining players instead of teleporting.' },
      { kind: 'mod', text: 'NPC ships no longer flick across the map for a moment.' },
      { kind: 'mod', text: 'Loot from destroyed ships, such as equipment parts, now drops for every player.' },
      { kind: 'mod', text: 'Attacking another player makes you hostile to each other in both games.' },
      { kind: 'mod', text: 'Ships around you show on your map while you are on foot on a station.' },
      { kind: 'app', text: 'If your game closes without leaving the session, the app asks whether you want to rejoin.' },
    ],
  },
  {
    version: '0.1.6', date: '2026-11-09',
    title: 'See every shot',
    changes: [
      { kind: 'mod', text: "Other players' shots now show in your game, including misses and shots fired at nothing." },
      { kind: 'mod', text: "NPC ships from another player's game show their weapon fire too." },
      { kind: 'mod', text: "NPC ships from another player's game move smoothly when you're in the same sector, instead of jumping around." },
    ],
  },
  {
    version: '0.1.5', date: '2026-11-08',
    title: 'Host through the server',
    changes: [
      { kind: 'app', text: 'Testers and staff can host through the server: friends join without anyone opening a port on their router.' },
      { kind: 'app', text: "When a join doesn't get going, the app log now says why." },
    ],
  },
  {
    version: '0.1.4', date: '2026-11-06',
    title: "Your ships in other players' space",
    changes: [
      { kind: 'mod', text: "Ships you dock at a station another player's game runs stay in your property list and menus." },
      { kind: 'mod', text: "Shipyard repairs and upgrades for your ships in another player's area now happen there, and are paid." },
      { kind: 'mod', text: "Selling, scuttling, dropping cargo, launching satellites, trade loops and docking-bay reservations on your ships in another player's area now take effect." },
      { kind: 'mod', text: "Your station's settings, budgets, money and supply settings now reach the host." },
      { kind: 'mod', text: 'Fleet names are kept when you rejoin.' },
      { kind: 'mod', text: 'Fixed crashes when ships were being built nearby.' },
    ],
  },
  {
    version: '0.1.3', date: '2026-11-03',
    title: 'Ships known to clients',
    changes: [
      { kind: 'mod', text: "Ships will no longer display as unknown to clients inside the host's sector." },
    ],
  },
  {
    version: '0.1.1', date: '2026-11-03',
    title: 'Choose your X4 folder',
    changes: [
      { kind: 'app', text: 'Allowed players to manually select their X4 install directory.' },
    ],
  },
  {
    version: '0.1.0', date: '2026-11-03',
    title: 'Initial release',
    changes: [
      { kind: 'app', text: 'Initial release' },
      { kind: 'mod', text: 'Initial release' },
    ],
  },
];
