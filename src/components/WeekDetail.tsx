import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { BibleVerse, DiscussionQuestion, GeneratedContent, JwLink } from '../types';
import { WEEK_TYPE_LABELS, USERS } from '../types';
import { getWeekRangeString } from '../utils/dateUtils';
import { BookIcon, TvIcon, DocIcon, SparklesIcon, EditIcon, RobotIcon } from './Icons';

interface WeekDetailModalProps {
  weekId: string;
  onClose: () => void;
}

const ContentSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }> = ({
  icon, title, children, delay = 1,
}) => (
  <div className={`card content-section animate-up delay-${delay}`} style={{ marginBottom: '16px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
    <div className="card-body" style={{ padding: '18px' }}>
      <div className="content-section-header" style={{ marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--c-border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--c-primary)' }}>{icon}</span>
        <span className="content-section-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  </div>
);

const AiLoading: React.FC = () => (
  <div className="ai-loading animate-fade">
    <div className="ai-loading-dots">
      <div className="ai-dot" />
      <div className="ai-dot" />
      <div className="ai-dot" />
    </div>
    <div>
      <p className="font-semibold" style={{ marginBottom: '6px' }}>Gerando roteiro com Gemini AI...</p>
      <p className="text-sm text-muted">Pesquisando artigos no jw.org e elaborando o conteúdo</p>
    </div>
  </div>
);

export const WeekDetailModal: React.FC<WeekDetailModalProps> = ({ weekId, onClose }) => {
  const { state, generateContent, upsertWeek, swapWeeks } = useApp();
  const week = state.weeks.find((w) => w.id === weekId);
  const [showSwapSelector, setShowSwapSelector] = useState(false);
  const [editingTheme, setEditingTheme] = useState(false);
  const [themeInput, setThemeInput] = useState(week?.theme ?? '');

  if (!week) return null;

  const responsible = USERS.find((u) => u.id === week.responsibleId);
  const title = week.type === 'theme' && week.theme ? week.theme : WEEK_TYPE_LABELS[week.type];
  const gc: GeneratedContent | undefined = week.generatedContent;

  const handleToggleComplete = () => {
    upsertWeek({ ...week, completed: !week.completed, updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    if (window.confirm('Deseja mesmo redefinir esta semana para livre? Isso apagará o roteiro da IA.')) {
      upsertWeek({
        ...week,
        type: 'free',
        theme: undefined,
        description: undefined,
        customDynamic: undefined,
        generatedContent: undefined,
        completed: false,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    }
  };

  const handleGenerate = () => {
    generateContent(week.id);
  };

  const handleSaveTheme = () => {
    if (themeInput.trim()) {
      const updated = {
        ...week,
        theme: themeInput,
        type: 'theme' as const,
        updatedAt: new Date().toISOString(),
      };
      upsertWeek(updated);
      setEditingTheme(false);
      generateContent(week.id).catch(console.error);
    }
  };

  // Get other weeks of the same month for swapping
  const otherWeeksInMonth = useMemo(() => {
    const monthPrefix = week.date.substring(0, 7); // YYYY-MM
    return state.weeks
      .filter((w) => w.date.startsWith(monthPrefix) && w.id !== week.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [week.date, state.weeks]);

  const handleSwap = async (otherId: string) => {
    await swapWeeks(week.id, otherId);
    setShowSwapSelector(false);
  };

  // Format watchtower style superscript paragraph numbers
  const renderNumberedParagraphs = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split('\n').filter((p) => p.trim().length > 0);
    return paragraphs.map((p, index) => {
      const cleanText = p.replace(/^\d+[\.\s]*/, ''); // remove default list numbering if AI put it
      return (
        <p key={index} className="wt-paragraph" style={{
          marginBottom: '14px',
          textIndent: '18px',
          textAlign: 'justify',
          fontSize: '0.92rem',
          lineHeight: '1.7',
          color: 'var(--c-text)',
        }}>
          <sup style={{
            color: 'var(--c-primary)',
            marginRight: '6px',
            fontWeight: 'bold',
            fontSize: '0.74rem',
            verticalAlign: 'super',
          }}>{index + 1}</sup>
          {cleanText}
        </p>
      );
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">Adoração em Família</div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ background: 'transparent', padding: '16px' }}>
          
          {/* Watchtower Style Ochre Header bar */}
          <div style={{
            background: 'var(--c-accent)',
            color: '#ffffff',
            padding: '8px 16px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
          }}>
            {getWeekRangeString(week.date)}
          </div>

          {/* Watchtower Study Sheet */}
          <div style={{
            background: 'var(--c-surface-glass)',
            padding: '20px',
            border: '1px solid var(--c-border)',
            borderRadius: '0 0 var(--r-md) var(--r-md)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--r-sm)',
                background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--c-primary)', flexShrink: 0,
              }}>
                {week.type === 'meeting_prep' && <DocIcon size={22} />}
                {week.type === 'broadcast' && <TvIcon size={22} />}
                {week.type === 'theme' && <BookIcon size={22} />}
                {week.type === 'free' && <SparklesIcon size={22} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingTheme ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="input"
                      value={themeInput}
                      onChange={(e) => setThemeInput(e.target.value)}
                      style={{ height: '36px', fontSize: '0.85rem' }}
                      placeholder="Tema..."
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleSaveTheme}>Salvar</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditingTheme(false)}>X</button>
                  </div>
                ) : (
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.3 }}>
                    {title}
                    {week.type === 'theme' && (
                      <button
                        onClick={() => { setThemeInput(week.theme || ''); setEditingTheme(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'inline-flex', color: 'var(--c-primary)' }}
                        title="Editar tema"
                      >
                        <EditIcon size={14} />
                      </button>
                    )}
                  </h2>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {week.type !== 'free' && (
                    (week.type === 'meeting_prep' || week.type === 'broadcast') ? (
                      <span className="badge" style={{ background: 'var(--c-primary-20)', color: 'var(--c-primary)', fontWeight: 700 }}>
                        Família
                      </span>
                    ) : responsible && (
                      <span className="badge" style={{ background: `${responsible.color}15`, color: responsible.color, fontWeight: 700 }}>
                        {responsible.name}
                      </span>
                    )
                  )}
                  <span className="badge badge-primary" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
                    {WEEK_TYPE_LABELS[week.type]}
                  </span>
                  {week.completed && <span className="badge badge-success">✓ Realizada</span>}
                </div>
              </div>
            </div>

            {/* Description */}
            {week.description && (
              <div style={{ margin: '14px 0', padding: '12px', background: 'var(--c-bg)', borderLeft: '3px solid var(--c-primary)', borderRadius: 'var(--r-xs)' }}>
                <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>{week.description}</p>
              </div>
            )}

            {/* Complete / Swap / Reset Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button
                className={`btn btn-sm ${week.completed ? 'btn-ghost' : 'btn-primary'}`}
                style={!week.completed ? { background: 'var(--c-primary)', color: 'white' } : undefined}
                onClick={handleToggleComplete}
              >
                {week.completed ? '↩ Reabrir Adoração' : '✓ Concluir Adoração'}
              </button>

              {otherWeeksInMonth.length > 0 && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowSwapSelector(!showSwapSelector)}
                >
                  🔄 Inverter Data
                </button>
              )}

              {week.type === 'theme' && (
                <button className="btn btn-sm btn-danger" onClick={handleDelete} style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--c-error)', border: 'none' }}>
                  🗑 Apagar Sugestão
                </button>
              )}
            </div>

            {/* Swap selector */}
            {showSwapSelector && (
              <div className="swap-selector-list animate-up">
                <p className="text-xs text-muted font-semibold" style={{ marginBottom: '8px' }}>Inverter data com outra semana:</p>
                {otherWeeksInMonth.map((ow) => {
                  const owTitle = ow.type === 'theme' && ow.theme ? ow.theme : WEEK_TYPE_LABELS[ow.type];
                  const owResp = USERS.find((u) => u.id === ow.responsibleId);
                  return (
                    <button key={ow.id} className="swap-selector-item" onClick={() => handleSwap(ow.id)}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{getWeekRangeString(ow.date).split(' de ')[0]}</span>
                      <span style={{ fontSize: '0.82rem', flex: 1, marginLeft: '10px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{owTitle}</span>
                      {ow.type !== 'free' && owResp && (
                        <span className="badge" style={{ background: `${owResp.color}15`, color: owResp.color, fontSize: '0.62rem' }}>{owResp.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Loader */}
          {state.isLoading && (
            <div className="card animate-scale" style={{ marginBottom: '20px', border: '1px solid var(--c-border)' }}>
              <AiLoading />
            </div>
          )}

          {/* Error display */}
          {state.error && (
            <div className="error-banner" style={{ marginBottom: '16px', borderRadius: 'var(--r-sm)' }}>
              <span>⚠️</span>
              <div>
                <div className="font-medium">Erro ao gerar conteúdo</div>
                <div className="text-sm" style={{ marginTop: '2px' }}>{state.error}</div>
              </div>
            </div>
          )}

          {/* AI Generation trigger cards */}
          {!gc && !state.isLoading && (week.type === 'theme' || week.type === 'free') && (
            <div className="card animate-up" style={{ marginBottom: '20px', border: '1px dashed var(--c-border)' }}>
              <div className="generate-cta" style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-md)' }}>
                <div className="generate-cta-icon" style={{ color: 'var(--c-accent)', display: 'flex', justifyContent: 'center' }}>
                  <SparklesIcon size={38} />
                </div>
                <h3 className="generate-cta-title">Gerar Roteiro de Estudo</h3>
                <p className="generate-cta-desc">
                  {week.type === 'free' ? (
                    <>Defina um tema de estudo para que a IA possa elaborar perguntas, dinâmicas e pesquisar referências do jw.org.</>
                  ) : (
                    <>
                      O Gemini vai buscar recursos complementares no <strong>jw.org</strong> e criar perguntas e dinâmicas
                      sobre o tema <strong>"{week.theme}"</strong>.
                    </>
                  )}
                </p>
                {week.type === 'free' ? (
                  <button className="btn btn-primary btn-sm" onClick={() => setEditingTheme(true)}>
                    + Definir Tema
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ background: 'var(--c-accent)', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleGenerate} disabled={state.isLoading}>
                    <SparklesIcon size={16} /> Gerar com IA
                  </button>
                )}
              </div>
            </div>
          )}

          {!gc && !state.isLoading && (week.type === 'broadcast' || week.type === 'meeting_prep') && (
            <div className="card animate-up" style={{ marginBottom: '20px', border: '1px dashed var(--c-border)' }}>
              <div className="generate-cta" style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-md)' }}>
                <div className="generate-cta-icon" style={{ color: 'var(--c-primary)', display: 'flex', justifyContent: 'center' }}>
                  <RobotIcon size={38} />
                </div>
                <h3 className="generate-cta-title">Gerar Auxiliares de Estudo</h3>
                <p className="generate-cta-desc">
                  Deseja usar a inteligência artificial para estruturar perguntas, dinâmica e pontos para destacar do/da {WEEK_TYPE_LABELS[week.type]}?
                </p>
                <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleGenerate}>
                  <SparklesIcon size={16} /> Gerar com IA
                </button>
              </div>
            </div>
          )}

          {/* AI Generated Study Guide */}
          {gc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Objective (numbered paragraphs Watchtower style) */}
              <ContentSection icon={<BookIcon size={18} />} title="Objetivo e Consideração">
                <div className="wt-paragraphs-container">
                  {renderNumberedParagraphs(gc.objective)}
                </div>
              </ContentSection>

              {/* Bible Verses */}
              {gc.bibleVerses?.length > 0 && (
                <ContentSection icon={<BookIcon size={18} />} title="Textos Bíblicos Centrais">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {gc.bibleVerses.map((v: BibleVerse, i: number) => (
                      <div key={i} className="bible-verse-item" style={{
                        padding: '12px',
                        background: 'var(--c-primary-light)',
                        borderLeft: '3px solid var(--c-primary)',
                        borderRadius: '0 var(--r-sm) var(--r-sm) 0',
                      }}>
                        <div className="bible-verse-ref" style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-primary)', marginBottom: '4px' }}>
                          {v.reference}
                        </div>
                        <div className="bible-verse-text" style={{ fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.5, color: 'var(--c-text)' }}>
                          "{v.text}"
                        </div>
                      </div>
                    ))}
                  </div>
                </ContentSection>
              )}

              {/* Questions */}
              {gc.discussionQuestions?.length > 0 && (
                <ContentSection icon={<DocIcon size={18} />} title="Perguntas para Meditação">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {gc.discussionQuestions.map((q: DiscussionQuestion, i: number) => (
                      <div key={i} className="question-item" style={{ padding: '4px 0' }}>
                        <p className="question-text" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--c-text)' }}>
                          <span style={{ color: 'var(--c-primary)', marginRight: '6px', fontWeight: 700 }}>{i + 1}.</span>
                          {q.question}
                        </p>
                        {q.hint && <p className="question-hint" style={{ fontSize: '0.78rem', color: 'var(--c-text-2)', marginLeft: '18px', marginTop: '3px' }}>💡 {q.hint}</p>}
                      </div>
                    ))}
                  </div>
                </ContentSection>
              )}

              {/* Dynamic activity */}
              {gc.dynamic && (
                <ContentSection icon={<SparklesIcon size={18} />} title="Atividade Prática / Dinâmica">
                  <div className="dynamic-box" style={{
                    padding: '14px',
                    background: 'var(--c-bg)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                  }}>
                    {gc.dynamic}
                  </div>
                </ContentSection>
              )}

              {/* Supplementary resources (jw.org) */}
              {gc.jwLinks?.length > 0 && (
                <ContentSection icon={<DocIcon size={18} />} title="Recursos de Pesquisa Complementares">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gc.jwLinks.map((link: JwLink, i: number) => {
                      const rawDesc = link.description || '';
                      const typeMatch = rawDesc.match(/^\[(ARTIGO|VIDEO|VÍDEO|ESTUDO|PROGRAMA|RECURSO)\]/i);
                      const linkType = typeMatch ? typeMatch[1].toUpperCase() : (
                        (link.url || '').includes('tv.jw.org') ? 'VÍDEO' :
                        (link.url || '').includes('wol.jw.org') ? 'ESTUDO' : 'ARTIGO'
                      );
                      const cleanDesc = rawDesc.replace(/^\[.*?\]\s*/, '');
                      const palette: Record<string, string> = {
                        ARTIGO: '#4a6da7', VIDEO: '#5b3c88', VÍDEO: '#5b3c88',
                        ESTUDO: '#2d9964', PROGRAMA: '#d97706', RECURSO: '#799fcc',
                      };
                      const color = palette[linkType] || '#4a6da7';
                      return (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'flex', gap: '8px', padding: '10px',
                            borderRadius: 'var(--r-sm)', border: `1px solid ${color}20`,
                            background: `${color}05`, textDecoration: 'none',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              display: 'inline-block', fontSize: '0.58rem', fontWeight: 700,
                              color, background: `${color}15`, padding: '1px 5px',
                              borderRadius: 'var(--r-full)', marginBottom: '3px',
                            }}>{linkType}</span>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-text)', lineHeight: 1.2 }}>
                              {link.title}
                            </div>
                            {cleanDesc && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--c-text-2)', marginTop: '2px', lineHeight: 1.4 }}>
                                {cleanDesc}
                              </div>
                            )}
                          </div>
                          <span style={{ color, fontSize: '0.85rem' }}>↗</span>
                        </a>
                      );
                    })}
                  </div>
                </ContentSection>
              )}

              {/* Encerramento */}
              {gc.closingThought && (
                <ContentSection icon={<SparklesIcon size={18} />} title="Encerramento e Oração">
                  <div style={{
                    padding: '14px',
                    fontStyle: 'italic',
                    background: 'var(--c-primary-light)',
                    border: '1px solid var(--c-primary-20)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                    color: 'var(--c-text-2)',
                  }}>
                    {gc.closingThought}
                  </div>
                </ContentSection>
              )}

              {/* IA Regenerate trigger */}
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleGenerate}
                disabled={state.isLoading}
                style={{ alignSelf: 'center', marginTop: '12px' }}
              >
                🔄 Regerar Roteiro com Gemini IA
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
