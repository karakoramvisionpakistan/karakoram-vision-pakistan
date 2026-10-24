// Har page ke apne FAQs set karta hai (pehle sab par ek hi generic FAQ thi).
//   node tools/apply-faqs.mjs           -> sirf dikhata hai
//   node tools/apply-faqs.mjs --write   -> files badal deta hai
// Sirf front matter ki `faqs:` list badalti hai. Page ka content nahi chhedta.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

const FAQS = {
  "src/content/trekking/k2-base-camp-baltoro-trek.md": [
    ["How hard is the K2 base camp trek?",
     "It is a demanding trek rather than a climb. There is no technical climbing, but you walk six to eight hours a day for about two weeks, much of it on the rough moraine of the Baltoro Glacier, and you sleep above 4,000m for several nights. Regular hill walking with a loaded pack for three to four months beforehand is the best preparation."],
    ["When is the best time for the K2 base camp trek?",
     "Late June to early September. July and August are the most settled, which is also when the expedition teams are on the Baltoro, so the glacier feels busy and alive. Shoulder dates can bring snow on the higher camps."],
    ["Do I need a permit for the Baltoro and Concordia?",
     "Yes. The route runs through Central Karakoram National Park, so park fees and trekking paperwork apply, and foreign trekkers are registered before leaving Skardu. We handle the permits, registration and the Askole road arrangements."],
    ["What is included and what do I carry myself?",
     "Porters carry the group kit and your duffle up to an agreed weight; you walk with a daypack. Tents, kitchen, cook, guide, permits and transport from Skardu are arranged by us. Send your dates for a written list of inclusions and current costs."],
  ],
  "src/content/trekking/gondogoro-la-circuit-trek.md": [
    ["How difficult is the Gondogoro La crossing?",
     "This is the hardest of our trekking routes. The pass itself is a pre-dawn climb on snow and ice with fixed ropes, harness and crampons, led by climbing guides. Everything below the pass is normal Baltoro trekking, but the crossing day demands fitness and a head for steep ground."],
    ["Is the pass always open?",
     "No. It opens only when the snow, ice and rope conditions allow, usually from mid-July to late August, and the decision is made on the mountain by the guides. If the pass is closed the group returns down the Baltoro the way it came, which is why the itinerary allows spare days."],
    ["Do I need climbing experience?",
     "Previous glacier or via ferrata experience helps, but is not essential. Our guides fix the ropes and brief the team beforehand. What matters more is strong trekking fitness and comfort on exposed, steep snow."],
    ["How is this different from the K2 base camp trek?",
     "The first part is the same \u2014 Askole, Baltoro, Concordia and K2 base camp. Instead of walking back the same way, this route crosses Gondogoro La into the Hushe valley, giving the famous view of K2, Broad Peak and the Gasherbrums from the pass."],
  ],
  "src/content/trekking/biafo-hisper-trek.md": [
    ["What makes the Biafo Hispar traverse special?",
     "It links Baltistan with Hunza across 116km of connected glacier, the longest glacial system outside the polar regions, passing Snow Lake on the way. You cross from one side of the Karakoram to the other entirely on ice and high pasture."],
    ["How high is the Hispar La pass?",
     "The pass sits at 5,151m. The trek builds up to it slowly over several days, which gives the acclimatisation needed before the crossing."],
    ["When can this trek be done?",
     "Usually from the start of July to the end of August, when the snow bridges and crevasse conditions on Snow Lake are at their most reliable."],
    ["How fit do I need to be?",
     "Fit enough for 22 days of continuous glacier walking with no road access in the middle. There is no technical climbing, but the team is roped on the glacier sections and you should be comfortable with long days and camp life."],
  ],
  "src/content/trekking/fairy-meadows-nanga-parbat-base-camp-trek.md": [
    ["How hard is the Fairy Meadows trek?",
     "Moderate. The walk from Tato to Fairy Meadows takes about two to three hours uphill, and the days beyond to Beyal and the base camp viewpoint are gentle by Karakoram standards. Most reasonably fit travellers manage it."],
    ["How do you get to Fairy Meadows?",
     "From the Karakoram Highway at Raikot Bridge a jeep climbs the narrow mountain track to Tato village, and from there it is a walk up to the meadows. The jeep road is seasonal and only local drivers run it."],
    ["When is Fairy Meadows open?",
     "Roughly May to October, depending on snow. June to September gives the most reliable weather and the clearest views of the Raikot face of Nanga Parbat."],
    ["Where do you sleep?",
     "In wooden huts or tented camps at Fairy Meadows and Beyal. They are simple \u2014 no heating beyond a stove and limited electricity \u2014 so warm clothing matters even in summer."],
  ],
  "src/content/trekking/rakaposhi-base-camp-trek.md": [
    ["Is Rakaposhi base camp a good first trek in Pakistan?",
     "Yes. Seven days, a short walk-in from Minapin, and a base camp with one of the most direct views of a 7,000m face anywhere. It suits travellers who want a real Karakoram trek without two weeks on a glacier."],
    ["How long is the walk each day?",
     "Four to six hours on trekking days, with one steeper climb to Hapakun and on to Tagafari base camp. Nights are in tents at around 3,000m to 3,500m."],
    ["What is the best season for Rakaposhi base camp?",
     "May to early October. The meadows are greenest in June and July; late September and October bring clear air and autumn colour in Nagar valley."],
    ["Can it be combined with Hunza?",
     "Easily. Minapin is on the Karakoram Highway between Gilgit and Hunza, so most travellers add Karimabad, Attabad Lake and Passu before or after the trek. Ask us to plan the combination."],
  ],
  "src/content/trekking/rush-lake-trek.md": [
    ["How high is Rush Lake?",
     "Rush Lake lies at about 4,694m, with Rush Pari peak above it, and is counted among the highest alpine lakes in the world. The views take in Rakaposhi, Diran and the Spantik massif."],
    ["Why does this trek take 14 days?",
     "The extra days are for acclimatisation and weather. Gaining almost 4,700m from Nagar valley needs a careful profile, and spare days keep the summit-day views from depending on a single morning."],
    ["How difficult is it?",
     "Challenging. There is no technical climbing, but the ground is steep in places, the altitude is real, and camps are high and cold. Previous trekking experience is a good idea."],
    ["When is the best time for Rush Lake?",
     "Late June to mid-September, once the snow has cleared from the upper meadows and the lake is reachable."],
  ],
  "src/content/trekking/nangma-valley-trek.md": [
    ["Why is Nangma called the Yosemite of Pakistan?",
     "Because of the granite. The valley is ringed by big vertical walls and towers that attract rock climbers from around the world, and the floor of the valley is soft green pasture \u2014 the contrast is what people remember."],
    ["Is this trek suitable for beginners?",
     "Yes. It is rated easy, the walking days are short, and the base camp is reached in a day or two from Kanday village. It works well for families and for travellers with limited time."],
    ["How do you reach Kanday?",
     "By road from Skardu, around five hours through the Shyok valley and Hushe road. We arrange the jeep, driver and the local porters from the village."],
    ["Can climbers use this as a base?",
     "Yes. Many teams camp in the valley for days or weeks to climb the surrounding walls. We can arrange extended camp support, cook and porters for climbing groups."],
  ],
  "src/content/trekking/majrooh-top-trek.md": [
    ["What do you see from Majrooh Top?",
     "A wide panorama of the central Karakoram from 4,850m, reached on a short, non-technical route. It gives a high mountain view without the two-week commitment of the Baltoro treks."],
    ["How hard is it?",
     "Easy by Karakoram standards, but the top is high, so the days are planned to let you acclimatise. Anyone comfortable with uphill walking for a few hours a day should manage it."],
    ["Who discovered this route?",
     "It was explored in 2008 by Muhammad Ali, the founder of Karakoram Vision Pakistan, and we have been running it since. It is still one of the quietest viewpoints in the region."],
    ["What is the best season?",
     "June to September, when the high pastures are open and the top is clear of snow."],
  ],
  "src/content/trekking/thalle-la-trek.md": [
    ["Where does the Thalle La trek go?",
     "It crosses from the Shigar side over the Thalle La pass down into Khaplu, through summer pastures and small Balti villages. It is an old trading route between two valleys rather than a trek to a base camp."],
    ["Is it suitable for first-time trekkers?",
     "Yes. It is rated easy, the crossing is a walk rather than a climb, and at nine days it is one of the shortest ways to see village life in Baltistan on foot."],
    ["What is the accommodation like?",
     "Tented camps on the trek, with hotels in Skardu, Shigar and Khaplu at either end. Our cook travels with the group and all camp equipment is carried by porters."],
    ["When can it be walked?",
     "Usually June to September, when the pass is clear of snow and the shepherds are up at the summer settlements."],
  ],
  "src/content/expeditions/k2-expediiton.md": [
    ["How long does a K2 expedition take?",
     "Sixty days from Islamabad to Islamabad: about a week of travel and preparation, seven days of trekking in to base camp, forty days on the mountain for rotations and the summit window, and the return."],
    ["What does Karakoram Vision provide on K2?",
     "Climbing permit and invitation letter, liaison officer, transport, hotels in Islamabad and Skardu, the full base camp setup with kitchen, dining, shower and generator, and porter logistics to base camp. Services above base camp are arranged separately on request."],
    ["Is oxygen and high-altitude support included?",
     "No. Oxygen, climbing gear, high-altitude porters above base camp and helicopter rescue deposits are quoted separately so each team pays only for what it uses. We arrange all of them on request."],
    ["What experience do you need for K2?",
     "Previous 8,000m experience is expected, or at the very least a successful 7,000m climb with high-altitude rotations. K2 is technical from low on the route and the weather windows are short."],
  ],
  "src/content/expeditions/broad-peak-expedition.md": [
    ["Is Broad Peak a good first 8,000m peak?",
     "It is often chosen as one, because the route is less technical than K2 and shares the same Baltoro approach and base camp area. The summit ridge is still long and exposed, and the altitude is unforgiving."],
    ["What is included in your Broad Peak expedition?",
     "Climbing and park permits, liaison officer expenses, the Mountaineering e-visa invitation letter, airport transfers, hotels, trekking meals and all logistics up to base camp."],
    ["How long are you on the mountain?",
     "The programme runs 50 days in total, which allows for the trek in, acclimatisation rotations, a realistic summit window and weather delays on the Baltoro."],
    ["Can Broad Peak be combined with K2 or Gasherbrum?",
     "Yes. Teams often share the same base camp period and add a second objective. Tell us both peaks and we will plan permits and logistics together."],
  ],
  "src/content/expeditions/gasherbrum-ii-expedition.md": [
    ["Why do climbers choose Gasherbrum II?",
     "At 8,035m it is considered one of the more approachable 8,000m peaks, with a route that is mostly snow and ice rather than hard technical climbing, reached from the same Baltoro approach as K2."],
    ["What permits are needed?",
     "A climbing permit, Central Karakoram National Park fees and a liaison officer. We handle the applications and send an invitation letter for the Pakistan mountaineering visa."],
    ["How many days does the expedition run?",
     "Fifty days from Islamabad, including the Baltoro trek in, acclimatisation rotations, the summit window and the return."],
    ["Can Gasherbrum I and II be done in one trip?",
     "Yes, many teams do. Both share the same base camp, so the extra cost is mainly the second permit. Ask us for a combined quote."],
  ],
  "src/content/expeditions/ghasherbrum-1.md": [
    ["How high is Gasherbrum I?",
     "8,080m, also known as Hidden Peak, the eleventh highest mountain in the world. It stands at the head of the Baltoro, deep in the Karakoram behind the Gasherbrum wall."],
    ["Is Gasherbrum I harder than Gasherbrum II?",
     "Yes. The Japanese Couloir and the upper route are steeper and more committing, and the summit day is longer. Teams usually come with previous 8,000m experience."],
    ["What does the expedition include?",
     "Permits and liaison officer, invitation letter, transport and hotels, Baltoro trek in with porters, and full base camp services. Oxygen, personal gear and services above base camp are arranged separately."],
    ["When is the climbing season?",
     "June to August. The 50-day programme is built around the summit windows that usually appear in July."],
  ],
  "src/content/expeditions/nanga-parbat-expedition.md": [
    ["Why is Nanga Parbat called the Killer Mountain?",
     "Because of its history. The mountain claimed many lives in the early attempts before the first ascent in 1953, and its faces \u2014 especially the Rupal face, the highest mountain wall in the world \u2014 remain serious undertakings."],
    ["How long is the expedition?",
     "Forty-two days from Islamabad, which allows for the approach, acclimatisation rotations, the summit window and weather delays."],
    ["Which side do you climb from?",
     "Most teams use the Diamir side, reached from the Karakoram Highway rather than from Skardu. Tell us your intended route and we will plan permits and base camp accordingly."],
    ["What support do you provide?",
     "Permits and liaison officer, invitation letter for the mountaineering visa, transport, hotels, porters and the base camp setup with kitchen and dining. High-altitude support and oxygen are arranged on request."],
  ],
  "src/content/expeditions/laila-peak-expedition.md": [
    ["What is special about Laila Peak?",
     "Its shape. The blade-like spire above the Gondogoro glacier is one of the most photographed mountains in Pakistan, and the line up its face has been both climbed and skied."],
    ["How technical is the climb?",
     "Serious. The face is sustained and steep, and teams need solid alpine experience with snow and ice. This is not a trekking peak despite its modest height compared with the 8,000ers."],
    ["How do you reach the mountain?",
     "By road from Skardu to the Hushe valley, then on foot up to the Gondogoro glacier with porters. The approach takes a few days and doubles as acclimatisation."],
    ["What is the season?",
     "June to August for climbing. The 30-day programme covers the approach, acclimatisation, the climb and the return to Skardu."],
  ],
  "src/content/expeditions/spantik-peak-expedition.md": [
    ["Is Spantik a good first 7,000m peak?",
     "It is one of the most popular choices in Pakistan for exactly that reason. The normal route from the Nagar side is mostly a long snow climb without sustained technical difficulty, which makes it a realistic step up from trekking peaks."],
    ["How high is Spantik and why is it called Golden Peak?",
     "7,027m. The name comes from the colour the south-east face takes at sunset; the same mountain is known as Spantik from the Arandu side, where the famous Golden Pillar route lies."],
    ["What fitness and experience do I need?",
     "Comfort with crampons, ice axe and roped glacier travel, plus the stamina for several weeks of camp life. Previous experience above 5,000m is strongly recommended."],
    ["How long does the expedition take?",
     "Thirty-five days, covering the approach from Nagar or Arandu, acclimatisation rotations on the mountain, the summit window and the return."],
  ],
  "src/content/expeditions/trango-expedition.md": [
    ["What are the Trango Towers?",
     "A group of granite towers above the Baltoro glacier with some of the largest cliffs on earth. Great Trango and the Nameless Tower draw big-wall climbers from everywhere."],
    ["Who is this expedition for?",
     "Experienced big-wall and aid climbers. The approach is a normal Baltoro trek, but the climbing is vertical granite at altitude and teams are self-sufficient on the wall."],
    ["What does Karakoram Vision arrange for Trango teams?",
     "Permits and liaison officer, transport and hotels, porters to base camp, and the base camp setup with cook and kitchen while your team works on the wall."],
    ["How long do teams stay?",
     "The programme runs 33 days, which is a usual length for one objective. Longer stays can be arranged for teams planning several routes."],
  ],
  "src/content/tours/hunza-valley-heritage-tour.md": [
    ["What does the Hunza heritage tour cover?",
     "Ten days through Gilgit, Nagar and Hunza: Baltit and Altit forts in Karimabad, Attabad Lake, the Passu Cones, Rakaposhi viewpoint and village walks, with time to sit and watch the valley rather than rush through it."],
    ["When is the best time to visit Hunza?",
     "Late March to mid-April for apricot and cherry blossom, May to September for clear warm days, and mid-October to early November for autumn colour. Winter is quiet and cold but the valley stays open."],
    ["Is the tour private or in a group?",
     "Private by default: your own vehicle, driver and guide, and dates that suit you. Group sizes of two to twelve work comfortably on this route."],
    ["How do you travel there from Islamabad?",
     "By road along the Karakoram Highway, broken into comfortable driving days with stops. Flights to Gilgit are possible but weather-dependent, so we plan around road travel and adjust if a flight becomes available."],
  ],
  "src/content/tours/autumn-hunza-skardu-tour.md": [
    ["When exactly is autumn colour at its best?",
     "Usually from mid-October into the first week of November, with Hunza turning before Skardu. Exact timing shifts each year with the weather, so we advise on dates once you tell us which week you can travel."],
    ["Why does this tour take 14 days?",
     "Because it covers both valleys. Hunza and Skardu are on different sides of the mountains, with a long drive or flight between them, and the extra days mean you see the colour in both rather than racing through one."],
    ["How cold is it in October and November?",
     "Pleasant in the day, cold at night, with frost in the high valleys by late October. Warm layers and a proper jacket are needed; hotels are heated but not always well."],
    ["Can photographers get extra time at viewpoints?",
     "Yes. This itinerary is often booked by photographers, and we build in early starts and unhurried stops. Tell us the shots you want and the driver and guide will plan around the light."],
  ],
  "src/content/tours/spring-bloosom-tour.md": [
    ["When is blossom season in Hunza and Gilgit-Baltistan?",
     "Usually from late March to mid-April, starting lower in the valleys and moving upward. Apricot comes first, then cherry and apple. Dates shift by a week or two each year with the winter."],
    ["What does the 16-day tour include?",
     "Hotels, private transport with driver, a local guide and the main sightseeing across Gilgit-Baltistan, planned at an easy pace so you can stop whenever the orchards are at their best."],
    ["Is the weather reliable in spring?",
     "Spring is beautiful but changeable: warm afternoons, cold nights, and the chance of rain or late snow on the passes. The itinerary keeps flexibility for road conditions."],
    ["Can the tour be shortened?",
     "Yes. Shorter blossom trips focused on Hunza alone are possible. Send your dates and the number of days you have and we will propose a version that fits."],
  ],
  "src/content/tours/gilgit-baltistan-grand-circuit.md": [
    ["What does the grand circuit cover?",
     "Fourteen days linking Gilgit, Hunza, Skardu, Shigar and Khaplu \u2014 the Karakoram Highway, the forts and the Baltistan valleys in one journey, without doubling back."],
    ["Is 14 days enough for all of it?",
     "It is the shortest comfortable length for this route. Shorter versions mean long driving days; longer versions add Deosai, Fairy Meadows or free days in the valleys."],
    ["How much driving is involved each day?",
     "Mostly three to six hours, with a couple of longer legs between regions. Stops for tea, photographs and short walks are part of the plan rather than an interruption."],
    ["Which hotels do you use?",
     "Comfortable mid-range or better hotels, depending on the standard you choose. Baltistan and Hunza both have good options; the remoter valleys are simpler. The exact list is confirmed in your written proposal."],
  ],
  "src/content/tours/deosai-khaplu-tour.md": [
    ["When is Deosai open?",
     "Usually from late May or June until late September or October, depending on snow. Outside that the plateau roads are closed and the tour is planned without them."],
    ["Can you see brown bears on Deosai?",
     "Sometimes. The Himalayan brown bear lives on the plateau and sightings happen, most often early morning or evening, but no one can promise them. Marmots, foxes and birdlife are near certain."],
    ["How high is the Deosai plateau?",
     "Around 4,000m, which is high enough that some travellers feel the altitude. The itinerary reaches it after time in Skardu so you arrive partly acclimatised."],
    ["What is there to see in Khaplu?",
     "The restored Khaplu Palace, the old mosque and wooden village architecture, and the Shyok valley road with views toward the Hushe peaks."],
  ],
  "src/content/tours/fairy-meadows-nanga-parbat-tour.md": [
    ["How do you reach Fairy Meadows from Islamabad?",
     "Drive the Karakoram Highway to Raikot Bridge, change into a local jeep for the climb to Tato, then walk up to the meadows. The jeep track is narrow and only local drivers operate it."],
    ["Is the walk difficult?",
     "Two to three hours uphill at a steady pace. Most travellers of reasonable fitness manage it, and porters or ponies can carry bags."],
    ["When can you see Nanga Parbat clearly?",
     "June to September gives the most reliable views of the Raikot face, with mornings usually clearest. The road is generally open from May to October."],
    ["Where do you stay?",
     "In wooden huts or tented camps at Fairy Meadows. They are simple and cold at night, with limited electricity, but the view from the door is the reason people come."],
  ],
  "src/content/tours/skardu-shigar-valley-explorer.md": [
    ["What do you see on this trip?",
     "Seven days around Skardu: Shangrila and Upper Kachura lakes, the Shigar fort-palace, the Sarfaranga cold desert, Katpana dunes and the Indus valley viewpoints, with free time to add more."],
    ["Is this a good short trip to Pakistan?",
     "Yes. If you have about a week, Skardu gives lakes, desert, heritage and high mountain views in one base, with short daily drives instead of constant travel."],
    ["How do you reach Skardu?",
     "By flight from Islamabad when weather allows, or by road along the Karakoram Highway and Indus valley. We plan for both so a cancelled flight does not end the trip."],
    ["Is it suitable for families?",
     "Yes. The days are short, the roads are reasonable, and nothing requires trekking. We can slow the pace further or add easy walks for older children."],
  ],
  "src/content/jeep-safaris/deosai-jeep-safari.md": [
    ["When does the Deosai road open?",
     "Usually late May or June, once the snow clears, and it stays open until around late September or October. We only run this trip when the plateau route is officially open."],
    ["What kind of vehicle is used?",
     "A 4x4 jeep with an experienced mountain driver. The plateau tracks are rough and river crossings are part of the route, so a normal car cannot be used."],
    ["How high is Deosai and will I feel it?",
     "The plateau sits around 4,000m. Some people notice the altitude, so the itinerary starts in Skardu and climbs gradually, and nights are spent lower where possible."],
    ["What will we see?",
     "Sheosar Lake, wide open plateau, marmots and birdlife, and with luck a Himalayan brown bear. In July the plateau is covered in wildflowers."],
  ],
  "src/content/jeep-safaris/shigar-basho-khaplu-jeep-adventure.md": [
    ["What does this jeep route cover?",
     "Six days through Shigar valley and its fort-palace, the meadows and forest of Basho, and the Shyok valley road east to Khaplu with its restored palace."],
    ["Is Basho reachable by normal car?",
     "No. The track into Basho is rough and often wet, so a 4x4 with a local driver is needed. That is part of why the valley stays quiet."],
    ["Is the trip tiring?",
     "It is rated moderate \u2014 mostly driving with short walks, but mountain roads are bumpy and days can be long. Hotels and guest houses are used each night rather than camping."],
    ["When is the best time to go?",
     "May to October. Basho is greenest in June and July; September and October bring clear views and autumn colour in Shigar and Khaplu."],
  ],
  "src/content/jeep-safaris/untitled.md": [
    ["Where does this 22-day road trip go?",
     "From Islamabad through Gilgit-Baltistan, over to Chitral, and back through Swat \u2014 the long loop that takes in the Karakoram Highway, the high passes and the valleys on both sides."],
    ["Which passes are crossed?",
     "The route uses the high mountain passes linking the regions, including the Shandur area between Gilgit and Chitral, which is only open in the warmer months."],
    ["Is this trip hard going?",
     "It is rated easy in terms of walking, but it is a long road journey. Driving days are broken up with sightseeing and the pace is relaxed, with hotels or guest houses each night."],
    ["When can it be done?",
     "Roughly June to September, when the passes are open. Outside that window the loop cannot be completed and we plan an alternative route."],
  ],
  "src/content/vehicles/toyota-prado-4x4.md": [
    ["Which routes is a Prado suitable for?",
     "Skardu, Deosai, Hunza, Khaplu and the Karakoram Highway, including rough mountain sections where a normal car cannot go. It seats a small family or group of up to four or five comfortably with luggage."],
    ["Does the price include a driver?",
     "Yes. All our vehicles come with an experienced mountain driver who knows the roads and the weather. Self-drive is not offered in these valleys."],
    ["Can I hire a vehicle for part of a trip only?",
     "Yes. Vehicles can be booked by the day, for a single transfer, or for a full itinerary. Tell us the dates and route for a quote."],
    ["Is fuel included?",
     "Fuel, driver allowance and tolls are confirmed in the written quote so there are no surprises on the road. Send your route and we will set it out clearly."],
  ],
  "src/content/vehicles/toyota-hiace-van.md": [
    ["How many people fit in a Hiace van?",
     "Comfortably around eight to twelve passengers with luggage, which makes it the usual choice for families and small tour groups on the Karakoram Highway."],
    ["Is it suitable for mountain roads?",
     "It is ideal for the main highways and sealed valley roads. For rough tracks such as Deosai or Basho, a 4x4 jeep is used instead, and we often combine the two on one trip."],
    ["Does it come with a driver?",
     "Yes, with an experienced driver who knows the routes. We do not offer self-drive hire."],
    ["Can it carry trekking equipment?",
     "Yes. There is room for duffles and expedition loads, and for larger teams we add a second vehicle or a cargo jeep. Tell us your group size and gear."],
  ],
  "src/content/vehicles/coaster-group-transport.md": [
    ["When is a Coaster the right choice?",
     "For larger groups travelling together on the main highways \u2014 student trips, corporate groups and extended families \u2014 where a single vehicle is easier and cheaper than several cars."],
    ["Can a Coaster reach every valley?",
     "No. Larger buses are limited to the main roads. For narrow or rough sections we switch the group into jeeps, which we arrange as part of the same booking."],
    ["Is a driver included?",
     "Yes, every vehicle comes with an experienced driver. Fuel, tolls and driver allowance are set out in the written quote."],
    ["How far in advance should we book?",
     "In the summer season larger vehicles get booked early, so a few weeks ahead is sensible. Send your dates and group size and we will confirm availability."],
  ],
  "src/content/hunting-services/permit-mountain-expedition-logistics.md": [
    ["Is trophy hunting legal in Gilgit-Baltistan?",
     "Yes, within the official community-based conservation programme. The government issues a limited number of permits each season for named species and areas, and a share of the fee goes back to the local community that protects the wildlife."],
    ["Which species and seasons apply?",
     "Himalayan ibex and markhor are the main species, hunted in designated conservancies during the official winter season. Quotas and dates are set by the authorities each year, so we confirm what is available before anything is planned."],
    ["What do you arrange?",
     "Permit paperwork and applications, access to the authorised trophy areas, local guides and trackers, camps, transport and all travel logistics in Pakistan."],
    ["How far ahead should this be arranged?",
     "Well in advance. Permits are limited and allocated ahead of the season, so enquiries a year before are normal. Send your intended species and season to start the process."],
  ],
};

const indentOf = (l) => (l.match(/^[ \t]*/) || [''])[0].length;
const isBlank = (l) => l.trim() === '';
// YAML ke liye mehfooz double-quoted string
const q = (s) => JSON.stringify(String(s));

function setFaqs(text, faqs) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  if (lines[0].replace(/^﻿/, '') !== '---') return { error: 'front matter nahi mila' };
  let fmEnd = 1;
  while (fmEnd < lines.length && lines[fmEnd] !== '---') fmEnd++;
  if (fmEnd >= lines.length) return { error: 'front matter band nahi hua' };

  const block = ['faqs:'];
  for (const [question, answer] of faqs) {
    block.push(`  - question: ${q(question)}`);
    block.push(`    answer: ${q(answer)}`);
  }

  let keyAt = -1;
  for (let i = 1; i < fmEnd; i++) if (/^faqs:/.test(lines[i])) { keyAt = i; break; }

  if (keyAt === -1) {
    // faqs key hai hi nahi -> seo: se pehle, warna front matter ke aakhir mein
    let at = fmEnd;
    for (let i = 1; i < fmEnd; i++) if (/^seo:/.test(lines[i])) { at = i; break; }
    lines.splice(at, 0, ...block);
    return { text: lines.join(nl), action: 'added' };
  }

  let last = keyAt;
  for (let i = keyAt + 1; i < fmEnd; i++) {
    if (isBlank(lines[i]) || indentOf(lines[i]) > 0) { last = i; continue; }
    break;
  }
  lines.splice(keyAt, last - keyAt + 1, ...block);
  return { text: lines.join(nl), action: 'replaced' };
}

let changed = 0, problems = 0, total = 0;
for (const [file, faqs] of Object.entries(FAQS)) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  const out = setFaqs(text, faqs);
  if (out.error) { console.log(`${out.error}  ${file}`); problems++; continue; }
  console.log(`${file}  (${faqs.length} FAQs, ${out.action})`);
  for (const [question] of faqs) console.log(`   + ${question}`);
  changed++; total += faqs.length;
  if (WRITE) fs.writeFileSync(file, out.text, 'utf8');
}
console.log(`\n${changed} pages par ${total} FAQs ${WRITE ? 'lag gaye' : 'lagenge'}, ${problems} problem.`);
if (!WRITE) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
