import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface LookupItem {
  id: string;
  label: string;
  subtitle?: string;
}

interface AsyncComboboxProps {
  placeholder: string;
  table: string;
  searchFields: string[];
  selectFields: string;
  labelField: string;
  subtitleField?: string;
  value: string;
  onChange: (item: LookupItem | null) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function AsyncCombobox({
  placeholder,
  table,
  searchFields,
  selectFields,
  labelField,
  subtitleField,
  value,
  onChange,
  icon,
  disabled
}: AsyncComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value && selectedLabel) setSelectedLabel('');
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const conditions = searchFields.map(f => `${f}.ilike.*${query}*`);
        const { data } = await supabase
          .from(table)
          .select(selectFields)
          .or(conditions.join(','))
          .limit(10);
        if (data) {
          setResults(data.map((item: any) => ({
            id: item.id,
            label: item[labelField] || '',
            subtitle: subtitleField ? item[subtitleField] : undefined,
          })));
          setOpen(true);
        }
      } catch (err) {
        console.error('AsyncCombobox error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {icon || <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          type="text"
          placeholder={placeholder}
          value={query || selectedLabel}
          onChange={e => { setQuery(e.target.value); if (selectedLabel) { setSelectedLabel(''); onChange(null); } }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          disabled={disabled}
          className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-10 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-40"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedLabel(item.label);
                setQuery('');
                setOpen(false);
                onChange(item);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
            >
              <span className="font-medium">{item.label}</span>
              {item.subtitle && <span className="text-slate-400 ml-2 text-xs">{item.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}