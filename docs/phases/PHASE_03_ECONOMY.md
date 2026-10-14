# PHASE 03 — Economy, construction and 100-agent scale

**Status:** NOT STARTED · **Requires:** phase 02 survival loop is correct.
**Intent:** Evolve one village toward 100 residents with real but understandable transfers of goods and money. Complex capitalism simulator not required.

## Observable scenario

Villagers harvest, sell finite stock through one simple market, buy meals with money, and get poorer or richer based on job output. Houses have bounded capacity. Building a house uses actual wood. Resource shortfalls or an empty treasury change employment or prices visibly. The player sees stock, money and housing affect each other. No money magically enters circulation without explanation.

## 03.1 Scaled deterministic population & housing
- [ ] Introduce max occupants per house and a simple housing assignment; do not spawn citizens in water or houses with invalid IDs.
- [ ] Allow deterministic selection of a starting population from 20 up to 100 for development/benchmark scenarios, reusing same engine/rules.
- [ ] Ensure map has accessible homes/market/farms/forest for 100-person seed presets; if 48×48 geography cannot support it, redesign tile layout/production density before enlarging world.
- [ ] Add house construction: builder + wood cost + work time + free valid tile + explicit completion effect, no instantaneous free placement.
- [ ] Track housing occupancy, homeless count, idle/unemployed count, workforce by job.

## 03.2 Small economy: one market and two goods
- [ ] Add integer wallet per citizen, finite central town market stock, town treasury; seed finite initial money explicitly.
- [ ] Initial goods remain **food and wood**. No crafting tree until both goods meaningfully circulate.
- [ ] Define producer sells gathered/harvested goods into market (market buys only with funds/available capacity); resident buys food/wood from market with enough wallet; market/treasury books reconcile.
- [ ] Define buyer/seller order, price and transfer as one atomic transaction. Stock and currency only change by documented sources/sinks; conserve total currency across transfers.
- [ ] Consider a simple demand-sensitive bounded price at fixed intervals **only if** fixed prices produce uninteresting/inoperable results; otherwise keep fixed prices.
- [ ] When unable to buy, citizen records insufficient funds and chooses lawful available action; survival penalty remains, later social policy can mitigate.
- [ ] Define what happens when market funds run low (cannot purchase produce, queues/work idle, optional transparent bootstrap treasury reserve, *not* infinite wages).
- [ ] Use integer amounts; define initial wallet distribution so money does not begin as a zero-sum deadlock.

## 03.3 Jobs and economic loop
- [ ] Farmer/gatherer deliver goods; builders use wood; market can transact at a shared location.
- [ ] Citizens choose valid accessible jobs based on local demand and current needs. Cap job slots / harvest capacity, avoid 100 citizens farming one tile.
- [ ] Add simple livelihood checks: days without food, low wallet, unemployment. Use these to create grounded event entries.
- [ ] If sale/buy fails, NPC does not stay frozen forever; fallback, cooldown and negative-test coverage.
- [ ] Keep one accounting mechanism and clear source/sink labels; no ledger service, distributed transactions or external bank integration.

## 03.4 Balance and performance
- [ ] Seed scenario fixtures at 20, 50 and 100 NPC; run at least 30 days each, plus food-shortage and market-insolvent stress cases.
- [ ] Record daily production, food consumption, money by owner (sum), average health/mood, homelessness, average path calls/tick and invalid-action counts.
- [ ] Profile **engine tick** independently from Phaser display; do not optimize based on guesses.
- [ ] Optimize hotspots only if evidenced: re-use computed routes, avoid relations O(N²), cap historical arrays, update HUD less frequently.
- [ ] Make NPC count and simulation speed visible; no silent hiding/deletion of NPCs to increase FPS.

## Tests / double-check

- [ ] Trade with exact funds succeeds; with insufficient funds fails without partial transfer.
- [ ] Last unit of market food purchased by concurrent buyers is owned once, not duplicated.
- [ ] Global money total equals initial total in a pure-transfer test; any explicit monetary sink/source is visible and tested.
- [ ] Construction refuses unavailable wood, occupied/invalid site or dead builder; success deducts wood exactly once.
- [ ] Housing cannot overfill; every referenced house/building exists; building destruction cleans references if introduced.
- [ ] 100 NPCs can access work/home/market via walkable paths; deterministic seed digest tests pass after 720 ticks.
- [ ] Stress: resource depletion, all citizens bankrupt, market treasury empty, 20× with inspector open; no unhandled error or infinite retry loop.
- [ ] Snapshot of dashboard matches sum of canonical inventories and market stocks; avoid duplicated "UI-only money".

## Definition of done

With **100 active NPCs**, a chosen seeded world can run autonomously for 30 game-days, trade/recovery/failure paths are explainable and core invariant tests pass. Measured performance data logged (no unsupported "60 FPS" claim). At least one economy event demonstrably follows real stock/transaction change.

## Defer / anti-overengineering

No supply chains with ten industries, no stocks/loans/bankruptcy court, no complex auction, inflation model, 3D building editor, worker micro-management or player-owned company. Adjust limited parameters and show causality before adding more goods.
