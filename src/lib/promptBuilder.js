import { LIGHTING_OPTIONS, PRESETS, TIME_OPTIONS, POSE_BY_ID } from '../constants'

const stripDataUrl = (dataUrl) => dataUrl.split(',')[1]

const buildBackgroundContext = ({ bgType, selectedPreset, referenceImage }) => {
  if (bgType === 'preset') return PRESETS.find((p) => p.id === selectedPreset)?.en
  if (bgType === 'custom') return 'Match the exact environment and background shown in the provided Custom Background Reference image.'
  return referenceImage
    ? 'Match the exact environment and background shown in the [Reference Image (Pose/Mood)].'
    : 'Neutral clean studio background, minimalist.'
}

const buildFaceRule = (faceMatch) =>
  faceMatch
    ? `CRITICAL RULE 1: ABSOLUTE FACIAL IDENTITY CLONE (100% MATCH REQUIRED) — USER'S TOP PRIORITY
- The generated model's face MUST perfectly clone the [Model Face Image].
- Do NOT alter the eye shape, nose bridge, lip fullness, jawline, or skin tone.
- The age, ethnicity, and exact facial micro-proportions must remain mathematically identical.
- If the model's face looks even slightly different, it is a critical failure.`
    : `CRITICAL RULE 1: STRICTLY FACELESS COMPOSITION
- This specific shot deliberately crops out or hides the model's face.
- Do NOT show identifiable facial features. The shot must work even with no face shown.
- Use the [Model Face Image] ONLY to match the body's skin tone. NO IDENTIFIABLE FACE.`

const buildBasePrompt = ({
  pose,
  referenceImage,
  bgContext,
  timeContext,
  lightingContext,
  detailCount,
  userDirection,
}) => {
  const detailInfo = detailCount > 0
    ? `\n- The user has provided ${detailCount} DETAIL IMAGES. You MUST strictly extract the fabric texture, brand logo, stitching, and micro-patterns from these details and apply them perfectly to the clothing.`
    : ''

  return `
TASK: High-End Instagram Influencer Sponsorship Post Generation.

${buildFaceRule(pose.faceMatch)}

CRITICAL RULE 2: SPONSOR ITEM INTEGRATION
- The model must be wearing the exact clothing/item shown in the [Sponsor Item Image].
- Retain exact silhouette, color, and textile behavior.${detailInfo}

CRITICAL RULE 3: POSE & FRAMING
- ${pose.en}
${referenceImage ? '- MOOD: Match the overall mood and lighting energy of the [Reference Image (Pose/Mood)] — but follow the pose direction above, not the reference pose.' : ''}

CRITICAL RULE 4: ENVIRONMENT, LIGHTING & VIBE
- Location: ${bgContext}
- Time of Day: ${timeContext}
- Lighting Style: ${lightingContext}
- VIBE: Trending Instagram/TikTok influencer aesthetic. Authentic SNS OOTD style.

CRITICAL RULE 5: OUTPUT FORMAT
- Generate a SINGLE, complete, unified photograph.
- ABSOLUTELY NO collages, NO split screens, NO multi-panel layouts.
- The image must feature the ONE single model.

USER DIRECTION: ${userDirection || 'Make it look like a highly engaged, viral Instagram/TikTok fashion post.'}`
}

/**
 * Build a single content-parts array for one Gemini image generation call.
 *
 * `images` should contain already-prepared base64 strings (no data: prefix)
 * so the caller can cache them across multiple buildShot calls in one batch.
 */
export const buildShot = ({
  poseId,
  images, // { model, sponsor, details[], reference?, customBg? }
  bgType,
  selectedPreset,
  referenceImage,
  timeOfDay,
  lighting,
  prompt,
}) => {
  const pose = POSE_BY_ID[poseId]
  if (!pose) throw new Error(`Unknown pose: ${poseId}`)

  const bgContext = buildBackgroundContext({ bgType, selectedPreset, referenceImage })
  const timeContext = TIME_OPTIONS.find((t) => t.id === timeOfDay)?.en
  const lightingContext = LIGHTING_OPTIONS.find((l) => l.id === lighting)?.en

  const text = buildBasePrompt({
    pose,
    referenceImage,
    bgContext,
    timeContext,
    lightingContext,
    detailCount: images.details.length,
    userDirection: prompt,
  })

  const parts = [{ text }]
  parts.push({ text: '\n[Model Face Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: images.model } })
  parts.push({ text: '\n[Sponsor Item Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: images.sponsor } })
  if (images.details.length > 0) {
    parts.push({ text: `\n[${images.details.length} Sponsor Detail Images]:` })
    images.details.forEach((d) => parts.push({ inlineData: { mimeType: 'image/jpeg', data: d } }))
  }
  if (images.reference) parts.push({ text: '\n[Reference Image (Pose/Mood)]:' }, { inlineData: { mimeType: 'image/jpeg', data: images.reference } })
  if (images.customBg) parts.push({ text: '\n[Custom Background Reference Image]:' }, { inlineData: { mimeType: 'image/jpeg', data: images.customBg } })

  return parts
}

export const prepareImageStrips = ({ modelImage, sponsorImage, detailImages, referenceImage, customBgImage, bgType }) => ({
  model: stripDataUrl(modelImage),
  sponsor: stripDataUrl(sponsorImage),
  details: detailImages.map(stripDataUrl),
  reference: referenceImage ? stripDataUrl(referenceImage) : null,
  customBg: bgType === 'custom' && customBgImage ? stripDataUrl(customBgImage) : null,
})
