// 포즈 프리셋 라이브러리
// crop: 'full' | 'upper' | 'lower'  — 프레이밍 + 얼굴 노출 결정
// faceMatch: true면 얼굴 100% 매치, false면 얼굴 크롭 또는 뒷모습

export const POSE_PRESETS = [
  // FULL BODY ──────────────────────────────────────
  {
    id: 'full_dynamic', label: '전신 다이내믹', emoji: '🚶‍♀️', crop: 'full', faceMatch: true,
    en: 'Strict full body shot from head to toe. Confident dynamic editorial pose, very Instagram-worthy. Sharp posture, slight asymmetry.',
  },
  {
    id: 'full_walking', label: '워킹', emoji: '🚶', crop: 'full', faceMatch: true,
    en: 'Strict full body shot from head to toe. Casual walking motion, slight stride mid-step, candid street snap feel.',
  },
  {
    id: 'full_back', label: '뒷모습', emoji: '🔙', crop: 'full', faceMatch: false,
    en: 'Strict full body shot from behind. Model facing away, looking back over shoulder, showing the entire outfit from the back. No frontal face.',
  },
  {
    id: 'full_side', label: '옆모습', emoji: '↔️', crop: 'full', faceMatch: true,
    en: 'Strict full body side profile. Hand in pocket, relaxed pose, clean silhouette of the entire outfit.',
  },

  // UPPER BODY (top/outer 적합) ─────────────────────
  {
    id: 'upper_closeup', label: '상반신 클로즈업', emoji: '👕', crop: 'upper', faceMatch: true,
    en: 'Strict half-body shot from the waist up. Focus on texture and fit of the upper garment. Confident gaze.',
  },
  {
    id: 'upper_mirror_selfie', label: '거울 셀카', emoji: '🪞', crop: 'upper', faceMatch: true,
    en: 'Mirror selfie composition. Smartphone clearly visible in front of face/chest. Reflection in a full-length or bathroom mirror. Slightly looking down at phone, hip cocked, casual SNS vibe.',
  },
  {
    id: 'upper_cafe', label: '카페 음료 컷', emoji: '☕', crop: 'upper', faceMatch: true,
    en: 'Half-body shot holding a coffee or beverage cup. Sitting or standing in a cafe setting. Candid relaxed lifestyle moment with soft daylight.',
  },
  {
    id: 'upper_selfie_stick', label: '셀카 앵글', emoji: '🤳', crop: 'upper', faceMatch: true,
    en: 'Self-portrait selfie angle (arms-length perspective). Upper body and head clearly visible. Slight smile, daily SNS vibe, slightly tilted camera.',
  },

  // LOWER BODY (bottom 적합) ────────────────────────
  {
    id: 'lower_closeup', label: '하반신 클로즈업', emoji: '👖', crop: 'lower', faceMatch: false,
    en: 'Strict frame from the waist down. Head and face fully cropped out. Focus on the styling, fit, and texture of the bottom wear.',
  },
  {
    id: 'lower_walking', label: '워킹 (다리)', emoji: '👟', crop: 'lower', faceMatch: false,
    en: 'Lower body in motion, walking stride captured mid-step. Focus on how the bottom wear flows with movement. Face fully cropped out.',
  },
  {
    id: 'lower_detail', label: '헴·신발 디테일', emoji: '🧦', crop: 'lower', faceMatch: false,
    en: 'Very close detail shot of the bottom wear hemline meeting the shoes. Capture fabric texture and footwear styling. Face fully cropped out.',
  },
  {
    id: 'lower_sitting', label: '앉은 자세', emoji: '🪑', crop: 'lower', faceMatch: false,
    en: 'Lower body in seated pose, legs crossed or relaxed. Focus on how the bottoms drape when seated. Face fully cropped out.',
  },

  // LIFESTYLE / CANDID (어떤 카테고리에도 어울림) ───
  {
    id: 'street_candid', label: '스트릿 캔디드', emoji: '📷', crop: 'full', faceMatch: true,
    en: 'Candid street snapshot, full body. Looking off-camera at something out of frame, natural unposed moment, film camera feel.',
  },
  {
    id: 'street_turn', label: '뒤돌아보기', emoji: '👀', crop: 'full', faceMatch: true,
    en: 'Mid-stride walking shot where model turns to look back at camera over shoulder. Dynamic energetic pose, hair in motion.',
  },

  // GROUP / COUPLE (다인 전용) ───────────────────────
  // 이 프리셋들은 modelImages.length >= 2일 때만 추천 표시
  {
    id: 'group_walking', label: '나란히 워킹', emoji: '🚶‍♂️‍🚶', crop: 'full', faceMatch: true, group: true,
    en: 'Full body shot of all people walking side by side together down a street, friendly natural energy, slightly staggered stride, candid moment.',
  },
  {
    id: 'group_selfie', label: '단체 셀카', emoji: '🤳', crop: 'upper', faceMatch: true, group: true,
    en: 'Selfie taken at arms length showing all people leaning in close together, upper body and faces visible, casual friendly SNS vibe.',
  },
  {
    id: 'couple_candid', label: '커플 캔디드', emoji: '👫', crop: 'full', faceMatch: true, group: true,
    en: 'Two people standing close together in a candid moment, one slightly behind or beside the other, soft mood, looking off-camera.',
  },
  {
    id: 'group_sitting', label: '나란히 앉기', emoji: '🪑', crop: 'upper', faceMatch: true, group: true,
    en: 'All people sitting side by side on a bench or step, relaxed casual lifestyle moment, looking at camera, half-body visible.',
  },
]

export const POSE_BY_ID = Object.fromEntries(POSE_PRESETS.map((p) => [p.id, p]))

// 카테고리별 기본 추천 5컷 (캐러셀 모드 자동 채우기)
export const CAROUSEL_RECOMMENDATIONS = {
  outer: ['full_dynamic', 'upper_closeup', 'upper_mirror_selfie', 'upper_cafe', 'street_candid'],
  top:   ['full_dynamic', 'upper_closeup', 'upper_mirror_selfie', 'upper_cafe', 'street_candid'],
  bottom:['full_dynamic', 'lower_closeup', 'lower_walking',       'lower_detail','street_turn'],
}

// 카테고리별 기본 추천 2컷 (빠른 모드)
export const QUICK_RECOMMENDATIONS = {
  outer: ['full_dynamic', 'upper_closeup'],
  top:   ['full_dynamic', 'upper_closeup'],
  bottom:['full_dynamic', 'lower_closeup'],
}

// 카테고리에서 사용 가능한 포즈 id 목록 (단일 인물 기준)
export const POSES_FOR_CATEGORY = {
  outer: POSE_PRESETS.filter((p) => p.crop !== 'lower' && !p.group).map((p) => p.id),
  top:   POSE_PRESETS.filter((p) => p.crop !== 'lower' && !p.group).map((p) => p.id),
  bottom:POSE_PRESETS.filter((p) => p.crop !== 'upper' && !p.group).map((p) => p.id),
}

// 다인 모드 전용 포즈 id 목록 (그룹 포즈 + 일반 풀바디 일부)
export const GROUP_POSE_IDS = POSE_PRESETS.filter((p) => p.group).map((p) => p.id)
export const POSES_FOR_GROUP = [
  ...GROUP_POSE_IDS,
  'full_dynamic',
  'full_walking',
  'street_candid',
  'street_turn',
]

// 다인 모드 추천 5컷
export const GROUP_CAROUSEL_RECOMMENDATIONS = [
  'group_walking', 'couple_candid', 'group_selfie', 'street_candid', 'group_sitting',
]
export const GROUP_QUICK_RECOMMENDATIONS = ['group_walking', 'group_selfie']
