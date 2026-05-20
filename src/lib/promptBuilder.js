import { LIGHTING_OPTIONS, PRESETS, TIME_OPTIONS, POSE_BY_ID } from '../constants'

const stripDataUrl = (dataUrl) => dataUrl.split(',')[1]

const buildBackgroundContext = ({ bgType, selectedPreset, referenceImage }) => {
  if (bgType === 'preset') return PRESETS.find((p) => p.id === selectedPreset)?.en
  if (bgType === 'custom') return 'Match the exact environment and background shown in the provided Custom Background Reference image.'
  return referenceImage
    ? 'Match the exact environment and background shown in the [Reference Image (Pose/Mood)].'
    : 'Neutral clean studio background, minimalist.'
}

const buildFaceRule = (faceMatch, modelCount) => {
  // ── Multi-person ──
  if (modelCount > 1) {
    if (faceMatch) {
      const personRules = Array.from({ length: modelCount }, (_, i) =>
        `  - Person ${i + 1} MUST perfectly clone [Model ${i + 1} Face Image].`
      ).join('\n')
      return `CRITICAL RULE 1: ABSOLUTE FACIAL IDENTITY CLONE FOR ALL ${modelCount} PEOPLE (100% MATCH REQUIRED)
- This is a multi-person shot featuring exactly ${modelCount} people.
${personRules}
- Do NOT swap, blend, or mix the identities. Each person must remain themselves.
- The age, ethnicity, eye shape, nose, lips, jawline of each person must remain mathematically identical to their reference.
- If any person's face looks even slightly different from their reference, it is a critical failure.`
    }
    return `CRITICAL RULE 1: STRICTLY FACELESS COMPOSITION (${modelCount} PEOPLE, FACES CROPPED)
- This is a multi-person shot featuring ${modelCount} people, but their faces are deliberately cropped out of frame.
- Use the model face images ONLY to match each body's skin tone. NO IDENTIFIABLE FACES.`
  }

  // ── Single person (legacy path, unchanged) ──
  return faceMatch
    ? `CRITICAL RULE 1: ABSOLUTE FACIAL IDENTITY CLONE (100% MATCH REQUIRED) — USER'S TOP PRIORITY
- The generated model's face MUST perfectly clone the [Model 1 Face Image].
- Do NOT alter the eye shape, nose bridge, lip fullness, jawline, or skin tone.
- The age, ethnicity, and exact facial micro-proportions must remain mathematically identical.
- If the model's face looks even slightly different, it is a critical failure.`
    : `CRITICAL RULE 1: STRICTLY FACELESS COMPOSITION
- This specific shot deliberately crops out or hides the model's face.
- Do NOT show identifiable facial features. The shot must work even with no face shown.
- Use the [Model 1 Face Image] ONLY to match the body's skin tone. NO IDENTIFIABLE FACE.`
}

const buildSponsorRule = (modelCount, detailCount) => {
  const detailInfo = detailCount > 0
    ? `\n- The user has provided ${detailCount} DETAIL IMAGES. You MUST strictly extract the fabric texture, brand logo, stitching, and micro-patterns from these details and apply them perfectly to the clothing.`
    : ''

  if (modelCount > 1) {
    return `CRITICAL RULE 2: SPONSOR ITEM INTEGRATION (PRIMARY WEARER)
- Person 1 (the primary model) MUST be wearing the exact clothing/item shown in the [Sponsor Item Image].
- The OTHER people are styled in plausible coordinated outfits — DO NOT put the sponsor item on more than one person.
- Retain exact silhouette, color, and textile behavior of the sponsor item on Person 1.${detailInfo}`
  }

  return `CRITICAL RULE 2: SPONSOR ITEM INTEGRATION
- The model must be wearing the exact clothing/item shown in the [Sponsor Item Image].
- Retain exact silhouette, color, and textile behavior.${detailInfo}`
}

const buildBasePrompt = ({
  pose, referenceImage, bgContext, timeContext, lightingContext,
  detailCount, userDirection, modelCount,
}) => {
  return `
TASK: High-End Instagram Influencer Sponsorship Post Generation.

${buildFaceRule(pose.faceMatch, modelCount)}

${buildSponsorRule(modelCount, detailCount)}

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
 * Build a single content-parts array for one Gemini image generation call.
 *
 * `images.models` is an array of base64 strings (no data: prefix), 1-4 entries.
 * The first entry is the primary sponsor item wearer.
 */
export const buildShot = ({
  poseId,
  images, // { models: [], sponsor, details[], reference?, customBg? }
  bgType,
  selectedPreset,
  referenceImage,
  timeOfDay,
  lighting,
  prompt,
}) => {
  const pose = POSE_BY_ID[poseId]
  if (!pose) throw new Error(`Unknown pose: ${poseId}`)
  const modelCount = images.models.length
  if (modelCount === 0) throw new Error('At least one model face required.')

  const bgContext = buildBackgroundContext({ bgType, selectedPreset, referenceImage })
  const timeContext = TIME_OPTIONS.find((t) => t.id === timeOfDay)?.en
  const lightingContext = LIGHTING_OPTIONS.find((l) => l.id === lighting)?.en

  const text = buildBasePrompt({
    pose, referenceImage, bgContext, timeContext, lightingContext,
    detailCount: images.details.length, userDirection: prompt, modelCount,
  })

  const parts = [{ text }]
  // Model face images, numbered
  images.models.forEach((face, i) => {
    parts.push({ text: `\n[Model ${i + 1} Face Image]${i === 0 ? ' (primary sponsor wearer)' : ''}:` })
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: face } })
  })
  parts.push({ text: '\n[Sponsor Item Image]:' })
  parts.push({ inlineData: { mimeType: 'image/jpeg', data: images.sponsor } })
  if (images.details.length > 0) {
    parts.push({ text: `\n[${images.details.length} Sponsor Detail Images]:` })
    images.details.forEach((d) => parts.push({ inlineData: { mimeType: 'image/jpeg', data: d } }))
  }
  if (images.reference) parts.push({ text: '\n[Reference Image (Pose/Mood)]:' }, { inlineData: { mimeType: 'image/jpeg', data: images.reference } })
  if (images.customBg) parts.push({ text: '\n[Custom Background Reference Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: images.customBg } })

  return parts
}

export const prepareImageStrips = ({ modelImages, sponsorImage, detailImages, referenceImage, customBgImage, bgType }) => ({
  models: modelImages.filter(Boolean).map(stripDataUrl),
  sponsor: stripDataUrl(sponsorImage),
  details: detailImages.map(stripDataUrl),
  reference: referenceImage ? stripDataUrl(referenceImage) : null,
  customBg: bgType === 'custom' && customBgImage ? stripDataUrl(customBgImage) : null,
})
