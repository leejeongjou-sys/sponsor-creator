export const PRESETS = [
  { id: 'seongsu', name: '성수동 카페거리', desc: '붉은 벽돌', en: 'Seongsu-dong cafe street, red brick walls, trendy industrial aesthetic' },
  { id: 'hangang', name: '한강공원', desc: '탁 트인 강변', en: 'Hangang river park, sparkling water surface, green grass' },
  { id: 'jeju', name: '제주도 해변', desc: '에메랄드빛 바다', en: 'Jeju island beach, black basalt rocks, clear emerald sea' },
  { id: 'grunge_alley', name: '공사장 그런지 골목', desc: '거친 공사장 무드', en: 'Grunge style street alley under construction, raw textures, scaffolding, industrial hip aesthetic' },
  { id: 'japan_alley', name: '일본풍 골목', desc: '단정하고 조용한 거리', en: 'Clean Japanese style street alley, neat aesthetic, quiet neighborhood' },
  { id: 'hannam', name: '한남동 쇼룸', desc: '힙한 디자이너 건물', en: 'Hannam-dong trendy showroom street, modern architectural design, hip fashion district, clean concrete background' },
  { id: 'europe_terrace', name: '유럽풍 노천카페', desc: '파리 감성 테라스', en: 'European style terrace cafe, Parisian vibe, sunny afternoon, aesthetic outdoor seating, relaxed mood' },
  { id: 'minimal_studio', name: '미니멀 스튜디오', desc: '깔끔한 배경, 오브제', en: 'Minimalist modern photography studio, clean white and soft grey aesthetic, natural light shadows, simple geometric objects' },
]

export const TIME_OPTIONS = [
  { id: 'none', label: '원본 따름', en: 'Match the exact time of day shown in the reference image' },
  { id: 'morning', label: '오전 9시', en: 'morning sunlight at 9 AM, fresh and crisp daylight, soft morning shadows' },
  { id: 'day', label: '주간', en: 'bright daylight, clear and crisp' },
  { id: 'golden_hour', label: '골든아워', en: 'golden hour, warm sunset light, long cinematic shadows' },
  { id: 'night', label: '야간', en: 'night time, ambient street lights, dark moody atmosphere' },
]

export const LIGHTING_OPTIONS = [
  { id: 'none', label: '원본 따름', en: 'Match the exact lighting style shown in the reference image' },
  { id: 'natural', label: '자연광', en: 'soft natural lighting, photorealistic' },
  { id: 'mixed', label: '실내+자연광', en: 'mixed lighting, indoor ambient light combined with natural window light, balanced and soft' },
  { id: 'flash', label: '플래시 조명', en: 'direct flash photography, high contrast, trendy flash look' },
  { id: 'studio', label: '스튜디오 조명', en: 'professional studio lighting, clean and crisp, softbox' },
]

export const ITEM_CATEGORIES = [
  { id: 'outer', label: '아우터' },
  { id: 'top', label: '상의' },
  { id: 'bottom', label: '하의' },
]

export const PROMPT_SNIPPETS = [
  '거울 셀카', '무심한 표정', 'OOTD', '스트릿 스냅', '필름 카메라', '카페', '시크한 무드', '오버사이즈', '벌룬핏',
]

export const BG_TYPES = [
  { id: 'none', label: '참고이미지 따름' },
  { id: 'preset', label: '명소 프리셋' },
  { id: 'custom', label: '직접 업로드' },
]

export const GENERATION_MODES = [
  { id: 'quick', label: '빠른 2컷', desc: '전신 + 클로즈업' },
  { id: 'carousel', label: '캐러셀 5컷', desc: '포즈만 다른 5장' },
]

export * from './poses'
export * from './seedInfluencers'
