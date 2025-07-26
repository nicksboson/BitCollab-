function Footer() {
  return (
    <footer
      style={{
        marginTop: '2rem',
        textAlign: 'center',
        background: 'rgba(30, 30, 40, 0.85)',
        borderTop: '1.5px solid rgba(255,255,255,0.08)',
        padding: '2rem 0 1.2rem 0',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 -2px 16px 0 rgba(58,41,255,0.07)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontWeight: 600,
          fontSize: '1.1rem',
          background: 'linear-gradient(90deg, #3A29FF 40%, #FF94B4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.04em',
        }}
      >
        © 2024 BitCollab. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer 