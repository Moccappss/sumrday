import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

export interface ContextMenuItem {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  color?: string;
  badge?: string;
}

export interface ContextMenuOptions {
  title?: string;
  subtitle?: string;
  headerBadge?: string;
  items: ContextMenuItem[];
}

interface ContextMenuContextType {
  openContextMenu: (e: React.MouseEvent | React.TouchEvent | { clientX: number; clientY: number }, options: ContextMenuOptions) => void;
  closeContextMenu: () => void;
  bindContextMenu: (options: ContextMenuOptions | (() => ContextMenuOptions)) => {
    onContextMenu: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };
}

const defaultContextMenuValue: ContextMenuContextType = {
  openContextMenu: () => {},
  closeContextMenu: () => {},
  bindContextMenu: () => ({
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onTouchStart: () => {},
    onTouchMove: () => {},
    onTouchEnd: () => {},
    onTouchCancel: () => {},
  })
};

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    return defaultContextMenuValue;
  }
  return context;
};

export const ContextMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    options: ContextMenuOptions | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    options: null
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Native 1-step back navigation integration
  useNativeBackHandler(menuState.isOpen, closeContextMenu, 'admin_context_menu', 40);

  const openContextMenu = useCallback((
    e: React.MouseEvent | React.TouchEvent | { clientX: number; clientY: number },
    options: ContextMenuOptions
  ) => {
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e && 'clientY' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Trigger subtle haptic vibration on mobile if available
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(35);
      }
    } catch (_) {}

    setMenuState({
      isOpen: true,
      x: clientX,
      y: clientY,
      options
    });
  }, []);

  // Hook helper to bind touch-and-hold (long-press) & right-click
  const bindContextMenu = useCallback((options: ContextMenuOptions | (() => ContextMenuOptions)) => {
    let timer: any = null;
    let startX = 0;
    let startY = 0;
    let didTrigger = false;

    const getOptions = () => (typeof options === 'function' ? options() : options);

    return {
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(e, getOptions());
      },
      onTouchStart: (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        didTrigger = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        timer = setTimeout(() => {
          didTrigger = true;
          openContextMenu(e, getOptions());
        }, 400); // 400ms long-press threshold
      },
      onTouchMove: (e: React.TouchEvent) => {
        if (!timer) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const dist = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        // Cancel long-press if user scrolls or moves finger > 10px
        if (dist > 10) {
          clearTimeout(timer);
          timer = null;
        }
      },
      onTouchEnd: (e: React.TouchEvent) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (didTrigger) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      onTouchCancel: () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      onClickCapture: (e: React.MouseEvent) => {
        if (didTrigger) {
          e.preventDefault();
          e.stopPropagation();
          didTrigger = false;
        }
      }
    };
  }, [openContextMenu]);

  // Adjust menu position so it stays within viewport
  useEffect(() => {
    if (!menuState.isOpen || !menuRef.current || isMobile) return;

    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const padding = 12;
    let newX = menuState.x;
    let newY = menuState.y;

    if (newX + rect.width > window.innerWidth - padding) {
      newX = window.innerWidth - rect.width - padding;
    }
    if (newX < padding) {
      newX = padding;
    }

    if (newY + rect.height > window.innerHeight - padding) {
      newY = window.innerHeight - rect.height - padding;
    }
    if (newY < padding) {
      newY = padding;
    }

    el.style.left = `${newX}px`;
    el.style.top = `${newY}px`;
  }, [menuState, isMobile]);

  // Close on outside click or escape (Desktop mouse & keyboard)
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuState.isOpen, closeContextMenu]);

  return (
    <ContextMenuContext.Provider value={{ openContextMenu, closeContextMenu, bindContextMenu }}>
      {children}

      {menuState.isOpen && menuState.options && createPortal(
        <div
          className="cms-context-menu-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            animation: 'cmsFadeIn 0.15s ease',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onTouchStart={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={e => {
            e.preventDefault();
            e.stopPropagation();
            closeContextMenu();
          }}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            closeContextMenu();
          }}
          onContextMenu={e => {
            e.preventDefault();
            e.stopPropagation();
            closeContextMenu();
          }}
        >
          <div
            ref={menuRef}
            className="cms-solid-context-menu"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: isMobile ? '50%' : menuState.x,
              top: isMobile ? '50%' : menuState.y,
              bottom: 'auto',
              transform: isMobile ? 'translate(-50%, -50%)' : 'none',
              width: isMobile ? 'calc(100vw - 32px)' : '250px',
              maxWidth: isMobile ? 380 : 280,
              maxHeight: isMobile ? 'calc(100dvh - 120px)' : 'calc(100vh - 32px)',
              overflowY: 'auto',
              background: 'var(--cms-card-bg, #0f172a)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.15))',
              borderRadius: isMobile ? 24 : 20,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(0, 0, 0, 0.35)',
              padding: '8px',
              zIndex: 10000000,
              animation: isMobile ? 'cmsSlideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'cmsContextMenuPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              userSelect: 'none',
              boxSizing: 'border-box'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Optional Header */}
            {(menuState.options.title || menuState.options.subtitle) && (
              <div style={{
                padding: '8px 12px 10px',
                borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {menuState.options.title && (
                    <div style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'var(--cms-text, #fff)',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {menuState.options.title}
                    </div>
                  )}
                  {menuState.options.subtitle && (
                    <div style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--cms-text-muted, rgba(255,255,255,0.5))',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 1
                    }}>
                      {menuState.options.subtitle}
                    </div>
                  )}
                </div>
                {menuState.options.headerBadge && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: 'var(--cms-accent-soft, rgba(139, 92, 246, 0.15))',
                    color: 'var(--cms-accent, #a78bfa)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    flexShrink: 0
                  }}>
                    {menuState.options.headerBadge}
                  </span>
                )}
              </div>
            )}

            {/* Menu Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {menuState.options.items.map((item, index) => {
                if (item.separator) {
                  return (
                    <div
                      key={`sep-${index}`}
                      style={{
                        height: 1,
                        background: 'var(--glass-border, rgba(255,255,255,0.08))',
                        margin: '4px 6px'
                      }}
                    />
                  );
                }

                const isDanger = item.danger;
                const isDisabled = item.disabled;

                return (
                  <button
                    key={item.id || `item-${index}`}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      closeContextMenu();
                      if (item.action) item.action();
                    }}
                    className="cms-context-menu-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: isMobile ? '11px 14px' : '8px 12px',
                      borderRadius: 14,
                      border: 'none',
                      background: 'transparent',
                      color: isDanger 
                        ? '#ef4444' 
                        : item.color || 'var(--cms-text, #fff)',
                      fontSize: isMobile ? 13 : 12,
                      fontWeight: 650,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => {
                      if (isDisabled) return;
                      e.currentTarget.style.background = isDanger
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'var(--cms-accent-soft, rgba(139, 92, 246, 0.12))';
                      if (!item.color && !isDanger) {
                        e.currentTarget.style.color = 'var(--cms-accent, #a78bfa)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (isDisabled) return;
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = isDanger 
                        ? '#ef4444' 
                        : item.color || 'var(--cms-text, #fff)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      {item.icon && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          flexShrink: 0,
                          color: isDanger ? '#ef4444' : item.color || 'inherit'
                        }}>
                          {item.icon}
                        </div>
                      )}
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.08)',
                        color: 'var(--cms-text-muted, rgba(255,255,255,0.6))',
                        marginLeft: 6
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {item.shortcut && !isMobile && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'var(--cms-text-muted, rgba(255,255,255,0.4))',
                        marginLeft: 8
                      }}>
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes cmsContextMenuPop {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes cmsSlideUpModal {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
    </ContextMenuContext.Provider>
  );
};
