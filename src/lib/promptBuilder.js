import { LIGHTING_OPTIONS, PRESETS, TIME_OPTIONS, POSE_BY_ID, ITEM_CATEGORIES } from '../constants'

const stripDataUrl = (dataUrl) => dataUrl.split(',')[1]

const CATEGORY_LABEL_EN = {
  top: 'top / shirt',
  outer: 'outerwear / jacket',
  bottom: 'bottom / pants / skirt',
}

const buildBackgroundContext = ({ bgType, selectedPreset, referenceImage }) => {
  if (bgType === 'preset') return PRESETS.find((p) => p.id === selectedPreset)?.en
  if (bgType === 'custom') return 'Match the exact environment and background shown in the provided Custom Background Reference image.'
  return referenceImage
    ? 'Match the exact environment and background shown in the [Reference Image (Pose/Mood)].'
    : 'Neutral clean studio background, minimalist.'
}

const IDENTITY_LOCK_DETAIL = `
[FACIAL FEATURES — must match exactly]
- Eye shape, eye color, eye spacing, eyelid type (monolid / double-lid)
- Nose: bridge shape, tip shape, width, nostril shape
- Mouth: lip shape, lip fullness, lip line, philtrum
- Jawline, chin shape, cheekbones, forehead shape

[HAIR — CRITICAL, often violated by AI models]
- Exact same haircut and length
- Exact same hair color and shade
- Exact same parting position and direction
- Exact same fringe / bangs / sideburns
- Exact same hair texture (straight / wavy / curly) and volume
- Even when hair is moved by wind or the pose, the underlying CUT must be identical
- Hairline shape and density at temples / forehead must match

[EYEBROWS — must match]
- Exact shape, thickness, arch, color, density

[SKIN]
- Same skin tone, undertone, texture
- Preserve any visible freckles, moles, or skin marks
- Do NOT smooth or beautify beyond what the reference shows

[OTHER]
- Age, ethnicity, body proportions remain mathematically identical
- Ear shape if visible
- Treat the reference photo as a frozen identity template`

const buildFaceRule = (faceMatch, modelCount) => {
  if (modelCount > 1) {
    if (faceMatch) {
      const personRules = Array.from({ length: modelCount }, (_, i) =>
        `  - Person ${i + 1} → [Person ${i + 1} Face Image]`
      ).join('\n')
      return `CRITICAL RULE 1: ABSOLUTE IDENTITY LOCK FOR ALL ${modelCount} PEOPLE — HIGHEST PRIORITY, OVERRIDES EVERYTHING ELSE

This is a multi-person shot featuring exactly ${modelCount} people. Each person's complete identity from their reference image MUST be preserved:
${personRules}

DO NOT swap, blend, or mix identities between people. Each person remains themselves.
${IDENTITY_LOCK_DETAIL}

Even a tiny deviation in facial structure OR hairstyle is a critical failure. The pose, expression, environment, and lighting may all change — but the IDENTITY of every person must not.`
    }
    return `CRITICAL RULE 1: STRICTLY FACELESS COMPOSITION (${modelCount} PEOPLE) — BUT IDENTITY MARKERS STILL LOCKED

Faces are deliberately cropped out of this shot. However, EVERY OTHER identity attribute must still match each person's reference image:
- HAIR: even from behind or side, the exact haircut, length, color, parting, and texture must match each person's reference
- BODY: proportions, skin tone, and build must match
- HANDS: skin tone and proportions match

NO frontal identifiable face. But hair and body MUST clearly be the same individuals as in the references.`
  }

  return faceMatch
    ? `CRITICAL RULE 1: ABSOLUTE IDENTITY LOCK — HIGHEST PRIORITY, OVERRIDES EVERYTHING ELSE

The generated person's complete identity from [Person 1 Face Image] MUST be preserved exactly:
${IDENTITY_LOCK_DETAIL}

Even a tiny deviation in facial structure OR hairstyle is a critical failure. The pose, expression, environment, and lighting may all change — but the IDENTITY must not.`
    : `CRITICAL RULE 1: STRICTLY FACELESS COMPOSITION — BUT IDENTITY MARKERS STILL LOCKED

The face is deliberately cropped out of this shot. However, every OTHER identity attribute from [Person 1 Face Image] must still match:
- HAIR: even from behind or side, the exact haircut, length, color, parting, fringe, and texture must match the reference
- BODY: same proportions, skin tone, build
- HANDS: same skin tone and proportions

NO identifiable face. But hair and body MUST clearly be the same individual as in the reference.`
}

const buildOutfitRule = (models) => {
  // 1:1 mapping. Each person wears their own sponsor item from the matching detail set.
  const lines = models.map((m, i) => {
    const cat = CATEGORY_LABEL_EN[m.category] || 'clothing item'
    const detailNote = m.details.length > 0
      ? ` Refer to [Person ${i + 1} Sponsor Detail Images] for fabric/logo/stitching micro-patterns.`
      : ''
    return `  - Person ${i + 1}: MUST wear the exact ${cat} shown in [Person ${i + 1} Sponsor Item Image].${detailNote}`
  }).join('\n')

  return `CRITICAL RULE 2: PER-PERSON OUTFIT (1:1 MAPPING — CRITICAL)
- Each person is wearing a SPECIFIC sponsored item assigned to them. Do NOT swap items between people.
${lines}
- Retain exact silhouette, color, and textile behavior for each item.
- If two people wear the same category (e.g. both wear tops), they MUST wear DIFFERENT items — never duplicate.`
}

const buildBasePrompt = ({
  pose, referenceImage, bgContext, timeContext, lightingContext,
  userDirection, models,
}) => {
  const modelCount = models.length
  return `
TASK: High-End Instagram Influencer Sponsorship Post Generation.

${buildFaceRule(pose.faceMatch, modelCount)}

${buildOutfitRule(models)}

CRITICAL RULE 3: POSE & FRAMING
- ${pose.en}${modelCount > 1 ? `\n- This is a ${modelCount === 2 ? 'COUPLE / DUO' : 'GROUP'} shot — frame to include all ${modelCount} people naturally within the composition.` : ''}
${referenceImage ? '- MOOD: Match the overall mood and lighting energy of the [Reference Image (Pose/Mood)] — but follow the pose direction above, not the reference pose.' : ''}

CRITICAL RULE 4: ENVIRONMENT, LIGHTING & VIBE
- Location: ${bgContext}
- Time of Day: ${timeContext}
- Lighting Style: ${lightingContext}
- VIBE: Trending Instagram/TikTok influencer aesthetic. Authentic SNS OOTD style.

CRITICAL RULE 5: OUTPUT FORMAT
- Generate a SINGLE, complete, unified photograph.
- ABSOLUTELY NO collages, NO split screens, NO multi-panel layouts.
- The image must feature ${modelCount === 1 ? 'ONE single model' : `exactly ${modelCount} people together in the same frame`}.

USER DIRECTION: ${userDirection || 'Make it look like a highly engaged, viral Instagram/TikTok fashion post.'}`
}

/**
 * Build content-parts for one Gemini image generation call.
 *
 * @param poseId   Pose preset id
 * @param prepared Pre-stripped image data: { models: [{face, sponsor, details}], reference?, customBg? }
 *                 (use prepareImages to produce this from raw dataUrls)
 * @param models   Original model objects (only `.category` is read here — needed for prompt text)
 */
export const buildShot = ({
  poseId, prepared, models,
  bgType, selectedPreset, referenceImage,
  timeOfDay, lighting, prompt,
}) => {
  const pose = POSE_BY_ID[poseId]
  if (!pose) throw new Error(`Unknown pose: ${poseId}`)
  if (!prepared.models?.length) throw new Error('At least one model required.')

  const bgContext = buildBackgroundContext({ bgType, selectedPreset, referenceImage })
  const timeContext = TIME_OPTIONS.find((t) => t.id === timeOfDay)?.en
  const lightingContext = LIGHTING_OPTIONS.find((l) => l.id === lighting)?.en

  const text = buildBasePrompt({
    pose, referenceImage, bgContext, timeContext, lightingContext,
    userDirection: prompt,
    models,
  })

  const parts = [{ text }]

  prepared.models.forEach((m, i) => {
    parts.push({ text: `\n[Person ${i + 1} Face Image]:` })
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: m.face } })

    parts.push({ text: `\n[Person ${i + 1} Sponsor Item Image] (category: ${CATEGORY_LABEL_EN[models[i].category] || 'clothing'}):` })
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: m.sponsor } })

    if (m.details.length > 0) {
      parts.push({ text: `\n[Person ${i + 1} Sponsor Detail Images (${m.details.length} pieces)]:` })
      m.details.forEach((d) => parts.push({ inlineData: { mimeType: 'image/jpeg', data: d } }))
    }
  })

  if (prepared.reference) parts.push({ text: '\n[Reference Image (Pose/Mood)]:' }, { inlineData: { mimeType: 'image/jpeg', data: prepared.reference } })
  if (prepared.customBg) parts.push({ text: '\n[Custom Background Reference Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: prepared.customBg } })

  return parts
}

/**
 * Strip data: prefix from every base64 image once, so we don't redo the work
 * for every variation in a batch.
 */
export const prepareImages = ({ models, referenceImage, customBgImage, bgType }) => ({
  models: models.map((m) => ({
    face: stripDataUrl(m.face),
    sponsor: stripDataUrl(m.sponsor),
    details: m.details.map(stripDataUrl),
  })),
  reference: referenceImage ? stripDataUrl(referenceImage) : null,
  customBg: bgType === 'custom' && customBgImage ? stripDataUrl(customBgImage) : null,
})
