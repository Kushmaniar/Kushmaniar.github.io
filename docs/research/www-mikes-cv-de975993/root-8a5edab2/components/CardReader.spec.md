# CardReader Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/access-pass/CardReader.tsx` (stub: `export function CardReader({ status, contact }: { status: ReaderStatus; contact: RefObject<CardContact> })`)
- **Screenshots:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/gate-desktop-1440.png` (READY, grey LED), `gate-reading.png` (SUCCESS, green glowing LED), `gate-card-in-slot.png`
- **Interaction model:** status-driven (props), contact shadow follows the card per frame.
- Uses: `@react-three/rapier` (RigidBody, CuboidCollider), `@react-three/drei` (RoundedBox), `@react-three/fiber` (useFrame). Sibling imports (stubs with final signatures): `useGrainTexture, useBrushedTexture, useLcdTextures` (./textures), `READER_W, READER_H, READER_TILT` (./geometry), `CARD_W, PASS_SCENE` (../config).

## Constants (reader-local, world units)
```
LIP = .045; FRONT_Z = .35; BACK_D = FRONT_Z - LIP (.305); EDGE = .012; COL_D = FRONT_Z - EDGE (.338); COL_Z = (EDGE + FRONT_Z)/2 (.181)
SLOT_W = .12; GAP = .03; SLOT_DEPTH = 2*LIP + SLOT_W + 2*GAP (.27); SLOT_Z = -SLOT_W/2 (-.06)
BODY_Y = .01; FACE_D0 = .3; FACE_D = FACE_D0 - LIP (.255); FACE_Z = (LIP + FACE_D0)/2 (.1725)
PANEL_D = .1; PANEL_Z = FRONT_Z - PANEL_D/2 (.3); HALF_IN = READER_W/2 - .13 (1.47); TOP = BODY_Y + READER_H/2 (.47)
TRIM_Z0 = .332; TRIM_D = .09; TRIM_Z = TRIM_Z0 - TRIM_D/2 (.287); TRIM_TOP = TOP - .002 (.468)
BAND_TOP = .345; BAND_BOT = .13; SIDE_TOP = .1; SIDE_IN = .78; SIDE_BOT = -.4
SHADOW_Z0 = .05; SHADOW_D = .3; SHADOW_Z = SHADOW_Z0 + SHADOW_D/2 (.2); SHADOW_W = READER_W - .04 (3.16)
```
## Materials
- grainLight = useGrainTexture("#e8ddc6", 900); grainDark = useGrainTexture("#d7cbaf", 700); brushed = useBrushedTexture(3.4, .68); lcd = useLcdTextures()
- TRIM = { map: grainLight, bumpMap: brushed, bumpScale: .5, roughnessMap: brushed, roughness: 1, metalness: .02, envMapIntensity: .45 }
- SHELL = { map: grainDark, bumpMap: brushed, bumpScale: .4, roughnessMap: brushed, roughness: 1, metalness: .02, envMapIntensity: .45 }
- LED colour E = granted "#1e9e52" | near "#d9a013" | error "#e0483a" | idle "#b3aea1"

## Scene (all inside `<RigidBody type="fixed" position={[0, readerY, 0]} rotation={[READER_TILT, 0, 0]} colliders={false}>`)
1. `<CuboidCollider args={[READER_W/2, READER_H/2, COL_D/2]} position={[0, BODY_Y, COL_Z]} restitution={.15} friction={.4} />` and the same at z = -COL_Z (the two slot walls)
2. `<ContactShadow contact={contact} />` (below)
3. RoundedBox args [READER_W, READER_H, FACE_D] radius .07 smoothness 6 position [0, BODY_Y, FACE_Z] castShadow receiveShadow → meshStandardMaterial {...SHELL}
4. RoundedBox [READER_W, READER_H, BACK_D] radius .08 smoothness 6 position [0, BODY_Y, -0.1975 - SLOT_W] cast/receive → SHELL
5. RoundedBox [HALF_IN*2, TRIM_TOP - BAND_TOP, TRIM_D] radius .02 smoothness 5 position [0, (TRIM_TOP + BAND_TOP)/2, TRIM_Z] cast/receive → TRIM
6. RoundedBox [HALF_IN*2, BAND_TOP - BAND_BOT, PANEL_D] radius .022 smoothness 5 position [0, (BAND_TOP + BAND_BOT)/2, PANEL_Z] cast/receive → TRIM
7. for w of [-1, 1]: RoundedBox [HALF_IN - SIDE_IN, SIDE_TOP - SIDE_BOT, PANEL_D] radius .022 smoothness 5 position [w*(HALF_IN + SIDE_IN)/2, (SIDE_TOP + SIDE_BOT)/2, PANEL_Z] cast/receive → TRIM
8. Vents, for w of [-1, 1]: 12 meshes k=0..11 at [w*(.72 + k*.056), TOP - .013, .195] boxGeometry [.018, .03, .185] meshStandardMaterial color "#5b5341" roughness .9; plus one mesh at [w*HALF_IN, TOP - .006, .175] box [.014, .02, .25] color "#8c8267" roughness .9
9. `<CuboidCollider args={[READER_W/2, .3, .35]} position={[0, -.15, 0]} restitution={.05} friction={.9} />`
10. mesh [0, -.15, SLOT_Z] boxGeometry [READER_W - .06, .6, SLOT_DEPTH] meshStandardMaterial color "#1c1b19" roughness .7 (dark slot interior)
11. RoundedBox [1.46, .44, .1] radius .03 smoothness 4 position [0, -.14, .265] meshStandardMaterial color "#232322" roughness .5 metalness .1 (LCD bezel)
12. LCD: mesh [0, -.14, .318] planeGeometry [1.32, .33] meshBasicMaterial map={lcd[status] ?? lcd.idle} toneMapped={false}
13. LED group at [1.35, -.14, FRONT_Z]:
    - mesh [0,0,.002] circleGeometry [.066, 32] meshStandardMaterial "#141412" roughness .5 metalness .2
    - mesh [0,0,.018] torusGeometry [.052, .012, 12, 32] meshStandardMaterial "#4a4a46" roughness .35 metalness .65
    - mesh [0,0,.018] scale [1,1,.32] sphereGeometry [.038, 24, 24] meshPhysicalMaterial color E emissive E emissiveIntensity {status === "idle" ? .2 : 2.6} roughness .12 metalness 0 clearcoat 1 clearcoatRoughness .04 toneMapped false
    - when status !== "idle": mesh [0,0,.038] circleGeometry [.11, 28] meshBasicMaterial color E transparent opacity .16 depthWrite false toneMapped false; and `<pointLight color={E} intensity={.5} distance={.7} decay={2} position={[0, 0, .08]} />`

## ContactShadow (local component, same file)
- uniforms (memo): uX 0, uLift 1, uFade 0, uHalfW CARD_W/2. useFrame: copy contact.current.x/lift/fade into uX/uLift/uFade.
- mesh position [0, TOP + .004, SHADOW_Z] rotation [-Math.PI/2, 0, 0] renderOrder 2; planeGeometry [SHADOW_W, SHADOW_D]; shaderMaterial transparent depthWrite={false} toneMapped={false}
- vertex: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
- fragment (numbers are the constants formatted with toFixed(3)):
```glsl
varying vec2 vP;
uniform float uX; uniform float uLift; uniform float uFade; uniform float uHalfW;
void main() {
  float blur = mix(0.05, 0.62, uLift);
  float dz = 0.200 - vP.y;
  float ax = 1.0 - smoothstep(uHalfW - blur, uHalfW + blur, abs(vP.x - uX));
  float az = exp(-dz / (blur * 0.55 + 0.05));
  float edge = 1.0 - smoothstep(1.510, 1.580, abs(vP.x));
  float a = ax * az * edge * mix(0.46, 0.07, uLift) * uFade;
  gl_FragColor = vec4(0.13, 0.115, 0.08, a);
}
```

## States
- idle: LCD "READY" (grey-green #7d857c), LED dim grey. near: "READING" amber + glow + light. error: "ERROR" red. granted: "SUCCESS" green (#35c56d text, #1e9e52 LED) — bloom picks up the emissive LED (toneMapped false, intensity 2.6).
