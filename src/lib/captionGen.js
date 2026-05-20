import { fetchWithRetry } from './utils'
import { ITEM_CATEGORIES, LIGHTING_OPTIONS, PRESETS, TIME_OPTIONS } from '../constants'

const TEXT_MODEL = 'gemini-2.5-flash'

const CAPTION_SCHEMA = {
  type: 'object',
  properties: {
    captions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tone: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['tone', 'text'],
      },
    },
    hashtags: { type: 'array', items: { type: 'string' } },
  },
  required: ['captions', 'hashtags'],
}

const buildCaptionPrompt = ({ itemCategory, bgType, selectedPreset, timeOfDay, lighting, userDirection }) => {
  const categoryLabel = ITEM_CATEGORIES.find((c) => c.id === itemCategory)?.label || '의류'
  const location =
    bgType === 'preset' ? PRESETS.find((p) => p.id === selectedPreset)?.name :
    bgType === 'custom' ? '직접 업로드한 배경' :
    '참고 무드 배경'
  const timeLabel = TIME_OPTIONS.find((t) => t.id === timeOfDay)?.label || ''
  const lightingLabel = LIGHTING_OPTIONS.find((l) => l.id === lighting)?.label || ''

  return `당신은 한국 인플루언서의 SNS 협찬 게시물 캡션을 쓰는 카피라이터입니다.

[게시물 정보]
- 의류 카테고리: ${categoryLabel}
- 장소: ${location}
- 시간대: ${timeLabel}
- 조명: ${lightingLabel}
- 추가 디렉팅: ${userDirection || '없음'}

[작성 지침]
1. 자연스러운 한국 인스타그램 협찬 캡션 3가지 톤(캐주얼/감성/시크)으로 작성
2. 각 캡션은 2~3줄, 적절한 이모지 1~2개 포함
3. 너무 광고 같지 않게, 진짜 인플루언서가 쓰는 말투로
4. 해시태그는 10~15개. 반드시 #광고 와 #협찬 포함 (공정거래위원회 의무 표기)
5. 트렌디한 해시태그 (#OOTD #데일리룩 #일상스타그램 #fashion 등) 자연스럽게 섞기
6. 캡션 본문에는 해시태그를 넣지 말 것 (해시태그는 별도 배열로)

JSON 형식으로만 응답하세요.`
}

export const generateCaption = async ({
  apiKey, itemCategory, bgType, selectedPreset, timeOfDay, lighting, userDirection,
}) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: buildCaptionPrompt({ itemCategory, bgType, selectedPreset, timeOfDay, lighting, userDirection }) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: CAPTION_SCHEMA,
      temperature: 0.85,
    },
  }
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw = await res.text()
  let data
  try { data = JSON.parse(raw) } catch { data = { error: { message: raw } } }
  if (!res.ok || data?.error) throw new Error(`캡션 API Error: ${data?.error?.message || raw}`)

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => p?.text)
  if (!textPart?.text) throw new Error('캡션이 생성되지 않았습니다.')

  let parsed
  try { parsed = JSON.parse(textPart.text) } catch (e) { throw new Error('캡션 JSON 파싱 실패: ' + textPart.text.slice(0, 200)) }

  // Enforce mandatory disclosure hashtags
  const tags = new Set((parsed.hashtags || []).map((t) => t.trim()).filter(Boolean))
  tags.add('#광고')
  tags.add('#협찬')

  return {
    captions: parsed.captions || [],
    hashtags: Array.from(tags),
  }
}
