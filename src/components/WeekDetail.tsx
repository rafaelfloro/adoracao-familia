import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { BibleVerse, DiscussionQuestion, GeneratedContent, JwLink } from '../types';
import { WEEK_TYPE_ICONS, WEEK_TYPE_LABELS, USERS } from '../types';

interface WeekDetailModalProps {
  weekId: string;
  onClose: () => void;
}

const ContentSection: React.FC<{ icon: string; title: string; children: React.ReactNode; delay?: number }> = ({
  icon, title, children, delay = 1,
}) => (
  <div className={`card content-section animate-up delay-${delay}`} style={{ marginBottom: '16px' }}>
    <div className="card-body" style={{ padding: '16px' }}>
      <div className="content-section-header" style={{ marginBottom: '10px', paddingBottom: '8px' }}>
        <span className="content-section-icon">{icon}</span>
        <span className="content-section-title">{title}</span>
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
    if (window.confirm('Deseja mesmo redefinir esta semana para livre?')) {
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
      // Auto regenerate if edited
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">Detalhes da Adoração</div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Hero Section */}
          <div className="detail-header" style={{ marginBottom: '20px' }}>
            <div className="detail-hero-icon" style={{ width: '54px', height: '54px', fontSize: '1.6rem' }}>
              {WEEK_TYPE_ICONS[week.type]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>
                {formatDate(week.date)}
              </div>
              
              {editingTheme ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    className="input"
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    style={{ height: '38px', fontSize: '0.9rem' }}
                    placeholder="Digite o novo tema"
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleSaveTheme}>Salvar</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditingTheme(false)}>Cancelar</button>
                </div>
              ) : (
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {title}
                  {week.type === 'theme' && (
                    <button
                      onClick={() => { setThemeInput(week.theme || ''); setEditingTheme(true); }}
                      style={{ fontSize: '0.9rem', cursor: 'pointer', opacity: 0.6 }}
                      title="Editar tema"
                    >
                      ✎
                    </button>
                  )}
                </h2>
              )}

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {week.type !== 'free' && responsible && (
                  <span className="badge" style={{ background: `${responsible.color}15`, color: responsible.color, fontWeight: 700 }}>
                    {responsible.name}
                  </span>
                )}
                <span className="badge badge-primary">{WEEK_TYPE_LABELS[week.type]}</span>
                {week.completed && <span className="badge badge-success">✓ Realizada</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          {week.description && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)' }}>
              <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{week.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="detail-actions" style={{ marginBottom: '20px' }}>
            <button
              className={`btn btn-sm ${week.completed ? 'btn-ghost' : 'btn-secondary'}`}
              onClick={handleToggleComplete}
            >
              {week.completed ? '↩ Reabrir' : '✓ Concluir'}
            </button>

            {/* Swap Trigger */}
            {otherWeeksInMonth.length > 0 && (
              <button
                className={`btn btn-sm ${showSwapSelector ? 'btn-primary' : 'btn-secondary'} swap-badge-trigger`}
                onClick={() => setShowSwapSelector(!showSwapSelector)}
              >
                🔄 Inverter Semana
              </button>
            )}

            {week.type === 'theme' && (
              <button className="btn btn-sm btn-danger" onClick={handleDelete} title="Redefinir para livre">
                🗑 Redefinir
              </button>
            )}
          </div>

          {/* Swap Selector Drawer */}
          {showSwapSelector && (
            <div className="swap-selector-list animate-up">
              <p className="text-xs text-muted font-semibold">Selecione outra semana deste mês para inverter a data:</p>
              {otherWeeksInMonth.map((ow) => {
                const owTitle = ow.type === 'theme' && ow.theme ? ow.theme : WEEK_TYPE_LABELS[ow.type];
                const owResp = USERS.find((u) => u.id === ow.responsibleId);
                const dayNum = new Date(ow.date + 'T12:00:00').getDate();
                return (
                  <button key={ow.id} className="swap-selector-item" onClick={() => handleSwap(ow.id)}>
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--c-accent)', marginRight: '8px' }}>
                        Dia {dayNum}:
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>{owTitle}</span>
                    </div>
                    {ow.type !== 'free' && owResp && (
                      <span className="badge" style={{ background: `${owResp.color}15`, color: owResp.color, fontSize: '0.65rem' }}>
                        {owResp.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="divider" style={{ margin: '20px 0' }} />

          {/* AI Loading */}
          {state.isLoading && (
            <div className="card animate-scale" style={{ marginBottom: '20px' }}>
              <AiLoading />
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="error-banner" style={{ marginBottom: '16px' }}>
              <span>⚠️</span>
              <div>
                <div className="font-medium">Erro ao gerar conteúdo</div>
                <div className="text-sm" style={{ marginTop: '2px' }}>{state.error}</div>
              </div>
            </div>
          )}

          {/* Generate CTA — shown only for theme type without content */}
          {!gc && !state.isLoading && (week.type === 'theme' || week.type === 'free') && (
            <div className="card animate-up" style={{ marginBottom: '20px' }}>
              <div className="generate-cta">
                <div className="generate-cta-icon">✨</div>
                <h3 className="generate-cta-title">Gerar Roteiro com Gemini AI</h3>
                <p className="generate-cta-desc">
                  {week.type === 'free' ? (
                    <>Defina um tema primeiro para gerar um estudo bíblico dinâmico.</>
                  ) : (
                    <>
                      O Gemini vai buscar recursos complementares reais do <strong>jw.org</strong> e criar versículos,
                      perguntas e dinâmicas interativas sobre o tema <strong>"{week.theme}"</strong>.
                    </>
                  )}
                </p>
                {week.type === 'free' ? (
                  <button className="btn btn-primary btn-sm" onClick={() => setEditingTheme(true)}>
                    + Definir Tema
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleGenerate} disabled={state.isLoading}>
                    ✨ Gerar Roteiro
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Render system week generator buttons if empty */}
          {!gc && !state.isLoading && (week.type === 'broadcast' || week.type === 'meeting_prep') && (
            <div className="card animate-up" style={{ marginBottom: '20px' }}>
              <div className="generate-cta" style={{ background: 'var(--c-bg)', border: 'none' }}>
                <div className="generate-cta-icon">{WEEK_TYPE_ICONS[week.type]}</div>
                <h3 className="generate-cta-title">{WEEK_TYPE_LABELS[week.type]}</h3>
                <p className="generate-cta-desc">
                  Deseja usar a IA para estruturar perguntas e sugestões dinâmicas para este/esta {WEEK_TYPE_LABELS[week.type]}?
                </p>
                <button className="btn btn-primary" onClick={handleGenerate}>
                  ✨ Gerar Estrutura com IA
                </button>
              </div>
            </div>
          )}

          {/* Generated Content details */}
          {gc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Objective */}
              <ContentSection icon="🎯" title="Objetivo da Adoração" delay={1}>
                <p className="objective-text" style={{ fontSize: '0.9rem' }}>{gc.objective}</p>
              </ContentSection>

              {/* Bible Verses */}
              {gc.bibleVerses?.length > 0 && (
                <ContentSection icon="📖" title="Textos Bíblicos" delay={2}>
                  {gc.bibleVerses.map((v: BibleVerse, i: number) => (
                    <div key={i} className="bible-verse-item" style={{ padding: '10px 12px' }}>
                      <div className="bible-verse-ref" style={{ fontSize: '0.8rem' }}>{v.reference}</div>
                      <div className="bible-verse-text" style={{ fontSize: '0.85rem' }}>{v.text}</div>
                    </div>
                  ))}
                </ContentSection>
              )}

              {/* Discussion Questions */}
              {gc.discussionQuestions?.length > 0 && (
                <ContentSection icon="💬" title="Perguntas para Discussão" delay={2}>
                  {gc.discussionQuestions.map((q: DiscussionQuestion, i: number) => (
                    <div key={i} className="question-item" style={{ padding: '8px 0' }}>
                      <p className="question-text" style={{ fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--c-primary)', fontWeight: 700, marginRight: '6px' }}>{i + 1}.</span>
                        {q.question}
                      </p>
                      {q.hint && <p className="question-hint" style={{ fontSize: '0.78rem' }}>💡 {q.hint}</p>}
                    </div>
                  ))}
                </ContentSection>
              )}

              {/* Dynamic */}
              {gc.dynamic && (
                <ContentSection icon="🎮" title="Dinâmica / Atividade" delay={3}>
                  <div className="dynamic-box" style={{ padding: '14px', fontSize: '0.85rem' }}>{gc.dynamic}</div>
                </ContentSection>
              )}

              {/* JW Links */}
              {gc.jwLinks?.length > 0 && (
                <ContentSection icon="🔗" title="Recursos Complementares · jw.org" delay={3}>
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
                            alignItems: 'flex-start',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              display: 'inline-block', fontSize: '0.6rem', fontWeight: 700,
                              color, background: `${color}15`, padding: '1px 5px',
                              borderRadius: 'var(--r-full)', marginBottom: '3px',
                            }}>{linkType}</span>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--c-text)', lineHeight: 1.2 }}>
                              {link.title}
                            </div>
                            {cleanDesc && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', marginTop: '2px', lineHeight: 1.4 }}>
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

              {/* Closing Thought */}
              {gc.closingThought && (
                <ContentSection icon="🙏" title="Encerramento" delay={4}>
                  <div className="closing-box" style={{ padding: '14px', fontSize: '0.85rem' }}>{gc.closingThought}</div>
                </ContentSection>
              )}

              {/* Regene option */}
              <button className="btn btn-sm btn-ghost" onClick={handleGenerate} disabled={state.isLoading} style={{ alignSelf: 'center', marginTop: '10px' }}>
                🔄 Regerar Roteiro com IA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
