import React from 'react';
import { useApp } from '../context/AppContext';
import type { BibleVerse, DiscussionQuestion, GeneratedContent, JwLink } from '../types';
import { WEEK_TYPE_ICONS, WEEK_TYPE_LABELS } from '../types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="back-btn" onClick={onClick} aria-label="Voltar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Voltar
  </button>
);

const ContentSection: React.FC<{ icon: string; title: string; children: React.ReactNode; delay?: number }> = ({
  icon, title, children, delay = 1,
}) => (
  <div className={`card content-section animate-up delay-${delay}`}>
    <div className="card-body">
      <div className="content-section-header">
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

export const WeekDetail: React.FC = () => {
  const { state, navigate, generateContent, upsertWeek, deleteWeek } = useApp();
  const week = state.weeks.find((w) => w.id === state.selectedWeekId);

  if (!week) {
    return (
      <div className="page">
        <BackBtn onClick={() => navigate('dashboard')} />
        <div className="empty-state"><p>Semana não encontrada.</p></div>
      </div>
    );
  }

  const responsible = [
    { id: 'rafael', name: 'Rafael Floro', color: '#5b3c88' },
    { id: 'gracy', name: 'Gracy Kelly', color: '#4a6da7' },
    { id: 'ricardo', name: 'Ricardo Floro', color: '#799fcc' },
  ].find((u) => u.id === week.responsibleId);

  const title = week.type === 'theme' && week.theme ? week.theme : WEEK_TYPE_LABELS[week.type];
  const gc: GeneratedContent | undefined = week.generatedContent;

  const handleToggleComplete = () => {
    upsertWeek({ ...week, completed: !week.completed, updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    if (window.confirm('Remover esta adoração?')) {
      deleteWeek(week.id);
      navigate('dashboard');
    }
  };

  const handleGenerate = () => {
    generateContent(week.id);
  };

  return (
    <div className="page">
      <BackBtn onClick={() => navigate('dashboard')} />

      {/* Header */}
      <div className="detail-header animate-up">
        <div className="detail-hero-icon">{WEEK_TYPE_ICONS[week.type]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>{formatDate(week.date)}</div>
          <h2 style={{ marginBottom: '8px' }}>{title}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {responsible && (
              <span
                className="badge"
                style={{ background: `${responsible.color}22`, color: responsible.color }}
              >
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
        <div className="animate-up delay-1" style={{ marginBottom: '20px' }}>
          <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>{week.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="detail-actions animate-up delay-1">
        <button
          className={`btn btn-sm ${week.completed ? 'btn-ghost' : 'btn-secondary'}`}
          onClick={handleToggleComplete}
        >
          {week.completed ? '↩ Reabrir' : '✓ Marcar como Realizada'}
        </button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => navigate('week-form', week.id)}
        >
          ✎ Editar
        </button>
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>
          🗑
        </button>
      </div>

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

      {!gc && !state.isLoading && week.type === 'theme' && (
        <div className="card animate-up delay-2" style={{ marginBottom: '20px' }}>
          <div className="generate-cta">
            <div className="generate-cta-icon">✨</div>
            <h3 className="generate-cta-title">Gerar Roteiro com Gemini AI</h3>
            <p className="generate-cta-desc">
              Com base no seu tema, o Gemini vai estruturar um roteiro completo de adoração em família.<br/><br/>
              Ele também pesquisa automaticamente no <strong>jw.org</strong> e <strong>tv.jw.org</strong>
              para encontrar <strong>artigos, vídeos e estudos complementares</strong> reais sobre este assunto — tudo salvo e disponível para sempre.
            </p>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={state.isLoading}>
              ✨ Gerar Roteiro com Gemini
            </button>
          </div>
        </div>
      )}


      {/* Generated Content */}
      {gc && (
        <>
          {/* Regenerate */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="text-xs text-muted">
              Gerado em {new Date(gc.generatedAt).toLocaleDateString('pt-BR')}
            </span>
            {week.type === 'theme' && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleGenerate}
                disabled={state.isLoading}
                style={{ marginLeft: 'auto' }}
              >
                🔄 Regerar
              </button>
            )}
          </div>

          {/* Objective */}
          <ContentSection icon="🎯" title="Objetivo da Adoração" delay={1}>
            <p className="objective-text">{gc.objective}</p>
          </ContentSection>

          {/* Bible Verses */}
          {gc.bibleVerses?.length > 0 && (
            <ContentSection icon="📖" title="Textos Bíblicos" delay={2}>
              {gc.bibleVerses.map((v: BibleVerse, i: number) => (
                <div key={i} className="bible-verse-item">
                  <div className="bible-verse-ref">{v.reference}</div>
                  <div className="bible-verse-text">{v.text}</div>
                </div>
              ))}
            </ContentSection>
          )}

          {/* Discussion Questions */}
          {gc.discussionQuestions?.length > 0 && (
            <ContentSection icon="💬" title="Perguntas para Discussão" delay={2}>
              {gc.discussionQuestions.map((q: DiscussionQuestion, i: number) => (
                <div key={i} className="question-item">
                  <p className="question-text">
                    <span style={{ color: 'var(--c-primary)', fontWeight: 700, marginRight: '8px' }}>
                      {i + 1}.
                    </span>
                    {q.question}
                  </p>
                  {q.hint && <p className="question-hint">💡 {q.hint}</p>}
                </div>
              ))}
            </ContentSection>
          )}

          {/* Dynamic */}
          {gc.dynamic && (
            <ContentSection icon="🎮" title="Dinâmica / Atividade" delay={3}>
              <div className="dynamic-box">{gc.dynamic}</div>
            </ContentSection>
          )}

          {/* JW Links — Recursos Complementares */}
          {gc.jwLinks?.length > 0 && (
            <ContentSection icon="🔗" title="Recursos Complementares · jw.org" delay={3}>
              <p className="text-xs text-muted" style={{ marginBottom: '14px', lineHeight: 1.6 }}>
                Pesquisados pelo Gemini especialmente para esta adoração — artigos, vídeos e estudos para explorar juntos ou individualmente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  const icons: Record<string, string> = {
                    ARTIGO: '📄', VIDEO: '🎬', VÍDEO: '🎬',
                    ESTUDO: '📚', PROGRAMA: '📺', RECURSO: '🔗',
                  };
                  const color = palette[linkType] || '#4a6da7';
                  const icon = icons[linkType] || '🔗';
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', gap: '12px', padding: '14px',
                        borderRadius: 'var(--r-md)', border: `1px solid ${color}22`,
                        background: `${color}08`, textDecoration: 'none',
                        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                        alignItems: 'flex-start',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = `${color}14`;
                        el.style.borderColor = `${color}44`;
                        el.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = `${color}08`;
                        el.style.borderColor = `${color}22`;
                        el.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: 'var(--r-sm)',
                        background: `${color}18`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                      }}>{icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
                          letterSpacing: '0.07em', color, textTransform: 'uppercase',
                          background: `${color}18`, padding: '2px 7px',
                          borderRadius: 'var(--r-full)', marginBottom: '5px',
                        }}>{linkType}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--c-text)', marginBottom: '3px', lineHeight: 1.3 }}>
                          {link.title}
                        </div>
                        {cleanDesc && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--c-text-2)', lineHeight: 1.5 }}>{cleanDesc}</div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--c-text-3)', marginTop: '4px' }}>
                          {(link.url || '').replace('https://', '').split('/')[0]}
                        </div>
                      </div>
                      <span style={{ color, fontSize: '1rem', marginTop: '8px', flexShrink: 0 }}>↗</span>
                    </a>
                  );
                })}
              </div>
            </ContentSection>
          )}


          {/* Search grounding sources */}
          {gc.searchGroundingSources && gc.searchGroundingSources.length > 0 && (
            <ContentSection icon="🔍" title="Fontes Pesquisadas pela IA" delay={4}>
              <p className="text-xs text-muted" style={{ marginBottom: '10px' }}>
                O Gemini pesquisou na web para enriquecer este roteiro:
              </p>
              {gc.searchGroundingSources.slice(0, 5).map((src: string, i: number) => (
                <div key={i} className="link-item" style={{ display: 'flex' }}>
                  <div className="link-dot" style={{ background: 'var(--c-accent)', marginTop: '5px' }} />
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs"
                    style={{ color: 'var(--c-secondary)', wordBreak: 'break-all' }}
                  >
                    {src}
                  </a>
                </div>
              ))}
            </ContentSection>
          )}

          {/* Closing Thought */}
          {gc.closingThought && (
            <ContentSection icon="🙏" title="Encerramento" delay={4}>
              <div className="closing-box">{gc.closingThought}</div>
            </ContentSection>
          )}
        </>
      )}

      {/* Broadcast / Meeting prep content */}
      {!gc && week.type === 'broadcast' && (
        <div className="card animate-up delay-2">
          <div className="card-body">
            <div className="generate-cta" style={{ border: 'none', padding: '0' }}>
              <div className="generate-cta-icon">📺</div>
              <h3 className="generate-cta-title">JW Broadcasting</h3>
              <p className="generate-cta-desc">
                Esta semana é de <strong>JW Broadcasting</strong>! Assista ao programa do mês em{' '}
                <a href="https://tv.jw.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-primary)' }}>
                  tv.jw.org
                </a>{' '}
                juntos em família.
              </p>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={state.isLoading}>
                ✨ Gerar Sugestões de Discussão
              </button>
            </div>
          </div>
        </div>
      )}

      {!gc && week.type === 'meeting_prep' && (
        <div className="card animate-up delay-2">
          <div className="card-body">
            <div className="generate-cta" style={{ border: 'none', padding: '0' }}>
              <div className="generate-cta-icon">📋</div>
              <h3 className="generate-cta-title">Preparação de Reunião</h3>
              <p className="generate-cta-desc">
                Esta semana é para <strong>preparar a reunião</strong> juntos. Revejam o material da Reunião Vida e Ministério
                e preparem comentários e respostas.
              </p>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={state.isLoading}>
                ✨ Gerar Roteiro de Preparação
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '16px' }} />
    </div>
  );
};
