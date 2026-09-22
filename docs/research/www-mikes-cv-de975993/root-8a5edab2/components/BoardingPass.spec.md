# BoardingPass Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/access-pass/BoardingPass.tsx` (stub: `export function BoardingPass(props: BoardingPassProps)` — keep the props interface)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/gate-desktop-1440.png` (hovering card above reader), `gate-reading.png` (card mid-swipe through slot)
- **Interaction model:** drag-driven (R3F pointer events + pointer capture) with Rapier physics; idle bob is time-driven.
- Uses: `@react-three/fiber` (useFrame, useThree, ThreeEvent), `@react-three/rapier` (RigidBody, CuboidCollider, RapierRigidBody), `three`. Imports from siblings: `createCardMaterial`, `createCardDepthMaterial`, `CardUniforms` (./cardMaterials), `usePassTextures` (./textures), `playSound` (./sounds), `CARD_H, CARD_T, CARD_RADIUS, READER_W, READER_TILT, CARD_CLEAR_X, SLOT_CARD_Y, slotDepth` (./geometry), `CARD_W, PASS_SCENE, pxPerUnit` (../config). Those sibling files are currently stubs with final signatures — code against the signatures.

## Scene objects (JSX)
```
<RigidBody ref={body} position={[0, hoverY, 0]} type={mode === "fall" || mode === "hidden" ? "dynamic" : "kinematicPosition"}
  colliders={false} ccd gravityScale={0.8} angularDamping={1.2} linearDamping={1.1} onCollisionEnter={onHit}>
  <CuboidCollider args={[CARD_W / 2, CARD_H / 2, CARD_T / 2]} restitution={0.22} friction={0.35} />
  <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onPointerDown={down} onPointerUp={up}>
    <mesh geometry={geo} material={front} position={[0, 0, CARD_T / 2]} renderOrder={-2} castShadow={mode !== "hidden"} customDepthMaterial={depth} />
    <mesh geometry={geo} material={back} position={[0, 0, -CARD_T / 2]} renderOrder={-2} />
  </group>
</RigidBody>
```
- geo = `new PlaneGeometry(CARD_W, CARD_H, 90, 18)` (memo). uniforms = { uCurve: 0, uSlant: 0, uHalfW: CARD_W/2, uHalfH: CARD_H/2, uRadius: CARD_RADIUS } (memo, `{ value }` objects).
- front = createCardMaterial({ map: tex.front, roughness: 1, metalness: 0, envMapIntensity: 0.18, side: FrontSide, shadowSide: DoubleSide }, uniforms); back = createCardMaterial({ map: tex.back, roughness: 1, metalness: 0, envMapIntensity: 0.18, side: BackSide }, uniforms); depth = createCardDepthMaterial(uniforms).

## State & refs
- `mode`: "hover" | "drag" | "fall" | "hidden" (useState, init "hover"); `hovered` bool.
- Refs: grab (Vector3 offset of grab point from body centre), span ({min,max} | null), roll (0), tilt (0), depth (0), lastX (0), lastY (hoverY), wasInSlot (false), lastHitSound (0), lastErrorAt (0), swiped (false), restTime (0), opacity (1), respawnTimer, bend = {curve,curveV,slant,slantV:0, y: hoverY, vy:0, x:0, vx:0}; scratch Vector3 ×2, Quaternion, Euler.
- viewW = size.width / pxPerUnit(size), viewH = size.height / pxPerUnit(size) (size from useThree).
- Cursor effect: when hovered → `document.body.style.cursor = mode === "drag" ? "grabbing" : "grab"`, cleanup → "auto". Clear respawnTimer on unmount.
- setOpacity(o): opacity = o; front.opacity = back.opacity = o.
- respawn(): restTime = 0; setOpacity(0); setMode("hidden"); after `respawnMs` (50): body.setTranslation({0, hoverY, 0}, true), setRotation identity, setLinvel 0, setAngvel 0 (all wake=true); setMode("hover").

## useFrame((state, delta) → port exactly)
1. `p = body.translation()`; `contact.current.x = p.x`; `contact.current.lift = clamp((p.y - CARD_H/2 - slotY) / 1.7, 0, 1)`; `contact.current.fade = opacity`.
2. Bend: `dt = Math.min(delta, .05) || .016`; vy = (p.y - bend.y)/dt; ay = (vy - bend.vy)/dt; store y, vy; same for x → ax. `curveT = .16 + clamp(ay * .024, -.6, .6)`; `slantT = clamp(-ax * .024, -.5, .5)`; spring K=120, C=13: `curveV += ((curveT - curve)*K - curveV*C)*dt; curve += curveV*dt` (same for slant). `f = MathUtils.smoothstep(p.y, .25, .6)`; uniforms.uCurve.value = curve*f; uSlant.value = slant*f.
3. If opacity < 1 and mode === "hover": setOpacity(min(1, opacity + delta / fadeInS)).
4. mode "hover": setNextKinematicTranslation({ x: sin(t*.5)*.05, y: hoverY + sin(t*1.2)*.1, z: 0 }); rotation from Euler(sin(t*.7)*.09, sin(t*.4)*.06, sin(t*.9)*.08) (t = state.clock.elapsedTime).
5. mode "drag":
   - Pointer → world on the z≈0 plane: `q.set(pointer.x, pointer.y, .5).unproject(camera); dir.copy(q).sub(camera.position).normalize(); q.add(dir.multiplyScalar(camera.position.length()))`.
   - `c = cos(roll), s = sin(roll)`; `x = q.x - (grab.x*c - grab.y*s)`; `y = q.y - (grab.x*s + grab.y*c)`; inSlot = false.
   - If `|x| < CARD_CLEAR_X && y < SLOT_CARD_Y`: if `lastY >= SLOT_CARD_Y - .12` → y = SLOT_CARD_Y, inSlot = true; else x = (x ≥ 0 ? 1 : -1) * max(|x|, CARD_CLEAR_X) (can't pass through the body). lastY = y.
   - dx = x - lastX; lastX = x. If inSlot: over = |x| - READER_W/2; over > 0 → targetRoll = -sign(x)*min(over*.9, .85), sink = over*.36; else targetRoll = 0, sink = 0. Else targetRoll = clamp(grab.x*.28, -.35, .35) + clamp(-dx*4, -.3, .3), sink = 0.
   - if inSlot && !wasInSlot → playSound("press"); wasInSlot = inSlot.
   - roll += (targetRoll - roll)*min(1, delta*(inSlot ? 8 : 4.5)); tilt += ((inSlot ? READER_TILT : 0) - tilt)*min(1, delta*10); depth += ((inSlot ? slotDepth(y) : 0) - depth)*min(1, delta*12).
   - setNextKinematicTranslation({ x, y: y - sink, z: depth }); rotation Euler(tilt, 0, roll).
   - If status !== "granted": zone = |y - CARD_H/2 - slotY| < slotTol; onZone(zone). If zone: span ??= {min:x,max:x}; widen with x; if span.max - span.min > traverseSpan && !swiped → swiped = true, onSwiped(). Else: if span && !swiped && performance.now() - lastErrorAt > 600 → lastErrorAt = now, playSound("error"), onError(); span = null.
6. mode "fall": floor = -viewH/2 - CARD_W; v = linvel(); still = |v.x|+|v.y|+|v.z| < .25; restTime = still ? restTime + delta : 0; restingInSlot = |p.x| < READER_W/2 + .1 && |p.y - CARD_H/2 - slotY| < .35; if p.y < floor || (restTime > 1.2 && !restingInSlot) → respawn().

## Pointer handlers
- down(e): e.stopPropagation(); try `(e.target as Element).setPointerCapture(e.pointerId)` (use R3F's typed target); clearTimeout(respawnTimer); t = body.translation(); grab = e.point - t; lastX = t.x; lastY = t.y; span = |t.y - CARD_H/2 - slotY| < slotTol ? {min:t.x,max:t.x} : null; restTime = 0; setMode("drag").
- up(e): e.stopPropagation(); release capture. If e.pointer: x = e.pointer.x*viewW/2 - (grab rotated x), y = e.pointer.y*viewH/2 - (grab rotated y) (same roll rotation as above); apply the same slot clamp as drag; zoneNow = |y - CARD_H/2 - slotY| < slotTol; body.setTranslation({ x, y, z: zoneNow ? slotDepth(y) : depth }, true). Else x,y = body.translation().
  - inZone = |y - CARD_H/2 - slotY| < slotTol; if !swiped && span && inZone && max(span.max, x) - min(span.min, x) > traverseSpan → swiped = true, onSwiped(). span = null; onZone(false); setMode("fall").
  - inZone → setLinvel 0, setAngvel 0, setRotation(Euler(READER_TILT,0,0)), playSound("press"). Else setAngvel({ x: .9, y: .5, z: (Math.random() - .5)*1.4 }), setLinvel({ x: -roll*1.6, y: .3, z: 0 }). wasInSlot = false.
- onHit: now; if now - lastHitSound < 90 || mode === "hidden" return; speed = |linvel|; if speed < .5 return; lastHitSound = now; playSound("press").

## Verified live
- Dragging card down into the slot then sweeping x across ~2.9 units → LCD "SUCCESS", hint "Access granted", `mikescv-pass-unlocked=1`.
