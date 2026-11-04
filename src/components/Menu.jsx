import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { QUESTION_ORDER } from '../types'

export default function Menu({ players, setPlayers, questions, setQuestions, roundTime, setRoundTime, settings, setSettings, onStart }) {
  const [nameInput, setNameInput] = useState('');
  const [fileError, setFileError] = useState('');

  const canStart = players.length >= 2 && questions.length > 0;

  const addPlayer = () => {
    const name = nameInput.trim();
    if (!name || players.includes(name)) return;
    setPlayers(player => [...player, name]);
    setNameInput('');
  }

  const removePlayer = (player) => setPlayers(playerList => playerList.filter(x => x !== player));

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    return lines
      .slice(1)
      .map(line => {
        const cols = [];
        let currentString = '', inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuote = !inQuote;
          }
          else if (char === ',' && !inQuote) {
            cols.push(currentString.trim()); currentString = '';
          }
          else {
            currentString += char;
          }
        }
        cols.push(currentString.trim());
        return cols;
      })
      .filter(cols => cols[0] && cols[1])
      .map(cols => ({ question: cols[0].replace(/^"|"$/g, ''), answer: cols[1].replace(/^"|"$/g, '') }));
  }

  const handleFile = (e) => {
    setFileError('');
    const file = e.target.files[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let rows;

        if (isCSV) {
          rows = parseCSV(event.target.result);
        } else {
          const workBook = XLSX.read(event.target.result, { type: 'binary' });
          const workSheet = workBook.Sheets[workBook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
          rows = data
            .slice(1)
            .filter(row => row[0] && row[1])
            .map(row => ({ question: String(row[0]), answer: String(row[1]) }));
        }
        if (rows.length === 0) {
          setFileError('No valid rows found. Ensure columns are "question" and "answer".');
          return;
        }
        setQuestions(rows);
      } catch {
        setFileError('Could not read file.');
      }
    }
    if (isCSV) reader.readAsText(file);
    else reader.readAsBinaryString(file);
    e.target.value = '';
  }

  const setSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const ToggleGroup = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom: '.2rem' }}>
      <div style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '.4rem' }}>
        {options.map(option => (
          <button
            key={option.value}
            className={`btn btn-sm ${value === option.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onChange(option.value)}
            style={{ flex: 1 }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '4rem' }}>
      <div className="title-logo">The Weakest Link</div>
      <div className="subtitle">Are you the weakest link?</div>
      <div className="chain-bar" style={{ maxWidth: '500px', margin: '1.5rem 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '800px', width: '100%' }}>
        {/* Players */}
        <div className="card">
          <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Players
          </div>
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.8rem' }}>
            <input
              className="input-field"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
              placeholder="Player name..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-sm" onClick={addPlayer}>Add</button>
          </div>
          <div style={{ minHeight: '60px', display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {players.map(p => (
              <span key={p} className="player-chip">
                {p}
                <button
                  onClick={() => removePlayer(p)}
                  style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
            {players.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>No players yet</span>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="card">
          <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Questions
          </div>
          <label style={{ display: 'block', background: 'var(--blue-dim)', border: '1px dashed var(--blue)', borderRadius: '3px', padding: '1rem', textAlign: 'center', cursor: 'pointer', marginBottom: '.8rem' }}>
            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Upload Excel or CSV</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>.xlsx · .csv &nbsp;·&nbsp; Columns: question, answer</div>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          {fileError && <div style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: '.5rem' }}>{fileError}</div>}
          {questions.length > 0 && (
            <div style={{ color: 'var(--green-bright)', fontSize: '.85rem' }}>✓ {questions.length} questions loaded</div>
          )}
        </div>

        {/* Round Time */}
        <div className="card">
          <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Round Time
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range" min="30" max="300" step="10"
              value={roundTime}
              onChange={event => setRoundTime(Number(event.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>{roundTime}s</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '.75rem', marginTop: '.5rem' }}>
            3 questions per player per round
          </div>
        </div>

        {/* Settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Settings
          </div>
          <ToggleGroup
            label="Question Order"
            value={settings.questionOrder}
            options={[{ label: '🔀 Random', value: QUESTION_ORDER.RANDOM }, { label: '📋 Chronological', value: QUESTION_ORDER.CHRONOLOGICAL }]}
            onChange={value => setSetting('questionOrder', value)}
          />
          <ToggleGroup
            label="Display Answers"
            value={settings.autoDisplayAnswer ? 'auto' : 'manual'}
            options={[{ label: '👁 Always', value: 'auto' }, { label: '🖱 On Click', value: 'manual' }]}
            onChange={value => setSetting('autoDisplayAnswer', value === 'auto')}
          />
        </div>

        {/* Start — full width */}
        <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.2rem' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '320px', fontSize: '1.2rem', padding: '1rem' }}
            disabled={!canStart}
            onClick={onStart}
          >
            Start Game
          </button>
          {!canStart && (
            <div style={{ color: 'var(--text-muted)', fontSize: '.75rem', marginTop: '.7rem', textAlign: 'center' }}>
              {players.length < 2 ? 'Add at least 2 players. ' : ''}
              {questions.length === 0 ? 'Upload questions.' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
