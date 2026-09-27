import React, { useState } from 'react';
import { Send, Paperclip, AtSign, FileText, User as UserIcon } from 'lucide-react';
import { LocalComment, LocalAttachment } from '../database/schema';

interface CommentSectionProps {
  taskId: string;
  comments: LocalComment[];
  attachments: LocalAttachment[];
  availableMembers: Array<{ id: string; name: string }>;
  onSendComment: (content: string) => void;
  onUploadAttachment: (file: File) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  taskId,
  comments,
  attachments,
  availableMembers,
  onSendComment,
  onUploadAttachment
}) => {
  const [inputText, setInputText] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    const lastWord = text.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentionPopup(true);
      setMentionFilter(lastWord.substring(1).toLowerCase());
    } else {
      setShowMentionPopup(false);
    }
  };

  const handleSelectMention = (memberName: string) => {
    const words = inputText.split(/\s+/);
    words.pop(); // remove o '@parcial'
    words.push(`@${memberName} `);
    setInputText(words.join(' '));
    setShowMentionPopup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendComment(inputText.trim());
    setInputText('');
    setShowMentionPopup(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAttachment(file);
    }
  };

  const filteredMembers = availableMembers.filter(m =>
    m.name.toLowerCase().includes(mentionFilter)
  );

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Comunicação & Anexos ({comments.length})</h4>

      {/* Lista de Anexos via MinIO */}
      {attachments.length > 0 && (
        <div style={styles.attachmentsList}>
          {attachments.map(att => (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              style={styles.attachmentItem}
            >
              <FileText size={16} color="#2563EB" />
              <span style={styles.attachmentName}>{att.fileName}</span>
              <span style={styles.attachmentSize}>({Math.round(att.fileSize / 1024)} KB)</span>
            </a>
          ))}
        </div>
      )}

      {/* Feed de Comentários */}
      <div style={styles.chatFeed}>
        {comments.length === 0 ? (
          <p style={styles.emptyFeed}>Nenhum comentário nesta tarefa. Mencione um colega com @ para notificá-lo.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} style={styles.commentCard}>
              <div style={styles.avatar}>
                <UserIcon size={14} color="#475569" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.commentHeader}>
                  <strong style={styles.authorName}>{c.authorName || 'Membro'}</strong>
                  <span style={styles.time}>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={styles.content}>
                  {c.content.split(/(@[a-zA-Z0-9_.-]+)/g).map((part, idx) => {
                    if (part.startsWith('@')) {
                      return <span key={idx} style={styles.mentionBadge}>{part}</span>;
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Autocomplete de Menção @ */}
      {showMentionPopup && (
        <div style={styles.mentionDropdown}>
          <div style={styles.mentionHeader}>Mencionar membro da equipe:</div>
          {filteredMembers.map(m => (
            <button
              key={m.id}
              onClick={() => handleSelectMention(m.name)}
              style={styles.mentionItem}
            >
              <AtSign size={13} color="#2563EB" />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Caixa de Entrada */}
      <form onSubmit={handleSubmit} style={styles.inputContainer}>
        <label style={styles.attachBtn} title="Anexar arquivo via MinIO">
          <Paperclip size={18} color="#64748B" />
          <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
        <input
          type="text"
          placeholder="Escreva um comentário ou mencione @nome..."
          value={inputText}
          onChange={handleInputChange}
          style={styles.input}
        />
        <button type="submit" style={styles.sendBtn} title="Enviar">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E2E8F0',
    marginTop: 16,
    position: 'relative'
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: 14,
    fontWeight: 600,
    color: '#334155'
  },
  attachmentsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    color: '#1E40AF',
    textDecoration: 'none'
  },
  attachmentName: {
    fontWeight: 500
  },
  attachmentSize: {
    color: '#6B7280',
    fontSize: 11
  },
  chatFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 250,
    overflowY: 'auto',
    marginBottom: 12
  },
  emptyFeed: {
    fontSize: 13,
    color: '#94A3B8',
    margin: '8px 0'
  },
  commentCard: {
    display: 'flex',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #E2E8F0'
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: '#E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  authorName: {
    fontSize: 13,
    color: '#1E293B'
  },
  time: {
    fontSize: 11,
    color: '#94A3B8'
  },
  content: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 1.4
  },
  mentionBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 600
  },
  mentionDropdown: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    padding: 6
  },
  mentionHeader: {
    fontSize: 11,
    color: '#64748B',
    padding: '4px 8px',
    fontWeight: 600
  },
  mentionItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: 6,
    textAlign: 'left',
    fontSize: 13,
    color: '#1E293B'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: '6px 10px',
    border: '1px solid #CBD5E1'
  },
  attachBtn: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 13,
    color: '#1E293B'
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  }
};
