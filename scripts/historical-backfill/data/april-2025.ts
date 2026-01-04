import { MLBDataSnapshot } from '../types';

/**
 * CYCLE 1: April 1, 2025 - "Opening Day Predictions"
 *
 * Context:
 * - Spring training just ended
 * - Opening Day rosters set (April 3, 2025)
 * - No games played yet
 * - Offseason moves completed
 * - Key signings: Ohtani/Yamamoto to Dodgers (2023-24), Soto to Mets (Dec 2024), Sasaki to Dodgers (Dec 2024)
 */

export const april2025Snapshot: MLBDataSnapshot = {
  date: '2025-04-01',
  cycleNumber: 1,
  description: 'Opening Day Predictions',
  gamesPlayed: 0,
  keyEvents: [
    'Offseason complete - all major free agents signed',
    'Spring training concluded March 28',
    'Opening Day set for April 3, 2025',
    'Juan Soto debuts with Mets ($765M contract)',
    'Roki Sasaki enters first full MLB season with Dodgers',
    'Shohei Ohtani back pitching after Tommy John surgery'
  ],
  mlbData: `
# MLB Data Snapshot: April 1, 2025 (Opening Day Preview)

**Current Date:** April 1, 2025
**Season Status:** Opening Day in 2 days (April 3, 2025)
**Games Played:** 0 (Spring Training complete)

---

## AL EAST

### New York Yankees (Projected: 93-69)
**Rotation:** Gerrit Cole, Carlos Rodón, Marcus Stroman, Clarke Schmidt, Luis Gil
**Lineup:** Aaron Judge (CF), Juan Soto GONE to Mets, Anthony Volpe (SS), Gleyber Torres (2B), Giancarlo Stanton (DH)
**Bullpen:** Clay Holmes (closer), Michael King, Ian Hamilton
**Offseason:** Lost Juan Soto to Mets - MAJOR blow to lineup
**Spring Training:** Judge hit .350 with 5 HR, rotation looks strong
**Key Question:** Can they replace Soto's production?
**Vegas Win Total:** 90.5 (Over favored)
**Division Odds:** +200 (2nd favorite)

### Baltimore Orioles (Projected: 95-67)
**Rotation:** Kyle Bradish, Grayson Rodriguez, Dean Kremer, Cole Irvin, John Means
**Lineup:** Adley Rutschman (C), Gunnar Henderson (SS), Anthony Santander (RF), Ryan Mountcastle (1B)
**Young Core:** Henderson (23), Rutschman (25), Rodriguez (24) - all improving
**Offseason:** Mostly internal development, added reliever help
**Spring Training:** Henderson looks like MVP candidate, pitching depth tested
**Key Question:** Can young pitchers handle full season?
**Vegas Win Total:** 92.5 (Over favored)
**Division Odds:** +150 (FAVORITES)

### Tampa Bay Rays (Projected: 86-76)
**Rotation:** Zach Eflin, Taj Bradley, Shane Baz, Aaron Civale, Zack Littell
**Lineup:** Randy Arozarena (OF), Yandy Díaz (1B), Brandon Lowe (2B)
**Offseason:** Low budget moves as usual, lost Tyler Glasnow in 2024
**Spring Training:** Baz looked healthy (injury concerns in 2024)
**Key Question:** Can low-payroll magic continue?
**Vegas Win Total:** 84.5
**Division Odds:** +800

### Toronto Blue Jays (Projected: 82-80)
**Rotation:** Kevin Gaussman, José Berríos, Chris Bassitt, Yusei Kikuchi
**Lineup:** Vladimir Guerrero Jr. (1B), Bo Bichette (SS), George Springer (OF)
**Offseason:** Quiet - no major additions
**Spring Training:** Guerrero looks motivated (contract year approaching)
**Key Question:** Is window closing on young core?
**Vegas Win Total:** 83.5
**Division Odds:** +600

### Boston Red Sox (Projected: 78-84)
**Rotation:** Brayan Bello, Tanner Houck, Kutter Crawford, Nick Pivetta
**Lineup:** Rafael Devers (3B), Triston Casas (1B), Masataka Yoshida (DH)
**Offseason:** Minimal moves, rebuilding phase
**Spring Training:** Young pitchers showed promise
**Key Question:** When will rebuild bear fruit?
**Vegas Win Total:** 79.5
**Division Odds:** +2000

---

## AL CENTRAL

### Cleveland Guardians (Projected: 84-78)
**Rotation:** Shane Bieber, Triston McKenzie, Logan Allen, Cal Quantrill
**Lineup:** José Ramírez (3B), Josh Naylor (1B), Steven Kwan (OF)
**Offseason:** Typical low-budget Cleveland approach
**Spring Training:** Bieber looks recovered from injury
**Key Question:** Enough offense to support pitching?
**Vegas Win Total:** 82.5
**Division Odds:** +180

### Minnesota Twins (Projected: 85-77)
**Rotation:** Pablo López, Sonny Gray, Joe Ryan, Kenta Maeda
**Lineup:** Byron Buxton (CF), Carlos Correa (SS), Royce Lewis (3B/OF)
**Offseason:** Re-signed key players, no big splashes
**Spring Training:** Buxton healthy (rare), Lewis looked explosive
**Key Question:** Can Buxton stay healthy for full season?
**Vegas Win Total:** 83.5
**Division Odds:** +200

### Chicago White Sox (Projected: 65-97)
**Rotation:** Dylan Cease, Lucas Giolito, Lance Lynn
**Lineup:** Luis Robert Jr. (CF), Eloy Jiménez (DH), Andrew Vaughn (1B)
**Offseason:** Fire sale mode - traded key pieces
**Spring Training:** Robert looked disengaged, morale low
**Key Question:** How bad will it get?
**Vegas Win Total:** 67.5 (Under heavily favored)
**Division Odds:** +5000

### Detroit Tigers (Projected: 72-90)
**Rotation:** Eduardo Rodríguez, Casey Mize, Matt Manning
**Lineup:** Spencer Torkelson (1B), Riley Greene (OF)
**Offseason:** Young prospects promoted
**Spring Training:** Torkelson showed power, still developing
**Key Question:** Are they ahead of rebuild schedule?
**Vegas Win Total:** 71.5
**Division Odds:** +1200

### Kansas City Royals (Projected: 70-92)
**Rotation:** Cole Ragans, Jordan Lyles, Alec Marsh
**Lineup:** Bobby Witt Jr. (SS), Salvador Pérez (C), Vinnie Pasquantino (1B)
**Offseason:** Building around Witt Jr.
**Spring Training:** Witt looks like future superstar
**Key Question:** When does young core break through?
**Vegas Win Total:** 72.5
**Division Odds:** +1500

---

## AL WEST

### Houston Astros (Projected: 91-71)
**Rotation:** Framber Valdez, Cristian Javier, Hunter Brown, José Urquidy
**Lineup:** José Altuve (2B), Alex Bregman (3B), Yordan Alvarez (DH), Kyle Tucker (RF)
**Offseason:** Core intact, aging but elite
**Spring Training:** Altuve (35) looks ageless, Bregman contract year
**Key Question:** How much longer can dynasty last?
**Vegas Win Total:** 89.5
**Division Odds:** +130 (FAVORITES)

### Texas Rangers (Projected: 88-74)
**Rotation:** Jacob deGrom (injury history), Nathan Eovaldi, Jon Gray, Andrew Heaney
**Lineup:** Corey Seager (SS), Marcus Semien (2B), Adolis García (RF)
**Defending WS Champions:** Won 2023 World Series
**Offseason:** Mostly ran it back
**Spring Training:** deGrom looked healthy in limited action
**Key Question:** Can deGrom stay healthy? Championship hangover?
**Vegas Win Total:** 87.5
**Division Odds:** +170

### Seattle Mariners (Projected: 84-78)
**Rotation:** Luis Castillo, Logan Gilbert, George Kirby, Bryce Miller - ELITE depth
**Lineup:** Julio Rodríguez (CF), Cal Raleigh (C), Eugenio Suárez (3B)
**Offseason:** Pitching-heavy as always
**Spring Training:** Rodríguez looks explosive, offense still a question
**Key Question:** Can offense finally match elite pitching?
**Vegas Win Total:** 83.5
**Division Odds:** +220

### Los Angeles Angels (Projected: 72-90)
**Rotation:** Post-Ohtani era - Patrick Sandoval, Griffin Canning, Reid Detmers
**Lineup:** Mike Trout (OF - injury prone), Anthony Rendon (3B - rarely healthy)
**Lost Shohei Ohtani:** To Dodgers in 2023-24 offseason
**Offseason:** Rebuilding, trading veterans
**Spring Training:** Trout played 60% of games (concerning)
**Key Question:** Is Trout era ending sadly?
**Vegas Win Total:** 73.5
**Division Odds:** +3000

### Oakland Athletics (Projected: 60-102)
**Rotation:** JP Sears, Paul Blackburn, Kyle Muller
**Lineup:** Brent Rooker (1B/DH), Esteury Ruiz (OF)
**Vegas Relocation:** Moving to Las Vegas after 2024 season - now in Vegas
**Payroll:** Lowest in MLB (~$60M)
**Spring Training:** Half-empty stadium, low morale
**Key Question:** Can they avoid 100 losses?
**Vegas Win Total:** 62.5 (Under favored)
**Division Odds:** +10000

---

## NL EAST

### New York Mets (Projected: 89-73)
**Rotation:** Kodai Senga, José Quintana, David Peterson, Tylor Megill
**Lineup:** JUAN SOTO (RF) - NEW $765M signing, Francisco Lindor (SS), Pete Alonso (1B), Brandon Nimmo (CF)
**Offseason:** MEGA SIGNING - Juan Soto 15yr/$765M (December 2024)
**Spring Training:** Soto hit .380 with 6 HR, looks locked in
**Key Question:** Can Soto deliver immediate results?
**Vegas Win Total:** 88.5 (Over favored)
**Division Odds:** +170

### Atlanta Braves (Projected: 97-65)
**Rotation:** Spencer Strider, Max Fried, Chris Sale, Charlie Morton
**Lineup:** Ronald Acuña Jr. (OF), Matt Olson (1B), Austin Riley (3B), Ozzie Albies (2B)
**Offseason:** Core intact, elite across the board
**Spring Training:** Acuña looks fully healthy after 2024 injury
**Key Question:** Can they finally win it all again?
**Vegas Win Total:** 94.5
**Division Odds:** +110 (FAVORITES)

### Philadelphia Phillies (Projected: 91-71)
**Rotation:** Zack Wheeler, Aaron Nola, Ranger Suárez, Taijuan Walker
**Lineup:** Trea Turner (SS), Bryce Harper (1B/DH), Kyle Schwarber (DH), Nick Castellanos (RF)
**Offseason:** Ran it back after NLCS appearance
**Spring Training:** Harper looked healthy, Wheeler sharp
**Key Question:** Is this the year they break through?
**Vegas Win Total:** 89.5
**Division Odds:** +150

### Miami Marlins (Projected: 74-88)
**Rotation:** Sandy Alcántara (recovering from TJ surgery), Jesús Luzardo, Trevor Rogers
**Lineup:** Jazz Chisholm Jr. (CF), Luis Arraez (2B)
**Offseason:** Quiet, development year
**Spring Training:** Alcántara's recovery on schedule (may return mid-season)
**Key Question:** When does young talent click?
**Vegas Win Total:** 75.5
**Division Odds:** +2500

### Washington Nationals (Projected: 68-94)
**Rotation:** Josiah Gray, MacKenzie Gore, Patrick Corbin
**Lineup:** CJ Abrams (SS), Lane Thomas (OF), Keibert Ruiz (C)
**Offseason:** Still rebuilding
**Spring Training:** Gore showed ace potential
**Key Question:** Light at end of tunnel?
**Vegas Win Total:** 69.5
**Division Odds:** +5000

---

## NL CENTRAL

### Milwaukee Brewers (Projected: 86-76)
**Rotation:** Corbin Burnes, Brandon Woodruff, Freddy Peralta
**Lineup:** Christian Yelich (OF), Willy Adames (SS), William Contreras (C)
**Offseason:** Small market magic as usual
**Spring Training:** Woodruff looked healthy after injury
**Key Question:** Can they hold off Cubs/Cardinals again?
**Vegas Win Total:** 84.5
**Division Odds:** +140 (FAVORITES)

### Chicago Cubs (Projected: 84-78)
**Rotation:** Justin Steele, Marcus Stroman, Jameson Taillon, Kyle Hendricks
**Lineup:** Dansby Swanson (SS), Ian Happ (OF), Seiya Suzuki (RF), Cody Bellinger (1B/OF)
**Offseason:** Mid-tier additions, no splash
**Spring Training:** Bellinger looked rejuvenated
**Key Question:** Ready to contend or still developing?
**Vegas Win Total:** 83.5
**Division Odds:** +180

### St. Louis Cardinals (Projected: 82-80)
**Rotation:** Sonny Gray, Miles Mikolas, Steven Matz
**Lineup:** Nolan Arenado (3B), Paul Goldschmidt (1B - aging), Willson Contreras (C)
**Offseason:** Aging core, unclear direction
**Spring Training:** Goldschmidt (37) showed age, concerning
**Key Question:** Beginning of decline?
**Vegas Win Total:** 81.5
**Division Odds:** +220

### Cincinnati Reds (Projected: 80-82)
**Rotation:** Hunter Greene, Nick Lodolo, Andrew Abbott, Graham Ashcraft
**Lineup:** Elly De La Cruz (SS - electric rookie), Spencer Steer (3B), TJ Friedl (OF)
**Offseason:** Young core developing
**Spring Training:** De La Cruz looks like future superstar
**Key Question:** Playoff dark horse?
**Vegas Win Total:** 79.5
**Division Odds:** +300

### Pittsburgh Pirates (Projected: 73-89)
**Rotation:** Mitch Keller, Luis Ortiz, Johan Oviedo
**Lineup:** Ke'Bryan Hayes (3B), Bryan Reynolds (OF), Oneil Cruz (SS)
**Offseason:** Budget constraints as usual
**Spring Training:** Cruz showed 30-HR potential
**Key Question:** When will they compete again?
**Vegas Win Total:** 74.5
**Division Odds:** +1500

---

## NL WEST

### Los Angeles Dodgers (Projected: 101-61)
**Rotation:** **Shohei Ohtani (pitching again!)**, **Roki Sasaki (rookie - signed Dec 2024)**, Yoshinobu Yamamoto, Tyler Glasnow, Clayton Kershaw
**Lineup:** Shohei Ohtani (DH/P - two-way), Mookie Betts (RF/SS), Freddie Freeman (1B), Will Smith (C)
**Payroll:** Highest in MLB (~$370M) - MASSIVE spending
**Offseason Moves:**
  - Roki Sasaki signed (December 2024) - hyped Japanese phenom
  - Ohtani recovered from Tommy John, pitching Opening Day
  - Yamamoto year 2, Glasnow added
**Spring Training:** Ohtani threw 96 MPH in final start, Sasaki dazzled with 13 Ks
**Key Question:** Can superteam live up to hype?
**Vegas Win Total:** 99.5 (Over favored)
**Division Odds:** -200 (HEAVY FAVORITES)
**World Series Odds:** +350 (FAVORITES)

### San Diego Padres (Projected: 87-75)
**Rotation:** Yu Darvish, Joe Musgrove, Michael King, Dylan Cease
**Lineup:** Fernando Tatís Jr. (OF), Manny Machado (3B), Xander Bogaerts (SS), Jake Cronenworth (2B)
**Offseason:** Reset after disappointing 2024, added Cease
**Spring Training:** Tatís looked explosive and healthy
**Key Question:** Can they keep pace with Dodgers' spending?
**Vegas Win Total:** 86.5
**Division Odds:** +400

### Arizona Diamondbacks (Projected: 85-77)
**Rotation:** Zac Gallen, Merrill Kelly, Brandon Pfaadt, Eduardo Rodríguez
**Lineup:** Ketel Marte (2B), Corbin Carroll (OF), Gabriel Moreno (C)
**Coming off:** 2023 NL Pennant (lost WS to Rangers)
**Offseason:** Ran it back mostly
**Spring Training:** Carroll looked like 2023 ROY form returning
**Key Question:** Can they repeat 2023 magic?
**Vegas Win Total:** 84.5
**Division Odds:** +500

### San Francisco Giants (Projected: 80-82)
**Rotation:** Logan Webb, Blake Snell, Kyle Harrison, Jordan Hicks
**Lineup:** Matt Chapman (3B), Jung Hoo Lee (OF - new Korean signing), LaMonte Wade Jr. (1B)
**Offseason:** Mid-tier signings, no stars
**Spring Training:** Lee showed contact skills, defense questioned
**Key Question:** Can they break .500?
**Vegas Win Total:** 79.5
**Division Odds:** +1200

### Colorado Rockies (Projected: 64-98)
**Rotation:** German Márquez, Kyle Freeland, Cal Quantrill
**Lineup:** Ezequiel Tovar (SS), Ryan McMahon (3B), Nolan Jones (OF)
**Coors Field:** Thin air makes pitching impossible
**Offseason:** Low budget, no hope
**Spring Training:** Márquez looked hittable even in spring
**Key Question:** Can they avoid 100 losses?
**Vegas Win Total:** 66.5 (Under favored)
**Division Odds:** +10000

---

## TOP STORYLINES ENTERING 2025 SEASON

### 1. Dodgers Superteam - Can They Deliver?
**The Hype:** Ohtani ($700M), Yamamoto ($325M), Freeman, Betts, Glasnow, + Roki Sasaki
**The Pressure:** Anything less than World Series = failure
**Opening Day:** Ohtani pitching AND hitting - electric atmosphere
**Vegas Expectations:** 99.5 wins, WS favorites at +350

### 2. Juan Soto's Mets Debut - Worth $765M?
**The Contract:** 15 years, $765M - second biggest in history
**The Expectations:** Immediate contention, carry Mets to playoffs
**Spring Results:** .380 BA, 6 HR - looks worth every penny
**Division Race:** Can Mets challenge Braves with Soto?

### 3. Ohtani Back Pitching - Is He 100%?
**The Injury:** Tommy John surgery sidelined him all 2024
**The Recovery:** 18 months, throwing 96 MPH in spring
**Opening Day:** Scheduled to start April 3 vs Padres
**The Question:** Can he be elite two-way player again?

### 4. Roki Sasaki Hype - Next Ohtani?
**The Signing:** Dodgers landed him December 2024 (posted from NPB)
**Spring Stats:** 15 IP, 13 K, 0.60 ERA - ELECTRIC
**The Hype:** Compared to peak Yu Darvish, "splitter from hell"
**Opening Day Rotation:** Likely #3 starter behind Ohtani/Yamamoto

### 5. Can Anyone Stop the Dodgers?
**NL West:** Padres/D-backs trying, but Dodgers -200 favorites
**Payroll Gap:** Dodgers $370M vs next closest ~$250M
**Talent Gap:** 4 former MVPs, 2 Cy Young winners, Rookie phenom
**The Answer:** Probably not, but injuries happen

### 6. AL East Arms Race - Yankees vs Orioles
**Yankees:** Lost Soto, but still have Judge + elite rotation
**Orioles:** Young core (Henderson 23, Rutschman 25) improving
**Odds:** Orioles +150 favorites, Yankees +200
**Key:** Can O's young pitchers handle full season?

### 7. White Sox Disaster - How Bad Will It Get?
**Projections:** 65-97 (some models say 60-102)
**Morale:** Players openly requesting trades
**Fire Sale:** Traded key pieces, tanking for draft picks
**Vegas:** Under 67.5 wins heavily favored

### 8. Shohei Ohtani's Legacy Year
**Age:** 30 - entering prime
**Contract:** $700M, pressure to deliver
**Two-Way:** If healthy, could be peak Ohtani
**MVP Race:** Early favorite (+250 odds)

### 9. Young Stars Emerging
**Gunnar Henderson (BAL):** MVP dark horse
**Elly De La Cruz (CIN):** 40-40 potential
**Bobby Witt Jr. (KC):** Superstar breakout?
**Julio Rodríguez (SEA):** Can offense match defense?

### 10. Aging Legends - Last Rides?
**Mike Trout (33):** Injury-plagued, Angels rebuilding
**Clayton Kershaw (37):** Final year? Dodgers rotation depth
**Paul Goldschmidt (37):** Cardinals struggling, decline evident
**Max Scherzer (40):** If healthy, can still dominate

---

## BOLD OPENING DAY PREDICTIONS

**World Series:** Dodgers over Orioles (Superteam delivers)
**AL MVP:** Gunnar Henderson (23) - Young breakout
**NL MVP:** Shohei Ohtani - Two-way dominance
**AL Cy Young:** Corbin Burnes (MIL) - Repeat winner
**NL Cy Young:** Roki Sasaki (LAD) - Rookie sensation (BOLD!)
**AL ROY:** Colton Cowser (BAL)
**NL ROY:** Jackson Chourio (MIL)

**Surprise Playoff Team:** Reds (young core clicks)
**Biggest Disappointment:** Yankees (lose division without Soto)
**Trade Deadline Seller:** Angels (Trout trade rumors)
**Breakout Player:** Elly De La Cruz - 35 HR, 70 SB

---

**IMPORTANT CONTEXT FOR PREDICTIONS:**

This is **April 1, 2025** - Opening Day is in 2 days (April 3). You are making predictions for the **2025 MLB season** based on:
- Offseason moves NOW COMPLETE
- Spring training results
- Vegas odds and projections
- NO GAMES PLAYED YET - pure prediction mode

The 2025 season will run April 2025 - October 2025. Make bold predictions knowing we'll validate them at season's end!
`
};
