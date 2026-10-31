#!/usr/bin/env node
/**
 * deepen-gondogoro-body.mjs   (website ke folder mein)
 *
 * Gondogoro La ka doosra hissa: woh sections jo abhi kisi safhe par hain
 * hi nahi — yeh trek kis ke liye hai aur kis ke liye nahi, pass khud,
 * pass band ho to kya, kaun sa maheena, bulandi aur acclimatisation,
 * tayyari, din ka maamool, khana aur camp, aap ki team, permits, saman,
 * safar, aur rabta aur madad.
 *
 * AAP KA MAUJOODA MATAN RAKHA GAYA HAI. "Planning notes" aur "Responsible
 * travel" lafz ba lafz wahi hain, aur pass ki zimmedari wala jumla bhi —
 * woh qanooni aur tijarati maayne rakhte hain.
 *
 * Jo yahan likha hai woh raaste ka ilm hai aur woh tafseel jo client ne
 * khud di: porter ka 25 kilo, Alpha Insurance, Alpine Club ki sanad,
 * satellite phone aur radios, 50 fi sad deposit, Islamabad mein baqi
 * adaigi, cook aur kitchen tent, alag mess aur toilet tent, sleeping bag
 * karaye par.
 *
 *   node tools/deepen-gondogoro-body.mjs            -> sirf dikhana
 *   node tools/deepen-gondogoro-body.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, 'src', 'content', 'trekking', 'gondogoro-la-circuit-trek.md');

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (items) => '<ul>' + items.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';

const BODY = [

H('About this journey'),
P('The Gondogoro La circuit takes everything the K2 base camp trek offers and adds the finest viewpoint in the Karakoram. The route in is the same &mdash; Askole, the Baltoro glacier, Urdukas, Concordia and the K2 base camp area &mdash; but instead of retracing its steps down the glacier, the group turns south and crosses the Gondogoro La at 5,585 metres into the Hushe valley.'),
P('That one decision changes the character of the whole trek. Instead of walking out the way you walked in, you finish in a different valley, among different people, having stood on a pass from which four of the world&rsquo;s fourteen eight-thousand-metre peaks are visible at once: K2, Broad Peak, Gasherbrum I and Gasherbrum II, with Masherbrum, Chogolisa and Laila Peak on the southern side. There is no other trekking pass on earth with that view.'),
P('It is also the harder choice. The crossing is a pre-dawn climb on snow and ice using fixed ropes, a harness and crampons, and it is attempted only when conditions and the group allow. Everything in this programme &mdash; the rest days, the altitude profile, the spare days at the end &mdash; is arranged around giving that crossing the best possible chance.'),

H('Who this trek is for'),
P('Strong, experienced hill walkers who want more than an out-and-back route and are comfortable with three weeks away from roads, shops, hotels and mobile signal. You do not need to be a climber. You do need to be able to walk six to eight hours a day on rough ground, day after day, carrying a daypack, and to keep doing it at four and a half thousand metres when you have not slept properly for a week.'),
P('Previous glacier experience helps and is not essential; our climbing guides fix and manage the ropes on the pass and talk every member of the group through the technique at Ali Camp the evening before. What matters more is honest fitness and a steady head on steep ground. If exposure frightens you &mdash; genuinely frightens you, rather than merely concentrates you &mdash; the descent from the pass will be a long and unhappy morning.'),
P('<strong>Who it is not for.</strong> Anyone looking for a first Himalayan trek, anyone who needs a shower and a bed, and anyone whose fitness is theoretical. It is also not the right choice for travellers on a fixed return date with no margin: the Skardu flight and the pass both answer to the weather, and this itinerary needs the spare days it carries. If you want the Baltoro and Concordia without the pass, the K2 base camp trek covers the same glacier and returns the way it came.'),

H('The Baltoro glacier and Concordia'),
P('Before the pass there is the glacier, and the glacier is half the reason to come.'),
P('The Baltoro runs some sixty kilometres from Concordia down to its snout near Jula, a river of ice up to a kilometre wide, buried under rubble for most of its length and moving a few centimetres a day. Walking on it is nothing like walking on snow. The surface is grey moraine over ice, pitted with meltwater channels, sinkholes and blue pools, cracking and shifting audibly in the afternoon heat. Routes change from season to season and sometimes from week to week, which is why local guides matter more here than any map.'),
P('Above it stand the Trango Towers and the Great Trango, among the largest granite walls on earth; Uli Biaho; the Cathedral Spires; Mustagh Tower, so improbably shaped that early surveyors doubted it could be climbed; and Masherbrum to the south. The famous first view of Paiju Peak comes early, and the walls close in from Urdukas onward.'),
P('<strong>Concordia</strong> is where the Baltoro meets the Godwin-Austen and Vigne glaciers, and it is one of the great amphitheatres of the world. From a single patch of moraine at 4,600 metres you can see K2 to the north, Broad Peak and the Gasherbrums to the east, and Chogolisa and Mitre Peak to the south. Four eight-thousanders are within view. The mountaineer who named it after the Place de la Concorde was not exaggerating by much. Our itinerary gives it a full rest day, and that day is the one most people remember.'),

H('The Gondogoro La'),
P('The pass deserves its own description, because it is the reason this trek exists and the part people ask about most.'),
P('It sits at 5,585 metres on the ridge between the Vigne glacier, which runs south from Concordia, and the Gondogoro glacier, which runs down into the Hushe valley. Shepherds and hunters have used it for centuries. As a trekking route it was opened to groups in the 1980s and is now maintained each season with fixed ropes on both the northern and southern sides by a rope-fixing team, usually from Hushe.'),
P('The crossing begins from Ali Camp at about 5,000 metres, with a wake-up call around midnight and a start by one in the morning. The timing is not for effect. The snow slopes below the pass have to be crossed while they are frozen hard; once the sun is on them the surface softens, the risk of slides rises, and the long descent on the southern side becomes materially more dangerous. Groups that leave late have to turn around.'),
P('The ascent takes four to six hours in the dark on steep snow, with the final section secured by fixed rope &mdash; you ascend using a jumar clipped to the rope, with crampons on and an ice axe in the other hand. It is not technical climbing by any mountaineering standard. It is, however, steep, cold, exposed and at an altitude where a hundred metres of height gain can take half an hour. Hands suffer on the metal; two pairs of gloves is not excessive.'),
P('The top is usually reached around first light, and nobody lingers long. The descent to Khuspang is longer and steeper than the climb, again on fixed ropes for the upper part, then several hours of loose moraine and snow. Most groups are in camp by early afternoon, and most people sleep for the rest of it.'),

H('If the pass is closed'),
P('The crossing is never guaranteed. Heavy new snow, poor visibility, damaged or missing fixed ropes, or a group that has not acclimatised well are all reasons to turn back, and the decision belongs to your guide on the day.'),
P('When the pass is not crossed, the group returns from Concordia down the Baltoro by the way it came in, and exits via Askole and Skardu. The trek is not cancelled and the days are not wasted &mdash; it becomes the K2 base camp trek, which is a magnificent journey in its own right and the reason most trekkers come to Pakistan at all. The itinerary is built with enough spare time to absorb the change without missing international flights.'),
P('We say this plainly at the time of booking rather than in the small print, because a group that understands the possibility in advance makes a better decision on the mountain than one that feels it has paid for a guarantee.'),

H('Hushe, where the trek ends'),
P('Most descriptions of this route stop at the pass. The southern side deserves better.'),
P('Below Khuspang the Gondogoro glacier runs down into the Hushe valley, and the change is abrupt: after two weeks of rock, ice and grey moraine, there is grass. Dalsampa and Saicho are summer pastures where Hushe families bring animals up for the season, and they are often the first green and the first smell of woodsmoke in a fortnight.'),
P('<strong>Laila Peak</strong> stands over the walk out, a near-perfect leaning spearhead of 6,096 metres that is among the most photographed mountains in Pakistan and still rarely climbed. The valley below it is Balti farmland &mdash; stone-walled terraces of barley and potato, apricot and walnut trees, irrigation channels cut from the glacier melt, flat-roofed houses stacked along the slope.'),
P('<strong>Hushe village</strong> itself, at around 3,050 metres, is the roadhead and the last settlement in the valley. It is a mountaineering village in the proper sense: for decades the high-altitude porters and climbers who have worked on K2, the Gasherbrums and Masherbrum have come from here, and several of the best-known Pakistani mountaineers were born within a few hundred metres of the road&rsquo;s end. The men who fix the ropes on the Gondogoro La each season are usually from this village. Arriving on foot from the north, having crossed the pass they maintain, is a better introduction to the place than any amount of reading.'),

H('When to go'),
P('The season for this route is short. <strong>Mid-July to late August</strong> is when the Gondogoro La is most likely to be in condition, and that is when we run it.'),
P('<strong>June</strong> is usually too early. The Baltoro is walkable but the pass often still carries deep unconsolidated snow and the ropes may not be fixed for the season. <strong>Early July</strong> can work in a light winter and is a gamble in a heavy one.'),
P('<strong>Mid-July to mid-August</strong> is the main window. The snow has consolidated, the ropes are in, the rope-fixing team is on the ground, and the weather is at its most settled. It is also when the Baltoro is busiest &mdash; Paiju, Urdukas and Concordia are shared with expedition teams heading for K2 and the Gasherbrums, which many trekkers consider part of the experience rather than a drawback.'),
P('<strong>Late August into early September</strong> is quieter, the glacier is drier and the walking on the Baltoro is often at its best, but the weather becomes less reliable and the pass can close for the season with little warning.'),
P('Daytime temperatures on the lower Baltoro reach the mid-twenties Celsius in full sun. Nights at Concordia fall below freezing in every month of the season, and the night before the pass is colder still.'),

H('Altitude and acclimatisation'),
P('This is the part of the trek that decides most outcomes, and the itinerary is shaped around it rather than around distance.'),
P('The profile climbs from Askole at 3,048 metres to Concordia at 4,600 over seven days, with a rest day at Paiju and another at Concordia, then to Ali Camp at 5,000 and across the pass at 5,585. That is a conservative and well-tested rate of ascent. The two rest days are not padding and are not optional &mdash; they are the reason the pass is crossable at the end.'),
P('Mild headache, broken sleep, strange dreams and loss of appetite are normal above about 3,500 metres and affect most people at some point on the Baltoro. They are not, in themselves, a cause for alarm. Breathlessness at rest, a headache that does not respond to painkillers, repeated vomiting, confusion or unsteadiness on the feet are different, and they are treated by going down.'),
P('Your guide watches the group daily and asks direct questions. Answer them honestly. The single most dangerous thing a trekker can do at altitude is conceal symptoms in order not to hold up the group &mdash; it converts a problem that is solved by descending five hundred metres into one that needs a helicopter.'),
P('Guides carry a comprehensive first aid kit and oxygen, and a satellite phone and radios travel with every group. Diamox is used by many trekkers; whether it suits you is a conversation to have with your own doctor well before you travel, not with your guide at Urdukas.'),

H('How hard is it, and how should I train'),
P('Measured honestly: six to eight hours of walking a day on rough, unstable ground, for sixteen consecutive days, at altitudes between three and five and a half thousand metres, sleeping in a tent throughout, with one long and cold night on a steep pass in the middle of it.'),
P('The ground itself is the part people underestimate. Very little of the Baltoro is a path. It is moraine, glacier ice, loose rubble on moving ice, boulder fields and stream crossings, and it is tiring in a way that a hill path at home is not. Ankles and knees take more punishment than lungs.'),
P('<strong>Three to four months of specific preparation</strong> is what works. Long hill days carrying a loaded pack, back to back on consecutive weekends, are worth more than any amount of gym work. Add step-ups, squats and calf work for the descents, and time on uneven ground rather than tarmac. If you can comfortably walk two consecutive days of eight hours with a ten-kilogram pack and 1,000 metres of ascent, and feel ready for a third, you are in the right condition for this trek.'),
P('Break your boots in thoroughly before you travel. Blisters at Paiju become a serious problem by Urdukas, and there is no way out of the middle of the Baltoro except on your own feet.'),

H('A typical day on the Baltoro'),
P('The rhythm is the same from Jula to Concordia and it settles into something most people come to like a great deal.'),
P('Tea arrives at the tent between five and six in the morning, followed shortly by a bowl of warm water for washing. Breakfast is served in the mess tent &mdash; porridge, eggs, bread, jam, tea and coffee &mdash; while the kitchen staff strike their tent around you. The group is usually walking by seven, because the morning is cool and the afternoon streams run higher with melt.'),
P('The walking day runs five to seven hours with a stop for lunch, which is either a packed meal carried from camp or a hot one prepared on the spot if the day is short. Your guide sets the pace to the slowest person in the group, which is the correct way to run a trek at altitude and occasionally frustrating for the fastest.'),
P('Camp is usually reached in the early or middle afternoon. The kitchen tent goes up first and tea appears almost immediately, then the sleeping tents, mess and toilet tents. The rest of the afternoon is yours: washing, reading, sorting a bag, walking a little higher for the view, or sleeping. Dinner is in the mess tent, usually soup followed by rice or chapati with lentils, vegetables and sometimes meat. Most people are in their sleeping bags by eight.'),

H('Food and camp life'),
P('A cook travels with the group for the whole trek, with assistants and waiters, and cooks in a dedicated kitchen tent. The number of kitchen staff depends on the size of the group.'),
P('The food is better than most first-time trekkers expect. Breakfast is porridge, eggs, toast and preserves. Lunch is packed or hot depending on the day. Dinner is three courses, built around rice, chapati, lentils, seasonal vegetables and eggs, with meat in the earlier days while it keeps and dried or tinned protein higher up. Fresh fruit lasts as far as Paiju. Tea is more or less continuous.'),
P('Tell us about vegetarian, halal, allergy or other dietary requirements when you book, not when you arrive. On the Baltoro the food that is carried in is the food there is, and substitutions cannot be improvised at Concordia.'),
P('Camp consists of two-person sleeping tents, a mess tent with table and stools, a separate kitchen tent, and a toilet tent that is moved and dug at each site. A single tent can be arranged for anyone who would rather not share, and sleeping bags can be hired from us rather than flown in. In Skardu and at the roadhead the group stays in hotels.'),

H('Your team'),
P('A Gondogoro La group travels with a trekking guide, climbing guides for the pass, a cook and kitchen staff, and a porter team.'),
P('Our guides hold government licences, speak English and in several cases other European languages, and the majority are certified by the Alpine Club of Pakistan. They are from these valleys rather than brought in for the season, which matters when a route has changed since last year or the weather turns on the glacier.'),
P('<strong>The porters are worth understanding, because they make this trek possible.</strong> A porter carries 25 kilograms on normal ground and 20 kilograms where the route crosses a high pass, which is harder going and thinner air. Your own duffle bag may weigh up to 25 kilograms and is carried for you; you walk with a daypack. Porters are paid at the official Gilgit-Baltistan rates, and above them where the ground or the season justifies it.'),
P('Porters in Gilgit-Baltistan do not normally carry insurance of their own. Karakoram Vision Pakistan insures every member of staff and every porter through Alpha Insurance before a trek begins. This is arranged and paid for by us rather than left to the men carrying the loads, and we mention it because it is not universal in this industry and it should be.'),
P('Tips are not fixed and are at your discretion. The usual practice is that the group agrees an amount with the guide at the end and it is shared among the crew. Nobody will ask you for a figure in advance.'),

H('Permits, registration and paperwork'),
P('Three things are needed for this route and we arrange all of them.'),
UL([
'<strong>Pakistan visa.</strong> Most nationalities apply online through the official e-visa portal. A tourist application normally needs an invitation letter and tour confirmation from a licensed Pakistani operator, which we issue once your booking is confirmed. Apply four to six weeks ahead.',
'<strong>Trekker registration.</strong> Foreign trekkers are registered with the authorities in Skardu before leaving for the mountains. This is done on the preparation day and needs your passport.',
'<strong>Central Karakoram National Park permit and fee.</strong> The permit is issued free; a park fee is payable per trekker at a rate set each year by the Gilgit-Baltistan tourism department. The Gondogoro La route lies within the park for its whole length.',
]),
P('The Gondogoro La is in an open zone and does not require a restricted-area permit. There is a debriefing at the tourism office in Skardu at the end of the trek, which is routine.'),
P('<strong>Travel insurance is compulsory and is your responsibility.</strong> It must cover search and rescue at the altitude of this trek, as well as medical treatment and repatriation. Ordinary holiday insurance excludes both. Global Rescue is the policy we see most often; several other insurers cover high-altitude rescue in the Karakoram. Send us your policy number and your insurer&rsquo;s emergency line before you travel: in an emergency we contact the insurer directly, and a helicopter is not dispatched until cover is confirmed.'),

H('Equipment'),
P('A full packing list is sent with your booking confirmation. Four items decide how the trek goes.'),
UL([
'<strong>Boots.</strong> Stiff-soled, broken in, and able to take a crampon. This is the single most important thing you bring and the only one that cannot be hired at the last minute.',
'<strong>Sleeping bag.</strong> Rated to at least minus ten Celsius, with an insulated mat. Nights at Concordia and Ali Camp are well below freezing. Bags can be hired from us if you would rather not fly with one.',
'<strong>Sun protection.</strong> Glacier glasses with side protection, not ordinary sunglasses. High-factor sunscreen applied including under the nose and chin, where the light reflects up off the ice. Snow blindness and glacier burn are the most common avoidable injuries on the Baltoro.',
'<strong>Technical gear for the pass.</strong> Harness, helmet, crampons and an ice axe. Bring your own if you have them; otherwise they are issued and fitted in Skardu.',
]),
P('A wide range of trekking and climbing equipment can be hired or bought in the Skardu bazaar, so you do not have to fly with everything. Tell us at the time of booking what you would rather hire and it is set aside before you arrive. Bring a power bank and a solar charger: there is no mains electricity between Askole and Hushe.'),

H('Getting there'),
P('International flights arrive at Islamabad, which is well connected to the Gulf, Europe and Asia. We meet you at the airport.'),
P('From Islamabad to Skardu there are two routes, and the trek uses whichever the weather allows. <strong>The flight</strong> takes about an hour and runs along Nanga Parbat; it is spectacular and it is cancelled often, because it is flown visually through the mountains. <strong>The road</strong> is the Karakoram Highway north to the Indus and then the Skardu road east along the river, two days with a night at Chilas, and a journey worth having in its own right.'),
P('Build spare days into your own travel at both ends of the trip and hold a flexible ticket home if you can. The reserve day in this itinerary exists for exactly this reason, and we strongly recommend booking your international flight for the day after the programme ends rather than the same day.'),

H('Safety, communication and getting help'),
P('A satellite phone and radios travel with every trek, not only with expeditions. Mobile signal reaches Skardu and the larger valleys and stops well before Askole; from the roadhead to Hushe, the satellite phone is the only link for weather, logistics and emergencies, and the radios keep the group in contact when it is spread along a long day on the glacier.'),
P('Guides carry a first aid kit and oxygen. The response to serious altitude illness is descent, immediately and with an escort, and the profile of this route means descent is always possible except during the pass crossing itself.'),
P('Helicopter evacuation from the Baltoro is possible and is arranged through your insurer. This is why we ask for your policy details before you travel rather than looking for them in your rucksack at Concordia.'),
P('Gilgit-Baltistan is the part of Pakistan built around mountain tourism, and these valleys have hosted foreign teams for decades. Foreign trekkers are registered before leaving Skardu and our staff travel with the group throughout. Check your own government&rsquo;s travel advice as well, since advisories change and your insurance may depend on them.'),

H('Booking and payment'),
P('Send us your dates, group size and any questions, and you receive a written itinerary and a full cost breakdown before any payment is discussed. Prices differ with group size and season, so there is no single figure to quote.'),
P('A deposit of 50 per cent confirms the booking and starts the permit and visa paperwork. The remaining 50 per cent is paid after you reach Islamabad and before you travel to Skardu, in euros or US dollars, or by bank transfer.'),
P('This route can also run on private dates for a couple, a family or a private group, with the cost adjusted to the number of people.'),

H('Planning notes'),
P('A strenuous Baltoro circuit that links Concordia with the Hushe Valley through Gondogoro La when conditions and team readiness permit. KVP plans this programme around confirmed road access, accommodation, weather and local operating conditions. The pass crossing is never guaranteed and depends on snow, weather, fixed-rope condition and guide assessment.'),
P('This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.'),

H('Responsible travel'),
P('Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.'),
P('The Baltoro carries heavy traffic in July and August and the pressure shows at Paiju, Urdukas and Concordia. Everything our groups carry in is carried out, including what cannot be burned or buried. We ask the same of our guests.'),

].join('');

/* ============================================= kaam =================== */

const raw = (() => { try { return fs.readFileSync(FILE, 'utf8'); } catch { return null; } })();
if (!raw) { console.log('XX  gondogoro-la-circuit-trek.md nahi mili.'); process.exit(1); }

const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
if (!fm) { console.log('XX  front matter nahi parhi gayi.'); process.exit(1); }

const oldBody = raw.slice(fm[0].length);

const words = (s) => (String(s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

const w0 = words(oldBody);
const w1 = words(BODY);

console.log('\nGONDOGORO LA — SAFHE KA MATAN');
console.log('='.repeat(72));
console.log('   pehle: ' + w0 + ' alfaaz');
console.log('   ab:    ' + w1 + ' alfaaz   (+' + (w1 - w0) + ')');
console.log('');
console.log('   Sections:');
for (const m of BODY.matchAll(/<h2><strong>([^<]+)<\/strong><\/h2>/g)) console.log('      ' + m[1]);

/* Aap ka matan jyun ka tyun hai ya nahi — jaanch */
const KEEP = [
  'The pass crossing is never guaranteed and depends on snow, weather, fixed-rope condition and guide assessment.',
  'This is a starter itinerary rather than a binding quotation.',
  'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules.',
];
console.log('');
console.log('   Aap ka purana matan jo rakha gaya:');
let ok = true;
for (const k of KEEP) {
  const has = BODY.includes(k);
  if (!has) ok = false;
  console.log('      ' + (has ? 'OK ' : 'XX ') + k.slice(0, 62) + '...');
}
if (!ok) { console.log('\nXX  kuch purana matan reh gaya — ruk raha hoon.'); process.exit(1); }

console.log('\n' + '-'.repeat(72));

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/deepen-gondogoro-body.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakbody')) fs.copyFileSync(FILE, FILE + '.bakbody');
fs.writeFileSync(FILE, raw.slice(0, fm[0].length) + '\n' + BODY + '\n', 'utf8');

console.log('LIKHA: src/content/trekking/gondogoro-la-circuit-trek.md');
console.log('\nAgla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs');
