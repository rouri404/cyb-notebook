import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiPlus, FiMenu, FiHelpCircle, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import './App.css';

interface NotebookItem {
  id: string;
  text: string;
  done: boolean;
  isTask?: boolean;
  createdAt: string;
  source: string;
}

interface Notebook {
  id: string;
  name?: string;
  updatedAt: string;
  style: {
    paperType: string;
    textColor: string;
    font: string;
  };
  items: NotebookItem[];
}

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [showTips, setShowTips] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  useEffect(() => {
    if (currentId) {
      fetchNotebook(currentId);
    }
  }, [currentId]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const fetchNotebooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/notebooks`);
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data);
        if (data.length > 0 && !currentId) {
          setCurrentId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    }
  };

  const fetchNotebook = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notebooks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNotebook(data);
        
        const text = (data.items || []).map((item: NotebookItem) => {
          if (!item.isTask) return item.text; // Retorna texto puro (ex: títulos)
          const prefix = item.done ? '- [x] ' : '- [ ] ';
          return prefix + item.text;
        }).join('\n');
        setMarkdownText(text);
      }
    } catch (error) {
      console.error('Error fetching notebook:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotebook = async () => {
    try {
      const name = `Página ${notebooks.length + 1}`;
      const res = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newNb = await res.json();
        setNotebooks([...notebooks, newNb]);
        setCurrentId(newNb.id);
      }
    } catch (error) {
      console.error('Error creating notebook:', error);
    }
  };

  const updatePaperStyle = async (paperType: string) => {
    if (!currentId || !notebook) return;
    setNotebook({ ...notebook, style: { ...notebook.style, paperType } });

    try {
      await fetch(`${API_BASE}/notebooks/${currentId}/style`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperType })
      });
    } catch (error) {
      console.error('Error updating style:', error);
    }
  };

  const deleteNotebook = async (idToDelete: string = currentId!) => {
    if (!idToDelete || !window.confirm('Tem certeza que deseja excluir esta página?')) return;
    try {
      const res = await fetch(`${API_BASE}/notebooks/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = notebooks.filter(n => n.id !== idToDelete);
        setNotebooks(remaining);
        if (currentId === idToDelete) {
          setCurrentId(remaining.length > 0 ? remaining[0].id : null);
          if (remaining.length === 0) setNotebook(null);
        }
      }
    } catch (error) {
      console.error('Error deleting notebook:', error);
    }
  };

  const renameNotebook = async () => {
    if (!currentId || !editName.trim()) {
      setIsRenaming(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/notebooks/${currentId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });
      if (res.ok) {
        const updated = notebooks.map(n => n.id === currentId ? { ...n, name: editName.trim() } : n);
        setNotebooks(updated);
        if (notebook) setNotebook({ ...notebook, name: editName.trim() });
      }
    } catch (error) {
      console.error('Error renaming notebook:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    if (!notebook || !currentId) return;

    const newItems: Partial<NotebookItem>[] = [];
    let currentTextBuffer: string[] = [];

    const flushText = () => {
      if (currentTextBuffer.length > 0) {
        newItems.push({
          id: `item-${Date.now()}-${newItems.length}`,
          text: currentTextBuffer.join('\n'),
          done: false,
          isTask: false,
          createdAt: new Date().toISOString(),
          source: 'web'
        });
        currentTextBuffer = [];
      }
    };

    const lines = markdownText.split('\n');
    lines.forEach((line) => {
      const isCheckedMatch = line.trim().match(/^(?:-\s*)?\[[xX]\]\s+(.*)/);
      const isUncheckedMatch = line.trim().match(/^(?:-\s*)?\[\s*\]\s+(.*)/);
      const isEmpty = line.trim() === '';

      if (isCheckedMatch || isUncheckedMatch) {
        flushText();
        const text = isCheckedMatch ? isCheckedMatch[1] : (isUncheckedMatch ? isUncheckedMatch[1] : '');
        newItems.push({
          id: `item-${Date.now()}-${newItems.length}`,
          text,
          done: !!isCheckedMatch,
          isTask: true,
          createdAt: new Date().toISOString(),
          source: 'web'
        });
      } else if (isEmpty) {
        flushText();
        newItems.push({
          id: `item-${Date.now()}-${newItems.length}`,
          text: '',
          done: false,
          isTask: false,
          createdAt: new Date().toISOString(),
          source: 'web'
        });
      } else {
        currentTextBuffer.push(line);
      }
    });
    flushText();

    setNotebook({ ...notebook, items: newItems as NotebookItem[] });
    
    try {
      await fetch(`${API_BASE}/notebooks/${currentId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems })
      });
    } catch (error) {
      console.error("Error saving items", error);
    }
  };

  const handleCheckboxClick = async (e: React.MouseEvent, index: number, currentDone: boolean) => {
    e.stopPropagation(); 
    if (!notebook || !currentId) return;

    const item = notebook.items[index];
    if (!item.isTask) return;

    try {
      const res = await fetch(`${API_BASE}/notebooks/${currentId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !currentDone })
      });
      
      if (res.ok) {
        const updatedItem = await res.json();
        const newItems = [...notebook.items];
        newItems[index] = updatedItem;
        setNotebook({ ...notebook, items: newItems });

        const newText = newItems.map((it: NotebookItem) => {
          if (!it.isTask) return it.text;
          const prefix = it.done ? '- [x] ' : '- [ ] ';
          return prefix + it.text;
        }).join('\n');
        setMarkdownText(newText);
      }
    } catch (error) {
      console.error("Error toggling item", error);
    }
  };

  const getBackgroundStyle = (type: string) => {
    switch (type) {
      case 'lined':
        return { 
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
          backgroundSize: '100% 32px',
          backgroundPosition: '0 16px'
        };
      case 'grid':
        return { 
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
          backgroundSize: '100% 32px, 32px 100%',
          backgroundPosition: '0 16px, 24px 0' 
        };
      case 'dotted':
        return {
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 16px'
        };
      case 'blank':
      default:
        return {};
    }
  };

  if (!currentId && notebooks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-800 text-gray-400">
        <button onClick={createNotebook} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Criar primeiro Caderno</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-6xl flex h-[85vh] max-h-[800px] justify-between items-stretch">
        
        {/* Sidebar (Índice) */}
        <div className="w-64 bg-[#fdfaf1] border border-[#d8d4c0] rounded-xl shadow-[4px_4px_0px_#e8e4d2,8px_8px_0px_#d8d4c0] flex flex-col hidden sm:flex relative ml-8 xl:ml-20 mb-2">

          {/* Margem Vermelha do Índice */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-red-300 z-0"></div>

          {/* Header */}
          <div className="p-4 pl-14 bg-[#f0ebda] rounded-tr-xl rounded-tl-xl border-b border-[#d8d4c0] flex justify-between items-center z-10">
            <h2 className="font-bold text-gray-800 text-lg tracking-tight">Índice</h2>
            <button onClick={createNotebook} className="p-1.5 bg-white/60 hover:bg-white shadow-sm border border-[#d8d4c0] rounded-md transition-colors text-blue-600">
              <FiPlus />
            </button>
          </div>

          {/* Lista de Páginas */}
          <div className="flex-1 overflow-y-auto z-10" style={{ 
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
            backgroundSize: '100% 32px',
            backgroundPosition: '0 16px'
          }}>
            <div className="pt-2 pb-4">
              {notebooks.map((nb) => (
                <div 
                  key={nb.id}
                  onClick={() => setCurrentId(nb.id)}
                  className={`group flex items-center justify-between w-full pl-14 pr-4 h-[32px] cursor-pointer transition-colors ${currentId === nb.id ? 'bg-blue-600/10 font-bold text-blue-800' : 'text-gray-700 hover:bg-black/5'}`}
                >
                  <span className="truncate flex-1 text-left text-sm font-medium">{nb.name || 'Página'}</span>
                  
                  <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${currentId === nb.id ? 'text-blue-600' : 'text-gray-400'}`}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCurrentId(nb.id);
                        setEditName(nb.name || ''); 
                        setIsRenaming(true); 
                      }} 
                      className="p-1 rounded-sm bg-white shadow-sm hover:text-blue-700 border border-gray-100"
                      title="Renomear"
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteNotebook(nb.id); 
                      }} 
                      className="p-1 rounded-sm bg-white shadow-sm hover:text-red-500 border border-gray-100"
                      title="Excluir"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Dicas */}
          <div className="p-3 pl-14 border-t border-[#d8d4c0] z-10" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)', backgroundSize: '100% 32px', backgroundPosition: '0 16px' }}>
            <button 
              onClick={() => setShowTips(true)}
              className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 w-full justify-start transition-colors"
            >
              <FiHelpCircle className="w-3.5 h-3.5" /> Dicas de Markdown
            </button>
          </div>
        </div>

        {/* Editor Area Centered */}
        <div className="flex-1 flex justify-center items-stretch px-4">
          {/* O Papel (Proporção Exata 480x800 - Em Pé) */}
          <div 
            className="bg-[#fdfaf1] rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
          style={{ 
            height: '100%',
            maxHeight: '800px',
            maxWidth: '100%',
            aspectRatio: '480 / 800',
            flexShrink: 0
          }}
        >
            
            <header className="bg-[#f0ebda] border-b border-[#e2dfd5] text-gray-700 p-3 sm:p-4 flex flex-wrap gap-2 justify-between items-center z-10 flex-shrink-0">
              <div className="group">
                <div className="flex items-center gap-2">
                  {isRenaming ? (
                    <input 
                      autoFocus
                      className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 bg-white/50 border-b border-blue-400 outline-none w-32 sm:w-48 px-1 rounded-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={renameNotebook}
                      onKeyDown={(e) => e.key === 'Enter' && renameNotebook()}
                    />
                  ) : (
                    <>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 truncate max-w-[12rem] sm:max-w-[16rem]">{notebook?.name || 'Carregando...'}</h1>
                      <button onClick={() => { setEditName(notebook?.name || ''); setIsRenaming(true); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#e2dfd5] rounded text-gray-500 transition-opacity">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={notebook?.style.paperType || 'lined'}
                  onChange={(e) => updatePaperStyle(e.target.value)}
                  className="bg-white border border-[#d8d4c0] text-xs sm:text-sm text-gray-700 rounded-md px-2 py-1 outline-none shadow-sm cursor-pointer"
                >
                  <option value="lined">Linhas</option>
                  <option value="grid">Quadriculado</option>
                  <option value="dotted">Pontilhado</option>
                  <option value="blank">Em branco</option>
                </select>

                {isEditing && (
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
                    Editando
                  </span>
                )}
              </div>
            </header>

            <div 
              className="flex-1 overflow-y-auto relative cursor-text transition-colors duration-300"
              onClick={() => !isEditing && setIsEditing(true)}
              style={getBackgroundStyle(notebook?.style.paperType || 'lined')}
            >
              {notebook?.style.paperType === 'lined' && (
                <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-red-300 z-0"></div>
              )}

              <div className={`relative z-10 ${notebook?.style.paperType === 'lined' ? 'pl-10 pr-4 sm:pl-12 sm:pr-6' : 'px-6 sm:px-8'} py-6 min-h-full`}>
                {loading ? (
                  <p className="text-gray-400 italic">Carregando conteúdo...</p>
                ) : isEditing ? (
                  <textarea
                    ref={textareaRef}
                    value={markdownText}
                    onChange={(e) => setMarkdownText(e.target.value)}
                    onBlur={handleSave}
                    className="w-full h-full min-h-[400px] bg-transparent resize-none outline-none font-mono text-gray-800 leading-[2rem] whitespace-pre-wrap text-sm sm:text-base"
                    spellCheck="false"
                  />
                ) : (
                  <div className="min-h-[400px]">
                    {(!notebook?.items || notebook.items.length === 0) && !markdownText ? (
                      <p className="text-gray-400 italic">Página em branco. Clique para digitar.</p>
                    ) : (
                      <div className="space-y-[0rem] text-gray-800 text-sm sm:text-base leading-[2rem] font-mono">
                        {(notebook?.items || []).map((item, index) => (
                          <div key={item.id} className={`flex items-start ${item.isTask ? '' : 'min-h-[2rem]'}`}>
                            {item.isTask && (
                            <div className="mr-2 mt-[6px] h-5 w-5 flex-shrink-0">
                              <input 
                                type="checkbox" 
                                checked={item.done}
                                onChange={(e) => handleCheckboxClick(e as any, index, item.done)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-full accent-blue-500 cursor-pointer"
                              />
                            </div>
                          )}
                            <div className={`flex-1 ${item.done ? 'line-through text-gray-400' : ''}`}>
                            <div className="markdown-body break-words">
                              <ReactMarkdown>
                                {item.text || " "}
                              </ReactMarkdown>
                            </div>
                          </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Espaçador invisível para manter o bloco 100% centralizado (mesmo tamanho da sidebar + margin) */}
        <div className="w-64 ml-8 xl:ml-20 flex-shrink-0 hidden sm:block pointer-events-none"></div>
      </div>

      {/* Markdown Tips Modal */}
      {showTips && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowTips(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Dicas de Markdown</h3>
              <button onClick={() => setShowTips(false)} className="text-gray-400 hover:text-gray-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600">
              <p>O Caderno Inteligente suporta marcação padrão, além de converter quadradinhos automaticamente!</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-100 p-2 rounded font-mono">- [ ] Tarefa</div>
                <div className="flex items-center">Cria uma caixa vazia</div>
                
                <div className="bg-gray-100 p-2 rounded font-mono">- [x] Pronta</div>
                <div className="flex items-center">Cria uma caixa marcada</div>
                
                <div className="bg-gray-100 p-2 rounded font-mono"># Título</div>
                <div className="flex items-center font-bold text-lg">Título Grande</div>
                
                <div className="bg-gray-100 p-2 rounded font-mono">**Negrito**</div>
                <div className="flex items-center font-bold">Texto em Negrito</div>
                
                <div className="bg-gray-100 p-2 rounded font-mono">_Itálico_</div>
                <div className="flex items-center italic">Texto em Itálico</div>
              </div>

              <p className="text-xs text-gray-400 mt-4 italic">
                *Dica: Quando desenhar no aparelho físico, faça um "quadradinho" para tarefas e apenas escreva normal para textos comuns.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
