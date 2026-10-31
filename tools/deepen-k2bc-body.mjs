#!/usr/bin/env node
/**
 * deepen-k2bc-body.mjs   (website ke folder mein)
 *
 * K2 Base Camp Trek — safhe ka matan.
 *
 * 309 se taqreeban 5,200 alfaaz. Woh sections jo kisi muqabil ke paas
 * nahi: K2 khud (1856 ka survey se 2021 ki sardiyon tak), Gilkey
 * Memorial, Askole aur Braldu ke log, porter, aur do sawal jo log Google
 * par poochte hain — "K2 base camp ya Everest base camp?" aur "yeh trek
 * ya Gondogoro La?"
 *
 * AAP KA MAUJOODA MATAN RAKHA GAYA HAI — "Planning notes", "Responsible
 * travel", aur KVP ka woh jumla jo zimmedari ki hadd batata hai, lafz ba
 * lafz wahi hain.
 *
 * KHUD JAANCHTA HAI — do tarah se:
 *   1. Gondogoro ke safhe se das lafzon ka koi tukra na mile
 *   2. Isi safhe ke 21 dinon ke bayaan se bhi na mile
 * Kuch mila to likhta nahi — report deta hai aur ruk jata hai.
 *
 *   node tools/deepen-k2bc-body.mjs            -> sirf dikhana
 *   node tools/deepen-k2bc-body.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const FILE = path.join(ROOT, 'src', 'content', 'trekking', 'k2-base-camp-baltoro-trek.md');
const RIVAL = path.join(ROOT, 'src', 'content', 'trekking', 'gondogoro-la-circuit-trek.md');

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (items) => '<ul>' + items.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';
const A = (href, text) => '<a href="' + href + '">' + text + '</a>';

const GONDOGORO = '/trekking/gondogoro-la-circuit-trek/';
const BIAFO = '/trekking/biafo-hisper-trek/';
const K2EXP = '/expeditions/k2-expediiton/';

const BODY = [

H('About this journey'),
P('Twenty-one days from Islamabad to the foot of K2 and back, on foot for sixteen of them, almost entirely on the Baltoro glacier. It is the most famous trek in Pakistan and one of the few genuinely great walks left anywhere that is not organised around lodges, shops and signposts.'),
P('The route goes in by jeep to Askole, the last village in the Braldu valley, and then walks: up the river flats to Paiju, onto the ice below the Trango Towers, along the moraine to Urdukas and Goro, and into Concordia at 4,600 metres, the junction where three great glaciers converge and four separate eight-thousand-metre peaks stand in a single field of view. From there a long day goes north under Broad Peak to K2 base camp at about 5,150 metres. Then the whole thing is walked back down.'),
P('There is no pass to cross and no technical climbing. You do not need ropes, crampons or any mountaineering skill. What you do need is the fitness and the temperament for two weeks of six-to-eight-hour days on broken glacial rubble, sleeping in a tent every night, with no road, shop, lodge or mobile signal between Askole and Askole.'),
P('What you get for that is the Karakoram at full scale, and a view of the second highest mountain on earth from close enough that you can see the route up it.'),

H('K2: the mountain you are walking towards'),
P('It is worth knowing something about K2 before you stand underneath it, because the mountain has a history that very few others can match and the base camp is where most of it happened.'),
P('<strong>The name.</strong> In 1856 a British survey officer, Thomas Montgomerie, was working his way through the Great Trigonometrical Survey of India from a station in Kashmir, more than two hundred kilometres away. He sketched the two most prominent peaks on the Karakoram horizon and labelled them K1 and K2, the K standing for the range. K1 turned out to be a mountain the Balti people already had a name for, Masherbrum, and the label was dropped. K2 did not, because it cannot be seen from any inhabited place: it stands behind a wall of other mountains at the head of a glacier system five days&rsquo; walk from the last village. A surveyor&rsquo;s filing reference therefore became the permanent name of the second highest mountain on earth, which is very nearly unique. Chhogo Ri, Balti for roughly &lsquo;the big mountain&rsquo;, is sometimes offered as a local name, and it is better understood as an accurate description than as a name in long-standing use.'),
P('<strong>The attempts.</strong> The first serious party came in 1902 and spent sixty-eight days on the glacier getting to about 6,500 metres on the north-east ridge. In 1909 Prince Luigi Amedeo, Duke of the Abruzzi, arrived with the photographer Vittorio Sella, reconnoitred the south-east ridge, decided it was the only plausible line, and got no higher than 6,250 metres. That ridge still carries his name &mdash; the Abruzzi Spur &mdash; and is the route almost every ascent has used since. Sella&rsquo;s photographs of the Baltoro are still reproduced today; you will pass the places he set his plate camera up.'),
P('American expeditions came in 1938, 1939 and 1953. The 1939 party got to roughly 8,380 metres and then lost four men on the descent. The 1953 party lost Art Gilkey. One of its members, George Bell, came home and described K2 as a savage mountain that tries to kill you, and the phrase has followed it ever since.'),
P('<strong>The first ascent</strong> came on 31 July 1954, when an Italian expedition under Ardito Desio put Achille Compagnoni and Lino Lacedelli on the summit. They got there partly because Walter Bonatti and a Hunza porter named Amir Mehdi carried oxygen bottles to roughly 8,100 metres and then survived a night in the open with no tent. Mehdi lost his toes to frostbite. Whether the two summit climbers behaved honourably towards them was argued about in Italy for the next fifty years.'),
P('<strong>And in winter</strong>, nothing. Of the fourteen mountains above eight thousand metres, K2 was the last to be climbed in winter, and it stayed unclimbed in that season until a team of ten Nepali climbers reached the summit together on 16 January 2021. Among the eight-thousanders, only Annapurna has killed a greater proportion of those who have tried it.'),

H('What you actually see from base camp'),
P('Base camp sits on the Godwin-Austen glacier at around 5,150 metres, which means the mountain above you rises another three and a half vertical kilometres. That is more vertical relief in one view than almost anywhere on the planet.'),
P('From the moraine you can follow the Abruzzi Spur with your eye from the glacier upward: the lower rock buttress, the steep chimney section that the 1938 expedition found a way through, the dark band of broken rock above it, the long shoulder, and then the summit pyramid foreshortened into something that looks far too steep to walk on. Above and left of the final section hangs the ice. Everyone who stands here looks at it for a while.'),
P('What strikes most trekkers is not the height but the steepness. The eight-thousanders of Nepal rise out of a crowd of other big mountains. K2 does not: it stands alone at the head of its glacier, and from directly beneath it the thing is a spike. Photographs do not convey it. Standing on the ice at its foot does.'),
P('Broad Peak base camp is passed on the way, usually full of tents in July and August, and the comings and goings of a working expedition are part of the day. If you want the climbing side of this mountain rather than the walking side, our ' + A(K2EXP, 'K2 expedition programme') + ' runs from the same base camp.'),

H('The Gilkey Memorial'),
P('A short way below K2 base camp, on a rock promontory above the glacier, there is a cairn. Almost every trekker who comes here finds it the most affecting fifteen minutes of the trip, and it is worth knowing what it is before you reach it.'),
P('In August 1953 an American expedition was high on the Abruzzi Spur when Art Gilkey, a geologist from Iowa, developed a blood clot in his leg and could not walk. His companions wrapped him and tried to lower him down the mountain in appalling weather over several days, an attempt that very nearly killed all of them. On the fourth day he was swept away by an avalanche while they were anchoring the ropes. The team built a cairn for him on the way out, and his remains were not found until 1993.'),
P('The cairn is still there, and it is no longer only his. It now carries engraved plates, metal plaques and flattened mess tins bearing the names of people who have died on K2 and on Broad Peak in the seventy years since, in several languages, some professionally cut and some scratched by hand. Prayer flags are strung above it.'),
P('There is no interpretation board and no fence. People read the names, and then they are quiet for most of the walk back. It is the part of this trek that trekkers mention years later, more often than the mountain.'),

H('Askole, and the valley the walk begins in'),
P('The Baltoro has been written about a great deal. The valley you drive up to reach it has not, and it deserves better.'),
P('The Braldu is a deep, dry, difficult gorge, and the road into it is cut from the canyon wall. Askole, at 3,048 metres, is the last village on it: a few hundred people, stone and mud houses with flat roofs, terraced fields of barley and potato on every patch of ground that can be levelled, apricot and walnut trees, and irrigation channels cut by hand to bring glacier meltwater across the slope. The Balti people here speak a Tibetan language, farm at an altitude where the growing season lasts a few months, and have done both for a very long time.'),
P('Men from Askole have worked on Karakoram expeditions since 1909, when the Abruzzi party recruited here on its way towards K2. More or less every expedition to K2, Broad Peak, the Gasherbrums and the Trangos, and every trekking group on the Baltoro, has started from this village and employed its men. In a valley with no other industry and a short season, that work matters enormously, and the arrangements around it &mdash; who is hired, in what order, at what rate &mdash; are taken seriously by everyone involved.'),
P('You will spend an afternoon and an evening here at the start and, usually, an hour at the end. Walk into the village, accept tea if it is offered, and ask before photographing anyone, particularly women. The children will talk to you. Beyond Askole, everything you eat, sleep under and drink from is carried on somebody&rsquo;s back from this point.'),

H('The men who carry the camp'),
P('This trek is made possible by porters, and travelling with a reasonable understanding of their work changes how the fortnight feels.'),
P('A porter carries 25 kilograms, which is the standard load on this route. Your own duffle bag can weigh up to that amount and one man carries it, along with his own food and bedding; you walk with a daypack holding water, a jacket and a camera. They are paid at the rates set by the Gilgit-Baltistan authorities, and above those rates when the ground or the season warrants it. In a group of a dozen trekkers the porter team is substantial, and the camp you sleep in each night exists because forty or fifty loads walked there.'),
P('They are also, as a rule, faster than you. A line of porters will pass the group on the worst moraine of the day, in sandals or well-used boots, with a sack on a rope over one shoulder, and be at the campsite with the tea on by the time you arrive. This is not showing off; it is a job in a season that lasts ten weeks.'),
P('Porters in this region do not usually hold insurance of their own. Karakoram Vision Pakistan insures every porter and every member of staff through Alpha Insurance before a trek leaves Skardu, arranged and paid for by us. We mention it plainly because it is not universal in this industry and we think it should be.'),
P('Tips are customary, not fixed, and the usual practice is for the group to agree a figure with the guide towards the end and hand it over at Askole. Nobody will put a number to you in advance. If you want to photograph the porters, and you should, ask first.'),

H('Who this trek suits, and who it does not'),
P('<strong>It suits</strong> fit, patient walkers who want a wilderness trek rather than a sightseeing holiday, and who are untroubled by two weeks without a shower, a bed, a shop or a phone. No climbing experience is needed. Experience of multi-day walking is close to essential, because the difficulty here is cumulative: any single day of this route is manageable, and it is the fourteenth consecutive one at altitude that finds people out.'),
P('<strong>It does not suit</strong> anyone whose fitness is aspirational rather than actual, anyone who needs certainty about dates, and anyone who would find the absence of an exit distressing. From Urdukas onwards, the way out is to walk out, which takes days. That is precisely what makes it worth doing, and it is not for everybody.'),
P('<strong>It is also not a technical route</strong>, and this is where people are sometimes misled by the name. Walking to K2 base camp has nothing in common with climbing K2 beyond the first morning&rsquo;s view. There are no ropes, no crampons for the standard route in normal conditions, and no mountaineering skills required. Do not let anyone tell you otherwise, and do not assume it is therefore easy; a long glacier trek at four thousand metres is hard in its own ordinary way.'),
P('On age: we have taken trekkers in their sixties to Concordia and turned back fit twenty-five-year-olds at Goro. Altitude does not consult your birth certificate. Honest hill fitness and a willingness to go slowly matter far more than how old you are.'),

H('This trek, or the Gondogoro La?'),
P('These two are our most-asked-about programmes and they share their first eleven days exactly, so the question comes up constantly. The honest comparison:'),
UL([
'<strong>This trek</strong> walks in to Concordia and K2 base camp and walks back out the same way. Twenty-one days. No pass, no fixed ropes, no technical equipment, and no part of the route that depends on snow conditions on one particular morning. If the weather is poor, you lose views; you do not lose the trek.',
'<strong>The ' + A(GONDOGORO, 'Gondogoro La circuit') + '</strong> follows the identical route to Concordia, then turns south and crosses a 5,585-metre pass on fixed ropes with harness and crampons, finishing in the Hushe valley. It is harder, colder, and more committing, and the crossing can be called off on the day for snow, weather or rope condition &mdash; in which case the group comes back down the Baltoro and it becomes this trek.',
]),
P('Choose this one if you want the Baltoro, Concordia and K2 without a technical crossing hanging over the middle of the trip, or if your fitness is good but not certain, or if you simply want to look at the mountains rather than negotiate with them.'),
P('Choose the Gondogoro La if you are strong, comfortable on steep snow, and want the finest single viewpoint in the Karakoram and a traverse rather than an out-and-back. If you are torn, talk to us about your hill experience and we will tell you honestly which one we think fits.'),
P('There is a third option people overlook: the ' + A(BIAFO, 'Biafo-Hispar traverse') + ' over Snow Lake, which is a very different and much emptier journey across the glacier system you walk past on your second day here.'),

H('K2 base camp and Everest base camp'),
P('Most people considering this trek have either walked to Everest base camp or thought about it, so here is the comparison without the salesmanship.'),
P('<strong>Everest base camp is easier in every logistical sense.</strong> It is around twelve days, it reaches 5,364 metres, and you sleep in lodges with beds, cooked food, bakeries, wifi and, in places, hot showers. The trail is a well-trodden path rather than moraine. If something goes wrong there is a village with a clinic within a few hours, and the route is busy enough that help is close. It is also a cultural journey through Sherpa country, which this trek is not.'),
P('<strong>This trek is harder, longer and wilder.</strong> Twenty-one days, camping throughout, around 5,150 metres at its highest point, no lodges, no villages after the fourth day, no signal, and eight days on the surface of a glacier. The ground is far rougher. The commitment is of a different order.'),
P('<strong>On mountains, though, the comparison is not close.</strong> Everest base camp does not have a good view of Everest; trekkers climb Kala Patthar to see it properly. Concordia gives you K2, Broad Peak, Gasherbrum I and Gasherbrum II from a single patch of moraine, with Gasherbrum IV, Chogolisa, Masherbrum and the Trango Towers around them. There is no comparable viewpoint in Nepal.'),
P('<strong>And on crowds.</strong> Everest base camp receives tens of thousands of trekkers a year. The Baltoro receives a small fraction of that, and most of them in a six-week window. At Concordia in August you will share the moraine with expedition teams and a handful of other trekking groups, and that is all.'),

H('When to go'),
P('<strong>Late June to early September</strong>, and within that, <strong>July and August</strong> for the most settled weather.'),
P('<strong>Late June</strong> can be very good and carries more risk: the jeep road up the Braldu is sometimes still being repaired after the winter, river crossings run high with early melt, and there is more snow on the glacier. It is also quieter and cooler for the walking.'),
P('<strong>July and August</strong> are the main season. The weather is at its most reliable, the glacier route is established and well travelled, and every expedition on the Baltoro is in place, which many trekkers find adds to the experience rather than detracting from it. Days on the lower valley are hot &mdash; the mid-twenties Celsius in full sun, hotter on the reflective gravel &mdash; and nights at Concordia are below freezing in every month of the season.'),
P('<strong>Late August into early September</strong> brings the quietest camps and, often, the clearest air and the best photography of the whole season, with a steadily increasing chance of an early snowfall and an unsettled spell.'),
P('Outside those months this route is not a trekking proposition. The Braldu road closes, the camps are under snow, and Skardu flights are unreliable for weeks at a time.'),

H('Altitude, and how this itinerary handles it'),
P('Altitude is the single thing most likely to end a trek here, and almost everything about the shape of these twenty-one days is a response to it.'),
P('The profile goes from Islamabad at 500 metres to Skardu at 2,228, Askole at 3,048, Paiju at 3,450 with a full rest day, then onto the glacier to 3,930, 4,050 and 4,380 metres on successive days, Concordia at 4,600 with a rest day, and base camp at about 5,150 before coming down. Sleeping altitude rises by three to four hundred metres a day across the glacier section, which is a conservative rate, and the two rest days are placed exactly where they do the most good.'),
P('Those rest days are not negotiable and they are not spare time. A group that pushes through Paiju to save a day will have somebody in trouble at Goro, and somebody in trouble at Goro costs far more than a day.'),
P('Expect, and do not be alarmed by: headache in the evenings, poor and broken sleep, vivid dreams, no appetite, and shortness of breath on any climb. Nearly everyone gets some of this above 4,000 metres. Report immediately, and expect to go down: breathlessness while sitting still, a headache that painkillers do not touch, repeated vomiting, confusion, or losing your balance.'),
P('Your guide asks the group direct questions every evening. The honest answer is the useful one. Concealing symptoms so as not to slow the group is the one genuinely dangerous thing a trekker can do on this route, because the problem that a five-hundred-metre descent fixes today becomes a helicopter tomorrow. Whether to take Diamox is a conversation for you and your own doctor before you fly, not for the mess tent at Urdukas.'),

H('Training for the Baltoro'),
P('People train for the altitude and are then defeated by the ground. The altitude is handled by the itinerary; the ground is handled by you.'),
P('Almost none of this route is a path. It is moraine: loose rock sitting on moving ice, boulder fields, debris slopes, meltwater channels and troughs, for eight days. Every step is slightly different from the last and nothing is level. It punishes ankles, knees and the small stabilising muscles that road running never touches, and it is the reason strong gym-fit trekkers sometimes struggle here while unspectacular hill walkers stroll through.'),
P('<strong>Train on rough ground, with weight, for three to four months.</strong> Long days on hills carrying eight to ten kilograms, ideally on consecutive days at weekends so your legs learn what the fourth hour of the second day feels like. Add step-ups, squats, lunges and calf raises for the descents, which do more damage than the climbs. Walk on uneven trails rather than tarmac whenever you have the choice.'),
P('A practical benchmark: if you can walk eight hours with a ten-kilogram pack and a thousand metres of ascent, repeat it the following day, and still feel able to do a third, you are fit enough for this trek.'),
P('And break your boots in properly. On a route with no road access for eight days, a boot problem is not an inconvenience; it is the thing that sends you home.'),

H('Camp, food and the daily rhythm'),
P('The days settle into a pattern quickly and most people grow fond of it.'),
P('Tea comes to the tent at first light, with a bowl of warm water a few minutes later. Breakfast is in the mess tent &mdash; porridge, eggs, bread and preserves, tea and coffee &mdash; while the crew takes the kitchen down around you. Walking starts early, because afternoons are hotter and meltwater streams run higher. Lunch is carried from camp or cooked on the spot depending on the day. The pace is set to the slowest member of the group, which is the only safe way to run a trek at altitude. Camp is usually up by mid-afternoon, tea appears before the tents do, and the rest of the day is for washing, reading, dozing and sorting your bag. Dinner is three courses, and most people are asleep by eight.'),
P('A cook travels with the group for the entire trek with his own kitchen tent and assistants. The food is better than people expect: rice, chapati, lentils, vegetables, eggs, meat in the early days while it keeps, soup every evening, and tea at all hours. Fresh fruit lasts to Paiju. Tell us about vegetarian, halal or allergy requirements when you book and not when you arrive, because on the Baltoro the food that was carried in is the only food there is.'),
P('You sleep in two-person tents, with a mess tent, a separate kitchen tent and a toilet tent dug fresh at each site. If sharing does not appeal, a single tent can be arranged for a supplement. Sleeping bags are available to rent here, which saves hauling one halfway round the world for a single trip. In Islamabad and Skardu the group is in hotels.'),

H('What to bring'),
P('A full list comes with your booking confirmation. Five things matter more than the rest.'),
UL([
'<strong>Boots</strong> &mdash; stiff-soled, supportive, and thoroughly broken in. The most important item you own for this trek and the one that cannot be fixed at Paiju.',
'<strong>Sleeping bag and mat</strong> &mdash; a bag good for minus ten Celsius or colder, with a closed-cell or inflatable mat beneath it. Goro and Concordia drop below freezing every night of the season. Renting one here is straightforward and saves your luggage allowance.',
'<strong>Glacier glasses</strong> &mdash; proper ones with side protection, not ordinary sunglasses. Eight days on reflective ice at altitude is exactly how people get snow blindness.',
'<strong>Sun protection</strong> &mdash; high-factor cream applied to the underside of your nose, chin and ears as well as the obvious places, because at altitude the light comes up off the ice as hard as it comes down.',
'<strong>Trekking poles</strong> &mdash; optional on paths, close to essential on moraine, and worth more to your knees on the eight days of descent than any other piece of kit.',
]),
P('Bring a power bank and ideally a small solar panel: there is no electricity between Askole and Askole. A good deal of trekking gear can be bought or hired in the Skardu bazaar, so tell us in advance what you would prefer not to carry on the plane and it will be waiting for you.'),

H('Visa, permits and insurance'),
P('Three pieces of paperwork, two of which we handle.'),
UL([
'<strong>Pakistan visa.</strong> Most nationalities apply through the official e-visa system. Tourist applications generally call for a letter of invitation together with a confirmed booking from an operator licensed in Pakistan; both documents come from us once your place is held. Start four to six weeks before you travel.',
'<strong>Park permit and trekker registration.</strong> The Baltoro lies inside the Central Karakoram National Park for the whole of this route. The permit itself is issued without charge; separately, each trekker pays a park fee, which the tourism authorities in Gilgit-Baltistan revise annually. Foreign trekkers are also registered in Skardu before leaving for Askole, and debriefed there on the way back. We arrange all of it; we need your passport for a day in Skardu.',
'<strong>Travel insurance, which is compulsory and is yours to arrange.</strong> It must cover helicopter search and rescue at the altitude of this trek, plus medical treatment and repatriation. Standard holiday policies cover none of that. Global Rescue comes up most frequently among our guests, and a handful of other insurers will write cover for rescue at Karakoram altitudes.',
]),
P('Send us your policy number and your insurer&rsquo;s twenty-four-hour emergency line before you fly. In a serious situation we telephone the insurer first, because a helicopter does not launch over the Baltoro until cover is confirmed, and that is not a conversation to be having for the first time at Concordia.'),
P('This route needs no restricted-area permit and no liaison officer; those apply to the climbing permits on the peaks above you, not to trekking.'),

H('Getting to Skardu'),
P('International flights land at Islamabad, which is well served from the Gulf, Europe and East Asia, and we meet you in the arrivals hall.'),
P('Islamabad to Skardu is either a fifty-minute flight along Nanga Parbat or a two-day drive up the Karakoram Highway with a night at Chilas. The flight is flown on sight rather than instruments and is cancelled whenever the cloud is in, which is often; the road is reliable, spectacular, and long. We use whichever the weather allows and absorb the difference with the reserve day in the itinerary.'),
P('Because of that, two pieces of advice we give every guest. Do not book your international flight home for the same day the programme ends in Islamabad &mdash; leave a day. And buy a changeable ticket if your budget stretches to it. More journeys to Baltistan are disrupted by that one aircraft than by everything else combined, and none of it reflects how well matters are arranged on the ground.'),

H('If something goes wrong'),
P('A satellite phone and radios travel with every group of ours, not only with expeditions. Mobile coverage ends well before Askole; from there until you return, the satellite phone is the group&rsquo;s only link out for weather, logistics and emergencies, and the radios keep guide, crew and trekkers in contact across a long day spread out on the glacier.'),
P('Guides carry a comprehensive first aid kit and bottled oxygen. The treatment for serious altitude illness is to go down, immediately and with an escort, and on this route down is always available &mdash; which, structurally, makes this a safer high trek than one built around a pass.'),
P('Helicopter evacuation from the Baltoro is possible, it is coordinated from Skardu, and it is arranged through your insurer. This is why we collect your policy details before you travel.'),
P('More ordinary things are more likely: a stomach upset, a blister that has been ignored for a day too long, a twisted ankle on moraine. Those are managed on the spot, which is why we ask you to report small problems early. Almost everything that becomes serious on this trek started as something minor that somebody decided not to mention.'),

H('What it costs and how to book'),
P('Send us your dates and group size and you will get a written itinerary and a full cost breakdown before anybody discusses money changing hands. There is no single price for this trek, because it moves substantially with group size: the guide, the cook, the kitchen and the permits are shared, so four trekkers pay a very different per-person rate from twelve.'),
P('A deposit of 50 per cent confirms your place and starts the visa paperwork, permit application and porter arrangements. The balance is paid once you reach Islamabad and before the group travels north, in euros or US dollars, or by bank transfer.'),
P('We also run this route on private dates for couples, families and private groups, with the cost adjusted to the number of people and the itinerary adjusted to your own time frame. If twenty-one days is more than you have, say so when you write; there are shorter versions of the Baltoro that still reach Concordia, and we would rather tell you that than sell you a trip you have to rush.'),

H('Planning notes'),
P('A demanding Karakoram trek through the Baltoro Glacier to Concordia and the K2 base-camp region, planned with local support. Karakoram Vision Pakistan plans this programme around confirmed road access, accommodation, weather and local operating conditions. This route requires strong fitness, acclimatization and appropriate rescue insurance.'),
P('This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.'),

H('Responsible travel'),
P('Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.'),
P('The Baltoro carries heavy traffic in the ten weeks of its season and the pressure is visible at Paiju, Urdukas and Concordia. Everything our groups carry onto the glacier comes back off it, including what cannot be burned or buried, and we ask our guests to hold to the same standard.'),

].join('');

/* ===================== kaam ============================================ */

const words = (s) => (String(s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

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

const oldBody = raw.slice(fm[0].length);
const w0 = words(oldBody);
const w1 = words(BODY);

console.log('\nK2 BASE CAMP — SAFHE KA MATAN');
console.log('='.repeat(78));
console.log('   pehle: ' + w0 + ' alfaaz');
console.log('   ab:    ' + w1 + ' alfaaz   (+' + (w1 - w0) + ')');
console.log('');
console.log('   Sections:');
for (const m of BODY.matchAll(/<h2><strong>([^<]+)<\/strong><\/h2>/g)) console.log('      ' + m[1]);

/* ---- andar ke link ----------------------------------------------------- */
console.log('');
console.log('   ANDAR KE LINK — yeh chal rahe hain ya nahi, dekh lein:');
for (const m of BODY.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)) {
  const target = path.join(ROOT, 'src', 'content', m[1].replace(/^\/|\/$/g, '') + '.md');
  console.log('      ' + (fs.existsSync(target) ? 'OK ' : '?? ') + m[1] + '   "' + m[2] + '"');
}

/* ---- aap ka purana matan ---------------------------------------------- */
const KEEP = [
  'A demanding Karakoram trek through the Baltoro Glacier to Concordia and the K2 base-camp region, planned with local support.',
  'Karakoram Vision Pakistan plans this programme around confirmed road access, accommodation, weather and local operating conditions.',
  'This route requires strong fitness, acclimatization and appropriate rescue insurance.',
  'This is a starter itinerary rather than a binding quotation.',
  'Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.',
  'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules.',
  'The operating plan prioritizes realistic travel times and local services.',
];
console.log('');
console.log('   Aap ka purana matan jo rakha gaya:');
let keepOk = true;
for (const k of KEEP) {
  const has = BODY.includes(k);
  if (!has) keepOk = false;
  console.log('      ' + (has ? 'OK ' : 'XX ') + k.slice(0, 58) + '...');
}
if (!keepOk) { console.log('\nXX  kuch purana matan reh gaya — ruk raha hoon.'); process.exit(1); }

/* ---- duplicate jaanch -------------------------------------------------- */
/* Aap ka apna matan (KEEP) jaanch se nikal diya jata hai — woh har safhe
   par ek hi hai aur hona chahieh, warna hamesha pakra jayega. */
const N = 10;
const clashes = [];
let MINE = BODY;
for (const k of KEEP) MINE = MINE.split(k).join(' ');

if (fs.existsSync(RIVAL)) {
  const rs = shingles(fs.readFileSync(RIVAL, 'utf8'), N);
  for (const sh of shingles(MINE, N)) if (rs.has(sh)) clashes.push('Gondogoro:  ' + sh);
  console.log('');
  console.log('   Gondogoro ke safhe se muqabla: ' + (clashes.length ? clashes.length + ' tukre' : 'saaf'));
} else {
  console.log('');
  console.log('   !! Gondogoro ki file nahi mili — muqabla nahi ho saka.');
}

let ownItin = [];
try { ownItin = yaml.load(fm[1]).itinerary || []; } catch { /* chalne do */ }
if (Array.isArray(ownItin) && ownItin.length) {
  const own = shingles(ownItin.map((d) => String(d.description || '')).join(' \n '), N);
  let n = 0;
  for (const sh of shingles(MINE, N)) if (own.has(sh)) { clashes.push('Isi safhe ke din:  ' + sh); n++; }
  console.log('   Isi safhe ke ' + ownItin.length + ' dinon se muqabla: ' + (n ? n + ' tukre' : 'saaf'));
}

if (clashes.length) {
  console.log('');
  console.log('XX  das lafzon ke ' + clashes.length + ' tukre dohra rahe hain:');
  console.log('');
  for (const c of clashes.slice(0, 40)) console.log('      ' + c);
  if (clashes.length > 40) console.log('      ... aur ' + (clashes.length - 40));
  console.log('');
  console.log('   Likha nahi gaya. Yeh list mujhe bhej dein, main badal dunga.');
  process.exit(1);
}

console.log('');
console.log('-'.repeat(78));

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/deepen-k2bc-body.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakk2body')) fs.copyFileSync(FILE, FILE + '.bakk2body');
fs.writeFileSync(FILE, raw.slice(0, fm[0].length) + '\n' + BODY + '\n', 'utf8');

console.log('LIKHA: src/content/trekking/k2-base-camp-baltoro-trek.md');
console.log('   backup: k2-base-camp-baltoro-trek.md.bakk2body');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs');
