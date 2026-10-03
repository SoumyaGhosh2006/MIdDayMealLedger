import React from 'react';

/**
 * HandwrittenLedger component
 * Renders an offscreen ruled-notebook ledger styled with Google Font 'Caveat'
 * and slight jitter/rotations to simulate authentic handwriting for PNG export.
 */
export default function HandwrittenLedger({ ledgers = [] }) {
  // Helper to render text with authentic handwriting jitter
  const renderJitter = (text, className = '') => {
    const rot = (Math.random() * 2 - 1).toFixed(2);
    const transY = (Math.random() * 2 - 1).toFixed(2);
    return (
      <span
        className={className}
        style={{
          display: 'inline-block',
          transform: `rotate(${rot}deg) translateY(${transY}px)`,
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div
      id="handwritten-ledger-capture"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '1420px',
        backgroundColor: '#ffffff',
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 32px)',
        color: '#0f172a',
        fontFamily: "'Caveat', cursive, sans-serif",
        padding: '36px 48px',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        #handwritten-ledger-capture * {
          font-family: 'Caveat', cursive, sans-serif !important;
        }
      `}</style>

      {/* Header section with school register look */}
      <div
        style={{
          borderBottom: '2px solid #0f172a',
          paddingBottom: '14px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '1px',
              color: '#0f172a',
            }}
          >
            {renderJitter('Midday Meal Daily Register & Expense Ledger')}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#334155' }}>
            {renderJitter('Official Daily Consumption & Headcount Account Register')}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '18px', color: '#334155' }}>
          <div>{renderJitter(`Export Date: ${new Date().toLocaleDateString('en-GB')}`)}</div>
          <div>{renderJitter(`Total Entries: ${ledgers.length}`)}</div>
        </div>
      </div>

      {/* Ruled Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '2px solid #0f172a',
          fontSize: '17px',
          lineHeight: '1.2',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: 'rgba(241, 245, 249, 0.85)',
              borderBottom: '2px solid #0f172a',
            }}
          >
            <th style={thStyle}>Date</th>
            <th style={{ ...thStyle, width: '130px' }}>Menu</th>
            <th style={thStyle}>Egg (₹)</th>
            <th style={thStyle}>Oil (₹)</th>
            <th style={thStyle}>Dal (₹)</th>
            <th style={thStyle}>Soya/Pot (₹)</th>
            <th style={thStyle}>Masala (₹)</th>
            <th style={thStyle}>Grocery (₹)</th>
            <th style={thStyle}>Veg (₹)</th>
            <th style={thStyle}>Fuel (₹)</th>
            <th style={{ ...thStyle, fontWeight: 700, color: '#002b5b' }}>Total Exp (₹)</th>
            <th style={{ ...thStyle, backgroundColor: 'rgba(254, 243, 199, 0.4)' }}>Open Rice</th>
            <th style={{ ...thStyle, backgroundColor: 'rgba(254, 243, 199, 0.4)' }}>Daily Consumption</th>
            <th style={{ ...thStyle, backgroundColor: 'rgba(254, 243, 199, 0.4)' }}>Close Rice</th>
            <th style={thStyle}>C-5</th>
            <th style={thStyle}>C-6</th>
            <th style={thStyle}>C-7</th>
            <th style={thStyle}>C-8</th>
            <th style={thStyle}>6-8 Tot</th>
            <th style={{ ...thStyle, fontWeight: 700 }}>Total Att</th>
          </tr>
        </thead>
        <tbody>
          {ledgers.length === 0 ? (
            <tr>
              <td colSpan={20} style={{ textAlign: 'center', padding: '24px', fontSize: '20px' }}>
                {renderJitter('No ledger records available for display.')}
              </td>
            </tr>
          ) : (
            ledgers.map((row, index) => (
              <tr
                key={row.id || index}
                style={{
                  borderBottom: '1px solid #cbd5e1',
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.4)',
                }}
              >
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {renderJitter(row.date)}
                </td>
                <td style={{ ...tdStyle, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {renderJitter(row.menu || '—')}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.egg || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.oil || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.dal || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.soya_potato || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.masala || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.grocery || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.veg || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {renderJitter(parseFloat(row.fuel || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#002b5b' }}>
                  {renderJitter(parseFloat(row.total_expense || 0).toFixed(2))}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', backgroundColor: 'rgba(254, 243, 199, 0.2)' }}>
                  {renderJitter(row.opening_balance_rice != null ? `${parseFloat(row.opening_balance_rice).toFixed(2)} kg` : '—')}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', backgroundColor: 'rgba(254, 243, 199, 0.2)' }}>
                  {renderJitter(row.daily_count != null ? row.daily_count : '—')}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', backgroundColor: 'rgba(254, 243, 199, 0.2)' }}>
                  {renderJitter(row.closing_balance_rice != null ? `${parseFloat(row.closing_balance_rice).toFixed(2)} kg` : '—')}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {renderJitter(row.class_5 ?? 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {renderJitter(row.class_6 ?? 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {renderJitter(row.class_7 ?? 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {renderJitter(row.class_8 ?? 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {renderJitter(row.total_attendance_6_8 ?? 0)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                  {renderJitter(row.total_attendance ?? 0)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Signature & Seal Footer */}
      <div
        style={{
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '20px',
          fontSize: '18px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px dashed #475569', width: '200px', paddingTop: '6px' }}>
            {renderJitter('Cook / In-charge Signature')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px dashed #475569', width: '200px', paddingTop: '6px' }}>
            {renderJitter('Headmaster / Principal Seal')}
          </div>
        </div>
      </div>
    </div>
  );
}

export { HandwrittenLedger };

const thStyle = {
  padding: '8px 6px',
  textAlign: 'left',
  borderRight: '1px solid #cbd5e1',
  fontSize: '16px',
  fontWeight: 600,
  color: '#0f172a',
};

const tdStyle = {
  padding: '6px 6px',
  borderRight: '1px solid #cbd5e1',
  fontSize: '17px',
  color: '#0f172a',
};

