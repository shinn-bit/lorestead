interface Props {
  onEnable: () => void;
  onSkip:   () => void;
}

export function ScreenCapturePrompt({ onEnable, onSkip }: Props) {
  return (
    <div
      style={{
        position:        'absolute',
        bottom:          180,
        left:            40,
        width:           288,
        background:      'rgba(20,18,14,0.92)',
        border:          '1px solid rgba(212,175,55,0.3)',
        borderRadius:    16,
        padding:         '20px 22px',
        zIndex:          40,
        backdropFilter:  'blur(12px)',
        boxShadow:       '0 8px 32px rgba(0,0,0,0.5)',
        animation:       'fadeSlideUp 0.3s ease',
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <p style={{
        fontFamily:    "'Cinzel', serif",
        fontSize:      12,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color:         '#d4af37',
        marginBottom:  8,
      }}>
        Record your screen?
      </p>

      <p style={{
        fontSize:     12,
        lineHeight:   1.7,
        color:        'rgba(245,230,200,0.6)',
        marginBottom: 16,
      }}>
        Capture your work screen once per minute to create a personalized timelapse.
        Saved only on this device — never uploaded.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onEnable}
          style={{
            padding:       '10px 0',
            borderRadius:  9999,
            border:        '1px solid rgba(212,175,55,0.55)',
            background:    'rgba(212,175,55,0.12)',
            color:         '#f5e6d3',
            fontFamily:    "'Cinzel', serif",
            fontSize:      11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            transition:    'all 0.2s',
          }}
        >
          Select screen &amp; record
        </button>
        <button
          onClick={onSkip}
          style={{
            padding:       '8px 0',
            background:    'transparent',
            border:        'none',
            color:         'rgba(245,230,200,0.3)',
            fontFamily:    "'Cinzel', serif",
            fontSize:      10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor:        'pointer',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
