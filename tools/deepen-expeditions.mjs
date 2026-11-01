#!/usr/bin/env node
/**
 * deepen-expeditions.mjs   (website ke folder mein)
 *
 * Teen safhe ek saath: Broad Peak, Gasherbrum II, Gasherbrum I.
 * Har ek 1,100-1,400 se taqreeban 2,000+ alfaaz.
 *
 * SAB KUCH YA KUCH BHI NAHI. Agar kisi ek safhe mein bhi masla nikle to
 * teenon mein se koi file nahi likhti. Aadha laga hua kaam sab se bura
 * nateeja hai.
 *
 * JO GHALTIYAN PEHLE HUI, UN KE KHILAAF:
 *   - din "03" ko 3 se milana — sameDay() Number se milata hai
 *   - "highlights: []" na milna — khaana dhoondne ka loose tareeqa, aur
 *     likhne se pehle ginti ke do khaane na ban jayein
 *   - apne purane matan se takrana — naya matan 58 doosre safhon se AUR
 *     teenon naye safhon ka ek doosre se muqabla
 *   - nakaami chup jana — har masla XX ke saath, aur likhna rok deta hai
 *
 * KYUN APPROACH KE DIN CHHOTE HAIN:
 *   Askole se Concordia ka safar K2 Base Camp Trek ke safhe par 10,777
 *   alfaaz mein hai. Usay teen aur safhon par dohrana hi woh masla tha
 *   jis se 32, 26 aur 25 tukron wale jore bane. Ab approach ke din chhote
 *   aur haqeeqat-based hain, aur alfaaz wahan hain jahan har safha waqai
 *   alag hai: pahar khud.
 *
 * AAP KA MATAN: har safhe ke apne zimmedari wale jumle lafz ba lafz rakhe
 * hain. Script khud jaanchta hai; na mile to likhta nahi.
 *
 *   node tools/deepen-expeditions.mjs            -> sirf dikhana
 *   node tools/deepen-expeditions.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CONTENT = path.join(ROOT, 'src', 'content');

const H = (t) => '<h2><strong>' + t + '</strong></h2>';
const P = (t) => '<p>' + t + '</p>';
const UL = (a) => '<ul>' + a.map((i) => '<li><p>' + i + '</p></li>').join('') + '</ul>';
const K2BC = '/trekking/k2-base-camp-trek/';

/* ==================================================================== */
/* BROAD PEAK                                                           */
/* ==================================================================== */

/* Ghante, faasla aur bulandi pehle se khaanon mein hain. Yahan sirf woh
   baat jo is pahar ki team ke liye sach hai. */
const BP_DAYS = {
1:  `Arrival and transfer. Permit, royalty, park fees and the liaison officer are all closed out in the city before anybody travels north.`,
2:  `By air to Skardu if the ranges allow, by road to Chilas if not. Broad Peak teams budget for both: the season is short and a lost week is expensive.`,
3:  `Equipment is checked against the permit inventory and the official briefing is held. A gap found in Skardu is a problem; a gap found at base camp is an expedition.`,
4:  `Askole, and the last wheels of the journey. Loads are weighed and the porter team for the walk in is engaged and recorded.`,
5:  `Jhola. From here the expedition's gear travels on porters' backs and climbers carry daypacks, and it stays that way until base camp.`,
6:  `Paiju, at the gate of the glacier. Broad Peak itself is still not in view and will not be for three more days.`,
7:  `Rest day. Loads are repacked for the glacier stages and the porters bake. Most teams use the afternoon to talk through summit day properly for the first time.`,
8:  `Urdukas. Descending expeditions are often camped here in July, and they carry the season's first reliable word on conditions at the col.`,
9:  `Goro II. Broad Peak closes the head of the valley from here, near enough that the west face and the col can be read through binoculars.`,
10: `Concordia, then north-east to base camp under the west face, where the team will live for six weeks. Our ` + '<a href="' + K2BC + '">K2 base camp trek page</a>' + ` walks the approach in detail.`,
11: `Thirty-two days on the mountain. The west face leads to the col, with camps at roughly 5,800m, 6,400m and 7,100m, and then the summit ridge to 8,051m. Acclimatisation cycles, carries to the high camps, and the waiting. Base camp runs throughout with cook, kitchen and communications.`,
'43-46': `Out along the Baltoro to Askole. Everything the expedition carried up comes down with it, including what cannot be burned or buried at base camp.`,
47: `Askole to Skardu by jeep. Porter accounts are settled in town and the descent paperwork is lodged.`,
48: `Skardu to Islamabad by air if the weather holds. A spare day sits behind this one, because the homeward leg fails as often as the outbound.`,
49: `Debriefing. The expedition report is filed and the permit formally closed; any summit claim is recorded at this stage.`,
50: `Airport transfer, and fifty days end where they began. We hold a room for the day if your flight is a late one.`,
};

const BP_BODY = [
H('About this journey'),
P('Broad Peak, 8,051 metres, stands immediately beside K2 at the head of the Baltoro and shares its approach, its weather and very nearly its base camp. It is the twelfth highest mountain on earth and the one most teams in Pakistan attempt first, because the normal route carries no sustained technical difficulty. What it does carry is a summit ridge that has turned back more parties than almost any other feature in the Karakoram.'),
P('The programme runs fifty days door to door, of which thirty-two are spent at or above base camp. The walk in is the classic Baltoro approach; if you want to know that ground before you arrive, our ' + '<a href="' + K2BC + '">K2 base camp trek page</a>' + ' covers every stage of it.'),

H('The route'),
P('The normal line climbs the west face to the col on the main ridge, with camps at roughly 5,800, 6,400 and 7,100 metres. None of it is technically hard by modern standards: snow and ice slopes, some fixed rope on the steeper sections, and a long but straightforward trudge between camps. The face is exposed to afternoon sun and to wind off K2, and the camps are small and awkwardly placed.'),
P('From the col the route turns along the summit ridge, and this is where Broad Peak becomes a serious mountain. The ridge is narrow, corniced in places, and runs for well over a kilometre at around eight thousand metres. It is not steep. It is simply very long, very high, very cold, and almost always attempted at the end of an already long day.'),

H('The foresummit, and why it matters'),
P('This is the single most important thing to understand about Broad Peak before you book an expedition to it.'),
P('The ridge throws up a false top at about 8,030 metres, twenty metres below the true summit and perhaps an hour or two short of it along the ridge. From the foresummit the real summit is visible but looks close and inconsequential, and the ground between the two is corniced and tiring. A great many climbers over the years have turned around at the foresummit, in good faith, believing they had finished the mountain.'),
P('Several well-known claimed ascents have later been reassessed on exactly this point. If you are climbing Broad Peak for the record as well as for the experience, build the extra hours into your summit-day plan and discuss the turnaround time with your team in advance rather than on the ridge.'),
P('Note also that <strong>Broad Peak Central</strong>, 8,011 metres, is a separate summit on the same massif and is not the same mountain.'),

H('The first ascent'),
P('Broad Peak was climbed on 9 June 1957 by a four-man Austrian team: Marcus Schmuck, Fritz Wintersteller, Kurt Diemberger and Hermann Buhl. They did it without high-altitude porters and without supplementary oxygen, carrying their own loads, which in 1957 was an extraordinary way to climb an eight-thousander and is still regarded as one of the cleanest first ascents in the Karakoram.'),
P('Buhl, who had made the first ascent of Nanga Parbat four years earlier and alone, died three weeks later on Chogolisa, a few kilometres south across Concordia, when a cornice gave way in poor visibility. His body was never recovered. You pass beneath Chogolisa on the walk in, and most teams are told the story somewhere around Goro.'),

H('A first eight-thousander &mdash; with one caution'),
P('Broad Peak is a reasonable choice for a first peak above eight thousand metres, and we say so plainly: the route is within reach of a competent, fit, well-acclimatised alpinist with high-altitude experience on a 6,000 or 7,000-metre peak.'),
P('The caution is the ridge, and the caution is honest. A first-time eight-thousand-metre climber arriving at the col after seven hours, with the summit an hour and a half further along a corniced ridge and the afternoon weather building over K2, faces a decision that experience makes easier. Plan the summit day with that moment in mind. More expeditions on this mountain are decided by turnaround discipline than by fitness.'),

H('Combining with K2 or a Gasherbrum peak'),
P('Teams frequently put Broad Peak together with a second objective in the same season, and we can arrange it as one permit and logistics package rather than two expeditions.'),
P('<strong>With K2</strong> is the common pairing, because the two base camps are a few hours apart on the Godwin-Austen glacier and a team acclimatised on Broad Peak is well placed for a K2 window later in the season. <strong>With a Gasherbrum peak</strong> works too, although the Gasherbrum base camp sits on a different glacier and the move costs days. Tell us at the planning stage, because the permit royalty, the liaison officer and the porter arrangements all change.'),

H('Season'),
P('<strong>20 June to 15 August.</strong> Broad Peak windows cluster in July. Teams arriving at base camp in late June have time to rotate properly before the main settled spell; teams arriving in late July are gambling on a short tail of the season.'),
P('The Baltoro approach is at its most reliable in the same window, which is convenient, and the Skardu flight is at its least reliable throughout, which is not. The programme carries spare days at both ends for that reason.'),

H('Broad Peak in winter'),
P('Broad Peak held out against winter ascent for longer than most of the eight-thousanders, and the story of how it fell is one that climbers here still talk about at base camp.'),
P('A Polish expedition reached the summit on 5 March 2013: Adam Bielecki, Artur Ma&#322;ek, Maciej Berbeka and Tomasz Kowalski. Berbeka had unfinished business with the mountain &mdash; in 1988 he had reached the foresummit in winter and come down believing he had topped out, and it was only later established that he had stopped twenty metres short. Twenty-five years on, he went back and finished it.'),
P('All four reached the top late in the day. Only two came down. Berbeka and Kowalski died on the descent, and the inquiry that followed in Poland examined the summit timings, the decision to continue, and the gap that had opened between the pairs. It is a hard piece of reading and it is directly relevant to anyone planning a summit day on this mountain, for one reason: the thing that killed them was the same long ridge and the same late turnaround that the foresummit question creates in summer.'),
P('None of this is offered as discouragement. Broad Peak in July is a different proposition from Broad Peak in March. It is offered because the mountain&rsquo;s own history makes the single most important point about climbing it better than any safety briefing can.'),

H('What the numbers say'),
P('Broad Peak sees more traffic than any other eight-thousander in Pakistan and the summit rate in a good season is respectable &mdash; which still leaves a meaningful proportion of teams going home without a top, usually because the weather never produced a workable window rather than because anyone was unfit.'),
P('Deaths on the mountain cluster in two places: the descent from the ridge in deteriorating weather, and avalanche on the face. Neither is addressed by being stronger. Both are addressed by turnaround discipline and by crossing the face early. We make that point before you book rather than after.'),

H('Base camp, and the K2 neighbourhood'),
P('Broad Peak base camp sits on the Godwin-Austen glacier a short walk from K2 base camp, and in July the two together form the busiest stretch of ice in the Karakoram. That has practical consequences worth knowing before you arrive.'),
P('It means company: several expeditions, a rope-fixing effort on K2 that the whole glacier watches, and a flow of information about conditions, weather forecasts and who is where on which mountain. It also means a working camp rather than a quiet one, with generators, drying lines and a certain amount of traffic past the tents.'),
P('More usefully, it means a Broad Peak team sits beside the best-informed group of people in the range. Teams acclimatising here routinely swap forecast data and route information with K2 parties, and climbers who came for one mountain have been known to leave having attempted the other. We run base camp with a cook, kitchen and dining tent and communications throughout, and the Gilkey Memorial is a short walk up the glacier for anyone who wants to see it.'),

H('Planning notes'),
P('A full Broad Peak expedition framework with Pakistan permit support, Baltoro approach, base-camp services and high-altitude logistics. Karakoram Vision Pakistan (KVP) plans this programme around confirmed road access, accommodation, weather and local operating conditions. KVP provides logistics according to the signed scope; climbing leadership and individual competence must be clearly agreed.'),
].join('');

const BP_KEEP = [
'A full Broad Peak expedition framework with Pakistan permit support, Baltoro approach, base-camp services and high-altitude logistics.',
'Karakoram Vision Pakistan (KVP) plans this programme around confirmed road access, accommodation, weather and local operating conditions.',
'KVP provides logistics according to the signed scope; climbing leadership and individual competence must be clearly agreed.',
];

/* ==================================================================== */
/* GASHERBRUM II                                                        */
/* ==================================================================== */

const G2_DAYS = {
1:  `Collected on arrival. The climbing permit and its royalty, the national park fee and the liaison officer are dealt with in Islamabad, and the team has its first full briefing over dinner.`,
2:  `Skardu by the scheduled flight when the weather over the ranges cooperates; Chilas by coach when it does not. Either way the programme absorbs it.`,
3:  `A preparation day. Gasherbrum teams hire or buy whatever is still missing in the Skardu bazaar, where thirty years of expeditions have left a surprising amount behind.`,
4:  `Askole. The jeep road ends, the porter team is engaged, and the loads for a month at base camp are weighed and split.`,
5:  `Jhola. A long low-level day that gains almost no height, which is exactly what a team with five and a half thousand metres ahead of it wants.`,
6:  `Paiju. Trees, a spring, and the last running water. From here to base camp the ground is stone and ice.`,
7:  `Rest day. The porters bake for the glacier stages; the team repacks and sleeps. Nothing of the Gasherbrum group is visible yet.`,
8:  `Urdukas, and the last grass anyone on this team will see for six weeks. Gasherbrum IV appears ahead for the first time; the two peaks the expedition actually came for remain concealed behind it until base camp.`,
9:  `Goro II. Gasherbrum IV now fills the skyline ahead &mdash; the wall that screens the two eight-thousanders this expedition has come for.`,
10: `Concordia, and then the parting of ways: the K2 valley goes north, and this route turns east up the South Gasherbrum glacier. Camp at Shaqring, which Baltis call Shama.`,
11: `A short final pull to base camp at 5,100 metres, shared with Gasherbrum I. Tents, kitchen, dining and communications go up for a month's stay.`,
'12-42': `Thirty-one days on the mountain. The route crosses the Gasherbrum icefall and places camps at roughly 6,000m, 6,500m and 7,300m below the summit slopes to 8,035m. Two or three acclimatisation cycles through the icefall, then the window. Base camp runs throughout with cook, kitchen and communications.`,
'43-46': `Back down the Baltoro to Askole. Six weeks of base camp comes out with the team, waste included &mdash; the Gasherbrum camps are inside the national park.`,
47: `Askole to Skardu. Porter wages are settled and the expedition's accounts closed in town.`,
48: `The scheduled flight to Islamabad if conditions permit; the two-day drive if not. The programme keeps spare days here for precisely this.`,
49: `Debriefing. The expedition report goes to the authorities and the permit is formally closed out.`,
50: `The last transfer to the airport. If your flight is an evening one, a room stays available until then.`,
};

const G2_BODY = [
H('About this journey'),
P('Gasherbrum II, 8,035 metres, sits at the head of the Baltoro behind the great wall of Gasherbrum IV, and it is the eight-thousander most often recommended to climbers attempting their first. The normal route is predominantly snow and ice without sustained technical difficulty, the base camp on the South Gasherbrum glacier is comfortable and well established, and it is shared with Gasherbrum I, which makes a two-peak season genuinely practical.'),
P('The whole programme occupies fifty days, thirty-one of them at or above base camp. The approach follows the standard Baltoro route as far as Concordia and then turns east; that walk is set out stage by stage on our ' + '<a href="' + K2BC + '">K2 base camp trek page</a>' + '.'),

H('The route'),
P('From base camp at around 5,100 metres the route crosses the Gasherbrum icefall and then climbs the south-west ridge, with camps at roughly 6,000, 6,500 and 7,300 metres. Above the last camp the summit slopes lead to a final ridge and the top at 8,035 metres.'),
P('Technically it asks little: snow plodding, some ice, fixed rope on short steeper sections, and a summit day that is long rather than difficult. What it asks instead is patience with altitude and a tolerance for waiting. Gasherbrum II windows are usually good when they come, and they do not come often.'),

H('The icefall'),
P('The one genuine hazard on this mountain deserves naming separately, because it is where most of the objective danger on the route is concentrated.'),
P('The Gasherbrum icefall sits between base camp and Camp 1 and has to be crossed on every rotation and every carry. It is a moving, crevassed, seracked section of glacier that changes through the season as the ice melts and shifts, and the line through it is re-rigged and re-routed by the teams in residence rather than being fixed once. Most groups cross it before dawn, when the ice is frozen hard, for exactly the reasons you would expect.'),
P('Nothing about it is beyond a competent alpinist. It is, however, the part of the mountain where the hazard does not care how fit or experienced you are, and the reason teams here cross early and cross quickly.'),

H('The first ascent'),
P('Gasherbrum II was climbed on 7 July 1956 by an Austrian party &mdash; Fritz Moravec, Josef Larch and Hans Willenpart &mdash; who reached the summit after their supplies ran low and they committed to a lightweight push from a high camp rather than retreating down the mountain. It was a bold piece of decision-making for the period and, like the Broad Peak ascent the following year, it was done without supplementary oxygen.'),

H('&ldquo;The most achievable eight-thousander&rdquo;'),
P('Gasherbrum II carries that reputation, and the reputation is broadly fair. It is worth being precise about what it means and what it does not.'),
P('<strong>What it means:</strong> no sustained technical climbing on the normal route, a well-established and comfortable base camp, a shorter and less committing summit day than most of its neighbours, and a high proportion of parties reaching the top in a reasonable season.'),
P('<strong>What it does not mean:</strong> that it is easy. It is above eight thousand metres, which is the part that does not negotiate. The icefall is dangerous, the weather window is short, the upper ridge is exposed, and people have died on this mountain in every decade since it was climbed. &ldquo;More approachable than Gasherbrum I or K2&rdquo; is a comparison, not a reassurance.'),

H('Gasherbrum I and II in one season'),
P('The two peaks share base camp on the South Gasherbrum glacier, which is unusual and useful: a team acclimatised on one is positioned for the other without moving camp, losing days or re-walking the Baltoro.'),
P('In practice most teams climb Gasherbrum II first and use the acclimatisation for an attempt on Gasherbrum I afterwards, which is the harder of the two. The additional cost is largely the second permit royalty rather than a second expedition&rsquo;s logistics. Tell us at the planning stage if that is the intention, because the permit and the liaison officer arrangements must cover both from the start.'),

H('Season'),
P('<strong>20 June to 15 August.</strong> Teams normally reach base camp in the last week of June or the first of July, rotate through the icefall and the upper camps across two or three cycles, and look for a window from mid-July.'),
P('The Skardu flight is the least predictable element of the whole programme in either direction, and the itinerary carries spare days at both ends because of it rather than because of the mountain.'),

H('February 2011: the first winter eight-thousander in Pakistan'),
P('For years the Karakoram was thought to be effectively closed in winter. Not difficult &mdash; closed. The combination of latitude, altitude and the wind that comes off the Tibetan plateau had turned back every attempt on every Pakistani eight-thousander for three decades.'),
P('Gasherbrum II was where that ended. On 2 February 2011, Simone Moro, Denis Urubko and Cory Richards reached the summit, the first winter ascent of any eight-thousand-metre peak in Pakistan. They did it as a self-contained team of three, without supplementary oxygen, in temperatures that froze the moisture inside their suits.'),
P('The descent nearly ended it. The three were caught in an avalanche low on the mountain and swept some distance before it stopped; the footage Richards shot in the minutes afterwards, with his face iced over and his composure gone, became one of the most widely seen pieces of mountaineering film ever made. All three walked out.'),
P('It is worth knowing this about the mountain you have chosen as an achievable eight-thousander, because it says something accurate about it. Gasherbrum II is approachable in July. It is also a mountain where three of the strongest high-altitude climbers alive were nearly killed by the glacier on the way home.'),

H('Who reaches the top'),
P('Gasherbrum II has one of the better summit rates among the eight-thousanders in a settled season, and most teams that fail here fail for one of two reasons: the window never came, or the icefall closed the route for long enough to eat the acclimatisation.'),
P('Fitness is rarely the limiting factor on this mountain. Patience usually is. Teams that arrive with fifty days and the willingness to spend thirty of them waiting do substantially better than teams that arrive with a tight schedule and a return flight to make.'),

H('Life at 5,100 metres'),
P('A Gasherbrum expedition spends most of its fifty days in one place, and that place deserves a description, because climbers who have only done shorter trips underestimate what a month at base camp is actually like.'),
P('The camp sits on moraine beside the South Gasherbrum glacier, enclosed by Gasherbrum I, II and VI and the wall of Gasherbrum IV behind. It is comfortable as these things go: a mess tent with a table, a dedicated kitchen with a cook and assistants who stay the whole season, individual sleeping tents, a toilet tent, and a communications set-up that works. Fresh food lasts the first fortnight and the diet narrows after that.'),
P('What takes people by surprise is the rhythm. A climbing month is not thirty-one days of climbing: it is two or three rotations of three to five days each, long stretches of doing almost nothing between them, and then a sudden compression when a forecast firms up. Bring books, downloaded films, a hard drive, something to work on. The climbers who cope best with Gasherbrum are usually the ones who came prepared to be bored.'),

H('Planning notes'),
P('A Gasherbrum II expedition programme covering permits, Baltoro access, base camp and staged high-altitude support.'),
P('Karakoram Vision Pakistan plans this programme around confirmed road access, accommodation, weather and local operating conditions. Final service scope must define oxygen, ropes, high-altitude staff, communication and rescue arrangements etc which are not included in our service.'),
P('This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.'),

H('Responsible travel'),
P('Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.'),
].join('');

const G2_KEEP = [
'A Gasherbrum II expedition programme covering permits, Baltoro access, base camp and staged high-altitude support.',
'Karakoram Vision Pakistan plans this programme around confirmed road access, accommodation, weather and local operating conditions.',
'This is a starter itinerary rather than a binding quotation.',
'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules.',
];

/* ==================================================================== */
/* GASHERBRUM I  (Hidden Peak)                                          */
/* ==================================================================== */

const G1_DAYS = {
1:  `Met on arrival. The permit for an 8,080-metre peak, the royalty, the park fee and the liaison officer are all settled in Islamabad first.`,
2:  `To Skardu by air if the ranges are clear, to Chilas by road if they are not. Hidden Peak teams are experienced enough not to be surprised by either.`,
3:  `A day for final preparations in Skardu: inventory against the permit, the official briefing, and whatever the bazaar can still supply.`,
4:  `Askole. Beyond the village there are no wheels and no electricity for six weeks, and every kilogram above this point is carried.`,
5:  `Jhola. Little height is gained today, which suits a team whose objective sits three kilometres higher than anything it will sleep on this week.`,
6:  `Paiju. The last trees of the journey. Hidden Peak is a week away and, true to its name, completely invisible from here.`,
7:  `The rest day every Baltoro expedition keeps. Porters bake for the glacier; the team walks a little, checks loads, and sleeps.`,
8:  `Urdukas, on its terraces above the ice. The Trango walls stand opposite; the Gasherbrum group is still screened by everything in front of it.`,
9:  `Goro II. Gasherbrum IV dominates the head of the valley &mdash; the very wall that has kept this mountain out of sight since 1856.`,
10: `Concordia, then east off the main glacier and up the South Gasherbrum branch to Shaqring, known locally as Shama. Our ' + '<a href="' + K2BC + '">K2 base camp page</a>' + ' describes the Baltoro itself in full.`,
11: `The final approach to the base camp both Gasherbrum eight-thousanders share. Hidden Peak proves its name today: it appears only once you are nearly standing beneath it.`,
'12-42': `Thirty-one days on the mountain. The usual line is the Japanese Couloir on the north-west face, with camps at roughly 5,900m, 6,400m and 7,100m below the summit at 8,080m. Fixing the couloir, acclimatisation cycles, and then the window. Base camp runs throughout with cook, kitchen and communications.`,
'43-46': `Down the Baltoro to Askole, acclimatised and travelling light. The first grass at Paiju lands differently after six weeks on moraine.`,
47: `Askole down to Skardu by jeep, the road cut into the cliff above the Braldu for most of the way.`,
48: `Skardu to Islamabad by air if the weather permits, by road if it does not. The reserve days at this end of the programme exist for that question.`,
49: `The official debriefing: expedition report filed, permit closed, and the paperwork of six weeks finally finished.`,
50: `Transfer to the airport and the formal close of the expedition. A room can be kept for the day if you fly out late.`,
};

const G1_BODY = [
H('About this journey'),
P('Gasherbrum I, 8,080 metres, is the eleventh highest mountain on earth and the harder of the two Gasherbrum eight-thousanders by a considerable margin. Climbers know it as Hidden Peak, and the name is literal: the mountain stays out of view behind the Gasherbrum wall for almost the entire length of the Baltoro and only appears when you are nearly standing underneath it.'),
P('The expedition runs fifty days, of which thirty-one are spent at or above base camp. Almost everyone who comes to this mountain has stood on top of an eight-thousander before, and the standard route explains why that is the sensible order to do things in.'),

H('Why it is called Hidden Peak'),
P('In 1856 a survey officer working on the Great Trigonometrical Survey of India picked out the main Karakoram summits from a station more than two hundred kilometres away in Kashmir and gave them reference numbers. This one became <strong>K5</strong>, the fifth peak of the Karakoram. K1 turned out to be Masherbrum and acquired its local name back; K2 kept its number permanently; K5 ended up with two names and uses neither of its originals much today.'),
P('The second name arrived in 1892, when Martin Conway came up the Baltoro on the expedition that also named Snow Lake and Concordia. The mountain is screened the whole way by the Gasherbrum massif in front of it, and Conway called it Hidden Peak for exactly that reason. Walk the Baltoro yourself and the name stops being poetic: Gasherbrum IV dominates the head of the valley for days, Gasherbrum II shows itself from Concordia, and Gasherbrum I appears only once the route has turned off the main glacier and climbed the South Gasherbrum branch to base camp.'),
P('It sits on the border, with Shigar district in Gilgit-Baltistan on the Pakistani side and Xinjiang on the Chinese, and it is climbed from Pakistan.'),

H('The route'),
P('The standard line today is the <strong>Japanese Couloir</strong> on the north-west face, with camps at roughly 5,900, 6,400 and 7,100 metres before a long summit day to 8,080 metres. The couloir is the reason this is a harder mountain than its neighbour: steeper ground, rock and ice rather than snow slopes, a genuine need for fixed rope, and real exposure to stonefall and avalanche depending on conditions and the hour.'),
P('Above the couloir the route joins the upper face and the summit day is long, cold and committing, with no quick retreat once the party has gone high. Teams that climb Gasherbrum II and then look at Gasherbrum I from the same base camp often describe the step up between them as larger than the four hundred and fifty metres of extra height suggests.'),

H('The 1958 first ascent'),
P('Gasherbrum I was climbed on 5 July 1958 by Pete Schoening and Andy Kauffman, members of an eight-man American expedition led by Nicholas Clinch, with Richard Irvin, Tom Nevison, Tom McCormack, Bob Swift and Gil Roberts completing the team.'),
P('It was the first eight-thousand-metre peak to be first-climbed by Americans, and it came five years after Schoening had held five falling climbers on a single ice axe belay on K2 in the accident that killed Art Gilkey &mdash; the memorial for whom stands on the glacier a day&rsquo;s walk from here. The 1958 expedition was by the south-east ridge rather than the Japanese Couloir, which was established as the normal route a quarter of a century later.'),

H('1975: the ascent that changed how eight-thousanders are climbed'),
P('Gasherbrum I has a place in mountaineering history out of all proportion to how often it is climbed, and it has nothing to do with the first ascent.'),
P('In August 1975 Reinhold Messner and Peter Habeler climbed this mountain as a team of two, by a new route on the north-west face, in three days from the glacier. No porters above base camp. No supplementary oxygen. No fixed ropes, no established camps, no siege. They carried what they needed and went up.'),
P('Until then every eight-thousander had been climbed in expedition style &mdash; a pyramid of camps, fixed rope and load-carrying built up over weeks, with the summit pair standing on the work of everyone below. Messner and Habeler demonstrated that an eight-thousand-metre peak could be climbed the way the Alps are climbed, by a small party moving fast and light. Three years later the same pair applied the logic to Everest without oxygen.'),
P('Almost every lightweight ascent in the Karakoram since descends from that week on Gasherbrum I. Climbers arriving at base camp today are, whether they think about it or not, standing at the place where modern high-altitude mountaineering was argued into existence.'),
P('<strong>In winter</strong>, the mountain fell on 9 March 2012 to Adam Bielecki and Janusz Go&#322;&#261;b, a Polish pair &mdash; another of the Karakoram winter ascents that came, as they nearly all did, from Poland.'),

H('Harder than Gasherbrum II &mdash; the honest comparison'),
P('Both mountains are climbed from the same base camp and are routinely discussed in the same breath, which obscures a real difference.'),
UL([
'<strong>Gasherbrum II, 8,035 m</strong> &mdash; mostly snow and ice, no sustained technical ground, a shorter summit day, and the eight-thousander most often recommended as a first.',
'<strong>Gasherbrum I, 8,080 m</strong> &mdash; the Japanese Couloir is steep and objectively exposed, the summit day is long and committing, and a far smaller proportion of attempts succeed.',
]),
P('If this is your first peak above eight thousand metres, we will say so and suggest ' + '<a href="/expeditions/gasherbrum-ii-expedition/">Gasherbrum II</a>' + ' instead. That is not a sales position; it is what the two routes are.'),

H('Climbing both in one season'),
P('Because the two peaks share base camp, adding Gasherbrum I to a Gasherbrum II expedition costs the second permit royalty and the extra days rather than a second expedition. Acclimatisation carries across directly.'),
P('The usual sequence is Gasherbrum II first and Gasherbrum I afterwards, in that order, for the obvious reason. Tell us at the planning stage so that the permits, the liaison officer and the base camp provisioning cover both from the beginning.'),

H('Season'),
P('<strong>20 June to 15 August</strong>, with the summit window almost always in July. Teams reach base camp in late June, rotate through the couloir and the upper camps, and wait.'),

H('The Gasherbrum cirque'),
P('The last two days of the walk in leave the Baltoro and climb a side branch into an enclosed basin that most Karakoram trekkers never see, and it is worth understanding what stands around you there.'),
P('<strong>Gasherbrum IV</strong>, 7,925 metres, is the wall that hides everything behind it. Its west face is one of the most celebrated pieces of ground in mountaineering, climbed in 1985 in a style that is still discussed, and it is the face that dominates the upper Baltoro for days before you ever reach the Gasherbrum glacier. It is not an eight-thousander and it is considerably harder than either of the two that are.'),
P('Behind it the basin holds the two eight-thousanders themselves &mdash; <strong>Gasherbrum I</strong> and <strong>Gasherbrum II</strong>, 8,080 and 8,035 metres respectively &mdash; with <strong>Gasherbrum III</strong>, <strong>V</strong> and <strong>VI</strong> filling the rest of the rim &mdash; six named summits in one cirque, three of them above seven and a half thousand metres. Chogolisa and Baltoro Kangri close the view back towards Concordia.'),
P('The name itself is often translated as &ldquo;shining wall&rdquo;, which is an attractive phrase attached to the wrong mountain &mdash; it belongs to Gasherbrum IV&rsquo;s west face catching the evening light. The Balti root is closer to &ldquo;beautiful mountain&rdquo;. Standing on the glacier below the cirque at dusk, both readings feel defensible.'),

H('Planning notes'),
P('This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.'),

H('Responsible travel'),
P('Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.'),
].join('');

const G1_KEEP = [
'This is a starter itinerary rather than a binding quotation.',
'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules.',
];

/* ==================================================================== */

const PAGES = [
  { ref: 'expeditions/broad-peak-expedition.md',    name: 'Broad Peak',     days: BP_DAYS, body: BP_BODY, keep: BP_KEEP },
  { ref: 'expeditions/gasherbrum-ii-expedition.md', name: 'Gasherbrum II',  days: G2_DAYS, body: G2_BODY, keep: G2_KEEP },
  { ref: 'expeditions/ghasherbrum-1.md',            name: 'Gasherbrum I',   days: G1_DAYS, body: G1_BODY, keep: G1_KEEP },
];

/* ===================== auzaar ======================================== */

const words = (s) => (String(s || '')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
  .match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

const normWords = (s) => String(s || '')
  .replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
  .toLowerCase().match(/[a-z0-9]+/g) || [];

const runs = (t, n = 10) => {
  const w = normWords(t); const s = new Set();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' '));
  return s;
};

/* Yahi woh ghalti thi: "03" ko "3" se nahi milata tha. */
const sameDay = (a, b) => {
  const x = String(a).trim(), y = String(b).trim();
  if (x === y) return true;
  const nx = Number(x), ny = Number(y);
  return Number.isFinite(nx) && Number.isFinite(ny) && nx === ny;
};

/* Yahi doosri ghalti thi: "highlights: []" nahi milta tha. */
const findKey = (lines, key) => {
  for (let i = 0; i < lines.length; i++) {
    if (!new RegExp('^' + key + ':').test(lines[i])) continue;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^---\s*$/.test(lines[j]) || /^[A-Za-z_][A-Za-z0-9_]*:/.test(lines[j])) return { start: i, end: j };
    }
    return { start: i, end: i + 1 };
  }
  return null;
};

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc); else if (e.name.endsWith('.md')) acc.push(f);
  }
  return acc;
};

/* ===================== kaam ========================================== */

const problems = [];
const prepared = [];

console.log('\nTEEN EXPEDITION SAFHE — EK SAATH');
console.log('='.repeat(82));
console.log('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

for (const page of PAGES) {
  const file = path.join(CONTENT, ...page.ref.split('/'));
  console.log('   ' + page.name + '   (' + page.ref + ')');
  console.log('   ' + '-'.repeat(78));

  if (!fs.existsSync(file)) { console.log('      XX  file nahi mili'); problems.push(page.name + ': file nahi mili'); continue; }

  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);

  const at = findKey(lines, 'itinerary');
  if (!at) { console.log('      XX  itinerary block nahi mila'); problems.push(page.name + ': itinerary block'); continue; }

  let itin;
  try { itin = yaml.load(lines.slice(at.start, at.end).join('\n')).itinerary; }
  catch (e) { console.log('      XX  itinerary YAML: ' + e.message); problems.push(page.name + ': YAML'); continue; }
  if (!Array.isArray(itin)) { console.log('      XX  itinerary list nahi'); problems.push(page.name + ': list'); continue; }

  /* har din ka bayaan mojood hai? */
  const unmatched = [];
  for (const d of itin) {
    const key = Object.keys(page.days).find((k) => sameDay(k, d.day));
    if (!key) unmatched.push(String(d.day));
  }
  const extra = Object.keys(page.days).filter((k) => !itin.some((d) => sameDay(k, d.day)));

  if (unmatched.length) { console.log('      XX  in dinon ka naya bayaan nahi: ' + unmatched.join(', ')); problems.push(page.name + ': din ' + unmatched.join(',')); }
  if (extra.length) { console.log('      XX  yeh din safhe par nahi hain: ' + extra.join(', ')); problems.push(page.name + ': fazool din ' + extra.join(',')); }

  /* aap ka matan mojood hai? */
  let keepOk = true;
  for (const k of page.keep) if (!page.body.includes(k)) { keepOk = false; console.log('      XX  aap ka jumla naye matan mein nahi: "' + k.slice(0, 54) + '..."'); problems.push(page.name + ': keep'); }

  const fmOld = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fmOld) { console.log('      XX  front matter nahi parhi gayi'); problems.push(page.name + ': front matter'); continue; }

  const b0 = words(raw.slice(fmOld[0].length)), b1 = words(page.body);
  let i0 = 0, i1 = 0;
  for (const d of itin) {
    i0 += words(d.description);
    const key = Object.keys(page.days).find((k) => sameDay(k, d.day));
    i1 += words(key ? page.days[key] : d.description);
  }
  console.log('      matan:      ' + String(b0).padStart(5) + '  ->  ' + b1);
  console.log('      itinerary:  ' + String(i0).padStart(5) + '  ->  ' + i1);
  console.log('      KUL:        ' + String(b0 + i0).padStart(5) + '  ->  ' + (b1 + i1));
  console.log('      sections:   ' + [...page.body.matchAll(/<h2>/g)].length + '   |   aap ke jumle rakhe: ' + (keepOk ? 'OK' : 'XX'));
  console.log('');

  prepared.push({ page, file, raw, eol, lines, at, itin, newText: page.body + ' \n ' + Object.values(page.days).join(' \n ') });
}

/* ---- dohra matan: poori website + teenon ka aapas mein ---- */

console.log('   DOHRA MATAN KI JAANCH');
console.log('   ' + '-'.repeat(78));

/* Aap ke boilerplate jumle jaanch se nikal diye jate hain. Woh har safhe
   par hain aur hone chahiyein — warna check unhein pakar kar likhna rok
   deta. Khud rakhe hone ki jaanch ooper alag ho chuki hai. */
const STRIP = [
  'This is a starter itinerary rather than a binding quotation. Final services, permits, safety arrangements, hotel category and payment schedule are confirmed in writing after the travel dates and group profile are received.',
  'Guests are expected to respect local communities, cultural sites, protected areas and mountain waste rules. The operating plan prioritizes realistic travel times and local services.',
  'Karakoram Vision Pakistan (KVP) plans this programme around confirmed road access, accommodation, weather and local operating conditions.',
  'Karakoram Vision Pakistan plans this programme around confirmed road access, accommodation, weather and local operating conditions.',
  'Final service scope must define oxygen, ropes, high-altitude staff, communication and rescue arrangements etc which are not included in our service.',
  'KVP provides logistics according to the signed scope; climbing leadership and individual competence must be clearly agreed.',
  'A full Broad Peak expedition framework with Pakistan permit support, Baltoro approach, base-camp services and high-altitude logistics.',
  'A Gasherbrum II expedition programme covering permits, Baltoro access, base camp and staged high-altitude support.',
  'Base camp runs throughout with cook, kitchen and communications.',
];
const stripBoiler = (t) => { let s = t; for (const b of STRIP) s = s.split(b).join(' '); return s; };

const mineRefs = new Set(PAGES.map((p) => path.resolve(path.join(CONTENT, ...p.ref.split('/')))));
const others = walk(CONTENT).filter((f) => !mineRefs.has(path.resolve(f)));

const freq = new Map();
const otherSets = [];
for (const f of others) {
  const s = runs(fs.readFileSync(f, 'utf8'));
  otherSets.push({ ref: path.relative(CONTENT, f).split(path.sep).join('/'), s });
  for (const x of s) freq.set(x, (freq.get(x) || 0) + 1);
}
const boiler = new Set(); for (const [x, c] of freq) if (c >= 4) boiler.add(x);
console.log('      ' + others.length + ' doosre safhe parhe, ' + boiler.size + ' boilerplate tukre chhore gaye.');

let clashTotal = 0;
for (const p of prepared) {
  const mine = runs(stripBoiler(p.newText));
  const hits = [];
  for (const { ref, s } of otherSets) {
    const h = []; for (const x of mine) if (s.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref, h });
  }
  /* teenon naye safhon ka aapas mein */
  for (const q of prepared) {
    if (q === p) continue;
    const qs = runs(stripBoiler(q.newText));
    const h = []; for (const x of mine) if (qs.has(x) && !boiler.has(x)) h.push(x);
    if (h.length) hits.push({ ref: '(naya) ' + q.page.ref, h });
  }
  hits.sort((a, b) => b.h.length - a.h.length);
  if (!hits.length) { console.log('      OK  ' + p.page.name + ' — saaf'); continue; }
  console.log('      XX  ' + p.page.name + ':');
  for (const x of hits) {
    console.log('            ' + String(x.h.length).padStart(3) + '  ' + x.ref);
    for (const r of x.h) console.log('                    "' + r + '"');
    clashTotal += x.h.length;
  }
  problems.push(p.page.name + ': ' + hits.reduce((n, x) => n + x.h.length, 0) + ' dohre tukre');
}

/* ---- faisla ---- */

console.log('');
console.log('='.repeat(82));
if (problems.length) {
  console.log('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) console.log('          ' + m);
  console.log('');
  console.log('   Yeh list mujhe bhej dein, badal dunga.');
  process.exit(1);
}
console.log('   Teenon safhe saaf. Dohre tukre: ' + clashTotal);
console.log('');

if (!WRITE) {
  console.log('Lagane ke liye:');
  console.log('   node tools/deepen-expeditions.mjs --write');
  process.exit(0);
}

/* ---- likhna: pehle sab taiyar karo, phir sab likho ---- */

const toWrite = [];
for (const p of prepared) {
  for (const d of p.itin) {
    const key = Object.keys(p.page.days).find((k) => sameDay(k, d.day));
    if (key) d.description = String(p.page.days[key]).replace(/\s*\n\s*/g, ' ').trim();
  }
  const dmp = yaml.dump({ itinerary: p.itin }, { lineWidth: -1, noRefs: true }).split('\n');
  while (dmp.length && dmp[dmp.length - 1] === '') dmp.pop();
  const newLines = [...p.lines.slice(0, p.at.start), ...dmp, ...p.lines.slice(p.at.end)];

  /* ek hi itinerary khaana ho */
  const nI = newLines.filter((l) => /^itinerary:/.test(l)).length;
  if (nI !== 1) { console.log('XX  ' + p.page.name + ': front matter mein ' + nI + ' baar "itinerary:" — kuch nahi likha.'); process.exit(1); }

  let text = newLines.join(p.eol);
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  let ok = false;
  try {
    const v = yaml.load(fm[1]);
    ok = Array.isArray(v.itinerary) && v.itinerary.length === p.itin.length;
  } catch (e) { console.log('XX  ' + p.page.name + ': naya YAML ' + e.message); }
  if (!ok) { console.log('XX  ' + p.page.name + ': jaanch nakaam — kuch nahi likha.'); process.exit(1); }

  toWrite.push({ file: p.file, ref: p.page.ref, text: text.slice(0, fm[0].length) + '\n' + p.page.body + '\n' });
}

for (const w of toWrite) {
  if (!fs.existsSync(w.file + '.bakexp')) fs.copyFileSync(w.file, w.file + '.bakexp');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + w.ref);
}
console.log('');
console.log(toWrite.length + ' files likhi gayi. backup: *.bakexp');
console.log('');
console.log('Agla qadam:  npm run build');
console.log('Phir:        node tools/count-words.mjs  aur  node tools/audit-content.mjs');
