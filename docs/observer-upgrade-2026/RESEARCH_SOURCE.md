# Nghiên cứu sâu và Master Plan cho game “Living Settlement”

> **Lưu ý khi nhập vào GitHub:** Đây là nội dung báo cáo Deep Research Markdown do người dùng cung cấp, được đặt trong namespace `docs/observer-upgrade-2026/` để **không thay thế** `docs/MASTER_PLAN.md` và `docs/phases/` của chuỗi trước. Các trích dẫn dạng `cite...` và link `sandbox:/` thuộc bản báo cáo gốc; chúng không phải đường dẫn tài nguyên GitHub. Xem [README](README.md) để phân biệt tài liệu và tình trạng nhập 7 DOCX.

## Chẩn đoán prototype hiện tại

Từ ảnh prototype, hướng game đã khá rõ: một **ngôi làng mô phỏng tự vận hành**, nhìn từ trên xuống, nơi người dùng có thể mở game và quan sát cư dân sống trong thế giới mà không cần điều khiển trực tiếp. Vấn đề hiện tại không nằm ở ý tưởng cốt lõi mà ở ba lớp: **presentation chưa đủ đẹp**, **world simulation còn quá “đường ray”**, và **camera/map chưa tạo được cảm giác một thế giới đủ lớn để quan sát lâu**.

![Prototype Living Settlement hiện tại](sandbox:/mnt/data/image(2).png)

Ảnh hiện tại cho thấy map khoảng **48×48 tile**, phần lớn nhà dùng cùng silhouette, mặt đất khá đồng nhất, đường màu vàng tạo thành các corridor rõ rệt và NPC chủ yếu nằm trên chính các corridor này. Vì toàn bộ world được ép vào một vùng vuông nhỏ, dù người chơi nhìn thấy gần như cả map thì vẫn có cảm giác “view hẹp”: nguyên nhân chính là **world nhỏ + bố cục lặp**, không chỉ là camera zoom quá gần.

Điểm quan trọng nhất là **không nên hiểu “chưa thực tế” thành “phải chuyển sang 3D hoặc art realistic”**. Các game thành công trong nhóm này cho thấy pixel/stylized art hoàn toàn đủ sức tạo cảm giác sống động. WorldBox vẫn dùng pixel graphics nhưng tạo sức hút bằng thế giới có sinh vật với traits/needs, civilization tự phát triển và procedural worlds; Steam hiện ghi nhận 29.914 đánh giá tiếng Anh với 96% tích cực. citeturn12view0 Townscaper thậm chí tự mô tả mình gần với “toy” hơn game truyền thống, nhưng dùng thuật toán để tự sinh nhà, cầu, cầu thang và sân vườn đẹp từ cấu hình khối của người dùng. citeturn13view3

Vì vậy, mục tiêu visual nên là **believable và coherent**, không phải photorealistic:

| Hiện tại | Nên chuyển thành |
|---|---|
| Một mẫu nhà lặp lại | House kit với nhiều silhouette, mái, tường, cửa sổ, props |
| Green tile khá đồng nhất | Terrain variation, edge/autotile, hoa, đất, cỏ dài/ngắn, decal |
| Đường vàng là “ray” | Main road + side street + footpath + plaza + grass walkable |
| NPC chỉ giống các chấm di chuyển | NPC có destination, routine, pause, social event, shelter |
| World gần như cùng trạng thái suốt thời gian | Dawn/day/dusk/night + weather + wetness + lights |
| Camera tĩnh | Pan, zoom, overview, follow NPC, cinematic idle camera |
| Nhà/cây nằm phẳng trên map | Layering, shadow, foreground, smoke, light, water/foliage animation |

**Kết luận audit:** không cần bỏ prototype hoặc rewrite từ đầu. Nên giữ core top-down simulation, nhưng biến nó từ một **“tile map có NPC chạy”** thành một **“ambient living world”**.

## Thị trường và những game nên học

Có một tín hiệu khá rõ trên Steam rằng nhóm **cozy idler / desktop companion / game để mở bên cạnh công việc** đã trở thành một niche thực sự chứ không còn chỉ là vài game riêng lẻ. Rusty's Retirement chạy ở cạnh dưới màn hình, hỗ trợ zoom và Focus Mode; nó đang có 6.603 đánh giá tiếng Anh với 97% tích cực. Steam hiện còn gom Rusty's Retirement, Ropuka's Idle Island, Not Monday Cafe, Emberlands: Desktop Village và nhiều game tương tự vào bundle “Bottom-Of-Your-Screen” gồm 17 sản phẩm. Đây không phải số liệu doanh thu toàn thị trường, nhưng là tín hiệu mạnh rằng format “game chạy cạnh công việc để thỉnh thoảng nhìn vào” đã hình thành thành một nhóm sản phẩm dễ nhận biết. citeturn15view0turn15view1

Ropuka's Idle Island cũng đi đúng triết lý này: game có thể nằm ở bất kỳ vị trí nào trên desktop, resize được, con ếch tự cắt cỏ trong khi người dùng làm việc hoặc thư giãn; game hiện có 2.387 đánh giá tiếng Anh, 95% tích cực. citeturn13view2 Tiny Pasture tương tự, cho phép kéo và thay đổi chiều dài khu vực game rồi đặt ở vị trí khác nhau trên màn hình; hiện có 1.203 đánh giá tiếng Anh, 93% tích cực. citeturn13view1

Song song với đó là nhóm **observer simulation**, trong đó bản thân việc xem hệ thống tự chạy là trải nghiệm chính. Ages of Conflict mô tả chính nó là game tạo và quan sát các AI nation hoạt động; game còn lưu lịch sử và statistics của simulation, có thể để world tiếp tục thay đổi trong thời gian rất dài. Steam hiện ghi nhận 6.337 đánh giá tiếng Anh với 97% tích cực. citeturn12view1 WorldBox cũng cho phép civilization tự colonize, chiến đấu, nổi loạn và thay đổi world, trong khi người chơi có thể can thiệp hoặc đơn giản quan sát. citeturn12view0

Ở đầu còn “passive” hơn, Placid Plastic Duck Simulator xây gần như toàn bộ trải nghiệm quanh thư giãn, âm nhạc, môi trường và việc quan sát; game hiện có 12.406 đánh giá tiếng Anh, 97% tích cực. citeturn12view2 Chillquarium sử dụng tiến trình real-time và một chu kỳ ngày–đêm real-time trong aquarium; Steam hiện ghi nhận 5.306 đánh giá tiếng Anh, 93% tích cực. citeturn13view0

Từ các trường hợp này, **suy luận sản phẩm phù hợp nhất cho Living Settlement là đứng giữa hai nhóm**: không cần trở thành city builder phức tạp như RimWorld/Anno, cũng không nên chỉ là screensaver. Nó nên có đủ simulation để người chơi có cảm giác đang nhìn một nơi thực sự sống, nhưng toàn bộ interaction vẫn là tùy chọn.

| Tham chiếu | Cơ chế đáng lấy | Áp dụng cho Living Settlement |
|---|---|---|
| **WorldBox** | Traits/needs, living world, procedural behavior, observe-or-intervene | NPC có routine/trait nhẹ và tự quyết định đi đâu; bỏ phần god powers |
| **Ages of Conflict** | Simulation tự chạy, history/statistics, observer-first | Có event history/debug log nhẹ; world vẫn thú vị khi không click |
| **Placid Plastic Duck Simulator** | Relaxation, ambient presentation, special moments | Ưu tiên soundscape, thời gian, sự kiện hiếm và “khoảnh khắc đáng nhìn” |
| **Chillquarium** | Real-time change, day/night | Day/night là một phần cốt lõi chứ không chỉ filter màu |
| **Rusty's Retirement** | Zoom, Focus Mode, desktop-friendly layout | Camera/viewport linh hoạt và chế độ AFK |
| **Tiny Pasture / Ropuka** | Resize/reposition, companion experience | Học triết lý “không cản công việc”, không nhất thiết sao chép desktop overlay |
| **Townscaper** | Procedural beautification | Dùng variation rules để cùng một content set vẫn tạo map đẹp |

WorldBox, Ages of Conflict và Placid Plastic Duck đặc biệt đáng chú ý vì chúng chứng minh ba mức khác nhau của một điều: **người chơi có thể tìm thấy giá trị trong việc quan sát hệ thống mà không cần gameplay input liên tục**. citeturn12view0turn12view1turn12view2

Do đó, tôi không khuyến nghị thêm dialogue tree, quest NPC, combat hay click-to-interact chỉ vì “game khác có”. Những tính năng đó đi ngược yêu cầu hiện tại. Thay vào đó, hãy thêm **nội dung để xem**.

## Hướng sản phẩm nên chốt

North Star của game nên được viết thành:

> **“Một ngôi làng nhỏ tự sống. Người dùng có thể để game chạy và chỉ nhìn; mỗi cư dân có nơi để đi, thời gian và thời tiết liên tục biến đổi cảnh quan, và trong vài phút luôn có những câu chuyện nhỏ tự xảy ra.”**

Để tránh game rơi vào trạng thái “đẹp nhưng nhìn 2 phút là hết”, nên dùng ba mốc kiểm tra nội bộ:

**Trong khoảng 30 giây**, màn hình nên có ít nhất một thứ nhỏ đáng quan sát: NPC gặp nhau, xe đi ngang, chim bay, smoke, cửa mở/đóng, người vào nhà, ánh sáng thay đổi.

**Trong khoảng 5 phút**, người xem phải thấy world đổi trạng thái: ánh sáng dịch chuyển, mật độ NPC thay đổi, stall mở/đóng, weather chuyển, puddle xuất hiện hoặc một khu vực đông lên.

**Trong khoảng 20–30 phút**, các hệ thống nên tạo được một “câu chuyện nhỏ” dù game không dùng dialogue: trời bắt đầu mưa → NPC chạy trú → đường vắng → puddle tích lại → mưa dừng → trẻ/emote/pet quay lại → trời tối → cửa sổ và đèn đường bật.

Đây là điểm Living Settlement có thể khác desktop-idler thông thường: Ropuka và Tiny Pasture chủ yếu xoay quanh companion/idle loop, còn Living Settlement có thể ưu tiên **emergent observation** — sự thích thú đến từ việc xem nhiều hệ thống giao nhau. Ropuka và Tiny Pasture xác nhận nhu cầu về game thư giãn chạy song song với hoạt động khác, trong khi WorldBox và Ages of Conflict cho thấy simulation tự vận hành có thể là phần hấp dẫn chính. citeturn13view1turn13view2turn12view0turn12view1

### Cấu trúc world

Tôi đề xuất bước đầu tăng map từ **48×48 lên 96×96**, tức tăng diện tích logic từ 2.304 lên 9.216 tile, đúng **4 lần**. Không nhảy ngay lên 256×256 vì sẽ phát sinh content debt: map lớn nhưng trống còn tệ hơn map nhỏ.

World 96×96 nên chia thành ba district có ngôn ngữ thị giác riêng:

| District | Thành phần |
|---|---|
| Residential | Nhà ở, garden, laundry, well, alley, trẻ em/pet |
| Civic / Market | Plaza, stall, workshop, delivery, gathering, bell |
| Nature / Waterfront | Pond/river, bridge, trees, benches, birds, fishing-style ambient NPC |

Đường không còn là một loại tile vàng duy nhất. Hệ thống nên có **main road → side street → footpath → plaza**, cộng với grass có thể bước qua nhưng NPC ít ưu tiên hơn. Nhờ đó cư dân không còn “bị nhốt” vào đường nhưng vẫn hành xử hợp lý.

### Camera và view

“View rộng hơn” nên được giải quyết bằng camera thực sự, không phải giảm scale tất cả sprite:

**Manual mode:** wheel zoom + drag/pan.  
**Overview/Fit mode:** một nút đưa camera về khung tổng thể.  
**Follow mode:** camera nhẹ nhàng bám một NPC hoặc vehicle.  
**Cinematic/AFK mode:** sau một khoảng không input, camera tự chuyển giữa các điểm thú vị.  
**Reset mode:** quay về zoom/position mặc định.

Rusty's Retirement cho phép zoom để điều chỉnh mức độ gây xao nhãng và thậm chí cung cấp layout dọc, trong khi Ropuka và Tiny Pasture ưu tiên khả năng thay đổi vùng hiển thị; đây là những precedent tốt cho việc xem camera/viewport như một tính năng cốt lõi thay vì phần phụ. citeturn15view1turn13view1turn13view2

HUD hiện tại cũng nên thu nhỏ. Đồng hồ, weather, speed và camera controls có thể nằm trong một top bar mỏng, còn debug information như map size/FPS/NPC count nên ẩn sau debug toggle.

## Hệ thống gameplay và kỹ thuật đề xuất

Trọng tâm gameplay không phải “người chơi làm gì?” mà là **“thế giới làm gì khi người chơi không làm gì?”**.

| Hệ thống | MVP nên có | Sau MVP |
|---|---|---|
| NPC navigation | A*, terrain cost, destination/POI | congestion, shortcuts, dynamic obstacles |
| NPC routine | home, work, eat, wander, social, shelter, sleep | traits, relationship nhẹ |
| Time | 24h, dawn/day/dusk/night | weekday/weekend, seasonal length |
| Weather | clear/cloud/rain/fog | storm, snow, seasonal weather |
| World response | wet ground, puddle, lights, fog | mud, snow cover, vegetation seasonal state |
| Events | social, cart, birds, market, sheltering | festival, construction, rare events |
| Camera | pan/zoom/fit/follow | director/cinematic interest scoring |
| Audio | day/night/rain ambience, one-shots | district-specific soundscape |
| Save | seed, time, NPC state, weather | world history, migrations |

**NPC navigation** nên thay fixed-route bằng grid pathfinding. Một cost model ban đầu có thể là main road = `1.0`, side path = `1.1`, plaza = `1.0`, grass = khoảng `1.8–2.5`, còn water/building là blocked. Như vậy NPC vẫn thích dùng đường, nhưng khi cần có thể băng qua sân/công viên hoặc lựa chọn đường phụ. Đây là tham số thiết kế đề xuất, cần tune bằng playtest chứ không phải một chuẩn bắt buộc.

Quan trọng hơn A* là **destination system**. Random-walk thuần túy thường tạo movement nhưng không tạo “cuộc sống”. Mỗi NPC nên có home, role, một nhóm POI ưa thích, speed, sociability và vài trait rất nhẹ. State machine có thể chỉ gồm:

`Sleep → Home → Commute → Work/Errand → Eat → Wander → Social → Shelter → Return`

Không cần AI phức tạp kiểu LLM, dialogue hoặc planning tree. WorldBox cho thấy chỉ cần needs/traits gắn với autonomous behavior đã đủ giúp sinh vật có vẻ như đang tự sống. citeturn12view0

**Ngày–đêm** nên là một hệ thống chứ không phải overlay. Đề xuất một ngày game khoảng **15 phút mặc định**, cấu hình được 10–30 phút, kèm pause/1×/2×/4×. Dawn, daytime, golden hour, dusk và night cần blend liên tục. Đồng thời schedule NPC đổi, street/window lights bật, chimney smoke thay đổi, ambient sound crossfade và outdoor activity giảm vào đêm. Chillquarium đã dùng real-time day/night như một phần trực tiếp của trải nghiệm thư giãn, củng cố việc thời gian có thể tạo variation ngay cả trong một game idle. citeturn13view0

**Weather MVP** nên có `Clear`, `Cloudy`, `Rain`, `Fog`; Storm để sau. Mỗi state có intensity `0–1`, thời lượng tối thiểu và transition dài khoảng 30–90 giây để tránh hiện tượng trời đổi tức thì.

Một nguyên tắc bắt buộc nên là:

> **Weather chỉ được coi là hoàn thành khi tác động ít nhất bốn lớp: lighting + map + audio + NPC behavior.**

Ví dụ với mưa:

`Clouds → ánh sáng tối/mềm → rain particles → ground wetness → road darkens → puddle → roof drip/water ripple → NPC lấy umbrella hoặc chạy tới shelter → outdoor activity giảm → rain ambience tăng → sau mưa puddle còn lại một lúc.`

Fog thì giảm contrast ở background/world distance thay vì chỉ phủ một hình chữ nhật xám lên màn hình. Clear/cloudy thay đổi shadow intensity và foliage ambience. Cách này giúp “map thay đổi theo thời tiết” đúng với yêu cầu, thay vì weather chỉ là hiệu ứng trang trí.

Để tăng watchability, nên có **micro-event scheduler** phụ thuộc `district + time + weather`. Event không cần quest:

- cart/delivery đi qua main road;
- stall mở buổi sáng, đóng buổi tối;
- hai NPC đứng nói chuyện rồi tách ra;
- nhóm nhỏ tụ ở plaza;
- chim đáp xuống rồi bay đi;
- chó/mèo đi dạo;
- trẻ chạy về nhà lúc trời mưa;
- NPC đứng trú dưới mái hiên;
- chuông vang theo giờ;
- chimney smoke mạnh hơn sáng/tối;
- lights bật dần vào dusk;
- chim tắm trong puddle sau mưa.

Mỗi event có cooldown và budget để màn hình **sống nhưng không hỗn loạn**.

Về kỹ thuật, nếu codebase hiện tại là Phaser/web hoặc kiến trúc tương tự, **không có lý do mặc định phải rewrite engine**. Phaser Tilemap hỗ trợ dữ liệu map nhiều layer, đọc Tiled JSON và chỉnh tile runtime; nó cũng parse Object Layers từ Tiled. citeturn14view0 Tiled hỗ trợ fixed hoặc infinite maps, đồng thời cung cấp Tile Layer, Object Layer và Image Layer với ordering/parallax; do đó có thể tách ground, decal, road, buildings, event markers và foreground một cách sạch hơn. citeturn15view3turn15view4

Một workflow phù hợp là:

`Tiled map → tile layers + object metadata → runtime world model → simulation → renderer`

Object layer nên chứa `buildingEntrance`, `spawnPoint`, `POI`, `districtBoundary`, `eventAnchor`, `weatherShelter`. Render layer không nên là nơi chứa logic NPC.

Ở runtime, nên **tách Simulation State khỏi Renderer**. Simulation có thể tick cố định khoảng 5–10 Hz trong khi rendering chạy theo frame; NPC offscreen có thể update thưa hơn. Dùng spatial partition/chunk để không scan toàn bộ map mỗi tick. Chỉ khi profiling cho thấy simulation JavaScript thật sự block UI mới đưa một phần logic sang Web Worker; MDN xác nhận Web Workers chạy script ở background thread tách khỏi main execution/UI thread. citeturn15view5

Vì mục tiêu là **PC local, không deploy**, kiến trúc nên local-first: không backend, không auth, không API bắt buộc, save local gồm `worldSeed`, `gameTime`, `weather state/intensity`, core NPC state, map mutations và settings. Seed cố định cũng giúp QA tái hiện bug.

## Master Plan triển khai

Thứ tự triển khai quan trọng hơn số lượng feature. Nếu thêm weather trước khi sửa map/NPC, game vẫn giống prototype có particle. Nếu mở map trước khi có asset variation, game chỉ thành một prototype lớn và trống. Vì vậy roadmap nên đi từ **foundation → presentation → spatial structure → behavior → environmental systems → ambient content → polish**.

| Phase | Việc chính | Điều kiện hoàn thành | Ước lượng đề xuất* |
|---|---|---|---:|
| **Foundation** | Audit code, tách simulation/render, seed, debug metrics | Có FPS/sim tick metrics; state model rõ; save seed | 2–4 ngày |
| **Visual & Camera** | Responsive viewport, pan/zoom, house/terrain variation, shadows/props | Nhìn đẹp hơn rõ rệt ngay cả khi NPC chưa đổi | 1–2 tuần |
| **World Expansion** | 96×96, districts, road hierarchy, POI, plaza/water/park | World lớn 4× diện tích logic nhưng không bị trống | 1–2 tuần |
| **NPC & Navigation** | A*, terrain costs, destination graph, schedule, social behavior | NPC không còn bị khóa vào một lane | 1–2 tuần |
| **Day/Night** | light curve, window/street lights, schedule/audio | Nhìn ảnh tĩnh cũng đoán được sáng/trưa/tối | 4–7 ngày |
| **Weather & Map Response** | rain/cloud/fog, wetness, puddle, shelter behavior | Weather tác động đủ 4 lớp | 1–2 tuần |
| **Ambient Content** | micro-events, birds/pets/cart/market/smoke | 5 phút quan sát có ít nhất 3 loại event | ~1 tuần |
| **Performance & Polish** | culling, pooling, save/load, soak test, bug pass | Chạy local lâu ổn định, không path deadlock phổ biến | ~1 tuần |

\* Đây là estimate lập kế hoạch cho **một developer đã quen codebase**; custom art mới nhiều có thể làm thời gian tăng đáng kể.

Acceptance criteria cấp sản phẩm nên được chốt ngay từ đầu, để tránh cảm giác “thêm rất nhiều nhưng game vẫn như cũ”:

**Navigation:** NPC thường đi đường nhưng không bị khóa vào một đường màu vàng duy nhất. Giữa các district chính có nhiều route hợp lệ.

**Visual:** house kit có ít nhất 4–6 silhouette hoặc cấu hình dễ phân biệt; terrain có variation và edge; props/shadow/layering khiến mỗi khu vực có character riêng.

**World:** 96×96 là target đầu; ít nhất ba district, khoảng 20+ POI/event anchor và đủ building entrance để NPC có destination thật.

**Camera:** manual pan/zoom, overview/fit và follow/cinematic mode đều hoạt động. Zoom mặc định rộng hơn prototype nhưng NPC vẫn đọc được.

**Time:** không nhìn UI vẫn phân biệt được dawn/day/dusk/night.

**Weather:** người dùng nhận ra rain/fog/cloud state ngay cả khi tắt particle, vì lighting/map/NPC/audio cũng thay đổi.

**Watchability:** trong một phiên quan sát 5 phút ở seed test phải có ít nhất ba category micro-event khác nhau.

**Performance:** target thiết kế là 60 FPS render trên máy dev mục tiêu; test 25/50/100/200 NPC, test viewport 1366×768, 1920×1080 và ultrawide; soak test 60–120 phút trước khi tăng scope. Đây là target nội bộ đề xuất, cần điều chỉnh sau profiling.

**Scope gate:** chưa thêm seasons, festival lớn, economy, construction growth hoặc relationship system cho tới khi vòng lặp “chỉ nhìn vẫn thú vị” đạt yêu cầu.

Điểm tôi đánh giá là **ưu tiên cao nhất** không phải weather. Thứ tự giá trị nên là:

**Camera + visual variation → map structure → NPC navigation/routine → day/night → weather response → ambient events.**

Lý do là người chơi sẽ nhìn thấy camera, asset repetition và movement pattern trong vài giây đầu. Weather dù làm tốt cũng không cứu được một map nhỏ với NPC vẫn chạy trên một line cố định.

## Cấu trúc các plan con

Master Plan được chia thành bảy workstream đủ độc lập để có thể triển khai như các sprint/plan con, nhưng vẫn dùng chung acceptance criteria.

| Plan con | Phạm vi |
|---|---|
| **Visual Direction & Camera** | art bible, viewport, zoom/pan/follow, house kit, terrain variation, layering |
| **World / Map Expansion** | 96×96, district, road hierarchy, POI, entrance, Tiled workflow |
| **NPC AI & Navigation** | A*, terrain cost, schedule, FSM/utility, social behavior, path recovery |
| **Day/Night & Weather** | time state, lighting, weather state machine, wetness/fog/puddle, NPC reactions |
| **Ambient Events & Audio** | event scheduler, cart/birds/pets/market, ambience buses, positional SFX |
| **Technical / Local Save / Performance** | simulation-render separation, local save, culling/chunking, profiling |
| **QA / Balancing / Polish** | seed test matrix, NPC counts, viewport matrix, save transition tests, soak tests |

Phần đáng chú ý nhất trong plan NPC là không “nâng AI” theo hướng complexity. Thay vào đó, AI phải **đọc được bằng mắt**: người xem hiểu NPC đang về nhà, đang đi làm, đang trú mưa hoặc đang tụ tập. Đây chính là loại autonomous behavior giúp WorldBox và Ages of Conflict tạo giá trị quan sát, dù hai game có scope simulation lớn hơn nhiều. citeturn12view0turn12view1

Tương tự, Visual Plan ưu tiên **variation rules** hơn số lượng sprite thô. Townscaper là ví dụ đặc biệt rõ: thuật toán chuyển các cấu hình cơ bản thành nhiều cấu trúc thị giác khác nhau, cho thấy một hệ thống variation tốt có thể tạo cảm giác phong phú mà không cần mỗi trường hợp là một asset hoàn toàn độc lập. citeturn13view3

Về lâu dài, sau khi các plan trên đạt Definition of Done, phase tiếp theo mới đáng cân nhắc các hệ thống như **seasons**, **festival**, **construction/renovation**, **population aging**, **shop schedules**, **rare weather events** hoặc **world history**. Trong đó world history là một pattern đáng học từ Ages of Conflict, nơi game lưu history/statistics của simulation để biến những gì đã xảy ra thành nội dung có thể xem lại. citeturn12view1 Nhưng đây nên là phase sau; trước mắt, giá trị lớn nhất vẫn là làm cho **một màn hình đang chạy ở thời điểm hiện tại đủ thú vị để nhìn**.

## Tài liệu đã bàn giao

Tôi đã tổng hợp nghiên cứu, kiến trúc đề xuất, roadmap, acceptance criteria, risk và nguồn tham khảo vào một **Master Plan DOCX**, sau đó tách thành **bảy plan con** đúng theo hướng “plan lớn → plan nhỏ” mà yêu cầu đặt ra.

**Master document:** [Tải 00_Master_Plan_Living_Settlement.docx](sandbox:/mnt/data/living_settlement_research_plan/00_Master_Plan_Living_Settlement.docx)

| Tài liệu | File |
|---|---|
| Visual Direction & Camera | [01_Visual_Direction_and_Camera.docx](sandbox:/mnt/data/living_settlement_research_plan/01_Visual_Direction_and_Camera.docx) |
| World / Map Expansion | [02_World_Map_Expansion.docx](sandbox:/mnt/data/living_settlement_research_plan/02_World_Map_Expansion.docx) |
| NPC AI & Navigation | [03_NPC_AI_and_Navigation.docx](sandbox:/mnt/data/living_settlement_research_plan/03_NPC_AI_and_Navigation.docx) |
| Day/Night & Weather | [04_Day_Night_and_Weather.docx](sandbox:/mnt/data/living_settlement_research_plan/04_Day_Night_and_Weather.docx) |
| Ambient Events & Audio | [05_Ambient_Events_and_Audio.docx](sandbox:/mnt/data/living_settlement_research_plan/05_Ambient_Events_and_Audio.docx) |
| Technical / Local / Performance | [06_Technical_Local_and_Performance.docx](sandbox:/mnt/data/living_settlement_research_plan/06_Technical_Local_and_Performance.docx) |
| QA / Balancing / Polish | [07_QA_Balancing_and_Polish.docx](sandbox:/mnt/data/living_settlement_research_plan/07_QA_Balancing_and_Polish.docx) |

**Gói đầy đủ Master Plan + toàn bộ plan con:** [Tải Living_Settlement_Research_and_Plans.zip](sandbox:/mnt/data/Living_Settlement_Research_and_Plans.zip)

Các file hiện được tạo dưới dạng DOCX local để có thể mở trực tiếp bằng Word hoặc import vào Google Docs. Kết nối Google Drive chưa hoạt động trong phiên này, vì vậy tài liệu chưa được ghi trực tiếp vào một Google Docs trên tài khoản của người dùng.
