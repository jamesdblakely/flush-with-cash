# Game Systems Reference

This document describes the implemented rules in `src/simulation/state.js` and the balance values in `src/content/theme.js`.

## Starting state and day clock

| Value | Amount |
| --- | ---: |
| Starting cash | $185 |
| Starting condition | 100% |
| Starting satisfaction | 72% |
| Starting reputation | 50 |
| Operating day | 120 simulation minutes |
| Real-time tick | 125 ms per simulation minute |
| Base customer price | $12 |
| Supply cost | $4 every 12 minutes |
| Visit duration | 4 simulation minutes |

The simulation uses a seeded pseudo-random sequence. Given the same state and seed, the same day produces the same outcomes. The seed advances after each random roll and carries into the next day.

## Location configuration

| Site | Tier | Base permit | Price | Traffic | Need chance | Wear multiplier | Requirement |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Canal Walk | Quiet | $40 | $12 | 10 | 63% | 0.85 | — |
| Pigeon Park | Steady | $55 | $12 | 12 | 91% | 1.00 | — |
| Market Lane | Busy | $75 | $12 | 17 | 75% | 1.10 | 30 reputation |
| Office Row | Busy | $95 | $12 | 19 | 56% | 0.90 | — |
| Station Steps | Crush | $125 | $18 | 25 | 82% | 1.90 | 55 reputation |
| Weekend Festival | Crush | $225 | $28 | 55 | 98% | 2.40 | 65 reputation; 80% condition; Friday/Saturday |

Each minute, an arrival is attempted with this probability:

```text
arrival chance = min(1, traffic ÷ 60)
```

The Town Sign multiplies traffic by 1.3 before that check. After an arrival, the visitor needs the facility when a random roll is below the site’s need chance. Everyone else becomes a passerby and generates no money, wear, or satisfaction change.

## Placement and reputation pricing

```text
permit = max(1, round(base permit × (1 - (reputation - 50) ÷ 100)))
```

At 50 reputation, a site costs its listed base permit. At 0 reputation it costs 150% of base. At 100 reputation it costs 50% of base.

A placement requires planning phase, an available selected location, enough cash for the computed permit, the site’s required reputation, the site’s minimum condition, and at least 80% condition on the first day of a new week.

## Customer outcomes

For visitors who need the unit:

1. **Closed unit** — condition is 0%. The visitor turns away, satisfaction decreases by 2, and the business is fined $10. This marks the day as out of service.
2. **Occupied unit** — the current minute is before `occupiedUntil`. The visitor turns away and satisfaction decreases by 0.7.
3. **Service check** — otherwise, the visitor is served when a random roll is lower than `0.45 + condition ÷ 200`. A pristine unit has a 95% service chance and a nearly broken unit has a 45% service chance.
4. **Ordinary turnaway** — when the service check fails. Satisfaction decreases by 1.4.

Every customer turnaway opens an eight-minute surge-pricing window. This includes closed, occupied, and ordinary turnaways.

Successful service increases satisfaction by 0.6, sets occupancy for four simulation minutes, and applies condition wear:

```text
wear = 2.4 × site wear multiplier × (0.85 when reinforced, otherwise 1)
condition = max(0, condition - wear)
```

## Revenue, costs, and profit

```text
reputation multiplier = 0.75 + reputation ÷ 200
customer charge = round(site price × reputation multiplier × surge multiplier)
profit = revenue - costs
```

The surge multiplier is 1.1 only when Surge Pricing is owned and the customer arrives before the latest surge window expires.

Daily costs include the placement permit, service, upgrades bought that day, $4 supplies every 12 minutes (up to $40 per full day), and $10 for each visitor who needs a closed unit. A day succeeds at profit of at least $5 and satisfaction of at least 55%. The daily history stores the profit once at the end of the day.

## Condition and servicing

```text
service = $8 + ceil((100 - condition) ÷ 100 × $40) + reinforced service surcharge
```

The reinforced service surcharge is $12. Service is available only during planning and only if the player retains enough cash for the cheapest base permit afterward.

## Reputation

```text
base change = round((satisfaction - 72) ÷ 8) - floor(turnaways ÷ 5)
```

- If the unit was out of service at any point, subtract an additional 8. Comfort upgrades do not protect against this penalty.
- Otherwise, a non-negative result gains +1 for each of Air Freshener and Fan.
- Otherwise, a negative result is multiplied by `1 - 0.25 × number of comfort upgrades` and rounded up.
- The final daily change is capped between -5 and +5, then reputation is clamped from 0 to 100.

## Upgrades and retention

| Upgrade | Cost | Rule | Retention |
| --- | ---: | --- | --- |
| Town Sign | $60 | Traffic × 1.3 | Current week only |
| Reinforced Structure | $85 | Wear × 0.85; service +$12 | Permanent |
| Surge Pricing | $75 | Charge × 1.1 within an eight-minute turnaway window | Permanent |
| Air Freshener | $45 | +1 positive reputation; 25% less ordinary negative change | Permanent |
| Fan | $55 | Same as Air Freshener | Permanent |

Upgrade purchases require enough remaining cash for the cheapest base permit ($40). Town Sign can be purchased during planning or from the upgrade yard. Other upgrades can be bought only in the upgrade yard. No upgrade can be bought twice.

## Weeks, continuation, and failure

`nextDay` carries forward bank, condition, reputation, seed, history, and permanent upgrades. It clears the day’s selected site, visit counters, revenue, costs, activity, and event log.

At the start of every new week (days 8, 15, 22, and so on), the Town Sign is removed and condition must be at least 80% before placement. Cash, reputation, condition, history, and permanent upgrades remain.

The business can continue only while bank is at least $40, the cheapest base permit. Otherwise the result screen offers a fresh start.

## Saving and visual feedback

The game saves `{ version: 1, state }` to browser local storage after state changes and each operating tick. Invalid saves are rejected; missing optional upgrade fields are defaulted for older saves. A save left on the upgrade screen returns to its planning or result day because the upgrade yard is an overlay.

On the map, landmark hover raises the icon, shows a traffic-colored halo, and highlights the matching area-list label. The street scene animates passers, successful customers, and refusals; the door marker shows **VACANT**, **IN USE**, or **CLOSED**. The calendar shows weekly history, and the equipment yard explains affordability, ownership, and retention.
