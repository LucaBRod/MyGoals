import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ValuesScreen = 2 | 3 | 4 | 5
type PatternsScreen = 1 | 2 | 3 | 4
type AppView = 'home' | 'values' | 'patterns'
type Ternary = 'yes' | 'kind-of' | 'not-really' | ''

// ─── Constants ────────────────────────────────────────────────────────────────

const VALUES_LABELS = ['Value', 'Moves', 'Plan', 'Review']
const PATTERNS_LABELS = ['Patterns', 'Pick One', 'Plan', 'Review']

const VALUE_OPTIONS: { label: string; sub: string }[] = [
  { label: 'Connection', sub: 'Friendships, family, belonging' },
  { label: 'Being Yourself', sub: 'Authenticity, confidence, self-expression' },
  { label: 'Growth', sub: 'Learning, improving, trying new things' },
  { label: 'Achievement', sub: 'Working hard, accomplishing things, doing your best' },
  { label: 'Health & Well-Being', sub: 'Taking care of your mind and body' },
  { label: 'Creativity', sub: 'Expressing yourself and making things' },
  { label: 'Independence', sub: 'Making your own choices and doing things for yourself' },
  { label: 'Kindness', sub: 'Caring for yourself and others' },
  { label: 'Fun', sub: '' },
  { label: 'Something Else', sub: '' },
]

const VALUE_PLACEHOLDERS: Record<string, string> = {
  Connection: 'For example: friendships, family, feeling like I belong...',
  'Being Yourself': 'For example: self-expression, confidence, staying true to myself...',
  Growth: 'For example: learning, improving, trying new things...',
  Achievement: 'For example: school, sports, personal goals...',
  'Health & Well-Being': 'For example: mental health, sleep, taking care of your body...',
  Creativity: 'For example: art, music, writing, making things...',
  Independence: 'For example: making my own choices, responsibility, doing things for myself...',
  Kindness: 'For example: caring for myself, helping friends, supporting others...',
  Fun: 'For example: hobbies, spending time with friends, relaxing, trying something new...',
  'Something Else': 'What matters to you here?',
}

const TOWARD_EXAMPLES: Record<string, string[]> = {
  'Health & Well-Being': [
    'Do movement I enjoy',
    'Eat something that gives me energy',
    'Rest when my body needs it',
    'Spend less time with content that makes me criticize myself',
  ],
}

const AWAY_EXAMPLES: Record<string, string[]> = {
  'Health & Well-Being': [
    'Skip meals',
    'Exercise to punish myself',
    'Keep checking the account',
    'Criticize my appearance',
  ],
}

const WHEN_OPTIONS = ['Today', 'Tomorrow', 'This week', 'Choose a day and time']

const HELP_OPTIONS = [
  'Set a reminder',
  'Ask someone to join me',
  'Prepare what I need',
  'Start with a smaller step',
  'Write my own',
]

const PATTERN_OPTIONS = [
  'Scroll less when I catch myself comparing',
  'See less content that makes me compare my appearance',
  'Spend less time on TikTok',
  'Be more selective about who I follow',
  'Something else',
]

const STEP_OPTIONS = [
  'Take a 10-minute break',
  'Close the app when I catch myself comparing',
  'Switch to something else I enjoy',
  'Choose my own',
]

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function TextBox({
  value,
  onChange,
  placeholder = 'Write here…',
  rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-sage resize-none leading-relaxed"
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-700 tracking-widest uppercase text-muted mb-2">{children}</p>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-3xl p-5 border border-border ${className}`}>
      {children}
    </div>
  )
}

// ─── Progress Bar (generic) ───────────────────────────────────────────────────

function ProgressBar({ pos, labels }: { pos: number; labels: string[] }) {
  return (
    <div className="px-5 pt-3 pb-2">
      <div className="flex gap-1.5 mb-1.5">
        {labels.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i + 1 <= pos ? 'bg-sage' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="flex">
        {labels.map((label, i) => (
          <div key={i} className="flex-1 flex justify-center">
            <span
              className={`text-[10px] font-700 tracking-wide transition-colors duration-200 ${
                i + 1 === pos
                  ? 'text-sage'
                  : i + 1 < pos
                  ? 'text-sage-mid'
                  : 'text-muted opacity-50'
              }`}
            >
              {label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Top Bar ─────────────────────────────────────────────────────────

function ActivityTopBar({ title, onExit }: { title: string; onExit: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-1">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center">
          <span className="text-sage text-xs">✦</span>
        </div>
        <span className="font-700 text-base text-ink" style={{ fontFamily: "'DM Serif Display', serif" }}>
          {title}
        </span>
      </div>
      <button
        onClick={onExit}
        className="text-xs font-600 text-muted hover:text-ink transition-colors px-2 py-1"
      >
        Exit
      </button>
    </div>
  )
}

// ─── Bottom Nav (generic) ─────────────────────────────────────────────────────

function BottomNav({
  showBack,
  onBack,
  onSkip,
  onContinue,
  canContinue = true,
  continueLabel = 'Continue',
}: {
  showBack: boolean
  onBack: () => void
  onSkip?: () => void
  onContinue: () => void
  canContinue?: boolean
  continueLabel?: string
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-t border-border bg-parchment">
      {showBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-600 text-muted hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      ) : (
        <div className="w-14" />
      )}
      <div className="flex-1" />
      {onSkip && (
        <button onClick={onSkip} className="text-sm font-600 text-muted hover:text-ink transition-colors px-1">
          Skip
        </button>
      )}
      <button
        onClick={onContinue}
        disabled={!canContinue}
        className={`px-5 py-2.5 rounded-xl text-sm font-700 transition-all duration-150 ${
          canContinue
            ? 'bg-sage text-white shadow-sm hover:bg-sage/90 active:scale-95'
            : 'bg-border text-muted cursor-not-allowed'
        }`}
      >
        {continueLabel}
      </button>
    </div>
  )
}

// ─── Moves Diagram ────────────────────────────────────────────────────────────

function MoveSlot({
  index,
  value,
  onChange,
  example,
  color,
  readOnly = false,
}: {
  index: number
  value: string
  onChange?: (v: string) => void
  example?: string
  color: 'sage' | 'terra'
  readOnly?: boolean
}) {
  if (readOnly) {
    return (
      <div
        className={`rounded-xl px-3 py-2 text-xs font-600 text-center leading-snug min-h-[38px] flex items-center justify-center border ${
          value
            ? color === 'sage'
              ? 'bg-sage-light border-sage-mid text-sage'
              : 'bg-terra-light border-terra-mid text-terra'
            : 'bg-parchment border-border text-muted opacity-50'
        }`}
      >
        {value || <span className="opacity-40">—</span>}
      </div>
    )
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={!value && example ? example : 'Add a move…'}
      className={`w-full rounded-xl border px-3 py-2 text-xs font-600 text-center leading-snug min-h-[38px] focus:outline-none transition-colors ${
        value
          ? color === 'sage'
            ? 'bg-sage-light border-sage-mid text-sage placeholder:text-sage/40'
            : 'bg-terra-light border-terra-mid text-terra placeholder:text-terra/40'
          : 'bg-card border-border text-ink placeholder:text-muted/50 focus:border-sage'
      }`}
    />
  )
}

function MovesDiagram({
  value,
  displayLabel,
  towardMoves,
  awayMoves,
  onTowardChange,
  onAwayChange,
  activePanel,
  readOnly = false,
  towardCount,
  awayCount,
  onAddToward,
  onAddAway,
}: {
  value: string
  displayLabel?: string
  towardMoves: string[]
  awayMoves: string[]
  onTowardChange?: (i: number, v: string) => void
  onAwayChange?: (i: number, v: string) => void
  activePanel?: 'toward' | 'away' | 'both'
  readOnly?: boolean
  towardCount?: number
  awayCount?: number
  onAddToward?: () => void
  onAddAway?: () => void
}) {
  const circleLabel = displayLabel || (value === 'Something Else' ? 'My value' : value)
  const towardExamples = TOWARD_EXAMPLES[value] ?? []
  const awayExamples = AWAY_EXAMPLES[value] ?? []

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sage" />
          <span className="text-[10px] font-700 tracking-widest uppercase text-sage">Toward</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-700 tracking-widest uppercase text-terra">Away</span>
          <div className="w-2 h-2 rounded-full bg-terra" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`flex-1 flex flex-col gap-1.5 transition-opacity duration-200 ${
            activePanel === 'away' ? 'opacity-40' : 'opacity-100'
          }`}
        >
          {towardMoves.map((m, i) => (
            <MoveSlot
              key={i}
              index={i}
              value={m}
              onChange={onTowardChange ? (v) => onTowardChange(i, v) : undefined}
              example={towardExamples[i]}
              color="sage"
              readOnly={readOnly}
            />
          ))}
        </div>

        <div className="flex-shrink-0">
          <div
            className="w-[76px] h-[76px] rounded-full flex items-center justify-center p-2 shadow-md"
            style={{ background: 'linear-gradient(135deg, #5a9186 0%, #4a7b6f 100%)' }}
          >
            <span
              className="text-white text-[10px] font-700 text-center leading-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {circleLabel}
            </span>
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col gap-1.5 transition-opacity duration-200 ${
            activePanel === 'toward' ? 'opacity-40' : 'opacity-100'
          }`}
        >
          {awayMoves.map((m, i) => (
            <MoveSlot
              key={i}
              index={i}
              value={m}
              onChange={onAwayChange ? (v) => onAwayChange(i, v) : undefined}
              example={awayExamples[i]}
              color="terra"
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {!readOnly && (onAddToward || onAddAway) && (
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            {onAddToward && (towardCount ?? towardMoves.length) < 4 && (
              <button
                onClick={onAddToward}
                className="text-[11px] font-600 text-sage hover:text-sage/60 transition-colors"
              >
                + Add another
              </button>
            )}
          </div>
          <div className="w-[76px]" />
          <div className="flex-1 flex justify-end">
            {onAddAway && (awayCount ?? awayMoves.length) < 4 && (
              <button
                onClick={onAddAway}
                className="text-[11px] font-600 text-terra hover:text-terra/60 transition-colors"
              >
                + Add another
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY VALUES ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════

function ValuesScreen1({
  selectedValue,
  setSelectedValue,
  valueNote,
  setValueNote,
}: {
  selectedValue: string
  setSelectedValue: (v: string) => void
  valueNote: string
  setValueNote: (v: string) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <Card>
        <p className="text-sm leading-relaxed text-ink">
          A value is something you care about and want to guide your choices, such as health, family, friendship, learning, or being kind to yourself.
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-base font-700 text-ink">What value do you care about?</p>
        <div className="grid grid-cols-2 gap-2">
          {VALUE_OPTIONS.map(({ label }) => (
            <button
              key={label}
              onClick={() => { setSelectedValue(label); setValueNote('') }}
              className={`rounded-2xl border px-4 py-3 text-sm font-600 text-left transition-all duration-150 ${
                selectedValue === label
                  ? 'bg-violet-light border-violet-mid text-violet'
                  : 'bg-card border-border text-ink hover:border-violet-mid'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {selectedValue && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-base font-700 text-ink">What does {selectedValue} mean to you here?</p>
          <TextBox
            value={valueNote}
            onChange={setValueNote}
            placeholder={VALUE_PLACEHOLDERS[selectedValue] ?? 'Tell us more…'}
            rows={4}
          />
        </div>
      )}
    </div>
  )
}

function ValuesScreen2({
  value,
  valueNote,
  towardMoves,
  setTowardMoves,
  awayMoves,
  setAwayMoves,
}: {
  value: string
  valueNote: string
  towardMoves: string[]
  setTowardMoves: (m: string[]) => void
  awayMoves: string[]
  setAwayMoves: (m: string[]) => void
}) {
  const [panel, setPanel] = useState<'toward' | 'away'>('toward')
  const [towardCount, setTowardCount] = useState(1)
  const [awayCount, setAwayCount] = useState(1)
  const displayLabel = valueNote.trim() || value

  const handleToward = (i: number, v: string) => {
    const next = [...towardMoves]; next[i] = v; setTowardMoves(next)
  }
  const handleAway = (i: number, v: string) => {
    const next = [...awayMoves]; next[i] = v; setAwayMoves(next)
  }
  const hasAnyToward = towardMoves.slice(0, towardCount).some((m) => m.trim())

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-ink">
        Write down behaviors that move you toward or away from{' '}
        <span className="font-700">{displayLabel}</span>.
      </p>

      <MovesDiagram
        value={value}
        displayLabel={displayLabel}
        towardMoves={towardMoves.slice(0, towardCount)}
        awayMoves={awayMoves.slice(0, awayCount)}
        onTowardChange={handleToward}
        onAwayChange={handleAway}
        activePanel={panel}
        towardCount={towardCount}
        awayCount={awayCount}
        onAddToward={() => setTowardCount((c) => Math.min(c + 1, 4))}
        onAddAway={() => setAwayCount((c) => Math.min(c + 1, 4))}
      />

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setPanel('toward')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 ${
            panel === 'toward' ? 'bg-sage-light border-sage-mid' : 'bg-card border-border opacity-60'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-700 flex-shrink-0 ${panel === 'toward' ? 'bg-sage text-white' : 'bg-border text-muted'}`}>1</div>
          <div>
            <p className={`text-sm font-700 ${panel === 'toward' ? 'text-sage' : 'text-muted'}`}>Toward moves</p>
            <p className="text-xs text-muted mt-0.5">What behaviors move you toward <span className="font-600">{displayLabel}</span>?</p>
          </div>
        </button>

        <button
          onClick={() => { if (hasAnyToward) setPanel('away') }}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 ${
            panel === 'away' ? 'bg-terra-light border-terra-mid' : hasAnyToward ? 'bg-card border-border opacity-80' : 'bg-card border-border opacity-40 cursor-default'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-700 flex-shrink-0 ${panel === 'away' ? 'bg-terra text-white' : 'bg-border text-muted'}`}>2</div>
          <div>
            <p className={`text-sm font-700 ${panel === 'away' ? 'text-terra' : 'text-muted'}`}>Away moves</p>
            <p className="text-xs text-muted mt-0.5">What behaviors move you away from <span className="font-600">{displayLabel}</span>?</p>
          </div>
        </button>
      </div>
    </div>
  )
}

function ValuesScreen3({
  value,
  displayLabel,
  towardMoves,
  awayMoves,
  selectedMove,
  setSelectedMove,
  smallStep,
  setSmallStep,
  when,
  setWhen,
  helpChoices,
  setHelpChoices,
  customHelp,
  setCustomHelp,
}: {
  value: string
  displayLabel: string
  towardMoves: string[]
  awayMoves: string[]
  selectedMove: string
  setSelectedMove: (v: string) => void
  smallStep: string
  setSmallStep: (v: string) => void
  when: string
  setWhen: (v: string) => void
  helpChoices: string[]
  setHelpChoices: (v: string[]) => void
  customHelp: string
  setCustomHelp: (v: string) => void
}) {
  const filledMoves = towardMoves.filter((m) => m.trim())
  const showCustomHelp = helpChoices.includes('Write my own')
  const toggleHelp = (opt: string) =>
    setHelpChoices(helpChoices.includes(opt) ? helpChoices.filter((h) => h !== opt) : [...helpChoices, opt])

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <MovesDiagram
        value={value}
        displayLabel={displayLabel}
        towardMoves={towardMoves}
        awayMoves={awayMoves}
        readOnly
        activePanel="both"
      />

      <div className="flex flex-col gap-3">
        <p className="text-base font-700 text-ink">Which toward move would you like to work on?</p>
        <div className="flex flex-col gap-2">
          {filledMoves.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMove(selectedMove === m ? '' : m)}
              className={`rounded-2xl border px-4 py-3 text-sm font-600 text-left transition-all duration-150 ${
                selectedMove === m ? 'bg-sage-light border-sage-mid text-sage' : 'bg-card border-border text-ink hover:border-sage-mid'
              }`}
            >
              {m}
            </button>
          ))}
          {filledMoves.length === 0 && <p className="text-sm text-muted italic">Go back to Moves to add some behaviors.</p>}
        </div>
      </div>

      {selectedMove && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            <p className="text-base font-700 text-ink">What is one small step you could take?</p>
            <TextBox value={smallStep} onChange={setSmallStep} placeholder="Describe a small step…" rows={3} />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-700 text-ink">When could you do this?</p>
            <div className="grid grid-cols-2 gap-2">
              {WHEN_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setWhen(when === opt ? '' : opt)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-600 text-left transition-all duration-150 ${
                    when === opt ? 'bg-violet-light border-violet-mid text-violet' : 'bg-card border-border text-ink hover:border-violet-mid'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-700 text-ink">What could help you follow through?</p>
            <div className="flex flex-col gap-2">
              {HELP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleHelp(opt)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-600 text-left transition-all duration-150 ${
                    helpChoices.includes(opt) ? 'bg-violet-light border-violet-mid text-violet' : 'bg-card border-border text-ink hover:border-violet-mid'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showCustomHelp && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <TextBox value={customHelp} onChange={setCustomHelp} placeholder="What would help you…" rows={2} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ValuesScreen4({
  value,
  displayLabel,
  towardMoves,
  awayMoves,
  selectedMove,
  smallStep,
  when,
  helpChoices,
  planFeeling,
  setPlanFeeling,
  onSave,
  onEdit,
  onFinish,
}: {
  value: string
  displayLabel: string
  towardMoves: string[]
  awayMoves: string[]
  selectedMove: string
  smallStep: string
  when: string
  helpChoices: string[]
  planFeeling: string
  setPlanFeeling: (v: string) => void
  onSave: () => void
  onEdit: () => void
  onFinish: () => void
}) {
  const displayValue = displayLabel || (value === 'Something Else' ? 'My value' : value)
  const feelingOpts = [
    { v: 'yes', label: 'Yes' },
    { v: 'a-little', label: 'A little' },
    { v: 'not-really', label: 'Not really' },
    { v: 'not-sure', label: "I'm not sure" },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>What matters to me</SectionLabel>
            <p className="text-base font-700 text-ink" style={{ fontFamily: "'DM Serif Display', serif" }}>{displayValue}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <SectionLabel>My toward move</SectionLabel>
            <p className="text-sm font-600 text-sage">{selectedMove || '—'}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <SectionLabel>My plan</SectionLabel>
            <p className="text-sm font-600 text-ink">{smallStep || '—'}</p>
            {when && <p className="text-xs text-muted mt-1 font-600">{when}</p>}
            {helpChoices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {helpChoices.map((h) => (
                  <span key={h} className="text-[11px] font-600 bg-violet-light text-violet rounded-full px-3 py-1">{h}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <MovesDiagram
        value={value}
        displayLabel={displayValue}
        towardMoves={towardMoves}
        awayMoves={awayMoves}
        readOnly
        activePanel="both"
      />

      <div className="flex flex-col gap-3">
        <p className="text-base font-700 text-ink">Does this plan move you toward what matters to you?</p>
        <div className="grid grid-cols-2 gap-2">
          {feelingOpts.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setPlanFeeling(planFeeling === v ? '' : v)}
              className={`rounded-2xl border px-4 py-3 text-sm font-600 transition-all duration-150 ${
                planFeeling === v ? 'bg-sage-light border-sage-mid text-sage' : 'bg-card border-border text-ink hover:border-sage-mid'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pb-2">
        <button onClick={onSave} className="w-full py-3.5 rounded-2xl bg-sage text-white text-sm font-700 hover:bg-sage/90 transition-colors active:scale-95">
          Save privately
        </button>
        <button onClick={onEdit} className="w-full py-3.5 rounded-2xl border border-border bg-card text-sm font-700 text-ink hover:border-sage-mid transition-colors">
          Edit
        </button>
        <button onClick={onFinish} className="w-full py-3.5 rounded-2xl text-sm font-600 text-muted hover:text-ink transition-colors">
          Finish
        </button>
      </div>
    </div>
  )
}

function MyValuesActivity({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<ValuesScreen>(2)
  const [selectedValue, setSelectedValue] = useState('')
  const [valueNote, setValueNote] = useState('')
  const [towardMoves, setTowardMoves] = useState(['', '', '', ''])
  const [awayMoves, setAwayMoves] = useState(['', '', '', ''])
  const [selectedMove, setSelectedMove] = useState('')
  const [smallStep, setSmallStep] = useState('')
  const [when, setWhen] = useState('')
  const [helpChoices, setHelpChoices] = useState<string[]>([])
  const [customHelp, setCustomHelp] = useState('')
  const [planFeeling, setPlanFeeling] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [screen])

  const canContinue: Record<ValuesScreen, boolean> = {
    2: !!selectedValue,
    3: towardMoves.some((m) => m.trim()),
    4: true,
    5: true,
  }

  const advance = () => { if (screen < 5) setScreen((s) => (s + 1) as ValuesScreen) }
  const back = () => { if (screen > 2) setScreen((s) => (s - 1) as ValuesScreen) }
  const displayLabel = valueNote.trim() || selectedValue

  return (
    <div className="min-h-screen bg-parchment flex flex-col" style={{ maxWidth: '430px', margin: '0 auto' }}>
      <div ref={scrollRef} className="flex flex-col flex-1 min-h-screen">
        <ActivityTopBar title="My Values" onExit={onExit} />
        <ProgressBar pos={screen - 1} labels={VALUES_LABELS} />

        {screen === 2 && (
          <ValuesScreen1 selectedValue={selectedValue} setSelectedValue={setSelectedValue} valueNote={valueNote} setValueNote={setValueNote} />
        )}
        {screen === 3 && (
          <ValuesScreen2 value={selectedValue} valueNote={valueNote} towardMoves={towardMoves} setTowardMoves={setTowardMoves} awayMoves={awayMoves} setAwayMoves={setAwayMoves} />
        )}
        {screen === 4 && (
          <ValuesScreen3
            value={selectedValue}
            displayLabel={displayLabel}
            towardMoves={towardMoves.filter((m) => m.trim())}
            awayMoves={awayMoves.filter((m) => m.trim())}
            selectedMove={selectedMove}
            setSelectedMove={setSelectedMove}
            smallStep={smallStep}
            setSmallStep={setSmallStep}
            when={when}
            setWhen={setWhen}
            helpChoices={helpChoices}
            setHelpChoices={setHelpChoices}
            customHelp={customHelp}
            setCustomHelp={setCustomHelp}
          />
        )}
        {screen === 5 && (
          <ValuesScreen4
            value={selectedValue}
            displayLabel={displayLabel}
            towardMoves={towardMoves.filter((m) => m.trim())}
            awayMoves={awayMoves.filter((m) => m.trim())}
            selectedMove={selectedMove}
            smallStep={smallStep}
            when={when}
            helpChoices={helpChoices}
            planFeeling={planFeeling}
            setPlanFeeling={setPlanFeeling}
            onSave={() => alert('Saved privately.')}
            onEdit={() => setScreen(4)}
            onFinish={onExit}
          />
        )}

        {screen < 5 && (
          <BottomNav
            showBack={screen > 2}
            onBack={back}
            onSkip={advance}
            onContinue={advance}
            canContinue={canContinue[screen]}
          />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY PATTERNS ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Chart primitives ─────────────────────────────────────────────────────────

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-600 text-ink shrink-0 w-28">{label}</span>
      <div className="flex-1 rounded-full h-2.5" style={{ backgroundColor: '#f0ede8' }}>
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-700 text-muted w-3 text-right">{value}</span>
    </div>
  )
}

function Insight({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-sage-light rounded-2xl px-4 py-3">
      <span className="text-base leading-none mt-0.5">{emoji}</span>
      <p className="text-xs font-600 text-sage leading-relaxed">{children}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl border border-border p-5 flex flex-col gap-3">
      <p className="text-sm font-700 text-ink">{title}</p>
      {children}
    </div>
  )
}

// ─── Feeling Scale ────────────────────────────────────────────────────────────

function FeelingScale() {
  const pct = (5.4 / 7) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[11px] font-600 text-muted">
        <span>Felt better ✨</span>
        <span>Felt worse 😔</span>
      </div>
      <div className="relative h-3 rounded-full" style={{ background: 'linear-gradient(to right, #4a7b6f, #e8c84a, #b86a58)' }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-ink shadow-sm"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <p className="text-xs text-muted font-600 text-center">Average: 5.4 out of 7</p>
    </div>
  )
}

// ─── Insights summary ─────────────────────────────────────────────────────────

const INSIGHTS_DATA = [
  { emoji: '👀', category: 'Topic',     value: 'Appearance',  pct: 42, color: '#6b5b95' },
  { emoji: '📱', category: 'Platform',  value: 'TikTok',      pct: 50, color: '#1a1a2e' },
  { emoji: '📜', category: 'Activity',  value: 'Scrolling',   pct: 67, color: '#4a7b6f' },
  { emoji: '🌟', category: 'Viewing',   value: 'Influencers', pct: 50, color: '#c4956a' },
]

function InsightsSummary() {
  return (
    <ChartCard title="Insights">
      <p className="text-xs text-muted -mt-1">Top pattern from each area — at a glance.</p>
      <div className="flex flex-col gap-3">
        {INSIGHTS_DATA.map(({ emoji, category, value, pct, color }) => (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-700 uppercase tracking-wide text-muted flex items-center gap-1">
                <span>{emoji}</span> {value.toUpperCase()}
              </span>
              <span className="text-xs font-700 text-ink">{category}</span>
            </div>
            <div className="h-2.5 rounded-full" style={{ backgroundColor: '#f0ede8' }}>
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

// ─── Correlations card ────────────────────────────────────────────────────────

const CORRELATIONS = [
  { from: 'Scrolling', to: 'comparisons go up', pct: '+67%', good: false },
  { from: 'Appearance compare', to: 'mood goes down', pct: '-31%', good: false },
  { from: 'Viewing creators', to: 'more comparison', pct: '+38%', good: false },
  { from: 'Taking breaks', to: 'fewer comparisons', pct: '-19%', good: true },
  { from: 'Less TikTok', to: 'mood improves', pct: '+14%', good: true },
]

function CorrelationsCard() {
  return (
    <div className="bg-card rounded-3xl border border-border p-5 flex flex-col gap-3">
      <div>
        <p className="text-sm font-700 text-ink">Correlations</p>
        <p className="text-xs text-muted mt-0.5">Patterns that tend to go together in your data.</p>
      </div>
      <div className="flex flex-col gap-2">
        {CORRELATIONS.map(({ from, to, pct, good }) => (
          <div key={from + to} className="flex items-center gap-3 py-0.5">
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-700 text-ink whitespace-nowrap">{from}</span>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="flex-shrink-0 opacity-40">
                <path d="M1 5h12M8 1l4 4-4 4" stroke="#1c1b1f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-600 text-muted truncate">{to}</span>
            </div>
            <span
              className={`text-xs font-800 px-2.5 py-1 rounded-xl flex-shrink-0 border ${
                good
                  ? 'bg-sage-light border-sage-mid text-sage'
                  : 'bg-terra-light border-terra-mid text-terra'
              }`}
            >
              {pct}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted leading-relaxed">
        Green = moving in a helpful direction. Red = something that may be worth looking at.
      </p>
    </div>
  )
}

// ─── Patterns Screen 1: Your Patterns ────────────────────────────────────────

function PatternsScreen1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-700 text-ink mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Your patterns
        </h2>
        <p className="text-sm text-muted leading-relaxed">Here's what you've been noticing lately.</p>
      </div>

      {/* Topics */}
      <ChartCard title="What comparisons were about">
        <div className="flex flex-col gap-2">
          <HBar label="Appearance" value={5} max={5} color="#6b5b95" />
          <HBar label="Social Life" value={3} max={5} color="#4a7b6f" />
          <HBar label="Accomplishments" value={2} max={5} color="#5b8db8" />
          <HBar label="Lifestyle" value={1} max={5} color="#c4956a" />
          <HBar label="Fitness/Body" value={1} max={5} color="#b86a58" />
        </div>
        <Insight emoji="👀">Appearance has been coming up the most for you lately. 68% of teens also compare appearance most online.</Insight>
      </ChartCard>

      {/* Platforms */}
      <ChartCard title="Where comparisons happened">
        <div className="flex flex-col gap-2">
          <HBar label="TikTok" value={6} max={6} color="#1a1a2e" />
          <HBar label="Instagram" value={4} max={6} color="#c27e6c" />
          <HBar label="Snapchat" value={2} max={6} color="#e8c84a" />
        </div>
        <Insight emoji="📱">Most of your comparisons have happened on TikTok. 74% of teens say social media is where they notice comparison most.</Insight>
      </ChartCard>

      {/* Activity */}
      <ChartCard title="What you were doing">
        <div className="flex flex-col gap-2">
          <HBar label="Scrolling" value={8} max={8} color="#4a7b6f" />
          <HBar label="Messaging" value={2} max={8} color="#6b5b95" />
          <HBar label="Posting" value={1} max={8} color="#b86a58" />
          <HBar label="Searching" value={1} max={8} color="#5b8db8" />
        </div>
        <Insight emoji="📜">Scrolling shows up in 8 of your 12 comparisons. 72% of teens say they notice comparison most while scrolling.</Insight>
      </ChartCard>

      {/* Who they viewed */}
      <ChartCard title="Who you were looking at">
        <div className="flex flex-col gap-2">
          <HBar label="Influencers" value={6} max={6} color="#c4956a" />
          <HBar label="Peers" value={4} max={6} color="#4a7b6f" />
          <HBar label="Friends/Family" value={2} max={6} color="#6b5b95" />
        </div>
        <Insight emoji="🌟">Comparisons happened most often while viewing creators. 61% of teens say viewing influencers triggers comparison most.</Insight>
      </ChartCard>

      {/* Insights summary */}
      <InsightsSummary />

      {/* Feeling scale */}
      <ChartCard title="How these comparisons left you feeling">
        <FeelingScale />
        <Insight emoji="💭">These comparisons have tended to leave you feeling worse rather than better. 64% of teens report the same.</Insight>
      </ChartCard>

      {/* Correlations */}
      <CorrelationsCard />

      <p className="text-xs text-muted text-center leading-relaxed px-2 pb-1">
        These are just patterns we've noticed. They don't have to tell the whole story.
      </p>

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-2xl bg-sage text-white text-sm font-700 hover:bg-sage/90 transition-colors active:scale-95 mb-2"
      >
        Choose something to work on
      </button>
    </div>
  )
}

// ─── Patterns Screen 2: Pick One ─────────────────────────────────────────────

function PatternsScreen2({
  answer,
  setAnswer,
}: {
  answer: string
  setAnswer: (v: string) => void
}) {
  const [showIdeas, setShowIdeas] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <div>
        <p className="text-base font-700 text-ink mb-1">What do you want to work on?</p>
        <p className="text-sm text-muted leading-relaxed">Write whatever feels right for you.</p>
      </div>

      <TextBox value={answer} onChange={setAnswer} placeholder="Write something you'd like to work on…" rows={4} />

      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowIdeas((s) => !s)}
          className="flex items-center gap-2 text-sm font-600 text-muted hover:text-ink transition-colors self-start"
        >
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={`transition-transform duration-200 ${showIdeas ? 'rotate-90' : ''}`}
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Need an idea?
        </button>

        {showIdeas && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {PATTERN_OPTIONS.filter((o) => o !== 'Something else').map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer(opt)}
                className={`rounded-2xl border px-4 py-3.5 text-sm font-600 text-left transition-all duration-150 ${
                  answer === opt
                    ? 'bg-violet-light border-violet-mid text-violet'
                    : 'bg-card border-border text-ink hover:border-violet-mid'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Patterns Screen 3: Plan ──────────────────────────────────────────────────

function PatternsScreen3({
  selected,
  stepAnswer,
  setStepAnswer,
}: {
  selected: string
  stepAnswer: string
  setStepAnswer: (v: string) => void
}) {
  const [showIdeas, setShowIdeas] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <Card>
        <SectionLabel>Working on</SectionLabel>
        <p className="text-sm font-600 text-violet leading-relaxed">{selected}</p>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-base font-700 text-ink">What's one small thing you could try?</p>
        <TextBox value={stepAnswer} onChange={setStepAnswer} placeholder="Write something small you could try…" rows={4} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowIdeas((s) => !s)}
          className="flex items-center gap-2 text-sm font-600 text-muted hover:text-ink transition-colors self-start"
        >
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={`transition-transform duration-200 ${showIdeas ? 'rotate-90' : ''}`}
          >
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Need an idea?
        </button>

        {showIdeas && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {STEP_OPTIONS.filter((o) => o !== 'Choose my own').map((opt) => (
              <button
                key={opt}
                onClick={() => setStepAnswer(opt)}
                className={`rounded-2xl border px-4 py-3.5 text-sm font-600 text-left transition-all duration-150 ${
                  stepAnswer === opt
                    ? 'bg-sage-light border-sage-mid text-sage'
                    : 'bg-card border-border text-ink hover:border-sage-mid'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Patterns Screen 4: Review ────────────────────────────────────────────────

function PatternsScreen4({
  selected,
  step,
  customStep,
  doable,
  setDoable,
  onSave,
  onFinish,
}: {
  selected: string
  step: string
  customStep: string
  doable: string
  setDoable: (v: string) => void
  onSave: () => void
  onFinish: () => void
}) {
  const displayStep = step || '—'
  const doableOpts = ['Very doable', 'Pretty doable', 'A little hard', "I'm not sure"]

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>What I noticed</SectionLabel>
            <p className="text-sm font-600 text-ink leading-relaxed">
              I compare myself most around appearance, especially while scrolling.
            </p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <SectionLabel>What I want to work on</SectionLabel>
            <p className="text-sm font-600 text-violet leading-relaxed">{selected || '—'}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <SectionLabel>What I'll try</SectionLabel>
            <p className="text-sm font-600 text-sage leading-relaxed">{displayStep}</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-base font-700 text-ink">How doable does this feel?</p>
        <div className="grid grid-cols-2 gap-2">
          {doableOpts.map((opt) => (
            <button
              key={opt}
              onClick={() => setDoable(doable === opt ? '' : opt)}
              className={`rounded-2xl border px-4 py-3 text-sm font-600 transition-all duration-150 ${
                doable === opt ? 'bg-sage-light border-sage-mid text-sage' : 'bg-card border-border text-ink hover:border-sage-mid'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pb-2">
        <button onClick={onSave} className="w-full py-3.5 rounded-2xl bg-sage text-white text-sm font-700 hover:bg-sage/90 transition-colors active:scale-95">
          Save privately
        </button>
        <button onClick={onFinish} className="w-full py-3.5 rounded-2xl text-sm font-600 text-muted hover:text-ink transition-colors">
          Finish
        </button>
      </div>
    </div>
  )
}

function MyPatternsActivity({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<PatternsScreen>(1)
  const [answer, setAnswer] = useState('')
  const [stepAnswer, setStepAnswer] = useState('')
  const [doable, setDoable] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [screen])

  const canContinue: Record<PatternsScreen, boolean> = {
    1: true,
    2: !!answer.trim(),
    3: !!stepAnswer.trim(),
    4: true,
  }

  const advance = () => { if (screen < 4) setScreen((s) => (s + 1) as PatternsScreen) }
  const back = () => { if (screen > 1) setScreen((s) => (s - 1) as PatternsScreen) }

  return (
    <div className="min-h-screen bg-parchment flex flex-col" style={{ maxWidth: '430px', margin: '0 auto' }}>
      <div ref={scrollRef} className="flex flex-col flex-1 min-h-screen">
        <ActivityTopBar title="My Patterns" onExit={onExit} />
        <ProgressBar pos={screen} labels={PATTERNS_LABELS} />

        {screen === 1 && <PatternsScreen1 onNext={advance} />}
        {screen === 2 && <PatternsScreen2 answer={answer} setAnswer={setAnswer} />}
        {screen === 3 && (
          <PatternsScreen3
            selected={answer}
            stepAnswer={stepAnswer}
            setStepAnswer={setStepAnswer}
          />
        )}
        {screen === 4 && (
          <PatternsScreen4
            selected={answer}
            step={stepAnswer}
            customStep=""
            doable={doable}
            setDoable={setDoable}
            onSave={() => alert('Saved privately.')}
            onFinish={onExit}
          />
        )}

        {screen > 1 && screen < 4 && (
          <BottomNav
            showBack={screen > 1}
            onBack={back}
            onSkip={advance}
            onContinue={advance}
            canContinue={canContinue[screen]}
          />
        )}
        {screen === 4 && (
          <BottomNav showBack onBack={back} onContinue={back} continueLabel="Edit" />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function LandingPage({
  onValues,
  onPatterns,
}: {
  onValues: () => void
  onPatterns: () => void
}) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col" style={{ maxWidth: '430px', margin: '0 auto' }}>
      <div className="px-5 pt-10 pb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center">
            <span className="text-sage">✦</span>
          </div>
          <span className="font-700 text-xl text-ink" style={{ fontFamily: "'DM Serif Display', serif" }}>
            My Goals
          </span>
        </div>
        <p className="text-sm text-muted leading-relaxed mt-3">
          Choose an activity to get started.
        </p>
      </div>

      <div className="px-5 flex flex-col gap-4">
        <button
          onClick={onValues}
          className="w-full rounded-3xl border border-border bg-card p-6 text-left hover:border-sage-mid transition-all duration-150 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-violet-light flex items-center justify-center text-lg">
              🌱
            </div>
            <p className="text-base font-700 text-ink" style={{ fontFamily: "'DM Serif Display', serif" }}>
              My Values
            </p>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Figure out what matters to you and choose a step toward it.
          </p>
          <div className="flex items-center gap-1 mt-4 text-violet">
            <span className="text-xs font-700">Start</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        <button
          onClick={onPatterns}
          className="w-full rounded-3xl border border-border bg-card p-6 text-left hover:border-sage-mid transition-all duration-150 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-terra-light flex items-center justify-center text-lg">
              📊
            </div>
            <p className="text-base font-700 text-ink" style={{ fontFamily: "'DM Serif Display', serif" }}>
              My Patterns
            </p>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            See what you've noticed about social media and choose something you want to work on.
          </p>
          <div className="flex items-center gap-1 mt-4 text-terra">
            <span className="text-xs font-700">Start</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [view, setView] = useState<AppView>('home')

  if (view === 'values') return <MyValuesActivity onExit={() => setView('home')} />
  if (view === 'patterns') return <MyPatternsActivity onExit={() => setView('home')} />
  return <LandingPage onValues={() => setView('values')} onPatterns={() => setView('patterns')} />
}
