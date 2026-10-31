#!/usr/bin/env node
/**
 * deepen-k2bc.mjs   (website ke folder mein)
 *
 * K2 Base Camp Trek — 21 din ke bayaan.
 *
 * Aap ke din ke unwan aur raat ka thikana nahi badalta. Sirf bayaan
 * badalta hai (2 se 13 alfaaz the), aur bulandi ka khaana bharta hai.
 *
 * KHUD JAANCHTA HAI: Gondogoro ka raasta bhi yahi hai. Script Gondogoro
 * ki file parhta hai aur dekhta hai kahin das lafzon ka ek tukra dono
 * jagah to nahi aa gaya. Agar aaya, to likhta nahi — report deta hai aur
 * ruk jata hai. Do safhon par ek jaisa matan dono ko nuqsan deta hai.
 *
 *   node tools/deepen-k2bc.mjs                  -> sirf dikhana
 *   node tools/deepen-k2bc.mjs --write          -> lagana
 *   node tools/deepen-k2bc.mjs --skip-altitude  -> bulandi na chhuna
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SKIP_ALT = process.argv.includes('--skip-altitude');

const FILE = path.join(ROOT, 'src', 'content', 'trekking', 'k2-base-camp-baltoro-trek.md');
const RIVAL = path.join(ROOT, 'src', 'content', 'trekking', 'gondogoro-la-circuit-trek.md');

/* ===================== 21 DIN ========================================== */
/* key = din ka number. alt = bulandi. d = bayaan. */

const DAYS = {

1: { alt: '507 m', d:
`Your flight lands at Islamabad International and we meet you in the arrivals hall. Islamabad is an unusual capital: laid out on a grid in the 1960s at the foot of the Margalla Hills, green, quiet and low-rise, with monkeys in the forest above the diplomatic quarter. It is also some seven hundred kilometres from the mountain you have come to see, and the next three days exist to close that distance without hurting you.
The afternoon handles the things that are tedious to deal with later. Your passport goes in for trekker registration. We photocopy your insurance policy and the emergency number printed on it, because in a serious situation we telephone your insurer before a helicopter moves. Then your guide goes through your bag with you, item by item, against the list we sent: boots, sleeping bag, glacier glasses, headtorch, gloves, sun cream. Anything missing can be bought or hired here or in Skardu, and it is far better to find the gap tonight than at Paiju with nine days of glacier ahead.
Your main duffle is weighed. It travels on a porter's back from Askole and the limit is 25 kilograms; whatever you do not need on the glacier stays in a locked store at the hotel until you come back for it.
If you land early there is time for Faisal Mosque, the Lok Virsa museum, or nothing more ambitious than tea on the hotel lawn. If you land at three in the morning, as many long-haul flights do, there is a bed waiting. Sleep is the real work tonight. The Skardu flight goes early, and jet lag is much easier to shed here than at four thousand metres.` },

2: { alt: '2,228 m', d:
`The flight to Skardu is one of the great short hops in aviation and we try hard to get you on it. The aircraft lifts out of the Islamabad basin, turns north, and for fifty minutes threads the western Himalaya at roughly the height of the peaks beside it. Nanga Parbat fills the left-hand windows: 8,126 metres, the ninth highest mountain on earth and the most abrupt, its Rupal face dropping four and a half vertical kilometres in one sweep. Then the Indus appears below, brown and enormous, and the aircraft follows it east into Baltistan.
It is flown on sight rather than instruments, which is why it is cancelled so often. If the cloud is in, we drive, and the drive is not a consolation prize: the Karakoram Highway north along the Indus gorge to Chilas, a night there, then the Skardu road east with the river on one side and raw rock on the other. It takes two days and it is one of the most spectacular roads in Asia. It does, however, spend the reserve day built into this itinerary, which is exactly what that day is for.
Skardu sits at 2,228 metres in a wide sandy bowl where the Shigar river meets the Indus, ringed by the brown walls of the Karakoram foothills. It is the administrative centre of Baltistan, the staging post for every expedition on the Baltoro, and the last place with hotels, hot water, a hospital and reliable mobile signal. Make your phone calls home tonight. From Askole onward the only link out is the satellite phone travelling with your guide.` },

3: { alt: '2,228 m', d:
`A full day in Skardu, and it is a working day rather than a tourist one.
Your permit for the Central Karakoram National Park is completed and the park fee paid, your registration as a foreign trekker is finalised with the tourism office, and the jeeps for tomorrow are confirmed with their drivers. Our cook shops for the expedition in the Skardu bazaar, which is worth walking through yourself: apricots drying on rooftops, mounds of rock salt, tailors, blacksmiths, and shops hung with second-hand down jackets and boots left behind by thirty years of expeditions. Whatever you decided to hire rather than fly with gets fitted today, and anything you forgot is almost certainly for sale within three hundred metres.
There is then a proper briefing. Your guide walks the group through the route day by day, the signs of altitude illness and what to do about them, how the toilet tent works, how water is treated, what the porters carry and what you carry, and the single rule that matters most on this trek: tell us how you are feeling honestly, every day, even when you think it will inconvenience the group.
With the afternoon free, Kharpocho fort stands on the bluff above town with the Indus below it, and Satpara lake is a short drive up the valley. Many people spend the time more sensibly: eating, repacking, and sleeping.
Tonight is your last bed, last shower and last unlimited electricity for roughly a fortnight. Charge everything. Fill your power bank. There is no mains supply between Askole and Askole.` },

4: { alt: '3,048 m', d:
`A long, rough and genuinely memorable day in four-wheel drives. The road leaves Skardu along the Shigar valley through apricot orchards and poplar windbreaks, past Shigar's old wooden fort, then turns north into the Braldu gorge and stops pretending to be a road.
What follows is six to eight hours of track cut into the side of a canyon, in places a single vehicle wide, in places with a drop of several hundred metres on the downhill side and no barrier at all. Drivers here are very good and have done this for years. Passengers tend to be quiet. The gorge is a geology lesson at full scale: folded and tilted strata, dry side-valleys that flood without warning in July, and the Braldu river below running grey-white with glacial flour at a volume that makes conversation difficult.
Askole, at 3,048 metres, is the last village in the valley and the end of the road in every sense. Perhaps two hundred stone and mud houses, flat-roofed, terraced fields of barley and potato watered by channels cut from the glacier, apricot and walnut trees, and a population that has supplied porters to Karakoram expeditions since the Duke of the Abruzzi came through in 1909. Every trek and every expedition on the Baltoro starts here.
Camp goes up outside the village. The afternoon and evening belong to logistics: loads are weighed and distributed, the porter team is assembled and recorded, and your guide settles the plan for tomorrow. Walk into the village, drink tea if you are offered it, and go to bed early. The walking starts in the morning.` },

5: { alt: '3,200 m', d:
`The first day on foot, and a kind introduction by Karakoram standards: six to seven hours on a reasonable trail with little height gained.
The path leaves Askole's fields and drops onto the broad gravel flats of the Braldu, where the river braids across a plain several hundred metres wide. Within two hours the snout of the Biafo glacier comes into view on the left, a filthy grey wall of ice and rubble pushing into the valley from the north. The Biafo runs for more than sixty kilometres up to Snow Lake and the Hispar pass, part of one of the longest glacier systems outside the poles, and you walk past the end of it as a sideshow on the way to something else. That is the scale of this valley.
Beyond Biafo the path crosses the Dumordo river. Depending on the season and the water this is done by a jeep bridge, a cable trolley, or a wade with the porters, and your guide decides on the day. Camp is at Jhola, around 3,200 metres, on sand and gravel above the river.
The walking today is easy enough that people talk, and that matters: you will spend two weeks with this group and today is when it becomes one. It is also the day to get your systems right. Learn where things live in your daypack. Drink more than you want to. Deal with the first hot spot on your heel immediately rather than tonight, because a blister at Jhola is a nuisance and the same blister at Urdukas is a serious problem with no road out.` },

6: { alt: '3,450 m', d:
`Six to seven hours up the Braldu valley to Paiju, and the day the mountains stop being distant.
The path stays close to the river on loose grey ground, crossing fans of debris where side-streams have dumped their load, with the valley walls narrowing and rising on both sides. There is almost no shade and the ground reflects heat upward; this is one of the warmer days of the trek and people regularly underestimate how much water it takes.
Then, perhaps three hours in, Paiju Peak appears ahead and to the right, and the rest of the day is spent walking towards it. At 6,610 metres it is not among the giants of this range, but it is close, steep and beautifully proportioned, and because it stands at the gate of the Baltoro it is one of the most photographed peaks in Pakistan. Behind and above it, the first slim granite needles of the Trango group begin to show.
Paiju camp sits at about 3,450 metres on a shoulder below the peak. After a day on bare grey gravel it feels almost absurdly hospitable: willows, a cold spring that genuinely runs clear, and ground soft enough that you do not feel every stone through the mat. Make the most of that tonight, because tomorrow the route steps onto the Baltoro and does not step off it again for eight days.
The camp is busy in season, shared with expedition teams heading for K2, Broad Peak and the Gasherbrums. Porter groups cluster around their own fires. The evening here, with the Trango spires catching the last light above the camp, is the first of this trek's great evenings.` },

7: { alt: '3,450 m', d:
`A rest day at Paiju, and the most important day of the first week.
It is not a reward and it is not padding. You have come from 500 metres to 3,450 in five days. The body's response to thin air is to make more red blood cells, and that takes time it has not yet had. Spending a full day and two nights at this height is what makes Concordia possible later, and groups that skip it pay for it at Goro.
Do not spend the day lying in a tent. Your guide takes anyone who wants it on a short walk a few hundred metres up the slope behind camp, which is the correct way to use a rest day: climb a little, come back down, sleep low. The view from up there takes in the Baltoro snout and the whole gate of the glacier.
Paiju is also the day the expedition reorganises itself. Loads are checked and redistributed, bread is baked for the days ahead, and the porters prepare for glacier travel, which is harder on them than anything behind us. Traditionally this is the day an animal is slaughtered and the porters eat properly before the ice; it is worth understanding that this is a working camp for several dozen men, not only a campsite for you.
Wash today, in the spring, because this is the last running water for a week. Dry your boots. Air your sleeping bag. Then your guide gives the glacier briefing: how to move on moraine, how to follow the route exactly, and why the person in front of you is choosing their line.` },

8: { alt: '3,930 m', d:
`The day you step onto the Baltoro, and the day the trek changes character completely. Six to seven hours.
An hour from camp the path reaches the snout of the glacier, a two-hundred-metre wall of dirty ice with the Braldu river bursting out from underneath it in a cave of blue. That river you have followed for three days is born here, from this ice. From this point there is no path.
The surface of the Baltoro is not ice you can see. It is grey moraine, boulders and rubble lying on top of moving ice, and the walking is unlike anything most people have done: up and over the debris, down into troughs, across meltwater channels, around sinkholes with blue water at the bottom. Nothing is level and nothing is stable. Ankles work harder than lungs. Your guide's exact line matters here, because what was solid last season may be a hole this one.
Above and to the left, the Trango group now stands clear, and the Nameless Tower in particular: a single blade of granite rising more than a thousand metres above its glacier, one of the most coveted big walls on earth. Below it the Great Trango throws down a face that climbers have measured in vertical kilometres. You walk beneath them for most of the day.
Camp is at Khorbortze, around 3,930 metres, on moraine beside the glacier's edge. There is a little grass and a little shelter here, which is why the name means roughly the green and dry place. From tomorrow there is neither.` },

9: { alt: '4,050 m', d:
`A shorter day, four to five hours, and the finest campsite on the Baltoro.
The route continues along the lateral moraine and then climbs onto the ablation valley on the true left bank, the strip of ground between the glacier's edge and the mountainside. The walking is slightly kinder than yesterday and the views are extraordinary in every direction, which makes for slow progress and a great many photographs.
Urdukas sits at about 4,050 metres on a steep grassy shoulder perhaps a hundred metres above the ice, and after two days on grey rubble the grass alone is worth the climb. The tents go on stone-built terraces that generations of expeditions have cut into the slope. There is water, there are wildflowers in July, and there are ibex on the crags above if you watch for long enough.
The reason to come here, though, is the view across the glacier. Directly opposite stands the whole Trango massif with Uli Biaho and the Cathedral Spires beside it, and the light moves across those walls all afternoon and evening. Behind camp, to the south, Masherbrum rises to 7,821 metres, the peak the surveyors first labelled K1 before they settled their numbering on its neighbour.
This is also where altitude starts to be noticeable for most people: shorter breath on the climb into camp, a headache in the evening, broken sleep. That is normal and expected at this height. Tell your guide anyway. He asks every evening for a reason, and a straight answer is more useful than a brave one.` },

10: { alt: '4,380 m', d:
`A long and serious day on the ice, six to seven hours, and the one most people find hardest so far.
The route drops off the Urdukas shoulder and goes back onto the glacier, and this time it stays in the middle of it. The Baltoro here is more than a kilometre wide, and the walking is relentless: moraine ridges to cross one after another, loose rock on ice, no shade, no shelter and nowhere flat. The altitude is now high enough that the pace feels slow even when it is not, and the day is as much about patience as fitness.
What you get in return is the central Karakoram with nothing in the way. Mustagh Tower appears ahead, 7,276 metres, so improbably sheer that the surveyors who first drew it were accused of exaggeration and climbers left it alone until 1956. Masherbrum holds the southern skyline. Ahead, the valley opens and the first eight-thousanders begin to show themselves above the glacier's far end.
Camp at Goro II, around 4,380 metres, is pitched directly on the glacier: tents on flattened moraine over ice, with nothing growing and nothing living. It is cold as soon as the sun goes, and it is where most trekkers first find out how good their sleeping bag really is. Put your water bottle in the bag with you.
Many groups consider the evening at Goro the most atmospheric of the trek. K2 is not yet visible. Broad Peak is, and it is close enough now that you can see the route up it.` },

11: { alt: '4,600 m', d:
`Concordia, and the reason people come to Pakistan.
It is a short day by the standards of this trek, four to five hours, and the group tends to walk it quickly. The glacier bends north-east, the valley widens, and then the route reaches the place where the Baltoro meets the Godwin-Austen glacier coming down from the north and the Vigne coming in from the south, and suddenly there is nothing in front of you at all.
K2 stands at the head of the Godwin-Austen, fifteen kilometres away and eight and a half vertical kilometres high, and it does not look like a mountain so much as an argument. A near-perfect pyramid of rock and ice, steeper than anything around it, with a plume of spindrift off the summit ridge most afternoons. At 8,611 metres it is the second highest mountain on earth and, by common agreement among the people who climb such things, the hardest of the eight-thousanders. Of the fourteen peaks above eight thousand metres, only Annapurna has killed a greater share of those who attempted it.
Turn clockwise from it and you have Broad Peak at 8,051 metres, so close that its three summits are distinct; Gasherbrum IV, whose west face is among the most celebrated walls in mountaineering; Gasherbrum I at 8,080 metres and Gasherbrum II at 8,035; then Chogolisa, Mitre Peak, and the long southern wall above the Vigne.
Four eight-thousanders from one patch of moraine at 4,600 metres. Nowhere else on earth puts that many of them in a single field of view. The name was borrowed from the Place de la Concorde by a survey party who found the comparison obvious; standing on the moraine at 4,600 metres, it is difficult to argue with them.` },

12: { alt: '5,150 m  (Concordia 4,600 m)', d:
`The day you walk to the foot of K2, and the longest day of the trek. Expect a start well before dawn and ten to fourteen hours on the move, and expect to be very tired at the end of it.
The route turns north up the Godwin-Austen glacier, named for the surveyor who mapped this country in 1861, with K2 directly ahead the entire way. It does not appear to get closer for the first three hours, which tells you more about the scale of the Karakoram than any figure can. You pass Broad Peak base camp, usually a small town of tents in July and August, and the hum of a working expedition: loads going up, climbers coming down, the kitchen generators, the laundry.
Then, on a rock promontory below K2, there is the Gilkey Memorial. Art Gilkey died on this mountain in 1953 and his companions could not bring him down. The cairn raised for him now carries plates, plaques and engraved mess tins for the many who have died here since, and reading them is the single most sobering quarter of an hour on the Baltoro. People go quiet.
K2 base camp lies at about 5,150 metres on the glacier under the Abruzzi Spur, the ridge the Duke of the Abruzzi reconnoitred in 1909 and the Italians finally climbed on 31 July 1954. From here the mountain is directly overhead and foreshortened into something that barely looks possible.
Then you turn around and walk back to Concordia. Whether the full excursion runs depends on the day, the weather and the group, and your guide decides.` },

13: { alt: '4,600 m', d:
`A day at Concordia with no distance to cover, held in the itinerary for weather, recovery, or both.
If the last two days have cost you, this is when you get them back: eat, drink, sleep in the afternoon, and let a body that has been working at four and a half thousand metres catch up. If you are strong and the weather is clear, it is one of the best days of the trek to simply be here.
Concordia rewards sitting still. The light moves around the amphitheatre all day and the mountains look like different mountains at six in the morning, at noon and at seven in the evening. K2 usually clouds over by late morning and clears again towards sunset, which is when it is at its most astonishing. Chogolisa, 7,665 metres on the southern skyline, is where Hermann Buhl died in 1957, and Mitre Peak beside it gives the one classic photograph that puts all four eight-thousanders in a single frame.
There is usually an option for a short walk a little way up the Vigne glacier towards the south, or towards Broad Peak base camp if yesterday's excursion was shortened by weather, and your guide will offer whatever the conditions allow.
It is also the day of the reckoning, honestly made. Your guide reviews how everyone has handled the altitude, because from tomorrow the trek turns around and goes down, and down is what the body has been waiting for. Nobody has ever regretted a day at Concordia.` },

14: { alt: '4,380 m', d:
`The trek turns around today, and the walk back down the Baltoro is not the same walk in reverse. Five to six hours to Goro.
The first thing you notice is your own breathing. Four hundred metres of descent at this altitude is a perceptible gift: the legs work, the lungs are not rationing, and the pace that felt punishing on the way up now feels ordinary. Most people cover ground faster going down the glacier than they did coming up it, and arrive in camp wondering why this was ever hard.
The second thing you notice is that you are now looking the other way. Coming up, the Trango spires and Mustagh Tower were ahead of you and the eight-thousanders were a reward at the end. Going down, the giants are behind you and the view in front is the long grey river of ice you have just spent a week on, bending away west between walls that now look familiar. People who were too tired to look up at Goro on the way in tend to stop constantly on the way out.
Turn around often today. K2 is visible from the glacier for part of the morning and then it is not, and most trekkers do not notice the last time they see it until some hours afterwards. Give it a proper look while it is there.
Camp is back at Goro II on the ice, and the second night here is colder in memory and easier in practice, because the body has adjusted and the altitude is now behind you rather than ahead.` },

15: { alt: '4,050 m', d:
`Back down the glacier to Urdukas, five to six hours, and the day the trek becomes comfortable.
The route retraces the central moraine and then climbs back onto the ablation valley and the grassy shoulder. The ground is the same difficult rubble it was a week ago and it is noticeably easier, which has nothing to do with the ground: six days ago you were acclimatising and climbing, and today you are acclimatised and descending. This is the day most trekkers realise how much stronger they have become.
Urdukas in the afternoon sun, with grass underfoot and water running, is one of the simple pleasures of this route. Wash something. Lie down on something soft. There is still ibex on the crags, there are still flowers in the ablation valley, and the Trango walls opposite are still the best seat in the Karakoram.
This is also a good afternoon to watch the porters, who have carried your camp up this glacier and are now carrying it down. They move at a speed that is faintly insulting to anyone who has spent two weeks feeling fit, in sandals or worn boots, with twenty-five kilograms on a rope over the shoulder, and they do it as a job in a short season. If you take one set of photographs home that is not a mountain, make it this one, and ask first.
Appetite usually returns tonight. At Concordia most people pick at dinner. At Urdukas they finish it and ask what else there is.` },

16: { alt: '3,450 m', d:
`Off the glacier and back to Paiju, five to six hours, and a day the senses do most of the reporting.
The route follows the moraine down past Khorbortze and then reaches the snout, where the Braldu comes roaring out of the ice cave, and you step off the Baltoro onto ground that does not move. After eight days it is a genuinely strange sensation: solid earth feels wrong for the first hour, and then it feels extremely good.
What follows is the return of everything the glacier did not have. Willows. Grass. The smell of vegetation and woodsmoke, which after a week of rock and ice is almost overwhelming. Insects, which nobody missed. And oxygen: at 3,450 metres the air has roughly a third more of it than at Concordia, and the effect is immediate and slightly intoxicating. People talk more. Dinner disappears.
Paiju's spring is the first real water for washing in a week and the queue forms early. It is worth it.
This is usually the night the group's mood turns, from the discipline of the high glacier to something closer to celebration, and your crew will often mark it. The hard part of this trek finished somewhere above you this morning. What is left is a walk down a river valley in the sunshine, and tomorrow you will not need to think about altitude at all.` },

17: { alt: '3,200 m', d:
`Down the Braldu valley to Jhola, six to seven hours, retracing the second day of the trek.
It is warm work. The valley floor traps heat, the grey rock reflects it upward, and this is one of the hotter days of the whole route; start early, carry more water than feels necessary, and keep your head covered. The path crosses the same debris fans and the same braided gravel flats, and the river beside you is noticeably higher than it was two weeks ago, because it is now mid-season and the glaciers upstream are melting hard. The Dumordo crossing is managed again by whichever means the water allows, and your guide checks it before the group commits.
The walking is easy now in every sense that matters. There is no altitude to manage, the ground is a path rather than moraine, and the group has two weeks of mountain fitness in its legs. Most people find today passes quickly and spend it talking rather than concentrating.
Camp at Jhola, around 3,200 metres, is the same sand and gravel above the river that you slept on near the start, and it is a good place to notice how much has changed in the fortnight between the two nights. The same tent, the same ground, an entirely different person in the sleeping bag.
Tomorrow is the last day on foot, so tonight is the night to sort out tips with the group and your guide, rather than in a hurry at the roadhead.` },

18: { alt: '3,048 m', d:
`The last day on foot: five to six hours back along the Braldu flats, past the Biafo snout, and into Askole.
It is a straightforward walk and an odd one. Two weeks ago this was the beginning and everything ahead was unknown. Today the same ground is the end, the Biafo glacier is a landmark you recognise rather than a revelation, and the barley terraces of Askole appear in the early afternoon like the edge of the ordinary world. Many people slow down deliberately over the last hour.
Askole is where the expedition dissolves. The porter team is paid off and settled, the loads come off for the last time, and the men who carried your camp to Concordia and back go home up the lane to their own houses. This is the moment for tips, agreed with your guide the night before and handed over properly rather than awkwardly. Say thank you to the kitchen crew in particular; the cook has fed twenty people off a kerosene stove at 4,600 metres for a fortnight.
Depending on the day's timing and vehicle arrangements, the group either camps at Askole tonight or begins the jeep track down the gorge towards Skardu, and your guide confirms the plan in the morning.
Either way, the trekking is finished. Your boots have carried you roughly a hundred and forty kilometres up a glacier to the foot of the second highest mountain on earth and back again, which is worth sitting with for a few minutes before the jeeps arrive.` },

19: { alt: '2,228 m', d:
`Five to six hours of jeep track and road, out of the Braldu gorge and back to Skardu.
The drive is the same spectacular, exposed, slow descent you came up, and it is a different experience in this direction: you know what the drops are now, and you also know what is at the other end of them. The gorge gives way to the Shigar valley, the apricot orchards and poplars return, the Indus appears, and then there is tarmac, which after two weeks feels like a technology.
Skardu delivers, in order, a hot shower, a bed with a mattress, mobile signal and a meal you did not watch being cooked in a tent. Most groups take all four very seriously. Messages home get sent from the hotel lobby and nobody moves quickly for the rest of the afternoon.
There is a formality to complete: a short debriefing at the tourism office, which closes out the trekking permit and the registration from two weeks ago. It is routine and your guide handles the paperwork.
The evening is yours, and it is usually the trip's real dinner, with the guide and the senior crew, somewhere in town. This is the right time to ask your guide the questions you have been saving for a fortnight, about K2, about the valleys, about the expedition seasons he has worked. The answers are better over a table in Skardu than on a glacier in the wind.` },

20: { alt: '507 m', d:
`The flight back to Islamabad, fifty minutes and the same extraordinary line along the mountains, flown in the opposite direction.
If you drove up and flew out, this is the view you missed: the Indus unspooling west below the wing, the Karakoram giving way to the Himalaya, and Nanga Parbat standing clear off the right-hand side. If the weather holds, ask for a window and take it.
The flight is weather-dependent in both directions, which is why this day sits where it does in the itinerary with the reserve day behind it. If the aircraft cannot fly, we drive, and the road takes two days. This is the single most common reason a trip to Baltistan needs flexibility at the end, and it is why we ask you not to book an international flight for the same evening you are due back in Islamabad.
Islamabad at five hundred metres in late summer is hot, humid and loud after a month of thin dry air, and the contrast is startling for the first hour. Your stored bag is waiting at the hotel, which means clean clothes that do not smell of kerosene and a mirror, where you will find someone noticeably thinner and several shades darker than the person who checked in three weeks ago.
The afternoon is free: the Margalla Hills, a bazaar, a long bath. The evening is the last one with the group, and worth keeping free for it.` },

21: { alt: '507 m', d:
`Transfer to Islamabad International for your flight home, timed to your departure, with a day room available if you leave late in the evening.
Three weeks ago K2 was a photograph on a screen. Today it is a place you have stood beneath, close enough to trace the Abruzzi Spur from the glacier to the ice that hangs above it, and to understand why so few people get up it. That is a rare thing to own, and it does not fade in the way most holidays do.
If you want to carry something further, your guide can tell you what else is reachable from Skardu: the Gondogoro La, which follows this same glacier to Concordia and then crosses a 5,585-metre pass south into the Hushe valley; the Biafo-Hispar traverse over Snow Lake; the trekking peaks of Nangma and Hushe. Most people who walk the Baltoro come back to this country, and the second visit is always easier to arrange than the first.
We would also like to hear from you honestly, including the parts that did not work. Our guides read what guests write, and a specific complaint about a camp, a meal or a day's pacing is more useful to us than a compliment. If you were happy with your crew, say so by name; it reaches them.
Safe travels home. Drink water on the aircraft, and expect to sleep for a very long time when you land.` },

};

/* ===================== kaam ============================================ */

const words = (s) => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

const normWords = (s) => String(s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .toLowerCase()
  .match(/[a-z0-9]+/g) || [];

const shingles = (txt, n) => {
  const w = normWords(txt);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
};

const raw = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!raw) { console.log('XX  k2-base-camp-baltoro-trek.md nahi mili.'); process.exit(1); }

const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
if (!fm) { console.log('XX  front matter nahi parhi gayi.'); process.exit(1); }

const lines = raw.split(/\r?\n/);
const eol = raw.includes('\r\n') ? '\r\n' : '\n';

/* itinerary block dhoondna */
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^itinerary:\s*$/.test(lines[i])) { start = i; break; }
  if (i > 0 && /^---\s*$/.test(lines[i]) && start === -1 && i > 1) break;
}
if (start === -1) { console.log('XX  front matter mein "itinerary:" nahi mila.'); process.exit(1); }
for (let i = start + 1; i < lines.length; i++) {
  if (/^---\s*$/.test(lines[i]) || /^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[i])) { end = i; break; }
}
if (end === -1) { console.log('XX  itinerary block ka ikhtitaam nahi mila.'); process.exit(1); }

let itin;
try { itin = yaml.load(lines.slice(start, end).join('\n')).itinerary; }
catch (e) { console.log('XX  itinerary YAML: ' + e.message); process.exit(1); }
if (!Array.isArray(itin)) { console.log('XX  itinerary list nahi hai.'); process.exit(1); }

/* ---- Gondogoro se muqabla ---------------------------------------------- */

console.log('\nK2 BASE CAMP — 21 DIN KE BAYAAN');
console.log('='.repeat(78));

let rivalText = '';
if (fs.existsSync(RIVAL)) {
  rivalText = fs.readFileSync(RIVAL, 'utf8');
  console.log('   Gondogoro ki file mil gayi — muqabla ho raha hai.');
} else {
  console.log('   !! Gondogoro ki file nahi mili — muqabla nahi ho saka.');
}

if (rivalText) {
  const N = 10;
  const rivalShingles = shingles(rivalText, N);
  const clashes = [];
  for (const [day, o] of Object.entries(DAYS)) {
    for (const sh of shingles(o.d, N)) {
      if (rivalShingles.has(sh)) clashes.push('Day ' + day + ':  ' + sh);
    }
  }
  if (clashes.length) {
    console.log('');
    console.log('XX  ' + clashes.length + ' jagah das lafzon ka tukra Gondogoro par bhi hai:');
    console.log('');
    for (const c of clashes.slice(0, 40)) console.log('      ' + c);
    if (clashes.length > 40) console.log('      ... aur ' + (clashes.length - 40));
    console.log('');
    console.log('   Likha nahi gaya. Yeh list mujhe bhej dein, main badal dunga.');
    process.exit(1);
  }
  console.log('   OK — das lafzon ka koi tukra dono safhon par nahi hai.');
}

/* ---- ginti -------------------------------------------------------------- */

let before = 0, after = 0, touched = 0, missing = [];
for (const day of itin) {
  const key = String(Number(day.day));
  before += words(day.description);
  if (DAYS[key]) { after += words(DAYS[key].d); touched++; }
  else { after += words(day.description); missing.push(day.day); }
}

console.log('');
console.log('   Din:     ' + itin.length + '   (bayaan badla: ' + touched + ')');
console.log('   Alfaaz:  ' + before + '  ->  ' + after + '   (+' + (after - before) + ')');
console.log('   Ausat:   ' + Math.round(before / itin.length) + '  ->  ' + Math.round(after / itin.length) + '  per din');
if (missing.length) console.log('   !! in dinon ka bayaan nahi likha: ' + missing.join(', '));

console.log('');
console.log('   DIN KE UNWAN AUR NAYE BAYAAN KI LAMBAI');
console.log('   ' + '-'.repeat(74));
for (const day of itin) {
  const key = String(Number(day.day));
  const o = DAYS[key];
  console.log('   Day ' + String(day.day).padEnd(5) +
    String(day.title || '').slice(0, 38).padEnd(40) +
    (o ? String(words(o.d)).padStart(4) + ' alfaaz' : '   [nahi badla]') +
    (o && !SKIP_ALT ? '   ' + o.alt : ''));
}

if (!SKIP_ALT) {
  console.log('');
  console.log('   BULANDI — YEH ZARA DEKH LEIN');
  console.log('   ' + '-'.repeat(74));
  console.log('   Yeh aam tor par likhi jane wali bulandiyan hain. Camp ki');
  console.log('   bulandi kutub ke mutabiq thori mukhtalif ho sakti hai — apne');
  console.log('   guide se ek baar confirm kara lein. Nahi chahiye to:');
  console.log('   node tools/deepen-k2bc.mjs --write --skip-altitude');
  console.log('');
  for (const day of itin) {
    const o = DAYS[String(Number(day.day))];
    if (!o) continue;
    const old = String(day.altitude || '').trim();
    console.log('   Day ' + String(day.day).padEnd(5) + String(day.title || '').slice(0, 34).padEnd(36) +
      (old ? old + '  ->  ' : '[khaali]  ->  ') + o.alt);
  }
}

console.log('');
console.log('-'.repeat(78));

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/deepen-k2bc.mjs --write');
  process.exit(0);
}

/* ---- likhna ------------------------------------------------------------- */

for (const day of itin) {
  const o = DAYS[String(Number(day.day))];
  if (!o) continue;
  day.description = o.d.replace(/\s*\n\s*/g, ' ').trim();
  if (!SKIP_ALT) day.altitude = o.alt;
}

const dumped = yaml.dump({ itinerary: itin }, { lineWidth: -1, noRefs: true }).split('\n');
while (dumped.length && dumped[dumped.length - 1] === '') dumped.pop();

const rebuilt = [...lines.slice(0, start), ...dumped, ...lines.slice(end)].join(eol);

/* jaanch: dobara parh kar dekho */
let verify;
try { verify = yaml.load(rebuilt.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)[1]); }
catch (e) { console.log('XX  naya YAML parh nahi saka: ' + e.message + '  — kuch nahi likha.'); process.exit(1); }
if (!Array.isArray(verify.itinerary) || verify.itinerary.length !== itin.length) {
  console.log('XX  din ki tadaad badal gayi — kuch nahi likha.'); process.exit(1);
}

if (!fs.existsSync(FILE + '.bakk2')) fs.copyFileSync(FILE, FILE + '.bakk2');
fs.writeFileSync(FILE, rebuilt, 'utf8');

console.log('LIKHA: src/content/trekking/k2-base-camp-baltoro-trek.md');
console.log('   backup: k2-base-camp-baltoro-trek.md.bakk2');
console.log('');
console.log('Agla qadam:  npm run build');
