# SKYWARD — Air Traffic Control (DAA Project)

**Subject:** Design and Analysis of Algorithms  
**Algorithm:** Closest Point of Approach (CPA) conflict detection  
**Type:** Interactive browser simulation

## Abstract

SKYWARD simulates aircraft in a monitored airspace sector. It displays aircraft on a radar, tracks their positions and headings, predicts possible loss of horizontal separation, and ranks alerts by time to closest approach.

## Problem

For each pair of aircraft at the same altitude, determine whether their predicted closest horizontal distance will be less than 5 nautical miles (NM) during the next 21 minutes.

## Algorithm

Let `r = positionB − positionA` and `v = velocityB − velocityA`. Their relative distance is minimized at:

```text
t* = −(r · v) / (v · v)
dmin = |r + v × t*|
```

If relative velocity is zero, distance remains constant. An alert is created if `t*` is between 0 and 0.35 hours, the aircraft are at the same altitude, and `dmin < 5 NM`. Alerts are sorted by time to CPA, soonest first.

### Pseudocode

```text
alerts = []
for each unique aircraft pair (A, B):
    if A.altitude != B.altitude: continue
    r = B.position - A.position
    v = B.velocity - A.velocity
    if dot(v, v) == 0: continue
    t = -dot(r, v) / dot(v, v)
    if 0 <= t <= 0.35 hours:
        d = magnitude(r + v * t)
        if d < 5 NM: add (A, B, d, t) to alerts
sort alerts by t ascending
```

## Complexity

There are `n(n−1)/2` unique aircraft pairs, with constant work per pair. Pair checking takes **O(n²)** time. Sorting `k` alerts takes **O(k log k)**; total time is **O(n² + k log k)**. The alert list uses **O(k)** extra space.

## Features and running

- Live radar animation and aircraft tracks.
- Closest approach and same-altitude conflict alerts.
- Conflict priority queue, pause/resume, reset, and add aircraft controls.
- Responsive browser interface. No server or package installation needed.
- Open `index.html` directly, or publish the files using GitHub Pages.

## Project files

- `index.html` — dashboard structure.
- `styles.css` — visual styling and responsive layout.
- `app.js` — radar drawing, motion, CPA calculation, and alert ranking.

## Limitations

Educational simulation only, not operational ATC software. It assumes point aircraft moving at constant speed and heading, a flat 2D sector, and exact altitude matching. Real safety systems require validated surveillance data, uncertainty and vertical-separation models, operational procedures, and extensive certification.

## Viva questions

1. Why is pair checking O(n²)?
2. What do relative position and velocity mean?
3. Why are negative CPA times excluded?
4. What happens when the relative velocity is zero?
5. How would you model vertical separation or uncertain aircraft positions?
