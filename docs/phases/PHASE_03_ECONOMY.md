# PHASE 03 — Economy, construction and 100-agent scale

**Tóm tắt tiếng Việt:** Nâng lên 100 NPC; thêm nhà ở, xây dựng, tiền và giao dịch đơn giản; tuyệt đối không tự nhân đôi tài nguyên/tiền.

**Status:** IMPLEMENTED ON FEATURE BRANCH, FINAL CI / REVIEW IN PROGRESS · **Requires:** Phase 02 merged and verified. PR #4 is draft and must not be auto-merged.
**Intent:** Evolve one village toward 100 residents with real but understandable transfers of goods and money. Complex capitalism simulator not required.

## Observable scenario

Villagers harvest, sell finite stock through one simple market, buy meals with money, and get poorer or richer based on job output. Houses have bounded capacity. Building a house uses actual wood. Resource shortfalls or an empty treasury change employment or prices visibly. The player sees stock, money and housing affect each other. No money magically enters circulation without explanation.

## 03.1 Scaled deterministic population & housing
- [x] Introduce max occupants per house and a simple housing assignment; do not spawn citizens in water or houses with invalid IDs.
- [x] Allow deterministic selection of a starting population from 20 up to 100 for development/benchmark scenarios, reusing same engine/rules.
- [x] Ensure map has accessible homes/market/farms/forest for 100-person seed presets; if 48×48 geography cannot support it, redesign tile layout/production density before enlarging world.
- [x] Add house construction: builder + wood cost + work time + free valid tile + explicit completion effect, no instantaneous free placement.
- [x] Track housing occupancy, homeless count, idle/unemployed count, workforce by job.

## 03.2 Small economy: one market and two goods
- [x] Add integer wallet per citizen, finite central town market stock, town treasury; seed finite initial money explicitly.
- [x] Initial goods remain **food and wood**. No crafting tree until both goods meaningfully circulate.
- [x] Define producer sells gathered/harvested goods into market (market buys only with funds/available capacity); resident buys food/wood from market with enough wallet; market/treasury books reconcile.
- [x] Define buyer/seller order, price and transfer as one atomic transaction. Stock and currency only change by documented sources/sinks; conserve total currency across transfers.
- [x] Consider a simple demand-sensitive bounded price at fixed intervals **only if** fixed prices produce uninteresting/inoperable results; otherwise keep fixed prices.
- [x] When unable to buy, citizen records insufficient funds and chooses lawful available action; survival penalty remains, later social policy can mitigate.
- [x] Define what happens when market funds run low (cannot purchase produce, queues/work idle, optional transparent bootstrap treasury reserve, *not* infinite wages).
- [x] Use integer amounts; define initial wallet distribution so money does not begin as a zero-sum deadlock.

## 03.3 Jobs and economic loop
- [x] Farmer/gatherer deliver goods; builders use wood; market can transact at a shared location.
- [x] Citizens choose valid accessible jobs based on local demand and current needs. Cap job slots / harvest capacity, avoid 100 citizens farming one tile.
- [x] Add simple livelihood checks: days without food, low wallet, unemployment. Use these to create grounded event entries.
- [x] If sale/buy fails, NPC does not stay frozen forever; fallback, cooldown and negative-test coverage.
- [x] Keep one accounting mechanism and clear source/sink labels; no ledger service, distributed transactions or external bank integration.

## 03.4 Balance and performance
- [x] Seed scenario fixtures at 20, 50 and 100 NPC; run at least 30 days each, plus food-shortage and market-insolvent stress cases.
- [x] Record production/consumption, all wallet/treasury sums, average health, homelessness, path calls/tick and invalid actions. Mood is deferred to the social phase.
- [x] Profile **engine tick** independently from Phaser display; do not optimize based on guesses.
- [x] Avoid unnecessary optimization: reusable routes and capped arrays; profile BFS/engine. UI is validated under Chromium 20× without an unsupported FPS claim.
- [x] Make NPC count and simulation speed visible; no silent hiding/deletion of NPCs to increase FPS.

## Tests / double-check

- [x] Trade with exact funds succeeds; with insufficient funds fails without partial transfer.
- [x] Last unit of market food purchased by concurrent buyers is owned once, not duplicated.
- [x] Global money total equals initial total in a pure-transfer test; any explicit monetary sink/source is visible and tested.
- [x] Construction checks finite wood, free walkable plots, live builder, wages and time; no double allocation, no finished home without work.
- [x] Housing cannot overfill and all house references resolve. Destruction is not introduced in Phase 03.
- [x] 100 NPCs can access work/home/market via walkable paths; deterministic seed digest tests pass after 720 ticks.
- [x] Stress: resource depletion, all citizens bankrupt, market treasury empty, 20× with inspector open; no unhandled error or infinite retry loop.
- [x] Snapshot of dashboard matches sum of canonical inventories and market stocks; avoid duplicated "UI-only money".

## Definition of done

With **100 active NPCs**, a chosen seeded world can run autonomously for 30 game-days, trade/recovery/failure paths are explainable and core invariant tests pass. Measured performance data logged (no unsupported "60 FPS" claim). At least one economy event demonstrably follows real stock/transaction change.

## Defer / anti-overengineering

No supply chains with ten industries, no stocks/loans/bankruptcy court, no complex auction, inflation model, 3D building editor, worker micro-management or player-owned company. Adjust limited parameters and show causality before adding more goods.


## Phase 03 implementation and verification evidence (2026-10-14)

- **Feature branch:** feat/phase-03-economy from main 0c8db616. **Draft PR:** https://github.com/giabao2605/Tiny-Civilization/pull/4. No merge or Phase 04 changes.
- **Core ownership:** WorldState.inventory is market-owned warehouse; NPC.inventory is personal food/wood; market.cash plus ALL citizen.wallet values equals initial money supply. Initial wallet 32/citizen and market treasury 90/citizen, hence 2,440 / 6,100 / 12,200 initial total coins for 20/50/100 NPC. No emissions, taxes or invisible paychecks.
- **Economy:** finite harvested goods go into worker bags, transactions take an on-site stationary hour, and transfer goods and coins atomically. Hunger prioritizes eating genuinely owned food, normally via purchased market food when available. Full crop yields may be sold before buying meals unless hunger is critical. Market can reject purchase/sale for location, stock, funds or capacity and does not force partial transfers.
- **Prices:** food market buy 2 / sell 3; wood buy 1 / sell 2, all integer. Margin remains in finite market treasury; no hidden money sink. Buyer and seller counts tracked as cumulative units and bounded recent trade history.
- **Housing:** 20 initial houses with capacity 4 each, an extra home costs exactly 8 market wood on construction start, a builder needs 8 stationary hours at 4 treasury coins per hour, and up to 4 homeless people are allocated at completion. Dead builders and unfunded work cannot advance progress.
- **30-day baseline:** GitHub Actions [38513369596](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513369596) tested 10 seeds each at 20/50/100 with all NPCs alive, deterministic replay, nonnegative balances and resource/money conservation. Further consumer-trade-loop adjustment was made afterward; certify only when the final PR SHA is green.
- **Adversarial tests:** last warehouse unit contention, exact/no funds, multiple sellers sharing the last treasury coins, buy food and wood, market out of stock/cash, shortage mortality, insufficient/consumed construction wood, dead/unpaid builder, capacity and deterministic JSON replay.
- **Benchmark:** 100 NPC, Node v22.23.3 GitHub Ubuntu Actions, 720 ticks; mean 1.328ms/tick, p95 5.364ms/tick, 51.89 BFS calls/tick, GC-sensitive heap delta. These figures belong specifically to CI run 38513369596; do not assume final SHA reproduces identical timing. Chromium desktop/mobile and 20× inspector E2E passed (four cases), screenshots in Action artifacts.
- **Root-cause review:** A two-unit sale into one free warehouse slot originally deadlocked merchants and starved the 50-NPC seed. Fixed by computing an atomic legal quantity. Separately audited market coin circulation and added two-way market counters rather than concealing depleted market cash with unlimited money.
- **Known limitations:** numerical browser FPS and durable heap leak testing were not obtained; screenshots captured by E2E but not visually certified on a real user device; no automatic deep supply chains, demographics, financial services, persistence, social relationships or 3D in this phase.
